#!/usr/bin/env node

/**
 * OpenClaw-BBS Web 服务器
 * 
 * 提供 Web GUI 界面和 REST API
 * 使用国内可访问的 CDN 资源
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置
const CONFIG = {
  port: process.env.BBS_WEB_PORT || 3000,
  host: process.env.BBS_WEB_HOST || '0.0.0.0',
  webDir: path.join(__dirname),
  dataDir: path.join(__dirname, '..', 'data'),
  configDir: path.join(__dirname, '..', 'config')
};

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// 内存数据存储（实际应使用数据库）
let posts = [];
let users = {};
let boards = {};

// 加载数据
function loadData() {
  try {
    const postsFile = path.join(CONFIG.dataDir, 'posts', 'posts.json');
    if (fs.existsSync(postsFile)) {
      const data = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
      posts = data.posts || [];
    }
  } catch (error) {
    console.error('加载帖子数据失败:', error.message);
  }

  try {
    const boardsFile = path.join(CONFIG.configDir, 'boards.json');
    if (fs.existsSync(boardsFile)) {
      boards = JSON.parse(fs.readFileSync(boardsFile, 'utf8'));
    }
  } catch (error) {
    console.error('加载版块配置失败:', error.message);
  }
}

// 保存数据
function saveData() {
  try {
    const postsFile = path.join(CONFIG.dataDir, 'posts', 'posts.json');
    fs.writeFileSync(postsFile, JSON.stringify({ posts, schema: 'v1' }, null, 2));
  } catch (error) {
    console.error('保存帖子数据失败:', error.message);
  }
}

// 静态文件服务
function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 - 文件未找到</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>500 - 服务器错误</h1><p>${err.message}</p>`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// API 路由处理
function handleApi(req, res, parsedUrl) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const pathname = parsedUrl.pathname;

  // GET /api/boards - 获取版块列表
  if (pathname === '/api/boards' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify(boards, null, 2));
    return;
  }

  // GET /api/posts - 获取帖子列表
  if (pathname === '/api/posts' && req.method === 'GET') {
    const query = parsedUrl.query || '';
    const params = new URLSearchParams(query);
    const boardId = params.get('board');
    const limit = parseInt(params.get('limit')) || 20;

    let filteredPosts = posts;
    if (boardId) {
      filteredPosts = posts.filter(p => p.boardId === boardId);
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: filteredPosts.slice(0, limit),
      total: filteredPosts.length
    }, null, 2));
    return;
  }

  // GET /api/posts/:id - 获取单个帖子
  const postMatch = pathname.match(/^\/api\/posts\/([^\/]+)$/);
  if (postMatch && req.method === 'GET') {
    const postId = postMatch[1];
    const post = posts.find(p => p.id === postId);

    if (post) {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: post }, null, 2));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: '帖子未找到' }));
    }
    return;
  }

  // POST /api/posts - 创建新帖子
  if (pathname === '/api/posts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // 验证必填字段
        if (!data.title || !data.content || !data.boardId) {
          res.writeHead(400);
          res.end(JSON.stringify({ 
            success: false, 
            error: '缺少必填字段：title, content, boardId' 
          }));
          return;
        }

        // 创建帖子
        const newPost = {
          id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          boardId: data.boardId,
          authorId: data.authorId || 'anonymous',
          authorName: data.authorName || '匿名用户',
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          replyCount: 0,
          likeCount: 0,
          status: 'pending' // pending | visible | hidden | deleted
        };

        posts.unshift(newPost);
        saveData();

        console.log(`[API] 新帖子创建：${newPost.id} - ${newPost.title}`);

        res.writeHead(201);
        res.end(JSON.stringify({ 
          success: true, 
          data: newPost,
          message: '帖子已创建，正在审核中...'
        }, null, 2));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ 
          success: false, 
          error: `解析失败：${error.message}` 
        }));
      }
    });
    return;
  }

  // GET /api/stats - 获取统计数据
  if (pathname === '/api/stats' && req.method === 'GET') {
    const today = new Date().toDateString();
    const todayPosts = posts.filter(p => 
      new Date(p.createdAt).toDateString() === today
    ).length;

    // 统计回复数
    let totalReplies = 0;
    posts.forEach(p => {
      totalReplies += (p.replies || []).length;
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        users: Object.keys(users).length,
        posts: posts.length,
        todayPosts,
        online: Math.floor(Math.random() * 50) + 10,
        replies: totalReplies
      }
    }, null, 2));
    return;
  }

  // POST /api/posts/:id/reply - 添加回复
  const replyMatch = pathname.match(/^\/api\/posts\/([^\/]+)\/reply$/);
  if (replyMatch && req.method === 'POST') {
    const postId = replyMatch[1];
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: '帖子不存在' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);

        if (!data.content || data.content.trim().length < 2) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: '回复内容至少2个字符' }));
          return;
        }

        const reply = {
          id: `reply_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          postId: postId,
          authorId: data.authorId || 'anonymous',
          authorName: data.authorName || '匿名用户',
          content: data.content.trim(),
          createdAt: new Date().toISOString(),
          likeCount: 0
        };

        // 初始化 replies 数组
        if (!posts[postIndex].replies) {
          posts[postIndex].replies = [];
        }

        posts[postIndex].replies.push(reply);
        posts[postIndex].replyCount = posts[postIndex].replies.length;
        saveData();

        console.log(`[API] 新回复：${reply.id} -> 帖子 ${postId}`);

        res.writeHead(201);
        res.end(JSON.stringify({
          success: true,
          data: reply,
          message: '回复成功！'
        }, null, 2));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: `解析失败：${error.message}`
        }));
      }
    });
    return;
  }

  // GET /api/posts/:id/replies - 获取帖子回复列表
  const repliesMatch = pathname.match(/^\/api\/posts\/([^\/]+)\/replies$/);
  if (repliesMatch && req.method === 'GET') {
    const postId = repliesMatch[1];
    const post = posts.find(p => p.id === postId);

    if (!post) {
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: '帖子不存在' }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: post.replies || []
    }, null, 2));
    return;
  }

  // POST /api/users - 创建/登录用户
  if (pathname === '/api/users' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        if (!data.username) {
          res.writeHead(400);
          res.end(JSON.stringify({ 
            success: false, 
            error: '缺少用户名' 
          }));
          return;
        }

        const userId = `user_${Date.now()}`;
        const user = {
          id: userId,
          username: data.username,
          reputation: 0,
          level: 'newcomer',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };

        users[userId] = user;

        res.writeHead(201);
        res.end(JSON.stringify({ 
          success: true, 
          data: user 
        }, null, 2));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message 
        }));
      }
    });
    return;
  }

  // GET /api/search - 搜索帖子
  if (pathname === '/api/search' && req.method === 'GET') {
    const query = parsedUrl.query || '';
    const params = new URLSearchParams(query);
    const keyword = params.get('q') || params.get('keyword') || '';

    if (keyword.length < 2) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: '搜索关键词至少2个字符' }));
      return;
    }

    const results = handleSearch(keyword);

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: results,
      total: results.length,
      keyword: keyword
    }, null, 2));
    return;
  }

  // POST /api/upload - 图片上传（Base64）
  if (pathname === '/api/upload' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);

        if (!data.image) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: '缺少图片数据' }));
          return;
        }

        // 验证图片格式
        const base64Data = data.image;
        const mimeMatch = base64Data.match(/^data:(image\/\w+);base64,/);

        if (!mimeMatch) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: '无效的图片格式' }));
          return;
        }

        const mimeType = mimeMatch[1];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedTypes.includes(mimeType)) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: '不支持的图片格式，仅支持 JPEG, PNG, GIF, WebP' }));
          return;
        }

        // 检查图片大小（限制 2MB）
        const sizeInBytes = (base64Data.length * 3) / 4;
        if (sizeInBytes > 2 * 1024 * 1024) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: '图片大小不能超过 2MB' }));
          return;
        }

        // 生成唯一文件名
        const ext = mimeType.split('/')[1];
        const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        // 保存图片（这里保存到 data/uploads 目录）
        const uploadDir = path.join(CONFIG.dataDir, 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // 移除 data:image/xxx;base64, 前缀并保存
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);

        const imageUrl = `/data/uploads/${filename}`;

        console.log(`[API] 图片上传成功：${filename}`);

        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          data: {
            url: imageUrl,
            filename: filename,
            size: buffer.length
          },
          message: '图片上传成功'
        }, null, 2));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({
          success: false,
          error: `上传失败：${error.message}`
        }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, error: 'API 未找到' }));
}

// ==================== 搜索功能 ====================
function handleSearch(query) {
  const q = query.toLowerCase();
  const results = posts.filter(post => {
    return (
      post.title && post.title.toLowerCase().includes(q) ||
      post.content && post.content.toLowerCase().includes(q) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(q)))
    );
  });
  return results;
}

// 主请求处理
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`[Web] ${req.method} ${pathname}`);

  // API 路由
  if (pathname.startsWith('/api/')) {
    handleApi(req, res, parsedUrl);
    return;
  }

  // 静态文件路由 - 上传的图片
  if (pathname.startsWith('/data/uploads/')) {
    const uploadPath = path.join(CONFIG.dataDir, 'uploads', pathname.replace('/data/uploads/', ''));
    const uploadDirResolved = path.resolve(path.join(CONFIG.dataDir, 'uploads'));
    const uploadFileResolved = path.resolve(uploadPath);
    
    if (!uploadFileResolved.startsWith(uploadDirResolved)) {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>403 - 禁止访问</h1>');
      return;
    }
    
    serveStaticFile(res, uploadPath);
    return;
  }

  // 其他静态文件
  let filePath = path.join(CONFIG.webDir, pathname === '/' ? 'index.html' : pathname);
  
  // 安全检查：防止目录遍历攻击
  const webDirResolved = path.resolve(CONFIG.webDir);
  const filePathResolved = path.resolve(filePath);
  
  if (!filePathResolved.startsWith(webDirResolved)) {
    res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>403 - 禁止访问</h1>');
    return;
  }

  serveStaticFile(res, filePath);
});

// 启动服务器
function startServer() {
  loadData();

  server.listen(CONFIG.port, CONFIG.host, () => {
    console.log('');
    console.log('🦞 OpenClaw-BBS Web 服务器启动成功!');
    console.log('='.repeat(50));
    console.log(`📍 本地访问：http://localhost:${CONFIG.port}`);
    console.log(`📍 局域网访问：http://${getLocalIP()}:${CONFIG.port}`);
    console.log('');
    console.log('API 端点:');
    console.log('  GET  /api/boards    - 获取版块列表');
    console.log('  GET  /api/posts     - 获取帖子列表');
    console.log('  GET  /api/posts/:id - 获取单个帖子');
    console.log('  POST /api/posts     - 创建新帖子');
    console.log('  GET  /api/stats     - 获取统计数据');
    console.log('  POST /api/users     - 创建/登录用户');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
    console.log('='.repeat(50));
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ 端口 ${CONFIG.port} 已被占用，请尝试其他端口`);
      console.error('   使用：set BBS_WEB_PORT=3001');
    } else {
      console.error('❌ 服务器错误:', error.message);
    }
    process.exit(1);
  });
}

// 获取本地 IP 地址
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n\n正在关闭服务器...');
  saveData();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 启动
startServer();

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

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      data: {
        users: Object.keys(users).length,
        posts: posts.length,
        todayPosts,
        online: Math.floor(Math.random() * 50) + 10 // 模拟在线人数
      }
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

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ success: false, error: 'API 未找到' }));
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

  // 静态文件路由
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

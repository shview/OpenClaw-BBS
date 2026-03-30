#!/usr/bin/env node

/**
 * OpenClaw-BBS 主入口
 * 
 * 这个文件是 BBS 系统的核心，负责:
 * - 加载配置
 * - 初始化 OpenClaw 集成
 * - 注册消息处理器
 * - 启动定时任务
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  dataDir: process.env.BBS_DATA_DIR || './data',
  configDir: process.env.BBS_CONFIG_DIR || './config',
  memoryDir: process.env.BBS_MEMORY_DIR || './memory',
  logDir: process.env.BBS_LOG_DIR || './logs'
};

// 日志工具
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  console.log(`${prefix} ${message}`);
  
  // 写入日志文件
  const logFile = path.join(CONFIG.logDir, 'bbs.log');
  fs.appendFileSync(logFile, `${prefix} ${message}\n`);
}

// 加载配置
function loadConfig(name) {
  const configPath = path.join(CONFIG.configDir, `${name}.json`);
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`无法加载配置 ${name}: ${error.message}`, 'error');
    return null;
  }
}

// 数据存储
class DataStore {
  constructor() {
    this.posts = [];
    this.users = {};
    this.boards = {};
  }
  
  load() {
    try {
      const postsFile = path.join(CONFIG.dataDir, 'posts/posts.json');
      const usersFile = path.join(CONFIG.dataDir, 'users/users.json');
      
      if (fs.existsSync(postsFile)) {
        this.posts = JSON.parse(fs.readFileSync(postsFile, 'utf8')).posts || [];
      }
      
      if (fs.existsSync(usersFile)) {
        this.users = JSON.parse(fs.readFileSync(usersFile, 'utf8')).users || {};
      }
      
      log('数据加载完成');
    } catch (error) {
      log(`数据加载失败：${error.message}`, 'error');
    }
  }
  
  save() {
    try {
      const postsFile = path.join(CONFIG.dataDir, 'posts/posts.json');
      const usersFile = path.join(CONFIG.dataDir, 'users/users.json');
      
      fs.writeFileSync(postsFile, JSON.stringify({ posts: this.posts, schema: 'v1' }, null, 2));
      fs.writeFileSync(usersFile, JSON.stringify({ users: this.users, schema: 'v1' }, null, 2));
      
      log('数据保存完成');
    } catch (error) {
      log(`数据保存失败：${error.message}`, 'error');
    }
  }
  
  // 用户相关
  getUser(channelId) {
    return this.users[channelId] || null;
  }
  
  createUser(channelId, username) {
    const user = {
      id: channelId,
      username: username || `user_${channelId.slice(0, 8)}`,
      reputation: 0,
      level: 'newcomer',
      joinedAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      postCount: 0,
      replyCount: 0
    };
    
    this.users[channelId] = user;
    this.save();
    return user;
  }
  
  updateUserReputation(channelId, delta) {
    const user = this.users[channelId];
    if (user) {
      user.reputation += delta;
      user.level = this.calculateLevel(user.reputation);
      this.save();
    }
  }
  
  calculateLevel(reputation) {
    if (reputation >= 1000) return 'moderator';
    if (reputation >= 500) return 'trusted';
    if (reputation >= 100) return 'active';
    if (reputation >= 20) return 'regular';
    return 'newcomer';
  }
  
  // 帖子相关
  createPost(post) {
    post.id = `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    post.createdAt = new Date().toISOString();
    post.status = 'pending';  // pending | visible | hidden | deleted
    this.posts.push(post);
    this.save();
    return post;
  }
  
  getPost(postId) {
    return this.posts.find(p => p.id === postId);
  }
  
  updatePostStatus(postId, status) {
    const post = this.getPost(postId);
    if (post) {
      post.status = status;
      post.updatedAt = new Date().toISOString();
      this.save();
    }
  }
}

// 消息处理器
class MessageHandler {
  constructor(dataStore, config) {
    this.dataStore = dataStore;
    this.config = config;
    this.agents = config?.agents || {};
  }
  
  async handleMessage(message, context) {
    log(`收到消息：${message.slice(0, 50)}...`);
    
    // 1. 识别意图
    const intent = await this.classifyIntent(message, context);
    log(`意图识别：${intent.intent} (置信度：${intent.confidence})`);
    
    // 2. 根据意图路由
    switch (intent.intent) {
      case 'post':
        return this.handleNewPost(intent, context);
      case 'reply':
        return this.handleReply(intent, context);
      case 'query':
        return this.handleQuery(intent, context);
      case 'help':
        return this.handleHelp(context);
      case 'report':
        return this.handleReport(intent, context);
      default:
        return this.handleChat(message, context);
    }
  }
  
  async classifyIntent(message, context) {
    // 简单的关键词匹配（实际应调用 AI 代理）
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('发帖') || lowerMsg.includes('发布')) {
      return { intent: 'post', confidence: 0.8, extractedData: {} };
    }
    if (lowerMsg.includes('回复') || lowerMsg.includes('回')) {
      return { intent: 'reply', confidence: 0.7, extractedData: {} };
    }
    if (lowerMsg.includes('怎么') || lowerMsg.includes('如何') || lowerMsg.includes('?') || lowerMsg.includes('？')) {
      return { intent: 'query', confidence: 0.6, extractedData: {} };
    }
    if (lowerMsg.includes('帮助') || lowerMsg.includes('help')) {
      return { intent: 'help', confidence: 0.9, extractedData: {} };
    }
    if (lowerMsg.includes('举报') || lowerMsg.includes('投诉')) {
      return { intent: 'report', confidence: 0.8, extractedData: {} };
    }
    
    return { intent: 'chat', confidence: 0.5, extractedData: {} };
  }
  
  async handleNewPost(intent, context) {
    const { channelId, content, boardId } = context;
    
    // 获取或创建用户
    let user = this.dataStore.getUser(channelId);
    if (!user) {
      user = this.dataStore.createUser(channelId);
    }
    
    // 创建帖子
    const post = this.dataStore.createPost({
      authorId: channelId,
      boardId: boardId || 'general',
      title: content.slice(0, 50),
      content: content,
      tags: []
    });
    
    // 更新用户统计
    user.postCount++;
    this.dataStore.updateUserReputation(channelId, 2);
    
    return {
      type: 'success',
      message: `帖子已创建！ID: ${post.id}\n状态：待审核`,
      data: { postId: post.id }
    };
  }
  
  async handleReply(intent, context) {
    return {
      type: 'info',
      message: '回复功能开发中...'
    };
  }
  
  async handleQuery(intent, context) {
    return {
      type: 'info',
      message: '查询功能开发中...'
    };
  }
  
  async handleHelp(context) {
    return {
      type: 'info',
      message: `🦞 OpenClaw-BBS 帮助

可用命令:
  发帖 [版块] [内容] - 发布新帖子
  回复 [帖子 ID] [内容] - 回复帖子
  搜索 [关键词] - 搜索内容
  版块 - 查看版块列表
  帮助 - 显示此帮助

当前版本：v0.1.0`
    };
  }
  
  async handleReport(intent, context) {
    return {
      type: 'info',
      message: '举报功能开发中...'
    };
  }
  
  async handleChat(message, context) {
    return {
      type: 'chat',
      message: '收到你的消息了！想发帖还是闲聊？输入"帮助"查看可用命令~'
    };
  }
}

// 主函数
async function main() {
  log('🦞 OpenClaw-BBS 启动中...', 'info');
  
  // 加载配置
  const boardsConfig = loadConfig('boards');
  const agentsConfig = loadConfig('agents');
  const rulesConfig = loadConfig('rules');
  
  if (!boardsConfig || !agentsConfig || !rulesConfig) {
    log('配置加载失败，请检查配置文件', 'error');
    process.exit(1);
  }
  
  log('配置加载完成', 'info');
  
  // 初始化数据存储
  const dataStore = new DataStore();
  dataStore.load();
  
  // 初始化消息处理器
  const handler = new MessageHandler(dataStore, agentsConfig);
  
  // 注册 OpenClaw 消息处理器（伪代码，实际需集成 OpenClaw API）
  log('注册 OpenClaw 消息处理器...', 'info');
  
  // 这里应该调用 OpenClaw 的 API 注册消息回调
  // 示例：
  // openclaw.onMessage(async (message, context) => {
  //   const response = await handler.handleMessage(message, context);
  //   return response.message;
  // });
  
  log('✅ OpenClaw-BBS 启动完成!', 'green');
  log('等待消息中...', 'info');
  
  // 保持进程运行
  // 实际应用中应该由 OpenClaw 管理生命周期
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`未捕获异常：${error.message}`, 'error');
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`未处理的 Promise 拒绝：${reason}`, 'error');
});

// 启动
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DataStore, MessageHandler, CONFIG };

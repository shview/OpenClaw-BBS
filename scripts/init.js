#!/usr/bin/env node

/**
 * OpenClaw-BBS 初始化脚本
 * 
 * 功能:
 * - 创建必要的目录结构
 * - 初始化数据文件
 * - 验证配置
 * - 注册 OpenClaw 技能
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`✓ 创建目录：${dirPath}`, 'green');
    return true;
  }
  log(`○ 目录已存在：${dirPath}`, 'blue');
  return false;
}

function createFile(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    log(`✓ 创建文件：${filePath}`, 'green');
    return true;
  }
  log(`○ 文件已存在：${filePath}`, 'blue');
  return false;
}

function validateConfig() {
  log('\n📋 验证配置文件...', 'yellow');
  
  const configFiles = [
    'config/boards.json',
    'config/agents.json',
    'config/rules.json'
  ];
  
  let valid = true;
  
  for (const file of configFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      JSON.parse(content);
      log(`✓ ${file} - 有效`, 'green');
    } catch (error) {
      log(`✗ ${file} - 无效：${error.message}`, 'red');
      valid = false;
    }
  }
  
  return valid;
}

function initDataFiles() {
  log('\n📊 初始化数据文件...', 'yellow');
  
  const dataFiles = {
    'data/posts/posts.json': JSON.stringify({ posts: [], schema: 'v1' }, null, 2),
    'data/users/users.json': JSON.stringify({ users: [], schema: 'v1' }, null, 2),
    'data/logs/audit.log': '',
    'memory/daily-reports/.gitkeep': ''
  };
  
  for (const [file, content] of Object.entries(dataFiles)) {
    createFile(file, content);
  }
}

function checkOpenClaw() {
  log('\n🦞 检查 OpenClaw 安装...', 'yellow');
  
  try {
    const { execSync } = require('child_process');
    const version = execSync('openclaw --version', { encoding: 'utf8' }).trim();
    log(`✓ OpenClaw 已安装：v${version}`, 'green');
    return true;
  } catch (error) {
    log('✗ OpenClaw 未安装', 'red');
    log('  请运行：npm install -g openclaw@latest', 'yellow');
    return false;
  }
}

function showNextSteps() {
  log('\n' + '='.repeat(50), 'blue');
  log('🎉 初始化完成！', 'green');
  log('='.repeat(50), 'blue');
  log('\n下一步:', 'yellow');
  log('1. 配置 OpenClaw: openclaw onboard', 'blue');
  log('2. 配置消息渠道: openclaw channel telegram', 'blue');
  log('3. 启动服务：npm start', 'blue');
  log('4. 访问控制面板：openclaw dashboard', 'blue');
  log('\n文档:', 'yellow');
  log('- README.md - 项目概述', 'blue');
  log('- docs/architecture.md - 架构设计', 'blue');
  log('- docs/deployment.md - 部署指南', 'blue');
  log('\n遇到问题？查看 docs/deployment.md 故障排除部分', 'yellow');
}

function main() {
  log('\n🦞 OpenClaw-BBS 初始化脚本', 'green');
  log('='.repeat(50), 'blue');
  
  // 创建目录结构
  log('\n📁 创建目录结构...', 'yellow');
  const dirs = [
    'data/posts',
    'data/users',
    'data/logs',
    'memory/daily-reports',
    'logs',
    'backups'
  ];
  
  for (const dir of dirs) {
    createDir(dir);
  }
  
  // 初始化数据文件
  initDataFiles();
  
  // 验证配置
  const configValid = validateConfig();
  
  // 检查 OpenClaw
  const openclawInstalled = checkOpenClaw();
  
  // 显示下一步
  showNextSteps();
  
  // 创建初始化标记
  createFile('.initialized', `Initialized at: ${new Date().toISOString()}\n`);
  
  process.exit(configValid && openclawInstalled ? 0 : 1);
}

main();

# OpenClaw-BBS 部署指南

## 前置要求

### 系统要求
- **操作系统**: Windows 10/11, macOS 12+, Linux (Ubuntu 20.04+)
- **Node.js**: 24+ (推荐) 或 22.16+
- **内存**: 最低 2GB，推荐 4GB+
- **存储**: 最低 1GB，根据数据量增加
- **网络**: 稳定的互联网连接（用于 AI API 和消息渠道）

### 账号要求
- **OpenClaw**: 已安装并配置
- **AI 提供商**: 阿里云百炼 / 其他 LLM API key
- **消息渠道**: 至少一个（Telegram / WhatsApp / Discord）

## 快速部署

### 步骤 1: 克隆项目

```bash
cd E:\openclaw\.openclaw\workspace
git clone https://github.com/shview/OpenClaw-BBS.git
cd OpenClaw-BBS
```

### 步骤 2: 安装 OpenClaw（如未安装）

```bash
npm install -g openclaw@latest
```

### 步骤 3: 配置 OpenClaw

```bash
# 运行 OpenClaw 配置向导
openclaw onboard

# 或使用配置文件
# 编辑 ~/.openclaw/openclaw.json
```

### 步骤 4: 配置 BBS

```bash
# 复制配置模板
cp config/boards.json.example config/boards.json
cp config/agents.json.example config/agents.json
cp config/rules.json.example config/rules.json

# 编辑配置
# - config/boards.json: 版块配置
# - config/agents.json: AI 代理配置
# - config/rules.json: 审核规则
```

### 步骤 5: 配置消息渠道

#### Telegram Bot（推荐）

1. 联系 [@BotFather](https://t.me/BotFather) 创建 Bot
2. 获取 Bot Token
3. 在 OpenClaw 配置中添加：

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
      allowFrom: ["*"],  // 或指定用户 ID
      groups: {
        "*": { requireMention: false }
      }
    }
  }
}
```

#### WhatsApp

1. 运行 `openclaw channel whatsapp`
2. 扫描二维码配对
3. 配置允许的用户/群组

#### Discord

1. 创建 Discord 应用和 Bot
2. 获取 Bot Token
3. 邀请 Bot 到服务器
4. 配置 OpenClaw

### 步骤 6: 初始化 BBS

```bash
# 运行初始化脚本
npm run init

# 或手动执行
node scripts/init.js
```

### 步骤 7: 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 后台运行（Linux/macOS）
npm start &

# 或使用 PM2
pm2 start npm --name "openclaw-bbs" -- start
```

### 步骤 8: 验证部署

```bash
# 检查 OpenClaw 状态
openclaw status

# 检查 BBS 状态
npm run status

# 访问 Web 控制面板
openclaw dashboard
# 默认 http://127.0.0.1:18789/
```

## 配置详解

### OpenClaw 配置 (`~/.openclaw/openclaw.json`)

```json5
{
  // AI 提供商配置
  providers: {
    bailian: {
      apiKey: "YOUR_ALIYUN_API_KEY",
      models: {
        default: "qwen3.5-plus"
      }
    }
  },
  
  // 渠道配置
  channels: {
    telegram: {
      botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      allowFrom: ["*"],
      groups: {
        "*": { requireMention: false }
      }
    }
  },
  
  // 会话配置
  sessions: {
    default: {
      model: "bailian/qwen3.5-plus",
      thinking: "off",
      memory: {
        enabled: true,
        maxMessages: 50
      }
    }
  },
  
  // BBS 集成
  plugins: {
    bbs: {
      enabled: true,
      dataDir: "./data",
      configDir: "./config"
    }
  }
}
```

### BBS 数据目录结构

```
OpenClaw-BBS/
├── data/
│   ├── posts/           # 帖子数据
│   │   ├── 2026-03/
│   │   │   └── posts.json
│   ├── users/           # 用户数据
│   │   └── users.json
│   ├── boards/          # 版块数据
│   │   └── boards.json
│   └── logs/            # 操作日志
│       └── audit.log
├── memory/
│   ├── bbs-state.json   # BBS 状态
│   └── daily-reports/   # 每日报告
└── config/
    ├── boards.json      # 版块配置
    ├── agents.json      # 代理配置
    └── rules.json       # 规则配置
```

## 生产环境部署

### 使用 Docker（可选）

```dockerfile
# Dockerfile
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 18789

CMD ["npm", "start"]
```

```bash
# 构建镜像
docker build -t openclaw-bbs .

# 运行容器
docker run -d \
  --name openclaw-bbs \
  -p 18789:18789 \
  -v ./data:/app/data \
  -v ./config:/app/config \
  -v ~/.openclaw:/root/.openclaw \
  openclaw-bbs
```

### 使用 systemd（Linux）

```ini
# /etc/systemd/system/openclaw-bbs.service
[Unit]
Description=OpenClaw BBS
After=network.target

[Service]
Type=simple
User=openclaw
WorkingDirectory=/opt/openclaw-bbs
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
sudo systemctl enable openclaw-bbs
sudo systemctl start openclaw-bbs
sudo systemctl status openclaw-bbs
```

### 使用 PM2（跨平台）

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem 配置
pm2 init

# 编辑 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'openclaw-bbs',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    exec_mode: 'fork',
    restart_delay: 4000,
    max_memory_restart: '1G'
  }]
};

# 启动
pm2 start ecosystem.config.js

# 开机自启
pm2 startup
pm2 save
```

## 备份与恢复

### 备份脚本

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p "$BACKUP_DIR"

# 备份数据
cp -r data "$BACKUP_DIR/"
cp -r memory "$BACKUP_DIR/"
cp config/*.json "$BACKUP_DIR/config/"

# 压缩
tar -czf "backups/bbs_backup_$DATE.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup completed: backups/bbs_backup_$DATE.tar.gz"
```

### 定时备份（Cron）

```bash
# 每天凌晨 3 点备份
0 3 * * * /path/to/OpenClaw-BBS/scripts/backup.sh
```

## 监控与日志

### 查看日志

```bash
# OpenClaw 日志
openclaw logs

# BBS 日志
tail -f data/logs/audit.log

# PM2 日志
pm2 logs openclaw-bbs
```

### 健康检查

```bash
# 检查服务状态
curl http://localhost:18789/health

# 检查数据库
npm run db:check

# 检查渠道连接
npm run channels:status
```

## 故障排除

### 常见问题

#### 1. OpenClaw 无法启动

```bash
# 检查 Node 版本
node --version

# 重新安装
npm uninstall -g openclaw
npm install -g openclaw@latest

# 清除缓存
npm cache clean --force
```

#### 2. 渠道连接失败

```bash
# 检查配置
openclaw config get channels

# 重新配对
openclaw channel telegram reconnect
```

#### 3. AI API 错误

```bash
# 检查 API key
openclaw config get providers

# 测试连接
curl -X POST https://api.aliyun.com/... \
  -H "Authorization: Bearer YOUR_KEY"
```

#### 4. 数据库错误

```bash
# 检查权限
ls -la data/

# 修复权限
chmod -R 755 data/
chown -R $USER:$USER data/
```

### 获取帮助

```bash
# OpenClaw 帮助
openclaw help

# BBS 帮助
npm run help

# 查看文档
open docs
```

## 升级指南

```bash
# 备份当前版本
npm run backup

# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 运行迁移
npm run migrate

# 重启服务
pm2 restart openclaw-bbs
# 或
npm restart
```

## 安全建议

1. **定期更新**: 保持 OpenClaw 和依赖最新
2. **API 密钥**: 不要提交到版本控制
3. **访问控制**: 配置 allowFrom 限制用户
4. **数据备份**: 定期备份重要数据
5. **日志审计**: 定期检查审计日志
6. **速率限制**: 防止滥用

---

**文档版本**: v0.1.0
**最后更新**: 2026-03-30

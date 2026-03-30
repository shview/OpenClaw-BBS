# 🦞 OpenClaw-BBS 快速开始指南

> 5 分钟内启动你的 AI 托管 BBS 论坛！

---

## ✅ 前置检查

确保以下已安装：
- [x] Node.js 24+ (运行 `node --version` 检查)
- [x] OpenClaw (运行 `openclaw --version` 检查)
- [x] Git (用于版本控制)

---

## 🚀 5 步启动

### 步骤 1: 配置 OpenClaw (如未配置)

```bash
openclaw onboard
```

按照向导完成：
- AI 提供商配置（推荐阿里云百炼）
- 消息渠道配置（推荐 Telegram）

### 步骤 2: 获取 Telegram Bot Token

1. 在 Telegram 中搜索 `@BotFather`
2. 发送 `/newbot` 创建新 Bot
3. 按提示设置 Bot 名称和用户名
4. 复制得到的 Token（类似：`123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）

### 步骤 3: 配置 BBS

编辑 `~/.openclaw/openclaw.json`，添加 Telegram 配置：

```json5
{
  channels: {
    telegram: {
      botToken: "你的_BOT_TOKEN"
    }
  }
}
```

### 步骤 4: 启动 BBS

```bash
cd E:\openclaw\.openclaw\workspace\OpenClaw-BBS
npm start
```

### 步骤 5: 测试

1. 在 Telegram 中找到你的 Bot
2. 发送 `帮助` 或 `help`
3. 应该收到欢迎消息和可用命令列表

---

## 📱 可用命令

| 命令 | 说明 |
|------|------|
| `帮助` | 显示帮助信息 |
| `发帖 [内容]` | 发布新帖子到综合版 |
| `发帖 [版块] [内容]` | 发布到指定版块 |
| `版块` | 查看版块列表 |
| `搜索 [关键词]` | 搜索帖子 |

---

## 🔧 常用操作

### 查看版块列表
```
版块
```

### 发帖到技术版
```
发帖 tech 今天学习了 Node.js，有人一起交流吗？
```

### 查看 BBS 状态
```bash
npm run status
```

### 查看日志
```bash
type logs\bbs.log
```

---

## ⚙️ 自定义配置

### 修改版块配置
编辑 `config/boards.json`，可以：
- 添加/删除版块
- 修改版块规则
- 调整审核强度

### 修改审核规则
编辑 `config/rules.json`，可以：
- 添加敏感词
- 调整用户等级阈值
- 配置自动操作

### 修改 AI 代理
编辑 `config/agents.json`，可以：
- 更换 AI 模型
- 调整系统提示词
- 配置超时时间

---

## 🐛 遇到问题？

### OpenClaw 未安装
```bash
npm install -g openclaw@latest
```

### Telegram Bot 无响应
1. 检查 Bot Token 是否正确
2. 确认 Bot 已启动（在 BotFather 中检查）
3. 查看 OpenClaw 日志：`openclaw logs`

### 配置错误
```bash
# 验证配置文件
node scripts/init.js
```

### 查看详细文档
- 架构设计：`docs/architecture.md`
- 部署指南：`docs/deployment.md`
- 项目总结：`docs/PROJECT-SUMMARY.md`

---

## 📊 项目结构

```
OpenClaw-BBS/
├── config/           # 配置文件
├── src/              # 源代码
├── scripts/          # 工具脚本
├── docs/             # 文档
├── data/             # 数据文件（自动生成）
├── logs/             # 日志文件（自动生成）
└── memory/           # OpenClaw 记忆
```

---

## 🎯 下一步

1. **邀请用户**: 分享 Bot 链接给朋友
2. **自定义版块**: 根据学校需求调整版块
3. **配置审核**: 添加校内敏感词
4. **监控运行**: 定期检查日志和统计

---

## 📞 获取帮助

- **GitHub Issues**: https://github.com/shview/OpenClaw-BBS/issues
- **OpenClaw 文档**: https://docs.openclaw.ai
- **OpenClaw Discord**: https://discord.com/invite/clawd

---

**祝你使用愉快！🦞**

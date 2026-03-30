# OpenClaw-BBS 🦞📱

> 基于 OpenClaw 的全托管校内 BBS 论坛系统

## 项目愿景

创建一个完全由 OpenClaw AI 代理托管和管理的校内 BBS 论坛系统，实现：
- **全自动管理**：内容审核、用户管理、版块维护全部由 AI 代理完成
- **手机端优先**：通过 WhatsApp/Telegram/微信 等即时通讯工具访问
- **本地部署**：服务器可运行在本地，数据完全可控
- **OpenClaw 核心**：充分利用 OpenClaw 的多渠道、多代理、自动化能力

## 核心特性

### 🤖 AI 全托管
- 自动内容审核（敏感词、垃圾信息检测）
- 智能版块分类和标签
- 自动回复常见问题
- 用户行为分析和预警
- 自动归档和清理旧内容

### 📱 多渠道访问
- WhatsApp 集成
- Telegram Bot
- Discord 服务器
- 微信小程序（可选）
- Web 控制面板

### 🔧 OpenClaw 能力利用
- 多代理路由（不同版块不同 AI 代理）
- 会话管理（用户对话上下文）
- 记忆系统（用户偏好、历史记录）
- 定时任务（定期清理、报告）
- 插件扩展

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      用户层 (Users)                          │
│    WhatsApp  │  Telegram  │  Discord  │  Web UI            │
└────────┬────────────┬─────────────┬────────────┬────────────┘
         │            │             │            │
         └────────────┴──────┬──────┴────────────┘
                             │
                    ┌────────▼────────┐
                    │   OpenClaw      │
                    │    Gateway      │
                    │  (消息路由层)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ 审核代理 │        │ 管理代理 │        │ 回复代理 │
    │Moderator│        │  Admin  │        │ Response│
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────▼────────┐
                    │   数据存储层     │
                    │  (JSON/SQLite)  │
                    │  + 记忆系统      │
                    └─────────────────┘
```

## 项目结构

```
OpenClaw-BBS/
├── docs/                    # 项目文档
│   ├── architecture.md      # 架构设计
│   ├── api.md              # API 文档
│   └── deployment.md       # 部署指南
├── agents/                  # AI 代理配置
│   ├── moderator.agent     # 审核代理
│   ├── admin.agent         # 管理代理
│   └── response.agent      # 回复代理
├── skills/                  # 自定义技能
│   ├── bbs-moderation/     # 内容审核技能
│   ├── bbs-analytics/      # 数据分析技能
│   └── bbs-notification/   # 通知技能
├── config/                  # 配置文件
│   ├── channels.json       # 渠道配置
│   ├── boards.json         # 版块配置
│   └── rules.json          # 规则配置
├── data/                    # 数据存储
│   ├── posts/              # 帖子数据
│   ├── users/              # 用户数据
│   └── logs/               # 操作日志
├── scripts/                 # 工具脚本
│   ├── init.sh             # 初始化脚本
│   ├── backup.sh           # 备份脚本
│   └── migrate.sh          # 迁移脚本
└── memory/                  # OpenClaw 记忆文件
    └── bbs-state.json      # BBS 状态记忆
```

## 快速开始

### 前置要求

- Node.js 24+ (或 22.16+)
- OpenClaw 已安装并配置
- 至少一个消息渠道（推荐 Telegram 或 WhatsApp）

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/shview/OpenClaw-BBS.git
cd OpenClaw-BBS

# 2. 运行初始化
npm run init

# 3. 配置渠道
npm run config:channels

# 4. 启动服务
npm start
```

### 配置示例

```json5
// config/boards.json
{
  boards: [
    {
      id: "general",
      name: "综合讨论",
      description: "校园生活、学习交流",
      moderator: "moderator-general",
      autoArchive: 30  // 30 天后自动归档
    },
    {
      id: "tech",
      name: "技术专区",
      description: "编程、硬件、AI",
      moderator: "moderator-tech",
      tags: ["代码", "求助", "分享"]
    },
    {
      id: "market",
      name: "二手市场",
      description: "闲置物品交易",
      moderator: "moderator-market",
      requireRealName: true
    }
  ]
}
```

## AI 代理职责

### 🛡️ 审核代理 (Moderator Agent)
- 实时扫描新帖子和回复
- 检测敏感词和违规内容
- 自动删除或标记可疑内容
- 用户举报处理
- 生成审核报告

### 👨‍💼 管理代理 (Admin Agent)
- 用户注册和认证
- 版块管理和调整
- 数据统计和分析
- 系统配置更新
- 异常处理升级

### 💬 回复代理 (Response Agent)
- 自动回复常见问题
- 新用户引导
- 帖子推荐和置顶
- 话题引导和活跃
- 多语言支持

## 记忆系统设计

```json
// memory/bbs-state.json
{
  "lastCheck": 1711785600,
  "activeUsers": 127,
  "todayPosts": 45,
  "flaggedContent": 3,
  "trendingTopics": ["期末考试", "社团招新", "二手书"],
  "userReputation": {
    "user123": { "score": 85, "level": "活跃用户" },
    "user456": { "score": 42, "level": "新用户" }
  }
}
```

## 安全与隐私

- 所有数据本地存储
- 用户信息加密
- 敏感操作需要确认
- 定期数据备份
- 审计日志完整记录

## 开发路线图

### Phase 1 - 基础框架 (当前)
- [x] 项目初始化
- [ ] 核心架构设计
- [ ] 基础配置系统
- [ ] 数据存储方案

### Phase 2 - 渠道集成
- [ ] Telegram Bot
- [ ] WhatsApp 集成
- [ ] Web 控制面板
- [ ] Discord 服务器

### Phase 3 - AI 代理
- [ ] 审核代理开发
- [ ] 管理代理开发
- [ ] 回复代理开发
- [ ] 代理间通信

### Phase 4 - 功能完善
- [ ] 用户系统
- [ ] 积分和等级
- [ ] 通知系统
- [ ] 数据分析

### Phase 5 - 优化部署
- [ ] 性能优化
- [ ] 文档完善
- [ ] 一键部署
- [ ] 监控告警

## 许可证

MIT License

## 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](docs/CONTRIBUTING.md) 了解如何参与。

---

**状态**: 🚧 开发中
**版本**: v0.1.0
**最后更新**: 2026-03-30

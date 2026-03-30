# OpenClaw-BBS 架构设计文档

## 1. 系统概述

OpenClaw-BBS 是一个基于 OpenClaw 网关构建的全托管 BBS 论坛系统。核心理念是利用 AI 代理自动化管理论坛的所有方面，从内容审核到用户管理，从帖子分类到数据分析。

## 2. 设计原则

### 2.1 AI 优先 (AI-First)
- 所有管理任务优先由 AI 代理处理
- 人工干预仅用于例外情况和重大决策
- AI 代理之间可以协作和升级问题

### 2.2 渠道无关 (Channel-Agnostic)
- 支持多种消息渠道接入
- 统一的数据模型和处理逻辑
- 渠道特定的适配层

### 2.3 本地优先 (Local-First)
- 数据默认本地存储
- 可选的云同步和备份
- 离线功能支持

### 2.4 可扩展 (Extensible)
- 插件化的代理系统
- 可配置的规则和策略
- 开放的技能 (Skills) 系统

## 3. 核心组件

### 3.1 消息接入层 (Channel Adapter Layer)

```
┌────────────────────────────────────────────────────────┐
│                  Channel Adapters                      │
├──────────────┬──────────────┬──────────────┬──────────┤
│   Telegram   │   WhatsApp   │   Discord    │   Web    │
│    Bot API   │  Cloud API   │    API       │  Server  │
└──────┬───────┴──────┬───────┴──────┬───────┴────┬─────┘
       │              │              │            │
       └──────────────┴──────┬───────┴────────────┘
                             │
                  ┌──────────▼──────────┐
                  │  OpenClaw Gateway   │
                  │   (统一消息入口)     │
                  └──────────┬──────────┘
```

**职责**:
- 接收来自各渠道的用户消息
- 标准化消息格式
- 转发到 OpenClaw Gateway
- 处理渠道特定的功能（如表情、图片）

### 3.2 代理路由层 (Agent Routing Layer)

```
                    ┌──────────────────┐
                    │  Incoming Message│
                    └────────┬─────────┘
                             │
                  ┌──────────▼──────────┐
                  │   Intent Classifier │
                  │   (意图识别代理)     │
                  └──────────┬──────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │  发帖    │        │  回复    │        │  管理    │
    │ Post    │        │ Reply   │        │ Admin   │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │审核代理  │        │回复代理  │        │管理代理  │
    └─────────┘        └─────────┘        └─────────┘
```

**代理类型**:

| 代理 | 职责 | 触发条件 |
|------|------|----------|
| Intent Classifier | 识别用户意图 | 所有 incoming message |
| Moderator | 内容审核 | 新帖子/回复 |
| Response | 自动回复 | 常见问题/新用户 |
| Admin | 系统管理 | 配置变更/异常 |
| Analytics | 数据分析 | 定时任务 |
| Notification | 通知推送 | 事件触发 |

### 3.3 数据存储层 (Data Storage Layer)

```
┌─────────────────────────────────────────────────────────┐
│                    Data Storage                          │
├──────────────────┬──────────────────┬──────────────────┤
│   PostgreSQL/    │   OpenClaw       │   File System     │
│   SQLite         │   Memory         │   (Media)         │
├──────────────────┼──────────────────┼──────────────────┤
│ - 用户数据        │ - 会话状态        │ - 图片            │
│ - 帖子内容        │ - 用户偏好        │ - 附件            │
│ - 版块结构        │ - 短期记忆        │ - 备份文件        │
│ - 操作日志        │ - 上下文缓存      │                   │
└──────────────────┴──────────────────┴──────────────────┘
```

**数据模型**:

```typescript
// 用户
interface User {
  id: string;
  channelId: string;      // Telegram/WhatsApp ID
  username: string;
  realName?: string;
  reputation: number;
  level: UserLevel;
  joinedAt: Date;
  lastActive: Date;
  preferences: UserPrefs;
}

// 帖子
interface Post {
  id: string;
  boardId: string;
  authorId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  status: PostStatus;     // visible/hidden/deleted/archived
}

// 回复
interface Reply {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  parentId?: string;      // 支持楼中楼
  status: ReplyStatus;
}

// 版块
interface Board {
  id: string;
  name: string;
  description: string;
  parentId?: string;      // 支持子版块
  moderatorAgents: string[];
  rules: BoardRule[];
  settings: BoardSettings;
}
```

## 4. 消息处理流程

### 4.1 发帖流程

```
用户消息 → 渠道适配 → 意图识别 → 内容审核 → 存储 → 发布 → 通知
   │                                            │
   │                                            ▼
   │                                    ┌──────────────┐
   │                                    │  推荐系统     │
   │                                    │  (置顶/加精)  │
   │                                    └──────────────┘
   ▼
┌──────────────┐
│  审核失败     │
│  (删除/警告)  │
└──────────────┘
```

### 4.2 审核流程

```
新内容 → 敏感词检测 → AI 内容分析 → 风险评分 → 决策
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              低风险 (自动通过)  中风险 (人工复核)  高风险 (自动删除)
```

**审核规则示例**:

```json
{
  "moderation": {
    "autoDelete": {
      "spamScore": 0.9,
      "toxicityScore": 0.8,
      "bannedWords": ["敏感词 1", "敏感词 2"]
    },
    "flagForReview": {
      "spamScore": 0.5,
      "toxicityScore": 0.4,
      "newUserLimit": 3
    },
    "autoApprove": {
      "trustedUserLevel": "活跃用户",
      "spamScore": 0.2
    }
  }
}
```

## 5. OpenClaw 集成点

### 5.1 会话管理 (Session Management)

利用 OpenClaw 的会话系统维护用户上下文：

```json
{
  "sessionConfig": {
    "perUser": true,
    "memory": {
      "shortTerm": "last_10_messages",
      "longTerm": "user_preferences"
    },
    "timeout": "24h"
  }
}
```

### 5.2 记忆系统 (Memory System)

```
memory/
├── bbs-state.json        # BBS 整体状态
├── user-reputation.json  # 用户信誉记录
├── trending-topics.json  # 热门话题
├── moderation-log.md     # 审核日志
└── daily-reports/        # 每日报告
    └── 2026-03-30.md
```

### 5.3 定时任务 (Cron Jobs)

```json
{
  "cronJobs": [
    {
      "name": "daily-report",
      "schedule": "0 20 * * *",
      "task": "generateDailyReport"
    },
    {
      "name": "cleanup-old-posts",
      "schedule": "0 3 * * 0",
      "task": "archivePostsOlderThan30Days"
    },
    {
      "name": "update-trending",
      "schedule": "0 * * * *",
      "task": "calculateTrendingTopics"
    }
  ]
}
```

### 5.4 技能系统 (Skills)

自定义 OpenClaw Skills 扩展功能：

```
skills/
├── bbs-moderation/
│   ├── SKILL.md
│   ├── moderate-content.ts
│   └── detect-spam.ts
├── bbs-analytics/
│   ├── SKILL.md
│   ├── user-activity.ts
│   └── trend-analysis.ts
└── bbs-notification/
    ├── SKILL.md
    └── send-notification.ts
```

## 6. 安全设计

### 6.1 认证与授权

```
用户认证流程:
1. 首次访问 → 自动注册 (基于渠道 ID)
2. 敏感操作 → 二次确认
3. 管理操作 → 权限验证
```

### 6.2 数据保护

- 用户 ID 加密存储
- 敏感操作日志记录
- 定期数据备份
- 访问控制列表

### 6.3 审计日志

```json
{
  "auditLog": {
    "enabled": true,
    "events": [
      "post.created",
      "post.deleted",
      "user.banned",
      "config.changed",
      "agent.action"
    ],
    "retention": "90d"
  }
}
```

## 7. 性能考虑

### 7.1 缓存策略

- 热门帖子缓存 (Redis/Memory)
- 用户信息缓存
- 版块列表缓存

### 7.2 异步处理

- 审核队列
- 通知队列
- 分析任务后台执行

### 7.3 限流策略

```json
{
  "rateLimit": {
    "post": "10/hour",
    "reply": "30/hour",
    "report": "5/hour"
  }
}
```

## 8. 部署架构

### 8.1 单机部署 (推荐校内使用)

```
┌─────────────────────────────┐
│       本地服务器             │
│  ┌───────────────────────┐  │
│  │   OpenClaw Gateway    │  │
│  │   + BBS Agents        │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │   SQLite Database     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 8.2 高可用部署

```
┌─────────────────────────────────────────────────┐
│              Load Balancer                       │
└─────────────────────┬───────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │ Node 1  │  │ Node 2  │  │ Node 3  │
    │OpenClaw │  │OpenClaw │  │OpenClaw │
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         └────────────┼────────────┘
                      │
             ┌────────▼────────┐
             │  PostgreSQL     │
             │  (Primary)      │
             └─────────────────┘
```

## 9. 监控与告警

### 9.1 关键指标

- 活跃用户数
- 帖子/回复数量
- 审核通过率
- 响应时间
- 错误率

### 9.2 告警规则

```json
{
  "alerts": [
    {
      "name": "high-error-rate",
      "condition": "errorRate > 5%",
      "action": "notify_admin"
    },
    {
      "name": "spam-surge",
      "condition": "spamPosts > 50/hour",
      "action": "enable_strict_mode"
    }
  ]
}
```

## 10. 扩展方向

### 10.1 短期扩展
- 积分系统
- 用户等级
- 成就徽章
- 私信功能

### 10.2 中期扩展
- 多语言支持
- 内容推荐
- 搜索优化
- API 开放

### 10.3 长期扩展
- 联邦学习 (多校互联)
- 区块链存证
- AR/VR 集成
- 语音交互

---

**文档版本**: v0.1.0
**最后更新**: 2026-03-30
**作者**: OpenClaw-BBS Team

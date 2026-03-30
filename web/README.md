# OpenClaw-BBS Web GUI

> 适合中国大陆访问的 BBS 论坛 Web 界面

---

## 🌐 特性

### 国内友好
- ✅ 使用 **BootCDN** (https://www.bootcdn.cn/) 提供 CSS/JS 资源
- ✅ Bootstrap 5.3.2 - 响应式 UI 框架
- ✅ Bootstrap Icons - 图标库
- ✅ Axios - HTTP 客户端
- ✅ 无需 Google Fonts、CDNJS 等可能被墙的源

### 功能完整
- 📱 **移动端优先** - 完美适配手机、平板、桌面
- 🎨 **现代化 UI** - 渐变导航栏、卡片式设计、悬浮按钮
- 📊 **实时统计** - 用户数、帖子数、今日发帖、在线人数
- 🏷️ **版块系统** - 6 个预设版块，支持扩展
- 📝 **发帖功能** - 富文本编辑器、标签支持
- 👤 **用户系统** - 登录、等级、信誉积分
- 🔍 **帖子浏览** - 列表、详情、回复

### 技术栈
- **前端**: HTML5 + CSS3 + Vanilla JavaScript
- **UI 框架**: Bootstrap 5.3.2
- **HTTP 客户端**: Axios 1.6.2
- **后端**: Node.js 原生 HTTP 模块
- **数据**: JSON 文件存储（可升级到 SQLite/MySQL）

---

## 🚀 快速启动

### 方式 1: NPM 脚本（推荐）

```bash
cd E:\openclaw\.openclaw\workspace\OpenClaw-BBS
npm run start:web
```

### 方式 2: 直接运行

```bash
node web/server.js
```

### 方式 3: 自定义端口

```bash
# Windows PowerShell
$env:BBS_WEB_PORT=3001; node web/server.js

# Windows CMD
set BBS_WEB_PORT=3001 && node web/server.js

# Linux/macOS
BBS_WEB_PORT=3001 node web/server.js
```

---

## 📱 访问地址

启动后，服务器会显示访问地址：

```
🦞 OpenClaw-BBS Web 服务器启动成功!
==================================================
📍 本地访问：http://localhost:3000
📍 局域网访问：http://192.168.x.x:3000
==================================================
```

### 访问方式

| 设备 | 地址 |
|------|------|
| 本机浏览器 | http://localhost:3000 |
| 手机（同一 WiFi） | http://电脑 IP:3000 |
| 局域网其他设备 | http://电脑 IP:3000 |

---

## 🎨 界面预览

### 首页
- 统计卡片（用户、帖子、今日、在线）
- 热门版块（4 个）
- 最新帖子列表
- 悬浮发帖按钮

### 版块页面
- 全部版块网格展示
- 版块描述、标签、帖子数

### 帖子详情
- 作者信息、头像
- 帖子内容、标签
- 回复区域

### 发帖功能
- 选择版块
- 输入标题（最多 100 字）
- 输入内容（最多 10000 字）
- 添加标签

---

## 🔌 API 文档

### 基础 URL
```
http://localhost:3000/api
```

### 端点列表

#### 1. 获取版块列表
```http
GET /api/boards
```

**响应示例**:
```json
{
  "boards": [
    {
      "id": "general",
      "name": "综合讨论",
      "icon": "💬",
      "description": "校园生活、日常闲聊"
    }
  ]
}
```

#### 2. 获取帖子列表
```http
GET /api/posts?board=general&limit=20
```

**参数**:
- `board` (可选) - 版块 ID 过滤
- `limit` (可选) - 返回数量限制，默认 20

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "total": 100
}
```

#### 3. 获取单个帖子
```http
GET /api/posts/:id
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "post_xxx",
    "title": "帖子标题",
    "content": "帖子内容",
    "authorId": "user_xxx",
    "createdAt": "2026-03-30T10:00:00Z"
  }
}
```

#### 4. 创建新帖子
```http
POST /api/posts
Content-Type: application/json

{
  "boardId": "general",
  "title": "我的新帖子",
  "content": "这是帖子内容...",
  "tags": ["求助", "分享"],
  "authorId": "user_xxx",
  "authorName": "用户名"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": { ... },
  "message": "帖子已创建，正在审核中..."
}
```

#### 5. 获取统计数据
```http
GET /api/stats
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "users": 127,
    "posts": 456,
    "todayPosts": 23,
    "online": 42
  }
}
```

#### 6. 创建/登录用户
```http
POST /api/users
Content-Type: application/json

{
  "username": "张三"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "user_xxx",
    "username": "张三",
    "level": "newcomer",
    "reputation": 0
  }
}
```

---

## 🛠️ 自定义配置

### 修改端口

编辑 `web/server.js`:
```javascript
const CONFIG = {
  port: 3000,  // 修改这里
  host: '0.0.0.0',
  // ...
};
```

或使用环境变量：
```bash
set BBS_WEB_PORT=8080
node web/server.js
```

### 修改主题颜色

编辑 `web/index.html` 中的 CSS 变量：
```css
:root {
  --primary-color: #dc3545;    /* 主色调 */
  --secondary-color: #6c757d;  /* 辅助色 */
  --accent-color: #0d6efd;     /* 强调色 */
}
```

### 添加新 CDN 资源

在 `web/index.html` 的 `<head>` 中添加：
```html
<!-- 使用 BootCDN -->
<link href="https://cdn.bootcdn.net/ajax/libs/xxx/x.x.x/xxx.min.css" rel="stylesheet">
<script src="https://cdn.bootcdn.net/ajax/libs/xxx/x.x.x/xxx.min.js"></script>
```

---

## 📂 文件结构

```
web/
├── index.html          # 主页面（UI）
├── server.js           # Web 服务器（API）
└── README.md           # 本文档
```

---

## 🔐 安全注意事项

### 当前状态
⚠️ **开发版本** - 仅供内部测试使用

### 生产环境建议
1. **添加 HTTPS** - 使用 Nginx 反向代理
2. **用户认证** - 实现真正的登录系统
3. **输入验证** - 防止 XSS、SQL 注入
4. **速率限制** - 防止 API 滥用
5. **文件上传** - 限制类型和大小
6. **CORS 配置** - 限制跨域访问

---

## 🐛 已知问题

1. **数据持久化** - 当前使用 JSON 文件，并发写入可能有问题
2. **用户认证** - 仅本地存储，无真正登录
3. **图片上传** - 暂未实现
4. **搜索功能** - 暂未实现
5. **通知系统** - 暂未实现

---

## 🚀 下一步开发

### 短期
- [ ] 完善用户登录（短信/邮箱验证）
- [ ] 图片上传功能
- [ ] 帖子搜索
- [ ] 回复功能
- [ ] 点赞/收藏

### 中期
- [ ] 数据库支持（SQLite/MySQL）
- [ ] 管理员后台
- [ ] 消息通知
- [ ] 用户私信
- [ ] 签到系统

### 长期
- [ ] 移动端 App（uni-app/Flutter）
- [ ] 微信小程序
- [ ] 内容推荐算法
- [ ] 数据分析面板
- [ ] 多语言支持

---

## 📞 技术支持

### 常见问题

**Q: 页面加载缓慢？**
A: 检查网络连接，BootCDN 在国内访问速度应该很快。如仍有问题，可下载到本地。

**Q: 端口被占用？**
A: 使用 `BBS_WEB_PORT` 环境变量指定其他端口。

**Q: 手机无法访问？**
A: 确保手机和电脑在同一 WiFi，关闭防火墙或添加例外。

**Q: 发帖后看不到？**
A: 帖子状态为 `pending`（待审核），需要管理员审核通过后才会显示。

---

## 📄 许可证

MIT License

---

**最后更新**: 2026-03-30  
**版本**: v0.1.0

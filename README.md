# X Manager (Self-Hosted)

A powerful, self-hosted dashboard for managing your X (formerly Twitter) bookmarks, likes, and tweets. It comes with a Chrome Extension that automatically syncs your browsing activity to your local database.

[中文文档](#中文文档)

## Features

- **Multi-Source Sync**: Capture tweets from your Timeline, Likes, and Bookmarks
- **Auto-Import**: Chrome Extension intercepts X.com GraphQL traffic automatically
- **Smart Classification**: Auto-tag tweets by content (AI, Dev, Design, etc.)
- **Server-Side Pagination**: Handle thousands of tweets efficiently
- **Full-Text Search**: Search through content, authors, handles, and hashtags
- **Duplicate Detection**: Smart caching to skip already-imported tweets
- **Auto-Scroll**: Built-in auto-scroll feature to batch collect tweets
- **Privacy First**: Self-hosted, your data stays on your machine

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide React
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Extension**: Chrome Manifest V3

## Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL (or Docker)
- Google Chrome

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd x-libris
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/x_manager"
API_SECRET="secret-api-key-123"
```

### 3. Setup Database

```bash
# Using Docker (recommended)
docker-compose up -d postgres

# Initialize schema
npx prisma db push
```

### 4. Run Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Install Chrome Extension

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension` folder

## Usage

### Basic Usage

1. Start the app (`npm run dev`)
2. Visit [x.com](https://x.com)
3. Browse your Likes, Bookmarks, or Timeline
4. Tweets are automatically captured and synced

### Auto-Scroll Feature

1. Click the extension icon in Chrome
2. Set scroll interval (default: 1500ms)
3. Set max scrolls (recommended: ≤50 to prevent crashes)
4. Toggle "Skip existing tweets" for faster collection
5. Click "🚀 Start Auto-Scroll"

### Dashboard Features

- **Source Filter**: Filter by My Tweets / Likes / Bookmarks
- **Smart Folders**: Auto-classified by AI, Dev, Design, etc.
- **Search**: Real-time search with debounce
- **Pagination**: Navigate through large datasets

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tweets` | GET | List tweets with pagination & filters |
| `/api/tweets/ids` | GET | Get tweet IDs for deduplication |
| `/api/import` | POST | Import tweets from extension |

### Query Parameters

```
GET /api/tweets?page=1&pageSize=20&source=likes&folder=AI&search=keyword
```

## Project Structure

```
x-libris/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── import/        # Tweet import endpoint
│   │   └── tweets/        # Tweet list & IDs endpoints
│   └── page.tsx           # Dashboard UI
├── extension/             # Chrome Extension
│   ├── manifest.json      # Extension config
│   ├── background.js      # Service worker
│   ├── content.js         # Content script
│   ├── injected.js        # Page context script
│   ├── popup.html         # Extension popup UI
│   └── popup.js           # Popup logic
├── prisma/
│   └── schema.prisma      # Database schema
└── docker-compose.yml     # Docker config
```

## Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running
- Check `.env` credentials
- Try `127.0.0.1` instead of `localhost`

### Extension Not Capturing
- Check if backend is running on port 3000
- Open DevTools → Console for error logs
- Disable conflicting Twitter extensions

### Page Crashes (STATUS_BREAKPOINT)
- Reduce max scrolls to 50 or less
- The extension auto-refreshes page every 50 scrolls
- Use "Skip existing" to reduce memory usage

---

# 中文文档

一个强大的自托管仪表板，用于管理你的 X（原 Twitter）收藏、喜欢和推文。配套 Chrome 扩展可自动同步浏览数据到本地数据库。

## 功能特性

- **多来源同步**：抓取时间线、喜欢、收藏的推文
- **自动导入**：Chrome 扩展自动拦截 X.com GraphQL 请求
- **智能分类**：根据内容自动标记（AI、Dev、Design 等）
- **服务端分页**：高效处理数千条推文
- **全文搜索**：搜索内容、作者、用户名、标签
- **去重检测**：智能缓存跳过已导入的推文
- **自动滚动**：内置自动滚动功能批量收集推文
- **隐私优先**：自托管，数据保存在本地

## 快速开始

### 环境要求

- Node.js v18+
- PostgreSQL（或 Docker）
- Google Chrome

### 1. 克隆并安装

```bash
git clone <your-repo-url>
cd x-libris
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/x_manager"
API_SECRET="secret-api-key-123"
```

### 3. 初始化数据库

```bash
# 使用 Docker（推荐）
docker-compose up -d postgres

# 初始化表结构
npx prisma db push
```

### 4. 启动应用

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

### 5. 安装 Chrome 扩展

1. 打开 `chrome://extensions`
2. 开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择 `extension` 文件夹

## 使用方法

### 基本使用

1. 启动应用 (`npm run dev`)
2. 访问 [x.com](https://x.com)
3. 浏览你的喜欢、收藏或时间线
4. 推文会自动被抓取并同步

### 自动滚动功能

1. 点击 Chrome 工具栏的扩展图标
2. 设置滚动间隔（默认 1500ms）
3. 设置最大滚动次数（建议 ≤50 防止崩溃）
4. 开启「跳过已存在的推文」加快收集速度
5. 点击「🚀 开始自动滚动」

### 仪表板功能

- **来源筛选**：按我的推文 / 喜欢 / 收藏筛选
- **智能文件夹**：自动分类为 AI、Dev、Design 等
- **搜索**：实时搜索，带防抖
- **分页**：浏览大量数据

## 常见问题

### 数据库连接失败
- 确保 PostgreSQL 正在运行
- 检查 `.env` 中的凭据
- 尝试用 `127.0.0.1` 替代 `localhost`

### 扩展没有抓取数据
- 检查后端是否在 3000 端口运行
- 打开 DevTools → Console 查看错误日志
- 禁用其他 Twitter 相关扩展

### 页面崩溃 (STATUS_BREAKPOINT)
- 将最大滚动次数减少到 50 或更少
- 扩展会每 50 次滚动自动刷新页面
- 使用「跳过已存在」减少内存占用

## TODO

### Dashboard / 管理端
- [ ] Tweet detail modal (点击查看推文详情弹窗)
- [ ] Click to open original tweet URL (点击跳转原推文链接)
- [ ] Batch delete tweets (批量删除推文)
- [ ] Manual folder assignment (手动分配文件夹)
- [ ] Export to CSV/JSON (导出数据)
- [ ] Dark/Light theme toggle (深色/浅色主题切换)
- [ ] Responsive mobile layout (移动端适配)
- [ ] Tweet preview with media gallery (媒体图片画廊预览)
- [ ] Hashtag cloud / filter by hashtag (标签云/按标签筛选)

### AI Features / AI 功能
- [ ] AI-powered smart tagging (AI 智能标签)
- [ ] Content summarization (内容摘要生成)
- [ ] Semantic search (语义搜索)
- [ ] Similar tweets recommendation (相似推文推荐)
- [ ] Auto-generate tweet collections (自动生成推文合集)
- [ ] Sentiment analysis (情感分析)

### Extension / 扩展
- [ ] Sync progress indicator (同步进度指示器)
- [ ] Manual sync button (手动同步按钮)
- [ ] Capture tweet threads (抓取推文串)
- [ ] Capture quoted tweets (抓取引用推文)
- [ ] Capture user profiles (抓取用户资料)
- [ ] Options page for API URL config (设置页面配置 API 地址)

### Backend / 后端
- [ ] User authentication (用户认证)
- [ ] Multi-user support (多用户支持)
- [ ] Rate limiting (请求限流)
- [ ] Webhook notifications (Webhook 通知)
- [ ] Scheduled sync jobs (定时同步任务)
- [ ] Data backup/restore (数据备份/恢复)

### Infrastructure / 基础设施
- [ ] Docker one-click deploy (Docker 一键部署)
- [ ] Vercel/Railway deploy guide (Vercel/Railway 部署指南)
- [ ] Redis caching (Redis 缓存)

## 许可证

MIT

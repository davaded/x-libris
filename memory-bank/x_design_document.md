# X-Libris 架构设计文档 (v2.0 最终版)

> **版本核心**：单用户强安全防护 + 异步 AI 处理 + 混合深度搜索
> **目标**：构建一个“他人无法进入、扩展安全写入、AI 深度整理”的私人推文知识库。

-----

## 1\. 系统概览 (System Overview)

**X-Libris** 是一个私有化部署的 X (Twitter) 数据资产管理系统。
它通过浏览器扩展自动捕获你的推文、点赞和收藏，并在本地服务器构建一个支持 **AI 语义搜索** 和 **多维分类** 的永久知识库。

### 核心差异化特性

1.  **双重安全防线**：Web 端与采集端（扩展）采用完全物理隔离的鉴权机制，扩展被黑不影响后台安全。
2.  **异步 AI 管道**：采集与分析解耦，避免 API 超时，支持大规模数据后台静默处理。
3.  **混合深度搜索**：结合传统的**全文检索**（精确匹配）与 **向量检索**（语义联想），实现“搜意图而非仅搜关键词”。

-----

## 2\. 系统架构 (Architecture)

```mermaid
graph TD
    subgraph Client ["客户端 (Browser)"]
        Ext[Chrome Extension] -->|Header: x-extension-token| API_Import["API: /api/import"]
        Web[Admin Dashboard] -->|Cookie: NextAuth| API_Web["API: /api/*"]
    end

    subgraph Backend ["Next.js Server"]
        API_Import -->|1. 快速写入 (Status: Pending)| DB
        API_Web -->|读取/搜索| DB
        
        Worker[Async AI Worker] -->|2. 轮询未处理数据| DB
        Worker -->|3. 生成 Embedding/Summary| LLM[OpenAI / Claude]
        Worker -->|4. 回写增强数据| DB
    end

    subgraph Data ["Storage"]
        DB[(PostgreSQL + pgvector)]
    end
```

-----

## 3\. 核心数据库模型 (Database Schema)

为了支持 AI 向量搜索和高性能排序，我们对 `schema.prisma` 进行了深度结构化改造。

### 关键改动点：

  * **User/Session**：引入 NextAuth 支持。
  * **Vector**：启用 `pgvector` 扩展。
  * **Stats**：将 JSON 统计数据展开为独立字段，便于 SQL 排序。
  * **AI Fields**：增加 `processed` 状态位、`aiTags` 和 `embedding`。

<!-- end list -->

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"] // 开启 Postgres 扩展支持
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector] // 👈 核心：开启 pgvector 插件
}

// --- 账户与鉴权系统 ---

model User {
  id           String    @id @default(uuid())
  username     String    @unique
  passwordHash String    // 仅存储 bcrypt hash
  createdAt    DateTime  @default(now())
  
  sessions     Session[]
  tweets       Tweet[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// --- 推文数据核心 ---

model Tweet {
  id           String   @id // Tweet ID (tco_id 或 原始数字ID)
  ownerId      String   // 👈 强绑定：数据所属权

  // 1. 基础内容
  url          String?
  content      String
  authorName   String
  authorHandle String
  authorAvatar String?
  mediaUrls    String[]
  
  // 2. 统计数据 (结构化，不再使用 Json)
  replyCount    Int      @default(0)
  retweetCount  Int      @default(0)
  likeCount     Int      @default(0)
  quoteCount    Int      @default(0)

  // 3. 分类元数据
  folder       String   @default("Unsorted") // 主文件夹
  source       String   @default("unknown")  // 来源: "import", "extension-likes"
  hashtags     String[] // 原推文自带标签
  
  // 4. AI 增强字段 (异步处理)
  processed    Boolean  @default(false)      // 任务队列标记
  aiTags       String[] // AI 分析出的语义标签
  aiSummary    String?  // AI 生成的一句话摘要
  embedding    Unsupported("vector(1536)")? // 向量数据 (OpenAI text-embedding-3-small)
  
  tweetedAt    DateTime
  createdAt    DateTime @default(now())

  owner        User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  // 索引优化
  @@index([ownerId])
  @@index([folder])
  @@index([processed]) // 方便 Worker 快速查找任务
}
```

-----

## 4\. 安全模型 (Security Model)

系统采用 **双轨制鉴权 (Dual-Track Auth)**，确保 Web 端和扩展端互不干扰，且最大化安全。

### 4.1 轨道一：Web 管理端 (NextAuth)

  * **机制**：标准的 Session / Cookie 认证。
  * **用途**：访问 Dashboard、搜索、删除、修改数据。
  * **实现**：
      * `Middleware.ts` 拦截所有路由。
      * 未登录用户重定向至 `/login`。
      * API Route 中校验 `session.user.id`。

### 4.2 轨道二：数据采集端 (Extension Token)

  * **机制**：Bearer Token 认证。
  * **用途**：**仅限写入** (`POST /api/import`)。扩展无权读取或删除数据。
  * **配置**：
      * 服务端 `.env` 设置 `EXTENSION_TOKEN=your-long-secret-key`。
      * 服务端 `.env` 设置 `ADMIN_USER_ID=xxxx` (数据默认归属者)。
      * 扩展端设置页填入该 Token。
  * **请求头**：
    ```http
    POST /api/import
    x-extension-token: your-long-secret-key
    ```
  * **后端逻辑**：
    ```typescript
    // app/api/import/route.ts
    const token = req.headers.get("x-extension-token");
    if (token !== process.env.EXTENSION_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // 验证通过，强制 ownerId = process.env.ADMIN_USER_ID
    ```

-----

## 5\. 功能模块实现策略

### 5.1 异步 AI 处理器 (Async Worker)

为了防止导入大量数据时 API 超时，AI 处理必须异步化。

  * **Step 1 导入**：`/api/import` 仅存入原始文本，标记 `processed: false`。
  * **Step 2 触发**：
      * *方案 A (简单)*：Next.js 前端页面放置一个不可见的 `useEffect` 或手动点击“开始整理”按钮，调用 `/api/process-queue`。
      * *方案 B (推荐)*：使用 Vercel Cron 或外部 Cron 定时调用处理接口。
  * **Step 3 处理逻辑**：
    1.  从 DB 取出 10 条 `processed: false` 的推文。
    2.  调用 LLM (OpenAI/Claude) 分析内容，生成 `tags`, `summary`。
    3.  调用 Embedding API 生成向量。
    4.  更新 DB，标记 `processed: true`。

### 5.2 混合搜索 (Hybrid Search)

解决“向量搜不到关键词，关键词搜不到语义”的痛点。

  * **流程**：
    1.  用户输入查询词 "React 状态管理"。
    2.  **并行查询**：
          * **Full Text**: Prisma `contains` 或 Postgres `to_tsvector` 搜索包含 "React" 和 "状态管理" 的记录。
          * **Vector**: 将查询词转为向量，搜索余弦相似度最高的记录。
    3.  **结果合并**：将两组结果 ID 结合，去重返回。

-----

## 6\. 浏览器扩展重构 (Extension Refactor)

扩展不再硬编码，而是提供完整的配置能力。

  * **Popup 界面**：
      * 输入框 1: `API URL` (如 `https://my-xlibris.com`)
      * 输入框 2: `Secure Token` (对应 `.env` 中的 `EXTENSION_TOKEN`)
      * 保存按钮：存储到 `chrome.storage.local`。
  * **Background 逻辑**：
      * 监听 `TWEET_DETECTED` 消息。
      * 从 Storage 读取 Token。
      * 发送请求时必须带上 Header `x-extension-token`。
      * 根据 API 返回状态 (200/401) 改变扩展图标颜色 (绿/红)。

-----

## 7\. 部署与运维 (Deployment)

### Docker Compose 配置

为了支持向量搜索，必须替换标准的 Postgres 镜像。

```yaml
version: '3.8'
services:
  db:
    image: pgvector/pgvector:pg16  # 👈 关键：使用带向量插件的镜像
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: xlibris
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
```

### 环境变量 (.env)

```env
# 数据库
DATABASE_URL="postgresql://postgres:password@db:5432/xlibris"

# NextAuth
AUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# 扩展鉴权
EXTENSION_TOKEN="sk-extension-super-secret-token"
ADMIN_USER_ID="user-uuid-from-database"

# AI 服务
OPENAI_API_KEY="sk-..."
```

-----

## 8\. 开发路线图 (Roadmap)

1.  **基础设施升级 (Infrastructure)**

      * 更新 `docker-compose.yml` 使用 `pgvector`。
      * 更新 `schema.prisma` 并运行 `prisma migrate dev`。

2.  **安全层实现 (Security Layer)**

      * 配置 NextAuth (Auth.js)。
      * 实现 API Route 的 Token 校验中间件。
      * 运行脚本创建一个初始 Admin 用户。

3.  **扩展改造 (Extension Revamp)**

      * 添加 Popup 设置页。
      * 修改 Background 发送逻辑。

4.  **AI 与搜索集成 (AI & Search)**

      * 编写 AI 处理队列逻辑 (Worker)。
      * 实现向量生成与混合搜索 API。

5.  **UI 适配 (Dashboard)**

      * 更新表格列，支持显示 AI 标签和摘要。
      * 增加“手动触发 AI 整理”的按钮。
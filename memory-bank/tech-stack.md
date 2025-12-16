# X-Libris 技术栈推荐  
## The Simplest & Most Robust Stack

> **核心原则**  
> 1. **统一语言**：全链路 TypeScript，减少上下文切换。  
> 2. **单一数据源**：PostgreSQL 同时承载关系数据与向量数据，拒绝维护多个数据库。  
> 3. **极简运维**：所有服务通过一个 Docker Compose 启动，可在任何 VPS 或本地稳定运行。  

---

## 1. 核心全栈框架 (The Core)

### **Next.js 14 (App Router)**
**角色**：同时承载前端 UI 与后端 API。  

**选择理由**：
- **简单**：无需前后端分离，API Route 直接访问数据库，类型可前后复用。
- **健壮**：官方长期支持，App Router + RSC 非常适合渲染大量推文列表。
- **一致性**：UI、Auth、API、后台任务都在一个框架内完成。

---

## 2. 数据存储与检索 (Storage & Search)

### **PostgreSQL 16 + pgvector**
**角色**：系统的单一事实来源（Single Source of Truth）。

**承担能力**：
- **关系数据**：用户、推文、标签、设置、任务状态。
- **全文检索**：使用 PostgreSQL 原生 `tsvector + GIN` 实现关键词搜索与高亮。
- **语义搜索**：使用 `pgvector` 存储 embedding，实现相似推文检索。

**选择理由**：
- **工业级稳定性**：ACID 事务保证数据安全。
- **极简架构**：不引 Redis / ElasticSearch / Pinecone。
- **可扩展性**：在正确索引与分页策略下，可稳定支撑百万级记录管理。

> 说明：  
> - 向量存储使用 `vector(dim)`（pgvector 原生类型）  
> - 向量索引使用 `ivfflat` 或 `hnsw`  
> - Prisma 负责关系数据，向量字段与索引通过原生 SQL 管理  

---

### **Prisma ORM**
**角色**：数据库访问与迁移工具。

**选择理由**：
- 类型安全，避免字段级错误
- `prisma migrate` 是 Node.js 生态中最成熟的迁移方案
- 与 Next.js / Auth.js 集成度高

---

## 3. 安全与认证 (Security & Auth)

### **Auth.js / NextAuth v5**
**角色**：Web 管理端身份认证与会话管理。

**策略**：
- `CredentialsProvider`（用户名 + 密码）
- Session Cookie（HttpOnly）

**选择理由**：
- 不依赖第三方 OAuth，完全私有化
- 自动处理 Cookie 加密、CSRF 防护
- 非常适合 **单用户（管理员）系统**

**安全约束**：
- 不开放注册
- 管理员账号通过初始化脚本或环境变量创建
- 登录接口需有限速（防暴力破解）

---

### **API Bearer Token（扩展专用）**
**角色**：浏览器扩展导入鉴权。

**策略**：
- 静态高熵 Token：`EXTENSION_TOKEN`
- 与 Web 登录态物理隔离

**选择理由**：
- 扩展被攻破 ≠ 后台被攻破
- 导入权限最小化、职责单一
- 后端强制写入 `ADMIN_USER_ID`

---

## 4. AI 与智能分析 (AI Intelligence)

### **OpenAI API / Anthropic**
**角色**：推文智能分析与向量生成。

**推荐模型**：
- **Embedding**：`text-embedding-3-small`
- **分析 / 分类 / 摘要**：`gpt-4o-mini`

**选择理由**：
- 工程成本最低
- 批量处理稳定
- 可按环境切换 Key

#### 为什么不优先使用本地模型（Ollama）？
- 占用内存大
- 批处理慢
- 容易拖垮自托管 VPS
- 对当前“采集 + 管理”目标性价比不高

---

## 5. 后台处理模型 (Background Processing)

### **Route Handler + Cron**
**模式**：
- `/api/process-queue`
- 系统 cron 或平台 cron 定时触发

**设计原则**：
- 使用数据库状态字段或任务表（而非 Redis）
- 每次处理固定小批量（如 20~100 条）
- 明确状态机：`pending → processing → done / failed`
- 防重入、防超时、可重试

**优势**：
- 无独立 Worker 服务
- 与主应用完全一致的部署方式
- 故障恢复简单

---

## 6. 浏览器扩展 (Browser Extension)

### **Manifest V3 + Vanilla JavaScript**
**角色**：采集 X.com GraphQL 数据。

**选择理由**：
- 原生 JS 最轻量
- 减少对页面性能影响
- 易调试、易维护

**约束**：
- 所有请求携带 `x-extension-token`
- API Base URL 存储于 `chrome.storage.local`
- 不读取 Web 登录 Cookie

---

## 7. UI 组件与样式 (User Interface)

### **Shadcn UI + Tailwind CSS**
**角色**：管理面板 UI 构建。

**选择理由**：
- Shadcn 是“代码拷贝”，无黑盒
- Tailwind 适合高密度 Dashboard
- 易定制、长期可维护

---

## 8. 部署与运维 (DevOps)

### **Docker Compose**
**服务结构**：
```yaml
services:
  app: Next.js
  db: PostgreSQL + pgvector

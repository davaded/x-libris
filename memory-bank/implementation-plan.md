# X-Libris 实施计划（Detailed Execution Plan）

> 目标：落地 **“单用户强安全 + 扩展安全写入 + 异步 AI 处理 + 混合深度搜索”** 的私人推文知识库。:contentReference[oaicite:0]{index=0}  
> 技术栈约束：Next.js 14 + Auth.js/NextAuth v5 + PostgreSQL16(pgvector) + Prisma + Route Handler + Cron + 扩展 EXTENSION_TOKEN。:contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}  

---

## 0. 约定与验收标准（全局）

### 0.1 必须遵守的安全约束
- **Web 管理端**：必须走 Auth.js/NextAuth 的 Cookie Session。:contentReference[oaicite:3]{index=3}  
- **扩展导入端**：必须走 `EXTENSION_TOKEN`，且导入仅允许写入，不允许读取/删除。:contentReference[oaicite:4]{index=4}  
- 数据必须强绑定 `ownerId`（单用户模式下写入 `ADMIN_USER_ID`）。:contentReference[oaicite:5]{index=5}  

### 0.2 每步都要能“可验证”
- 每一步必须有：**可观察结果**（UI/HTTP 状态/数据库记录）+ **可复现测试**（手工或自动化）  
- 每一个 API 必须明确：未授权时 **401/重定向**，授权后 **200**。

---

## 1. 项目基线与环境准备（Foundation）

### 1.1 固化运行环境与依赖
**指令**
1. 在仓库根目录写出“开发环境要求”清单：Node、pnpm/npm 版本、Docker、Chrome。
2. 新建 `.env.example`，列出所有必须变量（不放真实值）：`DATABASE_URL / AUTH_SECRET / NEXTAUTH_URL / EXTENSION_TOKEN / ADMIN_USER_ID / OPENAI_API_KEY`。:contentReference[oaicite:6]{index=6}  

**验证测试**
- 本地复制 `.env.example` 为 `.env` 后，应用能启动到一个“可打开的页面”（哪怕是未登录也能看到登录页/重定向行为）。
- 缺少任意一个关键 env 时，启动必须失败并给出明确报错（避免 silent misconfig）。

---

### 1.2 通过 Docker Compose 启动数据库（pgvector）
**指令**
1. 将数据库容器镜像替换为带 pgvector 的 Postgres 镜像（pg16）。:contentReference[oaicite:7]{index=7}  
2. 启动后确认数据库可连接，并确保 pgvector 扩展可用。:contentReference[oaicite:8]{index=8}  

**验证测试**
- `docker compose up -d` 后：  
  - 数据库端口可连通（本地客户端/容器内健康检查均可）。  
  - 创建一次“向量扩展已启用”的检查（能成功创建 vector 类型或查询扩展存在）。

---

## 2. 数据库 Schema 改造与迁移（Schema First）

### 2.1 按设计文档更新 Prisma Schema
**指令**
1. 将 `schema.prisma` 更新为 v2.0 结构：  
   - 增加 `User`、`Session` 模型。:contentReference[oaicite:9]{index=9}  
   - Tweet 模型：增加 `ownerId`、结构化统计字段、AI 字段（`processed/aiTags/aiSummary/embedding`）。:contentReference[oaicite:10]{index=10}  
   - 启用 Postgres 扩展支持并声明 `vector` 扩展。:contentReference[oaicite:11]{index=11}  

2. 在迁移策略上做出明确决定：  
   - 若已有旧库数据：写出“迁移与兼容规则”（例如旧 `stats Json` 如何映射到新字段）。

**验证测试**
- 运行一次数据库迁移后：  
  - `User/Session/Tweet` 三张表存在。  
  - Tweet 表包含 `processed` 索引字段，便于 Worker 轮询。:contentReference[oaicite:12]{index=12}  
- 插入一条 Tweet（手工插入或通过临时导入流程）后：  
  - 默认 `processed=false`，统计字段默认 0，folder 默认 `Unsorted`。

---

### 2.2 设定数据归属规则（单用户强绑定）
**指令**
1. 写出系统规则：任何写入 Tweet 的路径都必须显式设置 `ownerId`。:contentReference[oaicite:13]{index=13}  
2. 约定单用户模式：所有导入写入都归属 `ADMIN_USER_ID`。:contentReference[oaicite:14]{index=14}  

**验证测试**
- 用任意方式导入/创建两条 Tweet：  
  - 两条 Tweet 的 `ownerId` 都等于 `ADMIN_USER_ID`。  
- 当 `ADMIN_USER_ID` 未配置时：导入接口必须拒绝执行，并提示需要配置。

---

## 3. 账户系统（Auth.js/NextAuth v5）与“别人进不来”（Security Gate）

### 3.1 引入 NextAuth（Credentials）并禁用注册
**指令**
1. 集成 Auth.js/NextAuth v5，采用 Credentials（用户名/密码）。:contentReference[oaicite:15]{index=15}  
2. 明确“无注册”：只允许管理员账号通过“初始化脚本或环境变量创建”。:contentReference[oaicite:16]{index=16}  
3. 定义管理员登录入口 `/login`，任何未登录访问后台页面都跳转到该页面。:contentReference[oaicite:17]{index=17}  

**验证测试**
- 访问管理首页（dashboard 根路由）：未登录必须重定向到 `/login`。  
- 用错误密码登录：必须失败（提示一致），且不产生 session。  
- 用正确密码登录：能进入 dashboard，刷新页面登录态仍存在（cookie session 生效）。

---

### 3.2 Middleware 全面拦截（页面 + API）
**指令**
1. 为 `app/` 下的管理路由与读写 API 统一加认证拦截：  
   - 未登录访问页面：重定向 `/login`  
   - 未登录访问 API：返回 401  
2. 明确白名单：允许访问 `/login`、静态资源、以及扩展导入端点（导入端点走 EXTENSION_TOKEN，不走 Web session）。:contentReference[oaicite:18]{index=18} :contentReference[oaicite:19]{index=19}  

**验证测试**
- 未登录时：  
  - 调用任意 `/api/tweets`、`/api/search` 必须 401。  
  - 调用 `/api/import` 不应被 Web session 中间件拦住（它是扩展专用）。  
- 登录后：  
  - `/api/tweets` 返回 200 且数据仅属于当前用户（ownerId 过滤）。

---

### 3.3 登录防护（最小但可靠）
**指令**
1. 明确登录失败限速策略（不引入 Redis）：  
   - 选择一种简单方案（例如数据库记录失败次数/时间窗或内存窗口；部署多实例时优先 DB）。  
2. 明确 cookie 安全属性策略：HttpOnly、SameSite、生产环境 Secure。  

**验证测试**
- 连续多次错误登录后：触发限速/锁定提示。  
- 生产模式（HTTPS）下：cookie 具备 Secure 标记（通过浏览器 DevTools 查看）。

---

## 4. 扩展导入通路（Extension → /api/import）（Write-Only Secure Ingest）

### 4.1 /api/import：用 EXTENSION_TOKEN 鉴权并强制写入 ADMIN_USER_ID
**指令**
1. 将导入鉴权明确为 `x-extension-token` 头。:contentReference[oaicite:20]{index=20}  
2. 校验失败必须返回 401。  
3. 校验通过后：  
   - 强制 ownerId = `ADMIN_USER_ID`（忽略客户端传的 ownerId）。:contentReference[oaicite:21]{index=21}  
   - 写入时默认 `processed=false`，让 AI Worker 异步处理。:contentReference[oaicite:22]{index=22}  

**验证测试**
- 不带 token 调用导入：401。  
- 带错误 token：401。  
- 带正确 token：200，并在 DB 中新增 Tweet，且 ownerId = ADMIN_USER_ID，processed=false。  

---

### 4.2 扩展配置能力：API URL + Token 存储到 chrome.storage
**指令**
1. 扩展必须提供配置 UI：  
   - 输入 `API URL`  
   - 输入 `Secure Token(EXTENSION_TOKEN)`  
   - 保存到 `chrome.storage.local`。:contentReference[oaicite:23]{index=23}  
2. 扩展发请求时：  
   - 从 storage 读取配置  
   - 请求头带 `x-extension-token`。:contentReference[oaicite:24]{index=24}  

**验证测试**
- 未配置 API URL 或 Token：扩展 UI 必须提示“未配置”，且不发送导入请求。  
- 配置正确后：触发一次导入，服务器产生 200，DB 新增一条记录。  
- 将 Token 改成错误：导入应返回 401，并在扩展 UI 上有明显错误状态（例如图标变红/提示）。:contentReference[oaicite:25]{index=25}  

---

### 4.3 去重与幂等（避免污染）
**指令**
1. 明确 Tweet 的“唯一键策略”：以 Tweet id 为主键，导入重复时要做到幂等（更新或跳过）。  
2. 定义“重复导入的预期行为”：  
   - 默认跳过重复  
   - 可选参数允许覆盖更新（若你确实需要）。  

**验证测试**
- 对同一条 Tweet 连续导入 2 次：  
  - DB 中只能存在 1 条记录（或记录 count 不变）。  
  - 若选择“覆盖更新”，则字段发生更新但不新增行。

---

## 5. Dashboard 核心功能（List / Filter / Pagination / Delete）

### 5.1 推文列表页：服务端分页 + 来源过滤 + folder 过滤
**指令**
1. 定义 `/api/tweets` 的查询参数集合：`page/pageSize/source/folder/search`。  
2. 所有查询必须以 ownerId 过滤（只看自己的）。:contentReference[oaicite:26]{index=26}  
3. 页面展示必须支持：  
   - 来源（tweet/likes/bookmarks）  
   - folder  
   - 分页  

**验证测试**
- 导入至少 30 条数据后：  
  - page=1/pageSize=20 返回 20 条  
  - page=2 返回剩余 10 条  
- source/folder 过滤能明显改变结果集数量。  
- 未登录访问页面：重定向 `/login`（复测，防回归）。

---

### 5.2 批量删除（最小可用）
**指令**
1. 定义“批量删除”的交互：  
   - 勾选多条  
   - 点击删除  
   - 二次确认  
2. 删除 API 必须只删除 ownerId=当前用户的数据（防越权）。  

**验证测试**
- 删除 3 条：DB 中减少 3 条，列表刷新后不再显示。  
- 对“非本 ownerId 的 id”（手工构造请求）尝试删除：必须失败或无效果（结果集不变）。

---

### 5.3 导出（CSV/JSON）先做 JSON
**指令**
1. 先实现 JSON 导出（最小）。  
2. 导出数据必须只包含当前 ownerId 的数据。  

**验证测试**
- 导出文件中记录数与当前筛选条件一致。  
- 登录态失效后访问导出端点：401 或重定向到登录（按你统一策略）。

---

## 6. 异步 AI 处理管道（Queue → Process → Writeback）

> 关键目标：导入接口要快、AI 在后台慢慢做。:contentReference[oaicite:27]{index=27} :contentReference[oaicite:28]{index=28}  

### 6.1 定义任务状态机（最少字段）
**指令**
1. 采用设计文档中的最小字段方案：  
   - `processed: false/true`  
   - `aiTags[]`  
   - `aiSummary`  
   - `embedding`（vector(1536)）:contentReference[oaicite:29]{index=29}  
2. 定义“失败策略”：  
   - 失败后如何重试（例如保留 processed=false 并记录失败原因字段；或加 retryCount 字段）。  
   - 必须避免无限重试风暴。

**验证测试**
- 导入 5 条新 tweet 后：全部 processed=false。  
- 将其中 1 条标记为“模拟失败”后：重试策略符合预期（不会无限循环，且有可观察的错误记录）。

---

### 6.2 /api/process-queue：小批量处理
**指令**
1. 按技术栈要求使用 Route Handler + Cron 触发。:contentReference[oaicite:30]{index=30}  
2. 每次只取固定小批量（例如 20 条以内），避免单次请求超时。:contentReference[oaicite:31]{index=31}  
3. 明确并发/防重入策略：  
   - 同一条 tweet 在处理期间不能被重复领取处理。  

**验证测试**
- 手动触发处理端点一次：  
  - processed=false 的数量减少（变成 true）  
  - aiTags/aiSummary/embedding 至少部分被填充  
- 并发触发两次（同时发两个请求）：  
  - 不应出现同一条 tweet 被重复处理两次（用处理时间戳或日志/计数验证）。

---

### 6.3 AI 处理内容：tags + summary + embedding
**指令**
1. 按 tech stack 使用：embedding 用 `text-embedding-3-small`，分析用 `gpt-4o-mini`。:contentReference[oaicite:32]{index=32}  
2. 定义输出格式约束：  
   - tags：数组、数量上限、去重、稳定命名（避免每次跑标签飘忽）  
   - summary：一句话、长度上限  
3. 将 AI 输出回写到 Tweet 的 AI 字段。:contentReference[oaicite:33]{index=33}  

**验证测试**
- 选一条内容较长的 tweet：处理后必须出现非空 summary。  
- 选一条内容短的 tweet：tags 不应为空（至少给一个“Other/General”）。  
- embedding 字段存在且维度正确（1536）。:contentReference[oaicite:34]{index=34}  

---

## 7. 混合深度搜索（Hybrid Search：FTS + Vector）

### 7.1 全文索引与查询策略（FTS）
**指令**
1. 明确：FTS 负责“精确关键词”，需要 tsvector + GIN。:contentReference[oaicite:35]{index=35}  
2. 定义“哪些字段参与全文检索”：至少 content（可选 authorHandle 等）。  
3. 搜索结果必须支持高亮或至少返回匹配原因（后续优化可做高亮）。

**验证测试**
- 输入一个明确关键词（只在 1 条 tweet 中出现）：FTS 结果包含该 tweet。  
- 输入不存在的词：结果为空。  
- 同时包含 ownerId 过滤：不同 owner（未来扩展）不会互相看到结果（现在可用构造数据验证）。

---

### 7.2 向量检索策略（Vector）
**指令**
1. 向量检索只对 processed=true 的 tweet 生效（避免空向量导致噪音）。  
2. 明确相似度与阈值策略：  
   - topK（例如 20）  
   - 最低相似度阈值（避免返回无关内容）  

**验证测试**
- 在已有 embedding 的前提下，输入语义相近的 query：返回包含语义相关的 tweet。  
- 在 embedding 为空时：vector 搜索必须自动降级（不报错，返回 FTS 或空）。

---

### 7.3 结果合并与去重（Hybrid）
**指令**
1. 按设计文档：并行查询 FTS 与 Vector，然后合并去重。:contentReference[oaicite:36]{index=36}  
2. 定义排序策略：  
   - FTS 与 Vector 的打分如何融合（最小可行：先按相似度/匹配度分段排序）。  
3. UI 上提供“搜索模式提示”：展示当前结果来自 FTS、Vector 或混合。

**验证测试**
- 同一个 query：  
  - 能同时命中“关键词匹配”的 tweet 和“语义相似但无关键词”的 tweet。  
- 结果集中不会出现重复 tweet（按 id 去重）。

---

## 8. UI 适配 AI 字段（可视化与可控性）

### 8.1 列表展示 AI Tags / Summary
**指令**
1. 在列表中展示：  
   - AI Tags（可折叠）  
   - AI Summary（hover/展开）  
2. 提供“手动触发整理”按钮（触发 `/api/process-queue`）。:contentReference[oaicite:37]{index=37}  

**验证测试**
- 处理过的 tweet：列表可看到 tags/summary。  
- 未处理的 tweet：显示“未整理”状态，并可手动触发后变为已整理。

---

## 9. 稳定性与运维（Cron / 备份 / 监控）

### 9.1 Cron 触发与安全
**指令**
1. 明确 `/api/process-queue` 的触发方式：  
   - 外部 cron 定时访问（系统 cron 或平台 cron）。:contentReference[oaicite:38]{index=38}  
2. 给该端点加一个“内部触发密钥”或仅允许本机调用（二选一），避免被公开滥用。

**验证测试**
- 未携带触发密钥（若启用）：返回 401。  
- 携带触发密钥：返回 200，并且只处理小批量。

---

### 9.2 备份与恢复演练（最小可用）
**指令**
1. 制定备份策略：每日一次 dump（或 volume 级快照）。  
2. 制定恢复演练：在新环境恢复后能正常登录与搜索。

**验证测试**
- 用一份备份在全新容器恢复：  
  - 能登录  
  - 能看到 tweet 列表  
  - 能做一次搜索（FTS 或 hybrid）

---

## 10. 自动化测试（不追求多，但要卡住关键回归）

### 10.1 单元测试（Vitest）
**指令**
1. 选择最关键的纯逻辑：  
   - 导入 payload 解析与规范化（幂等、字段缺省）  
   - 搜索结果合并去重与排序逻辑  
2. 每个逻辑至少 3 个用例：正常/边界/异常。

**验证测试**
- 测试可在 CI 或本地一键跑通，且失败时能指向具体逻辑。

---

### 10.2 端到端冒烟（Playwright）
**指令**
1. 覆盖最关键路径：  
   - 未登录访问 dashboard → 被重定向到 login  
   - 登录成功 → 进入列表页  
   - 搜索框输入 → 返回结果  
   - 批量删除 → 列表数量变化  
2. 测试数据可用“最小种子数据”准备（在测试前导入几条固定 tweet）。

**验证测试**
- 冒烟测试稳定通过（不依赖外部 X.com，不依赖 OpenAI；AI 测试可用 mock/stub 或仅测试“处理接口可调用且写回字段”）。

---

## 11. 最终验收清单（Definition of Done）

1. **别人进不来**：未登录无法访问任何管理页面与读写 API。:contentReference[oaicite:39]{index=39}  
2. **扩展可安全写入**：没有 EXTENSION_TOKEN 无法导入；扩展只写入，不读/删。:contentReference[oaicite:40]{index=40}  
3. **导入快、AI 慢**：导入接口稳定快速，AI 在后台异步完成。:contentReference[oaicite:41]{index=41}  
4. **混合搜索可用**：关键词搜得到，语义也搜得到，结果合并无重复。:contentReference[oaicite:42]{index=42}  
5. **可运维**：docker compose 一键启动；有备份与恢复演练。:contentReference[oaicite:43]{index=43}  

---

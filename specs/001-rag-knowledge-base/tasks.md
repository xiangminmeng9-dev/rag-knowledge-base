# 任务: RAG 智能知识库问答系统

**输入**: 来自 `/specs/001-rag-knowledge-base/` 的设计文档
**前置条件**: plan.md (必需)、spec.md (必需)、research.md、data-model.md、contracts/

**测试**: 功能规范中未明确要求测试，故不包含测试任务。

**组织结构**: 任务按用户故事分组，以便每个故事能够独立实施和测试。

## 格式: `[ID] [P] [Story] 描述`
- **[P]**: 可以并行运行（不同文件，无依赖关系）
- **[Story]**: 此任务属于哪个用户故事（例如: US1、US2、US3）
- 在描述中包含确切的文件路径

## 路径约定
- 单一项目 (Next.js App Router): `src/app/`, `src/lib/`, `src/components/`, `src/types/`

---

## 阶段 1: 设置（共享基础设施）

**目的**: 项目初始化和基本结构

- [x] T001 使用 `pnpm create next-app@latest` 初始化 Next.js 项目（TypeScript, TailwindCSS, App Router, src 目录）
- [x] T002 安装项目依赖: `next-auth@beta`, `prisma`, `@prisma/client`, `langchain`, `@langchain/core`, `@langchain/community`, `@langchain/openai`, `ai`, `chromadb`, `pdf-parse`, `mammoth`, `echarts`, `echarts-for-react`, `bcryptjs`, `zod` 及对应类型声明
- [x] T003 [P] 运行 `pnpm dlx shadcn@latest init` 初始化 shadcn/ui，添加常用基础组件 (Button, Input, Card, Dialog, Table, Select, Tabs, Badge, DropdownMenu, Sheet, Separator, Label, Textarea, Form, Toast)
- [x] T004 [P] 配置 ESLint 和 Prettier，启用 TypeScript strict mode 验证 `tsconfig.json` 中 `strict: true`

---

## 阶段 2: 基础（阻塞前置条件）

**目的**: 在任何用户故事可以实施之前必须完成的核心基础设施

**⚠️ 关键**: 在此阶段完成之前，无法开始任何用户故事工作

- [x] T005 初始化 Prisma (`pnpm prisma init --datasource-provider sqlite`)，在 `prisma/schema.prisma` 中定义完整数据模型: User, KnowledgeBase, UserKnowledgeBaseAccess, Document, Chunk, Conversation, Message, EmbeddingModel, LLMProvider（所有枚举、关系、索引）
- [x] T006 创建 Prisma 迁移并生成客户端 (`pnpm prisma migrate dev`)
- [x] T007 [P] 在 `src/lib/db/prisma.ts` 中创建 Prisma 单例客户端（防止开发环境热更新时重复连接）
- [x] T008 [P] 在 `src/types/index.ts` 中定义全局共享类型: API 响应格式 (`ApiResponse<T>`, `PaginatedResponse<T>`), 角色枚举, 文档状态枚举等
- [x] T009 [P] 在 `src/lib/utils.ts` 中创建通用工具函数: 密码哈希 (bcryptjs), API 错误响应构造器, Zod 校验辅助函数
- [x] T010 在 `src/lib/auth.ts` 中配置 NextAuth.js: Credentials Provider（用户名/密码验证）, JWT 会话策略（在 token 中注入 role 和 userId）, 自定义登录页面路由
- [x] T011 在 `src/middleware.ts` 中实现路由保护中间件: 未登录重定向到登录页, `/admin` 路径仅允许 SUPER_ADMIN 和 KB_ADMIN 角色, `/chat` 路径允许所有已登录用户
- [x] T012 在 `prisma/seed.ts` 中创建种子脚本: 读取环境变量创建默认超级管理员账户, 初始化默认 EmbeddingModel 配置, 配置 `package.json` 的 `prisma.seed` 字段
- [x] T013 [P] 在 `src/lib/rag/chroma-client.ts` 中封装 Chroma DB 客户端: 连接管理, 集合的创建/获取/删除操作
- [x] T014 [P] 在 `src/components/layout/admin-layout.tsx` 中创建后台管理布局组件: 侧边栏导航 (仪表盘、知识库管理、用户管理、系统设置), 顶栏用户信息和登出按钮
- [x] T015 [P] 在 `src/components/layout/chat-layout.tsx` 中创建前台问答布局组件: 侧边栏对话列表, 主区域问答界面

**检查点**: 基础就绪 — 认证系统可用，数据库模型已创建，Chroma 客户端就绪，布局组件可用

---

## 阶段 3: 用户故事 1 - 用户登录与知识库问答（优先级: P1）🎯 MVP

**目标**: 用户能够登录系统，选择知识库，输入问题获得基于知识库内容的智能回答

**独立测试**: 预置一个包含已上传文档的知识库，用户登录后选择该知识库并提问，验证能获得包含引用来源的回答

### 用户故事 1 的实施

- [x] T016 [US1] 在 `src/app/(auth)/login/page.tsx` 中实现登录页面
- [x] T017 [US1] 在 `src/app/api/auth/[...nextauth]/route.ts` 中实现 NextAuth API Route handler
- [x] T018 [US1] 在 `src/app/api/auth/me/route.ts` 中实现 GET 接口
- [x] T019 [P] [US1] 在 `src/lib/llm/provider.ts` 中实现 LLM 提供商集成
- [x] T020 [P] [US1] 在 `src/lib/rag/retriever.ts` 中实现向量检索服务
- [x] T021 [P] [US1] 在 `src/lib/rag/query-rewrite.ts` 中实现查询改写服务
- [x] T022 [US1] 在 `src/lib/rag/chat-engine.ts` 中实现 RAG 问答引擎
- [x] T023 [US1] 在 `src/app/api/knowledge-bases/route.ts` 中实现 GET 接口
- [x] T024 [US1] 在 `src/app/api/chat/conversations/route.ts` 中实现 GET 和 POST
- [x] T025 [US1] 在 `src/app/api/chat/conversations/[id]/messages/route.ts` 中实现 GET 和 POST（SSE 流式响应）
- [x] T026 [US1] 在 `src/app/api/chat/conversations/[id]/route.ts` 中实现 DELETE 接口
- [x] T027 [US1] 在 `src/components/chat/knowledge-base-selector.tsx` 中实现知识库选择器组件
- [x] T028 [US1] 在 `src/components/chat/conversation-list.tsx` 中实现对话列表组件
- [x] T029 [US1] 在 `src/components/chat/message-list.tsx` 中实现消息列表组件
- [x] T030 [US1] 在 `src/components/chat/chat-input.tsx` 中实现问答输入组件
- [x] T031 [US1] 在 `src/components/chat/query-rewrite-badge.tsx` 中实现查询改写展示组件
- [x] T032 [US1] 在 `src/app/(chat)/page.tsx` 中组装前台问答页面

**检查点**: 用户可以登录 → 选择知识库 → 进行多轮问答 → 查看引用来源 → 切换查询改写。此时 MVP 可用。

---

## 阶段 4: 用户故事 2 - 超级管理员用户管理与权限配置（优先级: P1）

**目标**: 超级管理员能够创建、编辑、禁用用户并分配角色和知识库访问权限

**独立测试**: 超级管理员登录后台，创建不同角色用户，分别登录验证权限隔离

### 用户故事 2 的实施

- [x] T033 [US2] 在 `src/app/api/users/route.ts` 中实现 GET（分页查询用户列表，支持角色/状态筛选）和 POST（创建用户: 校验用户名唯一性, 密码哈希, 分配角色, 批量创建知识库授权关系）
- [x] T034 [US2] 在 `src/app/api/users/[id]/route.ts` 中实现 PUT（编辑用户: 更新基本信息/角色/状态, 禁止禁用最后一个 SUPER_ADMIN, 更新知识库授权关系）
- [x] T035 [P] [US2] 在 `src/app/api/users/[id]/knowledge-bases/route.ts` 中实现 GET 接口: 获取指定用户已授权的知识库列表
- [x] T036 [US2] 在 `src/components/admin/user-table.tsx` 中实现用户列表表格组件: shadcn/ui Table 展示用户列表, 支持角色/状态筛选, 分页, 编辑/禁用操作按钮
- [x] T037 [US2] 在 `src/components/admin/user-form-dialog.tsx` 中实现用户创建/编辑弹窗组件: shadcn/ui Dialog + Form, 用户名/密码/角色表单, 知识库多选授权 (从 GET /api/knowledge-bases 获取可选列表), Zod 校验
- [x] T038 [US2] 在 `src/app/(admin)/users/page.tsx` 中组装用户管理页面: 集成用户表格和创建弹窗, 页面标题 + "创建用户"按钮

**检查点**: 超级管理员可以管理用户 → 创建不同角色用户 → 分配知识库权限 → 禁用/启用用户

---

## 阶段 5: 用户故事 3 - 知识库创建与文档上传（优先级: P1）

**目标**: 管理员能够创建知识库并上传多种格式的文档，文档自动完成解析和处理

**独立测试**: 管理员创建知识库，分别上传 PDF/Word/TXT/Markdown 文件，确认处理完成后可用于问答

### 用户故事 3 的实施

- [x] T039 [P] [US3] 在 `src/lib/rag/parsers/pdf-parser.ts` 中实现 PDF 解析器: 使用 pdf-parse 提取文本内容
- [x] T040 [P] [US3] 在 `src/lib/rag/parsers/docx-parser.ts` 中实现 Word 解析器: 使用 mammoth 提取文本内容
- [x] T041 [P] [US3] 在 `src/lib/rag/parsers/text-parser.ts` 中实现 TXT/Markdown 解析器: 使用 fs 读取文本内容
- [x] T042 [US3] 在 `src/lib/rag/parsers/index.ts` 中创建解析器工厂: 根据文件格式分发到对应解析器
- [x] T043 [US3] 在 `src/lib/rag/document-processor.ts` 中实现文档处理管道: 文件解析 → 文本提取 → 更新文档状态为 PROCESSING → 调用切分器 → 调用 embedding 向量化 → 存入 Chroma → 更新状态为 COMPLETED（失败则标记 FAILED 并记录错误信息）
- [x] T044 [US3] 在 `src/app/api/knowledge-bases/route.ts` 中追加 POST 接口: 创建知识库 (名称, 描述, embeddingModelId), 自动生成唯一的 chromaCollectionName, 在 Chroma 中创建集合
- [x] T045 [US3] 在 `src/app/api/knowledge-bases/[id]/route.ts` 中实现 GET（知识库详情, 含文档数/块数统计）, PUT（编辑知识库, 检测 embeddingModelId 变更并返回 requiresReprocessing 标志）, DELETE（级联删除: 文档/块/授权/对话 + Chroma 集合）
- [x] T046 [US3] 在 `src/app/api/knowledge-bases/[id]/documents/route.ts` 中实现 GET（分页文档列表, 支持状态筛选）和 POST（multipart/form-data 文件上传: 校验格式/大小/内容, 保存文件, 创建 Document 记录, 异步触发文档处理管道）
- [x] T047 [US3] 在 `src/app/api/knowledge-bases/[id]/documents/[docId]/route.ts` 中实现 DELETE（删除文档 + 清理 Chroma 中对应向量数据）
- [x] T048 [US3] 在 `src/app/api/knowledge-bases/[id]/documents/[docId]/status/route.ts` 中实现 GET 接口: 返回文档处理状态（用于前端轮询）
- [x] T049 [US3] 在 `src/components/admin/knowledge-base-card.tsx` 中实现知识库卡片组件: 展示名称、描述、文档数、embedding 模型, 编辑/删除操作
- [x] T050 [US3] 在 `src/components/admin/knowledge-base-form-dialog.tsx` 中实现知识库创建/编辑弹窗: 名称/描述表单, embedding 模型选择下拉框
- [x] T051 [US3] 在 `src/components/admin/document-upload.tsx` 中实现文档上传组件: 拖拽/点击上传区域, 文件格式校验 (PDF/DOCX/TXT/MD), 大小校验 (50MB), 支持批量上传, 上传进度展示
- [x] T052 [US3] 在 `src/components/admin/document-table.tsx` 中实现文档列表表格: 文件名、格式、大小、上传时间、处理状态 (Badge 颜色区分), 删除操作, 处理中状态自动轮询刷新
- [x] T053 [US3] 在 `src/app/(admin)/knowledge-bases/page.tsx` 中组装知识库列表页面: 知识库卡片网格布局 + "新建知识库"按钮
- [x] T054 [US3] 在 `src/app/(admin)/knowledge-bases/[id]/page.tsx` 中组装知识库详情页面: 基本信息 + 编辑按钮, 文档上传组件, 文档列表表格

**检查点**: 管理员可以创建/编辑/删除知识库 → 上传多种格式文档 → 文档自动处理 → 处理状态实时展示

---

## 阶段 6: 用户故事 4 - 文档切分策略配置（优先级: P2）

**目标**: 管理员在上传文档时可以选择不同的切分策略并设置重叠比例

**独立测试**: 上传同一文档分别使用不同切分策略，对比生成的块数量

### 用户故事 4 的实施

- [x] T055 [P] [US4] 在 `src/lib/rag/splitters/recursive-splitter.ts` 中实现递归切分器: 使用 LangChain RecursiveCharacterTextSplitter, 支持自定义块大小和 overlap
- [x] T056 [P] [US4] 在 `src/lib/rag/splitters/semantic-splitter.ts` 中实现语义切分器: 基于语义边界（段落/句子语义相似度）进行切分
- [x] T057 [P] [US4] 在 `src/lib/rag/splitters/paragraph-splitter.ts` 中实现段落切分器: 按空行/换行分割段落
- [x] T058 [P] [US4] 在 `src/lib/rag/splitters/fixed-size-splitter.ts` 中实现固定大小切分器: 按指定字符数切分, 支持自定义 chunkSize (默认 500)
- [x] T059 [P] [US4] 在 `src/lib/rag/splitters/special-char-splitter.ts` 中实现特殊字符切分器: 按指定分隔符 (如 `---`, `===`, `***`) 切分
- [x] T060 [US4] 在 `src/lib/rag/splitters/index.ts` 中创建切分器工厂: 根据 chunkStrategy 枚举分发到对应切分器, 统一 overlap 百分比参数处理
- [x] T061 [US4] 在 `src/components/admin/chunk-config.tsx` 中实现切分配置组件: 策略选择下拉框 (5 种策略), 重叠比例滑块 (0%-50%), 固定大小策略时显示块大小输入框, 默认值提示
- [x] T062 [US4] 更新 `src/components/admin/document-upload.tsx`: 在上传表单中集成切分配置组件, 将切分参数随文件一起提交到 POST /api/knowledge-bases/:kbId/documents

**检查点**: 管理员上传文档时可选择切分策略 → 设置重叠比例 → 不同策略产生不同数量的文档块

---

## 阶段 7: 用户故事 5 - Embedding 模型选择与向量存储（优先级: P2）

**目标**: 管理员可以为知识库选择不同的 embedding 模型，切换模型后支持重新处理

**独立测试**: 创建知识库时选择不同 embedding 模型，上传文档后验证向量数据存储到 Chroma 对应集合中

### 用户故事 5 的实施

- [x] T063 [US5] 在 `src/lib/rag/embeddings.ts` 中实现 embedding 模型集成: 从数据库读取 EmbeddingModel 配置, 创建 LangChain Embeddings 实例, 支持多提供商 (OpenAI Embeddings 等)
- [x] T064 [US5] 在 `src/app/api/settings/embedding-models/route.ts` 中实现 GET（获取可用模型列表）和 POST（添加新模型配置）
- [x] T065 [US5] 在 `src/app/api/knowledge-bases/[id]/reprocess/route.ts` 中实现 POST 接口: 重新处理知识库中所有文档（删除旧向量数据, 使用新模型重新向量化, 批量更新状态）
- [x] T066 [US5] 更新 `src/lib/rag/document-processor.ts`: 从知识库关联的 EmbeddingModel 配置获取 embedding 实例, 使用该模型进行向量化
- [x] T067 [US5] 更新 `src/components/admin/knowledge-base-form-dialog.tsx`: 从 GET /api/settings/embedding-models 获取模型列表, 在创建/编辑表单中添加 embedding 模型选择下拉框, 编辑时如果切换模型则显示重新处理确认提示

**检查点**: 管理员可选择 embedding 模型 → 文档使用选定模型向量化 → 切换模型后可重新处理

---

## 阶段 8: 用户故事 6 - 后台仪表盘与统计概览（优先级: P2）

**目标**: 管理员首页展示系统关键统计数据，以图表形式可视化

**独立测试**: 创建知识库并上传文档后，验证仪表盘数据准确且图表正常渲染

### 用户故事 6 的实施

- [x] T068 [US6] 在 `src/app/api/dashboard/stats/route.ts` 中实现 GET 接口: 查询并返回知识库总数、文档总数、用户总数、块总数, 按状态/格式分组的文档统计, 最近活动记录
- [x] T069 [P] [US6] 在 `src/components/charts/stats-card.tsx` 中实现统计卡片组件: 数字 + 标签 + 图标, 用于展示单个指标（如知识库总数）
- [x] T070 [P] [US6] 在 `src/components/charts/document-status-chart.tsx` 中实现文档状态饼图组件: 使用 ECharts 按状态（已完成/处理中/失败）展示文档分布
- [x] T071 [P] [US6] 在 `src/components/charts/document-format-chart.tsx` 中实现文档格式柱状图组件: 使用 ECharts 按格式（PDF/DOCX/TXT/MD）展示文档数量
- [x] T072 [P] [US6] 在 `src/components/charts/recent-activity.tsx` 中实现最近活动列表组件: 展示最近的文档上传、知识库创建、用户创建等活动
- [x] T073 [US6] 在 `src/app/(admin)/dashboard/page.tsx` 中组装仪表盘页面: 顶部统计卡片行, 中间图表区域（状态饼图 + 格式柱状图）, 底部最近活动列表

**检查点**: 管理员进入后台首页 → 看到准确的统计数字 → 图表正常渲染 → 数据变更后刷新更新

---

## 阶段 9: 用户故事 7 - 查询改写（优先级: P3）

**目标**: 用户输入模糊查询时系统自动优化，提升检索和回答质量

**独立测试**: 输入模糊查询，验证改写后检索结果更准确，并可查看改写内容

注意: 查询改写核心逻辑已在阶段 3 (T021) 中实现，此阶段主要完善 UI 交互。

### 用户故事 7 的实施

- [x] T074 [US7] 更新 `src/components/chat/chat-input.tsx`: 添加查询改写开关 (shadcn/ui Switch), 将 enableQueryRewrite 参数传递给 POST /api/chat/conversations/:id/messages
- [x] T075 [US7] 更新 `src/components/chat/message-list.tsx`: 在用户消息上方展示查询改写信息（可折叠区域: "原始查询: ..." / "改写后: ..."），仅在 originalQuery 和 rewrittenQuery 存在时显示

**检查点**: 用户可开关查询改写 → 改写后的查询可见（可折叠） → 关闭改写后直接使用原始输入

---

## 阶段 10: 系统配置（横切关注点）

**目的**: 超级管理员可在后台配置 LLM 提供商和系统设置

- [x] T076 在 `src/app/api/settings/llm-providers/route.ts` 中实现 GET（列表, apiKey 不返回）和 POST（添加, 如果 isActive 则自动将其他设为 false）
- [x] T077 在 `src/app/api/settings/llm-providers/[id]/route.ts` 中实现 PUT（更新配置, isActive 互斥逻辑）和 DELETE（禁止删除激活的提供商）
- [x] T078 在 `src/components/admin/llm-provider-table.tsx` 中实现 LLM 提供商管理表格: 名称/API 地址/模型/激活状态, 添加/编辑/删除/切换激活操作
- [x] T079 在 `src/components/admin/embedding-model-table.tsx` 中实现 embedding 模型管理表格: 名称/提供商/模型 ID/维度/默认标志, 添加操作
- [x] T080 在 `src/app/(admin)/settings/page.tsx` 中组装系统设置页面: LLM 提供商管理表格 + Embedding 模型管理表格, Tab 切换布局

---

## 阶段 11: 完善与横切关注点

**目的**: 影响多个用户故事的改进

- [x] T081 [P] 在 `src/app/(admin)/layout.tsx` 中集成后台管理布局, 设置默认重定向到仪表盘页面
- [x] T082 [P] 在 `src/app/(chat)/layout.tsx` 中集成前台问答布局
- [x] T083 [P] 在 `src/app/(auth)/layout.tsx` 中创建认证页面布局（居中卡片样式）
- [x] T084 添加全局错误处理: `src/app/error.tsx` (全局错误边界), `src/app/not-found.tsx` (404 页面)
- [x] T085 在 `src/app/page.tsx` 中实现根路由: 已登录用户根据角色重定向（管理员→仪表盘, 问答用户→问答页面）, 未登录→登录页
- [x] T086 运行 quickstart.md 验证: 完整走通从安装到问答的流程

---

## 依赖关系与执行顺序

### 阶段依赖关系

- **设置（阶段 1）**: 无依赖关系 — 可立即开始
- **基础（阶段 2）**: 依赖于设置完成 — 阻塞所有用户故事
- **用户故事（阶段 3-9）**: 都依赖于基础阶段完成
  - US1 (P1): 可在基础后立即开始 — MVP
  - US2 (P1): 可在基础后开始，与 US1 可并行
  - US3 (P1): 可在基础后开始，与 US1/US2 可并行
  - US4 (P2): 依赖 US3（切分器集成到文档处理管道）
  - US5 (P2): 依赖 US3（embedding 集成到文档处理管道）
  - US6 (P2): 可独立，但有数据后效果更好
  - US7 (P3): 依赖 US1（改写是问答的增强）
- **系统配置（阶段 10）**: 可在基础后开始，与用户故事并行
- **完善（阶段 11）**: 依赖于所有期望的用户故事完成

### 并行机会

- T003 + T004 可并行（不同配置文件）
- T007 + T008 + T009 + T013 + T014 + T015 可并行（不同文件）
- T019 + T020 + T021 可并行（不同 lib 文件）
- T039 + T040 + T041 可并行（不同解析器文件）
- T055 + T056 + T057 + T058 + T059 可并行（不同切分器文件）
- T069 + T070 + T071 + T072 可并行（不同图表组件）
- T081 + T082 + T083 可并行（不同布局文件）
- US2 和 US3 可由不同开发人员并行处理

---

## 实施策略

### 仅 MVP（仅用户故事 1）

1. 完成阶段 1: 设置
2. 完成阶段 2: 基础
3. 完成阶段 3: 用户故事 1（使用种子数据预置知识库和文档）
4. **停止并验证**: 用户可以登录 → 选择知识库 → 提问 → 获得回答
5. 可部署/演示

### 增量交付

1. 设置 + 基础 → 基础就绪
2. US1 → 验证 → 部署（MVP）
3. US2 + US3 并行 → 验证 → 部署（完整管理能力）
4. US4 + US5 + US6 → 验证 → 部署（高级功能）
5. US7 → 验证 → 部署（体验优化）
6. 系统配置 + 完善 → 最终发布

---

## 注意事项

- [P] 任务 = 不同文件，无依赖关系
- [Story] 标签将任务映射到特定用户故事以实现可追溯性
- 每个用户故事应该独立可完成和可测试
- 在每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- 避免: 模糊任务、相同文件冲突、破坏独立性的跨故事依赖

# 技术调研与选型: RAG 智能知识库问答系统

## 1. 认证与会话管理 (Authentication)
**需求**: 基于会话的认证 (JWT token)，支持三种角色（超级管理员、知识库管理员、问答用户）。
**Decision**: 使用 **NextAuth.js (Auth.js v5)**
**Rationale**:
- Auth.js 是 Next.js 生态中最成熟的认证库，原生支持 App Router 和 Edge Runtime
- 提供了极其简单的 Credentials Provider 支持自定义用户名/密码登录
- 支持基于 JWT 的无状态会话，适合中小型项目
- 可以通过回调轻松在 session 中注入自定义角色字段（`role`）
**Alternatives considered**:
- **jose (手动实现 JWT)**: 虽然可控性强，但需要自己处理 cookie 管理、过期续期、CSRF 防护等，增加了不必要的复杂度，不符合简单优先原则。
- **Clerk/Auth0**: 第三方托管服务，虽然功能强大但引入了外部依赖，对于小型内部团队系统来说过度设计。

## 2. 关系型数据访问 (ORM)
**需求**: 访问 SQLite 文件数据库，管理用户、知识库、对话历史等元数据，全栈强类型支持。
**Decision**: 使用 **Prisma**
**Rationale**:
- 拥有目前 TS 生态中最好的开发体验和类型推导能力
- 对于 SQLite 支持极佳，`schema.prisma` 定义直观清晰
- 支持一键生成全栈可用的强类型模型
- 提供方便的数据迁移工具 (`prisma migrate`)
**Alternatives considered**:
- **Drizzle ORM**: 性能更好，SQL 控制力更强，但 schema 定义较为繁琐，生态和文档不如 Prisma 成熟，对于简单的 CRUD 需求而言 Prisma 的开发效率更高。
- **TypeORM**: 过于沉重，装饰器语法在最新的 Next.js 环境中可能存在兼容性问题。

## 3. RAG 与 LLM 集成框架
**需求**: 多格式文档解析、切分、向量化（存入 Chroma）、检索、查询改写、多轮对话。
**Decision**: 使用 **LangChain.js** + **Vercel AI SDK (仅用于前端流式渲染)**
**Rationale**:
- **LangChain.js**: 提供了 RAG 所需的完整工具链：各种文档加载器（PDF, Docx, Text）、文本切分器（RecursiveCharacterTextSplitter 等）、Chroma 集成以及各种 LLM 提供商的支持封装。这避免了我们手动编写大量底层对接代码。
- **Vercel AI SDK**: 用于在 Next.js 路由和前端组件之间轻松建立流式响应 (Streaming) 连接，提供极佳的用户体验 (`useChat` hook)。
**Alternatives considered**:
- **纯手动实现 (Fetch + OpenAI SDK)**: 对于文档解析和 Chroma 对接需要编写大量样板代码，尤其是处理不同切分策略时过于复杂。
- **LlamaIndex.TS**: 也是优秀的 RAG 框架，但社区规模和中间件生态不如 LangChain 丰富。

## 4. 测试框架
**需求**: 全栈单元测试和集成测试。
**Decision**: 使用 **Vitest** + **React Testing Library**
**Rationale**:
- Vitest 原生支持 TypeScript 和 ESM，无需复杂的 Babel 或 ts-node 配置
- 速度远快于 Jest，API 与 Jest 兼容，迁移成本极低
- 在现代前端生态中已成为构建工具链（如 Vite/Next.js 等）的标配测试工具
**Alternatives considered**:
- **Jest**: 配置较为繁琐（特别是处理 ESM 和 Next.js 特定模块时），运行速度较慢。

## 5. 文档解析依赖库 (Document Parsers)
**Decision**:
- PDF: `pdf-parse` (成熟轻量)
- Word (.docx): `mammoth` (纯 JS 实现，无原生依赖)
- Markdown/TXT: Node.js 原生 `fs` / 字符串处理

## 结论
所有待澄清的技术细节均已确定，整体技术栈符合"Next.js 全栈"、"简单优先"、"类型安全"的核心原则。

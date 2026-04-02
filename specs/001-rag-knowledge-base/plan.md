# 实施计划: RAG 智能知识库问答系统

**分支**: `001-rag-knowledge-base` | **日期**: 2026-03-30 | **规范**: [spec.md](./spec.md)
**输入**: 来自 `/specs/001-rag-knowledge-base/spec.md` 的功能规范

## 摘要

系统通过基于 Next.js App Router 的全栈架构实现 RAG 知识库问答功能。前端使用 TailwindCSS + shadcn/ui，图表使用 ECharts。后端使用 API Route 实现：基于角色的多用户认证体系、多格式文档的解析与切分、支持多种 embedding 模型的向量化存储（使用 Chroma），以及带上下文记忆的多轮对话问答和查询改写能力。数据存储采用 SQLite (通过 ORM)。

## 技术背景

**语言/版本**: TypeScript 5.x (Strict mode)
**主要依赖**:
- 框架: Next.js 15 (App Router)
- UI: TailwindCSS, shadcn/ui, ECharts
- 认证: NextAuth.js (Auth.js v5) + Credentials Provider
- ORM: Prisma (SQLite adapter)
- RAG/AI: LangChain.js (文档处理/检索/LLM 对接) + Vercel AI SDK (前端流式渲染)
- 文档解析: pdf-parse (PDF), mammoth (DOCX), 原生 fs (TXT/Markdown)
**存储**:
- 关系数据: SQLite (via Prisma)
- 向量数据: Chroma DB
**测试**: Vitest + React Testing Library
**目标平台**: Web 浏览器 (Chrome, Safari, Edge, Firefox)
**项目类型**: 单一项目 (Next.js 全栈)
**性能目标**: 问答响应时间 < 10 秒；支持同时处理 5 个文档上传；仪表盘数据 30 秒内更新
**约束条件**: 文档大小限制默认 50MB；所有后端接口必须使用 API Route 实现；禁止使用 Express/Fastify 等独立后端框架
**规模/范围**: 小型团队（< 50 用户，< 10 知识库）

## 章程检查

*门控: 必须在阶段 0 研究前通过. 阶段 1 设计后重新检查. *

✅ **Next.js 全栈统一**: 计划完全遵循。所有后端功能将设计在 `app/api/` 下。
✅ **UI 组件规范**: 计划完全遵循。使用 TailwindCSS + shadcn/ui 和 ECharts，不引入其他 UI 库。
✅ **知识库驱动的 RAG 架构**: 计划完全遵循。设计围绕知识库为核心实体，包含完整的文档处理到检索生成流程。
✅ **简单优先**: 计划完全遵循。使用 SQLite 单文件数据库，适合小团队规模，避免了部署独立数据库服务的复杂性。
✅ **类型安全**: 计划完全遵循。全栈使用 TypeScript 严格模式，并依靠 ORM 生成强类型。

*结论*: 门控通过，无违反章程的架构决策。

## 项目结构

### 文档(此功能)

```
specs/001-rag-knowledge-base/
├── plan.md              # 此文件
├── research.md          # 阶段 0 输出
├── data-model.md        # 阶段 1 输出
├── quickstart.md        # 阶段 1 输出
├── contracts/           # 阶段 1 输出
└── tasks.md             # 阶段 2 输出
```

### 源代码(仓库根目录)

```
src/
├── app/
│   ├── (auth)/        # 登录页面
│   ├── (admin)/       # 后台管理页面 (仅管理员)
│   ├── (chat)/        # 前台问答页面
│   └── api/           # 后端 API 接口 (全栈唯一入口)
├── components/        # shadcn/ui 和自定义业务组件
│   ├── ui/            # 基础 UI 组件
│   └── charts/        # ECharts 图表组件
├── lib/               # 共享工具和核心逻辑
│   ├── db/            # SQLite 连接与 ORM 配置
│   ├── rag/           # RAG 核心逻辑 (解析、切分、向量化、检索)
│   └── llm/           # LLM 提供商集成接口
└── types/             # 全局 TypeScript 类型声明
```

**结构决策**: 采用 Next.js App Router 的标准结构 (App Router + `src/` 目录)。业务逻辑尽量从路由处理程序中抽离到 `lib/`，以保证代码可测试性。

## 章程检查 (阶段 1 设计后重新检查)

✅ **Next.js 全栈统一**: 所有 API 合同均设计为 `/api/` 路径。无独立后端框架。
✅ **UI 组件规范**: 仪表盘图表使用 ECharts，UI 组件使用 shadcn/ui，无其他 UI 库。
✅ **知识库驱动的 RAG 架构**: 数据模型以 KnowledgeBase 为核心，文档处理包含解析→切分→向量化→存储完整流程。支持 5 种切分策略。
✅ **简单优先**: SQLite 单文件数据库，Prisma ORM 零配置。依赖数量最小化。
✅ **类型安全**: Prisma 生成强类型模型，API 合同定义了明确的请求/响应类型，Zod 用于运行时输入校验。

*结论*: 阶段 1 设计后重新检查通过，无违规。

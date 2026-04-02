<!--
## 同步影响报告

- **版本更改**: 0.0.0 → 1.0.0 (初始版本)
- **修改的原则列表**: N/A (首次创建)
- **添加的部分**:
  - 核心原则 (5 项)
  - 技术栈约束
  - 开发工作流程
  - 治理
- **删除的部分**: 无
- **需要更新的模板**:
  - `.specify/templates/plan-template.md` — ✅ 无需更新 (通用模板, 与章程兼容)
  - `.specify/templates/spec-template.md` — ✅ 无需更新 (通用模板, 与章程兼容)
  - `.specify/templates/tasks-template.md` — ✅ 无需更新 (通用模板, 与章程兼容)
  - `.specify/templates/agent-file-template.md` — ✅ 无需更新
  - `.specify/templates/checklist-template.md` — ✅ 无需更新
- **后续 TODO**: 无
-->

# RAG 智能问答系统 项目章程

## 核心原则

### I. Next.js 全栈统一

所有后端接口 MUST 使用 Next.js App Router 的 API Route (`app/api/`) 实现。
前端与后端在同一 Next.js 项目中, 禁止引入独立的后端服务框架
(如 Express、Fastify 等)。API Route 是唯一的服务端入口。

**理由**: 统一技术栈降低部署复杂度, 前后端共享类型定义,
简化开发和运维流程。

### II. UI 组件规范

前端组件 MUST 基于 TailwindCSS + shadcn/ui 构建。
- 禁止使用其他 UI 组件库 (如 Ant Design, Material UI 等)
- 自定义组件 MUST 遵循 shadcn/ui 的设计模式和主题系统
- 图表展示 MUST 使用 ECharts, 禁止使用其他图表库
  (如 Recharts, Chart.js 等)

**理由**: 保持 UI 一致性, 避免多套样式系统冲突,
ECharts 提供丰富的可视化能力满足数据展示需求。

### III. 知识库驱动的 RAG 架构

系统 MUST 以知识库为核心组织单元:
- 用户在前台 MUST 能够选择知识库后进行智能问答
- 后台管理 MUST 支持创建知识库、上传文档
- 文档上传 MUST 支持多种格式 (至少包括 PDF, Word, TXT, Markdown)
- 检索增强生成 (RAG) 流程 MUST 包含: 文档解析 → 分块 → 向量化 →
  存储 → 检索 → 生成

**理由**: 知识库隔离确保不同领域知识不会交叉污染,
多格式支持降低用户使用门槛。

### IV. 简单优先

从最简单的可工作方案开始, 仅在需求明确证明时引入复杂性。
- 优先使用 Next.js 内置能力, 避免不必要的第三方依赖
- 数据模型从最小字段集开始, 按需扩展
- 不做过早抽象, 不为假设性需求编码 (YAGNI)

**理由**: 降低认知负担, 加速交付, 避免过度工程化。

### V. 类型安全

全栈 MUST 使用 TypeScript 严格模式。
- `tsconfig.json` 中 MUST 启用 `strict: true`
- 禁止使用 `any` 类型, 除非有明确的技术原因并添加注释说明
- API 请求/响应 MUST 定义明确的类型接口

**理由**: 类型安全在编译期捕获错误, 减少运行时异常,
提升代码可维护性和重构信心。

## 技术栈约束

- **框架**: Next.js (App Router)
- **语言**: TypeScript (strict mode)
- **样式**: TailwindCSS
- **UI 组件**: shadcn/ui
- **图表**: ECharts
- **向量数据库**: 根据实际需求选择 (如 Pinecone, Weaviate, Chroma 等)
- **LLM 接口**: 根据实际需求选择 (如 OpenAI API, Claude API 等)
- **文档解析**: 支持 PDF, DOCX, TXT, Markdown 等格式
- **包管理器**: 统一使用一种 (推荐 pnpm)

## 开发工作流程

- 每个功能从功能规范开始, 经过计划、任务分解后实施
- 代码提交 MUST 遵循 Conventional Commits 规范
- 组件开发 SHOULD 遵循单一职责原则, 保持组件粒度适中
- API Route MUST 包含输入验证和错误处理
- 敏感配置 (API Key 等) MUST 通过环境变量管理, 禁止硬编码

## 治理

本章程是项目所有开发决策的最高准则。任何与章程冲突的实践 MUST
以章程为准。

**修正程序**:
1. 提出修正提案, 说明变更内容和理由
2. 评估对现有代码和模板的影响
3. 更新章程文件并递增版本号
4. 同步更新所有受影响的模板和文档

**版本控制策略**:
- MAJOR: 删除或重新定义核心原则
- MINOR: 添加新原则或实质性扩展现有指导
- PATCH: 措辞澄清、拼写修复、非语义优化

**合规审查**: 所有 PR 和代码审查 SHOULD 验证是否符合章程原则。

**版本**: 1.0.0 | **批准日期**: 2026-03-30 | **最后修正**: 2026-03-30

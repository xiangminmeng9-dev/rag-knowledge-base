# 数据模型: RAG 智能知识库问答系统

## 实体关系概览

```
User ──< UserKnowledgeBaseAccess >── KnowledgeBase ──< Document ──< Chunk
  │                                        │
  └──< Conversation ──< Message            │
                                    LLMProvider (系统配置)
                                    EmbeddingModel (系统配置)
```

## 实体定义

### User (用户)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| username | String | UNIQUE, NOT NULL | 登录用户名 |
| passwordHash | String | NOT NULL | 加密后的密码哈希 |
| role | Enum (SUPER_ADMIN, KB_ADMIN, QA_USER) | NOT NULL, DEFAULT QA_USER | 用户角色 |
| status | Enum (ACTIVE, DISABLED) | NOT NULL, DEFAULT ACTIVE | 账户状态 |
| createdAt | DateTime | NOT NULL, DEFAULT now | 创建时间 |
| updatedAt | DateTime | NOT NULL, AUTO | 更新时间 |

**验证规则**:
- username: 2-50 字符，仅允许字母、数字、下划线
- 密码（输入时）: 最少 8 字符
- 禁止删除或禁用最后一个 SUPER_ADMIN 账户

---

### KnowledgeBase (知识库)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| name | String | NOT NULL | 知识库名称 |
| description | String | NULLABLE | 知识库描述 |
| embeddingModelId | String | FK → EmbeddingModel.id, NOT NULL | 关联的 embedding 模型 |
| chromaCollectionName | String | UNIQUE, NOT NULL | Chroma 中的集合名称（用于隔离） |
| createdAt | DateTime | NOT NULL, DEFAULT now | 创建时间 |
| updatedAt | DateTime | NOT NULL, AUTO | 更新时间 |

**验证规则**:
- name: 1-100 字符，不允许为空
- 切换 embeddingModelId 时需触发所有关联文档的重新处理

---

### UserKnowledgeBaseAccess (用户-知识库授权)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| userId | String | FK → User.id, NOT NULL | 用户 |
| knowledgeBaseId | String | FK → KnowledgeBase.id, NOT NULL | 知识库 |
| createdAt | DateTime | NOT NULL, DEFAULT now | 授权时间 |

**约束**: (userId, knowledgeBaseId) 联合唯一索引

---

### Document (文档)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| knowledgeBaseId | String | FK → KnowledgeBase.id, NOT NULL | 所属知识库 |
| fileName | String | NOT NULL | 原始文件名 |
| fileFormat | Enum (PDF, DOCX, TXT, MARKDOWN) | NOT NULL | 文件格式 |
| fileSize | Int | NOT NULL | 文件大小（字节） |
| filePath | String | NOT NULL | 存储路径 |
| chunkStrategy | Enum (SEMANTIC, RECURSIVE, PARAGRAPH, FIXED_SIZE, SPECIAL_CHAR) | NOT NULL, DEFAULT RECURSIVE | 切分策略 |
| chunkOverlapPercent | Int | NOT NULL, DEFAULT 10 | 重叠比例 (0-50) |
| chunkSize | Int | NULLABLE | 切分块大小（仅固定大小策略时使用，默认 500） |
| status | Enum (UPLOADING, PROCESSING, COMPLETED, FAILED) | NOT NULL, DEFAULT UPLOADING | 处理状态 |
| errorMessage | String | NULLABLE | 失败时的错误信息 |
| chunkCount | Int | DEFAULT 0 | 生成的文档块数量 |
| uploadedAt | DateTime | NOT NULL, DEFAULT now | 上传时间 |
| processedAt | DateTime | NULLABLE | 处理完成时间 |

**状态转换**:
```
UPLOADING → PROCESSING → COMPLETED
                ↓
              FAILED
```

**验证规则**:
- fileSize: 不超过 50MB (52,428,800 字节)
- chunkOverlapPercent: 0 ≤ value ≤ 50
- chunkSize: 仅在 chunkStrategy = FIXED_SIZE 时生效，最小值 100

---

### Chunk (文档块)

说明: 文档块的向量表示存储在 Chroma 中，SQLite 仅存储元数据。

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键，同时作为 Chroma 中的文档 ID |
| documentId | String | FK → Document.id, NOT NULL | 所属文档 |
| content | String | NOT NULL | 文本内容 |
| position | Int | NOT NULL | 在文档中的顺序位置 |
| metadata | String (JSON) | NULLABLE | 附加元数据（如页码、标题等） |
| createdAt | DateTime | NOT NULL, DEFAULT now | 创建时间 |

---

### Conversation (对话)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| userId | String | FK → User.id, NOT NULL | 对话所属用户 |
| knowledgeBaseId | String | FK → KnowledgeBase.id, NOT NULL | 对话关联的知识库 |
| title | String | NULLABLE | 对话标题（可由首条消息自动生成） |
| createdAt | DateTime | NOT NULL, DEFAULT now | 创建时间 |
| updatedAt | DateTime | NOT NULL, AUTO | 最后更新时间 |

---

### Message (消息)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| conversationId | String | FK → Conversation.id, NOT NULL | 所属对话 |
| role | Enum (USER, ASSISTANT) | NOT NULL | 消息角色 |
| content | String | NOT NULL | 消息内容 |
| originalQuery | String | NULLABLE | 原始用户查询（仅当 role=USER 且启用了改写时） |
| rewrittenQuery | String | NULLABLE | 改写后的查询（仅当 role=USER 且启用了改写时） |
| sources | String (JSON) | NULLABLE | 引用来源（仅 role=ASSISTANT 时, JSON 格式存储引用的文档块信息） |
| createdAt | DateTime | NOT NULL, DEFAULT now | 创建时间 |

---

### EmbeddingModel (Embedding 模型配置)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| name | String | UNIQUE, NOT NULL | 模型显示名称 |
| provider | String | NOT NULL | 提供商标识 (如 openai, local) |
| modelId | String | NOT NULL | 模型 ID (如 text-embedding-3-small) |
| dimensions | Int | NOT NULL | 向量维度 |
| isDefault | Boolean | DEFAULT false | 是否为默认模型 |

---

### LLMProvider (LLM 提供商配置)

| 字段 | 类型 | 约束 | 说明 |
| ---- | ---- | ---- | ---- |
| id | String (CUID) | PK | 主键 |
| name | String | NOT NULL | 提供商显示名称 (如 OpenAI, Claude, 通义千问) |
| apiBaseUrl | String | NOT NULL | API 地址 |
| apiKey | String (Encrypted) | NOT NULL | API 密钥（加密存储） |
| modelId | String | NOT NULL | 默认模型 ID (如 gpt-4o, claude-sonnet-4-20250514) |
| isActive | Boolean | DEFAULT false | 是否为当前激活的 LLM 提供商 |

**约束**: 有且仅有一个 isActive=true 的提供商

## 级联删除规则

- 删除 **KnowledgeBase** → 级联删除其下所有 Document、Chunk（含 Chroma 中的向量数据）、UserKnowledgeBaseAccess、Conversation
- 删除 **Document** → 级联删除其下所有 Chunk（含 Chroma 中的向量数据）
- 禁用 **User** → 保留数据但阻止登录，对话历史保留

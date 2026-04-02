# API 合同: 知识库管理接口

基础路径: `/api/knowledge-bases`
权限: SUPER_ADMIN, KB_ADMIN

## GET /api/knowledge-bases

获取知识库列表

对于 QA_USER: 仅返回已授权的知识库

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "embeddingModel": {
        "id": "string",
        "name": "string"
      },
      "documentCount": "number",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

## POST /api/knowledge-bases

创建知识库

**请求**:
```json
{
  "name": "string (required, 1-100 chars)",
  "description": "string (optional)",
  "embeddingModelId": "string (required)"
}
```

**成功响应** (201):
```json
{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "embeddingModelId": "string",
  "createdAt": "ISO8601"
}
```

---

## GET /api/knowledge-bases/:id

获取知识库详情

**成功响应** (200):
```json
{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "embeddingModel": {
    "id": "string",
    "name": "string",
    "provider": "string"
  },
  "documentCount": "number",
  "chunkCount": "number",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

---

## PUT /api/knowledge-bases/:id

编辑知识库

**请求**:
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "embeddingModelId": "string (optional)"
}
```

如果 embeddingModelId 变更且知识库中已有文档，返回需确认的警告。

**成功响应** (200):
```json
{
  "id": "string",
  "name": "string",
  "requiresReprocessing": "boolean",
  "updatedAt": "ISO8601"
}
```

---

## DELETE /api/knowledge-bases/:id

删除知识库（级联删除文档、向量数据、授权关系、对话）

**成功响应** (200):
```json
{ "success": true }
```

---

## POST /api/knowledge-bases/:id/reprocess

重新处理知识库中所有文档（切换 embedding 模型后触发）

**成功响应** (202):
```json
{
  "message": "重新处理任务已启动",
  "documentCount": "number"
}
```

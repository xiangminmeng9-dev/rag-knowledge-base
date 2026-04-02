# API 合同: 仪表盘与系统配置接口

## 仪表盘

基础路径: `/api/dashboard`
权限: SUPER_ADMIN, KB_ADMIN

### GET /api/dashboard/stats

获取系统统计概览

**成功响应** (200):
```json
{
  "knowledgeBaseCount": "number",
  "documentCount": "number",
  "userCount": "number",
  "chunkCount": "number",
  "documentsByStatus": {
    "COMPLETED": "number",
    "PROCESSING": "number",
    "FAILED": "number"
  },
  "documentsByFormat": {
    "PDF": "number",
    "DOCX": "number",
    "TXT": "number",
    "MARKDOWN": "number"
  },
  "recentActivity": [
    {
      "type": "DOCUMENT_UPLOADED | KB_CREATED | USER_CREATED",
      "description": "string",
      "timestamp": "ISO8601"
    }
  ]
}
```

---

## 系统配置

基础路径: `/api/settings`
权限: 仅 SUPER_ADMIN

### GET /api/settings/llm-providers

获取 LLM 提供商配置列表

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "apiBaseUrl": "string",
      "modelId": "string",
      "isActive": "boolean"
    }
  ]
}
```

注意: apiKey 不在列表响应中返回

---

### POST /api/settings/llm-providers

添加 LLM 提供商配置

**请求**:
```json
{
  "name": "string (required)",
  "apiBaseUrl": "string (required)",
  "apiKey": "string (required)",
  "modelId": "string (required)",
  "isActive": "boolean (optional, default: false)"
}
```

**成功响应** (201):
```json
{
  "id": "string",
  "name": "string",
  "apiBaseUrl": "string",
  "modelId": "string",
  "isActive": "boolean"
}
```

---

### PUT /api/settings/llm-providers/:id

更新 LLM 提供商配置

**请求**:
```json
{
  "name": "string (optional)",
  "apiBaseUrl": "string (optional)",
  "apiKey": "string (optional)",
  "modelId": "string (optional)",
  "isActive": "boolean (optional)"
}
```

当设置 `isActive: true` 时，其他提供商自动设为 `isActive: false`

---

### DELETE /api/settings/llm-providers/:id

删除 LLM 提供商配置

**错误响应**:
- 400: `{ "error": "不能删除当前激活的提供商" }`

---

### GET /api/settings/embedding-models

获取可用的 embedding 模型列表

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "provider": "string",
      "modelId": "string",
      "dimensions": "number",
      "isDefault": "boolean"
    }
  ]
}
```

---

### POST /api/settings/embedding-models

添加 embedding 模型配置

**请求**:
```json
{
  "name": "string (required)",
  "provider": "string (required)",
  "modelId": "string (required)",
  "dimensions": "number (required)",
  "isDefault": "boolean (optional)"
}
```

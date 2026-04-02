# API 合同: 智能问答接口

基础路径: `/api/chat`
权限: 所有已登录用户（基于知识库授权）

## GET /api/chat/conversations

获取当前用户的对话列表

**查询参数**:
- `knowledgeBaseId` (string, optional): 按知识库筛选

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "knowledgeBaseId": "string",
      "knowledgeBaseName": "string",
      "title": "string | null",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ]
}
```

---

## POST /api/chat/conversations

创建新对话

**请求**:
```json
{
  "knowledgeBaseId": "string (required)"
}
```

**成功响应** (201):
```json
{
  "id": "string",
  "knowledgeBaseId": "string",
  "createdAt": "ISO8601"
}
```

**错误响应**:
- 403: `{ "error": "无权访问该知识库" }`
- 400: `{ "error": "该知识库暂无可用内容" }`

---

## GET /api/chat/conversations/:id/messages

获取对话的消息历史

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "role": "USER | ASSISTANT",
      "content": "string",
      "originalQuery": "string | null",
      "rewrittenQuery": "string | null",
      "sources": [
        {
          "chunkId": "string",
          "content": "string (snippet)",
          "documentName": "string",
          "position": "number"
        }
      ],
      "createdAt": "ISO8601"
    }
  ]
}
```

---

## POST /api/chat/conversations/:id/messages

发送问题并获取 AI 回答（流式响应）

**请求**:
```json
{
  "content": "string (required, 用户问题)",
  "enableQueryRewrite": "boolean (optional, default: true)"
}
```

**成功响应** (200, `text/event-stream`):

流式返回格式 (Server-Sent Events):
```
data: {"type": "query_rewrite", "original": "...", "rewritten": "..."}
data: {"type": "sources", "sources": [...]}
data: {"type": "content", "delta": "..."}
data: {"type": "content", "delta": "..."}
data: {"type": "done", "messageId": "..."}
```

**错误响应**:
- 403: `{ "error": "无权访问该对话" }`
- 400: `{ "error": "问题内容不能为空" }`

---

## DELETE /api/chat/conversations/:id

删除对话及其所有消息

**成功响应** (200):
```json
{ "success": true }
```

# API 合同: 文档管理接口

基础路径: `/api/knowledge-bases/:kbId/documents`
权限: SUPER_ADMIN, KB_ADMIN

## GET /api/knowledge-bases/:kbId/documents

获取知识库下的文档列表

**查询参数**:
- `page` (number, optional, default: 1)
- `pageSize` (number, optional, default: 20)
- `status` (string, optional): 按处理状态筛选

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "fileName": "string",
      "fileFormat": "PDF | DOCX | TXT | MARKDOWN",
      "fileSize": "number (bytes)",
      "status": "UPLOADING | PROCESSING | COMPLETED | FAILED",
      "chunkStrategy": "SEMANTIC | RECURSIVE | PARAGRAPH | FIXED_SIZE | SPECIAL_CHAR",
      "chunkOverlapPercent": "number",
      "chunkCount": "number",
      "errorMessage": "string | null",
      "uploadedAt": "ISO8601",
      "processedAt": "ISO8601 | null"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

---

## POST /api/knowledge-bases/:kbId/documents

上传文档

**请求**: `multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| file | File | 是 | 文档文件 (PDF, DOCX, TXT, MD) |
| chunkStrategy | string | 否 | 切分策略, 默认 RECURSIVE |
| chunkOverlapPercent | number | 否 | 重叠比例 (0-50), 默认 10 |
| chunkSize | number | 否 | 块大小 (仅 FIXED_SIZE 策略), 默认 500 |

**成功响应** (202):
```json
{
  "id": "string",
  "fileName": "string",
  "fileFormat": "string",
  "fileSize": "number",
  "status": "UPLOADING",
  "chunkStrategy": "string",
  "chunkOverlapPercent": "number"
}
```

**错误响应**:
- 400: `{ "error": "不支持的文件格式，支持: PDF, DOCX, TXT, Markdown" }`
- 400: `{ "error": "文件大小超出限制 (50MB)" }`
- 400: `{ "error": "文件内容为空" }`

---

## DELETE /api/knowledge-bases/:kbId/documents/:docId

删除文档（级联删除文档块和 Chroma 中的向量数据）

**成功响应** (200):
```json
{ "success": true }
```

---

## GET /api/knowledge-bases/:kbId/documents/:docId/status

获取文档处理状态（用于轮询）

**成功响应** (200):
```json
{
  "id": "string",
  "status": "UPLOADING | PROCESSING | COMPLETED | FAILED",
  "chunkCount": "number",
  "errorMessage": "string | null",
  "processedAt": "ISO8601 | null"
}
```

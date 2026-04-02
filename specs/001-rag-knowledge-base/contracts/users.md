# API 合同: 用户管理接口

基础路径: `/api/users`
权限: 仅 SUPER_ADMIN

## GET /api/users

获取用户列表

**查询参数**:
- `page` (number, optional, default: 1)
- `pageSize` (number, optional, default: 20)
- `role` (string, optional): 按角色筛选
- `status` (string, optional): 按状态筛选

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "username": "string",
      "role": "SUPER_ADMIN | KB_ADMIN | QA_USER",
      "status": "ACTIVE | DISABLED",
      "createdAt": "ISO8601"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

---

## POST /api/users

创建新用户

**请求**:
```json
{
  "username": "string (required, 2-50 chars)",
  "password": "string (required, min 8 chars)",
  "role": "SUPER_ADMIN | KB_ADMIN | QA_USER (required)",
  "knowledgeBaseIds": ["string"]
}
```

**成功响应** (201):
```json
{
  "id": "string",
  "username": "string",
  "role": "string",
  "status": "ACTIVE",
  "createdAt": "ISO8601"
}
```

**错误响应**:
- 400: `{ "error": "用户名已存在" }` / `{ "error": "参数验证失败", "details": [...] }`

---

## PUT /api/users/:id

编辑用户信息

**请求**:
```json
{
  "username": "string (optional)",
  "password": "string (optional)",
  "role": "string (optional)",
  "status": "ACTIVE | DISABLED (optional)",
  "knowledgeBaseIds": ["string"]
}
```

**成功响应** (200):
```json
{
  "id": "string",
  "username": "string",
  "role": "string",
  "status": "string",
  "updatedAt": "ISO8601"
}
```

**错误响应**:
- 400: `{ "error": "不能禁用最后一个超级管理员" }`
- 404: `{ "error": "用户不存在" }`

---

## GET /api/users/:id/knowledge-bases

获取用户已授权的知识库列表

**成功响应** (200):
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ]
}
```

# API 合同: 认证接口

基础路径: `/api/auth`

## POST /api/auth/login

用户登录

**请求**:
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**成功响应** (200):
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "role": "SUPER_ADMIN | KB_ADMIN | QA_USER"
  },
  "token": "string (JWT)"
}
```

**错误响应**:
- 401: `{ "error": "用户名或密码错误" }`
- 403: `{ "error": "账户已被禁用" }`

---

## POST /api/auth/logout

用户登出

**请求**: 无请求体 (需携带认证 token)

**成功响应** (200):
```json
{ "success": true }
```

---

## GET /api/auth/me

获取当前登录用户信息

**请求**: 无请求体 (需携带认证 token)

**成功响应** (200):
```json
{
  "id": "string",
  "username": "string",
  "role": "SUPER_ADMIN | KB_ADMIN | QA_USER",
  "status": "ACTIVE"
}
```

**错误响应**:
- 401: `{ "error": "未登录" }`

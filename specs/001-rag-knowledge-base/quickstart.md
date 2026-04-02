# 快速启动: RAG 智能知识库问答系统

## 前提条件

- Node.js >= 18
- pnpm (推荐包管理器)
- Chroma DB 实例 (本地或远程)

## 初始化项目

```bash
# 创建 Next.js 项目
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir

# 安装核心依赖
pnpm add next-auth@beta prisma @prisma/client
pnpm add langchain @langchain/core @langchain/community @langchain/openai
pnpm add ai
pnpm add chromadb
pnpm add pdf-parse mammoth
pnpm add echarts echarts-for-react
pnpm add bcryptjs jsonwebtoken
pnpm add zod

# 安装开发依赖
pnpm add -D @types/bcryptjs @types/jsonwebtoken
pnpm add -D vitest @vitejs/plugin-react @testing-library/react
pnpm add -D prisma

# 初始化 shadcn/ui
pnpm dlx shadcn@latest init

# 初始化 Prisma (SQLite)
pnpm prisma init --datasource-provider sqlite
```

## 环境变量

创建 `.env.local`:

```env
# 数据库
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Chroma
CHROMA_URL="http://localhost:8000"

# 默认超级管理员 (仅首次初始化)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123456"
```

## 启动 Chroma DB

```bash
# 使用 Docker
docker run -p 8000:8000 chromadb/chroma

# 或使用 pip
pip install chromadb
chroma run --host localhost --port 8000
```

## 开发流程

```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev

# 初始化种子数据 (创建超级管理员)
pnpm prisma db seed

# 启动开发服务器
pnpm dev
```

## 验证

1. 访问 `http://localhost:3000` → 应显示登录页
2. 使用管理员账号登录 → 应进入后台仪表盘
3. 创建知识库 → 应成功并显示在列表中
4. 上传文档 → 应显示处理进度并最终完成
5. 切换到前台问答 → 应能选择知识库并提问

## 运行测试

```bash
pnpm vitest
```

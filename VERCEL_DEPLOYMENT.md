# Vercel 部署指南

本文档详细说明如何将日语学习应用部署到 Vercel。

## 前提条件

1. 一个 [Vercel](https://vercel.com) 账号
2. 一个 PostgreSQL 数据库（推荐以下服务之一）
3. Anthropic Claude API Key（用于AI功能）

## 步骤 1: 准备数据库

### 推荐的数据库服务

#### 选项 A: Neon (强烈推荐)
1. 访问 [Neon](https://neon.tech/)
2. 创建免费账号并新建数据库
3. 获取连接字符串（格式：`postgresql://user:password@host/database?sslmode=require`）
4. Neon提供免费的serverless PostgreSQL，非常适合Vercel部署

#### 选项 B: Vercel Postgres
1. 在Vercel Dashboard中添加Postgres存储
2. 自动集成到你的项目
3. 获取连接字符串

#### 选项 C: Railway
1. 访问 [Railway](https://railway.app/)
2. 创建新项目并添加 PostgreSQL 数据库
3. 复制连接字符串

#### 选项 D: Supabase
1. 访问 [Supabase](https://supabase.com/)
2. 创建项目并获取数据库连接字符串
3. 免费套餐包含500MB数据库

### 初始化数据库

在本地运行数据库迁移：

```bash
# 1. 创建 .env 文件
cp .env.example .env

# 2. 编辑 .env 文件，填入你的 DATABASE_URL

# 3. 安装依赖
pnpm install

# 4. 运行数据库迁移
pnpm run db:push
```

## 步骤 2: 获取 API Keys

### Anthropic Claude API Key
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册并创建API Key
3. 记录下你的 API Key（格式：`sk-ant-api03-...`）
4. 确保账户有足够的余额（Claude API按使用量付费）

### JWT Secret
生成一个随机的强密码用于 JWT 加密：

```bash
openssl rand -base64 32
```

## 步骤 3: 部署到 Vercel

### 方法 A: 通过 Vercel Dashboard (推荐)

1. 访问 [Vercel Dashboard](https://vercel.com/new)
2. 导入你的 Git 仓库
3. 配置项目：
   - **Framework Preset**: Other
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `pnpm install`

4. 配置环境变量（Environment Variables）：

   ```
   DATABASE_URL=your-database-connection-string
   JWT_SECRET=your-generated-jwt-secret
   BUILT_IN_FORGE_API_KEY=your-forge-api-key
   NODE_ENV=production
   VITE_APP_ID=japanese-learning-app
   OAUTH_SERVER_URL=your-oauth-server-url
   OWNER_OPEN_ID=your-owner-open-id
   ```

5. 点击 **Deploy** 开始部署

### 方法 B: 通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
pnpm add -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel

# 4. 添加环境变量
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add BUILT_IN_FORGE_API_KEY
# ... 添加其他环境变量

# 5. 重新部署
vercel --prod
```

## 步骤 4: 验证部署

部署完成后：

1. 访问 Vercel 提供的域名
2. 检查页面是否正常加载
3. 测试以下功能：
   - 用户登录
   - 词汇列表加载
   - AI 助手对话
   - 学习单元访问

## 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `DATABASE_URL` | ✅ | PostgreSQL 数据库连接字符串（格式：`postgresql://...`） |
| `JWT_SECRET` | ✅ | JWT 加密密钥（使用强随机字符串） |
| `BUILT_IN_FORGE_API_KEY` | ✅ | Anthropic Claude API 密钥（格式：`sk-ant-api03-...`） |
| `NODE_ENV` | ✅ | 设置为 `production` |
| `VITE_APP_ID` | ⚠️ | 应用 ID（可选，用于识别） |
| `OAUTH_SERVER_URL` | ⚠️ | OAuth 服务器地址（如需OAuth登录） |
| `OWNER_OPEN_ID` | ⚠️ | 管理员 OpenID（设置后该用户为管理员） |
| `BUILT_IN_FORGE_API_URL` | ❌ | API地址（可选，默认为 https://api.anthropic.com） |
| `PORT` | ❌ | 端口号（Vercel 会自动设置，无需配置） |

## 常见问题

### 1. 数据库连接失败

**问题**: `Error: connect ETIMEDOUT` 或 `Error: Access denied`

**解决方案**:
- 检查 `DATABASE_URL` 是否正确（必须是PostgreSQL连接字符串）
- 确保数据库允许来自 Vercel 的连接
- 对于 Neon，确保使用了 `?sslmode=require` 参数
- 检查连接字符串格式：`postgresql://user:password@host/database?sslmode=require`

### 2. 构建失败

**问题**: `Build failed` 或 `Type error`

**解决方案**:
```bash
# 在本地测试构建
pnpm run build

# 检查类型错误
pnpm run check
```

### 3. API 调用失败

**问题**: API 路由返回 404 或 500

**解决方案**:
- 检查 `vercel.json` 配置是否正确
- 查看 Vercel 的函数日志（Functions → Logs）
- 确认 `BUILT_IN_FORGE_API_KEY` 已正确配置

### 4. 静态资源 404

**问题**: CSS、JS 文件加载失败

**解决方案**:
- 确认构建输出目录为 `dist/public`
- 检查 `vercel.json` 中的路由配置

### 5. OAuth 登录失败

**问题**: 登录重定向失败或 OAuth 回调错误

**解决方案**:
- 确认 `OAUTH_SERVER_URL` 已正确配置
- 在 OAuth 服务提供商处添加 Vercel 域名到允许的回调 URL 列表
- 检查 `JWT_SECRET` 是否已设置

## 性能优化建议

1. **启用缓存**: 在 `vercel.json` 中配置静态资源缓存
2. **使用 CDN**: Vercel 自动提供全球 CDN
3. **数据库优化**:
   - 使用连接池
   - 为常用查询添加索引
   - 考虑使用 Redis 缓存热数据
4. **函数优化**:
   - 减少 serverless function 的冷启动时间
   - 优化数据库查询

## 监控和日志

1. 访问 Vercel Dashboard → 你的项目 → Analytics 查看性能指标
2. 访问 Functions → Logs 查看 API 日志
3. 使用 Vercel 的实时日志功能调试问题

## 更新部署

每次推送到主分支时，Vercel 会自动重新部署。你也可以：

```bash
# 手动触发部署
vercel --prod

# 部署到预览环境（用于测试）
vercel
```

## 自定义域名

1. 访问 Vercel Dashboard → Settings → Domains
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录
4. 等待 SSL 证书自动生成

## 回滚

如果新版本有问题：

1. 访问 Vercel Dashboard → Deployments
2. 找到上一个稳定版本
3. 点击 "Promote to Production"

## 技术支持

如遇到问题：
- 查看 [Vercel 文档](https://vercel.com/docs)
- 检查项目的 GitHub Issues
- 联系开发团队

---

**祝部署顺利！** 🚀

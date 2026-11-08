# 瞬刻 Moments API

瞬刻（Moments）的后端服务：Express 5 + Prisma + MySQL。

> 前端是独立的 `moments-web` 仓库（Nuxt 4，SSR + SEO），两个项目分开开发、构建与部署。
> 本服务只提供 `/api/**` 接口与本地 `/upload/**` 静态文件，不再托管任何页面。

## 快速开始

```bash
pnpm install
cp .env.example .env      # 按需修改 DATABASE_URL / JWT_SECRET
pnpm db:setup             # prisma generate + migrate deploy + 种子数据
pnpm dev                  # tsx watch，默认 http://localhost:9889
```

生产构建与启动：

```bash
pnpm build                # prisma generate && tsc -> dist/
pnpm start                # node dist/bootstrap.js
```

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `HOST` / `PORT` | 监听地址，默认 `0.0.0.0:9889` |
| `DATABASE_URL` | MySQL 连接串 |
| `JWT_SECRET` | Access Token 签名密钥，生产环境必须为 32 位以上随机串 |
| `JWT_ACCESS_EXPIRES_SECONDS` | Access Token 有效期（默认 900） |
| `JWT_REFRESH_EXPIRES_SECONDS` | Refresh Token 有效期（默认 30 天） |
| `TRUST_PROXY` | 反向代理跳数；直连时不要设置 |
| `AUTH_COOKIE_SECURE` | 强制 Refresh Cookie 的 Secure 属性（默认按 HTTPS 自动判断） |
| `AUTH_COOKIE_SAME_SITE` | `lax` / `strict` / `none` |
| `CORS_ORIGINS` | 直连 API 时允许的前端 Origin，逗号分隔 |

## 接口一览

| 前缀 | 说明 |
| --- | --- |
| `/api/auth` | 注册、登录、刷新、OAuth、登出、找回密码 |
| `/api/user` | 当前用户资料、修改密码、公开用户信息 |
| `/api/articles` | 内容列表 / 详情 / 发布 / 编辑 / 点赞 / 评论 |
| `/api/comments` | 评论创建与删除 |
| `/api/link` | 友情链接 |
| `/api/notices`、`/api/notice` | 通知中心、邮箱验证码、人机验证 |
| `/api/admin` | 后台管理（用户、文章、评论、友链、站点配置） |
| `/api/upload` | 本地上传 / S3 兼容对象存储 |
| `/api/location` | 发布内容时的 IP 归属地 |
| `/api/sitemap` | 供 Nuxt 生成 sitemap.xml 的公开索引（文章 id、用户 username、标签） |

## 与 moments-web 的配合

- 浏览器访问的是 Nuxt 站点，`/api/**` 由 Nuxt 的 Nitro 反向代理到本服务（同源，Refresh Cookie 可正常回传）。
- 生产环境请把 `moments-web` 的 `NUXT_API_PROXY_TARGET` 指向本服务地址，例如 `http://127.0.0.1:9889`。
- 本地存储模式下，上传文件落在 `public/upload/YYYY/MM/`，由本服务的静态中间件提供，Nuxt 会代理 `/upload/**`。
- 使用对象存储（S3 / R2）时，上传接口返回完整 URL，无需经过代理。

## 部署

```bash
docker build -t moments-api:latest .
docker run -d --env-file .env -p 9889:9889 -v $(pwd)/public/upload:/app/public/upload moments-api:latest
```

容器启动时会自动执行 `prisma migrate deploy`。

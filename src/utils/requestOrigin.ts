import type { Request } from 'express'

function configuredOrigins() {
  const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  if (process.env.NODE_ENV !== 'production') {
    // Nuxt 前端默认端口（3000 生产 / 3100 本地联调）
    origins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3100',
      'http://127.0.0.1:3100',
    )
  }

  return new Set(origins)
}

const allowedOrigins = configuredOrigins()

export function isCorsOriginAllowed(origin: string) {
  return allowedOrigins.has(origin)
}

/**
 * 只有显式信任反向代理（TRUST_PROXY）时，才采信 X-Forwarded-Host。
 * Nuxt 的 /api 代理会写入该头，使 Origin 校验对齐用户实际访问的域名。
 */
function forwardedOrigin(req: Request) {
  const trustProxy = req.app.get('trust proxy')
  if (!trustProxy) return ''

  const forwardedHost = (req.get('x-forwarded-host') || '').split(',')[0]?.trim()
  if (!forwardedHost) return ''

  return `${req.protocol}://${forwardedHost}`
}

export function isRequestOriginTrusted(req: Request) {
  const origin = req.get('origin')
  if (!origin) return true

  const requestOrigin = `${req.protocol}://${req.get('host')}`
  const proxiedOrigin = forwardedOrigin(req)

  return origin === requestOrigin
    || (proxiedOrigin !== '' && origin === proxiedOrigin)
    || allowedOrigins.has(origin)
}

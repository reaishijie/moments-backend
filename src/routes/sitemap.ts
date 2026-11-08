import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { Logger } from '../utils/logger.js'
import { rateLimit } from '../middleware/rateLimit.middleware.js'

const router = Router()
const logger = new Logger('SitemapRoute')

// 公开接口：限制单 IP 的请求频率，避免被用来做全站枚举或压垮数据库
const sitemapLimit = rateLimit({
    bucket: 'sitemap-ip',
    windowMs: 60 * 1000,
    max: 120,
    message: '请求过于频繁，请稍后再试',
})

const MAX_ARTICLES = 5000
const MAX_USERS = 5000
const MAX_TAGS = 2000

/**
 * 供 moments-web 的 sitemap.xml 使用的公开索引。
 *
 * 只暴露 id / username / name / updated_at，不包含任何隐私字段，
 * 避免为了生成站点地图而放开用户列表接口。
 */
router.get('/', sitemapLimit, async (_req, res) => {
    try {
        const [articles, users, tags] = await Promise.all([
            prisma.articles.findMany({
                where: { status: 1, deleted_at: null },
                select: { id: true, updated_at: true },
                orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
                take: MAX_ARTICLES,
            }),
            prisma.users.findMany({
                // 只输出有已发布内容的用户，避免把空主页暴露给搜索引擎
                where: {
                    status: 1,
                    deleted_at: null,
                    articles: { some: { status: 1, deleted_at: null } },
                },
                select: { username: true, updated_at: true },
                orderBy: { id: 'asc' },
                take: MAX_USERS,
            }),
            prisma.tags.findMany({
                select: { name: true },
                orderBy: { name: 'asc' },
                take: MAX_TAGS,
            }),
        ])

        res.status(200).json({
            articles: articles.map(article => ({
                id: article.id.toString(),
                updated_at: article.updated_at,
            })),
            users: users.map(user => ({
                username: user.username,
                updated_at: user.updated_at,
            })),
            tags: tags.map(tag => ({ name: tag.name })),
        })
    } catch (error) {
        logger.error('生成 sitemap 数据失败:', error instanceof Error ? error.stack : String(error))
        res.status(500).json({ error: '服务器内部错误' })
    }
})

export default router

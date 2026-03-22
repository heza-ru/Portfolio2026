/**
 * Writes public/robots.txt and public/sitemap.xml before production builds.
 * Set VITE_SITE_URL in .env (or the environment) to your canonical origin, e.g. https://yoursite.com
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function readEnvSiteUrl() {
    try {
        const raw = readFileSync(resolve(root, '.env'), 'utf8')
        const line = raw.split('\n').find((l) => l.trim().startsWith('VITE_SITE_URL='))
        if (!line) return null
        const v = line.split('=').slice(1).join('=').trim()
        return v.replace(/^["']|["']$/g, '') || null
    } catch {
        return null
    }
}

const siteUrl = (process.env.VITE_SITE_URL || readEnvSiteUrl() || 'https://example.com').replace(/\/$/, '')

const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`

writeFileSync(resolve(root, 'public', 'robots.txt'), robots)
writeFileSync(resolve(root, 'public', 'sitemap.xml'), sitemap)

console.log(`[generate-seo] SITE_URL=${siteUrl} → robots.txt, sitemap.xml`)

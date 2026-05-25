import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { getPublishedArticleIds } from './src/data/logPosts.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname)

function logArticleHtmlInputs() {
    return Object.fromEntries(
        getPublishedArticleIds().map(id => [
            `logs-${id}`,
            resolve(__dirname, `logs/${id}/index.html`),
        ]),
    )
}

/** Copy OG preview image to public so /og-image.png is a stable absolute URL for meta tags. */
function copyOgImageFromSnapshot() {
    const src = resolve(root, 'src/assets/snapshot.png')
    const dest = resolve(root, 'public/og-image.png')
    if (!existsSync(src)) {
        console.warn('[vite] src/assets/snapshot.png not found — og:image will 404 until you add it')
        return
    }
    copyFileSync(src, dest)
}

/** Copy `logs/articles/{id}/images/` into dist so `/logs/articles/...` URLs work in production. */
function copyLogArticleImagesToDist() {
    const articlesRoot = resolve(root, 'logs/articles')
    if (!existsSync(articlesRoot)) {
        return
    }
    const distArticles = resolve(root, 'dist/logs/articles')
    for (const dirent of readdirSync(articlesRoot, { withFileTypes: true })) {
        if (!dirent.isDirectory()) {
            continue
        }
        const id = dirent.name
        const from = resolve(articlesRoot, id, 'images')
        if (!existsSync(from) || !statSync(from).isDirectory()) {
            continue
        }
        const to = resolve(distArticles, id, 'images')
        mkdirSync(to, { recursive: true })
        for (const file of readdirSync(from)) {
            if (file.endsWith('.png')) continue
            const src = resolve(from, file)
            if (statSync(src).isFile()) {
                copyFileSync(src, resolve(to, file))
            }
        }
    }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const siteUrl = (
        env.VITE_SITE_URL ||
        (mode === 'development' ? 'http://localhost:5173' : 'https://example.com')
    ).replace(/\/$/, '')

    return {
        plugins: [
            react(),
            {
                /* In dev, Vite doesn't auto-map /labs → labs/index.html etc.
                   This plugin rewrites the URL before the HTML transform. */
                name: 'subpage-routing',
                configureServer(server) {
                    server.middlewares.use((req, _res, next) => {
                        const raw = req.url || '/'
                        const q = raw.includes('?') ? `?${raw.split('?')[1]}` : ''
                        const pathOnly = raw.split('?')[0]
                        const logArticle = pathOnly.match(/^\/logs\/(\d+)\/?$/)
                        if (logArticle) {
                            req.url = `/logs/${logArticle[1]}/index.html${q}`
                        } else if (pathOnly === '/labs' || pathOnly === '/labs/') {
                            req.url = `/labs/index.html${q}`
                        } else if (pathOnly === '/logs' || pathOnly === '/logs/') {
                            req.url = `/logs/index.html${q}`
                        } else if (pathOnly === '/404' || pathOnly === '/404.html') {
                            req.url = `/404.html${q}`
                        }
                        next()
                    })
                },
            },
            {
                name: 'copy-og-image',
                buildStart() {
                    copyOgImageFromSnapshot()
                },
                configureServer() {
                    copyOgImageFromSnapshot()
                },
            },
            {
                name: 'inject-site-url',
                transformIndexHtml(html) {
                    return html.replace(/%SITE_URL%/g, siteUrl)
                },
            },
            {
                name: 'copy-log-article-images',
                writeBundle() {
                    copyLogArticleImagesToDist()
                },
            },
        ],
        build: {
            rollupOptions: {
                input: {
                    main:       resolve(__dirname, 'index.html'),
                    labs:       resolve(__dirname, 'labs/index.html'),
                    logs:       resolve(__dirname, 'logs/index.html'),
                    notFound:   resolve(__dirname, '404.html'),
                    ...logArticleHtmlInputs(),
                },
                output: {
                    manualChunks: {
                        'vendor-three': ['three'],
                        'vendor-gsap': ['gsap'],
                        'vendor-motion': ['framer-motion'],
                        'vendor-react': ['react', 'react-dom'],
                    },
                },
            },
        },
    }
})

import { copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname)

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
                        if (req.url === '/labs' || req.url === '/labs/')         req.url = '/labs/index.html'
                        else if (req.url === '/logs' || req.url === '/logs/')    req.url = '/logs/index.html'
                        else if (req.url === '/404' || req.url === '/404.html')  req.url = '/404.html'
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
        ],
        build: {
            rollupOptions: {
                input: {
                    main:       resolve(__dirname, 'index.html'),
                    labs:       resolve(__dirname, 'labs/index.html'),
                    logs:       resolve(__dirname, 'logs/index.html'),
                    notFound:   resolve(__dirname, '404.html'),
                },
            },
        },
    }
})

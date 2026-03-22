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
                    main: resolve(__dirname, 'index.html'),
                    labs: resolve(__dirname, 'labs/index.html'),
                    logs: resolve(__dirname, 'logs/index.html'),
                },
            },
        },
    }
})

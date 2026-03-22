/**
 * Generates PNG favicons from src/assets/favicon.svg at multiple sizes.
 * Run once (or whenever the source SVG changes): npm run generate:favicons
 * The outputs are committed to public/ so no build-time dependency on sharp.
 */
import sharp from 'sharp'
import { copyFileSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'src/assets/favicon.svg')
const svgBuffer = readFileSync(svgPath)

const SIZES = [
    { file: 'favicon-16x16.png',    size: 16  },
    { file: 'favicon-32x32.png',    size: 32  },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'icon-192x192.png',     size: 192 },
    { file: 'icon-512x512.png',     size: 512 },
]

for (const { file, size } of SIZES) {
    await sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(resolve(root, 'public', file))
    console.log(`[favicons] ✓ ${file} (${size}×${size})`)
}

copyFileSync(svgPath, resolve(root, 'public/favicon.svg'))
console.log('[favicons] ✓ favicon.svg copied to public/')

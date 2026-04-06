/**
 * Generates PNG favicons from src/assets/favicon.svg at multiple sizes.
 * Run once (or whenever the source SVG changes): npm run generate:favicons
 * The outputs are committed to public/ so no build-time dependency on sharp.
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'src/assets/favicon.svg')

const svgRaw = readFileSync(svgPath, 'utf8')

// Dark fill on white background for PNGs (home screen icons, apple-touch-icon)
const svgDarkFill = svgRaw.replace(/<path /g, '<path fill="#0A0A0A" ')
const svgBuffer   = Buffer.from(svgDarkFill)

const SIZES = [
    { file: 'favicon-16x16.png',    size: 16  },
    { file: 'favicon-32x32.png',    size: 32  },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'icon-192x192.png',     size: 192 },
    { file: 'icon-512x512.png',     size: 512 },
]

for (const { file, size } of SIZES) {
    await sharp(svgBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .png()
        .toFile(resolve(root, 'public', file))
    console.log(`[favicons] ✓ ${file} (${size}×${size})`)
}

// White-fill SVG for the browser tab (works on both light and dark chrome)
const svgWhiteFill = svgRaw.replace(/<path /g, '<path fill="white" ')
writeFileSync(resolve(root, 'public/favicon.svg'), svgWhiteFill)
console.log('[favicons] ✓ favicon.svg (white fill) written to public/')

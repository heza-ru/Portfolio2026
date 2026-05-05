/**
 * Normalize filenames under logs/articles/8/images/ and write .avif siblings (sharp).
 * Safe to re-run only on a fresh export: it expects original long filenames.
 */
import { existsSync, readdirSync, renameSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..', 'logs', 'articles', '8', 'images')

async function toAvif(pngPath, avifPath) {
    await sharp(pngPath).avif({ quality: 55, effort: 6 }).toFile(avifPath)
}

function renameIfPresent(from, base) {
    const fromPath = join(root, from)
    const pngPath = join(root, `${base}.png`)
    if (!existsSync(fromPath)) return false
    renameSync(fromPath, pngPath)
    return true
}

function renameChatGptExports() {
    const files = readdirSync(root).filter(
        f => f.startsWith('ChatGPT') && f.endsWith('.png'),
    )
    const withParens = files.find(f => /\s\(1\)\.png$/.test(f))
    const main = files.find(f => !/\s\(1\)\.png$/.test(f))
    if (main) {
        renameSync(main, join(root, 'chart-1-goblin-gremlin-frequency.png'))
    }
    if (withParens) {
        renameSync(withParens, join(root, 'extra-goblin-gremlin-conversations.png'))
    }
}

/** @type {readonly [string, string][]} */
const RENAME_THEN_CONVERT = [
    ['hero (2).png', 'hero'],
    [
        'Goblins increased in GPT-5.4 especially for the Nerdy personality.png',
        'chart-2-goblin-by-personality',
    ],
    [
        'Training conversations WITH the Nerdy personality.png',
        'chart-3-nerdy-training-rollouts',
    ],
    ['Training conversations WITHOUT the Nerdy personality.png', 'extra-training-without-nerdy'],
]

renameChatGptExports()

for (const [from, base] of RENAME_THEN_CONVERT) {
    renameIfPresent(from, base)
}

const basesNeedingAvif = new Set([
    'hero',
    'chart-1-goblin-gremlin-frequency',
    'chart-2-goblin-by-personality',
    'chart-3-nerdy-training-rollouts',
    'extra-goblin-gremlin-conversations',
    'extra-training-without-nerdy',
])

for (const base of basesNeedingAvif) {
    const pngPath = join(root, `${base}.png`)
    const avifPath = join(root, `${base}.avif`)
    if (!existsSync(pngPath)) continue
    await toAvif(pngPath, avifPath)
    console.log(`[ok] ${base}.avif`)
}

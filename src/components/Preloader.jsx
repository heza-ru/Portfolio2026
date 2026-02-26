import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'

/* ── Grid constants ──────────────────────────────────────────────── */
const STEP_MS = 680
const START_DARK_PROB = 0.16   // Starts 16% dark (84% white)
const FILL_DARK = '#0A0A0A'
const FILL_LIGHT = '#F0EDE8'
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]

/* ── Pixel-block overlay constants (matching CODE source) ────────── */
const BLOCK_SIZE = 60          // same as TransitionProvider.jsx

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t) {
    const c1 = 1.70158, c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function buildCellData(cols, rows) {
    const thresh = new Float32Array(cols * rows)
    const dirX = new Float32Array(cols * rows)
    const dirY = new Float32Array(cols * rows)
    for (let i = 0; i < cols * rows; i++) {
        thresh[i] = Math.random()
        const d = DIRS8[Math.floor(Math.random() * DIRS8.length)]
        dirX[i] = d[0]; dirY[i] = d[1]
    }
    return { thresh, dirX, dirY }
}

/* ── Build pixel-block grid into a container element ─────────────── */
function buildBlockGrid(container) {
    container.innerHTML = ''
    const blocks = []
    const w = window.innerWidth
    const h = window.innerHeight
    const cols = Math.ceil(w / BLOCK_SIZE) + 1
    const rows = Math.ceil(h / BLOCK_SIZE) + 1
    const offX = (w - cols * BLOCK_SIZE) / 2
    const offY = (h - rows * BLOCK_SIZE) / 2

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const el = document.createElement('div')
            el.style.cssText = `
        position:absolute;
        width:${BLOCK_SIZE}px;
        height:${BLOCK_SIZE}px;
        left:${c * BLOCK_SIZE + offX}px;
        top:${r * BLOCK_SIZE + offY}px;
        background:${FILL_DARK};
        opacity:0;
        pointer-events:none;
      `
            container.appendChild(el)
            blocks.push(el)
        }
    }
    return blocks
}

export default function Preloader({ onComplete }) {
    const canvasRef = useRef(null)
    const canvasRaf = useRef(null)
    const timers = useRef([])
    const blockGridRef = useRef(null)   // div that holds the exit pixel blocks
    const blocksRef = useRef([])
    const exitingRef = useRef(false)

    const [gone, setGone] = useState(false)

    function T(fn, ms) { const id = setTimeout(fn, ms); timers.current.push(id) }

    /* ── Pixel-block exit ─────────────────────────────────────────── */
    const exit = useCallback(() => {
        if (exitingRef.current) return
        exitingRef.current = true

        timers.current.forEach(clearTimeout)
        if (canvasRaf.current) cancelAnimationFrame(canvasRaf.current)

        /* Build block grid if not yet done */
        if (blockGridRef.current && blocksRef.current.length === 0) {
            blocksRef.current = buildBlockGrid(blockGridRef.current)
        }

        /* All blocks start fully visible (opacity 1), stagger-dissolve them away */
        gsap.set(blocksRef.current, { opacity: 1 })
        gsap.to(blocksRef.current, {
            opacity: 0,
            duration: 0.05,                       // per-block fade — same as code source
            ease: 'power2.inOut',
            stagger: { amount: 0.6, from: 'random' }, // 0.6 s total dissolve
            delay: 0.15,
            onComplete: () => {
                setGone(true)
                onComplete()
            },
        })
    }, [onComplete])

    /* ── Canvas pixel-sort animation ──────────────────────────────── */
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext('2d')
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
        window.addEventListener('resize', resize); resize()

        const firstSz = Math.round(Math.sqrt((canvas.width * canvas.height) / 4))
        const SIZES = []; let sz = firstSz
        while (sz >= 4) { SIZES.push(sz); sz = Math.round(sz / 2) } SIZES.push(2)
        const cF = (s) => Math.ceil(canvas.width / s) + 2
        const rF = (s) => Math.ceil(canvas.height / s) + 2
        let sIdx = 0, sStart = performance.now()
        let cell = buildCellData(cF(SIZES[0]), rF(SIZES[0])), nextC = null
        const overallStart = performance.now()

        function frame(now) {
            const overallElapsed = now - overallStart
            const overallProgress = Math.min(overallElapsed / 4800, 1)
            const currentDarkProb = START_DARK_PROB + (1.0 - START_DARK_PROB) * Math.pow(overallProgress, 3)

            const size = sIdx < SIZES.length ? SIZES[sIdx] : SIZES[SIZES.length - 1]
            const cols = cF(size), rows = rF(size)

            const t = sIdx < SIZES.length ? Math.min((now - sStart) / STEP_MS, 1) : 1
            let scale, splitT
            if (sIdx >= SIZES.length) { scale = 1; splitT = 1 }
            else if (t < 0.5) {
                scale = 0.78 + easeOutBack(t / 0.5) * 0.22
                if (scale > 1.06) scale = 1 + (scale - 1) * 0.35
                splitT = 0
            } else { scale = 1; splitT = easeOutCubic((t - 0.5) / 0.5) }

            const maxShift = size * 0.6
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
                const idx = r * cols + c
                const isDark = cell.thresh[idx] < currentDarkProb
                const bsz = size * scale
                const bx = c * size + (size - bsz) / 2
                const by = r * size + (size - bsz) / 2
                const tx = cell.dirX[idx] * maxShift * splitT
                const ty = cell.dirY[idx] * maxShift * splitT
                const dsz = bsz * (1 - splitT * 0.28)
                const sOff = (bsz - dsz) / 2

                ctx.fillStyle = isDark ? FILL_DARK : FILL_LIGHT
                ctx.globalAlpha = isDark ? 0.90 - splitT * 0.15 : 0.82 - splitT * 0.20
                ctx.fillRect(bx + tx + sOff, by + ty + sOff, dsz, dsz)
            }
            ctx.globalAlpha = 1

            if (t >= 1 && sIdx < SIZES.length) {
                sIdx++; sStart = now
                if (sIdx < SIZES.length) { cell = nextC ?? buildCellData(cF(SIZES[sIdx]), rF(SIZES[sIdx])); nextC = null }
            } else if (t > 0.72 && !nextC && sIdx + 1 < SIZES.length) {
                nextC = buildCellData(cF(SIZES[sIdx + 1]), rF(SIZES[sIdx + 1]))
            }
            canvasRaf.current = requestAnimationFrame(frame)
        }
        canvasRaf.current = requestAnimationFrame(frame)
        return () => {
            window.removeEventListener('resize', resize)
            if (canvasRaf.current) cancelAnimationFrame(canvasRaf.current)
        }
    }, [])

    /* ── Sequence ─────────────────────────────────────────────────── */
    useEffect(() => {
        /* Pre-build the block grid as soon as possible */
        if (blockGridRef.current) {
            blocksRef.current = buildBlockGrid(blockGridRef.current)
        }
        T(exit, 5000)
        return () => timers.current.forEach(clearTimeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (gone) return null

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999, overflow: 'hidden',
            background: FILL_DARK,
            pointerEvents: 'none',
        }}>
            {/* Canvas pixel-sort animation */}
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

            {/* Grain overlay */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.38, mixBlendMode: 'overlay' }}>
                <svg width="100%" height="100%" style={{ display: 'block' }}>
                    <filter id="pl-grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
                        <feTurbulence type="fractalNoise" baseFrequency="0.70" numOctaves="4" stitchTiles="stitch" />
                        <feColorMatrix type="saturate" values="0" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#pl-grain)" />
                </svg>
            </div>

            {/* ── Pixel-block exit overlay — sits on top, starts fully visible ── */}
            {/* These blocks dissolve away on exit, revealing the page beneath    */}
            <div
                ref={blockGridRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 3,
                }}
            />
        </div>
    )
}

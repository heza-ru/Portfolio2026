/**
 * PixelReveal.jsx
 *
 * Reusable pixel-block reveal system.
 * Source: dist/CODE/block-reveal-page-transition/src/providers/TransitionProvider.jsx
 *
 * Usage A — wrap an element, auto-reveal on scroll into view:
 *   <PixelReveal scrollReveal>
 *     <img src="..." />
 *   </PixelReveal>
 *
 * Usage B — imperative via forwardRef:
 *   const ref = useRef()
 *   ref.current.reveal()   // dissolve blocks away (show content)
 *   ref.current.cover()    // fill blocks in  (hide content)
 *
 * Usage C — auto-reveal on mount after a delay (e.g. Hero on load):
 *   <PixelReveal autoRevealDelay={500} scrollReveal={false}>…</PixelReveal>
 */

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── Constants (matching CODE source: BLOCK_SIZE = 60) ──────── */
const DEFAULT_BLOCK_SIZE = 60
const DEFAULT_BLOCK_COLOR = '#0A0A0A'

/* ── Build a grid of block divs ─────────────────────────────── */
function buildGrid(container, color = DEFAULT_BLOCK_COLOR, blockSize = DEFAULT_BLOCK_SIZE) {
    container.innerHTML = ''
    const blocks = []

    const w = container.offsetWidth || container.parentElement?.offsetWidth || window.innerWidth
    const h = container.offsetHeight || container.parentElement?.offsetHeight || window.innerHeight

    const cols = Math.ceil(w / blockSize) + 1
    const rows = Math.ceil(h / blockSize) + 1
    const offX = (w - cols * blockSize) / 2
    const offY = (h - rows * blockSize) / 2

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const el = document.createElement('div')
            el.style.cssText = `
        position:absolute;
        width:${blockSize}px;
        height:${blockSize}px;
        left:${c * blockSize + offX}px;
        top:${r * blockSize + offY}px;
        background:${color};
        opacity:1;
        pointer-events:none;
      `
            container.appendChild(el)
            blocks.push(el)
        }
    }
    return blocks
}

/* ─────────────────────────────────────────────────────────────
   PixelReveal
   Props:
   - scrollReveal    {boolean} auto-reveal when scrolled into view (default true)
   - startCovered    {boolean} begin fully covered (default true)
   - autoRevealDelay {number}  ms after mount to auto-reveal (ignores scrollReveal)
   - duration        {number}  total stagger duration in seconds
   - blockDuration   {number}  per-block fade duration (source default: 0.05)
   - delay           {number}  seconds delay before reveal begins
   - color           {string}  block fill colour (default #0A0A0A)
   - blockSize       {number}  pixel size of each block (source default: 60)
   - className / style — passed to wrapper div
───────────────────────────────────────────────────────────── */
const PixelReveal = forwardRef(function PixelReveal(
    {
        children,
        scrollReveal = true,
        startCovered = true,
        autoRevealDelay = null,  // ms — if set, auto-reveals after mount delay
        duration = 0.9,
        blockDuration = 0.05,
        delay = 0,
        color = DEFAULT_BLOCK_COLOR,
        blockSize = DEFAULT_BLOCK_SIZE,
        className = '',
        style = {},
    },
    ref
) {
    const wrapRef = useRef(null)
    const gridRef = useRef(null)
    const blocksRef = useRef([])
    const tweenRef = useRef(null)
    const revealedRef = useRef(!startCovered)

    /* ── build / rebuild grid ──────────────────────────────── */
    const initGrid = useCallback(() => {
        if (!gridRef.current) return
        blocksRef.current = buildGrid(gridRef.current, color, blockSize)
        gsap.set(blocksRef.current, { opacity: startCovered ? 1 : 0 })
        revealedRef.current = !startCovered
    }, [color, blockSize, startCovered])

    /* ── reveal: dissolve blocks away → show content ───────── */
    const reveal = useCallback(() => {
        if (revealedRef.current) return
        revealedRef.current = true
        tweenRef.current?.kill()
        gsap.set(blocksRef.current, { opacity: 1 })
        tweenRef.current = gsap.to(blocksRef.current, {
            opacity: 0,
            duration: blockDuration,
            ease: 'power2.inOut',
            stagger: { amount: duration, from: 'random' },
        })
    }, [blockDuration, duration])

    /* ── cover: fill blocks in → hide content ─────────────── */
    const cover = useCallback((onComplete) => {
        revealedRef.current = false
        tweenRef.current?.kill()
        gsap.set(blocksRef.current, { opacity: 0 })
        tweenRef.current = gsap.to(blocksRef.current, {
            opacity: 1,
            duration: blockDuration,
            ease: 'power2.inOut',
            stagger: { amount: duration, from: 'random' },
            onComplete,
        })
    }, [blockDuration, duration])

    /* ── expose imperative API ─────────────────────────────── */
    useImperativeHandle(ref, () => ({ reveal, cover }), [reveal, cover])

    /* ── mount: build grid, set up triggers ─────────────── */
    useEffect(() => {
        initGrid()

        /* Auto-reveal after a fixed delay (e.g. Hero portrait on preloader done) */
        if (autoRevealDelay !== null) {
            const id = setTimeout(() => reveal(), autoRevealDelay)
            return () => clearTimeout(id)
        }

        /* Scroll-triggered reveal */
        if (scrollReveal) {
            const trigger = ScrollTrigger.create({
                trigger: wrapRef.current,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    setTimeout(() => reveal(), delay * 1000)
                },
            })

            const ro = new ResizeObserver(initGrid)
            if (wrapRef.current) ro.observe(wrapRef.current)

            return () => {
                trigger.kill()
                ro.disconnect()
                tweenRef.current?.kill()
            }
        }

        return () => { tweenRef.current?.kill() }
    }, [initGrid, reveal, scrollReveal, autoRevealDelay, delay])

    return (
        <div
            ref={wrapRef}
            className={`pixel-reveal-wrap ${className}`}
            style={{ position: 'relative', overflow: 'hidden', ...style }}
        >
            {children}

            {/* pixel grid overlay — sits on top of children */}
            <div
                ref={gridRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}
            />
        </div>
    )
})

export default PixelReveal

/* ─────────────────────────────────────────────────────────────
   usePixelOverlay
   For full-screen overlays (Preloader exit, Navbar open/close)
   Returns { init, cover, reveal, kill }
   Call init(domElement) to attach to a fixed/absolute container.
───────────────────────────────────────────────────────────── */
export function usePixelOverlay({
    color = DEFAULT_BLOCK_COLOR,
    blockSize = DEFAULT_BLOCK_SIZE,
    duration = 0.5,
    blockDuration = 0.05,
} = {}) {
    const containerRef = useRef(null)
    const blocksRef = useRef([])
    const tweenRef = useRef(null)

    const init = useCallback((el) => {
        if (!el) return
        containerRef.current = el
        el.innerHTML = ''
        blocksRef.current = []

        const w = window.innerWidth
        const h = window.innerHeight
        const cols = Math.ceil(w / blockSize) + 1
        const rows = Math.ceil(h / blockSize) + 1
        const offX = (w - cols * blockSize) / 2
        const offY = (h - rows * blockSize) / 2

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const el2 = document.createElement('div')
                el2.style.cssText = `
          position:absolute;
          width:${blockSize}px;
          height:${blockSize}px;
          left:${c * blockSize + offX}px;
          top:${r * blockSize + offY}px;
          background:${color};
          opacity:0;
          pointer-events:none;
        `
                el.appendChild(el2)
                blocksRef.current.push(el2)
            }
        }
    }, [color, blockSize])

    /* fill all blocks (show overlay) */
    const cover = useCallback((onComplete) => {
        tweenRef.current?.kill()
        gsap.set(blocksRef.current, { opacity: 0 })
        tweenRef.current = gsap.to(blocksRef.current, {
            opacity: 1,
            duration: blockDuration,
            ease: 'power2.inOut',
            stagger: { amount: duration, from: 'random' },
            onComplete,
        })
    }, [blockDuration, duration])

    /* dissolve blocks away (hide overlay) */
    const reveal = useCallback((delay2 = 0) => {
        tweenRef.current?.kill()
        gsap.set(blocksRef.current, { opacity: 1 })
        tweenRef.current = gsap.to(blocksRef.current, {
            opacity: 0,
            duration: blockDuration,
            delay: delay2,
            ease: 'power2.inOut',
            stagger: { amount: duration, from: 'random' },
        })
    }, [blockDuration, duration])

    const kill = useCallback(() => tweenRef.current?.kill(), [])

    return { init, cover, reveal, kill }
}

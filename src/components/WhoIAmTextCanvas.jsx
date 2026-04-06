import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import { cursorState } from '../utils/cursorState'

/* ─── Constants ────────────────────────────────────────────── */
const BIO = 'A multidisciplinary engineer, designer and consultant — passionate about merging design and engineering to craft smooth, interactive experiences. Building digital products with a focus on motion, performance, and lasting purpose.'
const MAX_LINES  = 40
const CURSOR_PAD = 4     // tight padding — just the cursor square itself
const TRAIL_DECAY = 0.0  // no tail displacement

/* ─── Helpers ──────────────────────────────────────────────── */

/** Blocked horizontal interval for a rect obstacle, or null if no overlap. */
function rectInterval(cx, cy, hw, hh, bandY, lineH, pad) {
    const top    = cy - hh - pad
    const bottom = cy + hh + pad
    if (bandY + lineH <= top || bandY >= bottom) return null
    return { left: cx - hw - pad, right: cx + hw + pad }
}

/** Subtract all blocked intervals from [colLeft, colLeft + colW]; return slots
 *  sorted widest first. */
function carveSlots(colLeft, colW, intervals) {
    let slots = [{ left: colLeft, right: colLeft + colW }]
    for (const iv of intervals) {
        const next = []
        for (const s of slots) {
            if (iv.right <= s.left || iv.left >= s.right) {
                next.push(s)
            } else {
                if (iv.left > s.left)  next.push({ left: s.left,    right: iv.left  })
                if (iv.right < s.right) next.push({ left: iv.right, right: s.right  })
            }
        }
        slots = next
    }
    return slots
}

/** Binary-search the largest px font size where the single-line BIO fits
 *  within `targetWidth` pixels (using a temporary off-screen span). */
function measureFontSize(targetWidth) {
    const span = document.createElement('span')
    span.style.cssText =
        "position:absolute;top:-9999px;left:-9999px;visibility:hidden;" +
        "white-space:nowrap;font-family:'Instrument Serif',serif;font-weight:400;"
    span.textContent = BIO
    document.body.appendChild(span)
    let lo = 8, hi = 600
    for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2
        span.style.fontSize = `${mid}px`
        span.scrollWidth <= targetWidth ? (lo = mid) : (hi = mid)
    }
    document.body.removeChild(span)
    return lo
}

/* ─── Component ────────────────────────────────────────────── */

/**
 * Renders the Who I Am bio text via pretext on a DOM pool, displacing lines
 * around the custom cursor and its lerped trail.
 *
 * Props:
 *   wrapRef — ref to the .wia-text-wrap element (for coordinate mapping).
 */
export default function WhoIAmTextCanvas({ wrapRef }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        /* ── DOM line pool ── */
        const pool = []
        for (let i = 0; i < MAX_LINES; i++) {
            const el = document.createElement('div')
            el.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                white-space: nowrap;
                overflow: hidden;
                color: inherit;
                pointer-events: none;
                will-change: transform;
                font-family: 'Instrument Serif', serif;
                font-weight: 400;
                visibility: hidden;
            `
            container.appendChild(el)
            pool.push(el)
        }

        let prepared  = null
        let fontSize  = 0
        let lineH     = 0
        let rafId

        /* ── Compute font size + prepare pretext ── */
        function init() {
            if (!wrapRef?.current) return
            const mobile = window.innerWidth < 768
            // Same multiplier logic as WhoIAm's sizeBio:
            // 3.5 × containerW on desktop, 10 × on mobile
            const mult = mobile ? 10 : 3.5
            const containerW = wrapRef.current.clientWidth

            fontSize  = measureFontSize(containerW * mult)
            lineH     = fontSize * 1.1   // match CSS line-height: 1.1

            const FONT = `400 ${fontSize}px 'Instrument Serif', serif`
            pool.forEach(el => {
                el.style.fontSize   = `${fontSize}px`
                el.style.lineHeight = '1'
            })

            prepared = prepareWithSegments(BIO, FONT, {})
        }

        document.fonts.ready.then(init)

        /* ── Handle resize — re-init after short debounce ── */
        let resizeTimer
        const onResize = () => {
            clearTimeout(resizeTimer)
            resizeTimer = setTimeout(() => {
                prepared = null // pause rendering while reinitialising
                init()
            }, 150)
        }
        window.addEventListener('resize', onResize, { passive: true })

        /* ── RAF render loop ── */
        function render() {
            rafId = requestAnimationFrame(render)
            if (!prepared || !wrapRef?.current) return

            const rect  = wrapRef.current.getBoundingClientRect()
            const colW  = rect.width
            const colLeft = 0

            /* Convert viewport cursor to local container coords */
            const { current: cur, isHovering } = cursorState
            const localX = cur.x - rect.left
            const localY = cur.y - rect.top

            const curHW = (isHovering ? 110 : 18) / 2
            const curHH = (isHovering ? 38  : 18) / 2

            /* Single obstacle: just the cursor square, no tail */
            const obstacles = []
            if (cur.x > -100) {
                obstacles.push({ cx: localX, cy: localY, hw: curHW, hh: curHH, pad: CURSOR_PAD })
            }

            /* ── Layout pass ── */
            let textCursor = { segmentIndex: 0, graphemeIndex: 0 }
            let y = 0
            let lineIdx = 0

            outer: while (lineIdx < MAX_LINES) {
                /* Blocked intervals for this horizontal band */
                const intervals = []
                for (const obs of obstacles) {
                    const iv = rectInterval(obs.cx, obs.cy, obs.hw, obs.hh, y, lineH, obs.pad)
                    if (iv) intervals.push(iv)
                }

                /* Sort slots left-to-right so text reads naturally across the gap */
                const slots = carveSlots(colLeft, colW, intervals)
                    .sort((a, b) => a.left - b.left)

                if (!slots.length) { y += lineH; continue }

                /* Fill every slot on this band before advancing y.
                   This creates text on both sides of the cursor gap. */
                let filledAny = false
                for (const slot of slots) {
                    const slotW = slot.right - slot.left
                    if (slotW < fontSize * 0.5 || lineIdx >= MAX_LINES) continue

                    const line = layoutNextLine(prepared, textCursor, slotW)
                    if (!line) break outer // text exhausted — exit both loops cleanly

                    /* Skip zero-progress (slot too narrow for any glyph) */
                    if (
                        line.end.segmentIndex  === textCursor.segmentIndex &&
                        line.end.graphemeIndex === textCursor.graphemeIndex
                    ) continue

                    /* Centre the fragment within its slot */
                    const lineX = slot.left + (slotW - line.width) / 2

                    const el = pool[lineIdx]
                    el.style.visibility = 'visible'
                    el.style.transform  = `translate3d(${Math.round(lineX)}px,${Math.round(y)}px,0)`
                    el.style.maxWidth   = slotW + 'px'
                    el.textContent      = line.text

                    textCursor = line.end
                    lineIdx++
                    filledAny = true
                }

                if (!filledAny) { y += lineH; continue }
                y += lineH
            }

            /* Hide unused pool slots */
            for (let i = lineIdx; i < MAX_LINES; i++) {
                pool[i].style.visibility = 'hidden'
            }
        }

        render()

        return () => {
            cancelAnimationFrame(rafId)
            clearTimeout(resizeTimer)
            window.removeEventListener('resize', onResize)
            pool.forEach(el => el.remove())
        }
    }, [wrapRef])

    return (
        <div
            ref={containerRef}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden="true"
        />
    )
}

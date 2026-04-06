import { useEffect, useRef } from 'react'
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'
import { cursorState } from '../utils/cursorState'

/* ─── Text content ─────────────────────────────────────────── */
const BIO = `Mohammad Haider is a creative developer and designer building digital experiences at the intersection of motion, code, and visual language. Crafting interfaces that feel alive — where technology meets sensation. Skilled in React, Three.js, WebGL, and real-time graphics. Interested in computational aesthetics, systematic design, and the subtle physics of digital touch. Available for select projects and collaborations in 2026.   `
const TEXT = Array(6).fill(BIO).join('')

/* ─── Layout constants ────────────────────────────────────── */
const FONT         = "400 13px 'Instrument Serif', serif"
const LINE_H       = 21   // px between baselines
const MARGIN_X     = 0.06 // fraction of viewport width for left/right margin
const MAX_LINES    = 120  // DOM pool size
const CURSOR_PAD   = 32   // breathing room around cursor (px)
const TRAIL_DECAY  = 0.78 // trail obstacle size multiplier per step

/* ─── Helpers ──────────────────────────────────────────────── */

/**
 * Returns the blocked horizontal interval [left, right] for a rectangular
 * obstacle at (cx, cy) with half-dimensions (hw, hh) + padding, for a text
 * band whose top edge is at bandY. Returns null when no overlap.
 */
function rectInterval(cx, cy, hw, hh, bandY, padding) {
    const top    = cy - hh - padding
    const bottom = cy + hh + padding
    if (bandY + LINE_H <= top || bandY >= bottom) return null
    return { left: cx - hw - padding, right: cx + hw + padding }
}

/**
 * Subtract all blocked intervals from [colLeft, colLeft + colW] and return
 * the remaining slots sorted by width descending.
 */
function carveSlots(colLeft, colW, intervals) {
    let slots = [{ left: colLeft, right: colLeft + colW }]
    for (const iv of intervals) {
        const next = []
        for (const s of slots) {
            if (iv.right <= s.left || iv.left >= s.right) {
                next.push(s)
            } else {
                if (iv.left > s.left) next.push({ left: s.left,    right: iv.left  })
                if (iv.right < s.right) next.push({ left: iv.right, right: s.right  })
            }
        }
        slots = next
    }
    return slots.sort((a, b) => (b.right - b.left) - (a.right - a.left))
}

/* ─── Component ────────────────────────────────────────────── */

export default function HeroTextCanvas() {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        /* ── Build a fixed DOM pool for lines ── */
        const pool = []
        for (let i = 0; i < MAX_LINES; i++) {
            const el = document.createElement('div')
            el.style.cssText = `
                position: absolute;
                top: 0; left: 0;
                white-space: nowrap;
                overflow: hidden;
                font: ${FONT};
                color: rgba(255,255,255,0.22);
                pointer-events: none;
                will-change: transform;
                letter-spacing: 0.01em;
            `
            container.appendChild(el)
            pool.push(el)
        }

        let prepared = null
        let rafId
        let vw = window.innerWidth
        let vh = window.innerHeight

        const onResize = () => { vw = window.innerWidth; vh = window.innerHeight }
        window.addEventListener('resize', onResize, { passive: true })

        document.fonts.ready.then(() => {
            prepared = prepareWithSegments(TEXT, FONT, {})
        })

        /* ── Main animation loop ── */
        function render() {
            rafId = requestAnimationFrame(render)
            if (!prepared) return

            const colLeft  = Math.floor(vw * MARGIN_X)
            const colW     = vw - colLeft * 2
            const startY   = 0

            /* Build obstacle list: cursor head + tail */
            const { current: cur, isHovering, trail } = cursorState
            const curHW = (isHovering ? 110 : 18) / 2
            const curHH = (isHovering ? 38  : 18) / 2

            const obstacles = []

            // Head — full size + padding
            if (cur.x > -100) {
                obstacles.push({ cx: cur.x, cy: cur.y, hw: curHW, hh: curHH, pad: CURSOR_PAD })
            }

            // Tail — each step decays in size and padding
            let hw = curHW * TRAIL_DECAY
            let hh = curHH * TRAIL_DECAY
            let pad = CURSOR_PAD * TRAIL_DECAY
            for (const t of trail) {
                obstacles.push({ cx: t.x, cy: t.y, hw, hh, pad })
                hw  *= TRAIL_DECAY
                hh  *= TRAIL_DECAY
                pad *= TRAIL_DECAY
                if (hw < 2) break
            }

            /* Layout pass */
            let textCursor = { segmentIndex: 0, graphemeIndex: 0 }
            let y          = startY
            let lineIdx    = 0

            while (lineIdx < MAX_LINES && y < vh + LINE_H) {
                /* Collect blocked intervals for this horizontal band */
                const intervals = []
                for (const obs of obstacles) {
                    const iv = rectInterval(obs.cx, obs.cy, obs.hw, obs.hh, y, obs.pad)
                    if (iv) intervals.push(iv)
                }

                /* Find the widest unblocked slot */
                const slots    = carveSlots(colLeft, colW, intervals)
                const bestSlot = slots[0]

                if (!bestSlot || bestSlot.right - bestSlot.left < 20) {
                    // Band fully blocked — skip line
                    y += LINE_H
                    continue
                }

                const slotW = bestSlot.right - bestSlot.left

                /* Ask pretext to fit as much text as possible in that width */
                const line = layoutNextLine(prepared, textCursor, slotW)

                if (!line) {
                    // Text exhausted — loop back from start
                    textCursor = { segmentIndex: 0, graphemeIndex: 0 }
                    // (don't advance y — retry this band with fresh cursor)
                    continue
                }

                // Guard against zero-progress (slot too narrow for a single glyph)
                const noProgress =
                    line.end.segmentIndex  === textCursor.segmentIndex &&
                    line.end.graphemeIndex === textCursor.graphemeIndex
                if (noProgress) {
                    y += LINE_H
                    continue
                }

                /* Update DOM line element */
                const el = pool[lineIdx]
                el.style.visibility = 'visible'
                el.style.transform  = `translate3d(${Math.round(bestSlot.left)}px, ${Math.round(y)}px, 0)`
                el.style.maxWidth   = slotW + 'px'
                el.textContent      = line.text

                textCursor = line.end
                y         += LINE_H
                lineIdx++
            }

            /* Hide unused pool elements */
            for (let i = lineIdx; i < MAX_LINES; i++) {
                pool[i].style.visibility = 'hidden'
            }
        }

        render()

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', onResize)
            pool.forEach(el => el.remove())
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: 8 }}
        />
    )
}

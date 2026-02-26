import React, { useEffect, useRef } from 'react'

/**
 * FractalGlass — lenticular glass background for the Hero section.
 *
 * Technique (from Pablo Stanley's CodePen gOJVaeJ):
 *  • The background image is sliced into N vertical "cell" divs.
 *  • Alternating cells are flipped with scaleX(-1), producing the
 *    mirrored-strip lenticular look.
 *  • Cell widths narrow toward the centre, simulating a lens curve.
 *  • An SVG feTurbulence → feDisplacementMap filter warps the whole
 *    stack, giving organic glass distortion.
 *  • On mouse move, each cell's backgroundPositionX shifts at a slightly
 *    different rate — this IS the lenticular parallax (angle-of-view change).
 *  • The wrapper also translates subtly for an added depth cue.
 *  • turbulence baseFrequency breathes slowly over time.
 */

// ── Background image ─────────────────────────────────────────────────────────
// A jewel-toned gradient abstract. Works great with screen blend mode on
// the near-black hero, making dark areas vanish and colours glow.
const BG =
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=2000&auto=format&fit=crop'

// ── Config ────────────────────────────────────────────────────────────────────
const STEPS = 40      // number of lenticular strips
// Asymmetric baseFrequency: higher X creates tight vertical seams (not blobs),
// lower Y keeps distortion elongated along the strip direction.
const BASE_FREQ_X = 0.04   // X axis — controls strip boundary tightness
const BASE_FREQ_Y = 0.008  // Y axis — keeps distortion tall/elongated
const OCTAVES = 1       // 1 = clean single layer; more = busier/melted
const DISP_SCALE = 12      // subtle displacement — too high = melted look
const MOUSE_RANGE = 14      // max background-position shift (%) from mouse
const WRAPPER_DRIFT = 0.18    // how much the whole wrapper shifts on mouse X

export default function FractalGlass() {
    const wrapperRef = useRef(null)
    const turbRef = useRef(null)
    const mouse = useRef({ x: 0.5, y: 0.5 })
    const targetMouse = useRef({ x: 0.5, y: 0.5 })
    const rafRef = useRef(null)

    // ── Build cells (once on mount) ────────────────────────────────────────────
    function buildCells(wrapper) {
        wrapper.innerHTML = ''
        for (let i = 0; i < STEPS; i++) {
            const flip = i % 2 === 0 ? 'scaleX(1)' : 'scaleX(-1)'
            const midDist = Math.abs(i - STEPS / 2) / (STEPS / 2)
            const cellWidth = (100 / STEPS) * (1 - midDist * 0.2)

            const cell = document.createElement('div')
            cell.style.cssText = `
        background-image: url(${BG});
        background-position: ${(i / STEPS) * 100}% 50%;
        background-size: cover;
        transform: ${flip};
        width: ${cellWidth}%;
        flex-shrink: 0;
        height: 100%;
        position: relative;
        overflow: hidden;
      `
            // shimmer edge highlight
            const shimmer = document.createElement('div')
            shimmer.style.cssText = `
        position:absolute; top:0; right:0;
        width:100%; height:100%;
        background:linear-gradient(
          90deg,
          rgba(255,255,255,0) 72%,
          rgba(255,255,255,0.07) 98%,
          rgba(255,255,255,0.32) 100%
        );
        pointer-events:none;
      `
            cell.appendChild(shimmer)
            wrapper.appendChild(cell)
        }
    }

    useEffect(() => {
        const wrapper = wrapperRef.current
        if (!wrapper) return
        buildCells(wrapper)

        // ── Mouse tracking ────────────────────────────────────────────────────
        function onMouseMove(e) {
            // normalise to [0, 1] relative to the viewport
            targetMouse.current.x = e.clientX / window.innerWidth
            targetMouse.current.y = e.clientY / window.innerHeight
        }
        window.addEventListener('mousemove', onMouseMove, { passive: true })

        // ── Render loop ────────────────────────────────────────────────────────
        let t = 0
        function tick() {
            t += 0.004

            // Smooth mouse lerp
            const m = mouse.current
            const tm = targetMouse.current
            m.x += (tm.x - m.x) * 0.055
            m.y += (tm.y - m.y) * 0.055

            // Animate turbulence seed for subtle motion WITHOUT changing frequency
            // (changing baseFrequency was making the pattern grow/shrink → melted look)
            if (turbRef.current) {
                // Very gently oscillate only the Y frequency for a breathing feel
                const bfY = BASE_FREQ_Y + Math.sin(t * 0.3) * 0.001
                turbRef.current.setAttribute('baseFrequency', `${BASE_FREQ_X} ${bfY.toFixed(5)}`)
            }

            // ── Per-cell lenticular angle shift ─────────────────────────────────
            // Shifting backgroundPositionX replicates looking at a lenticular card
            // from different horizontal angles — the defining parallax of the effect.
            const cells = wrapper.children
            const shiftX = (m.x - 0.5) * MOUSE_RANGE   // –range..+range
            const shiftY = (m.y - 0.5) * (MOUSE_RANGE * 0.4)

            for (let i = 0; i < cells.length; i++) {
                const base = (i / STEPS) * 100
                // Each strip uses a slightly different rate for the depth illusion
                const rate = 1 + (i / STEPS) * 0.35
                cells[i].style.backgroundPositionX = `${base - shiftX * rate}%`
                cells[i].style.backgroundPositionY = `${50 + shiftY}%`
            }

            // ── Whole-wrapper drift (secondary parallax) ─────────────────────────
            const driftX = shiftX * WRAPPER_DRIFT
            const driftY = shiftY * 0.5
            wrapper.style.transform = `translateX(calc(-6% + ${driftX}px)) translateY(${driftY}px)`

            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)

        return () => {
            cancelAnimationFrame(rafRef.current)
            window.removeEventListener('mousemove', onMouseMove)
        }
    }, [])

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                pointerEvents: 'none',
                overflow: 'hidden',
                // screen blend: dark pixels vanish, colours glow against #0A0A0A
                mixBlendMode: 'screen',
                opacity: 0.82,
            }}
        >
            {/* ── SVG displacement filter ──────────────────────────────────────── */}
            <svg
                style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
                aria-hidden="true"
            >
                <defs>
                    <filter id="fractalHeroFilter" x="-10%" y="-10%" width="120%" height="120%">
                        <feTurbulence
                            ref={turbRef}
                            type="turbulence"
                            baseFrequency={`${BASE_FREQ_X} ${BASE_FREQ_Y}`}
                            numOctaves={OCTAVES}
                            seed="7"
                            result="noise"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale={DISP_SCALE}
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
            </svg>

            {/* ── Lenticular strip wrapper ─────────────────────────────────────── */}
            <div
                ref={wrapperRef}
                style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    width: '112%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: '-6%',
                    filter: 'url(#fractalHeroFilter)',
                    willChange: 'transform',
                }}
            />
        </div>
    )
}

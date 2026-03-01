import { useEffect, useRef } from 'react'
import gsap from 'gsap'

// Total scroll "distance" (in px of wheel delta) needed to grow the revealer
// from nothing to full-screen. Tune this to taste.
const SCROLL_BUDGET = 1200

export default function Preloader({ onComplete }) {
    const wrapRef     = useRef(null)
    const revealerRef = useRef(null)
    const line1Ref    = useRef(null)
    const line2Ref    = useRef(null)
    const counterRef  = useRef(null)

    useEffect(() => {
        const wrap     = wrapRef.current
        const revealer = revealerRef.current
        const line1    = line1Ref.current
        const line2    = line2Ref.current
        const counter  = counterRef.current

        // ── Lock page scroll — we intercept wheel/touch instead ──────────
        document.body.style.overflow = 'hidden'

        // ── Initial states ────────────────────────────────────────────────
        gsap.set([line1, line2], { y: '100%' })
        gsap.set(revealer, { xPercent: -50, yPercent: -50, scale: 0 })

        // ── Text lines auto-animate in on mount ───────────────────────────
        gsap.to([line1, line2], {
            y: '0%',
            duration: 1,
            stagger: 0.075,
            ease: 'power3.out',
            delay: 0.4,
        })

        let target   = 0   // raw scroll progress 0 → 1  (updates on wheel)
        let current  = 0   // lerped display value       (updates on RAF)
        let exiting  = false
        let rafId

        const lerp = (a, b, t) => a + (b - a) * t

        const triggerExit = () => {
            if (exiting) return
            exiting = true
            cancelAnimationFrame(rafId)
            gsap.to(wrap, {
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
                duration: 1.1,
                ease: 'power3.out',
                onComplete: () => onComplete?.(),
            })
        }

        // RAF loop — smoothly lerps displayed scale toward the scroll target
        const tick = () => {
            rafId = requestAnimationFrame(tick)
            current = lerp(current, target, 0.08)   // 0.08 = smooth but responsive
            gsap.set(revealer, { scale: current })
            counter.textContent = Math.floor(current * 100).toString().padStart(2, '0')
            if (current >= 0.998 && target >= 1) triggerExit()
        }
        tick()

        const advance = (delta) => {
            if (exiting) return
            target = Math.min(1, target + delta / SCROLL_BUDGET)
        }

        // ── Wheel — capture phase + stopPropagation blocks Lenis ─────────
        const onWheel = (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.deltaY > 0) advance(e.deltaY)
        }

        // ── Touch ─────────────────────────────────────────────────────────
        let touchStartY = 0
        const onTouchStart = (e) => {
            e.stopPropagation()
            touchStartY = e.touches[0].clientY
        }
        const onTouchMove = (e) => {
            e.preventDefault()
            e.stopPropagation()
            const dy = touchStartY - e.touches[0].clientY
            if (dy > 0) advance(dy * 2)
            touchStartY = e.touches[0].clientY
        }

        // capture:true — fires before Lenis's bubble-phase listeners
        window.addEventListener('wheel',      onWheel,      { passive: false, capture: true })
        window.addEventListener('touchstart', onTouchStart, { passive: false, capture: true })
        window.addEventListener('touchmove',  onTouchMove,  { passive: false, capture: true })

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('wheel',      onWheel,      { capture: true })
            window.removeEventListener('touchstart', onTouchStart, { capture: true })
            window.removeEventListener('touchmove',  onTouchMove,  { capture: true })
            document.body.style.overflow = ''
        }
    }, [onComplete])

    const textStyle = {
        fontFamily:    'monospace',
        fontSize:      'clamp(0.65rem, 1vw, 0.8rem)',
        fontWeight:    500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight:    1,
        color:         '#0A0A0A',
        display:       'block',
    }

    return (
        <div
            ref={wrapRef}
            style={{
                position:  'fixed',
                inset:     0,
                background:'#F0EDE8',
                clipPath:  'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                zIndex:    9999,
                display:   'flex',
                alignItems:'center',
                padding:   'clamp(1.25rem, 3vw, 2rem)',
                overflow:  'hidden',
                isolation: 'isolate',
                willChange:'clip-path',
            }}
        >
            {/* Scroll hint */}
            <p style={{
                ...textStyle,
                position: 'absolute',
                bottom:   'clamp(1.25rem, 3vw, 2rem)',
                left:     'clamp(1.25rem, 3vw, 2rem)',
                opacity:  0.4,
                zIndex:   3,
            }}>
                Scroll to load
            </p>

            {/* Negative revealer square — difference blend = black on cream */}
            <div
                ref={revealerRef}
                style={{
                    position:    'absolute',
                    top:         '50%',
                    left:        '50%',
                    width:       '100%',
                    aspectRatio: '1 / 1',
                    background:  '#F0EDE8',
                    mixBlendMode:'difference',
                    zIndex:      2,
                    willChange:  'transform',
                }}
            />

            {/* Copy columns */}
            <div style={{ display:'flex', flex:1, gap:'2rem', position:'relative', zIndex:3 }}>
                <div style={{ flex:1, overflow:'hidden' }}>
                    <span ref={line1Ref} style={textStyle}>
                        Designing digital systems that refuse to be ignored.
                    </span>
                </div>
                <div style={{ flex:1, overflow:'hidden' }}>
                    <span ref={line2Ref} style={textStyle}>
                        Interface architect. React engineer. Motion developer.
                    </span>
                </div>
            </div>

            {/* Counter — tracks scroll progress */}
            <div style={{
                position: 'absolute',
                bottom:   'clamp(1.25rem, 3vw, 2rem)',
                right:    'clamp(1.25rem, 3vw, 2rem)',
                overflow: 'hidden',
                zIndex:   3,
            }}>
                <span ref={counterRef} style={textStyle}>00</span>
            </div>
        </div>
    )
}

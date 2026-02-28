import { useEffect, useRef } from 'react'

/*
 * Custom scroll progress bar — replaces the native scrollbar.
 *
 * Performance (2026):
 *   Before: animated `height` → triggers Paint every frame (C-Tier).
 *   After:  `transform: scaleY()` with `transform-origin: top center`
 *           → compositor-only update, no layout or paint (S-Tier).
 *
 * The inner div is always 100vh tall; scaleY shrinks it from the top down.
 * Scroll progress is read via window.scrollY inside a requestAnimationFrame
 * callback — no state updates, no React re-renders on every scroll tick.
 */
export default function ScrollProgressBar() {
    const barRef = useRef(null)
    const rafRef = useRef(null)

    useEffect(() => {
        const bar = barRef.current
        if (!bar) return

        const update = () => {
            const scrolled = window.scrollY
            const total =
                document.documentElement.scrollHeight - window.innerHeight
            const scale = total > 0 ? scrolled / total : 0
            // scaleY is compositor-only (S-Tier) — no layout, no paint
            bar.style.transform = `scaleY(${scale})`
            rafRef.current = null
        }

        const onScroll = () => {
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(update)
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        update() // seed on mount

        return () => {
            window.removeEventListener('scroll', onScroll)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <div
            aria-hidden="true"
            className="scroll-progress-container"
            style={{
                position: 'fixed',
                /*
                 * Positioned so the bar sits in the gap between the
                 * "Contact" nav link (~300 px from right) and the
                 * "Menu" button (~154 px from right). Midpoint ≈ 196 px.
                 */
                right: '196px',
                top: 0,
                width: '80px',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 200,
                mixBlendMode: 'difference',
            }}
        >
            {/*
             * Full-height fill element. scaleY(0..1) grows it top-to-bottom.
             * will-change set here permanently — this single element stays on
             * screen the entire session and animates constantly, so permanent
             * layer promotion is justified.
             */}
            <div
                ref={barRef}
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'white',
                    transformOrigin: 'top center',
                    transform: 'scaleY(0)',
                    willChange: 'transform',
                }}
            />
        </div>
    )
}

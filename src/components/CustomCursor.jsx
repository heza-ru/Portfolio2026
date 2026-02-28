import { useEffect, useRef, useState } from 'react'

/*
 * Custom cursor — performance notes (2026):
 *
 * 1. Hover state is stored in refs (not only state), so the main RAF loop
 *    never restarts when the cursor morphs. Previously isHovering/hoverText
 *    were in the useEffect deps array — every hover caused the RAF to cancel
 *    and restart, risking a single dropped frame on transition.
 *
 * 2. React state is still used for className switching (the visual morph),
 *    but the animation loop reads from refs and is immune to re-renders.
 *
 * 3. `transform: translate3d` keeps the cursor on the compositor thread.
 *    will-change is set once — this element is always on screen and
 *    always animating, so permanent layer promotion is correct here.
 *
 * 4. Width/height CSS transition on the cursor body is intentionally kept —
 *    it's a single tiny element; the layout recalc cost is negligible and
 *    the morphing feel is essential to the design.
 */
export default function CustomCursor() {
    const cursorRef = useRef(null)
    const isMobile =
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: none)').matches

    // Animation-loop state — lives in refs so the RAF never restarts
    const mouse   = useRef({ x: 0, y: 0 })
    const current = useRef({ x: 0, y: 0 })
    const isHoveringRef = useRef(false)
    const hoverTextRef  = useRef('')

    // React state purely for triggering className / content re-render
    const [cursorShape, setCursorShape] = useState({ isHovering: false, hoverText: '' })

    useEffect(() => {
        if (isMobile) return

        let rafId

        const handleMouseMove = (e) => {
            mouse.current.x = e.clientX
            mouse.current.y = e.clientY
        }

        const handleMouseOver = (e) => {
            const target = e.target.closest('[data-cursor]')
            const nowHovering = !!target
            const nowText = target?.getAttribute('data-cursor') ?? ''

            // Only trigger a React re-render when something actually changed
            if (
                nowHovering !== isHoveringRef.current ||
                nowText !== hoverTextRef.current
            ) {
                isHoveringRef.current = nowHovering
                hoverTextRef.current  = nowText
                setCursorShape({ isHovering: nowHovering, hoverText: nowText })
            }
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        window.addEventListener('mouseover', handleMouseOver, { passive: true })

        const render = () => {
            // Lerp toward mouse — smooth trailing feel
            current.current.x += (mouse.current.x - current.current.x) * 0.15
            current.current.y += (mouse.current.y - current.current.y) * 0.15

            if (cursorRef.current) {
                cursorRef.current.style.transform =
                    `translate3d(${current.current.x}px, ${current.current.y}px, 0)`
            }

            rafId = requestAnimationFrame(render)
        }

        render()

        // Cleanup — no deps other than isMobile so this runs exactly once
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseover', handleMouseOver)
            cancelAnimationFrame(rafId)
        }
    }, [isMobile]) // ← only isMobile; hover refs are read directly in the loop

    if (isMobile) return null

    const { isHovering, hoverText } = cursorShape

    return (
        <div
            ref={cursorRef}
            className={`fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference
                flex items-center justify-center -translate-x-1/2 -translate-y-1/2
                transition-[width,height,border-radius] duration-300 ease-out origin-center
                ${isHovering && hoverText
                    ? 'w-[120px] h-[40px] bg-white rounded-sm'
                    : 'w-[28px]  h-[28px]  bg-white rounded-sm'
                }`}
            style={{
                willChange: 'transform',
                backfaceVisibility: 'hidden',
            }}
        >
            {isHovering && hoverText && (
                <span className="text-[10px] text-black font-mono leading-none tracking-wider
                                 opacity-100 mix-blend-normal pointer-events-none uppercase">
                    {hoverText}
                </span>
            )}
        </div>
    )
}

import { useEffect, useRef, useState } from 'react'

/*
 * Scroll progress bar — replaces the native scrollbar.
 *
 * Visual spec:
 *   • 80 px wide  (matches the old SVG path stroke width)
 *   • Fixed to the right side, offset inward so it lands in the
 *     gap between the "Contact" nav link and the "Menu" button
 *   • White fill with mix-blend-mode: difference → appears as a
 *     dark inversion on light sections, bright white on dark sections
 *   • Grows from top (0 %) to bottom (100 %) as the page is scrolled
 */
export default function ScrollProgressBar() {
    const [progress, setProgress] = useState(0)
    const rafRef = useRef(null)

    useEffect(() => {
        const compute = () => {
            const scrolled = window.scrollY
            const total =
                document.documentElement.scrollHeight - window.innerHeight
            setProgress(total > 0 ? (scrolled / total) * 100 : 0)
            rafRef.current = null
        }

        const onScroll = () => {
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(compute)
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        compute() // seed on mount

        return () => {
            window.removeEventListener('scroll', onScroll)
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [])

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                /*
                 * right: 196px lands the bar between the last nav link
                 * ("Contact", ~300 px from right) and the Menu button
                 * (~64 px right padding + ~90 px button = ~154 px from right).
                 * Midpoint ≈ 227 px → 196 keeps it visually centred in that gap.
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
            <div
                style={{
                    width: '100%',
                    height: `${progress}%`,
                    background: 'white',
                    willChange: 'height',
                }}
            />
        </div>
    )
}

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
    const cursorRef = useRef(null)
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
    const [hoverText, setHoverText] = useState('')
    const [isHovering, setIsHovering] = useState(false)

    // Target coordinates
    const mouse = useRef({ x: 0, y: 0 })
    // Current coordinates (for lerp)
    const current = useRef({ x: 0, y: 0 })

    useEffect(() => {
        if (isMobile) return

        let animationFrameId
        let rotation = 0
        let lastScrollY = window.scrollY

        const handleMouseMove = (e) => {
            mouse.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseOver = (e) => {
            const target = e.target.closest('[data-cursor]')
            if (target) {
                const cursorText = target.getAttribute('data-cursor') || ''
                if (cursorText !== hoverText) {
                    setHoverText(cursorText)
                    setIsHovering(true)
                }
            } else if (isHovering) {
                setHoverText('')
                setIsHovering(false)
            }
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        window.addEventListener('mouseover', handleMouseOver, { passive: true })

        const render = () => {
            // Lerp logic to make cursor trail slightly behind mouse movement
            current.current.x += (mouse.current.x - current.current.x) * 0.15
            current.current.y += (mouse.current.y - current.current.y) * 0.15

            // Scroll-based rotation (only update if scrollY changed)
            const currentScrollY = window.scrollY
            if (currentScrollY !== lastScrollY) {
                rotation += (currentScrollY - lastScrollY) * 0.002
                lastScrollY = currentScrollY
            }

            if (cursorRef.current) {
                // Use translate3d for hardware acceleration
                cursorRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) rotate(${rotation}deg)`
            }

            animationFrameId = requestAnimationFrame(render)
        }

        render()

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseover', handleMouseOver)
            cancelAnimationFrame(animationFrameId)
        }
    }, [isMobile, isHovering, hoverText])

    if (isMobile) return null

    return (
        <div
            className={`fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-[width,height,border-radius] duration-300 ease-out origin-center ${
                isHovering && hoverText
                    ? 'w-[120px] h-[40px] bg-white rounded-sm'
                    : 'w-[28px] h-[28px] bg-white rounded-sm'
            }`}
            ref={cursorRef}
            style={{
                willChange: 'transform',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
            }}
        >
            {isHovering && hoverText && (
                <span className="text-[10px] text-black font-mono leading-none tracking-wider opacity-100 mix-blend-normal pointer-events-none uppercase">
                    {hoverText}
                </span>
            )}
        </div>
    )
}

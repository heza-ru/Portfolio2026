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

        const handleMouseMove = (e) => {
            mouse.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseOver = (e) => {
            const target = e.target.closest('[data-cursor]')
            if (target) {
                setHoverText(target.getAttribute('data-cursor') || '')
                setIsHovering(true)
            } else {
                setHoverText('')
                setIsHovering(false)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseover', handleMouseOver)

        const render = () => {
            // Lerp logic to make cursor trail slightly behind mouse movement
            current.current.x += (mouse.current.x - current.current.x) * 0.12
            current.current.y += (mouse.current.y - current.current.y) * 0.12

            // Scroll-based rotation
            rotation += window.scrollY * 0.00015

            if (cursorRef.current) {
                // We use translate3d instead of translate to force hardware acceleration
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
    }, [isMobile])

    if (isMobile) return null

    return (
        <div
            className={`fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-[width,height,background-color] duration-300 ease-out origin-center ${isHovering ? 'w-[60px] h-[60px] bg-white rounded-full' : 'w-[28px] h-[28px] bg-transparent border border-white rounded-sm'
                }`}
            ref={cursorRef}
        >
            {isHovering && hoverText && (
                <span className="text-[10px] text-black font-mono leading-none tracking-tighter opacity-100 mix-blend-normal pointer-events-none">
                    {hoverText}
                </span>
            )}
        </div>
    )
}

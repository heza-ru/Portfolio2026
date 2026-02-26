import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function StackingSections({ children }) {
    const container = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.stacking-section')

            cards.forEach((card, index) => {
                if (index === cards.length - 1) {
                    // Last card: pin it permanently (stays stuck)
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        pin: true,
                        pinSpacing: false,
                    })
                } else {
                    // All other cards: pin until the last card reaches the top
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        endTrigger: cards[cards.length - 1],
                        end: 'top top',
                        pin: true,
                        pinSpacing: false,
                    })

                    // Scale and rotate animation as next card approaches
                    ScrollTrigger.create({
                        trigger: cards[index + 1],
                        start: 'top bottom',
                        end: 'top top',
                        onUpdate: (self) => {
                            const progress = self.progress
                            const scale = 1 - progress * 0.1
                            const rotation = (index % 2 === 0 ? 3 : -3) * progress
                            const afterOpacity = progress * 0.6

                            gsap.set(card, {
                                scale: scale,
                                rotation: rotation,
                                '--after-opacity': afterOpacity,
                            })
                        },
                    })
                }
            })
        }, container)

        return () => ctx.revert()
    }, [])

    return (
        <div ref={container}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    return (
                        <div className="stacking-section relative will-change-transform isolate" style={{ '--after-opacity': 0 }}>
                            {child}
                            {/* Overlay that darkens on stack - placed after content so it sits on top */}
                            <div
                                className="absolute inset-0 bg-black/50 pointer-events-none z-[500] transition-opacity duration-100"
                                style={{ opacity: 'var(--after-opacity, 0)' }}
                            />
                        </div>
                    )
                }
                return child
            })}
        </div>
    )
}

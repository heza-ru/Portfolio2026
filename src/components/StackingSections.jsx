import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
 * Performance notes (2026 best practices):
 *
 * 1. No permanent `will-change` on cards. GSAP automatically promotes
 *    an element to a compositor layer for the duration of a tween and
 *    removes it on completion — letting us avoid blowing the GPU memory
 *    budget with 4 permanently promoted full-screen layers.
 *
 * 2. CSS variable approach (`--after-opacity`) replaced with direct GSAP
 *    targeting of the overlay div. CSS variables are F-Tier for animation
 *    because the compositor can't read them — every update forces a full
 *    style recalculation on the main thread.
 *
 * 3. `onUpdate` callback replaced with a GSAP scrub timeline. GSAP batches
 *    scrub updates internally, reducing per-frame style-recalc overhead.
 *
 * 4. `ScrollTrigger.normalizeScroll(true)` prevents the "jump" on pinned
 *    elements caused by iOS Safari mis-reporting scroll position, and keeps
 *    pinned elements in sync with JS-driven scroll on all mobile browsers.
 */

export default function StackingSections({ children }) {
    const container = useRef(null)

    useEffect(() => {
        // Prevent iOS/Android scroll position mis-sync on pinned elements
        ScrollTrigger.normalizeScroll(true)

        const ctx = gsap.context(() => {
            const cards = gsap.utils.toArray('.stacking-section')

            cards.forEach((card, index) => {
                const overlay = card.querySelector('.stacking-overlay')

                if (index === cards.length - 1) {
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        pin: true,
                        pinSpacing: false,
                    })
                } else {
                    // Pin every card except the last
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        endTrigger: cards[cards.length - 1],
                        end: 'top top',
                        pin: true,
                        pinSpacing: false,
                    })

                    /*
                     * Animate scale + overlay opacity as the next card scrolls in.
                     * Using a scrub timeline instead of onUpdate avoids calling
                     * gsap.set() manually 60×/s and keeps GSAP in charge of
                     * batching compositor updates.
                     * Only transform + opacity are animated — both compositor-only
                     * (A-Tier JS, potentially S-Tier via WAAPI path in GSAP4+).
                     */
                    gsap.timeline({
                        scrollTrigger: {
                            trigger: cards[index + 1],
                            start: 'top bottom',
                            end: 'top top',
                            scrub: 0.4,
                        },
                    })
                        .to(card, {
                            scale: 0.9,
                            rotation: index % 2 === 0 ? 3 : -3,
                            ease: 'none',
                        }, 0)
                        .to(overlay, {
                            opacity: 0.6,
                            ease: 'none',
                        }, 0)
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
                        <div className="stacking-section relative isolate" style={{ '--after-opacity': 0 }}>
                            {child}
                            {/*
                             * Overlay div targeted directly by GSAP.
                             * No CSS transition — GSAP owns the opacity completely.
                             * No will-change here either; GSAP sets it for the
                             * duration of the tween only.
                             */}
                            <div
                                className="stacking-overlay absolute inset-0 bg-black/50 pointer-events-none z-[500]"
                                style={{ opacity: 0 }}
                            />
                        </div>
                    )
                }
                return child
            })}
        </div>
    )
}

import React, { useRef, useEffect, Children } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
 * Card-stacking with GSAP pin (pinSpacing:false) + nextSectionRef.
 *
 * Why this architecture:
 *   - Works is outside StackingSections so its own ScrollTrigger (pinSpacing:true)
 *     gets a clean, stable document layout to measure against.
 *   - pinSpacing:false here means no spacers are added, so Works' position
 *     in the document is exactly its natural offsetTop.
 *   - Every card (including the last — Grid) is pinned until Works reaches
 *     the viewport top, using `nextSectionRef` as the endTrigger.
 *   - Grid's scale/darken animation uses Works as its scroll trigger, so
 *     Grid visually recedes as Works slides in from below.
 */
export default function StackingSections({ children, nextSectionRef }) {
    const container = useRef(null)
    const childArray = Children.toArray(children).filter(React.isValidElement)
    const count = childArray.length

    useEffect(() => {
        if (!nextSectionRef?.current) return

        const ctx = gsap.context(() => {
            const cards    = gsap.utils.toArray('.stacking-section', container.current)
            const overlays = gsap.utils.toArray('.stacking-overlay',  container.current)
            const afterEl  = nextSectionRef.current   // Works wrapper div

            cards.forEach((card, index) => {
                const overlay = overlays[index]
                const isLast  = index === count - 1

                /*
                 * Pin every card (including Grid) until Works reaches the
                 * viewport top. pinSpacing:false keeps document height stable
                 * so Works' own ScrollTrigger calculates correctly.
                 */
                ScrollTrigger.create({
                    trigger: card,
                    start:       'top top',
                    endTrigger:  afterEl,
                    end:         'top top',
                    pin:         true,
                    pinSpacing:  false,
                })

                if (!isLast) {
                    /*
                     * Non-last cards (About): scale + darken as the next
                     * stacking card (Grid) scrolls over them.
                     */
                    gsap.timeline({
                        scrollTrigger: {
                            trigger: cards[index + 1],
                            start:   'top bottom',
                            end:     'top top',
                            scrub:   true,
                        },
                    })
                        .to(card,    { scale: 0.9, rotation: index % 2 === 0 ? 3 : -3, ease: 'none' }, 0)
                        .to(overlay, { opacity: 0.6, ease: 'none' }, 0)
                } else {
                    /*
                     * Last card (Grid): scale + darken as Works slides in.
                     * Trigger is Works' wrapper — same element used as endTrigger
                     * above, so the animation perfectly coincides with the pin end.
                     */
                    gsap.timeline({
                        scrollTrigger: {
                            trigger: afterEl,
                            start:   'top bottom',
                            end:     'top top',
                            scrub:   true,
                        },
                    })
                        .to(card,    { scale: 0.9, rotation: isLast && count % 2 === 0 ? -3 : 3, ease: 'none' }, 0)
                        .to(overlay, { opacity: 0.6, ease: 'none' }, 0)
                }
            })
        }, container)

        return () => ctx.revert()
    }, [count, nextSectionRef])

    return (
        <div ref={container}>
            {childArray.map((child, index) => (
                <div
                    key={index}
                    className="stacking-section relative isolate"
                >
                    {child}
                    <div
                        className="stacking-overlay absolute inset-0 bg-black/50 pointer-events-none z-[500]"
                        style={{ opacity: 0 }}
                    />
                </div>
            ))}
        </div>
    )
}

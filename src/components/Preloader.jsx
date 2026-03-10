import { useEffect } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { SplitText } from 'gsap/SplitText'

export default function Preloader({ onComplete }) {
    useEffect(() => {
        gsap.registerPlugin(CustomEase, SplitText)
        CustomEase.create('hop', '.8, 0, .3, 1')

        document.body.style.overflow = 'hidden'

        const splitTextElements = (selector, type = 'words,chars') => {
            document.querySelectorAll(selector).forEach((el) => {
                const split = new SplitText(el, {
                    type,
                    wordsClass: 'pl-word',
                    charsClass: 'pl-char',
                })
                if (type.includes('chars')) {
                    split.chars.forEach((char) => {
                        const txt = char.textContent
                        char.innerHTML = `<span>${txt}</span>`
                    })
                }
            })
        }

        splitTextElements('.pl-intro-title h1', 'words, chars')
        splitTextElements('.pl-tag p', 'words')

        // Restore visibility now that chars/words are split and the CSS
        // transform: translateY(-100%) on inner spans keeps them hidden.
        gsap.set(['.pl-intro-title h1', '.pl-tag p'], { visibility: 'visible' })

        // Mirror overlay: pre-set all chars fully visible at rest position
        // so both halves show the same unmodified text when the cut happens.
        gsap.set('.pl-split-overlay .pl-intro-title .pl-char span', { y: '0%' })

        const tl   = gsap.timeline({ defaults: { ease: 'hop' } })
        const tags = gsap.utils.toArray('.pl-tag')

        // Tags slide up staggered
        tags.forEach((tag, i) => {
            tl.to(tag.querySelectorAll('p .pl-word'), { y: '0%', duration: 0.75 }, 0.5 + i * 0.1)
        })

        tl
            // Full "Mohammad Haider" animates in
            .to('.pl-preloader .pl-intro-title .pl-char span', { y: '0%', duration: 0.75, stagger: 0.04 }, 0.5)

            // Cut line sweeps left → right through the text
            .to('.pl-cut-line', { scaleX: 1, duration: 0.55 }, 2.3)

            // Clip each overlay to its half — the cut line sits at the seam
            .set('.pl-preloader',     { clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }, 2.85)
            .set('.pl-split-overlay', { clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }, 2.85)

        // Tags exit downward
        tags.forEach((tag, i) => {
            tl.to(tag.querySelectorAll('p .pl-word'), { y: '100%', duration: 0.75 }, 3.1 + i * 0.1)
        })

        tl
            // Cut line fades as the halves start departing
            .to('.pl-cut-line', { opacity: 0, duration: 0.35 }, 3.6)

            // Split-screen departure
            .to(
                ['.pl-preloader', '.pl-split-overlay'],
                {
                    y:        (i) => (i === 0 ? '-50%' : '50%'),
                    duration: 1,
                    onComplete: () => {
                        document.body.style.overflow = ''
                        onComplete?.()
                    },
                },
                3.6
            )

        return () => {
            tl.kill()
            document.body.style.overflow = ''
        }
    }, [onComplete])

    return (
        <>
            {/* Top overlay — animates text in and drives the cut */}
            <div className="pl-preloader">
                <div className="pl-intro-title">
                    <h1>Mohammad Haider</h1>
                </div>
            </div>

            {/* Bottom mirror — shows full text so both halves look correct at the seam */}
            <div className="pl-split-overlay">
                <div className="pl-intro-title">
                    <h1>Mohammad Haider</h1>
                </div>
            </div>

            {/* Ambient discipline tags */}
            <div className="pl-tags-overlay">
                <div className="pl-tag pl-tag-1"><p>Interface Architect</p></div>
                <div className="pl-tag pl-tag-2"><p>Creative Direction</p></div>
                <div className="pl-tag pl-tag-3"><p>Motion Systems</p></div>
            </div>

            {/* Horizontal cut line — sweeps across at the split point */}
            <div className="pl-cut-line" />
        </>
    )
}

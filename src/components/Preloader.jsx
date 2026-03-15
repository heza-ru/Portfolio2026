import { useEffect } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

/* ─────────────────────────────────────────────────────────────────────────────
   Binary-search the largest font-size (px) where the element fits maxWidth.
   Temporarily expands the element to max-content so wrapping never interferes.
   ───────────────────────────────────────────────────────────────────────────── */
function fitToWidth(el, maxWidth) {
    if (!el) return 16
    const prevWidth = el.style.width
    el.style.width = 'max-content'

    let lo = 10, hi = 1200
    while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2
        el.style.fontSize = `${mid}px`
        if (el.scrollWidth <= maxWidth) lo = mid
        else hi = mid
    }

    el.style.width = prevWidth
    el.style.fontSize = `${Math.floor(lo)}px`
    return Math.floor(lo)
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared markup used in BOTH overlay layers (primary + mirror).
   ───────────────────────────────────────────────────────────────────────────── */
function Layers() {
    return (
        <>
            <div className="pl-half pl-top">
                <p className="pl-text pl-nice-text">Nice to meet you</p>
            </div>
            <div className="pl-half pl-bottom">
                <p className="pl-text pl-im-text">I&apos;m</p>
            </div>
        </>
    )
}

export default function Preloader({ onComplete }) {
    useEffect(() => {
        gsap.registerPlugin(CustomEase)
        CustomEase.create('hop', '.8, 0, .3, 1')
        document.body.style.overflow = 'hidden'

        let tl
        let cancelled = false

        ;(async () => {
            // Wait for Instrument Serif to be fully loaded before measuring
            await document.fonts.ready
            if (cancelled) return

            const W = window.innerWidth * 0.97 // ~1.5% breathing room each side

            // Fit in primary layer, then mirror all instances
            const niceSize = fitToWidth(document.querySelector('.pl-preloader .pl-nice-text'), W)
            const imSize   = fitToWidth(document.querySelector('.pl-preloader .pl-im-text'),   W)

            document.querySelectorAll('.pl-nice-text').forEach(el => { el.style.fontSize = `${niceSize}px` })
            document.querySelectorAll('.pl-im-text')  .forEach(el => { el.style.fontSize = `${imSize}px`   })

            if (cancelled) return

            // Reveal all text at correct size before GSAP takes over (prevents
            // the one-frame flash where text is briefly visible at CSS default size)
            gsap.set('.pl-text', { visibility: 'visible' })

            // Primary layer starts below its half-section clip
            gsap.set('.pl-preloader .pl-nice-text', { y: '140%' })
            gsap.set('.pl-preloader .pl-im-text',   { y: '140%' })

            // Mirror layer: visible at resting position (im shifted down slightly)
            gsap.set('.pl-split-overlay .pl-nice-text', { y: '0%' })
            gsap.set('.pl-split-overlay .pl-im-text',   { y: '20%' })

            tl = gsap.timeline({ defaults: { ease: 'hop' } })

            tl
                // ── Curtain-reveal "Nice to meet you" ─────────────────────
                .to('.pl-preloader .pl-nice-text', { y: '0%', duration: 1.3 }, 0.15)

                // ── Curtain-reveal "I'm" — lands 20% below centre ─────────
                .to('.pl-preloader .pl-im-text',   { y: '20%', duration: 1.3 }, 0.38)

                // ── Hold, then cut line sweeps ─────────────────────────────
                .to('.pl-cut-line', { scaleX: 1, duration: 0.55 }, 2.1)

                // ── Clip each overlay to its half ──────────────────────────
                .set('.pl-preloader',     { clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }, 2.65)
                .set('.pl-split-overlay', { clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }, 2.65)

                // ── Fade cut line ──────────────────────────────────────────
                .to('.pl-cut-line', { opacity: 0, duration: 0.35 }, 3.35)

                // ── Split departure ────────────────────────────────────────
                .to(
                    ['.pl-preloader', '.pl-split-overlay'],
                    {
                        y:        (i) => (i === 0 ? '-50%' : '50%'),
                        duration: 1,
                        ease:     'hop',
                        onComplete: () => {
                            document.body.style.overflow = ''
                            onComplete?.()
                        },
                    },
                    3.35,
                )
        })()

        return () => {
            cancelled = true
            tl?.kill()
            document.body.style.overflow = ''
        }
    }, [onComplete])

    return (
        <>
            <div className="pl-preloader">  <Layers /> </div>
            <div className="pl-split-overlay"><Layers /> </div>
            <div className="pl-cut-line" />
        </>
    )
}

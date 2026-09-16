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

/* Fonts often hang forever in in-app WebViews (Luma, Instagram, etc.) when
   Google Fonts / Fontshare are blocked or deferred. Never wait unbounded. */
function fontsReadyOrTimeout(ms = 700) {
    if (!document.fonts?.ready) return Promise.resolve()
    return Promise.race([
        document.fonts.ready.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, ms)),
    ])
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
        document.documentElement.classList.add('pl-active')

        let tl
        let cancelled = false
        let completed = false

        const finish = () => {
            if (completed || cancelled) return
            completed = true
            document.body.style.overflow = ''
            document.documentElement.classList.remove('pl-active')
            onComplete?.()
        }

        /* Hard failsafe — never leave users stuck on a blank white screen in
           WebViews that pause RAF / hide the document on first paint. */
        const failsafe = setTimeout(() => {
            if (cancelled || completed) return
            tl?.kill()
            gsap.set(['.pl-preloader', '.pl-split-overlay', '.pl-cut-line'], {
                autoAlpha: 0,
                pointerEvents: 'none',
            })
            finish()
        }, 5200)

        ;(async () => {
            // Wake GSAP if the WebView reported document.hidden on load
            // (common in Luma / Instagram / LinkedIn in-app browsers).
            try { gsap.ticker.wake() } catch { /* older GSAP — ignore */ }

            await fontsReadyOrTimeout(700)
            if (cancelled) return

            // One more wake after the await — visibility may have flipped.
            try { gsap.ticker.wake() } catch { /* ignore */ }

            // Show fallback-sized type immediately so WebViews never sit on a
            // blank white sheet while we measure / schedule the timeline.
            gsap.set('.pl-text', { visibility: 'visible', opacity: 1 })

            const W = Math.min(window.innerWidth, window.visualViewport?.width || window.innerWidth) * 0.97

            const niceSize = fitToWidth(document.querySelector('.pl-preloader .pl-nice-text'), W)
            const imSize   = fitToWidth(document.querySelector('.pl-preloader .pl-im-text'),   W)

            document.querySelectorAll('.pl-nice-text').forEach(el => { el.style.fontSize = `${niceSize}px` })
            document.querySelectorAll('.pl-im-text')  .forEach(el => { el.style.fontSize = `${imSize}px`   })

            if (cancelled) return

            gsap.set('.pl-preloader .pl-nice-text', { y: '140%' })
            gsap.set('.pl-preloader .pl-im-text',   { y: '140%' })

            gsap.set('.pl-split-overlay .pl-nice-text', { y: '0%' })
            gsap.set('.pl-split-overlay .pl-im-text',   { y: '20%' })

            tl = gsap.timeline({
                defaults: { ease: 'hop' },
                // Keep the timeline advancing even if the page briefly reports hidden
                // during WebView bootstrap (otherwise the intro never plays).
                onComplete: () => {
                    clearTimeout(failsafe)
                    finish()
                },
            })

            // If the tab is still hidden when we build the timeline, force a
            // short delayed restart once it becomes visible so users see it.
            const maybeRestartOnVisible = () => {
                if (cancelled || completed) return
                if (!document.hidden) return
                const onVis = () => {
                    if (document.hidden || cancelled || completed) return
                    document.removeEventListener('visibilitychange', onVis)
                    try { gsap.ticker.wake() } catch { /* ignore */ }
                    // If we haven't gotten past the first beat, restart from 0
                    if (tl && tl.progress() < 0.05) {
                        tl.restart(true, false)
                    }
                }
                document.addEventListener('visibilitychange', onVis)
            }
            maybeRestartOnVisible()

            tl
                .to('.pl-preloader .pl-nice-text', { y: '0%', duration: 1.3 }, 0.15)
                .to('.pl-preloader .pl-im-text',   { y: '20%', duration: 1.3 }, 0.38)
                .to('.pl-cut-line', { scaleX: 1, duration: 0.55 }, 2.1)
                .set('.pl-preloader',     { clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }, 2.65)
                .set('.pl-split-overlay', { clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' }, 2.65)
                .to('.pl-cut-line', { opacity: 0, duration: 0.35 }, 3.35)
                .to(
                    ['.pl-preloader', '.pl-split-overlay'],
                    {
                        y:        (i) => (i === 0 ? '-50%' : '50%'),
                        duration: 1,
                        ease:     'hop',
                    },
                    3.35,
                )
        })()

        return () => {
            cancelled = true
            clearTimeout(failsafe)
            tl?.kill()
            document.body.style.overflow = ''
            document.documentElement.classList.remove('pl-active')
        }
    }, [onComplete])

    return (
        <>
            <div className="pl-preloader" aria-hidden="true">  <Layers /> </div>
            <div className="pl-split-overlay" aria-hidden="true"><Layers /> </div>
            <div className="pl-cut-line" aria-hidden="true" />
        </>
    )
}

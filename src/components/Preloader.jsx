import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

/* ─────────────────────────────────────────────────────────────────────────────
   Binary-search the largest font-size (px) where the element fits maxWidth.
   Temporarily expands the element to max-content so wrapping never interferes.
   ───────────────────────────────────────────────────────────────────────────── */
function fitToWidth(el, maxWidth) {
    if (!el || !(maxWidth > 0)) return null
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
    const size = Math.floor(lo)
    el.style.fontSize = `${size}px`
    return size
}

/* In-app WebViews often report visualViewport.width as 0 on first paint.
   Never feed that into fitToWidth or type collapses to ~10px. */
function safeViewportWidth() {
    const iw = window.innerWidth || document.documentElement.clientWidth || 375
    const vv = window.visualViewport?.width
    const w = (typeof vv === 'number' && vv > 40) ? Math.min(iw, vv) : iw
    return Math.max(280, w)
}

/* Fonts often hang forever in in-app WebViews (Luma, Instagram, etc.) when
   Google Fonts / Fontshare are blocked or deferred. Never wait unbounded. */
function fontsReadyOrTimeout(ms = 500) {
    if (!document.fonts?.ready) return Promise.resolve()
    return Promise.race([
        document.fonts.ready.catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, ms)),
    ])
}

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
    /* Keep latest callback without re-running the intro when parent re-renders
       (e.g. mute state flip on first touch — that was restarting the timeline
       mid-flight and dumping users mid-page in WebViews). */
    const onCompleteRef = useRef(onComplete)
    useEffect(() => {
        onCompleteRef.current = onComplete
    }, [onComplete])

    useEffect(() => {
        gsap.registerPlugin(CustomEase)
        CustomEase.create('hop', '.8, 0, .3, 1')

        try {
            if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
        } catch { /* ignore */ }
        window.scrollTo(0, 0)

        document.body.style.overflow = 'hidden'
        document.documentElement.classList.add('pl-active')

        let tl
        let cancelled = false
        let completed = false
        let hiddenDriver = null
        let onVis = null

        const finish = () => {
            if (completed || cancelled) return
            completed = true
            if (hiddenDriver) {
                clearInterval(hiddenDriver)
                hiddenDriver = null
            }
            if (onVis) {
                document.removeEventListener('visibilitychange', onVis)
                onVis = null
            }
            window.scrollTo(0, 0)
            document.body.style.overflow = ''
            document.documentElement.classList.remove('pl-active')
            // One more frame after unlock so sticky / ST measure from y=0
            requestAnimationFrame(() => {
                window.scrollTo(0, 0)
                onCompleteRef.current?.()
            })
        }

        /* Hard failsafe — never leave users stuck on a blank white screen. */
        const failsafe = setTimeout(() => {
            if (cancelled || completed) return
            tl?.kill()
            gsap.set(['.pl-preloader', '.pl-split-overlay', '.pl-cut-line'], {
                autoAlpha: 0,
                pointerEvents: 'none',
            })
            finish()
        }, 6500)

        ;(async () => {
            try { gsap.ticker.wake() } catch { /* older GSAP — ignore */ }

            // Make CSS-sized type visible immediately — never wait on measure.
            gsap.set('.pl-text', { visibility: 'visible', opacity: 1 })

            await fontsReadyOrTimeout(500)
            if (cancelled) return

            try { gsap.ticker.wake() } catch { /* ignore */ }

            const W = safeViewportWidth() * 0.94
            const niceSize = fitToWidth(document.querySelector('.pl-preloader .pl-nice-text'), W)
            const imSize   = fitToWidth(document.querySelector('.pl-preloader .pl-im-text'),   W)

            // Only apply measured sizes when they beat the CSS clamp floor —
            // protects WebViews where measurement returns nonsense.
            if (niceSize && niceSize >= 28) {
                document.querySelectorAll('.pl-nice-text').forEach(el => {
                    el.style.fontSize = `${niceSize}px`
                })
            }
            if (imSize && imSize >= 40) {
                document.querySelectorAll('.pl-im-text').forEach(el => {
                    el.style.fontSize = `${imSize}px`
                })
            }

            if (cancelled) return

            gsap.set('.pl-preloader .pl-nice-text', { y: '140%' })
            gsap.set('.pl-preloader .pl-im-text',   { y: '140%' })
            gsap.set('.pl-split-overlay .pl-nice-text', { y: '0%' })
            gsap.set('.pl-split-overlay .pl-im-text',   { y: '20%' })

            tl = gsap.timeline({
                defaults: { ease: 'hop' },
                onComplete: () => {
                    clearTimeout(failsafe)
                    finish()
                },
            })

            /* In-app WebViews often start with document.hidden=true and freeze
               rAF — GSAP never advances. Drive the timeline from setInterval
               while hidden so the intro still plays. */
            let lastTick = performance.now()
            hiddenDriver = setInterval(() => {
                if (cancelled || completed || !tl) return
                if (!document.hidden) {
                    lastTick = performance.now()
                    try { gsap.ticker.wake() } catch { /* ignore */ }
                    return
                }
                const now = performance.now()
                const dt = Math.min(0.05, (now - lastTick) / 1000)
                lastTick = now
                try {
                    tl.time(tl.time() + dt)
                } catch { /* ignore */ }
            }, 33)

            onVis = () => {
                if (document.hidden || cancelled || completed) return
                try { gsap.ticker.wake() } catch { /* ignore */ }
                if (tl && tl.progress() < 0.05) tl.restart(true, false)
            }
            document.addEventListener('visibilitychange', onVis)

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
            if (hiddenDriver) clearInterval(hiddenDriver)
            if (onVis) document.removeEventListener('visibilitychange', onVis)
            tl?.kill()
            document.body.style.overflow = ''
            document.documentElement.classList.remove('pl-active')
        }
    }, [])

    return (
        <>
            <div className="pl-preloader" aria-hidden="true"><Layers /></div>
            <div className="pl-split-overlay" aria-hidden="true"><Layers /></div>
            <div className="pl-cut-line" aria-hidden="true" />
        </>
    )
}

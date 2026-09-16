import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import WhoIAmTextCanvas from './WhoIAmTextCanvas'

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768

const BIO = 'A multidisciplinary engineer, designer and consultant — passionate about merging design and engineering to craft smooth, interactive experiences. Building digital products with a focus on motion, performance, and lasting purpose.'

/* Binary-search the largest font size (px) where el renders ≤ targetWidth
   when set to white-space: nowrap (i.e. a single line).                   */
function fitToWidth(el, targetWidth, { min = 8, max = 400 } = {}) {
    const prev = el.style.whiteSpace
    el.style.whiteSpace = 'nowrap'
    let lo = min, hi = max
    for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        el.style.fontSize = `${mid}px`
        ;(el.scrollWidth <= targetWidth) ? (lo = mid) : (hi = mid)
    }
    el.style.whiteSpace = prev
    return lo
}

export default function WhoIAm({ isReady = true }) {
    const containerRef = useRef(null)
    const wrapRef      = useRef(null)

    useEffect(() => {
        /* Hold ScrollTrigger until the preloader unlocks scroll at y=0.
           Creating pins mid-intro (while WebViews still report odd scroll
           offsets) left users landed on ENGINEER/DESIGNER/CONSULTANT. */
        if (!isReady) return

        window.scrollTo(0, 0)

        const dimEl    = document.querySelector('.wia-text-dim')
        const brightEl = document.querySelector('.wia-text-bright')

        /* ── Size bio text to fill full viewport width ────────────────────── */
        let rafId
        function sizeBio() {
            if (!dimEl || !brightEl) return
            const containerW  = window.innerWidth * 0.92
            const mobile      = window.innerWidth < 768
            // Desktop multiplier 3.5 → ~3-4 lines at desktop widths.
            // Mobile multiplier 10  → ~24 px font on a 375 px screen (readable).
            // The multiplier = how many containerW-widths the one-line text spans;
            // more = bigger font = fewer words per line when it wraps.
            const multiplier  = mobile ? 10 : 3.5
            const fs = fitToWidth(dimEl, containerW * multiplier, { min: 8, max: 600 })
            dimEl.style.fontSize    = `${fs}px`
            brightEl.style.fontSize = `${fs}px`
            dimEl.style.visibility    = 'visible'
            brightEl.style.visibility = 'visible'
        }

        document.fonts?.ready
            ? Promise.race([
                document.fonts.ready.catch(() => {}),
                new Promise((r) => setTimeout(r, 800)),
              ]).then(() => {
                sizeBio()
                window.addEventListener('resize', sizeBio, { passive: true })
              })
            : (sizeBio(), window.addEventListener('resize', sizeBio, { passive: true }))

        const ctx = gsap.context(() => {

            const rolesEl = document.querySelector('.wia-roles')
            const rows    = document.querySelectorAll('.wia-role-row')

            if (!rolesEl || !rows.length) return

            /* ── 1. Role rows — slide in from alternating sides ─────────────── */
            gsap.set(rows[0], { x: '110%' })
            gsap.set(rows[1], { x: '-110%' })
            gsap.set(rows[2], { x: '110%' })

            ScrollTrigger.create({
                trigger: rolesEl,
                start:   'top bottom',
                end:     'top top',
                scrub:   IS_MOBILE ? 0.35 : 1,
                onUpdate(self) {
                    const p = Math.min(1, Math.max(0, self.progress))
                    gsap.set(rows[0], { x: `${ 110 - p * 110}%` })
                    gsap.set(rows[1], { x: `${-110 + p * 110}%` })
                    gsap.set(rows[2], { x: `${ 110 - p * 110}%` })
                },
            })

            /* ── 2. Role rows — pin + outer exit + DESIGNER scale & fade ────────
               Shorter scroll distance on mobile so the cover → about handoff
               feels as brisk as desktop. Soft scrub (0.35) matches desktop’s
               eased scrub without the 1-frame hitch of scrub:true.           */
            ScrollTrigger.create({
                trigger:             rolesEl,
                start:               'top top',
                end:                 () => `+=${Math.round((window.visualViewport?.height || window.innerHeight) * (IS_MOBILE ? 0.85 : 1.2))}`,
                pin:                 true,
                pinType:             IS_MOBILE ? 'transform' : 'fixed',
                scrub:               IS_MOBILE ? 0.35 : 0.4,
                pinSpacing:          true,
                anticipatePin:       1,
                fastScrollEnd:       true,
                invalidateOnRefresh: true,
                onUpdate(self) {
                    const progress = Math.min(1, Math.max(0, self.progress))
                    if (progress <= 0.5) {
                        const p   = progress / 0.5
                        const cvh = window.innerHeight
                        gsap.set(rows[0], { y:  p * cvh * 1.2, scale: 1, opacity: 1, x: 0 })
                        gsap.set(rows[2], { y: -p * cvh * 1.2, scale: 1, opacity: 1, x: 0 })
                        gsap.set(rows[1], { scale: 1, opacity: 1, x: 0, y: 0 })
                    } else {
                        const cvh = window.innerHeight
                        gsap.set(rows[0], { y:  cvh * 1.2, x: 0 })
                        gsap.set(rows[2], { y: -cvh * 1.2, x: 0 })

                        const p        = (progress - 0.5) / 0.5
                        const minScale = window.innerWidth <= 768 ? 0.22 : 0.1
                        const scale    = 1 - p * (1 - minScale)
                        const opacity  = 1 - p
                        rows.forEach(row => gsap.set(row, { scale, opacity }))
                    }
                },
                onLeave() {
                    // Ensure rows are fully cleared once the pin releases so
                    // they never ghost over the About / Works sections.
                    rows.forEach(row => gsap.set(row, { opacity: 0, pointerEvents: 'none' }))
                },
                onEnterBack() {
                    rows.forEach(row => gsap.set(row, { pointerEvents: 'auto' }))
                },
            })

            /* ── 3. Clip-path text reveal ────────────────────────────────────────
               Desktop: dim base + bright canvas layer reveal on scroll.
               Mobile: WhoIAmTextCanvas is disabled, so the bright layer is empty —
               running the same clip would hide the only paragraph and leave a
               blank block. Show the bio at full opacity instead.              */
            if (dimEl && brightEl) {
                if (IS_MOBILE) {
                    gsap.set(dimEl, {
                        clipPath:   'none',
                        visibility: 'visible',
                        color:      '#F0EDE8',
                    })
                    gsap.set(brightEl, {
                        display:        'none',
                        visibility:     'hidden',
                        pointerEvents:  'none',
                    })
                } else {
                    gsap.set(brightEl, { clipPath: 'inset(0 0 100% 0)' })
                    gsap.set(dimEl,    { clipPath: 'inset(0 0 0% 0)' })

                    /* Trigger on the section (not dimEl) so the parallax y-transform
                       on textWrapEl doesn't offset the start/end positions.         */
                    ScrollTrigger.create({
                        trigger:             '.wia-about',
                        start:               'top 60%',
                        end:                 'bottom 95%',
                        scrub:               0.5,
                        invalidateOnRefresh: true,
                        onUpdate(self) {
                            const pct = (1 - Math.min(1, Math.max(0, self.progress))) * 100
                            // bright reveals top-down; dim hides top-down in sync —
                            // exactly one layer visible at any scroll position
                            gsap.set(brightEl, { clipPath: `inset(0 0 ${pct}% 0)` })
                            gsap.set(dimEl,    { clipPath: `inset(${100 - pct}% 0 0 0)` })
                        },
                    })
                }
            }

            /* ── 4. Parallax — eyebrow only, and only on desktop ────────────────
               On mobile the y: 200 → -250 on textWrapEl shifts it below the
               natural DOM position, which creates a visible gap between sections.
               Eyebrow parallax is safe (no effect on clip-path position).       */
            const eyebrowEl  = document.querySelector('.wia-eyebrow')
            const textWrapEl = document.querySelector('.wia-text-wrap')

            if (eyebrowEl && !IS_MOBILE) {
                gsap.fromTo(eyebrowEl,
                    { y: 80 },
                    {
                        y: -80,
                        ease: 'none',
                        scrollTrigger: {
                            trigger:             '.wia-about',
                            start:               'top bottom',
                            end:                 'bottom top',
                            scrub:               true,
                            invalidateOnRefresh: true,
                        },
                    }
                )
            }

            /* Text wrap parallax only on desktop — on mobile the 200 px initial
               offset creates a visible gap between sections when overflowing    */
            if (textWrapEl && !IS_MOBILE) {
                gsap.fromTo(textWrapEl,
                    { y: 200 },
                    {
                        y: -250,
                        ease: 'none',
                        scrollTrigger: {
                            trigger:             '.wia-about',
                            start:               'top bottom',
                            end:                 'bottom top',
                            scrub:               true,
                            invalidateOnRefresh: true,
                        },
                    }
                )
            }

            // Force recalculation after all triggers + pin spacer are in the DOM
            ScrollTrigger.refresh()

        }, containerRef)

        let refreshTimer
        if (IS_MOBILE) {
            // Mobile address-bar / late layout: refresh once more after paint
            // so pin start aligns with the sticky hero cover seam.
            requestAnimationFrame(() => {
                window.scrollTo(0, 0)
                ScrollTrigger.refresh()
            })
            refreshTimer = setTimeout(() => {
                window.scrollTo(0, 0)
                ScrollTrigger.refresh()
            }, 400)
        }

        return () => {
            ctx.revert()
            window.removeEventListener('resize', sizeBio)
            cancelAnimationFrame(rafId)
            if (refreshTimer) clearTimeout(refreshTimer)
        }
    }, [isReady])

    return (
        <div ref={containerRef} id="about" className="wia-container" style={{ backgroundColor: '#0A0A0A' }}>

            {/* ── Section 1: Roles reveal ───────────────────────────────────── */}
            <section className="wia-roles">
                <div className="wia-role-row">ENGINEER</div>
                <div className="wia-role-row">DESIGNER</div>
                <div className="wia-role-row">CONSULTANT</div>
            </section>

            {/* ── Section 2: Who I Am ──────────────────────────────────────── */}
            <section className="wia-about">
                <div className="wia-eyebrow">
                    <span>Who</span>
                    <span>I</span>
                    <span>Am</span>
                </div>

                <div ref={wrapRef} className="wia-text-wrap">
                    <p className="wia-text wia-text-dim">{BIO}</p>
                    {/* pretext canvas — displaces text around cursor & tail */}
                    <div className="wia-text wia-text-bright">
                        <WhoIAmTextCanvas wrapRef={wrapRef} />
                    </div>
                </div>
            </section>

        </div>
    )
}

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

export default function WhoIAm() {
    const containerRef = useRef(null)
    const wrapRef      = useRef(null)

    useEffect(() => {
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

        document.fonts.ready.then(() => {
            sizeBio()
            window.addEventListener('resize', sizeBio, { passive: true })
        })

        const ctx = gsap.context(() => {

            const vh    = window.innerHeight
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
                scrub:   1,
                onUpdate(self) {
                    const p = self.progress
                    gsap.set(rows[0], { x: `${ 110 - p * 110}%` })
                    gsap.set(rows[1], { x: `${-110 + p * 110}%` })
                    gsap.set(rows[2], { x: `${ 110 - p * 110}%` })
                },
            })

            /* ── 2. Role rows — pin + outer exit + DESIGNER scale & fade ────────
               Shorter scroll distance (1.2 × vh) so the outro finishes quickly.
               Second half: DESIGNER scales down AND fades to nothing.          */
            ScrollTrigger.create({
                trigger:             rolesEl,
                start:               'top top',
                end:                 () => `+=${window.innerHeight * 1.2}`,
                pin:                 true,
                scrub:               0.4,
                pinSpacing:          true,
                invalidateOnRefresh: true,
                onUpdate(self) {
                    if (self.progress <= 0.5) {
                        const p   = self.progress / 0.5
                        const cvh = window.innerHeight
                        gsap.set(rows[0], { y:  p * cvh * 1.2, scale: 1, opacity: 1 })
                        gsap.set(rows[2], { y: -p * cvh * 1.2, scale: 1, opacity: 1 })
                        gsap.set(rows[1], { scale: 1, opacity: 1 })
                    } else {
                        const cvh = window.innerHeight
                        gsap.set(rows[0], { y:  cvh * 1.2 })
                        gsap.set(rows[2], { y: -cvh * 1.2 })

                        const p        = (self.progress - 0.5) / 0.5
                        const minScale = window.innerWidth <= 768 ? 0.22 : 0.1
                        const scale    = 1 - p * (1 - minScale)
                        const opacity  = 1 - p               // ← fade DESIGNER out
                        rows.forEach(row => gsap.set(row, { scale, opacity }))
                    }
                },
            })

            /* ── 3. Clip-path text reveal ────────────────────────────────────────
               Created AFTER the pin trigger so the pin spacer is already in the
               DOM and ScrollTrigger positions are accurate.
               invalidateOnRefresh ensures positions stay correct on resize.    */
            if (dimEl && brightEl) {
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
                        const pct = (1 - self.progress) * 100
                        // bright reveals top-down; dim hides top-down in sync —
                        // exactly one layer visible at any scroll position
                        gsap.set(brightEl, { clipPath: `inset(0 0 ${pct}% 0)` })
                        gsap.set(dimEl,    { clipPath: `inset(${100 - pct}% 0 0 0)` })
                    },
                })
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

        return () => {
            ctx.revert()
            window.removeEventListener('resize', sizeBio)
            cancelAnimationFrame(rafId)
        }
    }, [])

    return (
        <div ref={containerRef} id="about" style={{ backgroundColor: '#0A0A0A' }}>

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

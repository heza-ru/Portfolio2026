import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const BIO = 'A multidisciplinary engineer, designer and consultant — building digital products and systems with clarity, craft and lasting purpose.'

export default function WhoIAm() {
    const containerRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {

            /* ── 1. Clip-path text reveal ────────────────────────────────────
               Two identical paragraphs are stacked.  The bright copy starts
               fully clipped from the bottom; GSAP unclips it as it scrolls
               through the viewport centre.                                   */
            const dimEl    = document.querySelector('.wia-text-dim')
            const brightEl = document.querySelector('.wia-text-bright')

            if (dimEl && brightEl) {
                gsap.set(brightEl, { clipPath: 'inset(0 0 100% 0)' })

                ScrollTrigger.create({
                    trigger: dimEl,
                    start:   'top 65%',
                    end:     'bottom 35%',
                    scrub:   1.2,
                    onUpdate(self) {
                        const pct = (1 - self.progress) * 100
                        gsap.set(brightEl, { clipPath: `inset(0 0 ${pct}% 0)` })
                    },
                })
            }

            /* ── 2. Role rows — slide in from alternating sides ─────────────
               Rows 0 & 2 enter from the right, row 1 from the left,
               while the section travels up from below the viewport.          */
            const rolesEl = document.querySelector('.wia-roles')
            const rows    = document.querySelectorAll('.wia-role-row')

            if (!rolesEl || !rows.length) return

            // Off-screen starting positions
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

            /* ── 3. Role rows — pin + outer rows exit + scale-down ───────────
               Uses absolute pixel values (vh-based) so the rows reliably
               exit the overflow:hidden clip boundary of the section.
                 progress 0→0.5 : rows 0 & 2 slide out (up / down)
                 progress 0.5→1 : all three scale to a small centred mark    */
            const vh = window.innerHeight

            ScrollTrigger.create({
                trigger:    rolesEl,
                start:      'top top',
                end:        `+=${vh * 2}`,
                pin:        true,
                scrub:      1,
                pinSpacing: true,
                onUpdate(self) {
                    if (self.progress <= 0.5) {
                        const p = self.progress / 0.5
                        gsap.set(rows[0], { y: p * vh * 1.2,  scale: 1 })
                        gsap.set(rows[2], { y: -p * vh * 1.2, scale: 1 })
                        gsap.set(rows[1], { scale: 1 })
                    } else {
                        // Lock outer rows off-screen
                        gsap.set(rows[0], { y:  vh * 1.2 })
                        gsap.set(rows[2], { y: -vh * 1.2 })

                        // Scale all three down together (only row 1 is visible)
                        const p        = (self.progress - 0.5) / 0.5
                        const minScale = window.innerWidth <= 768 ? 0.22 : 0.1
                        const scale    = 1 - p * (1 - minScale)
                        rows.forEach(row => gsap.set(row, { scale }))
                    }
                },
            })

        }, containerRef)

        return () => ctx.revert()
    }, [])

    return (
        /* Dark background on the container itself prevents any transparent
           gap showing through during the pin-spacer scroll phase.           */
        <div ref={containerRef} style={{ backgroundColor: '#0A0A0A' }}>

            {/* ── Section 1: Who I Am ──────────────────────────────────────── */}
            <section className="wia-about">
                <p className="wia-eyebrow">Who I Am</p>

                {/* Two-layer text reveal: dim base + GSAP-animated bright copy */}
                <div className="wia-text-wrap">
                    <p className="wia-text wia-text-dim">{BIO}</p>
                    <p className="wia-text wia-text-bright" aria-hidden="true">{BIO}</p>
                </div>
            </section>

            {/* ── Section 2: Roles reveal ───────────────────────────────────── */}
            <section className="wia-roles">
                <div className="wia-role-row">ENGINEER</div>
                <div className="wia-role-row">DESIGNER</div>
                <div className="wia-role-row">CONSULTANT</div>
            </section>

        </div>
    )
}

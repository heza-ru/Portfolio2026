import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STATEMENT =
    'Architecting digital experiences where deep cinematic aesthetics meet rigorous technical execution.'

const ROWS = [
    { label: 'Digital Design',         dir: 1  },
    { label: 'Frontend Engineering',   dir: -1 },
    { label: 'Creative Direction',     dir: 1  },
]

export default function About() {
    const sectionRef = useRef(null)
    const textRef    = useRef(null)
    const row0       = useRef(null)
    const row1       = useRef(null)
    const row2       = useRef(null)
    const rowRefs    = [row0, row1, row2]

    useEffect(() => {
        const section = sectionRef.current
        const text    = textRef.current
        if (!section || !text) return

        // Stamp the text content onto data-text so ::before can mirror it
        text.setAttribute('data-text', text.textContent.trim())

        const ctx = gsap.context(() => {

            /* ── 1. Clip-path text reveal ─────────────────────────────────
             * As the section scrolls from 80 % to 20 % of the viewport the
             * bright ::before overlay sweeps from fully-hidden (100%) to
             * fully-revealed (0%), matching the CODE 7 scrub effect exactly.
             */
            ScrollTrigger.create({
                trigger: text,
                start:   'top 85%',
                end:     'bottom 25%',
                scrub:   1,
                onUpdate(self) {
                    const clip = Math.max(0, 100 - self.progress * 100)
                    text.style.setProperty('--about-clip', `${clip}%`)
                },
            })

            /* ── 2. Service rows — slide in from alternating sides ────────
             * As the section enters (bottom → 30 % from top) each row
             * lerps from ±80 % translateX back to 0 %, matching the CODE 7
             * services-header entrance scroll trigger.
             */
            const rowEls = rowRefs.map(r => r.current).filter(Boolean)
            gsap.set(rowEls[0], { x:  '80%' })
            gsap.set(rowEls[1], { x: '-80%' })
            gsap.set(rowEls[2], { x:  '80%' })

            ScrollTrigger.create({
                trigger: section,
                start:   'top bottom',
                end:     'top 20%',
                scrub:   1,
                onUpdate(self) {
                    const p = self.progress
                    gsap.set(rowEls[0], { x: `${ 80 - p * 80}%` })
                    gsap.set(rowEls[1], { x: `${-80 + p * 80}%` })
                    gsap.set(rowEls[2], { x: `${ 80 - p * 80}%` })
                },
            })

        }, section)

        return () => ctx.revert()
    }, [])

    return (
        <section
            id="about"
            ref={sectionRef}
            className="relative h-screen w-full bg-[#0A0A0A] text-[#F0EDE8] flex flex-col justify-between overflow-hidden py-10 px-6 md:px-16"
        >
            {/* ── Top metadata bar ─────────────────────────────────────── */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] opacity-40">
                <span>01 / About</span>
                <span>Mohammad Haider — Available for Work</span>
            </div>

            {/* ── Clip-path statement text ──────────────────────────────── */}
            <div className="flex-1 flex items-center">
                <h2
                    ref={textRef}
                    className="about-animate-text font-body text-[clamp(1.6rem,3.8vw,4rem)] leading-[1.15] tracking-tight w-full max-w-5xl"
                >
                    {STATEMENT}
                </h2>
            </div>

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="w-full h-px bg-white/10 mb-4" />

            {/* ── Service rows ─────────────────────────────────────────── */}
            <div className="flex flex-col overflow-hidden">
                {ROWS.map(({ label }, i) => (
                    <div
                        key={label}
                        ref={rowRefs[i]}
                        className="will-change-transform border-t border-white/10 last:border-b py-2 md:py-3"
                        style={{ overflow: 'hidden' }}
                    >
                        <span className="font-heading uppercase text-[clamp(2rem,5.5vw,5.5rem)] leading-none tracking-tight opacity-90 whitespace-nowrap block">
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Bottom metadata ───────────────────────────────────────── */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] opacity-30 mt-4">
                <span>Portfolio 2026</span>
                <span>Riyadh, KSA</span>
            </div>
        </section>
    )
}

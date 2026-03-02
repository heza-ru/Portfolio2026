import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const STATEMENT =
    'Architecting digital experiences where deep cinematic aesthetics meet rigorous technical execution.'

const ROWS = [
    { label: 'Digital Design'       },
    { label: 'Frontend Engineering' },
    { label: 'Creative Direction'   },
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

        // Stamp text onto data-text so the CSS ::before mirror can read it
        text.setAttribute('data-text', text.textContent.trim())

        const ctx = gsap.context(() => {

            /* ── 1. CODE 7 clip-path text reveal ─────────────────────────
             * Trigger on the section itself (more reliable inside a pinned
             * card) — as the section scrolls from below the fold to the top
             * of the viewport, the bright ::before overlay sweeps upward,
             * revealing the full-brightness text one line at a time.
             */
            ScrollTrigger.create({
                trigger: section,
                start:   'top 90%',
                end:     'top 10%',
                scrub:   1.2,
                onUpdate(self) {
                    const clip = Math.max(0, 100 - self.progress * 100)
                    text.style.setProperty('--about-clip', `${clip}%`)
                },
            })

            /* ── 2. Service rows — alternating side entrance ─────────────
             * Each row starts off-screen (±100 %) and slides to 0 as the
             * section enters, matching CODE 7's services-header entrance.
             */
            const rowEls = rowRefs.map(r => r.current).filter(Boolean)
            gsap.set(rowEls[0], { x:  '100%' })
            gsap.set(rowEls[1], { x: '-100%' })
            gsap.set(rowEls[2], { x:  '100%' })

            ScrollTrigger.create({
                trigger: section,
                start:   'top bottom',
                end:     'top 15%',
                scrub:   1,
                onUpdate(self) {
                    const p = self.progress
                    gsap.set(rowEls[0], { x: `${  100 - p * 100}%` })
                    gsap.set(rowEls[1], { x: `${ -100 + p * 100}%` })
                    gsap.set(rowEls[2], { x: `${  100 - p * 100}%` })
                },
            })

        }, section)

        return () => ctx.revert()
    }, [])

    return (
        <section
            id="about"
            ref={sectionRef}
            className="relative h-[100dvh] w-full bg-[#0A0A0A] text-[#F0EDE8] flex flex-col justify-between overflow-hidden pt-20 md:pt-24 pb-8 md:pb-10 px-5 md:px-16"
        >
            {/* ── Section label — sits below the navbar safe zone ──────── */}
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-35 self-start">
                About Me
            </div>

            {/* ── CODE 7 clip-path statement reveal ────────────────────── */}
            <div className="flex-1 flex items-center">
                <h2
                    ref={textRef}
                    className="about-animate-text font-body text-[clamp(1.15rem,3.6vw,3.8rem)] leading-[1.2] tracking-tight w-full max-w-5xl"
                >
                    {STATEMENT}
                </h2>
            </div>

            {/* ── Divider ───────────────────────────────────────────────── */}
            <div className="w-full h-px bg-white/10 mb-3" />

            {/* ── Service rows ─────────────────────────────────────────── */}
            <div className="flex flex-col">
                {ROWS.map(({ label }, i) => (
                    <div
                        key={label}
                        ref={rowRefs[i]}
                        className="will-change-transform border-t border-white/10 last:border-b py-1.5 md:py-3 overflow-hidden"
                    >
                        <span className="font-heading uppercase text-[clamp(1.1rem,4.5vw,5rem)] leading-none tracking-tight opacity-90 whitespace-nowrap block">
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    )
}

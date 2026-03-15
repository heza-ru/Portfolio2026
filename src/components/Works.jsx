import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT DATA
   To add a real project:
     1. Drop your image  into  public/works/<name>.jpg
     2. Drop your gif    into  public/works/<name>.gif
     3. Update the `image`, `gif`, and `link` fields below.
   ──────────────────────────────────────────────────────────────────────── */
const WORKS = [
    {
        id: 1,
        title: 'TrackStack',
        category: 'Product',
        year: '2025',
        image: 'https://picsum.photos/seed/ts1/900/675',
        gif:   'https://picsum.photos/seed/ts1a/900/675',   // replace with real .gif
        link:  '#',
    },
    {
        id: 2,
        title: 'Portfolio',
        category: 'Design',
        year: '2025',
        image: 'https://picsum.photos/seed/pf2/900/675',
        gif:   'https://picsum.photos/seed/pf2a/900/675',
        link:  '#',
    },
    {
        id: 3,
        title: 'Brand System',
        category: 'Branding',
        year: '2024',
        image: 'https://picsum.photos/seed/bs3/900/675',
        gif:   'https://picsum.photos/seed/bs3a/900/675',
        link:  '#',
    },
    {
        id: 4,
        title: 'Dashboard',
        category: 'Engineering',
        year: '2024',
        image: 'https://picsum.photos/seed/db4/900/675',
        gif:   'https://picsum.photos/seed/db4a/900/675',
        link:  '#',
    },
]

/* ── 3-D tilt helpers ───────────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t

function useTilt(ref) {
    useEffect(() => {
        const el = ref.current
        if (!el) return

        let raf, cx = 0, cy = 0, tx = 0, ty = 0

        function tick() {
            cx = lerp(cx, tx, 0.1)
            cy = lerp(cy, ty, 0.1)
            el.style.transform = `perspective(900px) rotateY(${cx}deg) rotateX(${cy}deg) scale3d(1.03,1.03,1.03)`
            raf = requestAnimationFrame(tick)
        }

        function onMove(e) {
            const r = el.getBoundingClientRect()
            const nx = (e.clientX - r.left) / r.width  - 0.5   // -0.5 … 0.5
            const ny = (e.clientY - r.top)  / r.height - 0.5
            tx =  nx * 18     // max ±9 deg horizontal
            ty = -ny * 12     // max ±6 deg vertical
        }

        function onEnter() {
            raf = requestAnimationFrame(tick)
        }

        function onLeave() {
            cancelAnimationFrame(raf)
            tx = 0; ty = 0
            // ease back to flat
            let steps = 0
            function easeOut() {
                cx = lerp(cx, 0, 0.12)
                cy = lerp(cy, 0, 0.12)
                el.style.transform = `perspective(900px) rotateY(${cx}deg) rotateX(${cy}deg) scale3d(1,1,1)`
                if (Math.abs(cx) > 0.01 || Math.abs(cy) > 0.01) {
                    raf = requestAnimationFrame(easeOut)
                } else {
                    el.style.transform = ''
                }
            }
            raf = requestAnimationFrame(easeOut)
        }

        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mousemove',  onMove)
        el.addEventListener('mouseleave', onLeave)

        return () => {
            cancelAnimationFrame(raf)
            el.removeEventListener('mouseenter', onEnter)
            el.removeEventListener('mousemove',  onMove)
            el.removeEventListener('mouseleave', onLeave)
        }
    }, [])
}

/* ── Single polaroid card ───────────────────────────────────────────────── */
function PolaroidCard({ work, column }) {
    const [hovered, setHovered] = useState(false)
    const cardRef = useRef(null)

    useTilt(cardRef)

    return (
        /* Outer wrapper handles GSAP parallax translate-Y.
           Inner wrapper (cardRef) handles the 3-D tilt so the two
           transforms don't clobber each other.                      */
        <div className={`works-polaroid-wrap works-polaroid-wrap--${column}`}>
            <a
                ref={cardRef}
                href={work.link}
                target="_blank"
                rel="noopener noreferrer"
                className="works-polaroid"
                style={{ transformStyle: 'preserve-3d' }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className="works-polaroid-img">
                    {/* Inner wrapper receives the scroll parallax y-shift */}
                    <div className="works-polaroid-img-inner">
                        <img
                            src={hovered && work.gif ? work.gif : work.image}
                            alt={work.title}
                            draggable="false"
                        />
                    </div>
                </div>

                <div className="works-polaroid-caption">
                    <span className="works-polaroid-title">{work.title}</span>
                    <span className="works-polaroid-cat">{work.category} · {work.year}</span>
                </div>

            </a>
        </div>
    )
}

/* ── Section ────────────────────────────────────────────────────────────── */
export default function Works() {
    const containerRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {

            /* ── Card parallax (desktop only) ───────────────────────────────── */
            if (window.innerWidth >= 768) {
                document.querySelectorAll('.works-polaroid-wrap').forEach((wrap, i) => {
                    const isLeft = i % 2 === 0
                    gsap.fromTo(wrap,
                        { y: isLeft ? 120 : 0   },
                        {
                            y:    isLeft ? -80  : -40,
                            ease: 'none',
                            scrollTrigger: {
                                trigger:             wrap,
                                start:               'top bottom',
                                end:                 'bottom top',
                                scrub:               true,
                                invalidateOnRefresh: true,
                            },
                        }
                    )
                })
            }

            /* ── Image inner parallax ───────────────────────────────────────────
               The inner wrapper (not the img itself) gets the y shift so it
               never conflicts with GSAP's own transform on the img element.
               ±50px travel is large enough to be clearly visible.             */
            document.querySelectorAll('.works-polaroid-img-inner').forEach(inner => {
                gsap.fromTo(inner,
                    { y: 100 },
                    {
                        y:    -100,
                        ease: 'none',
                        scrollTrigger: {
                            trigger:             inner.closest('.works-polaroid-wrap'),
                            start:               'top bottom',
                            end:                 'bottom top',
                            scrub:               true,
                            invalidateOnRefresh: true,
                        },
                    }
                )
            })

        }, containerRef)

        return () => ctx.revert()
    }, [])

    return (
        <div ref={containerRef} className="works-section" style={{ backgroundColor: '#0A0A0A' }}>

            <div className="works-header">
                <span>Selected</span>
                <span>Works</span>
            </div>

            <div className="works-grid-wrap">
                <div className="works-grid">
                    {WORKS.map((work, i) => (
                        <PolaroidCard
                            key={work.id}
                            work={work}
                            column={i % 2 === 0 ? 'left' : 'right'}
                        />
                    ))}
                </div>
            </div>

            {/* ── See More ── */}
            <div className="works-see-more-wrap">
                <a href="#" className="works-see-more">
                    <span>See More</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
                    </svg>
                </a>
            </div>

        </div>
    )
}

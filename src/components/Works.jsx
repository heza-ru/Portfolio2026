import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* ─────────────────────────────────────────────────────────────────────────
   PROJECT DATA
   Fields:
     image / gif  — URL (external or public/works/<name>.jpg)
     comingSoon   — shows an overlay instead of linking out
   ──────────────────────────────────────────────────────────────────────── */
const WORKS = [
    {
        id: 1,
        title: 'Tuneminal',
        category: 'CLI · Go',
        year: '2025',
        description: 'A lightweight open-source karaoke machine for your terminal — play songs, follow scrolling lyrics, and sing from the command line. Built with real-time audio visualisation and karaoke scoring.',
        image: 'https://opengraph.githubassets.com/tuneminal/heza-ru/Tuneminal',
        gif:   'https://opengraph.githubassets.com/tuneminal-hover/heza-ru/Tuneminal',
        link:  'https://github.com/heza-ru/Tuneminal',
        comingSoon: false,
    },
    {
        id: 2,
        title: 'Netstalgia',
        category: 'Web · Next.js',
        year: '2025',
        description: 'A lovingly cursed 90s-style web app that loads like dial-up. Complete with pixel-art loading bars, pop-up ads, a guestbook, Windows 95 desktop, and the iconic dancing baby GIF.',
        image: 'https://raw.githubusercontent.com/heza-ru/Netstalgia/main/public/assets/screenshots/nsdesktopscreen.png',
        gif:   'https://raw.githubusercontent.com/heza-ru/Netstalgia/main/public/assets/screenshots/nswebpageabout.png',
        link:  'https://netstalgia.netlify.app',
        comingSoon: false,
    },
    {
        id: 3,
        title: 'CallScribe',
        category: 'Extension · React',
        year: '2025',
        description: 'A Chromium browser extension that extracts Mindtickle call transcripts and converts them into structured JIRA tickets and Productboard insights via Claude AI — with one click.',
        image: 'https://opengraph.githubassets.com/callscribe/heza-ru/CallScribe',
        gif:   'https://opengraph.githubassets.com/callscribe-hover/heza-ru/CallScribe',
        link:  'https://github.com/heza-ru/CallScribe',
        comingSoon: false,
    },
    {
        id: 4,
        title: 'Project Localhost',
        category: 'Infrastructure · RPi',
        year: '2026',
        description: 'A Raspberry Pi 5 local infrastructure stack running DNS resolution, home automation, and a fully self-hosted LLM — entirely on your own hardware, zero cloud dependency.',
        image: 'https://opengraph.githubassets.com/localhost/heza-ru/Project-Localhost',
        gif:   'https://opengraph.githubassets.com/localhost/heza-ru/Project-Localhost',
        link:  'https://github.com/heza-ru/Project-Localhost',
        comingSoon: true,
    },
]

/* ── 3-D tilt helpers ───────────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768

function useTilt(ref) {
    useEffect(() => {
        /* No mouse on touch devices — skip the RAF loop entirely. */
        if (IS_MOBILE) return

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

/* ── Marquee strip ──────────────────────────────────────────────────────── */
function Marquee({ text }) {
    /* Two identical spans inside a flex track.
       The animation translates the track by -50% (= exactly one span width),
       then instantly resets to 0 — creating a seamless infinite loop.        */
    const copy = `${text}   ·   `
    return (
        <div className="works-marquee-wrap" aria-hidden="true">
            <div className="works-marquee-track">
                <span>{copy}</span>
                <span>{copy}</span>
            </div>
        </div>
    )
}

/* ── Single polaroid card ───────────────────────────────────────────────── */
function PolaroidCard({ work, column }) {
    const [hovered, setHovered] = useState(false)
    const cardRef = useRef(null)

    useTilt(cardRef)

    const Tag = work.comingSoon ? 'div' : 'a'
    const linkProps = work.comingSoon
        ? {}
        : { href: work.link, target: '_blank', rel: 'noopener noreferrer' }

    return (
        <div className={`works-polaroid-wrap works-polaroid-wrap--${column}`}>
            <Tag
                ref={cardRef}
                {...linkProps}
                className={`works-polaroid${work.comingSoon ? ' works-polaroid--soon' : ''}`}
                style={{ transformStyle: 'preserve-3d' }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className="works-polaroid-img">
                    <div className="works-polaroid-img-inner">
                        <img
                            src={hovered && work.gif ? work.gif : work.image}
                            alt={work.title}
                            draggable="false"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>

                    {/* Coming-soon overlay sits above the image */}
                    {work.comingSoon && (
                        <div className="works-polaroid-soon-overlay">
                            <span>Coming Soon</span>
                        </div>
                    )}
                </div>

                <div className="works-polaroid-caption">
                    <span className="works-polaroid-title">{work.title}</span>
                    <span className="works-polaroid-cat">{work.category} · {work.year}</span>
                </div>

                {/* Scrolling description marquee */}
                <Marquee text={work.description} />

            </Tag>
        </div>
    )
}

/* ── Section ────────────────────────────────────────────────────────────── */
export default function Works() {
    const containerRef = useRef(null)

    useEffect(() => {
        /* ── Marquee — GSAP-driven so it isn't blocked by the global
           prefers-reduced-motion CSS override (animation-duration:0.001ms)  */
        const marqueeKills = []
        document.querySelectorAll('.works-marquee-track').forEach(track => {
            /* Wait one frame so the DOM has painted and scrollWidth is correct */
            requestAnimationFrame(() => {
                const spanW = track.children[0]?.scrollWidth
                if (!spanW) return

                const tween = gsap.fromTo(track,
                    { x: 0 },
                    { x: -spanW, duration: 18, ease: 'none', repeat: -1 }
                )

                /* Pause / resume on pointer enter / leave */
                const card = track.closest('.works-polaroid')
                if (card) {
                    const pause  = () => tween.pause()
                    const resume = () => tween.play()
                    card.addEventListener('mouseenter', pause)
                    card.addEventListener('mouseleave', resume)
                    marqueeKills.push(() => {
                        card.removeEventListener('mouseenter', pause)
                        card.removeEventListener('mouseleave', resume)
                    })
                }

                marqueeKills.push(() => tween.kill())
            })
        })

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
               never conflicts with GSAP's own transform on the img element.  */
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

        return () => {
            ctx.revert()
            marqueeKills.forEach(fn => fn())
        }
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

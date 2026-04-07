import React, { useRef, useEffect } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'
import HeroModel from './HeroModel'

function ItalicAName({ children, className = '' }) {
    return (
        <span className={`font-instrument font-normal not-italic ${className}`}>
            {String(children).split('').map((char, i) =>
                char === 'a'
                    ? <em key={i} className="italic">{char}</em>
                    : <React.Fragment key={i}>{char}</React.Fragment>
            )}
        </span>
    )
}

/* Binary-search font size so el fills targetWidth on one line */
function fitToWidth(el, targetWidth) {
    const prev = el.style.whiteSpace
    el.style.whiteSpace = 'nowrap'
    let lo = 10, hi = 400
    for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2
        el.style.fontSize = `${mid}px`
        el.scrollWidth <= targetWidth ? (lo = mid) : (hi = mid)
    }
    el.style.whiteSpace = prev
    return lo
}

export default function Hero({ isLoaded, audioDataRef }) {
    // scrollWrapper is 250vh tall — gives scroll distance while the inner
    // section is pinned. useScroll tracks this wrapper so scrollYProgress
    // goes 0→1 over the full 150vh of "extra" scroll room.
    const scrollWrapper = useRef(null)
    const mohammadRef   = useRef(null)
    const haiderRef     = useRef(null)

    const { scrollYProgress } = useScroll({
        target: scrollWrapper,
        offset: ['start start', 'end end'],
    })

    const yTextBack  = useTransform(scrollYProgress, [0, 0.6], ['0%', '12%'])
    const yTextFront = useTransform(scrollYProgress, [0, 0.6], ['0%', '-8%'])
    const textOpacity = useTransform(scrollYProgress, [0, 0.35, 0.6], [1, 0.4, 0])

    /* ── Mobile-only: fit each name to fill the viewport width ── */
    useEffect(() => {
        function sizeNames() {
            const isMobile = window.innerWidth < 768
            const m = mohammadRef.current
            const h = haiderRef.current
            if (!m || !h) return

            if (isMobile) {
                const vw = window.innerWidth * 0.92
                document.fonts.ready.then(() => {
                    fitToWidth(m, vw)
                    fitToWidth(h, vw)
                })
            } else {
                m.style.fontSize = ''
                h.style.fontSize = ''
            }
        }

        sizeNames()
        window.addEventListener('resize', sizeNames, { passive: true })
        return () => window.removeEventListener('resize', sizeNames)
    }, [])

    return (
        <>
            {/* Tall wrapper gives scroll distance while the inner section stays pinned */}
            <div ref={scrollWrapper} id="hero" className="relative h-[250vh]">
                <section className="sticky top-0 h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-[#0A0A0A]">

                    {/* ── Back name: Mohammad ── */}
                    <motion.div
                        style={{ y: yTextBack, opacity: textOpacity }}
                        className="absolute z-[5] left-[2%] md:left-[8%] top-[28%] md:top-[30%] pointer-events-none mix-blend-difference max-w-[96vw] overflow-hidden"
                    >
                        <motion.h1
                            initial={{ x: '-40%', opacity: 0 }}
                            animate={isLoaded ? { x: '0%', opacity: 1 } : {}}
                            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                            ref={mohammadRef}
                            className="text-[clamp(2.8rem,14vw,14rem)] leading-none text-white select-none"
                        >
                            <ItalicAName>Mohammad</ItalicAName>
                        </motion.h1>
                    </motion.div>

                    {/* ── 3D model ── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={isLoaded ? { opacity: 1 } : {}}
                        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        className="absolute inset-0 z-[1]"
                    >
                        <HeroModel audioDataRef={audioDataRef} scrollProgress={scrollYProgress} />
                    </motion.div>

                    {/* ── Front name: Haider ── */}
                    <motion.div
                        style={{ y: yTextFront, opacity: textOpacity }}
                        className="absolute z-[15] right-[2%] md:right-[8%] top-[50%] md:top-[50%] pointer-events-none mix-blend-difference max-w-[96vw] overflow-hidden"
                    >
                        <motion.h1
                            initial={{ x: '40%', opacity: 0 }}
                            animate={isLoaded ? { x: '0%', opacity: 1 } : {}}
                            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                            ref={haiderRef}
                            className="text-[clamp(2.8rem,14vw,14rem)] leading-none text-white select-none text-right"
                        >
                            <ItalicAName>Haider</ItalicAName>
                        </motion.h1>
                    </motion.div>

                </section>
            </div>

            <div id="hero-sentinel" className="h-px w-full bg-transparent" aria-hidden="true" />
        </>
    )
}

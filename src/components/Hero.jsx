import React, { useRef } from 'react'
import { useScroll, useTransform, motion } from 'framer-motion'
import HeroModel from './HeroModel'

export default function Hero({ isLoaded }) {
    const container = useRef(null)
    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start start', 'end start'],
    })

    // Parallax layers
    const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '15%'])
    const yTextBack = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
    const yTextFront = useTransform(scrollYProgress, [0, 1], ['0%', '-15%'])

    return (
        <>
            <section
                id="hero"
                ref={container}
                className="relative sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#0A0A0A]"
            >
                {/* ── Back name: Mohammad — Layer 1 (behind portrait) ── */}
                <motion.div
                    style={{ y: yTextBack }}
                    className="absolute z-[5] left-[4%] md:left-[8%] top-[30%] pointer-events-none"
                >
                    <motion.h1
                        initial={{ x: '-40%', opacity: 0 }}
                        animate={isLoaded ? { x: '0%', opacity: 1 } : {}}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        className="font-drama italic text-[clamp(4rem,14vw,14rem)] leading-none text-[#F0EDE8]/90 select-none"
                    >
                        Mohammad
                    </motion.h1>
                </motion.div>

                {/* ── Layer 0: Full-screen 3D hero model ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isLoaded ? { opacity: 1 } : {}}
                    transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    style={{ y: yBg }}
                    className="absolute inset-0 z-[1]"
                >
                    <HeroModel />
                </motion.div>

                {/* ── Front name: Haider — Layer 4 (in front of portrait) ── */}
                <motion.div
                    style={{ y: yTextFront }}
                    className="absolute z-[15] right-[4%] md:right-[8%] top-[50%] pointer-events-none"
                >
                    <motion.h1
                        initial={{ x: '40%', opacity: 0 }}
                        animate={isLoaded ? { x: '0%', opacity: 1 } : {}}
                        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                        className="font-drama italic text-[clamp(4rem,14vw,14rem)] leading-none text-[#F0EDE8] select-none text-right"
                    >
                        Haider
                    </motion.h1>
                </motion.div>
            </section>

            {/* ── Sentinel: Navbar IntersectionObserver watches this ── */}
            <div id="hero-sentinel" className="h-px w-full bg-transparent" aria-hidden="true" />
        </>
    )
}

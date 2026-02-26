import React, { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Spline from '@splinetool/react-spline'
import PixelReveal from './PixelReveal'

function WireframeFallback() {
    return (
        <div className="w-full h-full flex items-center justify-center opacity-20 border border-black/20 rounded-full animate-[spin_20s_linear_infinite]">
            <div className="w-3/4 h-3/4 border border-black/40 flex items-center justify-center rotate-45">
                <div className="w-1/2 h-1/2 border border-black/60 -rotate-45"></div>
            </div>
        </div>
    )
}

export default function About() {
    const container = useRef(null)
    const pixelRef = useRef(null)   // imperative handle for the Spline pixel-reveal
    const [splineLoaded, setSplineLoaded] = useState(false)

    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start end', 'end start']
    })

    // Layer 4 (Fastest parallax for 3D element + ghost numeral)
    const yLayer4 = useTransform(scrollYProgress, [0, 1], ['-20%', '20%'])

    // Layer 3 (Text element parallax)
    const yText = useTransform(scrollYProgress, [0, 1], ['5%', '-5%'])

    // Layer 1 (Slow floating elements)
    const yLayer1 = useTransform(scrollYProgress, [0, 1], ['10%', '-10%'])

    const statement = 'Architecting digital experiences where deep cinematic aesthetics meet rigorous technical execution.'
    const words = statement.split(' ')

    /* When Spline loads → trigger the pixel reveal imperatively */
    const handleSplineLoad = () => {
        setSplineLoaded(true)
        pixelRef.current?.reveal()
    }

    return (
        <section
            ref={container}
            className="relative sticky top-0 h-screen w-full bg-[#F0EDE8] text-[#0A0A0A] flex items-center justify-center overflow-hidden py-12"
        >
            {/* Background Floating Elements — Layer 1 */}
            <motion.div
                style={{ y: yLayer1 }}
                className="absolute left-[10%] top-[20%] w-64 h-64 border border-black/10 rounded-full pointer-events-none"
            />
            <motion.div
                style={{ y: yLayer1 }}
                className="absolute right-[20%] bottom-[10%] w-32 h-32 border border-accent/40 rotate-45 pointer-events-none"
            />

            {/* Layer 4: Ghost Numeral */}
            <motion.div style={{ y: yLayer4 }} className="absolute z-0 inset-0 pointer-events-none flex items-center justify-end md:pr-[10%]">
                <span className="font-drama italic text-[30vw] text-black opacity-[0.04] select-none leading-none">01</span>
            </motion.div>

            {/* Layer 4: Spline canvas — wrapped in PixelReveal */}
            <motion.div style={{ y: yLayer4 }} className="absolute z-0 right-0 top-1/2 -translate-y-1/2 w-full md:w-1/2 h-[80vh] pointer-events-auto">
                {/*
          scrollReveal=true so it triggers when the About section scrolls into view.
          Additionally, we also call reveal() imperatively once Spline has loaded.
          The ref exposes { reveal, cover }.
          Color is cream (#F0EDE8) to match the About section background.
        */}
                <PixelReveal
                    ref={pixelRef}
                    scrollReveal={true}
                    startCovered={true}
                    duration={1.1}
                    blockDuration={0.05}
                    delay={0.2}
                    color="#F0EDE8"
                    style={{ width: '100%', height: '100%' }}
                    className="about-spline-reveal"
                >
                    {/* Override block color to match cream bg so reveal feels natural */}
                    {!splineLoaded && <WireframeFallback />}
                    <Spline
                        scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
                        onLoad={handleSplineLoad}
                        className={splineLoaded ? 'opacity-100' : 'opacity-0'}
                        style={{ transition: 'opacity 0.6s ease' }}
                    />
                </PixelReveal>
            </motion.div>

            {/* About Header */}
            <div className="absolute top-24 left-6 md:left-20 z-50 text-[#0A0A0A] pointer-events-none">
                <motion.h2
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="font-heading text-[clamp(2.5rem,5vw,5rem)] leading-none uppercase tracking-tight"
                >
                    About<br />Me
                </motion.h2>
            </div>

            {/* Layer 3: Typography Content */}
            <motion.div
                style={{ y: yText }}
                className="relative z-10 container mx-auto px-6 md:px-20 grid grid-cols-1 md:grid-cols-12 gap-12 pointer-events-none"
            >
                <div className="md:col-span-8 flex flex-col gap-16 pointer-events-auto">

                    {/* Circling SVG Text Label */}
                    <div className="relative w-32 h-32 animate-[spin_12s_linear_infinite]" data-cursor="READ">
                        <svg viewBox="0 0 100 100" className="w-full h-full text-black/40">
                            <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                            <text className="font-mono text-[9px] uppercase tracking-widest fill-current">
                                <textPath href="#circlePath" startOffset="0%">
                                    Available for Work — Creative Developer — 2026 —
                                </textPath>
                            </text>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="w-1 h-1 bg-accent rounded-full" />
                        </div>
                    </div>

                    {/* Word Cascade Statement */}
                    <h2 className="font-body text-[clamp(2rem,4vw,4rem)] leading-[1.1] text-[#0A0A0A] max-w-4xl" data-cursor="READ">
                        {words.map((word, i) => (
                            <span key={i} className="inline-block mr-[0.25em] relative overflow-hidden pb-2 pointer-events-auto">
                                <motion.span
                                    initial={{ y: '100%', opacity: 0 }}
                                    whileInView={{ y: '0%', opacity: 1 }}
                                    viewport={{ once: true, margin: '-10%' }}
                                    transition={{ duration: 0.6, delay: i * 0.04, ease: [0.76, 0, 0.24, 1] }}
                                    className="inline-block"
                                >
                                    {word === 'cinematic' || word === 'rigorous' ? (
                                        <span className="relative inline-block text-accent">
                                            {word}
                                            <motion.span
                                                initial={{ scaleX: 0 }}
                                                whileInView={{ scaleX: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.4 }}
                                                className="absolute left-0 bottom-1 w-full h-[2px] bg-accent origin-left"
                                            />
                                        </span>
                                    ) : word}
                                </motion.span>
                            </span>
                        ))}
                    </h2>

                    {/* Detailed text */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="font-mono text-sm opacity-80 max-w-md leading-relaxed pointer-events-auto"
                    >
                        Not interested in building digital brochures. Every interaction should feel intentional, every transition breathless. Bridging the gap between conceptual editorial design and highly-performant frontend architecture.
                    </motion.p>
                </div>
            </motion.div>
        </section>
    )
}

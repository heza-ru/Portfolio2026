import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import PixelReveal from './PixelReveal'

export default function Grid() {
    const container = useRef(null)

    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start end', 'end start']
    })

    // Layer 4 - Frontend giant numeral
    const yLayer4 = useTransform(scrollYProgress, [0, 1], ['-15%', '15%'])

    // Layer 1 - Background textures
    const yLayer1 = useTransform(scrollYProgress, [0, 1], ['10%', '-10%'])

    // Hover effects helper
    const cellVariants = {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        hover: { y: -4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }
    }

    return (
        <section
            ref={container}
            className="relative sticky top-0 h-screen w-full py-24 px-6 md:px-20 bg-[#0A0A0A] overflow-hidden flex flex-col"
        >
            {/* Background Ghost Numeral */}
            <motion.div
                style={{ y: yLayer4 }}
                className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
            >
                <span className="font-drama italic text-[40vw] text-white opacity-[0.03] select-none leading-none -translate-x-1/4">
                    02
                </span>
            </motion.div>

            <div className="relative z-10 container mx-auto flex flex-col gap-8 text-[#F0EDE8] h-full">
                <div className="flex justify-between items-end flex-shrink-0">
                    <h2 className="font-heading text-[clamp(2.5rem,6vw,6rem)] leading-none uppercase tracking-tight">
                        Information<br />Architecture
                    </h2>
                    <span className="font-mono text-sm opacity-60 hidden md:block">
                        [ Data Allocation Grid ]
                    </span>
                </div>

                <motion.div
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ staggerChildren: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 lg:grid-rows-3 gap-4 md:gap-6 flex-1 min-h-0 pb-4"
                >

                    {/* ── Stat Counter (1x2) ── */}
                    <motion.div
                        variants={cellVariants}
                        transition={{ ease: [0.76, 0, 0.24, 1], duration: 0.6 }}
                        whileHover="hover"
                        className="lg:col-span-2 lg:row-span-2 border border-white/10 rounded-2xl p-8 flex flex-col justify-between group overflow-hidden relative cursor-default bg-[#0A0A0A]"
                    >
                        {/* Pixel-reveal wraps the background texture image */}
                        <PixelReveal
                            scrollReveal
                            startCovered
                            duration={0.8}
                            blockDuration={0.05}
                            delay={0}
                            style={{ position: 'absolute', inset: -40, zIndex: 0 }}
                        >
                            <motion.div
                                style={{ y: yLayer1 }}
                                className="w-full h-full bg-[url('https://images.unsplash.com/photo-1542382257-80dedb725088?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-10 grayscale mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
                            />
                        </PixelReveal>

                        <div className="relative z-10 flex flex-col gap-2">
                            <span className="font-mono text-xs uppercase tracking-widest opacity-60">Lines of Code Deployed</span>
                            <span className="font-heading text-5xl md:text-7xl text-accent">2M+</span>
                        </div>
                        <div className="relative z-10 font-mono text-sm opacity-50 group-hover:opacity-100 transition-opacity">
                            Continual iteration loop.
                        </div>
                    </motion.div>

                    {/* ── Ambient Image (2x1) — pixel reveal ── */}
                    <motion.div
                        variants={cellVariants}
                        transition={{ ease: [0.76, 0, 0.24, 1], duration: 0.6 }}
                        whileHover="hover"
                        className="col-span-1 md:col-span-2 lg:col-span-2 border border-white/10 rounded-2xl overflow-hidden relative group bg-black"
                    >
                        {/* PixelReveal wraps the entire cell content */}
                        <PixelReveal
                            scrollReveal
                            startCovered
                            duration={1.0}
                            blockDuration={0.05}
                            delay={0.1}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1506501139174-099022df5260?q=80&w=800&auto=format&fit=crop"
                                alt="Grid abstract"
                                className="w-full h-full object-cover opacity-60 grayscale group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute bottom-6 left-6 font-mono text-xs z-10 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                [Visual Core]
                            </div>
                        </PixelReveal>
                    </motion.div>

                    {/* ── Marquee Strip (2x1) ── */}
                    <motion.div
                        variants={cellVariants}
                        transition={{ ease: [0.76, 0, 0.24, 1], duration: 0.6 }}
                        whileHover={{ y: -4, backgroundColor: 'rgba(232, 168, 124, 0.05)' }}
                        className="col-span-1 md:col-span-2 lg:col-span-2 border border-white/10 rounded-2xl p-6 flex flex-col justify-center overflow-hidden bg-[#0A0A0A]"
                        data-cursor="DRAG"
                    >
                        <div className="relative flex whitespace-nowrap overflow-hidden">
                            <motion.div
                                animate={{ x: [0, -1000] }}
                                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                className="font-heading text-5xl md:text-6xl text-transparent bg-clip-text"
                                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.4)' }}
                            >
                                UI/UX ENGINEERING • WEBGL SHADERS • CREATIVE DIRECTION • INTERACTIVE PROTOTYPING •&nbsp;
                                UI/UX ENGINEERING • WEBGL SHADERS • CREATIVE DIRECTION • INTERACTIVE PROTOTYPING •
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* ── Status Card (1x1) ── */}
                    <motion.div
                        variants={cellVariants}
                        transition={{ ease: [0.76, 0, 0.24, 1], duration: 0.6 }}
                        whileHover="hover"
                        className="flex items-center justify-center border border-white/10 rounded-2xl p-6 group bg-[#0A0A0A] relative"
                        data-cursor="READ"
                    >
                        <div className="text-center font-mono opacity-80 group-hover:text-accent transition-colors">
                            <div className="text-3xl mb-2">✦</div>
                            <div className="text-xs uppercase tracking-wider">System Status:<br />Optimal</div>
                        </div>
                    </motion.div>

                    {/* ── Tools Cloud (3x1) ── */}
                    <motion.div
                        variants={cellVariants}
                        transition={{ ease: [0.76, 0, 0.24, 1], duration: 0.6 }}
                        whileHover="hover"
                        className="lg:col-span-3 lg:row-span-1 border border-white/10 rounded-2xl p-8 flex flex-col overflow-hidden relative group bg-[#0A0A0A]"
                    >
                        <span className="font-mono text-xs uppercase tracking-widest opacity-60 mb-6">Execution Stack</span>
                        <div className="flex flex-wrap gap-2 text-sm font-mono opacity-80">
                            {['React 19', 'Next.js', 'Three.js / React-Three-Fiber', 'GSAP', 'Tailwind', 'GLSL Shaders', 'Framer Motion', 'Figma', 'Spline', 'Lenis'].map((tool) => (
                                <span key={tool} className="border border-white/20 rounded-full px-4 py-1 group-hover:border-white/40 transition-colors">
                                    {tool}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* ── Contact CTA (2x1) ── */}
                    <motion.div
                        variants={cellVariants}
                        transition={{ ease: [0.76, 0, 0.24, 1], duration: 0.6 }}
                        whileHover={{ y: -4, backgroundColor: 'rgba(240, 237, 232, 0.05)' }}
                        className="col-span-1 md:col-span-2 lg:col-span-2 border border-white/10 rounded-2xl p-8 flex flex-col justify-between group bg-[#0A0A0A] relative overflow-hidden"
                        data-cursor="CLICK"
                    >
                        <div className="font-drama italic text-3xl md:text-4xl text-white group-hover:text-accent transition-colors">
                            Initialize a conversation.
                        </div>
                        <a
                            href="mailto:hello@example.com"
                            className="link-lift font-mono text-sm uppercase tracking-widest border-b border-white/30 pb-1 w-fit group-hover:border-accent group-hover:text-accent transition-colors block"
                        >
                            transmission@haider.com
                        </a>
                    </motion.div>

                </motion.div>
            </div>
        </section>
    )
}

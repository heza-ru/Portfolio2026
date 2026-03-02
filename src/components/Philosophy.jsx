import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Philosophy() {
    const container = useRef(null)

    const { scrollYProgress } = useScroll({
        target: container,
        offset: ['start end', 'end start']
    })

    // Layer 0 - Background Parallax
    const yBg = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

    // Layer 4 - Foreground giant numeral
    const yLayer4 = useTransform(scrollYProgress, [0, 1], ['-20%', '20%'])

    return (
        <section
            ref={container}
            className="relative sticky top-0 z-0 h-[100dvh] w-full flex flex-col justify-center py-10 md:py-16 bg-[#0A0A0A] overflow-hidden"
        >
            {/* Layer 0: Background Texture Parallax */}
            <motion.div
                style={{ y: yBg }}
                className="absolute inset-x-0 -top-[30%] -bottom-[30%] opacity-[0.08] pointer-events-none mix-blend-overlay z-0"
            >
                <img
                    src="https://images.unsplash.com/photo-1518640165980-fc0eb537bfe7?q=80&w=2000&auto=format&fit=crop"
                    alt="Concrete Texture"
                    className="w-full h-full object-cover grayscale"
                />
            </motion.div>

            {/* Layer 4: Foreground Ghost Numeral */}
            <motion.div
                style={{ y: yLayer4 }}
                className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
            >
                <span className="font-drama italic text-[45vw] text-white opacity-[0.04] select-none leading-none -translate-x-[10%]">
                    03
                </span>
            </motion.div>

            <div className="relative z-10 container mx-auto px-6 md:px-20 text-[#F0EDE8]">

                {/* Contrasting Statements */}
                <div className="flex flex-col gap-5 md:gap-12 max-w-5xl mx-auto mb-8 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.8 }}
                        className="font-mono text-sm uppercase tracking-widest text-accent opacity-80"
                    >
                        [ System Philosophy ]
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="font-drama italic text-[clamp(1.25rem,3.8vw,5rem)] leading-tight drop-shadow-lg"
                        data-cursor="READ"
                    >
                        "The difference between an application and an experience is the intentional calibration of empty space and motion."
                    </motion.h2>
                </div>

                {/* Process Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 w-full border-t border-white/10 pt-8 mt-8">
                    <ProcessStep
                        number="01"
                        title="Extraction"
                        desc="Synthesizing the core signal from stakeholder noise. Defining the absolute constraints of the technical architecture."
                        delay={0.4}
                    />
                    <ProcessStep
                        number="02"
                        title="Formulation"
                        desc="Constructing the visual language and interaction paradigms. Prototyping shaders, typography constraints, and motion choreographies."
                        delay={0.5}
                    />
                    <ProcessStep
                        number="03"
                        title="Execution"
                        desc="Rigorous React implementation. Writing performant WebGL layers, strict state management, and robust responsive logic."
                        delay={0.6}
                    />
                </div>

            </div>
        </section>
    )
}

function ProcessStep({ number, title, desc, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay }}
            className="flex flex-col gap-4 group"
        >
            <div className="font-mono text-xs opacity-40 group-hover:text-accent transition-colors">
                Phase {number}
            </div>
            <h3 className="font-heading text-xl md:text-3xl tracking-tight uppercase group-hover:pl-2 transition-all duration-300">
                {title}
            </h3>
            <p className="font-body text-sm opacity-60 leading-relaxed pr-6">
                {desc}
            </p>
        </motion.div>
    )
}

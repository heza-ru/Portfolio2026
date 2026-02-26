import React, { useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

const sectionData = [
    {
        index: '01',
        title: 'About Me',
        section: 'about',
        bgColor: '#F0EDE8',
        textColor: '#0A0A0A',
        accentColor: '#B8860B',
        image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2000&auto=format&fit=crop',
        statement: 'Architecting digital experiences where deep cinematic aesthetics meet rigorous technical execution.',
        description: 'Not interested in building digital brochures. Every interaction should feel intentional, every transition breathless. Bridging the gap between conceptual editorial design and highly-performant frontend architecture.',
    },
    {
        index: '02',
        title: 'Selected Works',
        section: 'works',
        bgColor: '#0A0A0A',
        textColor: '#F0EDE8',
        accentColor: '#B8860B',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop',
        statement: 'Crafting immersive digital narratives through experimental interfaces and next-generation web technologies.',
        description: 'From WebGL shader experiments to large-scale interactive installations. Every project pushes the boundaries of what\'s possible in the browser while maintaining ruthless attention to performance.',
    },
    {
        index: '03',
        title: 'Philosophy',
        section: 'philosophy',
        bgColor: '#F0EDE8',
        textColor: '#0A0A0A',
        accentColor: '#B8860B',
        image: 'https://images.unsplash.com/photo-1518640165980-fc0eb537bfe7?q=80&w=2000&auto=format&fit=crop',
        statement: 'The difference between an application and an experience is the intentional calibration of empty space and motion.',
        description: 'Process-driven approach: Extract the signal from noise → Construct visual language and interaction paradigms → Execute with rigorous React architecture and performant WebGL layers.',
    },
]

export default function StickyCards() {
    const container = useRef(null)

    useGSAP(
        () => {
            const cards = gsap.utils.toArray('.sticky-card')

            cards.forEach((card, index) => {
                // Pin all cards except the last one
                if (index < cards.length - 1) {
                    ScrollTrigger.create({
                        trigger: card,
                        start: 'top top',
                        endTrigger: cards[cards.length - 1],
                        end: 'top top',
                        pin: true,
                        pinSpacing: false,
                    })
                }

                // Scale and rotate animation for all cards except the last
                if (index < cards.length - 1) {
                    ScrollTrigger.create({
                        trigger: cards[index + 1],
                        start: 'top bottom',
                        end: 'top top',
                        onUpdate: (self) => {
                            const progress = self.progress
                            const scale = 1 - progress * 0.1
                            const rotation = (index % 2 === 0 ? 3 : -3) * progress
                            const afterOpacity = progress * 0.6

                            gsap.set(card, {
                                scale: scale,
                                rotation: rotation,
                                '--after-opacity': afterOpacity,
                            })
                        },
                    })
                }
            })
        },
        { scope: container }
    )

    return (
        <div ref={container} className="relative">
            {sectionData.map((data, index) => (
                <StickyCard key={data.section} data={data} index={index} />
            ))}
        </div>
    )
}

function StickyCard({ data, index }) {
    return (
        <section
            id={data.section}
            className="sticky-card relative h-screen w-full overflow-hidden flex items-center justify-center will-change-transform"
            style={{
                backgroundColor: data.bgColor,
                color: data.textColor,
                '--after-opacity': 0,
            }}
        >
            {/* Overlay that darkens on stack */}
            <div
                className="absolute inset-0 bg-black/50 pointer-events-none z-[5] transition-opacity duration-100"
                style={{ opacity: 'var(--after-opacity, 0)' }}
            />

            {/* Background Image with Parallax */}
            <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none">
                <img
                    src={data.image}
                    alt=""
                    className="w-full h-full object-cover grayscale"
                />
            </div>

            {/* Giant Ghost Index Number */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-[5%] md:pr-[10%] opacity-[0.05]">
                <span className="font-drama italic text-[30vw] md:text-[35vw] select-none leading-none">
                    {data.index}
                </span>
            </div>

            {/* Content Container */}
            <div className="relative z-10 container mx-auto px-6 md:px-20 py-24 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
                {/* Left Column: Title */}
                <div className="md:col-span-5 flex flex-col justify-between">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        <div className="font-mono text-[10px] md:text-xs uppercase tracking-widest opacity-40 mb-6">
                            {data.index} / Section
                        </div>
                        <h2 className="font-heading text-[clamp(3rem,6vw,6rem)] leading-[0.9] uppercase tracking-tight">
                            {data.title}
                        </h2>
                    </motion.div>

                    {/* Decorative Accent Line */}
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="hidden md:block h-[2px] w-32 origin-left mt-12"
                        style={{ backgroundColor: data.accentColor }}
                    />
                </div>

                {/* Right Column: Content */}
                <div className="md:col-span-7 flex flex-col gap-8 justify-center">
                    {/* Main Statement */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="font-body text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.2] max-w-2xl"
                        data-cursor="READ"
                    >
                        {data.statement}
                    </motion.p>

                    {/* Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex gap-8"
                    >
                        <div className="hidden md:block font-mono text-xs uppercase tracking-widest opacity-40 flex-shrink-0 pt-1">
                            (Details)
                        </div>
                        <p className="font-mono text-sm leading-relaxed opacity-70 max-w-lg">
                            {data.description}
                        </p>
                    </motion.div>

                    {/* CTA Link */}
                    <motion.a
                        href={`#${data.section}`}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-10%' }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="group w-fit font-mono text-xs uppercase tracking-widest flex items-center gap-3 pt-4 hover:gap-5 transition-all duration-300"
                        style={{ color: data.accentColor }}
                        data-cursor="EXPLORE"
                    >
                        <span>Explore More</span>
                        <span className="text-base transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </motion.a>
                </div>
            </div>
        </section>
    )
}

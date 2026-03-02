import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import PixelReveal from './PixelReveal'
import ImageParallax from './ImageParallax'

gsap.registerPlugin(ScrollTrigger)

const projects = [
    {
        title: 'Neon Odyssey',
        category: 'Creative Direction',
        image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop',
        description: 'A deeply immersive brand experience blending vivid 3D environments with stark typographic contrast. Designed to challenge conventional tech presentation formats.'
    },
    {
        title: 'Abyssal Plane',
        category: 'WebGL Architecture',
        image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop',
        description: 'An experimental shader exploration visualizing oceanic depths. Utilizes custom GLSL passes to create fluid, responsive atmospheric distortion.'
    },
    {
        title: 'Phantom Thread',
        category: 'Interactive Installation',
        image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2000&auto=format&fit=crop',
        description: 'Physical-to-digital bridge connecting movement tracking sensors with generative particle systems capable of rendering 1M+ points at 60fps.'
    },
    {
        title: 'Void Protocol',
        category: 'UI / UX Engineering',
        image: 'https://images.unsplash.com/photo-1535223289429-462106a84af7?q=80&w=2000&auto=format&fit=crop',
        description: 'A zero-UI operating system interface concept — every action triggered by intent, gesture, and context rather than explicit navigation. Built in React with custom state-machine choreography.'
    },
    {
        title: 'Echo Chamber',
        category: 'Generative Audio-Visual',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2000&auto=format&fit=crop',
        description: 'Real-time audio analysis pipeline feeding GLSL vertex shaders, translating frequency bands into organic topographic deformations at 120fps on consumer hardware.'
    },
    {
        title: 'Dark Matter',
        category: 'Brand Identity System',
        image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2000&auto=format&fit=crop',
        description: 'End-to-end visual identity for a deep-tech AI lab — from motion principles and type hierarchy to a component library shipping across web, print, and spatial computing surfaces.'
    },
]

export default function Works() {
    const container = useRef(null)
    const scrollTrackRef = useRef(null)

    React.useEffect(() => {
        /*
         * DO NOT call ScrollTrigger.normalizeScroll(true) here.
         * ReactLenis (root) + useLenis(ScrollTrigger.update) already bridge
         * all scroll events to ScrollTrigger. Calling normalizeScroll on top
         * of Lenis causes touch events to be processed twice, which makes a
         * single swipe jump 5-6 panels at once on mobile.
         */

        const ctx = gsap.context(() => {
            const track  = scrollTrackRef.current
            const panels = gsap.utils.toArray('.work-panel')

            const HORIZONTAL_MULTIPLIER = 1.0
            const horizontalTravel = () =>
                (track.offsetWidth - window.innerWidth) * HORIZONTAL_MULTIPLIER

            // On mobile screens give more vertical scroll budget per panel so
            // a single swipe doesn't fly through multiple panels.
            const isMobile = () => window.innerWidth < 768
            const VERTICAL_MULTIPLIER_DESKTOP = 0.5
            const VERTICAL_MULTIPLIER_MOBILE  = 1.4
            const verticalBudget = () =>
                track.offsetWidth * (isMobile() ? VERTICAL_MULTIPLIER_MOBILE : VERTICAL_MULTIPLIER_DESKTOP)

            gsap.to(track, {
                x: () => -horizontalTravel(),
                ease: 'none',
                scrollTrigger: {
                    trigger: container.current,
                    start: 'top top',
                    end: verticalBudget,
                    invalidateOnRefresh: true,
                    scrub: 1,          // slight lag makes mobile feel smoother
                    snap: {
                        snapTo:      1 / (panels.length - 1),
                        directional: true,   // one panel per swipe — prevents multi-panel jumps
                        duration:    { min: 0.3, max: 0.6 },
                        delay:       0.05,
                        ease:        'power1.inOut',
                    },
                    pin: true,
                    pinSpacing: true,
                },
            })
        }, container)

        return () => ctx.revert()
    }, [])

    return (
        <section ref={container} className="relative h-[100dvh] w-full bg-[#F0EDE8] overflow-hidden">
            {/* Works Header */}
            <div className="absolute top-16 md:top-24 left-5 md:left-20 z-50 text-[#0A0A0A] pointer-events-none">
                <h2 className="font-heading text-[clamp(1.8rem,5vw,5rem)] leading-none uppercase tracking-tight">
                    Selected<br />Works
                </h2>
            </div>

            {/* Horizontal Scrolling Track — width = panels.length × 100vw */}
            <div ref={scrollTrackRef} className="flex h-full w-[600vw]">
                {projects.map((project, i) => (
                    <WorkPanel key={i} project={project} index={i} />
                ))}
            </div>
        </section>
    )
}

const WorkPanel = ({ project, index }) => {
    const panelInner = useRef(null)

    const { scrollYProgress } = useScroll({
        target: panelInner,
        offset: ['start end', 'end start']
    })
    const yBg = useTransform(scrollYProgress, [0, 1], ['-10%', '10%'])

    return (
        <div className="work-panel w-screen h-[100dvh] flex items-center justify-center p-4 md:p-24 pb-6 md:pb-12 pt-24 md:pt-48 group">
            <ImageParallax className="relative w-full h-full" intensity={8}>
            <div className="w-full h-full overflow-hidden rounded-xl md:rounded-3xl" data-cursor="VIEW WORK">
                <div ref={panelInner} className="absolute inset-0 w-full h-full overflow-hidden">

                    {/* ── Pixel-reveal wraps the background image ── */}
                    <PixelReveal
                        scrollReveal
                        startCovered
                        duration={0.9}
                        blockDuration={0.05}
                        delay={index * 0.12}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    >
                        <motion.img
                            style={{ y: yBg, scale: 1.2 }}
                            src={project.image}
                            alt={project.title}
                            className="absolute inset-0 w-full h-full object-cover object-center grayscale contrast-125 transition-transform duration-700 group-hover:scale-110 group-hover:grayscale-0"
                        />
                    </PixelReveal>

                    {/* Dark Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-transparent opacity-90" />

                    {/* Floating Rule Line */}
                    <div className="absolute top-1/4 left-0 w-2/3 h-[1px] bg-white/10 pointer-events-none" />

                    {/* Typography Content */}
                    <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 flex flex-col z-20 pointer-events-none pr-6 md:pr-12 max-w-3xl">
                        <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-accent mb-3 opacity-90 backdrop-blur-sm w-fit px-3 py-1.5 rounded-sm border border-white/20 bg-black/20">
                            {String(index + 1).padStart(2, '0')} // {project.category}
                        </span>
                        <h3 className="font-drama italic text-3xl md:text-6xl lg:text-[7rem] leading-none text-[#F0EDE8] drop-shadow-2xl mb-2 md:mb-4">
                            {project.title}
                        </h3>
                        <p className="font-body text-sm md:text-base text-white/80 leading-relaxed max-w-lg drop-shadow-md">
                            {project.description}
                        </p>
                    </div>
                </div>
            </div>
            </ImageParallax>
        </div>
    )
}

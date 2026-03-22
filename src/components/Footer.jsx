import React, { useEffect, useRef } from 'react'
import Matter from 'matter-js'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import HoverChars from './HoverChars'

/* Italic every 'a' — same pattern as hero title */
function ItalicA({ children }) {
    return (
        <span className="font-instrument font-normal not-italic">
            {String(children).split('').map((ch, i) =>
                ch === 'a'
                    ? <em key={i} className="italic">{ch}</em>
                    : <React.Fragment key={i}>{ch}</React.Fragment>
            )}
        </span>
    )
}

/* ── Physics blocks — [width, height] pairs, no text ───────────────────── */
const BLOCKS_DESKTOP = [
    [220, 80], [140, 140], [300, 70],
    [260, 90], [120, 120], [340, 80],
    [200, 70], [160, 160], [110, 110],
    [80,  80], [190, 65],
]

const BLOCKS_MOBILE = [
    [130, 55], [90, 90],  [160, 50],
    [100, 70], [75, 75],  [140, 55],
    [80,  80], [110, 50],
]

const LINKS = {
    quick: [
        { label: 'Home',    href: '#hero' },
        { label: 'About',   href: '#about' },
        { label: 'Works',   href: '#works' },
        { label: 'Contact', href: '#footer' },
        { label: 'Labs',    href: '/labs' },
        { label: 'Logs',    href: '/logs' },
    ],
    networks: [
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/heza/' },
        { label: 'GitHub',   href: 'https://github.com/heza-ru' },
    ],
}

const isMobile = () => window.innerWidth < 768

export default function Footer() {
    const sectionRef   = useRef(null)
    const containerRef = useRef(null)
    const engineRef    = useRef(null)
    const runnerRef    = useRef(null)
    const rafRef       = useRef(null)
    const bodiesRef    = useRef([])

    useEffect(() => {
        const section   = sectionRef.current
        const container = containerRef.current
        if (!section || !container) return

        /* ── Navbar fade-out as footer enters ───────────────────────────────
           Fades the navbar to invisible as the footer scrolls into view,
           then restores it when scrolling back up.                         */
        const navbar = document.querySelector('nav')
        let navST = null
        if (navbar) {
            navST = gsap.to(navbar, {
                opacity: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: section,
                    start:   'top 80%',   // start fading when footer is near
                    end:     'top 20%',   // fully gone before footer top hits
                    scrub:   true,
                    invalidateOnRefresh: true,
                },
            })
        }

        let initiated = false

        function initPhysics() {
            if (initiated) return
            initiated = true

            const { width, height } = container.getBoundingClientRect()
            const T = 200

            /* Fewer blocks on mobile → lower solver cost is sufficient. */
            const mobile = isMobile()
            const engine = Matter.Engine.create({
                positionIterations:   mobile ? 10 : 20,
                velocityIterations:   mobile ?  8 : 16,
                constraintIterations: mobile ?  6 : 12,
            })
            engine.gravity          = { x: 0, y: 1.2 }
            engine.timing.timeScale = 0.85   // slight slow-mo helps settle cleanly
            engineRef.current = engine

            /* ── Walls (bottom + left + right) ── */
            Matter.World.add(engine.world, [
                Matter.Bodies.rectangle(width / 2,     height + T / 2, width + T * 2, T, { isStatic: true }),
                Matter.Bodies.rectangle(-T / 2,        height / 2,     T, height + T * 2, { isStatic: true }),
                Matter.Bodies.rectangle(width + T / 2, height / 2,     T, height + T * 2, { isStatic: true }),
            ])

            /* ── Staggered block drops ───────────────────────────────────────
               Blocks are added 120 ms apart so each one has space to land
               before the next arrives — prevents the pile-up / overlap glitch. */
            const elements = Array.from(container.querySelectorAll('.ft-block'))
            const timeouts = []

            elements.forEach((el, i) => {
                const w = parseInt(el.dataset.w)
                const h = parseInt(el.dataset.h)
                // Distribute start X evenly across width to prevent clustering
                const col    = i % 4
                const colW   = width / 4
                const startX = colW * col + colW / 2 + (Math.random() - 0.5) * colW * 0.5
                const startY = -h - 40
                const angle  = (Math.random() - 0.5) * Math.PI * 0.4

                const tid = setTimeout(() => {
                    const body = Matter.Bodies.rectangle(startX, startY, w, h, {
                        restitution: 0.25,   // less bounce → less chaos
                        friction:    0.4,
                        frictionAir: 0.04,
                        density:     0.003,
                        slop:        0.5,    // extra separation gap
                    })
                    Matter.Body.setAngle(body, angle)
                    bodiesRef.current.push({ body, el, w, h })
                    Matter.World.add(engine.world, body)
                }, i * 120)

                timeouts.push(tid)
            })

            /* ── Top wall closes after blocks have settled ── */
            const topWallTid = setTimeout(() => {
                Matter.World.add(engine.world,
                    Matter.Bodies.rectangle(width / 2, -T / 2, width + T * 2, T, { isStatic: true })
                )
            }, elements.length * 120 + 2000)

            timeouts.push(topWallTid)

            /* ── Mouse drag ── */
            const mouse = Matter.Mouse.create(container)
            mouse.element.removeEventListener('mousewheel',     mouse.mousewheel)
            mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel)

            const mc = Matter.MouseConstraint.create(engine, {
                mouse,
                constraint: { stiffness: 0.6, render: { visible: false } },
            })

            let dragging = null, origInertia = null
            Matter.Events.on(mc, 'startdrag', e => {
                dragging = e.body
                if (dragging) { origInertia = dragging.inertia; Matter.Body.setInertia(dragging, Infinity) }
            })
            Matter.Events.on(mc, 'enddrag', () => {
                if (dragging) { Matter.Body.setInertia(dragging, origInertia || 1); dragging = null }
            })
            container.addEventListener('mouseleave', () => {
                mc.constraint.bodyB = mc.constraint.pointB = null
            })
            document.addEventListener('mouseup', () => {
                mc.constraint.bodyB = mc.constraint.pointB = null
            })

            Matter.World.add(engine.world, mc)

            runnerRef.current = Matter.Runner.create()
            Matter.Runner.run(runnerRef.current, engine)

            /* ── Sync DOM → physics each frame ── */
            function sync() {
                bodiesRef.current.forEach(({ body, el, w, h }) => {
                    const x = Math.max(0, Math.min(body.position.x - w / 2, width  - w))
                    const y = Math.max(-h * 3, Math.min(body.position.y - h / 2, height - h))
                    el.style.left      = `${x}px`
                    el.style.top       = `${y}px`
                    el.style.transform = `rotate(${body.angle}rad)`
                })
                rafRef.current = requestAnimationFrame(sync)
            }
            sync()
        }

        /* ── Start physics when section enters viewport ── */
        const st = ScrollTrigger.create({
            trigger: section,
            start:   'top bottom',
            once:    true,
            onEnter: initPhysics,
        })

        return () => {
            st.kill()
            if (navST) navST.scrollTrigger?.kill()
            cancelAnimationFrame(rafRef.current)
            if (runnerRef.current) Matter.Runner.stop(runnerRef.current)
            if (engineRef.current) Matter.Engine.clear(engineRef.current)
            bodiesRef.current = []
        }
        // timeouts array is local to initPhysics — cleared by engine.clear on unmount
    }, [])

    return (
        <footer ref={sectionRef} id="footer" className="ft-footer">

            {/* ── Top bar ──────────────────────────────────────────────── */}
            <div className="ft-bar">
                <div className="ft-bar-col">
                    <p className="ft-bar-label">Quick Links</p>
                    <div className="ft-bar-links">
                        {LINKS.quick.map(l => (
                            <a key={l.label} href={l.href} className="ft-bar-link">
                                <HoverChars stagger={0.025} duration={0.45}>{l.label}</HoverChars>
                            </a>
                        ))}
                    </div>
                </div>

                <div className="ft-bar-col ft-bar-col--right">
                    <p className="ft-bar-label">Networks</p>
                    <div className="ft-bar-links">
                        {LINKS.networks.map(l => (
                            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="ft-bar-link">
                                <HoverChars stagger={0.025} duration={0.45}>{l.label}</HoverChars>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Physics playground ───────────────────────────────────── */}
            <div ref={containerRef} className="ft-physics">
                {(isMobile() ? BLOCKS_MOBILE : BLOCKS_DESKTOP).map(([w, h], i) => (
                    <div
                        key={i}
                        className="ft-block"
                        data-w={w}
                        data-h={h}
                        style={{ width: w, height: h }}
                    />
                ))}
            </div>

            {/* ── Large name text ──────────────────────────────────────── */}
            <div className="ft-name" aria-hidden="true">
                <span className="ft-name-copy">©</span>
                <span className="ft-name-title"><ItalicA>Haider</ItalicA></span>
            </div>

        </footer>
    )
}

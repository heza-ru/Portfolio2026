import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import gsap from 'gsap'
import HoverChars from './HoverChars'

/* ── Angular icon primitives (square caps, miter joins) ── */
const sq = { strokeLinecap: 'square', strokeLinejoin: 'miter', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }

function IconMenu() {
    return (
        <svg width="14" height="11" viewBox="0 0 14 11" {...sq}>
            <line x1="0" y1="0.5" x2="14" y2="0.5" />
            <line x1="0" y1="5.5" x2="14" y2="5.5" />
            <line x1="0" y1="10.5" x2="14" y2="10.5" />
        </svg>
    )
}

function IconClose() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" {...sq}>
            <line x1="1" y1="1" x2="17" y2="17" />
            <line x1="17" y1="1" x2="1" y2="17" />
        </svg>
    )
}

function IconVolumeOff() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" {...sq}>
            <polygon points="1,4 4,4 7,1 7,13 4,10 1,10" />
            <line x1="10" y1="4" x2="13" y2="10" />
            <line x1="13" y1="4" x2="10" y2="10" />
        </svg>
    )
}

/* Animated equaliser bars — 4 bars, staggered CSS animations */
function IconWave() {
    const bars = [
        { x: 0,  dur: '0.7s', delay: '0s',     min: 30, max: 90 },
        { x: 4,  dur: '0.5s', delay: '0.15s',  min: 15, max: 100 },
        { x: 8,  dur: '0.9s', delay: '0.05s',  min: 40, max: 85 },
        { x: 12, dur: '0.6s', delay: '0.25s',  min: 20, max: 95 },
    ]
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" overflow="visible">
            {bars.map((b) => (
                <rect key={b.x} x={b.x} width="2" rx="0" ry="0">
                    <animate
                        attributeName="height"
                        values={`${b.min}%;${b.max}%;${b.min}%`}
                        dur={b.dur}
                        begin={b.delay}
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    />
                    <animate
                        attributeName="y"
                        values={`${(100 - b.min) / 2}%;${(100 - b.max) / 2}%;${(100 - b.min) / 2}%`}
                        dur={b.dur}
                        begin={b.delay}
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
                    />
                </rect>
            ))}
        </svg>
    )
}

function NavSep() {
    return <div className="h-4 w-px bg-black opacity-25 shrink-0" />
}

const navLinks = [
    { name: 'Index',   url: '#hero' },
    { name: 'About',   url: '#about' },
    { name: 'Works',   url: '#works' },
    { name: 'Contact', url: '#footer' },
    { name: 'Labs',    url: '/labs' },
    { name: 'Logs',    url: '/logs' },
]

/* ── Pixel-block constants (directly from CODE source) ─────────── */
const BLOCK_SIZE = 60
const BLOCK_COLOR = '#0A0A0A'

/* Build a grid of block divs into a container */
function buildBlockGrid(container) {
    container.innerHTML = ''
    const blocks = []
    const w = window.innerWidth
    const h = window.innerHeight
    const cols = Math.ceil(w / BLOCK_SIZE) + 1
    const rows = Math.ceil(h / BLOCK_SIZE) + 1
    const offX = (w - cols * BLOCK_SIZE) / 2
    const offY = (h - rows * BLOCK_SIZE) / 2

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const el = document.createElement('div')
            el.style.cssText = `
        position:absolute;
        width:${BLOCK_SIZE}px;
        height:${BLOCK_SIZE}px;
        left:${c * BLOCK_SIZE + offX}px;
        top:${r * BLOCK_SIZE + offY}px;
        background:${BLOCK_COLOR};
        opacity:0;
        pointer-events:none;
      `
            container.appendChild(el)
            blocks.push(el)
        }
    }
    return blocks
}

/* ── Instrument Serif name — every 'a' rendered in the italic variant ── */
function ItalicAName({ children }) {
    return (
        <span className="font-instrument text-xl leading-none tracking-[-0.02em] font-normal not-italic">
            {String(children).split('').map((char, i) =>
                char === 'a'
                    ? <em key={i} className="italic">{char}</em>
                    : <React.Fragment key={i}>{char}</React.Fragment>
            )}
        </span>
    )
}


const SOCIAL_LINKS = [
    { label: 'GitHub', href: 'https://github.com/heza-ru' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/heza/' },
    { label: 'Email', href: 'mailto:transmission@haider.com' },
]

export default function Navbar({ isLoaded, isMuted, toggleMute }) {
    const [isOpen,     setIsOpen]     = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    // navY is a pixel number. Start fully below the viewport.
    const navY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight : 1000)
    // Whether the initial entry animation has completed
    const entryDoneRef = useRef(false)

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Entry animation: slide up to sit at the bottom of the viewport
    useEffect(() => {
        if (!isLoaded) return
        const navH = 52
        const vh = window.innerHeight
        const ctrl = animate(navY, vh - navH, {
            duration: 1.6,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.8,
            onComplete: () => { entryDoneRef.current = true },
        })
        return () => ctrl.stop()
    }, [isLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll: once sentinel enters the viewport bottom, attach navbar to it 1:1
    useEffect(() => {
        const sentinel = document.getElementById('hero-sentinel')
        if (!sentinel) return

        const update = () => {
            if (!entryDoneRef.current) return
            const vh = window.innerHeight
            const navH = 52
            const sentinelTop = sentinel.getBoundingClientRect().top

            // sentinel above viewport — clamp at 0 (stuck to top)
            // sentinel in viewport   — track it exactly
            // sentinel below viewport — clamp at vh-navH (stuck to bottom)
            const y = Math.max(0, Math.min(vh - navH, sentinelTop - navH))
            navY.set(y)
        }

        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', update, { passive: true })
        return () => {
            window.removeEventListener('scroll', update)
            window.removeEventListener('resize', update)
        }
    }, [navY])

    /* refs for pixel-block overlay */
    const blockGridRef = useRef(null)
    const blocksRef = useRef([])
    const tweenRef = useRef(null)
    const busyRef = useRef(false)  // prevent double-fire

    /* Lock body scroll and signal menu state when open */
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        document.body.classList.toggle('menu-open', isOpen)
        return () => {
            document.body.style.overflow = ''
            document.body.classList.remove('menu-open')
        }
    }, [isOpen])

    /* Rebuild grid on resize */
    useEffect(() => {
        const rebuild = () => {
            if (blockGridRef.current) blocksRef.current = buildBlockGrid(blockGridRef.current)
        }
        window.addEventListener('resize', rebuild)
        return () => window.removeEventListener('resize', rebuild)
    }, [])

    /* ── Open: pixel cover → mount menu → dissolve ───── */
    const openMenu = useCallback(() => {
        if (busyRef.current) return
        busyRef.current = true

        // Ensure grid exists & is fresh
        if (blockGridRef.current) blocksRef.current = buildBlockGrid(blockGridRef.current)

        // Entry: pixels fill in, mount menu, then dissolve away
        tweenRef.current?.kill()
        gsap.set(blocksRef.current, { opacity: 0 })
        tweenRef.current = gsap.timeline({
            onComplete: () => {
                // finished opening
                busyRef.current = false
            },
        })
            // Phase 1 — cover
            .to(blocksRef.current, {
                opacity: 1,
                duration: 0.05,
                ease: 'power2.inOut',
                stagger: { amount: 0.45, from: 'random' },
            })
            // Phase 2 — mount the full-screen menu underneath
            .add(() => {
                setIsOpen(true)
            })
            // Phase 3 — dissolve blocks away
            .to(blocksRef.current, {
                opacity: 0,
                duration: 0.05,
                delay: 0.2,
                ease: 'power2.inOut',
                stagger: { amount: 0.5, from: 'random' },
            })
    }, [])

    const closeMenu = useCallback(() => {
        if (busyRef.current) return
        if (!isOpen) return
        busyRef.current = true
        // 1) Cover screen with blocks ABOVE menu, 2) hide menu,
        // 3) dissolve blocks to reveal the app.
        if (blockGridRef.current) blocksRef.current = buildBlockGrid(blockGridRef.current)
        tweenRef.current?.kill()
        gsap.set(blocksRef.current, { opacity: 0 })
        tweenRef.current = gsap.timeline({
            onComplete: () => {
                busyRef.current = false
            },
        })
            // Phase 1 — cover (blocks fade in)
            .to(blocksRef.current, {
                opacity: 1,
                duration: 0.05,
                ease: 'power2.inOut',
                stagger: { amount: 0.45, from: 'random' },
            })
            // Phase 2 — once covered, hide the menu so items
            // can play their exit animations underneath.
            .add(() => {
                setIsOpen(false)
            })
            // Phase 3 — dissolve blocks to reveal the app
            .to(blocksRef.current, {
                opacity: 0,
                duration: 0.05,
                delay: 0.15,
                ease: 'power2.inOut',
                stagger: { amount: 0.5, from: 'random' },
            })
    }, [isOpen])

    return (
        <>
            {/* ─────────────── NAV BAR ─────────────── */}
            <motion.nav
                style={{ y: navY }}
                className="fixed top-0 z-[60] w-full mix-blend-difference text-black"
            >
                <div className="flex items-center justify-between px-6 md:px-12 py-4 bg-white w-full">

                    {/* ── LEFT slot: links → name on scroll ── */}
                    <div className="flex items-center" style={{ minWidth: 0 }}>
                        <AnimatePresence mode="popLayout" initial={false}>
                            {isScrolled ? (
                                <motion.div
                                    key="name"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className="mix-blend-difference text-white">
                                        <ItalicAName>Mohammad Haider</ItalicAName>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="links-left"
                                    className="hidden md:flex items-center gap-8"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {navLinks.map(link => (
                                        <a
                                            key={link.name}
                                            href={link.url}
                                            className="font-mono text-[13px] text-black tracking-widest uppercase font-bold opacity-80 hover:opacity-100 transition-opacity duration-200"
                                        >
                                            <HoverChars stagger={0.02} duration={0.4}>{link.name}</HoverChars>
                                        </a>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── CENTER slot: links slide in from left on scroll ── */}
                    <div className="hidden md:flex flex-1 justify-center">
                        <AnimatePresence>
                            {isScrolled && (
                                <motion.div
                                    className="flex items-center gap-8"
                                    initial={{ opacity: 0, x: -40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -40 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {navLinks.map(link => (
                                        <a
                                            key={link.name}
                                            href={link.url}
                                            className="font-mono text-[13px] text-black tracking-widest uppercase font-bold opacity-80 hover:opacity-100 transition-opacity duration-200"
                                        >
                                            <HoverChars stagger={0.02} duration={0.4}>{link.name}</HoverChars>
                                        </a>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── RIGHT: Audio toggle | Menu ── */}
                    <div className="flex items-center gap-5">
                        <NavSep />
                        <button
                            onClick={toggleMute}
                            aria-label={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
                            className="flex items-center opacity-80 hover:opacity-100 transition-opacity duration-200 outline-none"
                        >
                            {isMuted ? <IconVolumeOff /> : <IconWave />}
                        </button>
                        <NavSep />
                        <button
                            onClick={openMenu}
                            aria-label="Open menu"
                            className="flex items-center gap-2 font-mono text-[13px] text-black tracking-widest uppercase font-bold opacity-80 hover:opacity-100 transition-opacity duration-200 outline-none"
                        >
                            <IconMenu />
                            <span className="hidden sm:inline">Menu</span>
                        </button>
                    </div>

                </div>
            </motion.nav>

            {/* ─────────────── PIXEL-BLOCK OVERLAY (always in DOM) ─────── */}
            {/* This fixed layer handles the open/close transition blocks     */}
            <div
                ref={blockGridRef}
                style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none',
                    zIndex: 1100,   // ABOVE the menu so it covers it
                    overflow: 'hidden',
                }}
            />

            {/* ─────────────── FULL-SCREEN MENU ─────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="nav-menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="fixed inset-0 z-[1000] bg-[#0A0A0A] overflow-hidden"
                    >
                    {/* Texture */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2000&auto=format&fit=crop')] bg-cover grayscale mix-blend-overlay" />

                    {/* Close Button */}
                    <div className="absolute top-6 right-6 md:top-8 md:right-12 z-[2000] pointer-events-auto">
                        <button
                            onClick={closeMenu}
                            className="p-3 border border-white/20 hover:border-white/60 transition-colors"
                            aria-label="Close menu"
                            style={{
                                pointerEvents: 'auto',
                                background: '#F0EDE8',
                                color: '#0A0A0A',
                                mixBlendMode: 'difference',
                            }}
                        >
                            <IconClose />
                        </button>
                    </div>

                    {/* Links */}
                    <div className="relative h-full flex flex-col justify-center px-8 md:px-24 z-10 gap-0">
                        {navLinks.map((link, i) => (
                            <motion.div
                                key={link.name}
                                initial={{ x: -80, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -40, opacity: 0 }}
                                transition={{ delay: 0.05 + i * 0.07, ease: 'easeOut', duration: 0.45 }}
                                className="relative group w-fit"
                                data-cursor="OPEN"
                            >
                                {/* Ghost letter backdrop */}
                                <span className="absolute -left-6 top-1/2 -translate-y-1/2 font-drama italic text-[18vw] opacity-[0.03] pointer-events-none select-none leading-none">
                                    {link.name.charAt(0)}
                                </span>
                                <a
                                    href={link.url}
                                    onClick={closeMenu}
                                    className="block font-heading uppercase text-[clamp(3rem,8vw,7rem)] leading-[0.9] hover:text-accent transition-colors duration-300"
                                >
                                    <HoverChars stagger={0.04} duration={0.55}>{link.name}</HoverChars>
                                </a>
                            </motion.div>
                        ))}

                        {/* Socials */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-12 flex gap-6 font-mono text-xs uppercase tracking-widest opacity-40"
                        >
                            {SOCIAL_LINKS.map(s => (
                                <a key={s.label} href={s.href} target={s.href.startsWith('mailto:') ? undefined : '_blank'} rel={s.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'} className="hover:opacity-100 hover:text-accent transition-opacity">
                                    <HoverChars stagger={0.025} duration={0.4}>{s.label}</HoverChars>
                                </a>
                            ))}
                        </motion.div>
                    </div>

                    {/* Footer bar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="absolute bottom-6 left-8 right-8 md:left-24 md:right-24 flex justify-between font-mono text-[10px] opacity-40"
                    >
                        <span>© 2026 Mohammad Haider</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                    </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

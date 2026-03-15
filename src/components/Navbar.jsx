import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Menu } from 'lucide-react'
import gsap from 'gsap'
import HoverChars from './HoverChars'

const navLinks = [
    { name: 'Index', url: '#hero', img: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=800&auto=format&fit=crop' },
    { name: 'About', url: '#about', img: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop' },
    { name: 'Works', url: '#works', img: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop' },
    { name: 'Contact', url: '#footer', img: 'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?q=80&w=800&auto=format&fit=crop' },
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


export default function Navbar({ isLoaded }) {
    const [isOpen, setIsOpen] = useState(false)
    const [hoveredIdx, setHoveredIdx] = useState(null)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

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
                setHoveredIdx(null)
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
                initial={{ y: 'calc(100vh - 100%)' }}
                animate={{ y: isLoaded ? 0 : 'calc(100vh - 100%)' }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: isLoaded ? 0.8 : 0 }}
                className="sticky top-0 z-[60] w-full -mt-[52px] mix-blend-difference text-black"
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

                    {/* ── RIGHT: Menu (always visible) ── */}
                    <button
                        onClick={openMenu}
                        aria-label="Open menu"
                        className="flex items-center gap-2 font-mono text-[13px] text-black tracking-widest uppercase font-bold opacity-80 hover:opacity-100 transition-opacity duration-200 outline-none"
                    >
                        <Menu size={14} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Menu</span>
                    </button>

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
                            <X size={22} strokeWidth={2} />
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
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
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
                            {['GitHub', 'LinkedIn', 'Email'].map(s => (
                                <a key={s} href="#" className="hover:opacity-100 hover:text-accent transition-opacity">
                                    <HoverChars stagger={0.025} duration={0.4}>{s}</HoverChars>
                                </a>
                            ))}
                        </motion.div>
                    </div>

                    {/* Hover Image — right half */}
                    <div className="hidden md:block absolute right-0 top-0 w-1/2 h-full pointer-events-none overflow-hidden">
                        <AnimatePresence>
                            {hoveredIdx !== null && (
                                <motion.img
                                    key={navLinks[hoveredIdx].name}
                                    initial={{ opacity: 0, scale: 1.06 }}
                                    animate={{ opacity: 0.35, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.45 }}
                                    src={navLinks[hoveredIdx].img}
                                    alt=""
                                    className="w-full h-full object-cover grayscale"
                                />
                            )}
                        </AnimatePresence>
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

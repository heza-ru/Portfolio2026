import React, { useEffect, useState, useRef } from 'react'
import HoverChars from './HoverChars'

export default function Footer() {
    const footerRef = useRef(null)
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <footer ref={footerRef} className="relative z-10 h-[30dvh] w-full bg-[#F0EDE8] text-[#0A0A0A] rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden border-t border-black/5 flex flex-col">

            {/* Background grain */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale" />

            <div className="relative z-10 flex-1 flex flex-col justify-between px-8 md:px-20 py-6 md:py-8">

                {/* Top row: brand + links */}
                <div className="flex items-start justify-between gap-8">

                    {/* Brand */}
                    <div className="flex flex-col gap-1">
                        <h2 className="font-heading text-2xl md:text-3xl uppercase tracking-tight">Mohammad Haider</h2>
                        <p className="font-drama italic text-sm md:text-base text-accent opacity-80">
                            Designing digital systems that refuse to be ignored.
                        </p>
                    </div>

                    {/* Links — hidden on small screens to avoid overflow */}
                    <div className="hidden md:flex gap-12 font-mono text-xs uppercase tracking-widest opacity-70">
                        <div className="flex flex-col gap-2">
                            {['Index', 'About', 'Works', 'Philosophy'].map(link => (
                                <a key={link} href="#" className="hover:text-accent transition-colors w-fit">
                                    <HoverChars stagger={0.025} duration={0.4}>{link}</HoverChars>
                                </a>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            {['GitHub', 'LinkedIn', 'Twitter', 'Email'].map(link => (
                                <a key={link} href="#" className="hover:text-accent transition-colors w-fit">
                                    <HoverChars stagger={0.025} duration={0.4}>{link}</HoverChars>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest opacity-50 border-t border-black/10 pt-3">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                        </span>
                        <span>System Online</span>
                    </div>
                    <span>© 2026 Mohammad Haider</span>
                    <span className="hidden md:inline">{time.toLocaleTimeString()}</span>
                </div>

            </div>
        </footer>
    )
}

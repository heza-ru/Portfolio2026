import React, { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Footer() {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <footer className="relative sticky top-0 md:top-[50vh] min-h-[50vh] w-full bg-[#F0EDE8] text-[#0A0A0A] rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden border-t border-black/5 flex flex-col pb-8 pt-12 md:pt-16">

            {/* Background grain explicitly for footer */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale" />

            <div className="relative z-10 container mx-auto px-6 md:px-20 flex-1 flex flex-col justify-center gap-16 md:gap-24">

                {/* Top Grid Area */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-0">

                    {/* Brand & Tagline */}
                    <div className="md:col-span-6 flex flex-col gap-4">
                        <h2 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">Mohammad Haider</h2>
                        <p className="font-drama italic text-xl md:text-2xl text-accent max-w-sm" data-cursor="READ">
                            Designing digital systems that refuse to be ignored.
                        </p>
                    </div>

                    {/* Nav Links */}
                    <div className="md:col-span-3 flex flex-col gap-3 font-mono text-sm tracking-widest uppercase opacity-80">
                        <span className="text-black/40 mb-2 border-b border-black/10 pb-2 w-fit">Navigation</span>
                        {['Index', 'About', 'Works', 'Philosophy'].map(link => (
                            <a key={link} href="#" className="link-lift inline-block hover:text-accent transition-colors w-fit tracking-widest">
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Social Links */}
                    <div className="md:col-span-3 flex flex-col gap-3 font-mono text-sm tracking-widest uppercase opacity-80">
                        <span className="text-black/40 mb-2 border-b border-black/10 pb-2 w-fit">Connect</span>
                        {['GitHub', 'LinkedIn', 'Twitter', 'Email'].map(link => (
                            <a key={link} href="#" className="link-lift inline-block hover:text-accent transition-colors w-fit tracking-widest">
                                {link}
                            </a>
                        ))}
                    </div>

                </div>

                {/* Bottom Bar Area */}
                <div className="border-t border-black/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-xs opacity-80 mt-auto">

                    <div className="flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="uppercase tracking-widest">System Online</span>
                    </div>

                    <div className="flex gap-8 items-center">
                        <span>© 2026 Mohammad Haider. Built with intention.</span>
                        <span className="hidden md:inline-block border border-black/20 px-3 py-1 rounded-full">{time.toLocaleTimeString()}</span>
                    </div>

                </div>

            </div>
        </footer>
    )
}

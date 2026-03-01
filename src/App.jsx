import React, { useRef, useState } from 'react'
import { ReactLenis, useLenis } from '@studio-freight/react-lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/*
 * Central GSAP performance config (set once at app root):
 *
 * lagSmoothing(500, 33) — if a frame takes longer than 500 ms (e.g. tab
 * was hidden), cap the delta to 33 ms instead of trying to "catch up".
 * Prevents a jarring multi-second animation jump after returning to the tab.
 *
 * ScrollTrigger.config:
 *   limitCallbacks   — skip redundant start/end callbacks when scrubbing fast
 *   ignoreMobileResize — don't refresh all ScrollTriggers on the ~150 ms
 *                        address-bar resize that fires on iOS scroll
 */
gsap.ticker.lagSmoothing(500, 33)
ScrollTrigger.config({
    limitCallbacks: true,
    ignoreMobileResize: true,
})
import GlobalGrain from './components/GlobalGrain'
import CustomCursor from './components/CustomCursor'
import GlobalDigitalEffect from './components/GlobalDigitalEffect'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import Grid from './components/Grid'
import Works from './components/Works'
import Philosophy from './components/Philosophy'
import StackingSections from './components/StackingSections'
import ScrollProgressBar from './components/ScrollProgressBar'
import Footer from './components/Footer'
import Preloader from './components/Preloader'

function App() {
    const worksRef       = useRef(null)
    const [loaded, setLoaded] = useState(false)

    useLenis(ScrollTrigger.update)

    return (
        <>
            {/* Preloader sits outside Lenis so scroll is locked during the animation */}
            {!loaded && <Preloader onComplete={() => setLoaded(true)} />}

        <ReactLenis root>
            <div className="min-h-screen text-[#F0EDE8] bg-[#0A0A0A] font-body relative">
                <GlobalGrain />
                <CustomCursor />
                <GlobalDigitalEffect />

                <ScrollProgressBar />

                <main className="relative z-10">
                    <Hero isLoaded={loaded} />
                    <Navbar isLoaded={loaded} />

                    {/*
                      * About + Grid stack via GSAP pin (pinSpacing:false).
                      * nextSectionRef points to the Works wrapper so Grid's
                      * pin releases — and Grid's stacking animation fires —
                      * exactly when Works reaches the viewport top.
                      * Works is outside StackingSections so its own
                      * ScrollTrigger measures a clean, undisturbed layout.
                      */}
                    <StackingSections nextSectionRef={worksRef}>
                        <About />
                        <Grid />
                    </StackingSections>

                    <div ref={worksRef}>
                        <Works />
                    </div>
                    <Philosophy />
                    <Footer />
                </main>
            </div>
        </ReactLenis>
        </>
    )
}

export default App

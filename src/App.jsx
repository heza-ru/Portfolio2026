import React, { useState, useEffect } from 'react'
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
import { useAudioAnalyser } from './hooks/useAudioAnalyser'
import WhoIAm from './components/WhoIAm'
import Works from './components/Works'
import Footer from './components/Footer'
import ScrollProgressBar from './components/ScrollProgressBar'
import Preloader from './components/Preloader'
import IdleOverlay from './components/IdleOverlay'

/* Detected once at module load — avoids re-checking on every render. */
const IS_MOBILE = typeof window !== 'undefined' && (
    window.innerWidth < 768 ||
    window.matchMedia('(pointer: coarse)').matches
)

/* Sync Lenis ticks with ScrollTrigger — only needed inside ReactLenis tree. */
function LenisScrollTriggerSync() {
    useLenis(ScrollTrigger.update)
    return null
}

function App() {
    const [loaded, setLoaded] = useState(false)
    const { dataRef: audioDataRef, isMuted, toggleMute } = useAudioAnalyser('/ambience.mp3')

    /* After the intro, remeasure pins — mobile layout (dvh) often settles a
       beat after first paint, which otherwise leaves the WhoIAm cover pin
       glued over Works. */
    useEffect(() => {
        if (!loaded) return
        const soft = requestAnimationFrame(() => ScrollTrigger.refresh())
        const hard = setTimeout(() => ScrollTrigger.refresh(), 220)
        return () => {
            cancelAnimationFrame(soft)
            clearTimeout(hard)
        }
    }, [loaded])

    const page = (
        <div className="min-h-screen text-[#F0EDE8] bg-[#0A0A0A] font-body relative">
            {/* Heavy fixed overlays — skipped on mobile to save GPU/CPU */}
            {!IS_MOBILE && <GlobalGrain />}
            <CustomCursor />
            {!IS_MOBILE && <GlobalDigitalEffect />}

            <ScrollProgressBar />
            {!IS_MOBILE && <IdleOverlay isReady={loaded} />}

            <main id="main-content" className="relative z-10" style={{ backgroundColor: '#0A0A0A' }}>
                <Hero isLoaded={loaded} audioDataRef={audioDataRef} />
                <Navbar isLoaded={loaded} isMuted={isMuted} toggleMute={toggleMute} />
                <WhoIAm />
                <Works />
                <Footer />
            </main>
        </div>
    )

    return (
        <>
            <a
                href="#main-content"
                className="skip-to-main"
            >
                Skip to main content
            </a>

            {/* Preloader sits outside Lenis so scroll is locked during the animation */}
            {!loaded && <Preloader onComplete={() => setLoaded(true)} />}

            {/*
             * Mobile: native scroll only. Wrapping in ReactLenis (even with
             * smoothWheel off) still applies a transform ancestor that breaks
             * position:sticky — which reverses the WhoIAm black cover-card
             * effect (hero stays on top instead of being covered).
             */}
            {IS_MOBILE ? page : (
                <ReactLenis
                    root
                    options={{
                        smoothWheel: true,
                        duration:    1.2,
                        smoothTouch: false,
                        syncTouch:   false,
                    }}
                >
                    <LenisScrollTriggerSync />
                    {page}
                </ReactLenis>
            )}
        </>
    )
}

export default App

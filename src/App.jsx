import React, { useState } from 'react'
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
import WhoIAm from './components/WhoIAm'
import Works from './components/Works'
import Footer from './components/Footer'
import ScrollProgressBar from './components/ScrollProgressBar'
import Preloader from './components/Preloader'
import IdleOverlay from './components/IdleOverlay'

/* Detected once at module load — avoids re-checking on every render. */
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768

/* Sync Lenis ticks with ScrollTrigger — only needed inside ReactLenis tree. */
function LenisScrollTriggerSync() {
    useLenis(ScrollTrigger.update)
    return null
}

function MobileBanner() {
    const [visible, setVisible] = useState(
        () => IS_MOBILE && !sessionStorage.getItem('mob-banner-dismissed')
    )
    if (!visible) return null
    return (
        <div
            style={{
                position:        'fixed',
                top:             0,
                left:            0,
                right:           0,
                zIndex:          99999,
                background:      '#F0EDE8',
                color:           '#0A0A0A',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                gap:             '0.75rem',
                padding:         '0.65rem 1rem',
                fontFamily:      "'IBM Plex Mono', monospace",
                fontSize:        '0.7rem',
                letterSpacing:   '0.04em',
                textAlign:       'center',
            }}
        >
            <span>Best experienced on a larger screen ↗</span>
            <button
                onClick={() => {
                    sessionStorage.setItem('mob-banner-dismissed', '1')
                    setVisible(false)
                }}
                style={{
                    background:   'none',
                    border:       '1px solid rgba(10,10,10,0.3)',
                    cursor:       'pointer',
                    padding:      '0.15rem 0.45rem',
                    fontSize:     '0.65rem',
                    fontFamily:   'inherit',
                    color:        '#0A0A0A',
                    flexShrink:   0,
                }}
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    )
}

function App() {
    const [loaded, setLoaded] = useState(false)

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

            {/* Mobile notice — only shown on small screens, dismissible for the session */}
            <MobileBanner />

            {/*
             * On mobile we skip Lenis entirely — native momentum scroll is
             * smoother and avoids the double-scroll jank that can occur when
             * Lenis intercepts touch events alongside iOS rubber-banding.
             */}
            <ReactLenis
                root
                options={{
                    smoothWheel: !IS_MOBILE,
                    duration:    IS_MOBILE ? 0 : 1.2,
                    smoothTouch: false,
                    syncTouch:   false,
                }}
            >
                {/* Sync Lenis scroll ticks → ScrollTrigger updates */}
                {!IS_MOBILE && <LenisScrollTriggerSync />}

                <div className="min-h-screen text-[#F0EDE8] bg-[#0A0A0A] font-body relative">
                    {/* Heavy fixed overlays — skipped on mobile to save GPU/CPU */}
                    {!IS_MOBILE && <GlobalGrain />}
                    <CustomCursor />
                    <GlobalDigitalEffect />

                    <ScrollProgressBar />
                    <IdleOverlay />

                    <main id="main-content" className="relative z-10" style={{ backgroundColor: '#0A0A0A' }}>
                        <Hero isLoaded={loaded} />
                        <Navbar isLoaded={loaded} />
                        <WhoIAm />
                        <Works />
                        <Footer />
                    </main>
                </div>
            </ReactLenis>
        </>
    )
}

export default App

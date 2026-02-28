import React from 'react'
import { ReactLenis } from '@studio-freight/react-lenis'
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

function App() {
    return (
        <ReactLenis root>
            <div className="min-h-screen text-[#F0EDE8] bg-[#0A0A0A] font-body relative">
                <GlobalGrain />
                <CustomCursor />
                <GlobalDigitalEffect />

                {/* Fixed scroll progress bar — replaces native scrollbar */}
                <ScrollProgressBar />

                <main className="relative z-10">
                    <Hero isLoaded />
                    <Navbar isLoaded />

                    <StackingSections>
                        <About />
                        <Grid />
                        <Works />
                        <Philosophy />
                    </StackingSections>

                    <div className="h-[30vh] pointer-events-none" aria-hidden="true" />
                    <Footer />
                </main>
            </div>
        </ReactLenis>
    )
}

export default App

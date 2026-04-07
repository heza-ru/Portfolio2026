import { useEffect, useRef, useState } from 'react'

/**
 * Plays muted immediately (browsers allow muted autoplay).
 * On the very first user interaction anywhere on the page the AudioContext
 * is created, resumed, and the audio unmutes automatically — no manual click
 * on the volume button required.
 *
 * toggleMute lets the user mute/unmute after that point.
 * dataRef is updated every animation frame with no re-renders.
 */
export function useAudioAnalyser(audioSrc) {
    const dataRef      = useRef({ bass: 0, mid: 0, treble: 0, volume: 0 })
    const audioRef     = useRef(null)
    const ctxRef       = useRef(null)
    const analyserRef  = useRef(null)
    const dataArrayRef = useRef(null)
    const rafRef       = useRef(null)
    const setupDone    = useRef(false)

    const [isMuted, setIsMuted] = useState(true)

    useEffect(() => {
        const audio = new Audio(audioSrc)
        audio.loop   = true
        audio.volume = 0.45
        audio.muted  = true          // muted so autoplay is never blocked
        audioRef.current = audio

        audio.play().catch(() => {
            // Fully blocked (rare) — retry on first interaction below
        })

        // Frequency tick — runs always; data is only non-zero once analyser exists
        const tick = () => {
            rafRef.current = requestAnimationFrame(tick)
            if (!analyserRef.current || !dataArrayRef.current) return
            analyserRef.current.getByteFrequencyData(dataArrayRef.current)
            const d = dataArrayRef.current
            const avg = (lo, hi) => {
                let s = 0
                for (let i = lo; i <= hi; i++) s += d[i]
                return s / ((hi - lo + 1) * 255)
            }
            dataRef.current = {
                bass:   avg(1,  4),
                mid:    avg(5,  25),
                treble: avg(26, 60),
                volume: avg(1,  80),
            }
        }
        tick()

        // ── Auto-unmute on first user gesture anywhere ──────────────────
        const autoUnmute = async () => {
            if (setupDone.current) return
            setupDone.current = true

            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            ctxRef.current = ctx

            const source   = ctx.createMediaElementSource(audio)
            const analyser = ctx.createAnalyser()
            analyser.fftSize = 256
            analyser.smoothingTimeConstant = 0.78
            source.connect(analyser)
            analyser.connect(ctx.destination)
            analyserRef.current  = analyser
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

            if (ctx.state === 'suspended') await ctx.resume()
            if (audio.paused) await audio.play().catch(() => {})

            audio.muted = false
            setIsMuted(false)
        }

        const EVENTS = ['click', 'keydown', 'touchstart', 'pointerdown']
        EVENTS.forEach(e => window.addEventListener(e, autoUnmute, { once: true, passive: true }))

        return () => {
            cancelAnimationFrame(rafRef.current)
            audio.pause()
            ctxRef.current?.close()
            EVENTS.forEach(e => window.removeEventListener(e, autoUnmute))
        }
    }, [audioSrc])

    const toggleMute = async () => {
        const audio = audioRef.current
        if (!audio) return

        if (isMuted) {
            if (ctxRef.current?.state === 'suspended') await ctxRef.current.resume()
            if (audio.paused) await audio.play().catch(() => {})
            audio.muted = false
            setIsMuted(false)
        } else {
            audio.muted = true
            setIsMuted(true)
        }
    }

    return { dataRef, isMuted, toggleMute }
}

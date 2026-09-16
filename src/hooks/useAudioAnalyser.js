import { useEffect, useRef, useState } from 'react'

/**
 * Defers the ambience download until the first user gesture.
 * Creating `new Audio(src)` previously kicked off a multi‑MB network fetch
 * on every page load even while muted — catastrophic on mobile.
 *
 * After first interaction: AudioContext + analyser are wired, then unmuted.
 * dataRef is updated every animation frame with no React re-renders.
 */
export function useAudioAnalyser(audioSrc) {
    const dataRef        = useRef({ bass: 0, mid: 0, treble: 0, volume: 0 })
    const audioRef       = useRef(null)
    const ctxRef         = useRef(null)
    const analyserRef    = useRef(null)
    const dataArrayRef   = useRef(null)
    const rafRef         = useRef(null)
    const setupDone      = useRef(false)
    const setupPromise   = useRef(null)
    const ensureSetupRef = useRef(null)

    const [isMuted, setIsMuted] = useState(true)

    useEffect(() => {
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

        const ensureSetup = async () => {
            if (setupDone.current) return
            if (setupPromise.current) return setupPromise.current

            setupPromise.current = (async () => {
                const audio = new Audio(audioSrc)
                audio.loop   = true
                audio.volume = 0.45
                audio.muted  = true
                audioRef.current = audio

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
                await audio.play().catch(() => {})

                setupDone.current = true
            })()

            return setupPromise.current
        }

        ensureSetupRef.current = ensureSetup

        const autoUnmute = async () => {
            await ensureSetup()
            const audio = audioRef.current
            if (!audio) return
            audio.muted = false
            setIsMuted(false)
        }

        const EVENTS = ['click', 'keydown', 'touchstart', 'pointerdown']
        EVENTS.forEach(e => window.addEventListener(e, autoUnmute, { once: true, passive: true }))

        return () => {
            cancelAnimationFrame(rafRef.current)
            audioRef.current?.pause()
            ctxRef.current?.close()
            EVENTS.forEach(e => window.removeEventListener(e, autoUnmute))
            ensureSetupRef.current = null
        }
    }, [audioSrc])

    const toggleMute = async () => {
        if (ensureSetupRef.current) await ensureSetupRef.current()
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

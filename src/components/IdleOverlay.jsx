import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const WORDS     = ['DESIGNER', 'DISRUPTOR', 'REBEL', 'ENGINEER', 'CONSULTANT']
const IDLE_MS   = 5000
const IN_EVENTS = ['mousemove', 'touchstart', 'keydown', 'click', 'wheel']

export default function IdleOverlay({ isReady = false }) {
    const overlayRef  = useRef(null)
    const tweenRef    = useRef(null)
    const timerRef    = useRef(null)
    const activeRef   = useRef(false)
    const isReadyRef  = useRef(false)
    const resetRef    = useRef(null)

    /* Once the app signals ready (preloader done), arm the idle timer. */
    useEffect(() => {
        if (isReady) {
            isReadyRef.current = true
            resetRef.current?.()
        }
    }, [isReady])

    useEffect(() => {
        const overlay       = overlayRef.current
        const originalTitle = document.title

        /* ── Build a dense word grid ─────────────────────────────────────────
           Row-based layout:
           • Container is a flex column — rows stretch to fill full height.
           • Each row is overflow:hidden flex, packed with enough words to
             bleed past the right edge — guarantees zero horizontal gap.
           • Row count fills full viewport height — guarantees zero vertical gap.
        ─────────────────────────────────────────────────────────────────────── */
        function buildWords() {
            overlay.innerHTML = ''

            const vw = window.innerWidth
            const vh = window.innerHeight

            /* Font size: large so the pattern reads clearly */
            const fs = Math.min(42, Math.max(24, vw * 2.8 / 100))

            /* Rows: enough to fill height — container uses flex so they stretch */
            const approxRowH   = fs * 1.35
            const numRows      = Math.ceil(vh / approxRowH) + 1

            /* Words per row: overshoot width by 2 words; overflow:hidden clips the last one */
            const avgCharW     = fs * 0.72    // Clash Display bold uppercase ~0.72em/char
            const avgWordW     = avgCharW * 9 // average ~9 chars across the word pool
            const gap          = fs * 0.4     // gap between words
            const wordsPerRow  = Math.ceil(vw / (avgWordW + gap)) + 3

            const frag = document.createDocumentFragment()

            for (let r = 0; r < numRows; r++) {
                const row = document.createElement('div')
                row.style.cssText = `
                    display: flex;
                    align-items: center;
                    flex: 1;
                    overflow: hidden;
                    min-height: 0;
                    gap: 0 ${(fs * 0.4).toFixed(1)}px;
                `

                for (let c = 0; c < wordsPerRow; c++) {
                    const span = document.createElement('span')
                    span.className   = 'idle-word'
                    span.textContent = WORDS[Math.floor(Math.random() * WORDS.length)]
                    span.style.cssText = `
                        font-family: 'Clash Display', sans-serif;
                        font-size: ${fs}px;
                        font-weight: 700;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                        color: #0A0A0A;
                        white-space: nowrap;
                        flex-shrink: 0;
                        user-select: none;
                        opacity: 0;
                    `
                    row.appendChild(span)
                }

                frag.appendChild(row)
            }

            overlay.appendChild(frag)
        }

        buildWords()
        window.addEventListener('resize', buildWords, { passive: true })

        /* ── show / hide ─────────────────────────────────────────────────── */
        const words = () => overlay.querySelectorAll('.idle-word')

        function show() {
            if (activeRef.current) return
            activeRef.current     = true
            overlay.style.display = 'flex'
            tweenRef.current?.kill()
            gsap.set(words(), { opacity: 0 })
            tweenRef.current = gsap.to(words(), {
                opacity:  1,
                duration: 0.05,
                ease:     'power2.inOut',
                stagger:  { amount: 0.55, from: 'random' },
            })
        }

        function hide() {
            if (!activeRef.current) return
            activeRef.current = false   // flip immediately so re-entrant calls are ignored
            tweenRef.current?.kill()
            tweenRef.current = gsap.to(words(), {
                opacity:  0,
                duration: 0.05,
                ease:     'power2.inOut',
                stagger:  { amount: 0.5, from: 'random' },
                onComplete: () => { overlay.style.display = 'none' },
            })
        }

        function resetTimer() {
            if (!isReadyRef.current) return
            clearTimeout(timerRef.current)
            if (activeRef.current) hide()
            timerRef.current = setTimeout(show, IDLE_MS)
        }
        resetRef.current = resetTimer

        function onVisibility() {
            if (document.hidden) {
                document.title = 'Hey There! 👋'
                clearTimeout(timerRef.current)
                show()
            } else {
                document.title = originalTitle
                hide()
                resetTimer()
            }
        }

        /* Don't call resetTimer() here — the isReady effect arms it when the preloader finishes. */
        IN_EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
        document.addEventListener('visibilitychange', onVisibility)

        return () => {
            clearTimeout(timerRef.current)
            tweenRef.current?.kill()
            window.removeEventListener('resize', buildWords)
            IN_EVENTS.forEach(e => window.removeEventListener(e, resetTimer))
            document.removeEventListener('visibilitychange', onVisibility)
            document.title = originalTitle
        }
    }, [])

    return (
        <div
            ref={overlayRef}
            aria-hidden="true"
            style={{
                display:        'none',
                position:       'fixed',
                inset:          0,
                zIndex:         9990,
                pointerEvents:  'none',
                background:     '#F0EDE8',
                mixBlendMode:   'difference',
                flexDirection:  'column',
                overflow:       'hidden',
            }}
        />
    )
}

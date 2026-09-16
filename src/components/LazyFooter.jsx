import React, { useEffect, useRef, useState, Suspense, lazy } from 'react'

const Footer = lazy(() => import('./Footer'))

/**
 * Mounts the physics Footer only when it nears the viewport so matter-js
 * (~chunk) is not downloaded/parsed during the hero experience.
 * Placeholder preserves height to avoid CLS.
 */
export default function LazyFooter() {
    const anchorRef = useRef(null)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        const el = anchorRef.current
        if (!el) return

        if (typeof IntersectionObserver === 'undefined') {
            setReady(true)
            return
        }

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setReady(true)
                    io.disconnect()
                }
            },
            { rootMargin: '600px 0px' },
        )
        io.observe(el)
        return () => io.disconnect()
    }, [])

    return (
        <div ref={anchorRef}>
            {ready ? (
                <Suspense
                    fallback={
                        <div
                            className="ft-footer"
                            style={{ backgroundColor: '#0A0A0A' }}
                            aria-hidden="true"
                        />
                    }
                >
                    <Footer />
                </Suspense>
            ) : (
                <div
                    className="ft-footer"
                    style={{ backgroundColor: '#0A0A0A' }}
                    aria-hidden="true"
                />
            )}
        </div>
    )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/*
 * ImageParallax — mouse-tilt 3D parallax for images and canvases.
 *
 * Technique from CODE (4): perspective on the outer wrapper + rotateX/rotateY
 * on the inner element, driven by normalised cursor position over the element.
 *
 * gsap.quickTo() is used instead of a manual RAF loop because it is
 * specifically optimised for high-frequency style updates (mousemove). It
 * pre-compiles the animation update path and skips most GSAP overhead,
 * making it significantly cheaper than calling gsap.to() each mousemove.
 *
 * Props:
 *   intensity  — max tilt angle in degrees (default 12)
 *   className  — forwarded to the outer perspective wrapper
 *   style      — forwarded to the outer perspective wrapper
 */
export default function ImageParallax({
    children,
    className = '',
    style,
    intensity = 12,
}) {
    const wrapRef = useRef(null)   // outer — holds perspective, receives events
    const tiltRef = useRef(null)   // inner — receives rotateX / rotateY

    useEffect(() => {
        const wrap = wrapRef.current
        const tilt = tiltRef.current
        if (!wrap || !tilt) return

        // Pre-compiled quickTo setters — ~10× faster than gsap.to() per frame
        const quickX = gsap.quickTo(tilt, 'rotateY', { duration: 0.7, ease: 'power3.out' })
        const quickY = gsap.quickTo(tilt, 'rotateX', { duration: 0.7, ease: 'power3.out' })

        const onMove = (e) => {
            const { left, top, width, height } = wrap.getBoundingClientRect()
            // Normalise to -0.5 … +0.5 relative to element centre
            const nx =  (e.clientX - left) / width  - 0.5
            const ny =  (e.clientY - top)  / height - 0.5
            quickX( nx * intensity)
            quickY(-ny * intensity)  // invert Y so top→tilt-up
        }

        const onLeave = () => {
            quickX(0)
            quickY(0)
        }

        wrap.addEventListener('mousemove',  onMove,  { passive: true })
        wrap.addEventListener('mouseleave', onLeave, { passive: true })

        return () => {
            wrap.removeEventListener('mousemove',  onMove)
            wrap.removeEventListener('mouseleave', onLeave)
        }
    }, [intensity])

    return (
        /*
         * perspective on the outer wrapper gives the 3D view frustum.
         * No transform-style:preserve-3d needed unless stacking 3D children —
         * skipping it avoids the overflow:hidden / stacking-context clash that
         * would otherwise clip card content during rotation.
         */
        <div
            ref={wrapRef}
            className={className}
            style={{ ...style, perspective: '800px' }}
        >
            <div
                ref={tiltRef}
                style={{
                    width: '100%',
                    height: '100%',
                    /*
                     * willChange is justified here: only a handful of these
                     * instances exist on the page, and the spring-back after
                     * mouseleave still needs the layer promoted.
                     */
                    willChange: 'transform',
                }}
            >
                {children}
            </div>
        </div>
    )
}

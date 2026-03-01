import { useRef, useEffect } from 'react'
import gsap from 'gsap'

/**
 * CODE (8) per-character hover swap.
 * Two layers of identical text are stacked; on hover the visible chars
 * slide up while the ghost chars slide in from below — char by char.
 *
 * Usage:
 *   <HoverChars>Index</HoverChars>
 *   <HoverChars stagger={0.02} duration={0.4}>About</HoverChars>
 */
export default function HoverChars({
    children,
    className = '',
    stagger   = 0.03,
    duration  = 0.5,
    ease      = 'expo.inOut',
}) {
    const wrapRef = useRef(null)

    const text  = String(children)
    const chars = text.split('')

    // Set ghost chars to y:110% once on mount
    useEffect(() => {
        const wrap = wrapRef.current
        if (!wrap) return
        gsap.set(wrap.querySelectorAll('.hc-ghost .hc-c'), { y: '110%' })
    }, [])

    const onEnter = () => {
        const wrap = wrapRef.current
        if (!wrap) return
        gsap.to(wrap.querySelectorAll('.hc-vis .hc-c'),   { y: '-110%', stagger, duration, ease })
        gsap.to(wrap.querySelectorAll('.hc-ghost .hc-c'), { y: '0%',    stagger, duration, ease })
    }

    const onLeave = () => {
        const wrap = wrapRef.current
        if (!wrap) return
        gsap.to(wrap.querySelectorAll('.hc-ghost .hc-c'), { y: '110%',  stagger, duration, ease })
        gsap.to(wrap.querySelectorAll('.hc-vis .hc-c'),   { y: '0%',    stagger, duration, ease })
    }

    const renderChars = (layerClass) =>
        chars.map((ch, i) => (
            <span
                key={i}
                className={`hc-c inline-block ${layerClass}`}
                style={{ whiteSpace: 'pre' }}
            >
                {ch === ' ' ? '\u00A0' : ch}
            </span>
        ))

    return (
        <span
            ref={wrapRef}
            className={`relative inline-flex overflow-hidden ${className}`}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {/* Visible layer */}
            <span className="hc-vis inline-flex">
                {renderChars('')}
            </span>

            {/* Ghost layer — absolutely stacked, starts below */}
            <span
                className="hc-ghost inline-flex"
                aria-hidden="true"
                style={{ position: 'absolute', top: 0, left: 0 }}
            >
                {renderChars('')}
            </span>
        </span>
    )
}

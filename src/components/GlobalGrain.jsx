/**
 * GlobalGrain
 * Heavy frosted-glass-style film grain via SVG feTurbulence.
 * High baseFrequency + finer octaves = dense, tight grain texture.
 * Opacity bumped to 0.18 with multiply blend for maximum tactility.
 */
export default function GlobalGrain() {
    return (
        <>
            {/* Primary grain layer — fine texture */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                    opacity: 0.18,
                    pointerEvents: 'none',
                    mixBlendMode: 'overlay',
                    willChange: 'transform',
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    style={{ display: 'block' }}
                >
                    <filter id="grain-fine" x="0%" y="0%" width="100%" height="100%"
                        colorInterpolationFilters="sRGB">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.75 0.75"
                            numOctaves="4"
                            stitchTiles="stitch"
                            result="noise"
                        />
                        <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
                        <feBlend in="SourceGraphic" in2="grey" mode="overlay" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#grain-fine)" />
                </svg>
            </div>

            {/* Secondary grain layer — coarser, lower opacity to add depth */}
            <div
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9997,
                    opacity: 0.08,
                    pointerEvents: 'none',
                    mixBlendMode: 'screen',
                    willChange: 'transform',
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="100%"
                    style={{ display: 'block' }}
                >
                    <filter id="grain-coarse" x="0%" y="0%" width="100%" height="100%"
                        colorInterpolationFilters="sRGB">
                        <feTurbulence
                            type="turbulence"
                            baseFrequency="0.35 0.35"
                            numOctaves="2"
                            stitchTiles="stitch"
                            result="noise"
                        />
                        <feColorMatrix type="saturate" values="0" in="noise" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#grain-coarse)" />
                </svg>
            </div>
        </>
    )
}

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const lerp = (a, b, t) => a + (b - a) * t

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768

// ── Scroll-driven camera targets ──────────────────────────────────────────
// At scroll=0: default view (waist-up model, centered)
// At scroll=1: zoomed in on face, model pushed left, slight left-turn
const SCROLL = {
    camZFrom:    5,
    camZTo:      2.4,   // zoom in
    camYFrom:    0,
    camYTo:      1.4,   // pan up to face
    modelXTo:   -1.6,   // shift model left
    rotYOffset:  1,  // model turns slightly right
}

export default function HeroModel({ className = '', audioDataRef = null, scrollProgress = null }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let disposed = false
        let rafId = 0

        const cleanupFns = []

        const pushCleanup = (fn) => {
            cleanupFns.push(fn)
        }

        const run = async () => {
            // Start loading immediately — the GLB is already preloaded via
            // <link rel="preload">, so it is in the browser cache.
            // Deferring with requestIdleCallback caused a black-canvas flash on
            // mobile because the canvas revealed (preloader done) before the
            // model ever started loading.
            await MeshoptDecoder.ready
            if (disposed) return

            // Wait for the container to have real pixel dimensions.
            // On some mobile browsers the first paint happens before layout
            // is flushed, leaving clientWidth / clientHeight at 0.
            let w = container.clientWidth
            let h = container.clientHeight

            if (!w || !h) {
                await new Promise((resolve) => {
                    const ro = new ResizeObserver((entries) => {
                        for (const entry of entries) {
                            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                                ro.disconnect()
                                resolve()
                                return
                            }
                        }
                    })
                    ro.observe(container)
                    pushCleanup(() => ro.disconnect())
                })
                if (disposed) return
                w = container.clientWidth
                h = container.clientHeight
            }

            const scene = new THREE.Scene()
            scene.background = new THREE.Color(0x0a0a0a)

            const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
            camera.position.set(0, 0, 5)

            const renderer = new THREE.WebGLRenderer({
                antialias: !IS_MOBILE,
                alpha: false,
                precision: IS_MOBILE ? 'mediump' : 'highp',
                powerPreference: IS_MOBILE ? 'low-power' : 'high-performance',
                failIfMajorPerformanceCaveat: false,
            })
            renderer.setSize(w, h)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 1 : 1.5))
            renderer.outputColorSpace = THREE.SRGBColorSpace
            renderer.toneMapping = THREE.ACESFilmicToneMapping
            renderer.toneMappingExposure = IS_MOBILE ? 1.1 : 0.85
            // block display prevents the 4px inline-element gap below the canvas
            renderer.domElement.style.display = 'block'
            // Keep canvas invisible until the model is in the scene — prevents the
            // "black canvas" flash that occurs between canvas-append and first model render
            container.style.opacity = '0'
            container.style.transition = 'opacity 0.5s ease'
            container.appendChild(renderer.domElement)

            const pmrem = new THREE.PMREMGenerator(renderer)
            pmrem.compileEquirectangularShader()
            const envTexture = pmrem.fromScene(new RoomEnvironment(renderer), 0.02).texture
            scene.environment = envTexture
            pmrem.dispose()

            scene.add(new THREE.AmbientLight(0xffffff, IS_MOBILE ? 0.6 : 0.10))

            const keyLight = new THREE.DirectionalLight(0xffffff, IS_MOBILE ? 1.8 : 0.9)
            keyLight.position.set(-2, 5, 3)
            scene.add(keyLight)

            const rimLight = new THREE.DirectionalLight(0xaabbff, IS_MOBILE ? 1.0 : 0.5)
            rimLight.position.set(3, 3, -5)
            scene.add(rimLight)
            const baseRimIntensity = IS_MOBILE ? 1.0 : 0.5

            const loader = new GLTFLoader()
            loader.setMeshoptDecoder(MeshoptDecoder)
            let modelGroup = null
            let baseY = 0
            let baseScale = 1

            loader.load(
                '/HeroModel4.glb',
                (gltf) => {
                    if (disposed) return
                    modelGroup = gltf.scene

                    modelGroup.traverse((child) => {
                        if (!child.isMesh || !child.material) return
                        const mats = Array.isArray(child.material) ? child.material : [child.material]
                        mats.forEach((mat) => {
                            mat.envMap = envTexture
                            mat.envMapIntensity = 1.5
                            mat.needsUpdate = true
                        })
                    })

                    const box = new THREE.Box3().setFromObject(modelGroup)
                    const center = new THREE.Vector3()
                    const size = new THREE.Vector3()
                    box.getCenter(center)
                    box.getSize(size)

                    modelGroup.position.sub(center)

                    const maxDim = Math.max(size.x, size.y, size.z)
                    const fovRad = camera.fov * (Math.PI / 180)
                    const fitH = 2 * Math.tan(fovRad / 2) * camera.position.z

                    baseScale = (fitH * 2.0) / maxDim
                    modelGroup.scale.setScalar(baseScale)
                    modelGroup.position.y -= fitH * 0.5
                    baseY = modelGroup.position.y

                    scene.add(modelGroup)
                    // Reveal the canvas now that the model is ready
                    container.style.opacity = '1'
                },
                undefined,
                (err) => {
                    console.error('GLB load error', err)
                    // Still reveal on error so the background shows rather than staying invisible
                    container.style.opacity = '1'
                },
            )

            const target = { x: 0, y: -0.5 }
            const mouse = { x: 0, y: -0.5 }

            const onMouseMove = (e) => {
                target.x = (e.clientX / window.innerWidth - 0.5)
                target.y = -(e.clientY / window.innerHeight - 0.5)
            }
            const onTouchMove = (e) => {
                const t = e.touches[0]
                if (!t) return
                target.x = (t.clientX / window.innerWidth - 0.5)
                target.y = -(t.clientY / window.innerHeight - 0.5)
            }

            if (IS_MOBILE) {
                window.addEventListener('touchmove', onTouchMove, { passive: true })
                pushCleanup(() => window.removeEventListener('touchmove', onTouchMove))
            } else {
                window.addEventListener('mousemove', onMouseMove)
                pushCleanup(() => window.removeEventListener('mousemove', onMouseMove))
            }

            const onResize = () => {
                const nw = container.clientWidth
                const nh = container.clientHeight
                camera.aspect = nw / nh
                camera.updateProjectionMatrix()
                renderer.setSize(nw, nh)
            }
            window.addEventListener('resize', onResize)
            pushCleanup(() => window.removeEventListener('resize', onResize))

            let elapsed = 0
            let lastTime = performance.now()

            // Smoothed audio — triple-low lerp factors so audio never jerks
            const smooth = { bass: 0, mid: 0, treble: 0, volume: 0 }
            // Previous smooth values for velocity damping
            const prev   = { bass: 0, mid: 0, treble: 0, volume: 0 }

            // Smoothed scroll — lerped separately so camera glides, not snaps
            let scrollSmooth = 0

            const animate = () => {
                rafId = requestAnimationFrame(animate)
                const now = performance.now()
                const delta = (now - lastTime) / 1000
                lastTime = now
                elapsed += delta

                mouse.x = lerp(mouse.x, target.x, 0.08)
                mouse.y = lerp(mouse.y, target.y, 0.08)

                // Scroll: read framer-motion MotionValue, lerp heavily
                const scrollRaw = scrollProgress ? scrollProgress.get() : 0
                scrollSmooth = lerp(scrollSmooth, scrollRaw, 0.035)
                const s = scrollSmooth

                if (modelGroup) {
                    const raw = audioDataRef?.current ?? { bass: 0, mid: 0, treble: 0, volume: 0 }

                    // First lerp pass — slow approach
                    const b1 = lerp(prev.bass,   raw.bass,   0.015)
                    const m1 = lerp(prev.mid,    raw.mid,    0.018)
                    const t1 = lerp(prev.treble, raw.treble, 0.020)
                    const v1 = lerp(prev.volume, raw.volume, 0.012)

                    // Second lerp pass — smooth out any remaining jitter
                    smooth.bass   = lerp(smooth.bass,   b1, 0.10)
                    smooth.mid    = lerp(smooth.mid,    m1, 0.10)
                    smooth.treble = lerp(smooth.treble, t1, 0.10)
                    smooth.volume = lerp(smooth.volume, v1, 0.10)

                    prev.bass   = b1
                    prev.mid    = m1
                    prev.treble = t1
                    prev.volume = v1

                    // ── Scroll-driven camera ──────────────────────────────
                    camera.position.z = lerp(SCROLL.camZFrom, SCROLL.camZTo, s)
                    camera.position.y = lerp(SCROLL.camYFrom, SCROLL.camYTo, s)
                    camera.updateProjectionMatrix()

                    // ── Model position: drift left on scroll ──────────────
                    const targetX = lerp(0, SCROLL.modelXTo, s)
                    modelGroup.position.x = lerp(modelGroup.position.x, targetX, 0.04)

                    // ── Audio reactions ───────────────────────────────────
                    // Bass: barely-there scale breathe
                    modelGroup.scale.setScalar(baseScale * (1 + smooth.bass * 0.04))

                    // Rotation: mouse look + scroll left-turn + mid sway
                    const rotYTarget = mouse.x * (0.5 + smooth.mid * 0.1) + lerp(0, SCROLL.rotYOffset, s)
                    modelGroup.rotation.y = lerp(modelGroup.rotation.y, rotYTarget, 0.06)
                    modelGroup.rotation.x = lerp(modelGroup.rotation.x, mouse.y * 0.3, 0.06)

                    // Bob: dampened by scroll (stops when zoomed in)
                    const bobAmp = (0.06 + smooth.volume * 0.03) * (1 - s)
                    modelGroup.position.y = baseY + Math.sin(elapsed * (0.6 + smooth.volume * 0.2)) * bobAmp

                    // Treble: soft rim shimmer
                    rimLight.intensity = baseRimIntensity + smooth.treble * 0.5
                }

                renderer.render(scene, camera)
            }
            animate()

            // Pause the RAF when the tab is hidden — saves battery on mobile
            if (IS_MOBILE) {
                const onVisibilityChange = () => {
                    if (document.hidden) {
                        cancelAnimationFrame(rafId)
                    } else {
                        lastTime = performance.now()
                        animate()
                    }
                }
                document.addEventListener('visibilitychange', onVisibilityChange)
                pushCleanup(() => document.removeEventListener('visibilitychange', onVisibilityChange))
            }

            pushCleanup(() => {
                cancelAnimationFrame(rafId)
                envTexture.dispose()
                renderer.dispose()
                if (renderer.domElement.parentNode === container) {
                    container.removeChild(renderer.domElement)
                }
            })
        }

        run()

        return () => {
            disposed = true
            for (let i = cleanupFns.length - 1; i >= 0; i--) {
                cleanupFns[i]()
            }
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={`w-full h-full ${className}`}
            style={{ overflow: 'hidden' }}
        />
    )
}

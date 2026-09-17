import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const lerp = (a, b, t) => a + (b - a) * t

const isMobileViewport = () =>
    typeof window !== 'undefined' &&
    (window.innerWidth < 768 ||
        window.matchMedia('(pointer: coarse)').matches)

// ── Scroll-driven camera targets (desktop) ────────────────────────────────
// At scroll=0: default view (waist-up model, centered)
// At scroll=1: zoomed in on face, model pushed left, slight left-turn
const SCROLL = {
    camZFrom:    5,
    camZTo:      2.4,
    camYFrom:    0,
    camYTo:      1.4,
    modelXTo:   -1.6,
    rotYOffset:  1,
}

export default function HeroModel({ className = '', audioDataRef = null, scrollProgress = null }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const IS_MOBILE = isMobileViewport()
        let disposed = false
        let rafId = 0
        let running = false
        let inView = true

        const cleanupFns = []
        const pushCleanup = (fn) => { cleanupFns.push(fn) }

        const run = async () => {
            await MeshoptDecoder.ready
            if (disposed) return

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

            const camera = new THREE.PerspectiveCamera(IS_MOBILE ? 42 : 45, w / h, 0.1, 1000)
            camera.position.set(0, IS_MOBILE ? 0.1 : 0, IS_MOBILE ? 5.2 : 5)

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
            renderer.domElement.style.display = 'block'
            renderer.domElement.style.pointerEvents = 'none'
            renderer.domElement.style.touchAction = 'pan-y'
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

                    baseScale = (fitH * (IS_MOBILE ? 1.35 : 2.0)) / maxDim
                    modelGroup.scale.setScalar(baseScale)
                    modelGroup.position.y -= fitH * (IS_MOBILE ? 0.12 : 0.5)
                    baseY = modelGroup.position.y

                    scene.add(modelGroup)
                    container.style.opacity = '1'
                    // Paint one frame immediately even if the loop is paused
                    renderer.render(scene, camera)
                },
                undefined,
                (err) => {
                    console.error('GLB load error', err)
                    container.style.opacity = '1'
                },
            )

            const target = { x: 0, y: IS_MOBILE ? 0 : -0.5 }
            const mouse  = { x: 0, y: IS_MOBILE ? 0 : -0.5 }

            const onMouseMove = (e) => {
                target.x = (e.clientX / window.innerWidth - 0.5)
                target.y = -(e.clientY / window.innerHeight - 0.5)
            }

            if (!IS_MOBILE) {
                window.addEventListener('mousemove', onMouseMove)
                pushCleanup(() => window.removeEventListener('mousemove', onMouseMove))
            }

            const syncSize = () => {
                const nw = container.clientWidth
                const nh = container.clientHeight
                if (!nw || !nh) return
                camera.aspect = nw / nh
                camera.updateProjectionMatrix()
                renderer.setSize(nw, nh)
            }
            window.addEventListener('resize', syncSize)
            pushCleanup(() => window.removeEventListener('resize', syncSize))

            let elapsed = 0
            let lastTime = performance.now()
            const smooth = { bass: 0, mid: 0, treble: 0, volume: 0 }
            const prev   = { bass: 0, mid: 0, treble: 0, volume: 0 }
            let scrollSmooth = 0

            /* Mobile: keep the bust locked to the resting camera — scroll-driven
               zoom/yaw is what looked “broken” after scrolling away and back
               (MotionValue stuck mid-lerp while the sticky hero remounts). */
            const applyRestPose = () => {
                if (!modelGroup) return
                camera.position.z = IS_MOBILE ? 5.2 : SCROLL.camZFrom
                camera.position.y = IS_MOBILE ? 0.1 : SCROLL.camYFrom
                camera.updateProjectionMatrix()
                modelGroup.position.x = 0
                modelGroup.rotation.y = 0
                modelGroup.rotation.x = 0
                modelGroup.scale.setScalar(baseScale)
                modelGroup.position.y = baseY
            }

            const animate = () => {
                if (disposed || !running) return
                rafId = requestAnimationFrame(animate)
                const now = performance.now()
                const delta = Math.min(0.05, (now - lastTime) / 1000)
                lastTime = now
                elapsed += delta

                mouse.x = lerp(mouse.x, target.x, 0.08)
                mouse.y = lerp(mouse.y, target.y, 0.08)

                if (IS_MOBILE) {
                    // Gentle bob only — no scroll camera on phones
                    if (modelGroup) {
                        applyRestPose()
                        const bobAmp = 0.04 + (smooth.volume * 0.02)
                        const raw = audioDataRef?.current ?? { bass: 0, mid: 0, treble: 0, volume: 0 }
                        smooth.volume = lerp(smooth.volume, raw.volume, 0.08)
                        modelGroup.position.y = baseY + Math.sin(elapsed * 0.6) * bobAmp
                        modelGroup.scale.setScalar(baseScale * (1 + (raw.bass || 0) * 0.03))
                        rimLight.intensity = baseRimIntensity + (raw.treble || 0) * 0.4
                    }
                    renderer.render(scene, camera)
                    return
                }

                const scrollRaw = scrollProgress ? scrollProgress.get() : 0
                scrollSmooth = lerp(scrollSmooth, scrollRaw, 0.035)
                const s = scrollSmooth

                if (modelGroup) {
                    const raw = audioDataRef?.current ?? { bass: 0, mid: 0, treble: 0, volume: 0 }

                    const b1 = lerp(prev.bass,   raw.bass,   0.015)
                    const m1 = lerp(prev.mid,    raw.mid,    0.018)
                    const t1 = lerp(prev.treble, raw.treble, 0.020)
                    const v1 = lerp(prev.volume, raw.volume, 0.012)

                    smooth.bass   = lerp(smooth.bass,   b1, 0.10)
                    smooth.mid    = lerp(smooth.mid,    m1, 0.10)
                    smooth.treble = lerp(smooth.treble, t1, 0.10)
                    smooth.volume = lerp(smooth.volume, v1, 0.10)

                    prev.bass = b1; prev.mid = m1; prev.treble = t1; prev.volume = v1

                    camera.position.z = lerp(SCROLL.camZFrom, SCROLL.camZTo, s)
                    camera.position.y = lerp(SCROLL.camYFrom, SCROLL.camYTo, s)
                    camera.updateProjectionMatrix()

                    const targetX = lerp(0, SCROLL.modelXTo, s)
                    modelGroup.position.x = lerp(modelGroup.position.x, targetX, 0.04)
                    modelGroup.scale.setScalar(baseScale * (1 + smooth.bass * 0.04))

                    const rotYTarget = mouse.x * (0.5 + smooth.mid * 0.1) + lerp(0, SCROLL.rotYOffset, s)
                    modelGroup.rotation.y = lerp(modelGroup.rotation.y, rotYTarget, 0.06)
                    modelGroup.rotation.x = lerp(modelGroup.rotation.x, mouse.y * 0.3, 0.06)

                    const bobAmp = (0.06 + smooth.volume * 0.03) * (1 - s)
                    modelGroup.position.y = baseY + Math.sin(elapsed * (0.6 + smooth.volume * 0.2)) * bobAmp
                    rimLight.intensity = baseRimIntensity + smooth.treble * 0.5
                }

                renderer.render(scene, camera)
            }

            const startLoop = () => {
                if (disposed || running || !inView || document.hidden) return
                // Guard against lost contexts after long off-screen periods
                const gl = renderer.getContext()
                if (gl && gl.isContextLost?.()) return
                running = true
                lastTime = performance.now()
                syncSize()
                if (IS_MOBILE) {
                    scrollSmooth = 0
                    applyRestPose()
                } else if (scrollProgress) {
                    scrollSmooth = scrollProgress.get()
                }
                animate()
            }

            const stopLoop = () => {
                running = false
                cancelAnimationFrame(rafId)
            }

            // Pause when the sticky hero leaves the viewport — stops GPU thrash
            // while scrolling Works/Footer, and avoids a stale canvas on return.
            const io = new IntersectionObserver(
                ([entry]) => {
                    inView = entry.isIntersecting && entry.intersectionRatio > 0.05
                    if (inView) startLoop()
                    else stopLoop()
                },
                { threshold: [0, 0.05, 0.25] },
            )
            io.observe(container)
            pushCleanup(() => io.disconnect())

            const onVisibilityChange = () => {
                if (document.hidden) stopLoop()
                else if (inView) startLoop()
            }
            document.addEventListener('visibilitychange', onVisibilityChange)
            pushCleanup(() => document.removeEventListener('visibilitychange', onVisibilityChange))

            const onContextLost = (e) => {
                e.preventDefault()
                stopLoop()
                container.style.opacity = '0'
            }
            const onContextRestored = () => {
                syncSize()
                container.style.opacity = '1'
                if (inView) startLoop()
            }
            renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)
            renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false)
            pushCleanup(() => {
                renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
                renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
            })

            startLoop()

            pushCleanup(() => {
                stopLoop()
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
            for (let i = cleanupFns.length - 1; i >= 0; i--) cleanupFns[i]()
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={`w-full h-full ${className}`}
            style={{
                overflow: 'hidden',
                pointerEvents: 'none',
                touchAction: 'pan-y',
            }}
        />
    )
}

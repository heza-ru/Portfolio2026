import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const lerp = (a, b, t) => a + (b - a) * t

const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768

export default function HeroModel({ className = '' }) {
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
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, IS_MOBILE ? 2 : 1.5))
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

            const loader = new GLTFLoader()
            loader.setMeshoptDecoder(MeshoptDecoder)
            let modelGroup = null
            let baseY = 0

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

                    modelGroup.scale.setScalar((fitH * 2.0) / maxDim)
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

            const animate = () => {
                rafId = requestAnimationFrame(animate)
                const now = performance.now()
                const delta = (now - lastTime) / 1000
                lastTime = now
                elapsed += delta

                mouse.x = lerp(mouse.x, target.x, 0.12)
                mouse.y = lerp(mouse.y, target.y, 0.12)

                if (modelGroup) {
                    modelGroup.rotation.y = mouse.x * 0.5
                    modelGroup.rotation.x = mouse.y * 0.3
                    modelGroup.position.y = baseY + Math.sin(elapsed * 0.6) * 0.06
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

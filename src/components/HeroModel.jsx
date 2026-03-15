import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const lerp = (a, b, t) => a + (b - a) * t

export default function HeroModel({ className = '' }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const w = container.clientWidth
        const h = container.clientHeight

        // ── Scene ──────────────────────────────────────────────────────────
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x0a0a0a)

        const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
        camera.position.set(0, 0, 5)

        // ── Renderer ────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, precision: 'highp' })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace    = THREE.SRGBColorSpace
        renderer.toneMapping         = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.85
        container.appendChild(renderer.domElement)

        // ── Environment map (glass needs IBL to refract/reflect) ────────────
        const pmrem = new THREE.PMREMGenerator(renderer)
        pmrem.compileEquirectangularShader()
        const envTexture = pmrem.fromScene(new RoomEnvironment(renderer), 0.02).texture
        scene.environment = envTexture
        pmrem.dispose()

        // ── Lights (env map carries the glass; direct lights add edge detail) ─
        scene.add(new THREE.AmbientLight(0xffffff, 0.10))

        const keyLight = new THREE.DirectionalLight(0xffffff, 0.9)
        keyLight.position.set(-2, 5, 3)
        scene.add(keyLight)

        const rimLight = new THREE.DirectionalLight(0xaabbff, 0.5)
        rimLight.position.set(3, 3, -5)
        scene.add(rimLight)

        // ── Load GLB ────────────────────────────────────────────────────────
        const loader = new GLTFLoader()
        let modelGroup = null
        let baseY      = 0

        loader.load(
            '/HeroModel4.glb',
            (gltf) => {
                modelGroup = gltf.scene

                modelGroup.traverse((child) => {
                    if (!child.isMesh || !child.material) return
                    const mats = Array.isArray(child.material) ? child.material : [child.material]
                    mats.forEach((mat) => {
                        mat.envMap          = envTexture
                        mat.envMapIntensity = 1.5
                        mat.needsUpdate     = true
                    })
                })

                const box    = new THREE.Box3().setFromObject(modelGroup)
                const center = new THREE.Vector3()
                const size   = new THREE.Vector3()
                box.getCenter(center)
                box.getSize(size)

                modelGroup.position.sub(center)

                const maxDim = Math.max(size.x, size.y, size.z)
                const fovRad = camera.fov * (Math.PI / 180)
                const fitH   = 2 * Math.tan(fovRad / 2) * camera.position.z

                modelGroup.scale.setScalar((fitH * 2.0) / maxDim)
                modelGroup.position.y -= fitH * 0.5
                baseY = modelGroup.position.y

                scene.add(modelGroup)
            },
            undefined,
            (err) => console.error('GLB load error', err),
        )

        // ── Mouse-position tracking ─────────────────────────────────────────
        // Default = "mouse at bottom-centre": target.y = -0.5 → rotation.x ≈ -0.15 rad
        // Pre-seed mouse to the same value so the model starts in this pose immediately.
        const target = { x: 0, y: -0.5 }
        const mouse  = { x: 0, y: -0.5 }

        const onMouseMove = (e) => {
            target.x =  (e.clientX / window.innerWidth  - 0.5)
            target.y = -(e.clientY / window.innerHeight - 0.5)
        }
        window.addEventListener('mousemove', onMouseMove)

        // ── Resize ──────────────────────────────────────────────────────────
        const onResize = () => {
            const nw = container.clientWidth
            const nh = container.clientHeight
            camera.aspect = nw / nh
            camera.updateProjectionMatrix()
            renderer.setSize(nw, nh)
        }
        window.addEventListener('resize', onResize)

        // ── Render loop ──────────────────────────────────────────────────────
        let rafId
        let elapsed  = 0
        let lastTime = performance.now()

        const animate = () => {
            rafId = requestAnimationFrame(animate)
            const now   = performance.now()
            const delta = (now - lastTime) / 1000
            lastTime    = now
            elapsed    += delta

            mouse.x = lerp(mouse.x, target.x, 0.12)
            mouse.y = lerp(mouse.y, target.y, 0.12)

            if (modelGroup) {
                modelGroup.rotation.y  = mouse.x * 0.5
                modelGroup.rotation.x  = mouse.y * 0.3
                modelGroup.position.y  = baseY + Math.sin(elapsed * 0.6) * 0.06
            }

            renderer.render(scene, camera)
        }
        animate()

        // ── Cleanup ──────────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            envTexture.dispose()
            renderer.dispose()
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement)
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

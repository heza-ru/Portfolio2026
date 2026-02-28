import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export default function HeroModel({ className = '' }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const w = container.clientWidth
        const h = container.clientHeight

        // ── Scene ──────────────────────────────────────────────
        const scene    = new THREE.Scene()
        const camera   = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
        camera.position.set(0, 0, 5)

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, precision: 'highp' })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace    = THREE.SRGBColorSpace
        renderer.toneMapping         = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.2
        renderer.shadowMap.enabled   = true
        renderer.shadowMap.type      = THREE.PCFSoftShadowMap
        container.appendChild(renderer.domElement)

        // ── Environment (PMREM from RoomEnvironment — gives PBR materials
        //    realistic reflections and proper IBL lighting) ───────────────
        const pmrem      = new THREE.PMREMGenerator(renderer)
        pmrem.compileEquirectangularShader()
        const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
        scene.environment    = envTexture
        scene.environmentIntensity = 1.5
        pmrem.dispose()

        // ── Lights ─────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0xffffff, 0.4))

        const dirLight = new THREE.DirectionalLight(0xffeedd, 2.5)
        dirLight.position.set(4, 6, 4)
        dirLight.castShadow           = true
        dirLight.shadow.mapSize.set(2048, 2048)
        dirLight.shadow.camera.near   = 0.5
        dirLight.shadow.camera.far    = 20
        dirLight.shadow.bias          = -0.001
        scene.add(dirLight)

        const fillLight = new THREE.DirectionalLight(0x88aaff, 1.2)
        fillLight.position.set(-4, -2, -4)
        scene.add(fillLight)

        const rimLight = new THREE.PointLight(0xffffff, 1.5)
        rimLight.position.set(0, 2, -3)
        scene.add(rimLight)

        // ── Load GLB ───────────────────────────────────────────
        const loader = new GLTFLoader()
        let modelGroup = null
        let baseY = 0

        loader.load(
            '/HeroModel.glb',
            (gltf) => {
                modelGroup = gltf.scene

                // Auto-centre and auto-scale to fill 80 % of frame height
                const box    = new THREE.Box3().setFromObject(modelGroup)
                const center = new THREE.Vector3()
                const size   = new THREE.Vector3()
                box.getCenter(center)
                box.getSize(size)

                modelGroup.position.sub(center)

                const maxDim = Math.max(size.x, size.y, size.z)
                const fovRad = camera.fov * (Math.PI / 180)
                const fitH   = 2 * Math.tan(fovRad / 2) * camera.position.z

                // Scale so the full model is 2× the viewport height (zoomed in)
                modelGroup.scale.setScalar((fitH * 2.0) / maxDim)

                // Shift model down so only the upper half (head → waist) is visible
                modelGroup.position.y -= fitH * 0.5
                baseY = modelGroup.position.y   // save for float animation

                scene.add(modelGroup)
            },
            undefined,
            (err) => console.error('GLB load error', err)
        )

        // ── Mouse ──────────────────────────────────────────────
        const mouse  = { x: 0, y: 0 }
        const target = { x: 0, y: 0 }
        const lerp   = (a, b, t) => a + (b - a) * t

        const onMouseMove = (e) => {
            target.x =  (e.clientX / window.innerWidth  - 0.5)
            target.y = -(e.clientY / window.innerHeight - 0.5)
        }
        window.addEventListener('mousemove', onMouseMove)

        // ── Resize ─────────────────────────────────────────────
        const onResize = () => {
            const nw = container.clientWidth
            const nh = container.clientHeight
            camera.aspect = nw / nh
            camera.updateProjectionMatrix()
            renderer.setSize(nw, nh)
        }
        window.addEventListener('resize', onResize)

        // ── Render loop ────────────────────────────────────────
        let rafId
        let elapsed = 0
        let lastTime = performance.now()

        const animate = () => {
            rafId = requestAnimationFrame(animate)
            const now   = performance.now()
            const delta = (now - lastTime) / 1000
            lastTime    = now
            elapsed    += delta

            mouse.x = lerp(mouse.x, target.x, 0.04)
            mouse.y = lerp(mouse.y, target.y, 0.04)

            if (modelGroup) {
                modelGroup.rotation.y = mouse.x * 0.5
                modelGroup.rotation.x = mouse.y * 0.3
                // Float oscillates around the calculated baseY offset
                modelGroup.position.y = baseY + Math.sin(elapsed * 0.6) * 0.06
            }

            renderer.render(scene, camera)
        }
        animate()

        // ── Cleanup ────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
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

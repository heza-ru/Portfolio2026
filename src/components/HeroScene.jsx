import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// ─── Shaders (straight from CODE 5, no image — uses render target) ───────────

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2      uMouse;
  uniform float     uParallaxStrength;
  uniform float     uDistortionMultiplier;
  uniform float     uGlassStrength;
  uniform float     ustripesFrequency;
  uniform float     uglassSmoothness;
  uniform float     uEdgePadding;

  varying vec2 vUv;

  float displacement(float x, float num_stripes, float strength) {
    float modulus = 1.0 / num_stripes;
    return mod(x, modulus) * strength;
  }

  float fractalGlass(float x) {
    float d = 0.0;
    for (int i = -5; i <= 5; i++) {
      d += displacement(x + float(i) * uglassSmoothness, ustripesFrequency, uGlassStrength);
    }
    return x + d / 11.0;
  }

  float smoothEdge(float x, float padding) {
    if (x < padding)       return smoothstep(0.0, padding, x);
    if (x > 1.0 - padding) return smoothstep(1.0, 1.0 - padding, x);
    return 1.0;
  }

  void main() {
    vec2  uv         = vUv;
    float originalX  = uv.x;
    float edgeFactor = smoothEdge(originalX, uEdgePadding);

    float distortedX      = fractalGlass(originalX);
    uv.x                  = mix(originalX, distortedX, edgeFactor);
    float distortionFactor = uv.x - originalX;

    float parallaxDir = -sign(0.5 - uMouse.x);
    vec2  parallax    = vec2(
      parallaxDir * abs(uMouse.x - 0.5) * uParallaxStrength
        * (1.0 + abs(distortionFactor) * uDistortionMultiplier),
      0.0
    ) * edgeFactor;

    uv = clamp(uv + parallax, 0.0, 1.0);

    gl_FragColor = texture2D(uTexture, uv);
  }
`

const config = {
    lerpFactor:            0.035,
    parallaxStrength:      0.1,
    distortionMultiplier:  10.0,
    glassStrength:         2.0,
    glassSmoothness:       0.0001,
    stripesFrequency:      35.0,
    edgePadding:           0.1,
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroScene({ className = '' }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let w = container.clientWidth
        let h = container.clientHeight

        // ── Shared renderer ──────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        container.appendChild(renderer.domElement)

        // ── Pass 1: model scene ──────────────────────────────────────────────
        const modelScene  = new THREE.Scene()
        const modelCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
        modelCamera.position.set(0, 0, 5)

        modelScene.add(new THREE.AmbientLight(0xffffff, 1.2))
        const dir = new THREE.DirectionalLight(0xffffff, 2.0)
        dir.position.set(4, 6, 4)
        modelScene.add(dir)
        const fill = new THREE.DirectionalLight(0xa0c4ff, 0.6)
        fill.position.set(-4, -2, -4)
        modelScene.add(fill)
        modelScene.add(Object.assign(new THREE.PointLight(0xffffff, 1.0), { position: new THREE.Vector3(0, 3, 3) }))

        // Render target — model renders here, glass shader reads from it
        let renderTarget = new THREE.WebGLRenderTarget(w, h, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format:    THREE.RGBAFormat,
        })

        // ── Pass 2: fractal glass quad ────────────────────────────────────────
        const postScene  = new THREE.Scene()
        const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

        const glassMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTexture:              { value: renderTarget.texture },
                uMouse:                { value: new THREE.Vector2(0.5, 0.5) },
                uParallaxStrength:     { value: config.parallaxStrength },
                uDistortionMultiplier: { value: config.distortionMultiplier },
                uGlassStrength:        { value: config.glassStrength },
                ustripesFrequency:     { value: config.stripesFrequency },
                uglassSmoothness:      { value: config.glassSmoothness },
                uEdgePadding:          { value: config.edgePadding },
            },
            vertexShader,
            fragmentShader,
        })
        postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glassMaterial))

        // ── Load GLB ─────────────────────────────────────────────────────────
        let modelGroup = null
        let baseY      = 0
        const loader   = new GLTFLoader()

        loader.load('/HeroModel.glb', (gltf) => {
            modelGroup = gltf.scene

            const box    = new THREE.Box3().setFromObject(modelGroup)
            const center = new THREE.Vector3()
            const size   = new THREE.Vector3()
            box.getCenter(center)
            box.getSize(size)

            modelGroup.position.sub(center)

            const maxDim = Math.max(size.x, size.y, size.z)
            const fovRad = modelCamera.fov * (Math.PI / 180)
            const fitH   = 2 * Math.tan(fovRad / 2) * modelCamera.position.z

            modelGroup.scale.setScalar((fitH * 2.0) / maxDim)   // zoom: show top half
            modelGroup.position.y -= fitH * 0.5                  // shift down to top half
            baseY = modelGroup.position.y

            modelScene.add(modelGroup)
        }, undefined, (err) => console.error('GLB error', err))

        // ── Mouse ─────────────────────────────────────────────────────────────
        const mouse  = { x: 0.5, y: 0.5 }
        const target = { x: 0.5, y: 0.5 }
        const lerp   = (a, b, t) => a + (b - a) * t

        const onMouseMove = (e) => {
            target.x = e.clientX / window.innerWidth
            target.y = 1.0 - e.clientY / window.innerHeight
        }
        window.addEventListener('mousemove', onMouseMove)

        // ── Resize ────────────────────────────────────────────────────────────
        const onResize = () => {
            w = container.clientWidth
            h = container.clientHeight
            renderer.setSize(w, h)
            modelCamera.aspect = w / h
            modelCamera.updateProjectionMatrix()

            renderTarget.dispose()
            renderTarget = new THREE.WebGLRenderTarget(w, h, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format:    THREE.RGBAFormat,
            })
            glassMaterial.uniforms.uTexture.value = renderTarget.texture
        }
        window.addEventListener('resize', onResize)

        // ── Render loop ───────────────────────────────────────────────────────
        let rafId
        let elapsed  = 0
        let lastTime = performance.now()

        const animate = () => {
            rafId = requestAnimationFrame(animate)

            const now   = performance.now()
            elapsed    += (now - lastTime) / 1000
            lastTime    = now

            // Lerp mouse
            mouse.x = lerp(mouse.x, target.x, config.lerpFactor)
            mouse.y = lerp(mouse.y, target.y, config.lerpFactor)
            glassMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y)

            // Animate model
            if (modelGroup) {
                const mx = (mouse.x - 0.5)
                const my = (mouse.y - 0.5)
                modelGroup.rotation.y  = mx * 0.5
                modelGroup.rotation.x  = my * 0.3
                modelGroup.position.y  = baseY + Math.sin(elapsed * 0.6) * 0.06
            }

            // Pass 1 — render model into renderTarget
            renderer.setRenderTarget(renderTarget)
            renderer.render(modelScene, modelCamera)

            // Pass 2 — fractal glass distortion to screen
            renderer.setRenderTarget(null)
            renderer.render(postScene, postCamera)
        }
        animate()

        // ── Cleanup ───────────────────────────────────────────────────────────
        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            renderTarget.dispose()
            glassMaterial.dispose()
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

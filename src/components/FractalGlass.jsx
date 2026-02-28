import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Renders semi-transparent glass stripes — no image texture.
// The fractal distortion + mouse parallax make the stripes shift and refract,
// creating a glass panel illusion over whatever sits beneath this canvas.
const fragmentShader = `
  uniform vec2 uMouse;
  uniform float uParallaxStrength;
  uniform float uDistortionMultiplier;
  uniform float uGlassStrength;
  uniform float ustripesFrequency;
  uniform float uglassSmoothness;
  uniform float uEdgePadding;

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
    if (x < padding)         return smoothstep(0.0, padding, x);
    if (x > 1.0 - padding)   return smoothstep(1.0, 1.0 - padding, x);
    return 1.0;
  }

  void main() {
    float originalX  = vUv.x;
    float edgeFactor = smoothEdge(originalX, uEdgePadding);

    float distortedX      = fractalGlass(originalX);
    float distortionFactor = (distortedX - originalX) * edgeFactor;

    float parallaxDir = -sign(0.5 - uMouse.x);
    float parallaxX   = parallaxDir
                        * abs(uMouse.x - 0.5)
                        * uParallaxStrength
                        * (1.0 + abs(distortionFactor) * uDistortionMultiplier)
                        * edgeFactor;

    float sampleX = mix(originalX, distortedX, edgeFactor) + parallaxX;

    // Sharp boundary line between each glass panel
    float stripe     = abs(sin(sampleX * ustripesFrequency * 3.14159265));
    float lineAlpha  = pow(stripe, 18.0) * 0.7 * edgeFactor;   // very tight line

    // Very faint fill inside each panel
    float glow       = (1.0 - pow(stripe, 2.0)) * 0.04 * edgeFactor;

    float alpha      = lineAlpha + glow;

    // Slight blue-white tint — classic frosted glass
    vec3 color = mix(vec3(0.75, 0.88, 1.0), vec3(1.0), stripe * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`

const config = {
    lerpFactor:            0.035,
    parallaxStrength:      0.12,
    distortionMultiplier:  10.0,
    glassStrength:         2.0,
    glassSmoothness:       0.0001,
    stripesFrequency:      6.0,   // few wide panels, not dense lines
    edgePadding:           0.08,
}

export default function FractalGlass({ className = '' }) {
    const containerRef = useRef(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const w = container.clientWidth
        const h = container.clientHeight

        const scene    = new THREE.Scene()
        const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setClearColor(0x000000, 0)   // fully transparent clear
        renderer.setSize(w, h)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        container.appendChild(renderer.domElement)

        const mouse       = { x: 0.5, y: 0.5 }
        const targetMouse = { x: 0.5, y: 0.5 }
        const lerp        = (a, b, t) => a + (b - a) * t

        const material = new THREE.ShaderMaterial({
            uniforms: {
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
            transparent: true,
            depthWrite:  false,
        })

        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

        const onMouseMove = (e) => {
            targetMouse.x = e.clientX / window.innerWidth
            targetMouse.y = 1.0 - e.clientY / window.innerHeight
        }
        window.addEventListener('mousemove', onMouseMove)

        const onResize = () => {
            renderer.setSize(container.clientWidth, container.clientHeight)
        }
        window.addEventListener('resize', onResize)

        let rafId
        const animate = () => {
            rafId = requestAnimationFrame(animate)
            mouse.x = lerp(mouse.x, targetMouse.x, config.lerpFactor)
            mouse.y = lerp(mouse.y, targetMouse.y, config.lerpFactor)
            material.uniforms.uMouse.value.set(mouse.x, mouse.y)
            renderer.render(scene, camera)
        }
        animate()

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('resize', onResize)
            renderer.dispose()
            material.dispose()
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

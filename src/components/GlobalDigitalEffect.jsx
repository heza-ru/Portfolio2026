import { useEffect, useRef } from 'react'

const config = {
    symbols: ['O', 'X', '*', '>', '$', 'W', '#', '@', '+', '=', '▓', '░', '▒', '◆', '●'],
    blockSize: 28,
    detectionRadius: 70,
    clusterSize: 8,
    blockLifetime: 350,
    emptyRatio: 0.25,
    scrambleRatio: 0.28,
    scrambleInterval: 130,
}

function getRandomSymbol() {
    return config.symbols[Math.floor(Math.random() * config.symbols.length)]
}

export default function GlobalDigitalEffect() {
    const overlayRef = useRef(null)
    const blocksRef = useRef([])
    const rafRef = useRef(null)
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

    useEffect(() => {
        if (isMobile) return

        const overlay = overlayRef.current
        if (!overlay) return

        // Initialize grid
        const initGrid = () => {
            overlay.innerHTML = ''
            const width = window.innerWidth
            const height = window.innerHeight
            const cols = Math.ceil(width / config.blockSize)
            const rows = Math.ceil(height / config.blockSize)

            const blocks = []

            // Create grid blocks
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const block = document.createElement('div')
                    block.className = 'digital-grid-block'

                    const isEmpty = Math.random() < config.emptyRatio
                    block.textContent = isEmpty ? '' : getRandomSymbol()

                    block.style.width = `${config.blockSize}px`
                    block.style.height = `${config.blockSize}px`
                    block.style.left = `${col * config.blockSize}px`
                    block.style.top = `${row * config.blockSize}px`
                    block.style.willChange = 'opacity'

                    overlay.appendChild(block)

                    blocks.push({
                        element: block,
                        x: col * config.blockSize + config.blockSize / 2,
                        y: row * config.blockSize + config.blockSize / 2,
                        gridX: col,
                        gridY: row,
                        highlightEndTime: 0,
                        isEmpty: isEmpty,
                        shouldScramble: !isEmpty && Math.random() < config.scrambleRatio,
                        scrambleInterval: null,
                        isActive: false,
                    })
                }
            }

            return blocks
        }

        blocksRef.current = initGrid()

        // Mouse position tracking
        let mouseX = 0
        let mouseY = 0

        const handleMouseMove = (e) => {
            mouseX = e.clientX
            mouseY = e.clientY
        }

        // Throttled mouse move handler
        let lastMouseMoveTime = 0
        const throttleDelay = 16 // ~60fps

        const throttledMouseMove = (e) => {
            const now = performance.now()
            if (now - lastMouseMoveTime >= throttleDelay) {
                handleMouseMove(e)
                lastMouseMoveTime = now
            }
        }

        window.addEventListener('mousemove', throttledMouseMove, { passive: true })

        // Main animation loop - processes grid updates and activations
        const processGridActivation = () => {
            const blocks = blocksRef.current
            const currentTime = Date.now()

            // Find closest block to mouse
            let closestBlock = null
            let closestDistance = Infinity

            for (const block of blocks) {
                const dx = mouseX - block.x
                const dy = mouseY - block.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < closestDistance) {
                    closestDistance = distance
                    closestBlock = block
                }
            }

            // Activate block if within radius
            if (closestBlock && closestDistance <= config.detectionRadius) {
                if (!closestBlock.isActive) {
                    closestBlock.isActive = true
                    closestBlock.element.classList.add('active')
                    closestBlock.highlightEndTime = currentTime + config.blockLifetime

                    if (closestBlock.shouldScramble && !closestBlock.scrambleInterval) {
                        closestBlock.scrambleInterval = setInterval(() => {
                            closestBlock.element.textContent = getRandomSymbol()
                        }, config.scrambleInterval)
                    }

                    // Activate cluster
                    const clusterCount = Math.floor(Math.random() * config.clusterSize) + 1
                    let currentBlock = closestBlock
                    const activeBlocks = [closestBlock]

                    for (let i = 0; i < clusterCount; i++) {
                        const neighbors = blocks.filter((neighbor) => {
                            if (activeBlocks.includes(neighbor)) return false

                            const dx = Math.abs(neighbor.gridX - currentBlock.gridX)
                            const dy = Math.abs(neighbor.gridY - currentBlock.gridY)

                            return dx <= 1 && dy <= 1
                        })

                        if (neighbors.length === 0) break

                        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)]

                        if (!randomNeighbor.isActive) {
                            randomNeighbor.isActive = true
                            randomNeighbor.element.classList.add('active')
                            randomNeighbor.highlightEndTime = currentTime + config.blockLifetime + i * 15

                            if (randomNeighbor.shouldScramble && !randomNeighbor.scrambleInterval) {
                                randomNeighbor.scrambleInterval = setInterval(() => {
                                    randomNeighbor.element.textContent = getRandomSymbol()
                                }, config.scrambleInterval)
                            }

                            activeBlocks.push(randomNeighbor)
                            currentBlock = randomNeighbor
                        }
                    }
                }
            }

            // Deactivate expired blocks
            blocks.forEach((block) => {
                if (block.isActive && block.highlightEndTime > 0 && currentTime > block.highlightEndTime) {
                    block.element.classList.remove('active')
                    block.highlightEndTime = 0
                    block.isActive = false

                    if (block.scrambleInterval) {
                        clearInterval(block.scrambleInterval)
                        block.scrambleInterval = null
                        if (!block.isEmpty) {
                            block.element.textContent = getRandomSymbol()
                        }
                    }
                }
            })
        }

        // Animation loop using RAF
        const animate = () => {
            processGridActivation()
            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        // Handle resize with debounce
        let resizeTimeout
        const handleResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(() => {
                // Clean up old blocks
                blocksRef.current.forEach((block) => {
                    if (block.scrambleInterval) {
                        clearInterval(block.scrambleInterval)
                    }
                })
                // Reinitialize grid
                blocksRef.current = initGrid()
            }, 250)
        }

        window.addEventListener('resize', handleResize, { passive: true })

        // Cleanup
        return () => {
            window.removeEventListener('mousemove', throttledMouseMove)
            window.removeEventListener('resize', handleResize)
            clearTimeout(resizeTimeout)
            
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }

            blocksRef.current.forEach((block) => {
                if (block.scrambleInterval) {
                    clearInterval(block.scrambleInterval)
                }
            })
        }
    }, [isMobile])

    if (isMobile) return null

    return (
        <div 
            ref={overlayRef}
            className="digital-grid-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9998,
                overflow: 'hidden',
            }}
        />
    )
}

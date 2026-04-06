/**
 * Module-level singleton for cursor state.
 * Written by CustomCursor.jsx, read by HeroTextCanvas.jsx (and any other consumer).
 * Using a plain object avoids React context overhead in tight RAF loops.
 */
export const cursorState = {
  current: { x: -9999, y: -9999 }, // lerped cursor position (viewport coords)
  isHovering: false,
  trail: [], // Array<{ x, y }> — recent lerped positions, newest first
}

export const TRAIL_LENGTH = 12

/**
 * Generates abstract flow-field positions for the galaxy state.
 * NOT a literal spiral — soft, organic distribution across the viewport
 * with slight clustering variation for visual interest.
 */

export interface GalaxyPoint {
  x: number
  y: number
}

/**
 * Generate `count` galaxy positions distributed organically across the viewport.
 * Uses layered noise-like offsets so nothing looks mechanical.
 */
export function generateGalaxyPositions(
  count: number,
  width: number,
  height: number,
  seed?: number
): GalaxyPoint[] {
  const points: GalaxyPoint[] = []
  const s = seed ?? 42

  // Pseudo-random using a seed for reproducibility across frames
  function seededRandom(i: number): number {
    const x = Math.sin(s + i * 127.1 + (i * i) * 0.0031) * 43758.5453
    return x - Math.floor(x)
  }

  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.max(width, height) * 0.52

  for (let i = 0; i < count; i++) {
    const r1 = seededRandom(i * 3)
    const r2 = seededRandom(i * 3 + 1)
    const r3 = seededRandom(i * 3 + 2)

    // Radius: square-root distribution for even area coverage, slight center clustering
    const radiusFraction = Math.sqrt(r1) * 0.92 + r1 * 0.08
    const radius = radiusFraction * maxRadius

    // Angle with slight clustering: golden angle base + noise offset
    const goldenAngle = i * 2.399963
    const angleNoise = (r2 - 0.5) * 1.2
    const angle = goldenAngle + angleNoise

    let x = centerX + Math.cos(angle) * radius
    let y = centerY + Math.sin(angle) * radius

    // Per-particle random offset so nothing looks mechanical
    x += (r3 - 0.5) * width * 0.06
    y += (seededRandom(i * 5 + 7) - 0.5) * height * 0.06

    points.push({ x, y })
  }

  return points
}

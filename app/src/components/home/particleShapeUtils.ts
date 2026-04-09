"use client"

export interface ParticlePoint {
  x: number
  y: number
}

export interface MorphParticle extends ParticlePoint {
  fromX: number
  fromY: number
  toX: number
  toY: number
  size: number
  phase: number
  sway: number
  delay: number
}

function sortPoints(points: ParticlePoint[], width: number, height: number) {
  const cx = width / 2
  const cy = height / 2

  return [...points].sort((a, b) => {
    const aa = Math.atan2(a.y - cy, a.x - cx)
    const ba = Math.atan2(b.y - cy, b.x - cx)
    if (aa !== ba) return aa - ba

    const ar = (a.x - cx) ** 2 + (a.y - cy) ** 2
    const br = (b.x - cx) ** 2 + (b.y - cy) ** 2
    return ar - br
  })
}

function resizePoints(points: ParticlePoint[], count: number, fallback: ParticlePoint) {
  if (!points.length) {
    return Array.from({ length: count }, () => ({ ...fallback }))
  }

  if (points.length === count) return points

  const next: ParticlePoint[] = []
  for (let i = 0; i < count; i += 1) {
    const index = Math.floor((i / count) * points.length) % points.length
    next.push(points[index])
  }

  return next
}

function collectCanvasPoints(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  step: number,
  mode: "alpha" | "dark"
) {
  const { data } = ctx.getImageData(0, 0, width, height)
  const points: ParticlePoint[] = []

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const a = data[index + 3]
      const luminance = (r + g + b) / 3

      const visible =
        mode === "alpha"
          ? a > 24
          : a > 24 && luminance < 210

      if (visible) {
        points.push({ x, y })
      }
    }
  }

  return points
}

export function sampleTextPoints(options: {
  text: string
  width: number
  height: number
  fontFamily: string
  fontWeight?: string
  fontSize: number
  tracking?: number
  step?: number
}) {
  const {
    text,
    width,
    height,
    fontFamily,
    fontWeight = "500",
    fontSize,
    tracking = 0,
    step = 3,
  } = options

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) return []

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#ffffff"
  ctx.textBaseline = "middle"
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`

  const chars = Array.from(text)
  const totalWidth = chars.reduce((sum, char, index) => {
    const metrics = ctx.measureText(char)
    const charWidth = metrics.width
    return sum + charWidth + (index === chars.length - 1 ? 0 : tracking)
  }, 0)

  let cursorX = (width - totalWidth) / 2
  const baselineY = height / 2 + fontSize * 0.07

  chars.forEach((char, index) => {
    ctx.fillText(char, cursorX, baselineY)
    cursorX += ctx.measureText(char).width
    if (index < chars.length - 1) cursorX += tracking
  })

  return sortPoints(collectCanvasPoints(ctx, width, height, step, "alpha"), width, height)
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export async function sampleImagePoints(options: {
  src: string
  width: number
  height: number
  step?: number
  padding?: number
}) {
  const { src, width, height, step = 3, padding = 0.12 } = options
  const image = await loadImage(src)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")

  if (!ctx) return []

  ctx.clearRect(0, 0, width, height)

  const innerWidth = width * (1 - padding * 2)
  const innerHeight = height * (1 - padding * 2)
  const scale = Math.min(innerWidth / image.width, innerHeight / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const drawX = (width - drawWidth) / 2
  const drawY = (height - drawHeight) / 2

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)

  return sortPoints(collectCanvasPoints(ctx, width, height, step, "dark"), width, height)
}

export function createMorphParticles(options: {
  source: ParticlePoint[]
  target: ParticlePoint[]
  count: number
  width: number
  height: number
}) {
  const { source, target, count, width, height } = options
  const fallback = { x: width / 2, y: height / 2 }
  const fromPoints = resizePoints(source, count, fallback)
  const toPoints = resizePoints(target, count, fallback)

  return fromPoints.map((point, index) => {
    const targetPoint = toPoints[index]
    const ratio = count <= 1 ? 0 : index / (count - 1)

    return {
      x: point.x,
      y: point.y,
      fromX: point.x,
      fromY: point.y,
      toX: targetPoint.x,
      toY: targetPoint.y,
      size: 0.6 + (index % 4) * 0.3,
      phase: ratio,
      sway: ((index % 13) - 6) * 0.7,
      delay: ratio * 0.22 + Math.sin(index * 0.37) * 0.06,
    } satisfies MorphParticle
  })
}

export function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2
}

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

/** Simplex-like noise for organic curl */
export function curlNoise(x: number, y: number, t: number) {
  const s = Math.sin(x * 0.012 + t * 0.6) * Math.cos(y * 0.014 + t * 0.4)
  const c = Math.cos(x * 0.008 - t * 0.5) * Math.sin(y * 0.011 + t * 0.7)
  return { nx: s * 6, ny: c * 6 }
}

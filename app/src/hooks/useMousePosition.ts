"use client"

import { useEffect, useRef, useCallback } from "react"

interface MousePosition {
  x: number
  y: number
  normalizedX: number
  normalizedY: number
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function useMousePosition(smoothing = 0.08) {
  const pos = useRef<MousePosition>({ x: 0, y: 0, normalizedX: 0, normalizedY: 0 })
  const target = useRef({ x: 0, y: 0, nx: 0, ny: 0 })
  const raf = useRef(0)
  const listeners = useRef<Set<(p: MousePosition) => void>>(new Set())

  const subscribe = useCallback((cb: (p: MousePosition) => void) => {
    listeners.current.add(cb)
    return () => { listeners.current.delete(cb) }
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
      target.current.nx = (e.clientX / window.innerWidth) * 2 - 1
      target.current.ny = (e.clientY / window.innerHeight) * 2 - 1
    }

    const tick = () => {
      const t = target.current
      const p = pos.current
      p.x = lerp(p.x, t.x, smoothing)
      p.y = lerp(p.y, t.y, smoothing)
      p.normalizedX = lerp(p.normalizedX, t.nx, smoothing)
      p.normalizedY = lerp(p.normalizedY, t.ny, smoothing)

      listeners.current.forEach((cb) => cb(p))
      raf.current = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf.current)
    }
  }, [smoothing])

  return { pos, subscribe }
}

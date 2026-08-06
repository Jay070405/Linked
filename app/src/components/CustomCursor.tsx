"use client"

import { useEffect, useRef } from "react"

const INTERACTIVE_SELECTOR = "a, button, [data-cursor-hover]"

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100, lx: -100, ly: -100 })
  const rafRef = useRef(0)

  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (isCoarse || prefersReduced) return

    const cursor = cursorRef.current
    if (!cursor) return

    const setHoverState = (target: EventTarget | null) => {
      const element = target as Element | null
      const interactive = !!element?.closest?.(INTERACTIVE_SELECTOR)
      cursor.style.width = interactive ? "16px" : "8px"
      cursor.style.height = interactive ? "16px" : "8px"
      cursor.style.opacity = interactive ? "0.72" : "0.94"
    }

    const onMove = (event: MouseEvent) => {
      posRef.current.x = event.clientX
      posRef.current.y = event.clientY
      setHoverState(event.target)
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const tick = () => {
      const position = posRef.current
      position.lx = lerp(position.lx, position.x, 0.22)
      position.ly = lerp(position.ly, position.y, 0.22)
      cursor.style.transform = `translate3d(${position.lx}px, ${position.ly}px, 0) translate(-50%, -50%)`
      rafRef.current = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 8,
        height: 8,
        borderRadius: "9999px",
        background: "rgba(255,255,255,0.92)",
        boxShadow: "0 0 18px rgba(255,255,255,0.2)",
        pointerEvents: "none",
        zIndex: 99999,
        transform: "translate(-50%, -50%)",
        opacity: 0.95,
        transition: "width 120ms ease, height 120ms ease, opacity 120ms ease",
      }}
    />
  )
}

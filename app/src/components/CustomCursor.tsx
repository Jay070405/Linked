"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -100, y: -100 })
  const isHovering = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(pointer: coarse)").matches) return

    const cursor = cursorRef.current
    const glow = glowRef.current
    if (!cursor || !glow) return

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX
      pos.current.y = e.clientY
    }

    const onEnterInteractive = () => {
      if (isHovering.current) return
      isHovering.current = true
      gsap.to(cursor, { scale: 2.5, opacity: 0.6, duration: 0.3, ease: "power2.out" })
      gsap.to(glow, { scale: 1.8, opacity: 0.3, duration: 0.3, ease: "power2.out" })
    }

    const onLeaveInteractive = () => {
      isHovering.current = false
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" })
      gsap.to(glow, { scale: 1, opacity: 0.15, duration: 0.3, ease: "power2.out" })
    }

    const tick = () => {
      gsap.set(cursor, { x: pos.current.x, y: pos.current.y })
      gsap.to(glow, {
        x: pos.current.x,
        y: pos.current.y,
        duration: 0.6,
        ease: "power3.out",
      })
      requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove, { passive: true })

    const interactives = document.querySelectorAll("a, button, [data-cursor-hover]")
    interactives.forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive)
      el.addEventListener("mouseleave", onLeaveInteractive)
    })

    const observer = new MutationObserver(() => {
      const newInteractives = document.querySelectorAll("a, button, [data-cursor-hover]")
      newInteractives.forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive)
        el.addEventListener("mouseleave", onLeaveInteractive)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
      observer.disconnect()
      interactives.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive)
        el.removeEventListener("mouseleave", onLeaveInteractive)
      })
    }
  }, [])

  return (
    <>
      <div
        ref={cursorRef}
        className="custom-cursor"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "hsl(38 50% 61%)",
          pointerEvents: "none",
          zIndex: 99999,
          transform: "translate(-50%, -50%)",
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={glowRef}
        className="custom-cursor-glow"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "radial-gradient(circle, hsl(38 50% 61% / 0.15), transparent 70%)",
          pointerEvents: "none",
          zIndex: 99998,
          transform: "translate(-50%, -50%)",
          opacity: 0.15,
        }}
      />
    </>
  )
}

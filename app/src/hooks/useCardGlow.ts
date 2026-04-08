"use client"

import { useCallback, useRef } from "react"

export function useCardGlow() {
  const glowRefs = useRef<Map<number, HTMLElement>>(new Map())

  const setRef = useCallback((el: HTMLElement | null, index: number) => {
    if (el) {
      glowRefs.current.set(index, el)
    } else {
      glowRefs.current.delete(index)
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>, index: number) => {
    const el = glowRefs.current.get(index)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    el.style.setProperty("--glow-x", `${x}px`)
    el.style.setProperty("--glow-y", `${y}px`)
    el.style.setProperty("--glow-opacity", "1")
  }, [])

  const handlePointerLeave = useCallback((_e: React.PointerEvent<HTMLElement>, index: number) => {
    const el = glowRefs.current.get(index)
    if (!el) return
    el.style.setProperty("--glow-opacity", "0")
  }, [])

  return { setRef, handlePointerMove, handlePointerLeave }
}

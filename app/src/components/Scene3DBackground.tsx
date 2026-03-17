"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

const PARTICLE_COUNT = 300

function Particles() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const mouseRef = useRef({ x: 0, y: 0 })
  const scrollRef = useRef(0)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 15 - 5,
        speed: 0.2 + Math.random() * 0.5,
        scale: 0.01 + Math.random() * 0.03,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        amplitude: 0.3 + Math.random() * 0.7,
      })
    }
    return arr
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    const onScroll = () => {
      scrollRef.current = window.scrollY
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const mx = mouseRef.current.x
    const my = mouseRef.current.y
    const scrollOffset = scrollRef.current * 0.001

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]
      const floatX = Math.sin(t * p.speed + p.phaseX) * p.amplitude
      const floatY = Math.cos(t * p.speed * 0.7 + p.phaseY) * p.amplitude
      const parallaxX = mx * (0.3 + Math.abs(p.z) * 0.08)
      const parallaxY = my * (0.3 + Math.abs(p.z) * 0.08)

      dummy.position.set(
        p.x + floatX + parallaxX,
        p.y + floatY + parallaxY - scrollOffset * 0.5,
        p.z
      )
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#c4a86b" transparent opacity={0.4} />
    </instancedMesh>
  )
}

function FloatingGeometry() {
  const group = useRef<THREE.Group>(null!)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.rotation.y = t * 0.03 + mouseRef.current.x * 0.1
    group.current.rotation.x = Math.sin(t * 0.02) * 0.1 + mouseRef.current.y * 0.05
  })

  return (
    <group ref={group}>
      {[
        { pos: [-6, 3, -8] as [number, number, number], scale: 0.4 },
        { pos: [7, -2, -10] as [number, number, number], scale: 0.3 },
        { pos: [-3, -4, -6] as [number, number, number], scale: 0.25 },
        { pos: [5, 4, -12] as [number, number, number], scale: 0.35 },
      ].map((item, i) => (
        <mesh key={i} position={item.pos} scale={item.scale}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color="#c4a86b"
            wireframe
            transparent
            opacity={0.06}
          />
        </mesh>
      ))}
    </group>
  )
}

export function Scene3DBackground() {
  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 0, pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Particles />
        <FloatingGeometry />
      </Canvas>
    </div>
  )
}

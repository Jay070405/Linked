"use client"

import { Suspense, useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Center, Text3D, Environment, Float, MeshTransmissionMaterial } from "@react-three/drei"
import * as THREE from "three"

const FONT_URL =
  "https://cdn.jsdelivr.net/npm/three@0.183.2/examples/fonts/helvetiker_bold.typeface.json"

interface GlassLogoMeshProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>
  autoRotate?: boolean
  scaleMultiplier?: number
}

function GlassLogoMesh({ mouse, autoRotate = true, scaleMultiplier = 1 }: GlassLogoMeshProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { viewport } = useThree()

  const scale = useMemo(() => {
    const base = Math.min(viewport.width, viewport.height)
    return base * 0.28 * scaleMultiplier
  }, [viewport.width, viewport.height, scaleMultiplier])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime

    const autoY = autoRotate ? t * 0.15 : 0
    const targetRotY = mouse.current.x * 0.2 + autoY
    const targetRotX = mouse.current.y * -0.1 + Math.sin(t * 0.08) * 0.03

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.03
    )
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.03
    )
  })

  return (
    <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.15}>
      <group ref={groupRef} scale={scale}>
        <Center>
          <Text3D
            font={FONT_URL}
            size={1}
            height={0.6}
            bevelEnabled
            bevelThickness={0.05}
            bevelSize={0.03}
            bevelSegments={12}
            curveSegments={48}
            letterSpacing={0.1}
          >
            JL
            <MeshTransmissionMaterial
              backside
              backsideThickness={0.3}
              samples={16}
              resolution={512}
              transmission={1}
              roughness={0.02}
              thickness={0.5}
              ior={1.5}
              chromaticAberration={0.06}
              anisotropy={0.3}
              distortion={0.1}
              distortionScale={0.2}
              temporalDistortion={0.1}
              clearcoat={1}
              clearcoatRoughness={0}
              attenuationDistance={0.6}
              attenuationColor={new THREE.Color("#b8c4d8")}
              color={new THREE.Color("#e8eaf0")}
              envMapIntensity={1.8}
            />
          </Text3D>
        </Center>
      </group>
    </Float>
  )
}

interface SceneProps {
  mouse: React.MutableRefObject<{ x: number; y: number }>
  autoRotate?: boolean
  scaleMultiplier?: number
}

function Scene({ mouse, autoRotate, scaleMultiplier }: SceneProps) {
  return (
    <>
      <GlassLogoMesh mouse={mouse} autoRotate={autoRotate} scaleMultiplier={scaleMultiplier} />
      <Environment preset="city" environmentIntensity={0.8} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#b8c4d8" />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#d4bc7e" />
      <pointLight position={[0, 0, 6]} intensity={0.6} color="#ffffff" distance={20} />
      <pointLight position={[3, -3, 4]} intensity={0.3} color="#8090b0" distance={15} />
      <pointLight position={[-3, 2, 3]} intensity={0.25} color="#d4bc7e" distance={12} />
    </>
  )
}

interface GlassJLLogo3DProps {
  className?: string
  autoRotate?: boolean
  scaleMultiplier?: number
}

export function GlassJLLogo3D({
  className = "",
  autoRotate = true,
  scaleMultiplier = 1,
}: GlassJLLogo3DProps) {
  const mouseRef = useRef({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [mounted])

  if (!mounted) return null

  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0 -z-10 scale-[2] rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse, rgba(140,160,200,0.15) 0%, rgba(180,196,216,0.08) 30%, transparent 70%)",
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene
            mouse={mouseRef}
            autoRotate={autoRotate}
            scaleMultiplier={scaleMultiplier}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

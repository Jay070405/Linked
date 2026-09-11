/* eslint-disable react/no-unknown-property */
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// replace with your own imports, see the usage snippet for details
import cardGLB from './card.glb?url';
import lanyard from './lanyard.png';

import * as THREE from 'three';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  onReveal,
  onRestProjection
}) {
  const wrapper = useRef(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let visible = true;
    const sync = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(wrapper.current);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  return (
    <div className="lanyard-wrapper" ref={wrapper}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        camera={{ position: isMobile ? [position[0], position[1], position[2] * .72] : position, fov: fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}>
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={1 / 60} paused={!active}>
          <Band
            active={active}
            isMobile={isMobile}
            frontImage={frontImage}
            backImage={backImage}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
            onReveal={onReveal}
            onRestProjection={onRestProjection} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]} />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]} />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]} />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}
function Band({
  active = true,
  isMobile = false,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  onReveal,
  onRestProjection
}) {
  const canvas = useThree(state => state.gl.domElement);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const captureRef = useRef(null);
  const releaseVelocity = useRef(null);
  const touched = useRef(false), revealed = useRef(false);
  const callbacks = useRef({ onReveal, onRestProjection });
  callbacks.current = { onReveal, onRestProjection };
  const band = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();
  const motion = useMemo(() => ({
    point: new THREE.Vector3(), target: new THREE.Vector3(), step: new THREE.Vector3(),
    velocity: new THREE.Vector3(), angular: new THREE.Vector3(), anchor: new THREE.Vector3(),
    anchorOffset: new THREE.Vector3(), plane: new THREE.Plane(new THREE.Vector3(0, 0, 1)),
    rotation: new THREE.Quaternion(), rest: new THREE.Vector3(0, -.5, 0),
  }), []);
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4.5, linearDamping: 2.7, additionalSolverIterations: 6 };
  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardImage || lanyard);
  // useTexture must be called unconditionally; use a blank pixel when an image
  // isn't supplied for a given face, then skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // Composite the front/back images into the card's texture atlas (front = left
  // half, back = right half). Each image is drawn aspect-preserving (no stretch).
  const cardMap = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return baseMap;

    const baseImg = baseMap.image;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return baseMap;
    // Keep the original baked atlas for the card edges and any untouched face.
    ctx.drawImage(baseImg, 0, 0, W, H);

    const drawFitted = (img, rect) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const pick = imageFit === 'contain' ? Math.min : Math.max;
      const scale = pick(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    };

    if (frontImage && frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT);
    if (backImage && backTex.image) drawFitted(backTex.image, BACK_UV_RECT);

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return composite;
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);
  useEffect(() => () => {
    if (cardMap !== materials.base.map) cardMap.dispose();
  }, [cardMap, materials.base.map]);
  const [curve] = useState(() =>
    new THREE.CatmullRomCurve3(
      [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
    ));
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  // The hidden DOM picture sits inside the badge's resting screen projection.
  // Publish only on layout changes, never one React update per physics frame.
  useEffect(() => {
    const center = new THREE.Vector3(0, -.523, -.043).project(camera);
    const left = new THREE.Vector3(-.806, -.523, -.043).project(camera);
    const right = new THREE.Vector3(.806, -.523, -.043).project(camera);
    const top = new THREE.Vector3(0, .602, -.043).project(camera);
    const bottom = new THREE.Vector3(0, -1.648, -.043).project(camera);
    callbacks.current.onRestProjection?.({
      x: (center.x + 1) * size.width / 2, y: (1 - center.y) * size.height / 2,
      width: (right.x - left.x) * size.width / 2,
      height: (top.y - bottom.y) * size.height / 2,
    });
  }, [camera, size.width, size.height]);

  const releaseCapture = useCallback(() => {
    const capture = captureRef.current;
    captureRef.current = null;
    if (!capture) return;
    try {
      if (capture.target.hasPointerCapture(capture.pointerId)) capture.target.releasePointerCapture(capture.pointerId);
    } catch { /* The browser may already have revoked capture during cancellation. */ }
  }, []);
  const finishDrag = useCallback(event => {
    if (!captureRef.current || (event?.pointerId != null && event.pointerId !== captureRef.current.pointerId)) return;
    // Keep a little momentum, never hand a pointer teleport to the rope solver.
    releaseVelocity.current = motion.velocity.clone().multiplyScalar(.7).clampLength(0, 4);
    if (!event || event.type === 'pointercancel' || event.type === 'lostpointercapture') releaseVelocity.current.set(0, 0, 0);
    releaseCapture();
    drag(false);
    hover(false);
  }, [releaseCapture, motion]);
  useEffect(() => { if (!active) finishDrag(); }, [active, finishDrag]);
  useEffect(() => {
    // R3F handles these native events internally without forwarding them to
    // object handlers, so listen on the actual canvas to release our drag state.
    const hidden = () => { if (document.hidden) finishDrag(); };
    canvas.addEventListener('pointercancel', finishDrag);
    canvas.addEventListener('lostpointercapture', finishDrag);
    window.addEventListener('blur', finishDrag);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      canvas.removeEventListener('pointercancel', finishDrag);
      canvas.removeEventListener('lostpointercapture', finishDrag);
      window.removeEventListener('blur', finishDrag);
      document.removeEventListener('visibilitychange', hidden);
      releaseCapture();
    };
  }, [canvas, finishDrag, releaseCapture]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0]
  ]);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (!active) return;
    const dt = Math.min(delta, .05);
    if (dragged) {
      state.raycaster.setFromCamera(state.pointer, state.camera);
      state.raycaster.ray.intersectPlane(motion.plane, motion.point);
      motion.target.copy(motion.point).sub(dragged);
      const halfView = Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)) * state.camera.position.z * state.size.width / state.size.height;
      const reach = Math.min(2.35, Math.max(.95, halfView - .9));
      motion.target.x = THREE.MathUtils.clamp(motion.target.x, -reach, reach);
      motion.target.y = THREE.MathUtils.clamp(motion.target.y, -.62, 1.7);
      motion.target.z = 0;
      // Constrain the clip attachment to the actual three-unit strap, accounting
      // for the current card rotation; the rope never stretches into a catapult.
      motion.rotation.copy(card.current.rotation());
      motion.anchorOffset.set(0, 1.5, 0).applyQuaternion(motion.rotation);
      motion.anchor.copy(motion.target).add(motion.anchorOffset).sub(fixed.current.translation()).clampLength(0, 2.97);
      motion.target.copy(fixed.current.translation()).add(motion.anchor).sub(motion.anchorOffset);
      motion.step.copy(motion.target).sub(card.current.translation()).multiplyScalar(1 - Math.exp(-dt * 12)).clampLength(0, 9.5 * dt);
      motion.velocity.copy(motion.step).divideScalar(Math.max(dt, .001));
      motion.target.copy(card.current.translation()).add(motion.step);
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation(motion.target);
    } else if (releaseVelocity.current && card.current) {
      card.current.setLinvel(releaseVelocity.current, true);
      motion.angular.copy(card.current.angvel()).clampLength(0, 4.5);
      card.current.setAngvel(motion.angular, true);
      releaseVelocity.current = null;
    }
    if ([fixed, j1, j2, j3, card, band].every(ref => ref.current)) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        ref.current.lerped.lerp(ref.current.translation(), 1 - Math.exp(-dt * 24));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      if (!dragged && !card.current.isSleeping()) {
        motion.velocity.copy(card.current.linvel());
        if (motion.velocity.lengthSq() > 56.25) card.current.setLinvel(motion.velocity.clampLength(0, 7.5), false);
        motion.angular.copy(card.current.angvel());
        motion.rotation.copy(card.current.rotation());
        motion.angular.y -= motion.rotation.y * .5 * dt;
        card.current.setAngvel(motion.angular.clampLength(0, 4.5), false);
      }
      const distance = motion.point.copy(card.current.translation()).distanceTo(motion.rest);
      const nextReveal = touched.current && distance > (revealed.current ? .46 : .96);
      if (nextReveal !== revealed.current) { revealed.current = nextReveal; callbacks.current.onReveal?.(nextReveal); }
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0, -1, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.07]} mass={.07} restitution={0} />
        </RigidBody>
        <RigidBody position={[0, -2, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.07]} mass={.07} restitution={0} />
        </RigidBody>
        <RigidBody position={[0, -3, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.07]} mass={.07} restitution={0} />
        </RigidBody>
        <RigidBody
          position={[0, -4.5, 0]}
          ref={card}
          {...segmentProps}
          linearDamping={2.4}
          angularDamping={4.5}
          ccd
          type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.025]} mass={1.15} restitution={0} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={finishDrag}
            onPointerDown={e => {
              if (captureRef.current || !card.current) return;
              e.stopPropagation();
              e.target.setPointerCapture(e.pointerId);
              captureRef.current = { pointerId: e.pointerId, target: e.target };
              touched.current = true;
              releaseVelocity.current = null;
              motion.velocity.set(0, 0, 0);
              motion.plane.constant = -e.point.z;
              drag(new THREE.Vector3().copy(e.point).sub(card.current.translation()));
            }}>
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8} />
            </mesh>
            <mesh
              geometry={nodes.clip.geometry}
              material={materials.metal}
              material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={texture}
          repeat={[-4, 1]}
          lineWidth={lanyardWidth} />
      </mesh>
    </>
  );
}

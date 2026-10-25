/* eslint-disable react/no-unknown-property */
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, useSpringJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

// replace with your own imports, see the usage snippet for details
import cardGLB from './card.glb?url';
import lanyard from './lanyard.png';

import * as THREE from 'three';
import useBadgePointerSurface from './useBadgePointerSurface';
import { LANYARD_PHYSICS as DEFAULT_PHYSICS, ABOUT_LANYARD_PHYSICS, getLanyardSpringRestLength, getLanyardDragBounds } from './lanyard-physics';
import {flickSide, releaseVelocity as pointerVelocity, wrappedYawError} from '../product/about-model';
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
  onRestProjection,
  variant, side = 'product', onSideChange, onFlipStart, onCardProjection,
  cardHeight = 306, anchorTop = 150, scrollOffset = 0, strapColor = '#131315'
}) {
  const study = variant === 'about';
  const P = study ? ABOUT_LANYARD_PHYSICS : DEFAULT_PHYSICS;
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
        style={study ? {pointerEvents: 'none'} : undefined}
        frameloop={active ? (study ? 'demand' : 'always') : 'never'}
        camera={{ position: isMobile && !study ? [position[0], position[1], position[2] * .72] : position, fov: fov }}
        dpr={[1, study ? 1.75 : isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}>
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={P.timeStep} paused={!active}>
          <Band
            active={active}
            study={study} side={side} onSideChange={onSideChange} onFlipStart={onFlipStart}
            onCardProjection={onCardProjection} cardHeight={cardHeight} anchorTop={anchorTop}
            scrollOffset={scrollOffset} strapColor={strapColor}
            isMobile={isMobile}
            gravityY={gravity[1]}
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
  gravityY = -40,
  frontImage = null,
  backImage = null,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  onReveal,
  onRestProjection, study = false, side = 'product', onSideChange, onFlipStart, onCardProjection,
  cardHeight, anchorTop, scrollOffset, strapColor
}) {
  const P = study ? ABOUT_LANYARD_PHYSICS : DEFAULT_PHYSICS;
  const invalidate = useThree(state => state.invalidate);
  const canvas = useThree(state => state.gl.domElement);
  const camera = useThree(state => state.camera);
  const size = useThree(state => state.size);
  const captureRef = useRef(null);
  const badgeVisual = useRef(null);
  const releaseVelocity = useRef(null);
  const touched = useRef(false), revealed = useRef(false);
  const callbacks = useRef({});
  callbacks.current = {onReveal, onRestProjection, onSideChange, onFlipStart, onCardProjection};
  const samples = useRef([]), chosenSide = useRef(side), visibleSide = useRef(side);
  const activity = useRef({idle: 0, scroll: scrollOffset, time: 0, velocity: 0});
  const yawEuler = useMemo(() => new THREE.Euler(0, 0, 0, 'YXZ'), []);
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
    rotation: new THREE.Quaternion(), rest: new THREE.Vector3(0, P.restY, 0),
  }), []);
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: P.angularDamping, linearDamping: P.segmentLinearDamping, additionalSolverIterations: P.solverIterations };
  const { nodes, materials } = useGLTF(cardGLB);
  // About: mid-grey hardware reads on both the paper and the black world; the GLB's dark metal vanishes on black
  const hardware = useMemo(() => study ? new THREE.MeshStandardMaterial({ color: '#a4a4aa', metalness: .3, roughness: .4 }) : materials.metal, [study, materials.metal]);
  useEffect(() => () => { if (hardware !== materials.metal) hardware.dispose(); }, [hardware, materials.metal]);
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

  useEffect(() => {
    if (!study) return;
    const pixelsPerUnit = cardHeight / P.cardHeight;
    // A fixed upper lead keeps the visible strap at 65px while perspective changes card size.
    const lead = P.strapPixels / pixelsPerUnit - P.segmentLength * P.segmentCount;
    // the strap's visible top (world y = lead) projects to anchorTop px from the canvas top
    camera.position.set(0, lead - (size.height / 2 - anchorTop) / pixelsPerUnit,
      size.height / pixelsPerUnit / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    camera.updateProjectionMatrix();
    activity.current.idle = 0; invalidate();
  }, [study, cardHeight, anchorTop, size.height, size.width, camera, invalidate, P]);
  useEffect(() => {
    if (!study) return;
    chosenSide.current = side; activity.current.idle = 0;
    [card, j1, j2, j3].forEach(ref => ref.current?.wakeUp()); invalidate();
  }, [side, study, invalidate]);
  useEffect(() => {
    if (!study) return;
    const now = performance.now(), a = activity.current;
    const dt = Math.max(.016, (now - (a.time || now - 16)) / 1000);
    const velocity = THREE.MathUtils.clamp((scrollOffset - a.scroll) / dt, -P.maxScrollVelocity, P.maxScrollVelocity);
    const acceleration = (velocity - a.velocity) / dt;
    const kick = THREE.MathUtils.clamp(acceleration * P.scrollKick, -P.maxScrollKick, P.maxScrollKick);
    if (card.current && Math.abs(scrollOffset - a.scroll) > .1) {
      [card, j1, j2, j3].forEach(ref => ref.current?.applyImpulse({x: kick * P.scrollKickX, y: kick * P.scrollKickY, z: 0}, true));
      a.idle = 0; invalidate();
    }
    a.scroll = scrollOffset; a.time = now; a.velocity = velocity;
  }, [scrollOffset, study, invalidate, P]);
  useEffect(() => { if (study && active) { activity.current.idle = 0; invalidate(); } }, [active, study, invalidate]);

  // The hidden DOM picture sits inside the badge's resting screen projection.
  // Publish only on layout changes, never one React update per physics frame.
  useEffect(() => {
    if (study) return;
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
  }, [camera, size.width, size.height, study]);

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
    releaseVelocity.current = motion.velocity.clone().multiplyScalar(P.releaseMomentum).clampLength(0, P.releaseSpeed);
    if (!event || event.type === 'pointercancel' || event.type === 'lostpointercapture') releaseVelocity.current.set(0, 0, 0);
    if (study && event?.type === 'pointerup') {
      const now = performance.now();
      const next = flickSide(pointerVelocity(samples.current, now, P.velocityWindowMs), chosenSide.current, P.flickThreshold);
      if (next !== chosenSide.current) {
        chosenSide.current = next; callbacks.current.onFlipStart?.(next);
      }
    }
    activity.current.idle = 0;
    if (study) invalidate();
    releaseCapture();
    drag(false);
    hover(false);
  }, [releaseCapture, motion, study, invalidate, P]);
  useBadgePointerSurface({ objectRef: badgeVisual, active, onCancel: finishDrag });
  useEffect(() => { if (!active) finishDrag(); }, [active, finishDrag]);
  useEffect(() => {
    // Pointer cancellation is handled on the shared Canvas event source by the
    // touch surface hook. Visibility/blur also release a captured drag.
    const hidden = () => { if (document.hidden) finishDrag(); };
    window.addEventListener('blur', finishDrag);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('blur', finishDrag);
      document.removeEventListener('visibilitychange', hidden);
      releaseCapture();
    };
  }, [finishDrag, releaseCapture]);

  // The first strap section gives under a downward pull. Gravity compensation
  // keeps the original resting pose; the parallel rope is a hard travel stop.
  // Three taut rope joints alone left no downward travel at all.
  const springLength = getLanyardSpringRestLength(gravityY, P);
  useSpringJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], springLength, P.springStiffness, P.springDamping]);
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], P.topRopeMaxLength]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], P.segmentLength]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], P.segmentLength]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, P.clipOffsetY, 0]
  ]);

  useEffect(() => {
    if (hovered || dragged) {
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
      const halfHeight = Math.tan(THREE.MathUtils.degToRad(state.camera.fov / 2)) * state.camera.position.z;
      const halfView = halfHeight * state.size.width / state.size.height;
      const screen = study ? canvas.getBoundingClientRect() : null;
      const pixels = study ? cardHeight / P.cardHeight : 1;
      const visibleHalf = study ? Math.min(halfView, (screen.left + size.width / 2) / pixels, (innerWidth - screen.left - size.width / 2) / pixels) : halfView;
      const { reach, minY, maxY } = study ? {
        reach: Math.max(P.minimumViewReach, visibleHalf - P.cardHeight * P.cardAspect / 2 - P.sideClearance),
        minY: camera.position.y - halfHeight + P.cardHeight / 2 + P.verticalClearance,
        maxY: camera.position.y + halfHeight - P.cardHeight / 2 - P.verticalClearance,
      } : getLanyardDragBounds(halfHeight, halfView);
      motion.target.x = THREE.MathUtils.clamp(motion.target.x, -reach, reach);
      motion.target.y = THREE.MathUtils.clamp(motion.target.y, minY, maxY);
      motion.target.z = 0;
      // Include the elastic section's travel, while keeping the clip inside the
      // physical stop and the whole badge inside the canvas on a phone.
      motion.rotation.copy(card.current.rotation());
      motion.anchorOffset.set(0, P.clipOffsetY, 0).applyQuaternion(motion.rotation);
      motion.anchor.copy(motion.target).add(motion.anchorOffset).sub(fixed.current.translation()).clampLength(0, P.dragReach);
      motion.target.copy(fixed.current.translation()).add(motion.anchor).sub(motion.anchorOffset);
      motion.step.copy(motion.target).sub(card.current.translation()).multiplyScalar(1 - Math.exp(-dt * P.dragResponse)).clampLength(0, P.dragSpeed * dt);
      motion.velocity.copy(motion.step).divideScalar(Math.max(dt, .001));
      motion.target.copy(card.current.translation()).add(motion.step);
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation(motion.target);
    } else if (releaseVelocity.current && card.current) {
      card.current.setLinvel(releaseVelocity.current, true);
      motion.angular.copy(card.current.angvel()).clampLength(0, P.angularSpeed);
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
      if (study) curve.points[3].y += P.strapPixels / (cardHeight / P.cardHeight) - P.segmentLength * P.segmentCount;
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      if (!dragged && !card.current.isSleeping()) {
        motion.velocity.copy(card.current.linvel());
        if (motion.velocity.lengthSq() > P.dynamicSpeed ** 2) card.current.setLinvel(motion.velocity.clampLength(0, P.dynamicSpeed), false);
        motion.angular.copy(card.current.angvel());
        motion.rotation.copy(card.current.rotation());
        if (study) {
          yawEuler.setFromQuaternion(motion.rotation, 'YXZ');
          const error = wrappedYawError(chosenSide.current === 'game' ? Math.PI : 0, yawEuler.y);
          motion.angular.y += (error * P.yawStiffness - motion.angular.y * P.yawDamping) * dt;
          motion.angular.x *= Math.exp(-dt * P.pitchDamping);
          motion.angular.z += (-yawEuler.z * P.tiltStiffness - motion.angular.z * P.tiltDamping) * dt;
          if (!touched.current && Math.abs(yawEuler.z) > P.maxTilt) motion.angular.z = -Math.sign(yawEuler.z) * Math.abs(motion.angular.z);
          motion.angular.y = THREE.MathUtils.clamp(motion.angular.y, -P.flipAngularSpeed, P.flipAngularSpeed);
          motion.angular.x = THREE.MathUtils.clamp(motion.angular.x, -P.angularSpeed, P.angularSpeed);
          motion.angular.z = THREE.MathUtils.clamp(motion.angular.z, -P.angularSpeed, P.angularSpeed);
          card.current.setAngvel(motion.angular, false);
        } else {
          motion.angular.y -= motion.rotation.y * .5 * dt;
          card.current.setAngvel(motion.angular.clampLength(0, P.angularSpeed), false);
        }
      }
      const distance = study ? Math.max(0, P.restY - card.current.translation().y) : motion.point.copy(card.current.translation()).distanceTo(motion.rest);
      const nextReveal = touched.current && distance > (revealed.current ? .46 : .96);
      if (nextReveal !== revealed.current) { revealed.current = nextReveal; callbacks.current.onReveal?.(nextReveal); }
      if (study) {
        const body = card.current;
        motion.rotation.copy(body.rotation()); yawEuler.setFromQuaternion(motion.rotation, 'YXZ');
        if (!dragged) {
          const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
          const halfW = halfH * size.width / size.height;
          const w = P.cardHeight * (P.cardAspect * Math.abs(Math.cos(yawEuler.y) * Math.cos(yawEuler.z)) + Math.abs(Math.sin(yawEuler.z))) / 2;
          const h = P.cardHeight * (Math.abs(Math.cos(yawEuler.z)) + P.cardAspect * Math.abs(Math.sin(yawEuler.z))) / 2;
          motion.target.copy(body.translation());
          const screen = canvas.getBoundingClientRect(), pixels = cardHeight / P.cardHeight;
          const left = Math.max(-halfW, -(screen.left + size.width / 2) / pixels);
          const right = Math.min(halfW, (innerWidth - screen.left - size.width / 2) / pixels);
          const x = THREE.MathUtils.clamp(motion.target.x, left + w + P.sideClearance, right - w - P.sideClearance);
          const y = THREE.MathUtils.clamp(motion.target.y, camera.position.y - halfH + h + P.verticalClearance, camera.position.y + halfH - h - P.verticalClearance);
          if (x !== motion.target.x || y !== motion.target.y) {
            motion.velocity.copy(body.linvel());
            if (x !== motion.target.x) motion.velocity.x = 0;
            if (y !== motion.target.y) motion.velocity.y = 0;
            motion.target.set(x, y, 0); body.setTranslation(motion.target, false); body.setLinvel(motion.velocity, false);
          }
        }
        const position = body.translation();
        const nextVisible = Math.cos(yawEuler.y) < 0 ? 'game' : 'product';
        if (nextVisible !== visibleSide.current) { visibleSide.current = nextVisible; callbacks.current.onSideChange?.(nextVisible); }
        const rect = canvas.getBoundingClientRect();
        motion.point.copy(position).project(camera);
        callbacks.current.onCardProjection?.({x: rect.left + (motion.point.x + 1) * size.width / 2,
          y: rect.top + (1 - motion.point.y) * size.height / 2, width: cardHeight * P.cardAspect,
          height: cardHeight, yaw: yawEuler.y, tilt: yawEuler.z});
        band.current.material.color.set(typeof strapColor === 'object' ? strapColor.current : strapColor);
        const calm = !dragged && Math.hypot(...Object.values(body.linvel())) < P.sleepSpeed &&
          Math.hypot(...Object.values(body.angvel())) < P.sleepSpeed &&
          Math.abs(wrappedYawError(chosenSide.current === 'game' ? Math.PI : 0, yawEuler.y)) < P.sleepYawError;
        activity.current.idle = calm ? activity.current.idle + dt : 0;
        if (activity.current.idle < P.sleepAfter) state.invalidate();
        else [card, j1, j2, j3].forEach(ref => ref.current.sleep());
      }
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, P.anchorY, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0, -P.segmentLength, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.07]} mass={P.segmentMass} restitution={0} />
        </RigidBody>
        <RigidBody position={[0, -2 * P.segmentLength, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.07]} mass={P.segmentMass} restitution={0} />
        </RigidBody>
        <RigidBody position={[0, -3 * P.segmentLength, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.07]} mass={P.segmentMass} restitution={0} />
        </RigidBody>
        <RigidBody
          position={[0, P.restY - P.anchorY, 0]}
          ref={card}
          {...segmentProps}
          linearDamping={P.cardLinearDamping}
          angularDamping={P.angularDamping}
          ccd
          type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[study ? P.cardHeight * P.cardAspect / 2 : .8, 1.125, .025]} mass={P.cardMass} restitution={0} />
          <group
            ref={badgeVisual}
            scale={study ? [2.25 * P.visualScaleX, 2.25, 2.25] : 2.25}
            position={[0, study ? P.visualOffsetY : -1.2, -0.05]}
            onPointerOver={() => { hover(true); if (study) { activity.current.idle = 0; invalidate(); } }}
            onPointerMove={e => {
              if (!study || !captureRef.current) return;
              const time = performance.now();
              samples.current.push({x: e.clientX, time});
              samples.current = samples.current.filter(p => time - p.time <= 4 * P.velocityWindowMs);
            }}
            onPointerOut={() => hover(false)}
            onPointerUp={finishDrag}
            onPointerDown={e => {
              if (captureRef.current || !card.current || e.button !== 0 || e.isPrimary === false) return;
              e.stopPropagation();
              e.target.setPointerCapture(e.pointerId);
              captureRef.current = { pointerId: e.pointerId, target: e.target };
              touched.current = true;
              if (study) { samples.current = [{x: e.clientX, time: performance.now()}]; activity.current.idle = 0; invalidate(); }
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
              position={study ? [0, -.125, 0] : undefined}
              geometry={nodes.clip.geometry}
              material={hardware}
              material-roughness={study ? .4 : 0.3} />
            <mesh position={study ? [0, -.125, 0] : undefined} geometry={nodes.clamp.geometry} material={hardware} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color={study ? (typeof strapColor === "object" ? strapColor.current : strapColor) : "white"}
          depthTest={false}
          resolution={study ? [size.width, size.height] : isMobile ? [1000, 2000] : [1000, 1000]}
          useMap={!study}
          map={texture}
          repeat={[-4, 1]}
          lineWidth={study ? 2 * P.cardHeight / cardHeight : lanyardWidth} />
      </mesh>
    </>
  );
}

import { useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

const CORNERS = [
  [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
  [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
];
const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

function convexHull(points) {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const lower = [], upper = [];
  for (const point of sorted) {
    while (lower.length > 1 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop();
    lower.push(point);
  }
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length > 1 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop();
    upper.push(point);
  }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

/**
 * Reserve touch dragging only over the visible badge, keeping native scrolling
 * everywhere else on the canvas. CSS touch-action must exist before pointerdown;
 * changing it after a raycast cannot stop the current gesture being cancelled.
 *
 * Call inside Canvas, after defining finishDrag:
 * useBadgePointerSurface({ objectRef: badgeVisualRef, active, onCancel: finishDrag });
 * Put badgeVisualRef on the visual group containing the card and clip meshes.
 * The existing R3F pointer handlers and pointer capture continue to handle drag.
 */
export default function useBadgePointerSurface({ objectRef, active = true, onCancel }) {
  const canvas = useThree(state => state.gl.domElement);
  const eventSource = useThree(state => state.events.connected);
  const get = useThree(state => state.get);
  const setEvents = useThree(state => state.setEvents);
  const cancel = useRef(onCancel);
  cancel.current = onCancel;
  const surfaceRef = useRef(null);
  const cache = useRef({ object: null, meshes: [], vector: new Vector3() });

  useLayoutEffect(() => {
    if (!eventSource?.appendChild) return;
    const surface = document.createElement('div');
    surface.className = 'lanyard-badge-pointer-surface';
    surface.setAttribute('aria-hidden', 'true');
    surface.setAttribute('data-badge-pointer-surface', '');
    surface.style.visibility = 'hidden';
    eventSource.appendChild(surface);
    surfaceRef.current = surface;

    const previousCompute = get().events.compute;
    const compute = (event, state) => {
      // Events now also originate from a clipped sibling of the canvas. Native
      // offsetX/Y belongs to that sibling, so always use viewport coordinates.
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      state.pointer.set(
        (event.clientX - rect.left) / rect.width * 2 - 1,
        -(event.clientY - rect.top) / rect.height * 2 + 1,
      );
      state.raycaster.setFromCamera(state.pointer, state.camera);
    };
    setEvents({ compute });
    const finish = event => cancel.current?.(event);
    // Capture belongs to the original hit element (surface or canvas). Both
    // bubble through the connected source, unlike a canvas-only listener.
    eventSource.addEventListener('pointercancel', finish);
    eventSource.addEventListener('lostpointercapture', finish);
    return () => {
      eventSource.removeEventListener('pointercancel', finish);
      eventSource.removeEventListener('lostpointercapture', finish);
      cancel.current?.();
      surface.remove();
      surfaceRef.current = null;
      if (get().events.compute === compute) setEvents({ compute: previousCompute });
    };
  }, [canvas, eventSource, get, setEvents]);

  useLayoutEffect(() => {
    if (!active && surfaceRef.current) surfaceRef.current.style.visibility = 'hidden';
  }, [active]);

  useFrame(state => {
    const surface = surfaceRef.current, object = objectRef.current;
    if (!surface) return;
    if (!active || !object || !object.visible) { surface.style.visibility = 'hidden'; return; }
    if (cache.current.object !== object) {
      cache.current.object = object;
      cache.current.meshes = [];
      object.traverseVisible(child => {
        if (!child.isMesh || !child.geometry) return;
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        if (child.geometry.boundingBox) cache.current.meshes.push(child);
      });
    }
    const canvasRect = canvas.getBoundingClientRect();
    const sourceRect = eventSource.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) { surface.style.visibility = 'hidden'; return; }
    // World matrices may otherwise still contain the preceding physics frame.
    object.updateWorldMatrix(true, true);
    const points = [], vector = cache.current.vector;
    for (const mesh of cache.current.meshes) {
      if (!mesh.visible) continue;
      const box = mesh.geometry.boundingBox;
      for (const [x, y, z] of CORNERS) {
        vector.set(x ? box.max.x : box.min.x, y ? box.max.y : box.min.y, z ? box.max.z : box.min.z)
          .applyMatrix4(mesh.matrixWorld).project(state.camera);
        if (vector.z < -1 || vector.z > 1 || !Number.isFinite(vector.x + vector.y)) continue;
        points.push({ x: (vector.x + 1) * canvasRect.width / 2, y: (1 - vector.y) * canvasRect.height / 2 });
      }
    }
    if (points.length < 3) { surface.style.visibility = 'hidden'; return; }
    const hull = convexHull(points);
    if (hull.length < 3) { surface.style.visibility = 'hidden'; return; }
    const center = hull.reduce((sum, point) => ({ x: sum.x + point.x / hull.length, y: sum.y + point.y / hull.length }), { x: 0, y: 0 });
    const polygon = hull.map(point => {
      const dx = point.x - center.x, dy = point.y - center.y;
      const padding = 6 / Math.max(1, Math.hypot(dx, dy));
      return `${(point.x + dx * padding).toFixed(2)}px ${(point.y + dy * padding).toFixed(2)}px`;
    }).join(',');
    surface.style.left = `${canvasRect.left - sourceRect.left}px`;
    surface.style.top = `${canvasRect.top - sourceRect.top}px`;
    surface.style.width = `${canvasRect.width}px`;
    surface.style.height = `${canvasRect.height}px`;
    surface.style.clipPath = `polygon(${polygon})`;
    surface.style.visibility = 'visible';
  });
}

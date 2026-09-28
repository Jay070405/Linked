import RAPIER from '@dimforge/rapier3d-compat';

let initialization;
export const initPhysics = () => (initialization ||= RAPIER.init());
export const DESK = { x: .90, y: 1.30, z: 0, half: [4.45, .095, 1.45] };

/** Independent rigid bodies. Only lost bodies are returned by restoreLost(). */
export class DeskPhysics {
  constructor(onLost = () => {}) {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = 1 / 60;
    this.world.numSolverIterations = 8;
    this.items = new Map(); this.lost = new Set(); this.onLost = onLost;
    this.accumulator = 0; this.held = null; this.carried = new Map();
    this.fixed(DESK.half, DESK);
    // The monitor remains the camera destination; the lamp has a fixed base.
    this.fixed([1.67, 1.09, .12], { x: .55, y: 2.70, z: -.48 });
    this.fixed([.52, .28, .25], { x: .55, y: 1.69, z: -.40 });
    this.fixed([.30, .045, .30], { x: 3.26, y: 1.45, z: -.53 });
    this.fixed([.33, .54, .29], { x: -2.02, y: 1.96, z: -.67 });
  }
  fixed(half, p) {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(p.x, p.y, p.z));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(...half).setFriction(.85), body);
  }
  add(id, home, half, mass = 1, rotation = { x: 0, y: 0, z: 0, w: 1 }) {
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(home.x, home.y, home.z).setRotation(rotation)
      .setLinearDamping(.6).setAngularDamping(1.5).setCcdEnabled(true).setCanSleep(true));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(...half)
      .setMass(mass).setFriction(.75).setRestitution(.12), body);
    this.items.set(id, { body, home: { ...home }, rotation: { ...rotation } });
    return body;
  }
  grab(id) {
    this.release();
    const item = this.items.get(id);
    if (!item || this.lost.has(id)) return;
    this.carried.set(item.body.handle, item.body);
    // A pen resting on a tablet/book travels with its support during pickup.
    // Side contacts are not passengers: they must still block a lateral drag.
    for (const support of this.carried.values()) {
      for (const [otherId, { body }] of this.items) {
        if (this.carried.has(body.handle) || this.lost.has(otherId)) continue;
        if (body.translation().y <= support.translation().y) continue;
        const contact = support.collider(0).contactCollider(body.collider(0), .025);
        if (contact && contact.normal1.y > .65) this.carried.set(body.handle, body);
      }
    }
    for (const body of this.carried.values()) body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    this.held = id;
  }
  move(p) {
    if (!this.held) return;
    const body = this.items.get(this.held).body;
    const current = body.translation();
    let delta = { x: p.x-current.x, y: p.y-current.y, z: p.z-current.z };
    const travel = { x: 0, y: 0, z: 0 };
    // Sweep every carried shape; ignore only the other members of this pickup.
    // At a side contact, retain motion along its surface. A small sideways
    // component from perspective must not stop a book being lifted vertically.
    for (let pass = 0; pass < 3; pass++) {
      let fraction = 1, normal;
      for (const carried of this.carried.values()) {
        const at = carried.translation();
        const from = { x: at.x+travel.x, y: at.y+travel.y, z: at.z+travel.z };
        const hit = this.world.castShape(from, carried.rotation(), delta, carried.collider(0).shape, .004, 1, false, 0, undefined, undefined, carried,
          collider => !this.carried.has(collider.parent()?.handle));
        if (hit && hit.time_of_impact < fraction) {
          fraction = Math.max(0, hit.time_of_impact-.003); normal = hit.normal1;
        }
      }
      for (const axis of ['x','y','z']) travel[axis] += delta[axis]*fraction;
      if (!normal) break;
      const dot = delta.x*normal.x+delta.y*normal.y+delta.z*normal.z;
      delta = { x:(delta.x-dot*normal.x)*(1-fraction), y:(delta.y-dot*normal.y)*(1-fraction), z:(delta.z-dot*normal.z)*(1-fraction) };
      if (Math.hypot(delta.x,delta.y,delta.z)<.00001) break;
    }
    for (const carried of this.carried.values()) {
      const at = carried.translation();
      carried.setNextKinematicTranslation({ x: at.x+travel.x, y: at.y+travel.y, z: at.z+travel.z });
    }
  }
  release() {
    if (!this.held) return;
    // Preserve a restrained release velocity; never fling across the entire room.
    for (const body of this.carried.values()) {
      const v = body.linvel(); const velocity = { x: Math.max(-3, Math.min(3, v.x)), y: Math.max(-1, Math.min(1, v.y)), z: Math.max(-3, Math.min(3, v.z)) };
      body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
      body.setLinvel(velocity, true); body.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
    this.carried.clear();
    this.held = null;
  }
  step(dt) {
    this.accumulator += Math.min(dt, .08);
    while (this.accumulator >= 1 / 60) {
      this.world.step(); this.accumulator -= 1 / 60;
      for (const [id, { body }] of this.items) {
        if (this.carried.has(body.handle) || this.lost.has(id)) continue;
        if (body.translation().y < .15) {
          body.setEnabled(false); this.lost.add(id); this.onLost(this.lost.size);
        }
      }
    }
  }
  restoreLost() {
    for (const id of this.lost) {
      const { body, home, rotation } = this.items.get(id);
      body.setTranslation(home, false); body.setRotation(rotation, false);
      body.setLinvel({ x: 0, y: 0, z: 0 }, false); body.setAngvel({ x: 0, y: 0, z: 0 }, false);
      body.setEnabled(true); body.wakeUp();
    }
    this.lost.clear(); this.onLost(0);
  }
  get moving() { return this.held || [...this.items].some(([id, item]) => !this.lost.has(id) && !item.body.isSleeping()); }
  dispose() { this.world.free(); }
}

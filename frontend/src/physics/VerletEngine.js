// Verlet Integration Physics Engine
import * as THREE from 'three';

export class VerletEngine {
  constructor(options = {}) {
    this.gravity = options.gravity || new THREE.Vector3(0, -9.8, 0);
    this.friction = options.friction || 0.99;
    this.bounce = options.bounce || 0.5;
    
    this.particles = [];
    this.constraints = [];
  }

  addParticle(position, isPinned = false) {
    const p = {
      position: position.clone(),
      previousPosition: position.clone(),
      isPinned: isPinned,
      mass: 1.0,
      radius: 0.1
    };
    this.particles.push(p);
    return p;
  }

  addConstraint(p1, p2, distance, stiffness = 1.0) {
    const c = {
      p1: p1,
      p2: p2,
      distance: distance,
      stiffness: stiffness
    };
    this.constraints.push(c);
    return c;
  }

  update(dt = 0.016) {
    this.updateParticles(dt);
    
    // Resolve constraints multiple times for stability
    for (let i = 0; i < 3; i++) {
      this.resolveConstraints();
    }
  }

  updateParticles(dt) {
    const dt2 = dt * dt;
    for (const p of this.particles) {
      if (p.isPinned) continue;

      // Verlet Integration
      const velocity = new THREE.Vector3().subVectors(p.position, p.previousPosition);
      velocity.multiplyScalar(this.friction);
      
      p.previousPosition.copy(p.position);
      
      // Add gravity
      p.position.add(velocity).add(this.gravity.clone().multiplyScalar(dt2));
    }
  }

  resolveConstraints() {
    const diff = new THREE.Vector3();
    
    for (const c of this.constraints) {
      diff.subVectors(c.p1.position, c.p2.position);
      const currentDist = diff.length();
      
      if (currentDist === 0) continue;
      
      const error = (c.distance - currentDist) / currentDist;
      
      const adjustment = diff.multiplyScalar(0.5 * error * c.stiffness);
      
      if (!c.p1.isPinned) {
        c.p1.position.add(adjustment);
      }
      if (!c.p2.isPinned) {
        c.p2.position.sub(adjustment);
      }
    }
  }
}

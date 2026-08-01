import * as THREE from 'three';
import { VerletEngine } from './VerletEngine';

export class SoftBody {
  constructor(mesh, physicsEngine) {
    this.mesh = mesh;
    this.physics = physicsEngine;
    this.particles = [];
    this.constraints = [];
    
    if (!mesh || !mesh.geometry) return;
    
    // Convert mesh geometry vertices into physics particles
    this.geometry = this.mesh.geometry;
    
    // We only support non-indexed geometries for simple per-vertex deformation right now
    if (this.geometry.index) {
      this.geometry = this.geometry.toNonIndexed();
      this.mesh.geometry = this.geometry;
    }
    
    this.positionAttribute = this.geometry.attributes.position;
    this.vertexCount = this.positionAttribute.count;
    
    this._initParticles();
    this._initConstraints();
  }

  _initParticles() {
    const v = new THREE.Vector3();
    const worldMatrix = this.mesh.matrixWorld;
    
    for (let i = 0; i < this.vertexCount; i++) {
      v.fromBufferAttribute(this.positionAttribute, i);
      // Transform local vertex to world space for the physics engine
      v.applyMatrix4(worldMatrix);
      
      // Add to physics engine
      const p = this.physics.addParticle(v, false);
      p.originalLocal = new THREE.Vector3().fromBufferAttribute(this.positionAttribute, i);
      this.particles.push(p);
    }
  }

  _initConstraints() {
    // For a real soft body, we'd add constraints between neighboring vertices
    // and internal cross-constraints to preserve volume.
    // For this prototype, we'll connect each vertex to its original local position
    // essentially creating a "shape matching" or "pin" constraint with low stiffness
    // so it can deform but wants to return to its original shape.
    
    const worldMatrix = this.mesh.matrixWorld;
    const v = new THREE.Vector3();

    for (let i = 0; i < this.vertexCount; i++) {
      v.copy(this.particles[i].originalLocal).applyMatrix4(worldMatrix);
      
      // Create a pinned anchor at the original position
      const anchor = this.physics.addParticle(v, true); 
      
      // Connect actual particle to anchor
      const c = this.physics.addConstraint(this.particles[i], anchor, 0.0, 0.1);
      this.constraints.push(c);
      
      // Store reference to update anchor if the whole object moves
      this.particles[i].anchor = anchor;
    }
  }

  applyForceAt(worldPos, radius, forceMagnitude, direction) {
    // Deform vertices within radius
    for (let i = 0; i < this.vertexCount; i++) {
      const p = this.particles[i];
      const dist = p.position.distanceTo(worldPos);
      
      if (dist < radius) {
        // Calculate influence based on distance
        const influence = 1.0 - (dist / radius);
        const displacement = direction.clone().normalize().multiplyScalar(forceMagnitude * influence);
        
        p.position.add(displacement);
      }
    }
  }

  update(worldMatrix) {
    if (!this.positionAttribute || !this.particles || this.particles.length === 0) return;
    // Update anchors to follow the overall object's rigid transform
    const v = new THREE.Vector3();
    for (let i = 0; i < this.vertexCount; i++) {
      const p = this.particles[i];
      v.copy(p.originalLocal).applyMatrix4(worldMatrix);
      p.anchor.position.copy(v);
    }

    // Write physics particles back to Three.js geometry
    // Note: To support rotation/scaling properly, we'd map world physics back to local geometry space.
    // For simplicity here, we assume the object's mesh is at identity, or we invert transform.
    const inverseMatrix = worldMatrix.clone().invert();
    
    for (let i = 0; i < this.vertexCount; i++) {
      v.copy(this.particles[i].position);
      v.applyMatrix4(inverseMatrix); // Back to local
      
      this.positionAttribute.setXYZ(i, v.x, v.y, v.z);
    }
    
    this.positionAttribute.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}

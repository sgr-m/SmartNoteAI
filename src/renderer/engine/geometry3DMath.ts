/**
 * 3D Geometry Math & Projection Engine
 * Pure orthographic/parallel projection for distortion-free mathematical solids.
 * Full 3-axis rotation (X-Pitch, Y-Yaw, Z-Roll).
 */

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedVertex {
  id: string;
  label?: string;
  x2d: number;
  y2d: number;
  depth: number;
}

export interface Solid3DModel {
  vertices: { id: string; label?: string; x: number; y: number; z: number }[];
  edges: [number, number][];
  faces: number[][]; // Indices of vertices for each face
}

export type Solid3DType = 'cube' | 'pyramid' | 'prism' | 'cylinder' | 'cone' | 'sphere';

/**
 * Generate 3D vertex, edge, and face models for geometric solids.
 */
export function getSolid3DModel(type: Solid3DType): Solid3DModel {
  switch (type) {
    case 'cube': {
      // 8 vertices of a unit cube
      const vertices = [
        { id: 'v0', label: 'A', x: -1, y: -1, z: -1 },
        { id: 'v1', label: 'B', x: 1, y: -1, z: -1 },
        { id: 'v2', label: 'C', x: 1, y: 1, z: -1 },
        { id: 'v3', label: 'D', x: -1, y: 1, z: -1 },
        { id: 'v4', label: 'E', x: -1, y: -1, z: 1 },
        { id: 'v5', label: 'F', x: 1, y: -1, z: 1 },
        { id: 'v6', label: 'G', x: 1, y: 1, z: 1 },
        { id: 'v7', label: 'H', x: -1, y: 1, z: 1 },
      ];
      const edges: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Bottom square
        [4, 5], [5, 6], [6, 7], [7, 4], // Top square
        [0, 4], [1, 5], [2, 6], [3, 7], // Vertical pillars
      ];
      const faces: number[][] = [
        [3, 2, 1, 0], // Bottom (z = -1)
        [4, 5, 6, 7], // Top (z = 1)
        [0, 1, 5, 4], // Front (y = -1)
        [1, 2, 6, 5], // Right (x = 1)
        [2, 3, 7, 6], // Back (y = 1)
        [3, 0, 4, 7], // Left (x = -1)
      ];
      return { vertices, edges, faces };
    }

    case 'pyramid': {
      // Square pyramid with square base ABCD and apex E
      const vertices = [
        { id: 'v0', label: 'A', x: -1, y: -1, z: -0.7 },
        { id: 'v1', label: 'B', x: 1, y: -1, z: -0.7 },
        { id: 'v2', label: 'C', x: 1, y: 1, z: -0.7 },
        { id: 'v3', label: 'D', x: -1, y: 1, z: -0.7 },
        { id: 'v4', label: 'E', x: 0, y: 0, z: 1.15 }, // Apex
      ];
      const edges: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 0], // Base edges
        [0, 4], [1, 4], [2, 4], [3, 4], // Slant edges to apex
      ];
      const faces: number[][] = [
        [3, 2, 1, 0], // Base
        [0, 1, 4],    // Front triangle
        [1, 2, 4],    // Right triangle
        [2, 3, 4],    // Back triangle
        [3, 0, 4],    // Left triangle
      ];
      return { vertices, edges, faces };
    }

    case 'prism': {
      // Triangular prism: bottom triangle ABC, top triangle DEF
      const vertices = [
        { id: 'v0', label: 'A', x: -1, y: -0.7, z: -1 },
        { id: 'v1', label: 'B', x: 1, y: -0.7, z: -1 },
        { id: 'v2', label: 'C', x: 0, y: 0.9, z: -1 },
        { id: 'v3', label: 'D', x: -1, y: -0.7, z: 1 },
        { id: 'v4', label: 'E', x: 1, y: -0.7, z: 1 },
        { id: 'v5', label: 'F', x: 0, y: 0.9, z: 1 },
      ];
      const edges: [number, number][] = [
        [0, 1], [1, 2], [2, 0], // Bottom triangle
        [3, 4], [4, 5], [5, 3], // Top triangle
        [0, 3], [1, 4], [2, 5], // Connecting pillars
      ];
      const faces: number[][] = [
        [2, 1, 0],    // Back triangle
        [3, 4, 5],    // Front triangle
        [0, 1, 4, 3], // Bottom rectangle
        [1, 2, 5, 4], // Right rectangle
        [2, 0, 3, 5], // Left rectangle
      ];
      return { vertices, edges, faces };
    }

    case 'cylinder': {
      const segs = 32;
      const vertices: { id: string; label?: string; x: number; y: number; z: number }[] = [];
      const edges: [number, number][] = [];
      const faces: number[][] = [];

      // Bottom ring (z = -1)
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        vertices.push({ id: `b${i}`, x: Math.cos(theta), y: Math.sin(theta), z: -1 });
      }

      // Top ring (z = 1)
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        vertices.push({ id: `t${i}`, x: Math.cos(theta), y: Math.sin(theta), z: 1 });
      }

      // Ring edges
      for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        edges.push([i, next]);
        edges.push([i + segs, next + segs]);
      }

      // Faces: bottom disc, top disc, and side mantle panels
      const bottomFace: number[] = [];
      const topFace: number[] = [];
      for (let i = 0; i < segs; i++) {
        bottomFace.push(segs - 1 - i);
        topFace.push(i + segs);
        const next = (i + 1) % segs;
        faces.push([i, next, next + segs, i + segs]);
      }
      faces.push(bottomFace);
      faces.push(topFace);

      return { vertices, edges, faces };
    }

    case 'cone': {
      const segs = 32;
      const vertices: { id: string; label?: string; x: number; y: number; z: number }[] = [];
      const edges: [number, number][] = [];
      const faces: number[][] = [];

      // Base ring (z = -0.9)
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        vertices.push({ id: `b${i}`, x: Math.cos(theta), y: Math.sin(theta), z: -0.9 });
      }

      // Apex vertex
      const apexIdx = vertices.length;
      vertices.push({ id: 'apex', x: 0, y: 0, z: 1.25 });

      // Base ring edges
      for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        edges.push([i, next]);
      }

      // Base disc face & side triangles
      const baseFace: number[] = [];
      for (let i = 0; i < segs; i++) {
        baseFace.push(segs - 1 - i);
        const next = (i + 1) % segs;
        faces.push([i, next, apexIdx]);
      }
      faces.push(baseFace);

      return { vertices, edges, faces };
    }

    case 'sphere': {
      const segs = 48;
      const vertices: { id: string; label?: string; x: number; y: number; z: number }[] = [];
      const edges: [number, number][] = [];
      const faces: number[][] = [];

      // Equator circle (in X-Y plane, z = 0)
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        vertices.push({ id: `eq_${i}`, x: Math.cos(theta), y: Math.sin(theta), z: 0 });
        edges.push([i, (i + 1) % segs]);
      }

      // Polar meridian circle (in X-Z plane, y = 0)
      const merStart = vertices.length;
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        vertices.push({ id: `mer_${i}`, x: Math.cos(theta), y: 0, z: Math.sin(theta) });
        edges.push([merStart + i, merStart + ((i + 1) % segs)]);
      }

      return { vertices, edges, faces };
    }
  }
}

/**
 * 3D Transformation: applies Euler rotation around X, Y, Z axes.
 */
export function transform3D(
  p: Point3D,
  rotXDeg: number,
  rotYDeg: number,
  rotZDeg: number,
  posX: number = 0,
  posY: number = 0,
  posZ: number = 0
): Point3D {
  const radX = (rotXDeg * Math.PI) / 180;
  const radY = (rotYDeg * Math.PI) / 180;
  const radZ = (rotZDeg * Math.PI) / 180;

  const { x, y, z } = p;

  // 1. Rotation around X axis (Pitch)
  const y1 = y * Math.cos(radX) - z * Math.sin(radX);
  const z1 = y * Math.sin(radX) + z * Math.cos(radX);
  const x1 = x;

  // 2. Rotation around Y axis (Yaw)
  const x2 = x1 * Math.cos(radY) + z1 * Math.sin(radY);
  const z2 = -x1 * Math.sin(radY) + z1 * Math.cos(radY);
  const y2 = y1;

  // 3. Rotation around Z axis (Roll)
  const x3 = x2 * Math.cos(radZ) - y2 * Math.sin(radZ);
  const y3 = x2 * Math.sin(radZ) + y2 * Math.cos(radZ);
  const z3 = z2;

  return {
    x: x3 + posX,
    y: y3 + posY,
    z: z3 + posZ,
  };
}

/**
 * Parallel (Orthographic/Axonometric) Projection.
 * Ensures opposite parallel edges in 3D remain strictly parallel in 2D without perspective distortion.
 */
export function projectTo2D(
  p3d: Point3D,
  centerX: number,
  centerY: number,
  scale: number
): { x2d: number; y2d: number; depth: number } {
  return {
    x2d: centerX + p3d.x * scale,
    y2d: centerY - p3d.y * scale, // Inverted Y for screen coordinates
    depth: p3d.z,
  };
}

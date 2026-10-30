/**
 * 3D Geometry Solid & Axis Rotation Inspector Modal
 * Clean, distortion-free mathematical solids with 3-axis rotation (X, Y, Z).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  Solid3DType,
  getSolid3DModel,
  transform3D,
  projectTo2D,
} from '../../engine/geometry3DMath';
import './SubjectModals.css';

interface Geometry3DModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
  existingShape?: ShapeObject | null;
  onUpdateExisting?: (shape: ShapeObject) => void;
  defaultSolid?: Solid3DType;
}

const SOLID_OPTIONS: { type: Solid3DType; label: string; icon: string }[] = [
  { type: 'cube', label: 'Cube (Hexahedron)', icon: '🧊' },
  { type: 'pyramid', label: 'Square Pyramid', icon: '🔺' },
  { type: 'prism', label: 'Triangular Prism', icon: '📐' },
  { type: 'cylinder', label: 'Cylinder', icon: '🛢️' },
  { type: 'cone', label: 'Right Cone', icon: '▲' },
  { type: 'sphere', label: 'Sphere', icon: '🔮' },
];

const PRESET_VIEWS = [
  { label: 'Isometric 3D', rotX: 28, rotY: 35, rotZ: 0 },
  { label: 'Front View (X-Y)', rotX: 0, rotY: 0, rotZ: 0 },
  { label: 'Top View (X-Z)', rotX: 90, rotY: 0, rotZ: 0 },
  { label: 'Side Profile (Y-Z)', rotX: 0, rotY: 90, rotZ: 0 },
  { label: 'Dimetric 45°', rotX: 15, rotY: 45, rotZ: 0 },
];

const COLOR_OPTIONS = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ffffff'];

export function Geometry3DModal({
  onClose,
  onInsertSuccess,
  existingShape,
  onUpdateExisting,
  defaultSolid = 'cube',
}: Geometry3DModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [solidType, setSolidType] = useState<Solid3DType>(
    (existingShape?.params?.solidType as Solid3DType) || defaultSolid
  );

  // 3D Axis Rotations (X-Pitch, Y-Yaw, Z-Roll)
  const [rotX, setRotX] = useState<number>(existingShape?.params?.rotX ?? 28);
  const [rotY, setRotY] = useState<number>(existingShape?.params?.rotY ?? 35);
  const [rotZ, setRotZ] = useState<number>(existingShape?.params?.rotZ ?? 0);

  const [strokeColor, setStrokeColor] = useState<string>(
    existingShape?.strokeColor || '#38bdf8'
  );
  const [fillColor] = useState<string>(
    existingShape?.fillColor || 'rgba(56, 189, 248, 0.14)'
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const currentPageIndex = docState.currentPageIndex;

  // Render 3D Canvas Preview whenever rotation or solid changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const scale = Math.min(w, h) * 0.35;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokeWidth = 2;

    if (solidType === 'sphere') {
      const r = scale;
      const grad = ctx.createRadialGradient(
        centerX - r * 0.35,
        centerY - r * 0.35,
        r * 0.1,
        centerX,
        centerY,
        r
      );
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      grad.addColorStop(0.7, 'rgba(14, 116, 144, 0.18)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();

      const drawRotatedCircle = (isMeridian: boolean) => {
        const segs = 48;
        const pts: { x2d: number; y2d: number; depth: number }[] = [];
        for (let i = 0; i <= segs; i++) {
          const theta = (i / segs) * Math.PI * 2;
          const p3d = isMeridian
            ? { x: Math.cos(theta), y: 0, z: Math.sin(theta) }
            : { x: Math.cos(theta), y: Math.sin(theta), z: 0 };
          const rot = transform3D(p3d, rotX, rotY, rotZ);
          const p2d = projectTo2D(rot, centerX, centerY, scale);
          pts.push(p2d);
        }

        for (let i = 0; i < segs; i++) {
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const avgDepth = (p1.depth + p2.depth) / 2;
          ctx.beginPath();
          if (avgDepth < 0) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
            ctx.lineWidth = 1.5;
          } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
          }
          ctx.moveTo(p1.x2d, p1.y2d);
          ctx.lineTo(p2.x2d, p2.y2d);
          ctx.stroke();
        }
      };

      drawRotatedCircle(false);
      drawRotatedCircle(true);
      ctx.restore();
      return;
    }

    if (solidType === 'cylinder') {
      const segs = 48;
      const botPts: { x2d: number; y2d: number; depth: number; nx: number; ny: number; nz: number }[] = [];
      const topPts: { x2d: number; y2d: number; depth: number; nx: number; ny: number; nz: number }[] = [];

      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const normalRot = transform3D({ x: cosT, y: sinT, z: 0 }, rotX, rotY, rotZ);

        const bRot = transform3D({ x: cosT, y: sinT, z: -1 }, rotX, rotY, rotZ);
        botPts.push({ ...projectTo2D(bRot, centerX, centerY, scale), nx: normalRot.x, ny: normalRot.y, nz: normalRot.z });

        const tRot = transform3D({ x: cosT, y: sinT, z: 1 }, rotX, rotY, rotZ);
        topPts.push({ ...projectTo2D(tRot, centerX, centerY, scale), nx: normalRot.x, ny: normalRot.y, nz: normalRot.z });
      }

      const topNorm = transform3D({ x: 0, y: 0, z: 1 }, rotX, rotY, rotZ);
      const isTopVisible = topNorm.z > 0;

      // Mantle fill
      ctx.beginPath();
      ctx.moveTo(topPts[0].x2d, topPts[0].y2d);
      for (let i = 1; i < segs; i++) ctx.lineTo(topPts[i].x2d, topPts[i].y2d);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(botPts[0].x2d, botPts[0].y2d);
      for (let i = 1; i < segs; i++) ctx.lineTo(botPts[i].x2d, botPts[i].y2d);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        const avgNz = (botPts[i].nz + botPts[next].nz) / 2;
        if (avgNz > 0) {
          ctx.beginPath();
          ctx.moveTo(botPts[i].x2d, botPts[i].y2d);
          ctx.lineTo(botPts[next].x2d, botPts[next].y2d);
          ctx.lineTo(topPts[next].x2d, topPts[next].y2d);
          ctx.lineTo(topPts[i].x2d, topPts[i].y2d);
          ctx.closePath();
          ctx.fillStyle = `rgba(56, 189, 248, ${0.12 + avgNz * 0.10})`;
          ctx.fill();
        }
      }

      const drawRim = (pts: typeof topPts, isFacingUs: boolean) => {
        for (let i = 0; i < segs; i++) {
          const next = (i + 1) % segs;
          const p1 = pts[i];
          const p2 = pts[next];
          const isBack = isFacingUs ? false : ((p1.depth + p2.depth) / 2 < topNorm.z * 0.2);

          ctx.beginPath();
          if (isBack) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
            ctx.lineWidth = 1.5;
          } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
          }
          ctx.moveTo(p1.x2d, p1.y2d);
          ctx.lineTo(p2.x2d, p2.y2d);
          ctx.stroke();
        }
      };

      drawRim(botPts, !isTopVisible);
      drawRim(topPts, isTopVisible);

      for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        if ((botPts[i].nz <= 0 && botPts[next].nz > 0) || (botPts[i].nz > 0 && botPts[next].nz <= 0)) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.moveTo(botPts[i].x2d, botPts[i].y2d);
          ctx.lineTo(topPts[i].x2d, topPts[i].y2d);
          ctx.stroke();
        }
      }

      ctx.restore();
      return;
    }

    if (solidType === 'cone') {
      const segs = 48;
      const basePts: { x2d: number; y2d: number; depth: number }[] = [];

      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        const bRot = transform3D({ x: Math.cos(theta), y: Math.sin(theta), z: -0.9 }, rotX, rotY, rotZ);
        basePts.push(projectTo2D(bRot, centerX, centerY, scale));
      }

      const apexRot = transform3D({ x: 0, y: 0, z: 1.25 }, rotX, rotY, rotZ);
      const apex2d = projectTo2D(apexRot, centerX, centerY, scale);

      const baseNorm = transform3D({ x: 0, y: 0, z: -1 }, rotX, rotY, rotZ);
      const isBaseFacingUs = baseNorm.z > 0;

      ctx.beginPath();
      ctx.moveTo(apex2d.x2d, apex2d.y2d);
      for (let i = 0; i < segs; i++) ctx.lineTo(basePts[i].x2d, basePts[i].y2d);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      if (isBaseFacingUs) {
        ctx.beginPath();
        ctx.moveTo(basePts[0].x2d, basePts[0].y2d);
        for (let i = 1; i < segs; i++) ctx.lineTo(basePts[i].x2d, basePts[i].y2d);
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.fill();
      }

      for (let i = 0; i < segs; i++) {
        const next = (i + 1) % segs;
        const p1 = basePts[i];
        const p2 = basePts[next];
        const isBack = isBaseFacingUs ? false : ((p1.depth + p2.depth) / 2 < baseNorm.z * 0.2);

        ctx.beginPath();
        if (isBack) {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
          ctx.lineWidth = 1.5;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
        }
        ctx.moveTo(p1.x2d, p1.y2d);
        ctx.lineTo(p2.x2d, p2.y2d);
        ctx.stroke();
      }

      let minCross = Infinity;
      let maxCross = -Infinity;
      let minIdx = 0;
      let maxIdx = 0;

      for (let i = 0; i < segs; i++) {
        const dx = basePts[i].x2d - apex2d.x2d;
        const dy = basePts[i].y2d - apex2d.y2d;
        const cross = dx * baseNorm.y - dy * baseNorm.x;
        if (cross < minCross) {
          minCross = cross;
          minIdx = i;
        }
        if (cross > maxCross) {
          maxCross = cross;
          maxIdx = i;
        }
      }

      ctx.setLineDash([]);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;

      ctx.beginPath();
      ctx.moveTo(apex2d.x2d, apex2d.y2d);
      ctx.lineTo(basePts[minIdx].x2d, basePts[minIdx].y2d);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(apex2d.x2d, apex2d.y2d);
      ctx.lineTo(basePts[maxIdx].x2d, basePts[maxIdx].y2d);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // Polyhedra: Cube, Pyramid, Prism
    const model = getSolid3DModel(solidType);
    const rotated3D = model.vertices.map((v) => transform3D(v, rotX, rotY, rotZ));
    const projected = rotated3D.map((p3d) => projectTo2D(p3d, centerX, centerY, scale));

    const lightVec = { x: -0.35, y: 0.55, z: 0.75 };
    const lightLen = Math.hypot(lightVec.x, lightVec.y, lightVec.z);
    const lx = lightVec.x / lightLen;
    const ly = lightVec.y / lightLen;
    const lz = lightVec.z / lightLen;

    interface FaceInfo {
      indices: number[];
      isFront: boolean;
      avgDepth: number;
      diffuse: number;
    }

    const faceInfos: FaceInfo[] = [];
    const edgeVisibility = new Array(model.edges.length).fill(false);

    for (const fIndices of model.faces) {
      if (fIndices.length < 3) continue;
      const p0 = rotated3D[fIndices[0]];
      const p1 = rotated3D[fIndices[1]];
      const p2 = rotated3D[fIndices[2]];

      const ux = p1.x - p0.x, uy = p1.y - p0.y, uz = p1.z - p0.z;
      const vx = p2.x - p0.x, vy = p2.y - p0.y, vz = p2.z - p0.z;
      const nx = uy * vz - uz * vy;
      const ny = uz * vx - ux * vz;
      const nz = ux * vy - uy * vx;
      const nLen = Math.hypot(nx, ny, nz) || 1;
      const normX = nx / nLen, normY = ny / nLen, normZ = nz / nLen;

      const isFront = normZ > 0;
      const diffuse = Math.max(0, normX * lx + normY * ly + normZ * lz);

      let avgDepth = 0;
      for (const idx of fIndices) avgDepth += rotated3D[idx].z;
      avgDepth /= fIndices.length;

      faceInfos.push({ indices: fIndices, isFront, avgDepth, diffuse });

      if (isFront) {
        for (let i = 0; i < fIndices.length; i++) {
          const i1 = fIndices[i];
          const i2 = fIndices[(i + 1) % fIndices.length];
          for (let eIdx = 0; eIdx < model.edges.length; eIdx++) {
            const [e1, e2] = model.edges[eIdx];
            if ((e1 === i1 && e2 === i2) || (e1 === i2 && e2 === i1)) {
              edgeVisibility[eIdx] = true;
            }
          }
        }
      }
    }

    const frontFaces = faceInfos.filter((f) => f.isFront).sort((a, b) => a.avgDepth - b.avgDepth);
    for (const face of frontFaces) {
      ctx.beginPath();
      const p0 = projected[face.indices[0]];
      ctx.moveTo(p0.x2d, p0.y2d);
      for (let i = 1; i < face.indices.length; i++) {
        const pt = projected[face.indices[i]];
        ctx.lineTo(pt.x2d, pt.y2d);
      }
      ctx.closePath();
      const alpha = 0.10 + face.diffuse * 0.22;
      ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.fill();
    }

    // Hidden edges dashed
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.40)';
    ctx.lineWidth = 1.5;

    for (let i = 0; i < model.edges.length; i++) {
      if (!edgeVisibility[i]) {
        const [i1, i2] = model.edges[i];
        const p1 = projected[i1];
        const p2 = projected[i2];
        ctx.beginPath();
        ctx.moveTo(p1.x2d, p1.y2d);
        ctx.lineTo(p2.x2d, p2.y2d);
        ctx.stroke();
      }
    }

    // Visible edges solid
    ctx.setLineDash([]);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    for (let i = 0; i < model.edges.length; i++) {
      if (edgeVisibility[i]) {
        const [i1, i2] = model.edges[i];
        const p1 = projected[i1];
        const p2 = projected[i2];
        ctx.beginPath();
        ctx.moveTo(p1.x2d, p1.y2d);
        ctx.lineTo(p2.x2d, p2.y2d);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [solidType, rotX, rotY, rotZ, strokeColor, fillColor]);

  // Interactive mouse / touch drag rotation on 3D canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (e.shiftKey) {
      // Shift + drag rotates around Z-axis (Roll)
      setRotZ((prev) => Math.round((prev + dx * 0.75 + 180) % 360) - 180);
    } else {
      // Horizontal drag rotates around Y-axis (Yaw)
      // Vertical drag rotates around X-axis (Pitch)
      setRotY((prev) => Math.round((prev + dx * 0.75 + 180) % 360) - 180);
      setRotX((prev) => Math.round(Math.max(-180, Math.min(180, prev - dy * 0.75))));
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleInsert = () => {
    const cleanLabel = `3D ${solidType.toUpperCase()}`;

    if (existingShape && onUpdateExisting) {
      const updated: ShapeObject = {
        ...existingShape,
        strokeColor,
        fillColor,
        label: cleanLabel,
        params: {
          ...existingShape.params,
          solidType,
          rotX,
          rotY,
          rotZ,
        },
      };
      onUpdateExisting(updated);
      onClose();
      return;
    }

    const solidObj = createShape('geometry3D', 260, 180, 320, 320, {
      strokeColor,
      strokeWidth: 2,
      fillColor,
      label: cleanLabel,
      params: {
        solidType,
        rotX,
        rotY,
        rotZ,
      },
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      solidObj,
      `Insert 3D ${solidType}`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card geometry-3d-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680 }}
      >
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🧊</span>
            <div>
              <h3>3D Geometric Solid & Axis Rotation</h3>
              <p>Distortion-Free Mathematical Solids • 3-Axis Free Rotation (X, Y, Z)</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Solid Type Selector */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
          {SOLID_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              className={`gate-pill ${solidType === opt.type ? 'active' : ''}`}
              onClick={() => setSolidType(opt.type)}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Interactive 3D Canvas Preview */}
        <div
          style={{
            position: 'relative',
            background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            marginTop: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 260,
            overflow: 'hidden',
          }}
        >
          <canvas
            ref={canvasRef}
            width={380}
            height={260}
            style={{ cursor: 'grab', touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            title="Drag with mouse or stylus to rotate in 3D (Shift+drag for roll)"
          />

          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 12,
              fontSize: 11,
              color: '#94a3b8',
              background: 'rgba(15,23,42,0.7)',
              padding: '3px 8px',
              borderRadius: 6,
              pointerEvents: 'none',
            }}
          >
            🖱️ Drag canvas to rotate freely in 3D
          </div>

          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 12,
              fontSize: 11,
              color: '#38bdf8',
              background: 'rgba(15,23,42,0.8)',
              padding: '4px 10px',
              borderRadius: 6,
              fontFamily: 'monospace',
            }}
          >
            Rotation: ({rotX}°, {rotY}°, {rotZ}°)
          </div>
        </div>

        {/* 3-Axis Rotation Sliders (X, Y, Z) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: 12,
            background: 'rgba(255,255,255,0.03)',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', marginBottom: 2 }}>
              <span><b>X-Axis (Pitch):</b> Up/Down Tilt</span>
              <b>{rotX}°</b>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotX}
              onChange={(e) => setRotX(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', marginBottom: 2 }}>
              <span><b>Y-Axis (Yaw):</b> Left/Right Turn</span>
              <b>{rotY}°</b>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotY}
              onChange={(e) => setRotY(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', marginBottom: 2 }}>
              <span><b>Z-Axis (Roll):</b> Planar Spin</span>
              <b>{rotZ}°</b>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotZ}
              onChange={(e) => setRotZ(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: '#38bdf8' }}
            />
          </div>
        </div>

        {/* Quick Orientation View Presets & Color */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Orientation Presets:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_VIEWS.map((pv) => (
                <button
                  key={pv.label}
                  type="button"
                  className="preset-pill"
                  onClick={() => {
                    setRotX(pv.rotX);
                    setRotY(pv.rotY);
                    setRotZ(pv.rotZ);
                  }}
                >
                  {pv.label}
                </button>
              ))}
              <button
                type="button"
                className="preset-pill"
                onClick={() => {
                  setRotX(0);
                  setRotY(0);
                  setRotZ(0);
                }}
                style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
              >
                Reset (0,0,0)
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Stroke Color:
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setStrokeColor(c)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: c,
                    border: strokeColor === c ? '2.5px solid #ffffff' : '1.5px solid transparent',
                    cursor: 'pointer',
                    boxShadow: strokeColor === c ? '0 0 8px ' + c : 'none',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="submodal-actions" style={{ marginTop: 16 }}>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleInsert}>
            {existingShape ? 'Update 3D Solid' : 'Insert 3D Solid on Board 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

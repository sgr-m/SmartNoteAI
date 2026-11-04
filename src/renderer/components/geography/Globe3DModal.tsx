/**
 * Interactive 3D Earth and Globe Laboratory Modal
 * Stage 6: Interactive 3D Globe, Flat-Map Unrolling, Solar Terminator,
 * Earth Science Demonstrations (Rotation, Revolution, Seasons, Timezones),
 * and Whiteboard Insertion (`geoGlobe`).
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import {
  EARTH_CONSTANTS,
  EARTH_SCIENCE_PRESETS,
  GLOBE_LOCATIONS,
  projectOrthographic,
  unprojectOrthographic,
  calculateSubsolarPoint,
  generateSolarTerminatorPoints,
  calculateLocalSolarTime,
  isPointInDaylight,
  searchGlobeLocations,
  GlobeLocation,
  EarthScienceDemoPreset,
} from '../../services/geography/globeService';
import { createDefaultGeoResourceState } from '../../services/geography/types';
import {
  DETAILED_WORLD_LANDMASSES,
  SOI_INDIA_BOUNDARY_LONLAT,
  SMOOTH_SOI_INDIA_BOUNDARY_LONLAT,
  getSmoothBoundaryPoints,
  DETAILED_INDIAN_STATES,
  getStatePolygonLonLat,
} from '../../services/geography/detailedMapData';
import {
  renderSphericalEarthTexture,
  getCachedMapImage,
} from '../../engine/geographyShapeRenderer';
import './Globe3DModal.css';

interface Globe3DModalProps {
  onClose: () => void;
  onInsertShape?: (shape: ShapeObject) => void;
  initialLocationId?: string;
}

type SidebarTab = 'demos' | 'layers' | 'locations' | 'view';

export function Globe3DModal({
  onClose,
  onInsertShape,
  initialLocationId,
}: Globe3DModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem, setToastMessage } = useAppContext();
  const currentPageIndex = docState.currentPageIndex;

  // Viewport & Layout
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('demos');
  const [projectionMode, setProjectionMode] = useState<'globe' | 'flat'>('globe');

  // Camera State
  const [centerLon, setCenterLon] = useState<number>(78.0); // Centered on India
  const [centerLat, setCenterLat] = useState<number>(20.0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [axialTilt, setAxialTilt] = useState<number>(EARTH_CONSTANTS.AXIAL_TILT_DEGREES);

  // Time & Astronomical State
  const [dayOfYear, setDayOfYear] = useState<number>(172); // Summer Solstice (June 21)
  const [utcHours, setUtcHours] = useState<number>(6.0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animSpeed, setAnimSpeed] = useState<number>(1); // 1x, 5x, 20x

  // Layer Toggles
  const [showTerminator, setShowTerminator] = useState<boolean>(true);
  const [showAtmosphere, setShowAtmosphere] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [showTropics, setShowTropics] = useState<boolean>(true);
  const [showPolarCircles, setShowPolarCircles] = useState<boolean>(true);
  const [showPrimeMeridian, setShowPrimeMeridian] = useState<boolean>(true);
  const [showCityLights, setShowCityLights] = useState<boolean>(true);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);

  // Active Demo Preset
  const [activePresetId, setActivePresetId] = useState<string>('summer-solstice');

  // Search & Selected Location
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<GlobeLocation | null>(
    initialLocationId
      ? GLOBE_LOCATIONS.find((l) => l.id === initialLocationId) || GLOBE_LOCATIONS[0]
      : GLOBE_LOCATIONS[0]
  );

  // Mouse Dragging for Orbit Control
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Filtered Locations
  const filteredLocations = useMemo(() => searchGlobeLocations(searchQuery), [searchQuery]);

  // Current Subsolar Point
  const subsolarPoint = useMemo(
    () => calculateSubsolarPoint(dayOfYear, utcHours),
    [dayOfYear, utcHours]
  );

  // Current Local Solar Time at Center
  const centerLocalTime = useMemo(
    () => calculateLocalSolarTime(centerLon, utcHours, centerLat),
    [centerLon, centerLat, utcHours]
  );

  // ─── Animation Loop (Diurnal Spin & Orbital Motion) ────────────────────────
  useEffect(() => {
    if (!isAnimating) return;

    let lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const deltaSec = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      // Advance UTC hours smoothly
      setUtcHours((prev) => (prev + deltaSec * animSpeed * 0.5) % 24);

      // If in diurnal rotation demo, also rotate camera
      if (activePresetId === 'earth-rotation-demo') {
        setCenterLon((prev) => (prev + deltaSec * animSpeed * 7.5 + 360) % 360);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAnimating, animSpeed, activePresetId]);

  // ─── Render Canvas (3D Globe or 2D Flat-Map) ──────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Deep Space Background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    // Starfield
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    const stars = [
      [0.08, 0.12], [0.85, 0.15], [0.12, 0.82], [0.88, 0.78],
      [0.22, 0.35], [0.75, 0.42], [0.45, 0.08], [0.55, 0.92],
      [0.05, 0.55], [0.92, 0.48], [0.35, 0.75], [0.65, 0.22],
    ];
    for (const [sx, sy] of stars) {
      ctx.beginPath();
      ctx.arc(sx * w, sy * h, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    if (projectionMode === 'flat') {
      // ─── 2D Flat-Map View (Unrolled Equirectangular) ───
      const mapX = 60;
      const mapY = 40;
      const mapW = w - 120;
      const mapH = h - 80;

      // World Map Image Base (Official Survey of India World Map)
      const flatImg =
        getCachedMapImage('./assets/maps/soi_world_map_en_official.jpg') ||
        getCachedMapImage('./assets/maps/soi_world_map_en.jpg') ||
        getCachedMapImage('./assets/maps/earth_globe_texture.jpg');
      let didDrawFlat = false;

      if (flatImg && flatImg.complete && flatImg.naturalWidth > 0) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(flatImg, mapX, mapY, mapW, mapH);
        ctx.restore();
        didDrawFlat = true;
      }

      if (!didDrawFlat) {
        // Ocean Base & Continental Landmasses Fallback
        ctx.fillStyle = '#082f49';
        ctx.fillRect(mapX, mapY, mapW, mapH);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(mapX, mapY, mapW, mapH);

        for (const landmass of DETAILED_WORLD_LANDMASSES) {
          ctx.beginPath();
          let first = true;
          for (const [lon, lat] of landmass.pointsLonLat) {
            const lx = mapX + ((lon + 180) / 360) * mapW;
            const ly = mapY + ((90 - lat) / 180) * mapH;
            if (first) {
              ctx.moveTo(lx, ly);
              first = false;
            } else {
              ctx.lineTo(lx, ly);
            }
          }
          ctx.closePath();
          ctx.fillStyle = '#15803d';
          ctx.fill();
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }

      // Survey of India sovereign boundary highlight
      ctx.beginPath();
      let indFirst = true;
      for (const [lon, lat] of SOI_INDIA_BOUNDARY_LONLAT) {
        const lx = mapX + ((lon + 180) / 360) * mapW;
        const ly = mapY + ((90 - lat) / 180) * mapH;
        if (indFirst) {
          ctx.moveTo(lx, ly);
          indFirst = false;
        } else {
          ctx.lineTo(lx, ly);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Graticule lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.8;
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = mapX + ((lon + 180) / 360) * mapW;
        ctx.beginPath();
        ctx.moveTo(x, mapY);
        ctx.lineTo(x, mapY + mapH);
        ctx.stroke();
      }
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = mapY + ((90 - lat) / 180) * mapH;
        ctx.beginPath();
        ctx.moveTo(mapX, y);
        ctx.lineTo(mapX + mapW, y);
        ctx.stroke();
      }

      // Equator
      const eqY = mapY + mapH / 2;
      ctx.beginPath();
      ctx.moveTo(mapX, eqY);
      ctx.lineTo(mapX + mapW, eqY);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tropics
      const tcY = mapY + ((90 - 23.44) / 180) * mapH;
      const tcapY = mapY + ((90 + 23.44) / 180) * mapH;
      for (const y of [tcY, tcapY]) {
        ctx.beginPath();
        ctx.moveTo(mapX, y);
        ctx.lineTo(mapX + mapW, y);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Locations
      for (const loc of GLOBE_LOCATIONS) {
        const lx = mapX + ((loc.lon + 180) / 360) * mapW;
        const ly = mapY + ((90 - loc.lat) / 180) * mapH;
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = selectedLocation?.id === loc.id ? '#38bdf8' : '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      return;
    }

    // ─── 3D Orthographic Spherical Globe View ───
    const cx = w / 2;
    const cy = h / 2;
    const globeRadius = Math.min(w, h) * 0.4 * zoom;

    // 1. Atmosphere Limb Glow
    if (showAtmosphere) {
      const atmosGrad = ctx.createRadialGradient(cx, cy, globeRadius * 0.96, cx, cy, globeRadius * 1.18);
      atmosGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      atmosGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.16)');
      atmosGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius * 1.18, 0, Math.PI * 2);
      ctx.fillStyle = atmosGrad;
      ctx.fill();
    }

    // 2. Axial Tilt Rod (23.44° inclined rotational axis)
    const tiltRad = (axialTilt * Math.PI) / 180;
    const axisLen = globeRadius * 1.35;
    const topX = cx + Math.sin(tiltRad) * axisLen;
    const topY = cy - Math.cos(tiltRad) * axisLen;
    const botX = cx - Math.sin(tiltRad) * axisLen;
    const botY = cy + Math.cos(tiltRad) * axisLen;

    ctx.beginPath();
    ctx.moveTo(botX, botY);
    ctx.lineTo(topX, topY);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // North Pole Badge
    ctx.beginPath();
    ctx.arc(topX, topY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('North Pole (23.44° Tilt)', topX, topY - 10);

    // 3. Globe Sphere Clipping Circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
    ctx.clip();

    // Photorealistic Earth Surface Texture Projection
    const didRenderTexture = renderSphericalEarthTexture(
      ctx,
      cx,
      cy,
      globeRadius,
      centerLon,
      centerLat,
      './assets/maps/earth_globe_texture.jpg'
    );

    if (!didRenderTexture) {
      // Deep Ocean Base Fallback
      const oceanGrad = ctx.createRadialGradient(
        cx - globeRadius * 0.25,
        cy - globeRadius * 0.25,
        globeRadius * 0.1,
        cx,
        cy,
        globeRadius
      );
      oceanGrad.addColorStop(0, '#0284c7');
      oceanGrad.addColorStop(0.65, '#0369a1');
      oceanGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(cx - globeRadius, cy - globeRadius, globeRadius * 2, globeRadius * 2);

      // 4. Continental Landmasses (Spherical Orthographic Projection Fallback)
      for (const landmass of DETAILED_WORLD_LANDMASSES) {
        const pts = landmass.pointsLonLat;
        const interpolated: [number, number][] = [];
        for (let i = 0; i < pts.length; i++) {
          const p1 = pts[i];
          const p2 = pts[(i + 1) % pts.length];
          interpolated.push(p1);
          const dLon = Math.abs(p2[0] - p1[0]);
          const dLat = Math.abs(p2[1] - p1[1]);
          const steps = Math.max(1, Math.floor(Math.hypot(dLon, dLat) / 2.5));
          for (let s = 1; s < steps; s++) {
            const f = s / steps;
            interpolated.push([
              p1[0] + (p2[0] - p1[0]) * f,
              p1[1] + (p2[1] - p1[1]) * f,
            ]);
          }
        }

        const projected = interpolated.map(([lon, lat]) =>
          projectOrthographic(lon, lat, centerLon, centerLat, globeRadius)
        );

        if (!projected.some((p) => p.visible)) continue;

        ctx.beginPath();
        let first = true;
        for (let i = 0; i < projected.length; i++) {
          const p = projected[i];
          if (p.visible) {
            if (first) {
              ctx.moveTo(cx + p.x, cy + p.y);
              first = false;
            } else {
              ctx.lineTo(cx + p.x, cy + p.y);
            }
          } else {
            const angle = Math.atan2(p.y, p.x);
            const hx = Math.cos(angle) * (globeRadius - 0.5);
            const hy = Math.sin(angle) * (globeRadius - 0.5);
            if (first) {
              ctx.moveTo(cx + hx, cy + hy);
              first = false;
            } else {
              ctx.lineTo(cx + hx, cy + hy);
            }
          }
        }
        ctx.closePath();
        ctx.fillStyle = '#166534';
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }
    }

    // Survey of India sovereign boundary highlight (Smooth, high-density crown including J&K and Ladakh)
    const indProjected = SMOOTH_SOI_INDIA_BOUNDARY_LONLAT.map(([lon, lat]) =>
      projectOrthographic(lon, lat, centerLon, centerLat, globeRadius)
    );
    if (indProjected.some((p) => p.visible)) {
      ctx.beginPath();
      let indFirst = true;
      for (let i = 0; i < indProjected.length; i++) {
        const p = indProjected[i];
        if (p.visible) {
          if (indFirst) {
            ctx.moveTo(cx + p.x, cy + p.y);
            indFirst = false;
          } else {
            ctx.lineTo(cx + p.x, cy + p.y);
          }
        } else {
          const angle = Math.atan2(p.y, p.x);
          const hx = Math.cos(angle) * (globeRadius - 0.5);
          const hy = Math.sin(angle) * (globeRadius - 0.5);
          if (indFirst) {
            ctx.moveTo(cx + hx, cy + hy);
            indFirst = false;
          } else {
            ctx.lineTo(cx + hx, cy + hy);
          }
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = Math.max(1.8, 2.5 / Math.sqrt(zoom));
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // 3.5 Detailed Country & Indian State Zoom Overlay (Smooth zoomable admin layers)
    if (zoom > 1.4) {
      // Major Country Names
      const MAJOR_COUNTRIES = [
        { name: 'India', lon: 78.9, lat: 22.5 },
        { name: 'China', lon: 104.1, lat: 35.8 },
        { name: 'Russia', lon: 95.0, lat: 61.5 },
        { name: 'United States', lon: -98.5, lat: 39.7 },
        { name: 'Brazil', lon: -51.9, lat: -14.2 },
        { name: 'Australia', lon: 133.7, lat: -25.2 },
        { name: 'Canada', lon: -106.3, lat: 56.1 },
        { name: 'United Kingdom', lon: -3.4, lat: 55.3 },
        { name: 'France', lon: 2.2, lat: 46.2 },
        { name: 'Germany', lon: 10.4, lat: 51.1 },
        { name: 'Japan', lon: 138.2, lat: 36.2 },
        { name: 'South Africa', lon: 22.9, lat: -30.5 },
        { name: 'Egypt', lon: 30.8, lat: 26.8 },
        { name: 'Saudi Arabia', lon: 45.0, lat: 23.8 },
        { name: 'Indonesia', lon: 113.9, lat: -0.7 },
      ];

      MAJOR_COUNTRIES.forEach((c) => {
        const cp = projectOrthographic(c.lon, c.lat, centerLon, centerLat, globeRadius);
        if (cp.visible) {
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.fillStyle = '#f8fafc';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'center';
          ctx.fillText(c.name, cx + cp.x, cy + cp.y);
          ctx.shadowBlur = 0;
        }
      });
    }

    // High Zoom Indian State Boundaries & Capital Markers (Smooth zoomable outlines)
    if (zoom >= 1.8 && centerLon >= 55 && centerLon <= 105 && centerLat >= 2 && centerLat <= 45) {
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(0.7, 1.2 / Math.sqrt(zoom));
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';

      // Draw all Indian state boundary polygons projected on 3D globe
      DETAILED_INDIAN_STATES.forEach((st) => {
        const polyLonLat = getStatePolygonLonLat(st);
        const smoothPoly = getSmoothBoundaryPoints(polyLonLat, 0.35);
        const proj = smoothPoly.map(([lon, lat]) =>
          projectOrthographic(lon, lat, centerLon, centerLat, globeRadius)
        );

        if (proj.some((p) => p.visible)) {
          ctx.beginPath();
          let started = false;
          for (const p of proj) {
            if (p.visible) {
              if (!started) {
                ctx.moveTo(cx + p.x, cy + p.y);
                started = true;
              } else {
                ctx.lineTo(cx + p.x, cy + p.y);
              }
            } else {
              started = false;
            }
          }
          ctx.stroke();
        }
      });
      ctx.restore();

      // State Names & Capitals
      DETAILED_INDIAN_STATES.forEach((st) => {
        const capP = projectOrthographic(st.capitalCoord[0], st.capitalCoord[1], centerLon, centerLat, globeRadius);
        if (capP.visible) {
          ctx.beginPath();
          ctx.arc(cx + capP.x, cy + capP.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 9.5px system-ui, sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'center';
          ctx.fillText(st.name, cx + capP.x, cy + capP.y - 6);

          if (zoom > 2.8) {
            ctx.font = '8px system-ui, sans-serif';
            ctx.fillStyle = '#fde047';
            ctx.fillText(`★ ${st.capital.split('/')[0]}`, cx + capP.x, cy + capP.y + 11);
          }
          ctx.shadowBlur = 0;
        }
      });
    }

    // 4. Smooth Zoomable Graticule Lines (Adaptive sub-degree step interpolation)
    if (showGraticule) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = Math.max(0.6, 0.9 / Math.sqrt(zoom));
      const latStep = Math.max(0.35, 2.0 / zoom);
      const lonStep = Math.max(0.35, 2.0 / zoom);
      const meridianInterval = zoom > 3.0 ? 15 : 30;
      const parallelInterval = zoom > 3.0 ? 15 : 30;

      for (let lon = -180; lon < 180; lon += meridianInterval) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += latStep) {
          const p = projectOrthographic(lon, lat, centerLon, centerLat, globeRadius);
          if (p.visible) {
            if (!started) {
              ctx.moveTo(cx + p.x, cy + p.y);
              started = true;
            } else {
              ctx.lineTo(cx + p.x, cy + p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      for (let lat = -75; lat <= 75; lat += parallelInterval) {
        if (lat === 0) continue;
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += lonStep) {
          const p = projectOrthographic(lon, lat, centerLon, centerLat, globeRadius);
          if (p.visible) {
            if (!started) {
              ctx.moveTo(cx + p.x, cy + p.y);
              started = true;
            } else {
              ctx.lineTo(cx + p.x, cy + p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }
    }

    // 5. Special Parallels (Smooth adaptive sub-degree curvature)
    const circleStep = Math.max(0.35, 1.5 / zoom);
    const latCircleStep = Math.max(0.35, 1.5 / zoom);

    // Equator (0°)
    ctx.beginPath();
    let eqStarted = false;
    for (let lon = -180; lon <= 180; lon += circleStep) {
      const p = projectOrthographic(lon, 0, centerLon, centerLat, globeRadius);
      if (p.visible) {
        if (!eqStarted) {
          ctx.moveTo(cx + p.x, cy + p.y);
          eqStarted = true;
        } else {
          ctx.lineTo(cx + p.x, cy + p.y);
        }
      } else {
        eqStarted = false;
      }
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = Math.max(1.5, 2.0 / Math.sqrt(zoom));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tropics (±23.44°)
    if (showTropics) {
      for (const tLat of [23.44, -23.44]) {
        ctx.beginPath();
        let trStarted = false;
        for (let lon = -180; lon <= 180; lon += circleStep) {
          const p = projectOrthographic(lon, tLat, centerLon, centerLat, globeRadius);
          if (p.visible) {
            if (!trStarted) {
              ctx.moveTo(cx + p.x, cy + p.y);
              trStarted = true;
            } else {
              ctx.lineTo(cx + p.x, cy + p.y);
            }
          } else {
            trStarted = false;
          }
        }
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = Math.max(1.0, 1.4 / Math.sqrt(zoom));
        ctx.stroke();
      }
    }

    // Polar Circles (±66.56°)
    if (showPolarCircles) {
      for (const pLat of [66.56, -66.56]) {
        ctx.beginPath();
        let pcStarted = false;
        for (let lon = -180; lon <= 180; lon += circleStep) {
          const p = projectOrthographic(lon, pLat, centerLon, centerLat, globeRadius);
          if (p.visible) {
            if (!pcStarted) {
              ctx.moveTo(cx + p.x, cy + p.y);
              pcStarted = true;
            } else {
              ctx.lineTo(cx + p.x, cy + p.y);
            }
          } else {
            pcStarted = false;
          }
        }
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = Math.max(0.8, 1.1 / Math.sqrt(zoom));
        ctx.stroke();
      }
    }

    // Prime Meridian (0°)
    if (showPrimeMeridian) {
      ctx.beginPath();
      let pmStarted = false;
      for (let lat = -90; lat <= 90; lat += latCircleStep) {
        const p = projectOrthographic(0, lat, centerLon, centerLat, globeRadius);
        if (p.visible) {
          if (!pmStarted) {
            ctx.moveTo(cx + p.x, cy + p.y);
            pmStarted = true;
          } else {
            ctx.lineTo(cx + p.x, cy + p.y);
          }
        } else {
          pmStarted = false;
        }
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // 6. Solar Terminator & Night Shading
    if (showTerminator) {
      const subsolarProj = projectOrthographic(subsolarPoint.lon, subsolarPoint.lat, centerLon, centerLat, globeRadius);
      const termPoints = generateSolarTerminatorPoints(subsolarPoint, 72);

      // Night Hemisphere Darkening Gradient
      const shadowDx = -subsolarProj.x;
      const shadowDy = -subsolarProj.y;
      const shadowDist = Math.hypot(shadowDx, shadowDy) || 1;
      const shadowGrad = ctx.createLinearGradient(
        cx + (shadowDx / shadowDist) * globeRadius * 0.15,
        cy + (shadowDy / shadowDist) * globeRadius * 0.15,
        cx + (shadowDx / shadowDist) * globeRadius,
        cy + (shadowDy / shadowDist) * globeRadius
      );
      shadowGrad.addColorStop(0, 'rgba(3, 7, 18, 0)');
      shadowGrad.addColorStop(0.4, 'rgba(3, 7, 18, 0.45)');
      shadowGrad.addColorStop(1, 'rgba(3, 7, 18, 0.85)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(cx - globeRadius, cy - globeRadius, globeRadius * 2, globeRadius * 2);

      // Terminator Line
      ctx.beginPath();
      let termStarted = false;
      for (const pt of termPoints) {
        const p = projectOrthographic(pt[0], pt[1], centerLon, centerLat, globeRadius);
        if (p.visible) {
          if (!termStarted) {
            ctx.moveTo(cx + p.x, cy + p.y);
            termStarted = true;
          } else {
            ctx.lineTo(cx + p.x, cy + p.y);
          }
        } else {
          termStarted = false;
        }
      }
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // City Lights in Nocturnal Shadow
      if (showCityLights) {
        ctx.fillStyle = '#fef08a';
        for (const loc of GLOBE_LOCATIONS) {
          const p = projectOrthographic(loc.lon, loc.lat, centerLon, centerLat, globeRadius);
          if (p.visible) {
            const inDaylight = isPointInDaylight(loc.lon, loc.lat, subsolarPoint);
            if (!inDaylight) {
              ctx.beginPath();
              ctx.arc(cx + p.x, cy + p.y, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // 7. Geographic Landmarks & Selected Pin
    if (showLandmarks) {
      for (const loc of GLOBE_LOCATIONS) {
        const p = projectOrthographic(loc.lon, loc.lat, centerLon, centerLat, globeRadius);
        if (p.visible && p.depth > 0.15) {
          const isSelected = selectedLocation?.id === loc.id;
          ctx.beginPath();
          ctx.arc(cx + p.x, cy + p.y, isSelected ? 5.5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#38bdf8' : '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          if (isSelected || p.depth > 0.4) {
            ctx.font = isSelected ? 'bold 11px system-ui, sans-serif' : '9px system-ui, sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'left';
            ctx.fillText(loc.name, cx + p.x + 6, cy + p.y + 3);
          }
        }
      }
    }

    ctx.restore(); // End globe clip

    // Globe Rim Ring
    ctx.beginPath();
    ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.0;
    ctx.stroke();
  }, [
    centerLon,
    centerLat,
    zoom,
    axialTilt,
    dayOfYear,
    utcHours,
    projectionMode,
    showTerminator,
    showAtmosphere,
    showGraticule,
    showTropics,
    showPolarCircles,
    showPrimeMeridian,
    showCityLights,
    showLandmarks,
    subsolarPoint,
    selectedLocation,
  ]);

  useEffect(() => {
    renderCanvas();
    const handleSmartboardRedraw = () => {
      renderCanvas();
    };
    window.addEventListener('smartboard:redraw', handleSmartboardRedraw);
    return () => window.removeEventListener('smartboard:redraw', handleSmartboardRedraw);
  }, [renderCanvas]);

  const handleExportGlobePng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `smartboard_earth_${projectionMode}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToastMessage?.(`Exported ${projectionMode === 'globe' ? '3D Globe' : '2D Flat-Map'} view (PNG)`);
    } catch (err) {
      console.warn('Failed to export globe image:', err);
    }
  };

  const handleDownloadMasterAsset = () => {
    try {
      const isFlat = projectionMode === 'flat';
      const fileName = isFlat ? 'soi_world_map_en_official.jpg' : 'earth_globe_texture.jpg';
      const a = document.createElement('a');
      a.href = `./assets/maps/${fileName}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToastMessage?.(`Downloading official ${isFlat ? 'Survey of India World Map' : 'Earth Photorealistic Texture'}`);
    } catch (err) {
      console.warn('Failed to download master map asset:', err);
    }
  };

  // ─── Pointer Event Handlers for 3D Orbit Dragging ─────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !lastMousePos.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // Update longitude and latitude
    setCenterLon((prev) => (prev - dx * 0.4 + 540) % 360 - 180);
    setCenterLat((prev) => Math.max(-85, Math.min(85, prev + dy * 0.4)));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    lastMousePos.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(0.6, Math.min(10.0, prev * factor)));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(10.0, prev * 1.3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.6, prev * 0.77));
  };

  // ─── Select Preset Demo ───────────────────────────────────────────────────
  const handleSelectPreset = (preset: EarthScienceDemoPreset) => {
    setActivePresetId(preset.id);
    setDayOfYear(preset.dayOfYear);
    setUtcHours(preset.utcHours);
  };

  // ─── Select Location ──────────────────────────────────────────────────────
  const handleSelectLocation = (loc: GlobeLocation) => {
    setSelectedLocation(loc);
    setCenterLon(loc.lon);
    setCenterLat(loc.lat);
  };

  // ─── Reset Camera ─────────────────────────────────────────────────────────
  const handleResetCamera = () => {
    setCenterLon(78.0);
    setCenterLat(20.0);
    setZoom(1.0);
  };

  // ─── Whiteboard Insertion ─────────────────────────────────────────────────
  const handleInsertGlobeOnBoard = () => {
    const shape = createShape('geoGlobe', 180, 120, 680, 520, {
      label: '3D Virtual Globe',
      params: {
        ...createDefaultGeoResourceState('3d-globe-virtual', '3D Virtual Globe'),
        resourceType: '3d-globe',
        title: '3D Interactive Earth & Globe',
        globeState: {
          centerLon,
          centerLat,
          zoom,
          axialTilt,
          dayOfYear,
          timeOfDayHours: utcHours,
          projectionMode,
          demoMode: activePresetId as any,
          animating: false,
          animSpeed,
          showTerminator,
          showAtmosphere,
          showGraticule,
          showTropics,
          showPolarCircles,
          showTimeZones: true,
          showCityLights,
          selectedLocation: selectedLocation
            ? {
                name: selectedLocation.name,
                lat: selectedLocation.lat,
                lon: selectedLocation.lon,
                country: selectedLocation.country,
                description: selectedLocation.description,
              }
            : undefined,
        },
        attribution: 'Survey of India compliant boundary depiction for Indian territory.',
      },
      strokeColor: '#38bdf8',
      strokeWidth: 2,
      fillColor: 'transparent',
      fillOpacity: 0,
    });

    if (onInsertShape) {
      onInsertShape(shape);
    } else {
      executeAddObject(
        { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem, viewportCenter: { x: 300, y: 240 } },
        shape,
        'Insert 3D Virtual Globe'
      );
    }

    setToastMessage('Inserted 3D Virtual Globe onto Whiteboard');
    onClose();
  };

  return (
    <div className="globe-modal-overlay" onClick={onClose}>
      <div
        className={`globe-container ${isFullscreen ? 'fullscreen' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="globe-header">
          <div className="globe-title-group">
            <span className="globe-title-icon">🌐</span>
            <div className="globe-title-text">
              <h2>
                3D Earth & Globe Laboratory
                <span className="globe-badge">Stage 6</span>
              </h2>
              <p className="globe-subtitle">
                Spherical Orthographic Projection, Solar Terminator, Motions of the Earth & Timezones
              </p>
            </div>
          </div>

          {/* View & Navigation Tabs */}
          <div className="globe-tabs">
            <button
              className={`globe-tab-btn ${sidebarTab === 'demos' ? 'active' : ''}`}
              onClick={() => setSidebarTab('demos')}
            >
              🪐 Motions & Seasons
            </button>
            <button
              className={`globe-tab-btn ${sidebarTab === 'layers' ? 'active' : ''}`}
              onClick={() => setSidebarTab('layers')}
            >
              🗺️ Layers & Graticule
            </button>
            <button
              className={`globe-tab-btn ${sidebarTab === 'locations' ? 'active' : ''}`}
              onClick={() => setSidebarTab('locations')}
            >
              📍 Locations ({GLOBE_LOCATIONS.length})
            </button>
            <button
              className={`globe-tab-btn ${sidebarTab === 'view' ? 'active' : ''}`}
              onClick={() => setSidebarTab('view')}
            >
              📐 Globe vs Flat
            </button>
          </div>

          {/* Header Action Buttons */}
          <div className="globe-header-actions">
            <button
              className="globe-btn globe-btn-ghost"
              onClick={handleExportGlobePng}
              title="Export high-resolution PNG image of current view"
            >
              📷 Export PNG
            </button>
            <button
              className="globe-btn globe-btn-ghost"
              onClick={handleDownloadMasterAsset}
              title="Download master offline Earth texture / World map"
            >
              ⬇ Map Asset
            </button>
            <button
              className="globe-btn globe-btn-primary"
              onClick={handleInsertGlobeOnBoard}
              title="Insert 3D Globe into Whiteboard as Persistent Object"
            >
              📥 Insert on Board
            </button>
            <button
              className="globe-btn globe-btn-ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? '🗗' : '⛶'}
            </button>
            <button className="globe-btn globe-btn-ghost" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* ── Modal Body ── */}
        <div className="globe-body">
          {/* Main 3D Viewport */}
          <div className="globe-viewport-container">
            {/* Top Floating Coordinates HUD */}
            <div className="globe-floating-controls">
              <span className="globe-hud-text">
                Center: {Math.abs(centerLat).toFixed(1)}°{centerLat >= 0 ? 'N' : 'S'},{' '}
                {Math.abs(centerLon).toFixed(1)}°{centerLon >= 0 ? 'E' : 'W'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span className="globe-hud-text">
                Solar Time: {centerLocalTime.localTimeFormatted} ({centerLocalTime.timezoneBand})
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
              <span className="globe-hud-text">Declination: {subsolarPoint.lat.toFixed(1)}°</span>
              <button
                className="globe-btn globe-btn-ghost"
                style={{ padding: '3px 8px', fontSize: '11px' }}
                onClick={handleResetCamera}
                title="Reset Camera to India"
              >
                ↺ Center India
              </button>
            </div>

            {/* Interactive Canvas */}
            <div className={`globe-canvas-wrapper ${isDragging ? 'dragging' : ''}`} style={{ position: 'relative' }}>
              <canvas
                ref={canvasRef}
                width={920}
                height={640}
                className="globe-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
              />

              {/* On-screen Zoom & Camera Navigation Bar (Google Earth Style - Requirement 6) */}
              <div
                className="globe-zoom-controls"
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  zIndex: 25,
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '6px',
                  borderRadius: '10px',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                }}
              >
                <button
                  onClick={handleZoomIn}
                  title="Zoom In (Inspect Countries & Indian States)"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.2)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  -
                </button>
                <button
                  onClick={handleResetCamera}
                  title="Reset to India View"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ↺
                </button>
                <span style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', marginTop: '1px' }}>
                  {zoom.toFixed(1)}x
                </span>
              </div>
            </div>

            {/* Bottom Floating Animation Controls */}
            <div className="globe-animation-controls">
              <div className="anim-group">
                <button
                  className="globe-btn globe-btn-amber"
                  onClick={() => setIsAnimating(!isAnimating)}
                >
                  {isAnimating ? '⏸ Pause' : '▶ Play Rotation'}
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[1, 5, 20].map((spd) => (
                    <button
                      key={spd}
                      className={`globe-btn ${animSpeed === spd ? 'globe-btn-primary' : 'globe-btn-ghost'}`}
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => setAnimSpeed(spd)}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="anim-group">
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>UTC Hour:</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={0.25}
                  value={utcHours}
                  onChange={(e) => setUtcHours(Number(e.target.value))}
                  className="anim-slider"
                />
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#38bdf8' }}>
                  {Math.floor(utcHours)}:{Math.floor((utcHours % 1) * 60).toString().padStart(2, '0')} UTC
                </span>
              </div>

              <div className="anim-group">
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Day of Year:</span>
                <input
                  type="range"
                  min={1}
                  max={365}
                  value={dayOfYear}
                  onChange={(e) => setDayOfYear(Number(e.target.value))}
                  className="anim-slider"
                />
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#fde68a' }}>
                  Day {dayOfYear}
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar Drawer */}
          <div className="globe-sidebar">
            {/* Tab 1: Earth Science Demonstrations */}
            {sidebarTab === 'demos' && (
              <>
                <div className="sidebar-tab-header">
                  <span>Motions of the Earth & Seasons</span>
                  <span className="globe-badge">Demonstrations</span>
                </div>
                <div className="sidebar-content">
                  {EARTH_SCIENCE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className={`preset-card ${activePresetId === preset.id ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(preset)}
                    >
                      <div className="preset-card-title">{preset.name}</div>
                      <div className="preset-card-meta">
                        {preset.dateString} • Declination: {preset.solarDeclinationText}
                      </div>
                      <div className="preset-card-desc">{preset.pedagogicalExplanation}</div>
                      <div className="preset-card-curriculum">{preset.cbseIcseFocus}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Tab 2: Geographic Layers */}
            {sidebarTab === 'layers' && (
              <>
                <div className="sidebar-tab-header">
                  <span>Geographic Layers & Graticule</span>
                  <span className="globe-badge">Cartography</span>
                </div>
                <div className="sidebar-content">
                  <div className="layer-checkbox-group">
                    <label className="layer-checkbox-item">
                      <span>Equator (0° Latitude)</span>
                      <input type="checkbox" checked={true} disabled />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Tropics (Cancer & Capricorn ±23.44°)</span>
                      <input
                        type="checkbox"
                        checked={showTropics}
                        onChange={(e) => setShowTropics(e.target.checked)}
                      />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Polar Circles (Arctic & Antarctic ±66.56°)</span>
                      <input
                        type="checkbox"
                        checked={showPolarCircles}
                        onChange={(e) => setShowPolarCircles(e.target.checked)}
                      />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Prime Meridian (0° Longitude)</span>
                      <input
                        type="checkbox"
                        checked={showPrimeMeridian}
                        onChange={(e) => setShowPrimeMeridian(e.target.checked)}
                      />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Solar Day/Night Terminator</span>
                      <input
                        type="checkbox"
                        checked={showTerminator}
                        onChange={(e) => setShowTerminator(e.target.checked)}
                      />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Rayleigh Atmosphere Glow</span>
                      <input
                        type="checkbox"
                        checked={showAtmosphere}
                        onChange={(e) => setShowAtmosphere(e.target.checked)}
                      />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Night City Lights</span>
                      <input
                        type="checkbox"
                        checked={showCityLights}
                        onChange={(e) => setShowCityLights(e.target.checked)}
                      />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Latitude / Longitude Graticule</span>
                      <input
                        type="checkbox"
                        checked={showGraticule}
                        onChange={(e) => setShowGraticule(e.target.checked)}
                      />
                    </label>
                    <label className="layer-checkbox-item">
                      <span>Geographic Landmarks</span>
                      <input
                        type="checkbox"
                        checked={showLandmarks}
                        onChange={(e) => setShowLandmarks(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Tab 3: Searchable Locations */}
            {sidebarTab === 'locations' && (
              <>
                <div className="sidebar-tab-header">
                  <span>Geographic Locations ({GLOBE_LOCATIONS.length})</span>
                </div>
                <div className="sidebar-content">
                  <input
                    type="text"
                    placeholder="Search cities, peaks, rivers, capes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="location-search-input"
                  />
                  <div className="location-list">
                    {filteredLocations.map((loc) => (
                      <div
                        key={loc.id}
                        className={`location-item ${selectedLocation?.id === loc.id ? 'active' : ''}`}
                        onClick={() => handleSelectLocation(loc)}
                      >
                        <div className="location-item-title">
                          <span>{loc.name}</span>
                          <span style={{ fontSize: '10px', color: '#38bdf8' }}>{loc.category}</span>
                        </div>
                        <div className="location-item-coords">
                          {Math.abs(loc.lat).toFixed(2)}°{loc.lat >= 0 ? 'N' : 'S'},{' '}
                          {Math.abs(loc.lon).toFixed(2)}°{loc.lon >= 0 ? 'E' : 'W'}
                          {loc.elevationM ? ` • ${loc.elevationM}m` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Tab 4: Projection View Switcher */}
            {sidebarTab === 'view' && (
              <>
                <div className="sidebar-tab-header">
                  <span>Projection & Camera</span>
                </div>
                <div className="sidebar-content">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      className={`globe-btn ${projectionMode === 'globe' ? 'globe-btn-primary' : 'globe-btn-ghost'}`}
                      onClick={() => setProjectionMode('globe')}
                    >
                      🌐 3D Spherical Globe
                    </button>
                    <button
                      className={`globe-btn ${projectionMode === 'flat' ? 'globe-btn-primary' : 'globe-btn-ghost'}`}
                      onClick={() => setProjectionMode('flat')}
                    >
                      🗺️ 2D Unrolled Flat-Map
                    </button>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Axial Obliquity Tilt:</span>
                    <input
                      type="range"
                      min={0}
                      max={45}
                      step={0.5}
                      value={axialTilt}
                      onChange={(e) => setAxialTilt(Number(e.target.value))}
                      className="anim-slider"
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8' }}>
                      {axialTilt.toFixed(2)}° (Earth Standard = 23.44°)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


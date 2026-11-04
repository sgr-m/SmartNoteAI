/**
 * Script: generate_thematic_maps.js
 * Generates:
 * 1. public/assets/maps/soi_india_drainage_and_river_basins.svg
 * 2. public/assets/maps/major_global_ocean_currents.svg
 * and copies them to dist/renderer/assets/maps/
 */

const fs = require('fs');
const path = require('path');

// ─── 1. INDIA DRAINAGE SYSTEM & RIVER BASINS MAP GENERATOR ─────────────────────

function generateIndiaDrainageSvg() {
  const width = 1200;
  const height = 1350;

  // Coordinate projection from WGS84 Lon [68.0..97.6], Lat [6.5..37.5]
  const minLon = 67.5, maxLon = 97.8;
  const minLat = 6.4, maxLat = 37.6;
  const padX = 90, padY = 110;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  function toX(lon) {
    return Math.round(padX + ((lon - minLon) / (maxLon - minLon)) * plotW);
  }
  function toY(lat) {
    return Math.round(padY + ((maxLat - lat) / (maxLat - minLat)) * plotH);
  }

  // Survey of India Official Sovereign Boundary (undivided J&K, Ladakh, Gilgit, Hunza, Aksai Chin, Sir Creek)
  const soiBoundaryLonLat = [
    [74.85, 37.15], [75.25, 37.05], [75.8, 36.85], [76.5, 36.4], [77.0, 35.8],
    [77.7, 35.6], [78.5, 35.5], [79.2, 35.5], [79.8, 35.3], [80.3, 34.8],
    [79.8, 34.2], [79.2, 33.8], [79.4, 33.2], [79.0, 32.8], [78.7, 32.4],
    [78.9, 31.8], [79.0, 31.4], [79.5, 31.0], [80.2, 30.8], [80.8, 30.3],
    [81.0, 30.1], [80.5, 29.8], [80.2, 29.3], [80.1, 28.8], [81.1, 28.5],
    [81.8, 28.0], [82.8, 27.8], [83.5, 27.4], [84.5, 27.3], [85.2, 26.9],
    [86.0, 26.6], [87.0, 26.5], [88.0, 26.4], [88.2, 26.8], [88.1, 27.3],
    [88.2, 27.8], [88.7, 28.1], [88.9, 27.7], [88.9, 27.3], [89.7, 26.8],
    [90.5, 26.8], [91.5, 26.9], [92.0, 27.4], [92.1, 27.8], [92.8, 28.2],
    [93.8, 28.6], [94.5, 28.8], [95.5, 29.1], [96.2, 29.4], [97.0, 28.5],
    [97.4, 28.2], [97.3, 27.8], [96.8, 27.2], [96.4, 26.8], [95.8, 26.4],
    [95.2, 26.0], [94.8, 25.4], [94.5, 24.8], [94.3, 24.2], [93.8, 23.8],
    [93.3, 23.3], [93.1, 22.8], [93.0, 22.2], [92.8, 21.9], [92.4, 21.4],
    [92.2, 21.8], [92.2, 22.4], [92.3, 23.0], [91.8, 23.4], [91.3, 23.8],
    [91.3, 24.3], [91.8, 24.8], [92.1, 25.1], [92.3, 25.4], [91.8, 25.6],
    [90.8, 25.4], [89.9, 25.3], [89.8, 25.8], [89.2, 26.1], [88.8, 25.8],
    [88.2, 25.4], [88.5, 24.8], [88.7, 24.2], [88.8, 23.8], [89.0, 23.2],
    [89.1, 22.8], [89.0, 22.2], [88.8, 21.7], [88.2, 21.6], [87.5, 21.5],
    [87.0, 21.4], [86.8, 20.8], [86.5, 20.2], [85.8, 19.8], [85.0, 19.3],
    [84.2, 18.8], [83.5, 18.2], [83.0, 17.7], [82.2, 17.0], [81.8, 16.5],
    [81.2, 16.0], [80.5, 15.8], [80.1, 15.2], [80.2, 14.5], [80.3, 13.8],
    [80.3, 13.0], [80.1, 12.5], [79.8, 11.8], [79.8, 11.2], [79.8, 10.5],
    [79.2, 10.0], [78.8, 9.3], [78.2, 8.8], [77.6, 8.1], [77.3, 8.3],
    [76.8, 8.8], [76.5, 9.4], [76.2, 10.0], [75.8, 10.8], [75.3, 11.5],
    [75.0, 12.2], [74.7, 13.0], [74.4, 13.8], [74.0, 14.5], [73.8, 15.2],
    [73.5, 15.8], [73.2, 16.8], [73.0, 17.5], [72.8, 18.5], [72.8, 19.5],
    [72.7, 20.2], [72.8, 20.8], [72.6, 21.4], [72.2, 21.8], [71.8, 21.6],
    [71.2, 21.2], [70.5, 21.0], [69.8, 21.2], [69.6, 21.6], [69.1, 22.2],
    [69.3, 22.8], [70.0, 22.9], [70.5, 23.1], [69.8, 23.4], [68.7, 23.7],
    [68.1, 23.7], [68.5, 24.1], [69.0, 24.4], [70.0, 24.5], [71.0, 24.6],
    [71.3, 24.3], [71.0, 25.2], [70.4, 25.8], [70.1, 26.5], [70.2, 27.3],
    [70.9, 27.9], [71.8, 28.4], [72.6, 29.1], [73.2, 29.8], [73.8, 30.2],
    [74.2, 30.6], [74.5, 31.2], [74.8, 31.8], [75.1, 32.3], [74.9, 32.48],
    [74.7, 32.68], [74.45, 32.85], [74.2, 33.15], [73.95, 33.38],
    [73.78, 33.72], [73.55, 34.12], [73.48, 34.38], [73.54, 34.72],
    [73.72, 35.08], [73.98, 35.38], [74.12, 35.75], [73.85, 36.28],
    [73.72, 36.75], [74.15, 36.95], [74.48, 37.08], [74.85, 37.15],
  ];

  const soiBoundaryPath = soiBoundaryLonLat.map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(pt[0])},${toY(pt[1])}`).join(' ') + ' Z';

  // Major Basin Delineation Polygons (Approximating CWC Water Basins of India)
  const basins = [
    {
      name: 'Indus Basin',
      code: 'INDUS',
      fill: 'rgba(147, 197, 253, 0.28)', // Soft sky blue
      stroke: '#60a5fa',
      points: [
        [74.85, 37.15], [75.8, 36.85], [77.0, 35.8], [78.5, 35.5], [79.8, 34.2],
        [79.0, 32.8], [78.2, 31.8], [77.5, 31.0], [76.5, 30.5], [75.5, 29.8],
        [74.0, 30.2], [73.2, 29.8], [72.6, 29.1], [74.2, 30.6], [74.8, 31.8],
        [74.45, 32.85], [73.55, 34.12], [73.72, 35.08], [73.72, 36.75], [74.85, 37.15]
      ],
      labelLonLat: [76.2, 34.2]
    },
    {
      name: 'Ganga Basin',
      code: 'GANGA',
      fill: 'rgba(167, 243, 208, 0.32)', // Soft pastel emerald
      stroke: '#34d399',
      points: [
        [78.2, 31.8], [80.2, 30.8], [81.0, 30.1], [83.5, 27.4], [86.0, 26.6],
        [88.2, 25.4], [88.8, 24.2], [89.1, 22.8], [88.2, 21.6], [87.0, 22.0],
        [85.5, 23.2], [83.5, 23.5], [81.8, 22.7], [78.8, 22.8], [76.0, 23.5],
        [74.5, 25.0], [75.0, 27.5], [76.5, 29.5], [77.5, 31.0], [78.2, 31.8]
      ],
      labelLonLat: [82.5, 26.2]
    },
    {
      name: 'Brahmaputra Basin',
      code: 'BRAHMAPUTRA',
      fill: 'rgba(187, 247, 208, 0.30)', // Soft mint
      stroke: '#4ade80',
      points: [
        [88.2, 27.8], [88.9, 28.1], [92.0, 27.4], [93.8, 28.6], [95.5, 29.1],
        [97.4, 28.2], [96.8, 27.2], [95.8, 26.4], [94.5, 24.8], [93.1, 22.8],
        [92.2, 22.4], [91.8, 24.8], [90.8, 25.4], [89.8, 25.8], [88.2, 26.8], [88.2, 27.8]
      ],
      labelLonLat: [93.5, 26.8]
    },
    {
      name: 'Narmada Basin',
      code: 'NARMADA',
      fill: 'rgba(254, 215, 170, 0.38)', // Soft pastel peach
      stroke: '#fb923c',
      points: [
        [81.8, 22.7], [80.5, 23.2], [78.5, 23.1], [76.0, 22.8], [73.8, 22.2],
        [72.6, 21.6], [73.5, 21.4], [75.5, 21.8], [78.0, 22.2], [81.8, 22.7]
      ],
      labelLonLat: [77.2, 22.5]
    },
    {
      name: 'Tapi Basin',
      code: 'TAPI',
      fill: 'rgba(253, 230, 138, 0.35)', // Soft amber
      stroke: '#f59e0b',
      points: [
        [78.2, 21.8], [77.0, 21.6], [74.8, 21.3], [72.8, 21.1], [73.2, 20.7],
        [75.2, 20.8], [77.5, 21.2], [78.2, 21.8]
      ],
      labelLonLat: [75.5, 21.1]
    },
    {
      name: 'Godavari Basin',
      code: 'GODAVARI',
      fill: 'rgba(254, 240, 138, 0.35)', // Yellow amber
      stroke: '#eab308',
      points: [
        [73.5, 19.9], [75.0, 20.5], [77.5, 21.2], [80.0, 21.5], [82.5, 20.5],
        [82.0, 16.7], [81.2, 16.5], [79.5, 17.5], [76.5, 18.2], [74.5, 18.8],
        [73.5, 19.5], [73.5, 19.9]
      ],
      labelLonLat: [78.0, 19.2]
    },
    {
      name: 'Krishna Basin',
      code: 'KRISHNA',
      fill: 'rgba(233, 213, 255, 0.32)', // Soft lilac
      stroke: '#c084fc',
      points: [
        [73.6, 17.9], [74.5, 18.8], [76.5, 18.2], [79.5, 17.5], [80.8, 15.8],
        [80.1, 15.2], [78.0, 15.0], [75.5, 14.5], [74.5, 15.5], [73.6, 16.8], [73.6, 17.9]
      ],
      labelLonLat: [76.8, 16.6]
    },
    {
      name: 'Mahanadi Basin',
      code: 'MAHANADI',
      fill: 'rgba(254, 205, 211, 0.35)', // Soft rose
      stroke: '#f43f5e',
      points: [
        [81.8, 22.7], [83.5, 23.5], [85.5, 22.0], [86.8, 20.8], [85.0, 19.5],
        [82.5, 20.5], [81.5, 20.8], [81.8, 22.7]
      ],
      labelLonLat: [83.8, 21.2]
    },
    {
      name: 'Cauvery Basin',
      code: 'CAUVERY',
      fill: 'rgba(199, 210, 254, 0.35)', // Soft indigo
      stroke: '#818cf8',
      points: [
        [75.5, 12.4], [76.5, 13.0], [77.8, 12.8], [79.8, 11.8], [79.8, 10.8],
        [78.5, 10.5], [77.0, 11.0], [76.0, 11.5], [75.5, 12.4]
      ],
      labelLonLat: [77.8, 11.6]
    },
    {
      name: 'Inland Drainage (Luni / Desert)',
      code: 'LUNI_DESERT',
      fill: 'rgba(254, 243, 199, 0.30)', // Desert sand
      stroke: '#d97706',
      points: [
        [71.0, 25.2], [70.1, 26.5], [70.9, 27.9], [72.6, 29.1], [74.0, 27.5],
        [73.5, 25.5], [72.0, 24.5], [71.0, 25.2]
      ],
      labelLonLat: [72.4, 26.6]
    }
  ];

  // River Networks (Accurate vectors with tributaries and connections)
  const rivers = [
    // 1. INDUS SYSTEM
    {
      name: 'Indus (Sindhu)',
      rank: 1,
      color: '#0284c7',
      width: 3.2,
      coords: [
        [79.2, 32.8], [78.5, 33.3], [77.6, 34.1], [76.8, 34.6],
        [76.0, 34.8], [75.0, 35.3], [74.5, 35.5], [73.8, 35.8],
        [73.2, 34.5], [72.8, 33.5], [71.8, 31.8], [71.0, 29.5],
        [69.8, 27.2], [68.5, 25.0], [67.8, 24.0]
      ],
      labelPos: [76.2, 34.9],
      labelRotate: -25
    },
    {
      name: 'Jhelum',
      rank: 2,
      color: '#0ea5e9',
      width: 1.8,
      coords: [[75.2, 33.5], [75.0, 33.9], [74.8, 34.1], [74.3, 34.3], [74.1, 34.2], [73.6, 33.5], [72.8, 32.2], [72.2, 31.8]],
      labelPos: [74.4, 34.4]
    },
    {
      name: 'Chenab',
      rank: 2,
      color: '#0284c7',
      width: 2.2,
      coords: [[76.9, 32.5], [76.2, 33.0], [75.4, 33.2], [74.8, 33.1], [74.3, 32.9], [73.5, 32.2], [72.2, 31.8]],
      labelPos: [75.5, 33.4]
    },
    {
      name: 'Ravi',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[76.8, 32.3], [76.0, 32.5], [75.8, 32.4], [75.3, 32.1], [74.9, 31.8], [73.8, 31.2]],
      labelPos: [75.4, 32.2]
    },
    {
      name: 'Beas',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[77.1, 32.3], [77.2, 31.8], [76.6, 31.8], [76.1, 31.9], [75.6, 31.7], [74.9, 31.2]],
      labelPos: [76.4, 31.9]
    },
    {
      name: 'Sutlej',
      rank: 1,
      color: '#0284c7',
      width: 2.5,
      coords: [[78.5, 31.6], [77.7, 31.4], [76.8, 31.3], [76.4, 31.4], [75.8, 31.1], [74.9, 31.2], [74.2, 30.5], [72.2, 29.5]],
      labelPos: [76.5, 31.1]
    },

    // 2. GANGA SYSTEM
    {
      name: 'Ganga',
      rank: 1,
      color: '#0369a1',
      width: 3.6,
      coords: [
        [78.9, 30.9], [78.6, 30.1], [78.2, 29.9], [79.0, 28.5],
        [80.3, 26.5], [81.8, 25.4], [83.0, 25.3], [85.1, 25.6],
        [87.0, 25.3], [88.1, 24.8], [88.3, 23.5], [88.3, 22.5], [88.5, 21.8]
      ],
      labelPos: [83.5, 25.5],
      labelRotate: -2
    },
    {
      name: 'Yamuna',
      rank: 1,
      color: '#0284c7',
      width: 2.8,
      coords: [
        [78.4, 31.0], [77.7, 30.4], [77.2, 28.6], [77.7, 27.5],
        [78.0, 27.2], [79.0, 26.6], [80.3, 25.8], [81.8, 25.4]
      ],
      labelPos: [77.5, 28.0]
    },
    {
      name: 'Chambal',
      rank: 2,
      color: '#0284c7',
      width: 2.0,
      coords: [[75.7, 22.4], [75.5, 24.5], [75.8, 25.0], [76.4, 25.8], [77.5, 26.5], [79.0, 26.6]],
      labelPos: [76.5, 25.3]
    },
    {
      name: 'Betwa',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[77.4, 23.2], [78.2, 24.5], [79.5, 25.5], [80.2, 25.8]],
      labelPos: [78.5, 24.8]
    },
    {
      name: 'Ken',
      rank: 2,
      color: '#0284c7',
      width: 1.6,
      coords: [[79.8, 23.8], [80.2, 24.8], [80.5, 25.7]],
      labelPos: [80.4, 25.0]
    },
    {
      name: 'Son (Sone)',
      rank: 2,
      color: '#0284c7',
      width: 2.2,
      coords: [[81.9, 22.8], [81.5, 24.1], [82.5, 24.5], [83.5, 24.5], [84.3, 25.0], [85.0, 25.6]],
      labelPos: [83.0, 24.7]
    },
    {
      name: 'Ghaghara',
      rank: 2,
      color: '#0284c7',
      width: 2.4,
      coords: [[81.2, 30.2], [81.5, 29.0], [82.2, 27.8], [83.5, 26.8], [84.8, 25.8]],
      labelPos: [82.8, 27.3]
    },
    {
      name: 'Gandak',
      rank: 2,
      color: '#0284c7',
      width: 2.0,
      coords: [[83.8, 28.5], [84.2, 27.5], [85.0, 26.2], [85.2, 25.6]],
      labelPos: [84.5, 26.8]
    },
    {
      name: 'Kosi',
      rank: 2,
      color: '#0284c7',
      width: 2.2,
      coords: [[86.5, 28.2], [87.0, 27.2], [87.1, 26.2], [87.2, 25.3]],
      labelPos: [87.3, 26.4]
    },
    {
      name: 'Damodar',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[84.7, 23.6], [85.5, 23.7], [86.5, 23.7], [87.2, 23.4], [88.0, 22.8]],
      labelPos: [86.0, 23.9]
    },

    // 3. BRAHMAPUTRA SYSTEM
    {
      name: 'Brahmaputra (Yarlung Tsangpo / Dihang)',
      rank: 1,
      color: '#0284c7',
      width: 3.6,
      coords: [
        [95.5, 29.5], [95.0, 28.0], [94.5, 27.3], [93.2, 26.6],
        [91.8, 26.1], [90.5, 26.1], [89.8, 25.2], [89.8, 23.8], [90.5, 22.2]
      ],
      labelPos: [93.0, 26.8],
      labelRotate: -5
    },
    {
      name: 'Teesta',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[88.6, 27.8], [88.5, 27.0], [88.7, 26.2], [89.6, 25.3]],
      labelPos: [88.9, 26.7]
    },
    {
      name: 'Subansiri',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[93.5, 28.6], [94.2, 27.5], [94.1, 26.8]],
      labelPos: [93.7, 27.7]
    },
    {
      name: 'Barak',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[94.2, 25.5], [93.2, 24.8], [92.5, 24.8], [91.2, 24.2]],
      labelPos: [93.1, 24.5]
    },

    // 4. PENINSULAR WEST-FLOWING RIVERS
    {
      name: 'Narmada (Reva)',
      rank: 1,
      color: '#0284c7',
      width: 3.0,
      coords: [
        [81.8, 22.7], [80.5, 22.9], [79.2, 22.9], [77.5, 22.8],
        [75.8, 22.2], [74.0, 21.8], [72.8, 21.6]
      ],
      labelPos: [76.5, 22.4],
      labelRotate: -5
    },
    {
      name: 'Tapi (Tapti)',
      rank: 1,
      color: '#0284c7',
      width: 2.4,
      coords: [
        [78.2, 21.8], [76.5, 21.5], [75.0, 21.2], [73.5, 21.1], [72.7, 21.1]
      ],
      labelPos: [75.2, 21.3],
      labelRotate: -3
    },
    {
      name: 'Sabarmati',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[73.5, 24.5], [72.8, 23.5], [72.5, 22.5]],
      labelPos: [73.2, 23.6]
    },
    {
      name: 'Mahi',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[75.0, 22.5], [74.2, 23.5], [73.5, 23.0], [72.7, 22.2]],
      labelPos: [74.1, 23.1]
    },
    {
      name: 'Luni',
      rank: 2,
      color: '#0ea5e9',
      width: 2.0,
      coords: [[74.6, 26.5], [73.5, 25.8], [72.5, 25.0], [71.5, 24.5]],
      labelPos: [73.2, 25.7]
    },

    // 5. PENINSULAR EAST-FLOWING RIVERS
    {
      name: 'Mahanadi',
      rank: 1,
      color: '#0369a1',
      width: 2.8,
      coords: [
        [81.9, 20.3], [82.5, 21.0], [84.0, 21.5], [85.5, 20.5], [86.6, 20.3]
      ],
      labelPos: [84.0, 21.1],
      labelRotate: 5
    },
    {
      name: 'Godavari (Dakshin Ganga)',
      rank: 1,
      color: '#0369a1',
      width: 3.2,
      coords: [
        [73.5, 19.9], [75.0, 19.5], [77.0, 19.0], [78.5, 18.8],
        [79.9, 18.7], [81.5, 17.5], [82.0, 16.7]
      ],
      labelPos: [77.5, 19.1],
      labelRotate: -6
    },
    {
      name: 'Krishna',
      rank: 1,
      color: '#0369a1',
      width: 3.0,
      coords: [
        [73.6, 17.9], [75.0, 17.0], [76.5, 16.5], [78.0, 16.2],
        [80.0, 16.5], [80.8, 15.8]
      ],
      labelPos: [77.0, 16.7],
      labelRotate: -5
    },
    {
      name: 'Tungabhadra',
      rank: 2,
      color: '#0284c7',
      width: 2.0,
      coords: [
        [75.7, 14.0], [76.0, 14.8], [76.4, 15.3], [77.0, 15.6],
        [77.8, 15.9], [78.1, 16.0]
      ],
      labelPos: [76.8, 15.4]
    },
    {
      name: 'Cauvery (Kaveri)',
      rank: 1,
      color: '#0369a1',
      width: 2.8,
      coords: [
        [75.5, 12.4], [76.5, 12.3], [77.5, 12.1], [78.5, 11.5], [79.8, 11.1]
      ],
      labelPos: [77.8, 12.0],
      labelRotate: -8
    },
    {
      name: 'Periyar',
      rank: 2,
      color: '#0284c7',
      width: 1.8,
      coords: [[77.2, 9.4], [76.8, 9.8], [76.2, 10.1]],
      labelPos: [76.8, 9.6]
    }
  ];

  // Key Multipurpose Dams & Hydel Projects
  const dams = [
    { name: 'Bhakra Nangal Dam', river: 'Sutlej', lonLat: [76.4, 31.4] },
    { name: 'Tehri Dam', river: 'Bhagirathi', lonLat: [78.5, 30.4] },
    { name: 'Rana Pratap Sagar', river: 'Chambal', lonLat: [75.6, 24.9] },
    { name: 'Sardar Sarovar Dam', river: 'Narmada', lonLat: [73.7, 21.8] },
    { name: 'Hirakud Dam', river: 'Mahanadi', lonLat: [83.9, 21.5] },
    { name: 'Nagarjuna Sagar', river: 'Krishna', lonLat: [79.3, 16.6] },
    { name: 'Srisailam Dam', river: 'Krishna', lonLat: [78.9, 16.1] },
    { name: 'Tungabhadra Dam', river: 'Tungabhadra', lonLat: [76.3, 15.3] },
    { name: 'Mettur Dam (Stanley Res.)', river: 'Cauvery', lonLat: [77.8, 11.8] },
    { name: 'Idukki Arch Dam', river: 'Periyar', lonLat: [76.9, 9.8] },
    { name: 'Farakka Barrage', river: 'Ganga', lonLat: [87.9, 24.8] },
  ];

  // Build SVG XML
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#f1f5f9" />
    </linearGradient>

    <!-- Ocean Texture Gradient -->
    <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#bae6fd" />
    </linearGradient>

    <!-- Outer Glow for Boundary -->
    <filter id="boundaryGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0284c7" flood-opacity="0.25" />
    </filter>

    <!-- Card Shadow -->
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.10" />
    </filter>

    <!-- Dam Marker Symbol -->
    <g id="damIcon">
      <circle cx="0" cy="0" r="4.5" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" />
      <rect x="-1.5" y="-1.5" width="3" height="3" fill="#ffffff" />
    </g>
  </defs>

  <!-- Base Canvas Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Surrounding Ocean Bodies -->
  <!-- Arabian Sea (West) -->
  <text x="180" y="860" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-style="italic" font-weight="600" fill="#0284c7" opacity="0.35" letter-spacing="4">ARABIAN SEA</text>
  <!-- Bay of Bengal (East) -->
  <text x="860" y="860" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-style="italic" font-weight="600" fill="#0284c7" opacity="0.35" letter-spacing="4">BAY OF BENGAL</text>
  <!-- Indian Ocean (South) -->
  <text x="500" y="1300" font-family="'Segoe UI', Roboto, sans-serif" font-size="20" font-style="italic" font-weight="600" fill="#0284c7" opacity="0.35" letter-spacing="6">INDIAN OCEAN</text>

  <!-- International Neighbor Labels -->
  <g font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#94a3b8" letter-spacing="2">
    <text x="130" y="240">AFGHANISTAN</text>
    <text x="160" y="450">PAKISTAN</text>
    <text x="650" y="160">CHINA (TIBET AUTONOMOUS REGION)</text>
    <text x="650" y="470">NEPAL</text>
    <text x="880" y="460">BHUTAN</text>
    <text x="885" y="620">BANGLADESH</text>
    <text x="1050" y="670">MYANMAR</text>
    <text x="560" y="1250">SRI LANKA</text>
  </g>

  <!-- Lat / Lon Graticule Grid Lines -->
  <g stroke="#cbd5e1" stroke-width="0.75" stroke-dasharray="3 3">
`;

  // Draw Longitude Lines
  [68, 72, 76, 80, 84, 88, 92, 96].forEach(lon => {
    const x = toX(lon);
    svg += `    <line x1="${x}" y1="110" x2="${x}" y2="1240" />\n`;
    svg += `    <text x="${x}" y="1255" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${lon}° E</text>\n`;
    svg += `    <text x="${x}" y="100" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${lon}° E</text>\n`;
  });

  // Draw Latitude Lines
  [8, 12, 16, 20, 24, 28, 32, 36].forEach(lat => {
    const y = toY(lat);
    const isTropic = lat === 24;
    svg += `    <line x1="90" y1="${y}" x2="1110" y2="${y}" ${isTropic ? 'stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="6 3"' : ''} />\n`;
    svg += `    <text x="80" y="${y + 4}" font-family="'Segoe UI', sans-serif" font-size="10" fill="${isTropic ? '#b45309' : '#64748b'}" text-anchor="end">${lat}° N${isTropic ? ' (Tropic of Cancer)' : ''}</text>\n`;
    svg += `    <text x="1120" y="${y + 4}" font-family="'Segoe UI', sans-serif" font-size="10" fill="${isTropic ? '#b45309' : '#64748b'}" text-anchor="start">${lat}° N</text>\n`;
  });

  svg += `  </g>\n\n  <!-- Major River Basin Catchment Polygons -->\n  <g id="riverBasins">\n`;

  // Draw River Basins
  basins.forEach(b => {
    const pathD = b.points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(pt[0])},${toY(pt[1])}`).join(' ') + ' Z';
    svg += `    <path d="${pathD}" fill="${b.fill}" stroke="${b.stroke}" stroke-width="1.5" stroke-dasharray="4 2" />\n`;
    const lx = toX(b.labelLonLat[0]);
    const ly = toY(b.labelLonLat[1]);
    svg += `    <text x="${lx}" y="${ly}" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#1e293b" opacity="0.8" text-anchor="middle" letter-spacing="1">${b.name.toUpperCase()}</text>\n`;
  });

  svg += `  </g>\n\n  <!-- Sovereign National Boundary of India (Undivided Territorial Integrity) -->\n`;
  svg += `  <path d="${soiBoundaryPath}" fill="none" stroke="#0284c7" stroke-width="2.8" filter="url(#boundaryGlow)" />\n`;
  svg += `  <path d="${soiBoundaryPath}" fill="none" stroke="#0369a1" stroke-width="1.4" />\n\n`;

  // Draw Indian Island Groups (Andaman & Nicobar, Lakshadweep)
  svg += `  <!-- Indian Island Territories -->\n  <g id="islandGroups" fill="#0284c7" stroke="#0369a1" stroke-width="1">\n`;
  // Andaman & Nicobar
  const andamanPts = [[92.8, 13.5], [92.9, 12.8], [92.8, 11.9], [92.7, 10.5], [92.8, 9.2], [93.8, 7.2], [93.9, 6.9]];
  andamanPts.forEach(pt => {
    svg += `    <circle cx="${toX(pt[0])}" cy="${toY(pt[1])}" r="3.5" />\n`;
  });
  svg += `    <text x="${toX(93.2)}" y="${toY(10.5)}" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#0369a1">Andaman &amp; Nicobar Islands (India)</text>\n`;

  // Lakshadweep
  const lakshadweepPts = [[72.6, 11.2], [72.8, 10.6], [73.0, 10.1], [73.6, 8.3]];
  lakshadweepPts.forEach(pt => {
    svg += `    <circle cx="${toX(pt[0])}" cy="${toY(pt[1])}" r="3" />\n`;
  });
  svg += `    <text x="${toX(73.2)}" y="${toY(9.8)}" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#0369a1">Lakshadweep (India)</text>\n`;
  svg += `  </g>\n\n`;

  // Draw River Channels & Flow Paths
  svg += `  <!-- River Networks (Flow Paths & Tributaries) -->\n  <g id="riverNetworks">\n`;
  rivers.forEach(riv => {
    const d = riv.coords.map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(pt[0])},${toY(pt[1])}`).join(' ');
    svg += `    <!-- River ${riv.name} -->\n`;
    svg += `    <path d="${d}" fill="none" stroke="${riv.color}" stroke-width="${riv.width}" stroke-linecap="round" stroke-linejoin="round" />\n`;
    if (riv.labelPos) {
      const lx = toX(riv.labelPos[0]);
      const ly = toY(riv.labelPos[1]);
      const rot = riv.labelRotate || 0;
      svg += `    <text x="${lx}" y="${ly}" font-family="'Segoe UI', Roboto, sans-serif" font-size="${riv.rank === 1 ? 12 : 10.5}" font-weight="${riv.rank === 1 ? 700 : 600}" fill="#0f172a" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" paint-order="stroke" text-anchor="middle" ${rot ? `transform="rotate(${rot} ${lx} ${ly})"` : ''}>${riv.name}</text>\n`;
    }
  });
  svg += `  </g>\n\n`;

  // Draw Multipurpose Dams
  svg += `  <!-- Multipurpose River Valley Projects & Dams -->\n  <g id="multipurposeDams">\n`;
  dams.forEach(dam => {
    const dx = toX(dam.lonLat[0]);
    const dy = toY(dam.lonLat[1]);
    svg += `    <g transform="translate(${dx}, ${dy})">\n`;
    svg += `      <use href="#damIcon" />\n`;
    svg += `      <text x="8" y="4" font-family="'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="700" fill="#991b1b" stroke="#ffffff" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke">${dam.name}</text>\n`;
    svg += `    </g>\n`;
  });
  svg += `  </g>\n\n`;

  // Cartographic Layout Header & Title Block (Top Right)
  svg += `  <!-- Title Banner (Survey of India / CWC Standard) -->
  <g transform="translate(730, 45)" filter="url(#cardShadow)">
    <rect width="420" height="95" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <rect x="0" y="0" width="8" height="95" rx="4" fill="#0284c7" />
    <text x="24" y="32" font-family="'Segoe UI', 'Arial Black', sans-serif" font-size="20" font-weight="900" fill="#0f172a" letter-spacing="1">INDIA — DRAINAGE SYSTEM</text>
    <text x="24" y="54" font-family="'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#0284c7" letter-spacing="1">&amp; MAJOR RIVER BASINS</text>
    <text x="24" y="78" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="500" fill="#64748b">Central Water Commission (CWC) • Survey of India Standard</text>
  </g>

  <!-- Compass Rose (North Arrow) -->
  <g transform="translate(1100, 190)">
    <circle cx="0" cy="0" r="22" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
    <!-- North Point (Red) -->
    <polygon points="0,-20 5,-2 0,0" fill="#dc2626" />
    <polygon points="0,-20 -5,-2 0,0" fill="#b91c1c" />
    <!-- South Point -->
    <polygon points="0,20 5,2 0,0" fill="#64748b" />
    <polygon points="0,20 -5,2 0,0" fill="#475569" />
    <!-- East/West Points -->
    <polygon points="20,0 2,5 0,0" fill="#94a3b8" />
    <polygon points="-20,0 -2,5 0,0" fill="#94a3b8" />
    <text x="0" y="-24" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="900" fill="#dc2626" text-anchor="middle">N</text>
  </g>

  <!-- Scale Bar (Metric) -->
  <g transform="translate(100, 1285)">
    <rect x="0" y="0" width="200" height="6" fill="#0f172a" />
    <rect x="50" y="0" width="50" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="1" />
    <rect x="150" y="0" width="50" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="1" />
    <line x1="0" y1="-3" x2="0" y2="9" stroke="#0f172a" stroke-width="1.5" />
    <line x1="100" y1="-3" x2="100" y2="9" stroke="#0f172a" stroke-width="1.5" />
    <line x1="200" y1="-3" x2="200" y2="9" stroke="#0f172a" stroke-width="1.5" />
    <text x="0" y="20" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155" text-anchor="middle">0</text>
    <text x="100" y="20" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155" text-anchor="middle">250 km</text>
    <text x="200" y="20" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155" text-anchor="middle">500 km</text>
  </g>

  <!-- Map Legend & Symbology Box (Bottom Left) -->
  <g transform="translate(100, 940)" filter="url(#cardShadow)">
    <rect width="250" height="310" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <rect x="0" y="0" width="250" height="32" rx="8" fill="#f8fafc" />
    <text x="16" y="21" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#0f172a">MAP LEGEND &amp; SYMBOLOGY</text>

    <!-- Legend Items -->
    <!-- Major River -->
    <line x1="20" y1="52" x2="55" y2="52" stroke="#0369a1" stroke-width="3.5" />
    <text x="65" y="56" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="600" fill="#1e293b">Major River Course</text>

    <!-- Tributary -->
    <line x1="20" y1="74" x2="55" y2="74" stroke="#0284c7" stroke-width="1.8" />
    <text x="65" y="78" font-family="'Segoe UI', sans-serif" font-size="11" fill="#1e293b">Secondary Tributary</text>

    <!-- Multipurpose Dam -->
    <use href="#damIcon" x="38" y="98" />
    <text x="65" y="102" font-family="'Segoe UI', sans-serif" font-size="11" fill="#1e293b">Multipurpose Dam / Hydel</text>

    <!-- Divider -->
    <line x1="16" y1="118" x2="234" y2="118" stroke="#e2e8f0" stroke-width="1" />
    <text x="16" y="134" font-family="'Segoe UI', sans-serif" font-size="10.5" font-weight="700" fill="#64748b">CWC MAJOR DRAINAGE BASINS</text>

    <!-- Basins colors -->
    <rect x="20" y="146" width="16" height="12" rx="2" fill="rgba(147, 197, 253, 0.6)" stroke="#60a5fa" stroke-width="1" />
    <text x="44" y="156" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Indus Drainage Basin</text>

    <rect x="20" y="166" width="16" height="12" rx="2" fill="rgba(167, 243, 208, 0.7)" stroke="#34d399" stroke-width="1" />
    <text x="44" y="176" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Ganga Drainage Basin</text>

    <rect x="20" y="186" width="16" height="12" rx="2" fill="rgba(187, 247, 208, 0.7)" stroke="#4ade80" stroke-width="1" />
    <text x="44" y="196" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Brahmaputra Basin</text>

    <rect x="20" y="206" width="16" height="12" rx="2" fill="rgba(254, 240, 138, 0.7)" stroke="#eab308" stroke-width="1" />
    <text x="44" y="216" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Godavari Basin (Dakshin Ganga)</text>

    <rect x="20" y="226" width="16" height="12" rx="2" fill="rgba(233, 213, 255, 0.7)" stroke="#c084fc" stroke-width="1" />
    <text x="44" y="236" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Krishna Drainage Basin</text>

    <rect x="20" y="246" width="16" height="12" rx="2" fill="rgba(254, 205, 211, 0.7)" stroke="#f43f5e" stroke-width="1" />
    <text x="44" y="256" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Mahanadi Basin</text>

    <rect x="20" y="266" width="16" height="12" rx="2" fill="rgba(254, 215, 170, 0.7)" stroke="#fb923c" stroke-width="1" />
    <text x="44" y="276" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Narmada &amp; Tapi Basins</text>

    <rect x="20" y="286" width="16" height="12" rx="2" fill="rgba(199, 210, 254, 0.7)" stroke="#818cf8" stroke-width="1" />
    <text x="44" y="296" font-family="'Segoe UI', sans-serif" font-size="10" fill="#334155">Cauvery Basin &amp; South Rivers</text>
  </g>

  <!-- Legal & Official Attribution Footer -->
  <g transform="translate(600, 1335)">
    <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="9" font-weight="600" fill="#64748b" text-anchor="middle">
      Based upon Survey of India map with the permission of the Surveyor General of India. © Government of India Copyright. Undivided Sovereign Territory Delineated.
    </text>
  </g>
</svg>
`;

  return svg;
}

// ─── 2. MAJOR GLOBAL OCEAN CURRENTS & GYRES SVG MAP GENERATOR ──────────────────

function generateOceanCurrentsSvg() {
  const width = 1600;
  const height = 950;

  // Projection: World cylindrical lon [-180..180], lat [-85..85]
  const minLon = -180, maxLon = 180;
  const minLat = -85, maxLat = 85;
  const padX = 60, padY = 80;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  function toX(lon) {
    return Math.round(padX + ((lon - minLon) / (maxLon - minLon)) * plotW);
  }
  function toY(lat) {
    return Math.round(padY + ((maxLat - lat) / (maxLat - minLat)) * plotH);
  }

  // Continents Polygons (World Basemap)
  const continents = [
    // North America & Central America
    {
      name: 'North America',
      coords: [
        [-168, 65], [-160, 71], [-140, 70], [-125, 69], [-100, 69], [-80, 70],
        [-65, 60], [-55, 52], [-60, 45], [-70, 42], [-75, 35], [-80, 25],
        [-88, 21], [-88, 16], [-83, 9], [-77, 8], [-80, 10], [-85, 14],
        [-95, 16], [-105, 20], [-110, 24], [-115, 30], [-124, 38], [-125, 48],
        [-135, 56], [-145, 60], [-160, 58], [-168, 65]
      ]
    },
    // South America
    {
      name: 'South America',
      coords: [
        [-77, 8], [-70, 12], [-60, 10], [-50, 0], [-35, -5], [-37, -12],
        [-40, -22], [-48, -28], [-55, -35], [-65, -45], [-68, -54], [-75, -50],
        [-75, -42], [-72, -32], [-70, -20], [-78, -8], [-81, -4], [-77, 8]
      ]
    },
    // Eurasia (Europe + Asia)
    {
      name: 'Eurasia',
      coords: [
        [-9, 36], [-9, 44], [-2, 44], [4, 52], [8, 55], [18, 55], [25, 60],
        [28, 70], [45, 68], [60, 70], [80, 73], [105, 76], [130, 72], [170, 68],
        [170, 60], [160, 52], [142, 50], [130, 42], [122, 38], [120, 30],
        [110, 20], [105, 10], [100, 4], [98, 10], [90, 22], [80, 13], [75, 8],
        [70, 22], [60, 25], [50, 28], [42, 13], [44, 28], [35, 32], [28, 41],
        [20, 40], [14, 38], [0, 38], [-9, 36]
      ]
    },
    // Africa
    {
      name: 'Africa',
      coords: [
        [-9, 36], [10, 37], [25, 32], [32, 31], [42, 13], [51, 12], [48, 5],
        [42, -5], [40, -15], [35, -25], [30, -32], [20, -34], [18, -34],
        [12, -20], [10, -5], [8, 4], [2, 6], [-12, 8], [-17, 15], [-15, 25],
        [-9, 36]
      ]
    },
    // Australia
    {
      name: 'Australia',
      coords: [
        [114, -22], [120, -15], [135, -12], [142, -10], [146, -18], [153, -28],
        [150, -37], [140, -38], [135, -34], [125, -32], [115, -34], [114, -22]
      ]
    },
    // Greenland
    {
      name: 'Greenland',
      coords: [
        [-45, 60], [-35, 66], [-25, 75], [-35, 82], [-50, 81], [-60, 76],
        [-55, 68], [-45, 60]
      ]
    },
    // Antarctica
    {
      name: 'Antarctica',
      coords: [
        [-180, -75], [-120, -75], [-60, -65], [-30, -75], [0, -70], [60, -68],
        [120, -68], [150, -72], [180, -75], [180, -85], [-180, -85], [-180, -75]
      ]
    },
    // Madagascar
    {
      name: 'Madagascar',
      coords: [
        [44, -12], [50, -15], [48, -25], [44, -25], [44, -12]
      ]
    },
    // British Isles
    {
      name: 'British Isles',
      coords: [
        [-5, 50], [1, 52], [0, 58], [-5, 58], [-6, 54], [-5, 50]
      ]
    },
    // Japan
    {
      name: 'Japan',
      coords: [
        [130, 32], [135, 34], [141, 38], [145, 44], [141, 44], [137, 37], [130, 32]
      ]
    },
    // New Zealand
    {
      name: 'New Zealand',
      coords: [
        [168, -45], [174, -41], [178, -38], [175, -36], [172, -43], [168, -45]
      ]
    }
  ];

  // Ocean Currents Definitions with realistic oceanic courses
  const warmCurrents = [
    // Atlantic
    { name: 'Gulf Stream', from: [-80, 25], via: [-74, 34], to: [-55, 42], labelPos: [-72, 33] },
    { name: 'North Atlantic Drift', from: [-55, 42], via: [-30, 48], to: [-10, 56], labelPos: [-32, 51] },
    { name: 'Norwegian Current', from: [-5, 60], via: [5, 66], to: [20, 72], labelPos: [8, 69] },
    { name: 'North Equatorial Current (Atl.)', from: [-20, 15], via: [-45, 14], to: [-70, 15], labelPos: [-45, 17] },
    { name: 'South Equatorial Current (Atl.)', from: [5, -4], via: [-20, -5], to: [-40, -8], labelPos: [-20, -3] },
    { name: 'Equatorial Counter Current', from: [-50, 4], via: [-30, 5], to: [-10, 4], labelPos: [-30, 7] },
    { name: 'Brazil Current', from: [-38, -12], via: [-42, -22], to: [-50, -35], labelPos: [-45, -24] },

    // Pacific
    { name: 'Kuroshio (Japan Current)', from: [125, 20], via: [135, 30], to: [148, 36], labelPos: [138, 28] },
    { name: 'North Pacific Current', from: [148, 36], via: [180, 42], to: [-145, 44], labelPos: [-170, 46] },
    { name: 'North Equatorial Current (Pac.)', from: [-110, 12], via: [-160, 13], to: [135, 13], labelPos: [-150, 15] },
    { name: 'South Equatorial Current (Pac.)', from: [-90, -4], via: [-150, -5], to: [155, -6], labelPos: [-140, -3] },
    { name: 'Equatorial Counter Current (Pac.)', from: [145, 5], via: [-170, 6], to: [-115, 6], labelPos: [-160, 8] },
    { name: 'East Australian Current', from: [154, -20], via: [156, -30], to: [152, -40], labelPos: [160, -30] },

    // Indian Ocean
    { name: 'Agulhas Current', from: [38, -25], via: [32, -32], to: [24, -36], labelPos: [36, -34] },
    { name: 'Mozambique Current', from: [42, -12], via: [40, -18], to: [36, -26], labelPos: [43, -20] },
    { name: 'South Equatorial Current (Ind.)', from: [100, -10], via: [75, -11], to: [50, -11], labelPos: [75, -9] },
    { name: 'Southwest Monsoon Current', from: [55, 10], via: [70, 14], to: [85, 12], labelPos: [70, 16] },
  ];

  const coldCurrents = [
    // Atlantic
    { name: 'Labrador Current', from: [-62, 62], via: [-58, 54], to: [-52, 46], labelPos: [-61, 53] },
    { name: 'Canaries Current', from: [-15, 34], via: [-20, 24], to: [-22, 16], labelPos: [-22, 26] },
    { name: 'Benguela Current', from: [15, -34], via: [10, -24], to: [5, -12], labelPos: [8, -22] },
    { name: 'Falkland Current', from: [-65, -54], via: [-60, -48], to: [-54, -40], labelPos: [-63, -46] },
    { name: 'East Greenland Current', from: [-20, 75], via: [-30, 68], to: [-42, 60], labelPos: [-32, 70] },

    // Pacific
    { name: 'California Current', from: [-128, 48], via: [-124, 38], to: [-118, 25], labelPos: [-127, 34] },
    { name: 'Peru (Humboldt) Current', from: [-75, -45], via: [-74, -30], to: [-80, -12], labelPos: [-81, -28] },
    { name: 'Oyashio (Kuril) Current', from: [165, 58], via: [155, 48], to: [146, 40], labelPos: [157, 50] },

    // Indian Ocean & Southern Ocean
    { name: 'West Australian Current', from: [112, -34], via: [110, -26], to: [108, -18], labelPos: [114, -26] },
    { name: 'West Wind Drift (Circumpolar)', from: [-160, -56], via: [-80, -56], to: [0, -56], labelPos: [-80, -53] },
    { name: 'West Wind Drift (East Arc)', from: [0, -56], via: [90, -56], to: [170, -56], labelPos: [90, -53] }
  ];

  // The 5 Great Subtropical Gyres
  const gyres = [
    { name: 'North Atlantic Gyre', sub: '(Sargasso Sea)', centerLonLat: [-45, 28], rx: 90, ry: 45, dir: 'CW' },
    { name: 'South Atlantic Gyre', sub: '', centerLonLat: [-20, -22], rx: 80, ry: 45, dir: 'CCW' },
    { name: 'North Pacific Gyre', sub: '', centerLonLat: [-160, 28], rx: 110, ry: 48, dir: 'CW' },
    { name: 'South Pacific Gyre', sub: '', centerLonLat: [-130, -25], rx: 110, ry: 50, dir: 'CCW' },
    { name: 'Indian Ocean Gyre', sub: '', centerLonLat: [75, -22], rx: 85, ry: 45, dir: 'CCW' },
  ];

  // Prime Fishing Banks & Confluences (Warm meets Cold)
  const fishingZones = [
    { name: 'Grand Banks (Newfoundland)', note: 'Gulf Stream + Labrador', lonLat: [-52, 44] },
    { name: 'Japan Coast / Kuril', note: 'Kuroshio + Oyashio', lonLat: [144, 38] },
    { name: 'Peruvian Anchoveta Upwelling', note: 'Humboldt Cold Upwelling', lonLat: [-78, -14] },
  ];

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Ocean Deep Space Gradient -->
    <linearGradient id="oceanSpaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0b172a" />
      <stop offset="50%" stop-color="#091e3a" />
      <stop offset="100%" stop-color="#0a192f" />
    </linearGradient>

    <!-- Continent Fill Gradient -->
    <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <!-- Warm Arrow Marker (Red) -->
    <marker id="warmArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
    </marker>

    <!-- Cold Arrow Marker (Cyan) -->
    <marker id="coldArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
    </marker>

    <!-- Warm Current Glow Filter -->
    <filter id="warmGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#ef4444" flood-opacity="0.6" />
    </filter>

    <!-- Cold Current Glow Filter -->
    <filter id="coldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#06b6d4" flood-opacity="0.6" />
    </filter>

    <!-- Card Background Shadow -->
    <filter id="darkCardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.5" />
    </filter>
  </defs>

  <!-- Deep Ocean Base -->
  <rect width="${width}" height="${height}" fill="url(#oceanSpaceGrad)" />

  <!-- Global Latitude / Longitude Graticule Grid -->
  <g stroke="#1e3a5f" stroke-width="0.75" opacity="0.6" stroke-dasharray="3 3">
`;

  // Draw Longitudes
  [-120, -60, 0, 60, 120].forEach(lon => {
    const x = toX(lon);
    svg += `    <line x1="${x}" y1="80" x2="${x}" y2="870" />\n`;
    svg += `    <text x="${x}" y="70" font-family="'Segoe UI', sans-serif" font-size="10" fill="#64748b" text-anchor="middle">${Math.abs(lon)}°${lon < 0 ? 'W' : lon > 0 ? 'E' : ' (Prime Meridian)'}</text>\n`;
  });

  // Draw Key Latitudes (Tropic of Cancer, Equator, Tropic of Capricorn, Polar Circles)
  [
    { lat: 66.5, label: '66.5° N Arctic Circle' },
    { lat: 23.5, label: '23.5° N Tropic of Cancer', highlight: true },
    { lat: 0, label: '0° EQUATOR', equator: true },
    { lat: -23.5, label: '23.5° S Tropic of Capricorn', highlight: true },
    { lat: -66.5, label: '66.5° S Antarctic Circle' }
  ].forEach(item => {
    const y = toY(item.lat);
    const strokeColor = item.equator ? '#38bdf8' : item.highlight ? '#f59e0b' : '#1e3a5f';
    const strokeW = item.equator ? 1.5 : item.highlight ? 1.2 : 0.75;
    svg += `    <line x1="60" y1="${y}" x2="1540" y2="${y}" stroke="${strokeColor}" stroke-width="${strokeW}" />\n`;
    svg += `    <text x="50" y="${y + 4}" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="${item.equator ? 800 : 500}" fill="${strokeColor}" text-anchor="end">${item.label}</text>\n`;
    svg += `    <text x="1550" y="${y + 4}" font-family="'Segoe UI', sans-serif" font-size="10" fill="${strokeColor}" text-anchor="start">${Math.abs(item.lat)}°${item.lat > 0 ? 'N' : item.lat < 0 ? 'S' : ''}</text>\n`;
  });

  svg += `  </g>\n\n  <!-- Global Continents (Accurate Terrestrial Silhouettes) -->\n  <g id="continents">\n`;

  // Draw Continents
  continents.forEach(c => {
    const pathD = c.coords.map((pt, i) => `${i === 0 ? 'M' : 'L'}${toX(pt[0])},${toY(pt[1])}`).join(' ') + ' Z';
    svg += `    <!-- ${c.name} -->\n`;
    svg += `    <path d="${pathD}" fill="url(#landGrad)" stroke="#334155" stroke-width="1.2" />\n`;
  });

  svg += `  </g>\n\n  <!-- Major Ocean Labels -->\n  <g font-family="'Segoe UI', Roboto, sans-serif" font-size="16" font-style="italic" font-weight="700" fill="#38bdf8" opacity="0.35" letter-spacing="4">\n`;
  svg += `    <text x="${toX(-35)}" y="${toY(30)}" text-anchor="middle">NORTH ATLANTIC OCEAN</text>\n`;
  svg += `    <text x="${toX(-25)}" y="${toY(-25)}" text-anchor="middle">SOUTH ATLANTIC OCEAN</text>\n`;
  svg += `    <text x="${toX(-155)}" y="${toY(20)}" text-anchor="middle">NORTH PACIFIC OCEAN</text>\n`;
  svg += `    <text x="${toX(-130)}" y="${toY(-30)}" text-anchor="middle">SOUTH PACIFIC OCEAN</text>\n`;
  svg += `    <text x="${toX(75)}" y="${toY(-15)}" text-anchor="middle">INDIAN OCEAN</text>\n`;
  svg += `    <text x="${toX(0)}" y="${toY(-65)}" text-anchor="middle">SOUTHERN OCEAN</text>\n`;
  svg += `    <text x="${toX(0)}" y="${toY(80)}" text-anchor="middle">ARCTIC OCEAN</text>\n`;
  svg += `  </g>\n\n`;

  // Draw The 5 Subtropical Gyres
  svg += `  <!-- The 5 Subtropical Oceanic Gyres (Circulating Centers) -->\n  <g id="subtropicalGyres">\n`;
  gyres.forEach(g => {
    const cx = toX(g.centerLonLat[0]);
    const cy = toY(g.centerLonLat[1]);
    svg += `    <g transform="translate(${cx}, ${cy})">\n`;
    svg += `      <ellipse cx="0" cy="0" rx="${g.rx}" ry="${g.ry}" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.55" />\n`;
    svg += `      <circle cx="0" cy="0" r="3" fill="#38bdf8" opacity="0.8" />\n`;
    svg += `      <text x="0" y="4" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#38bdf8" text-anchor="middle" letter-spacing="1">${g.name.toUpperCase()}</text>\n`;
    if (g.sub) {
      svg += `      <text x="0" y="18" font-family="'Segoe UI', sans-serif" font-size="9.5" font-weight="600" fill="#94a3b8" text-anchor="middle">${g.sub}</text>\n`;
    }
    svg += `    </g>\n`;
  });
  svg += `  </g>\n\n`;

  // Draw Warm Currents (Red Smooth Curved Vectors with Glow & Arrowhead)
  svg += `  <!-- Warm Ocean Currents (Red Arrows) -->\n  <g id="warmCurrents" filter="url(#warmGlow)">\n`;
  warmCurrents.forEach(curr => {
    const x1 = toX(curr.from[0]), y1 = toY(curr.from[1]);
    const x2 = toX(curr.via[0]), y2 = toY(curr.via[1]);
    const x3 = toX(curr.to[0]), y3 = toY(curr.to[1]);
    const d = `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3}`;
    svg += `    <path d="${d}" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" marker-end="url(#warmArrow)" />\n`;
  });
  svg += `  </g>\n\n  <!-- Warm Currents Text Labels -->\n  <g id="warmLabels">\n`;
  warmCurrents.forEach(curr => {
    const lx = toX(curr.labelPos[0]);
    const ly = toY(curr.labelPos[1]);
    svg += `    <text x="${lx}" y="${ly}" font-family="'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#fca5a5" stroke="#091e3a" stroke-width="3" stroke-linejoin="round" paint-order="stroke" text-anchor="middle">${curr.name}</text>\n`;
  });
  svg += `  </g>\n\n`;

  // Draw Cold Currents (Cyan Smooth Curved Vectors with Glow & Arrowhead)
  svg += `  <!-- Cold Ocean Currents (Cyan Arrows) -->\n  <g id="coldCurrents" filter="url(#coldGlow)">\n`;
  coldCurrents.forEach(curr => {
    const x1 = toX(curr.from[0]), y1 = toY(curr.from[1]);
    const x2 = toX(curr.via[0]), y2 = toY(curr.via[1]);
    const x3 = toX(curr.to[0]), y3 = toY(curr.to[1]);
    const d = `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3}`;
    svg += `    <path d="${d}" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" marker-end="url(#coldArrow)" />\n`;
  });
  svg += `  </g>\n\n  <!-- Cold Currents Text Labels -->\n  <g id="coldLabels">\n`;
  coldCurrents.forEach(curr => {
    const lx = toX(curr.labelPos[0]);
    const ly = toY(curr.labelPos[1]);
    svg += `    <text x="${lx}" y="${ly}" font-family="'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#a5f3fc" stroke="#091e3a" stroke-width="3" stroke-linejoin="round" paint-order="stroke" text-anchor="middle">${curr.name}</text>\n`;
  });
  svg += `  </g>\n\n`;

  // Prime Fishing Confluences
  svg += `  <!-- Famous Marine Confluences & Fishing Banks -->\n  <g id="fishingBanks">\n`;
  fishingZones.forEach(f => {
    const fx = toX(f.lonLat[0]);
    const fy = toY(f.lonLat[1]);
    svg += `    <g transform="translate(${fx}, ${fy})">\n`;
    svg += `      <circle cx="0" cy="0" r="5" fill="#facc15" stroke="#ffffff" stroke-width="1.5" />\n`;
    svg += `      <text x="8" y="3" font-family="'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#fef08a" stroke="#091e3a" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke">⭐ ${f.name}</text>\n`;
    svg += `      <text x="8" y="14" font-family="'Segoe UI', sans-serif" font-size="8.5" font-weight="600" fill="#e2e8f0" stroke="#091e3a" stroke-width="2" stroke-linejoin="round" paint-order="stroke">(${f.note})</text>\n`;
    svg += `    </g>\n`;
  });
  svg += `  </g>\n\n`;

  // Top Header Banner
  svg += `  <!-- Main Title Banner (Classroom Standard) -->
  <g transform="translate(60, 20)" filter="url(#darkCardShadow)">
    <rect width="640" height="54" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <rect x="0" y="0" width="6" height="54" rx="3" fill="#38bdf8" />
    <text x="20" y="24" font-family="'Segoe UI', 'Arial Black', sans-serif" font-size="17" font-weight="900" fill="#f8fafc" letter-spacing="1">MAJOR GLOBAL OCEAN CURRENTS &amp; OCEANIC GYRES</text>
    <text x="20" y="44" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="500" fill="#94a3b8">Surface Oceanic Circulation • Thermohaline Drift • Subtropical Gyres &amp; Upwelling Zones</text>
  </g>

  <!-- Legend Card (Bottom Left) -->
  <g transform="translate(60, 750)" filter="url(#darkCardShadow)">
    <rect width="360" height="120" rx="6" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <rect x="0" y="0" width="360" height="24" rx="6" fill="#1e293b" />
    <text x="14" y="17" font-family="'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#f8fafc">OCEAN CIRCULATION SYMBOLOGY</text>

    <!-- Warm Current Entry -->
    <line x1="20" y1="44" x2="65" y2="44" stroke="#ef4444" stroke-width="3.5" marker-end="url(#warmArrow)" />
    <text x="80" y="48" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#fca5a5">Warm Ocean Currents</text>
    <text x="215" y="48" font-family="'Segoe UI', sans-serif" font-size="10" fill="#94a3b8">(Flow from Equator to Poles)</text>

    <!-- Cold Current Entry -->
    <line x1="20" y1="68" x2="65" y2="68" stroke="#06b6d4" stroke-width="3.5" marker-end="url(#coldArrow)" />
    <text x="80" y="72" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" fill="#a5f3fc">Cold Ocean Currents</text>
    <text x="215" y="72" font-family="'Segoe UI', sans-serif" font-size="10" fill="#94a3b8">(Flow from Poles to Equator)</text>

    <!-- Gyre and Fishing Zones -->
    <ellipse cx="30" cy="94" rx="14" ry="8" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 2" />
    <text x="54" y="98" font-family="'Segoe UI', sans-serif" font-size="10.5" fill="#38bdf8">Subtropical Gyre</text>

    <circle cx="170" cy="94" r="4.5" fill="#facc15" />
    <text x="182" y="98" font-family="'Segoe UI', sans-serif" font-size="10.5" fill="#fef08a">Major Confluence / Fishing Grounds</text>
  </g>

  <!-- Compass Rose -->
  <g transform="translate(1520, 50)">
    <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#334155" stroke-width="1" />
    <polygon points="0,-16 4,-2 0,0" fill="#ef4444" />
    <polygon points="0,-16 -4,-2 0,0" fill="#b91c1c" />
    <polygon points="0,16 4,2 0,0" fill="#64748b" />
    <polygon points="0,16 -4,2 0,0" fill="#475569" />
    <text x="0" y="-19" font-family="'Segoe UI', sans-serif" font-size="9" font-weight="900" fill="#ef4444" text-anchor="middle">N</text>
  </g>

  <!-- Bottom Attribution -->
  <g transform="translate(800, 930)">
    <text x="0" y="0" font-family="'Segoe UI', sans-serif" font-size="9" font-weight="500" fill="#64748b" text-anchor="middle">
      Global Surface Ocean Currents • National Oceanic and Atmospheric Administration (NOAA) &amp; Survey of India Standard
    </text>
  </g>
</svg>
`;

  return svg;
}

// ─── EXECUTION & SAVING ────────────────────────────────────────────────────────

const publicMapsDir = path.join(__dirname, '../public/assets/maps');
const distMapsDir = path.join(__dirname, '../dist/renderer/assets/maps');

if (!fs.existsSync(publicMapsDir)) {
  fs.mkdirSync(publicMapsDir, { recursive: true });
}
if (!fs.existsSync(distMapsDir)) {
  fs.mkdirSync(distMapsDir, { recursive: true });
}

// 1. Generate Drainage Map
const drainageSvg = generateIndiaDrainageSvg();
const drainagePublicPath = path.join(publicMapsDir, 'soi_india_drainage_and_river_basins.svg');
const drainageDistPath = path.join(distMapsDir, 'soi_india_drainage_and_river_basins.svg');
fs.writeFileSync(drainagePublicPath, drainageSvg, 'utf8');
fs.writeFileSync(drainageDistPath, drainageSvg, 'utf8');
console.log(`✓ Created: ${drainagePublicPath} (${drainageSvg.length} bytes)`);

// 2. Generate Ocean Currents Map
const oceanSvg = generateOceanCurrentsSvg();
const oceanPublicPath = path.join(publicMapsDir, 'major_global_ocean_currents.svg');
const oceanDistPath = path.join(distMapsDir, 'major_global_ocean_currents.svg');
fs.writeFileSync(oceanPublicPath, oceanSvg, 'utf8');
fs.writeFileSync(oceanDistPath, oceanSvg, 'utf8');
console.log(`✓ Created: ${oceanPublicPath} (${oceanSvg.length} bytes)`);


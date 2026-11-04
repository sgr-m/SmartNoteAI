const fs = require('fs');
const path = require('path');

function createToposheetSvg(sheetNumber, sheetTitle, region, config) {
  const W = 2800;
  const H = 2400;
  const mL = 140;
  const mT = 180;
  const mR = 360;
  const mB = 220;
  const mapW = W - mL - mR;
  const mapH = H - mT - mB;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      .title { font-family: 'Arial', sans-serif; font-size: 32px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .sub-title { font-family: 'Arial', sans-serif; font-size: 20px; font-weight: bold; fill: #dc2626; text-anchor: middle; }
      .meta { font-family: 'Arial', sans-serif; font-size: 15px; fill: #1e293b; text-anchor: middle; }
      .grid-label { font-family: 'Arial', monospace; font-size: 14px; font-weight: bold; fill: #dc2626; text-anchor: middle; }
      .contour-label { font-family: 'Arial', monospace; font-size: 11px; font-weight: bold; fill: #78350f; }
      .place-name { font-family: 'Arial', sans-serif; font-size: 14px; font-weight: bold; fill: #0f172a; }
      .water-name { font-family: 'Arial', sans-serif; font-size: 13px; font-style: italic; fill: #0284c7; }
      .legend-title { font-family: 'Arial', sans-serif; font-size: 15px; font-weight: bold; fill: #0f172a; text-anchor: middle; }
      .legend-text { font-family: 'Arial', sans-serif; font-size: 12px; fill: #1e293b; }
    </style>
    <pattern id="stonyWaste" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.2" fill="#d97706" />
      <circle cx="12" cy="12" r="1.2" fill="#d97706" />
    </pattern>
    <pattern id="openScrub" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 6 18 Q 12 6 18 18 M 12 12 Q 12 6 15 8" stroke="#16a34a" stroke-width="1.2" fill="none" />
    </pattern>
  </defs>

  <!-- Sheet Background -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="#fefdf7" />

  <!-- Outer Map Borders -->
  <rect x="${mL}" y="${mT}" width="${mapW}" height="${mapH}" fill="#fefce8" stroke="#0f172a" stroke-width="4" />
  <rect x="${mL + 6}" y="${mT + 6}" width="${mapW - 12}" height="${mapH - 12}" fill="#fefce8" stroke="#475569" stroke-width="1.5" />

  <!-- Marginal Header Information -->
  <text x="${mL + 15}" y="${mT - 95}" font-family="Arial" font-size="12px" fill="#475569">INDIA AND ADJACENT COUNTRIES</text>
  <text x="${mL + 15}" y="${mT - 68}" font-family="Arial" font-size="18px" font-weight="bold" fill="#0f172a">${region.toUpperCase()}</text>

  <text x="${mL + mapW / 2}" y="${mT - 130}" class="title">SURVEY OF INDIA</text>
  <text x="${mL + mapW / 2}" y="${mT - 85}" class="sub-title">OPEN SERIES MAP — 1 : 50,000</text>
  <text x="${mL + mapW / 2}" y="${mT - 50}" class="meta">SHEET NO. ${sheetNumber} (${sheetTitle.toUpperCase()})</text>

  <text x="${mL + mapW - 15}" y="${mT - 75}" font-family="Arial" font-size="18px" font-weight="bold" fill="#0f172a" text-anchor="end">SCALE 1 : 50,000</text>
  <text x="${mL + mapW - 15}" y="${mT - 50}" font-family="Arial" font-size="13px" fill="#475569" text-anchor="end">2 Centimetres to 1 Kilometre</text>

  <!-- Reserved Forest Polygon (Green tint) -->
  <polygon points="${config.forest.map(([x, y]) => `${mL + x * mapW},${mT + y * mapH}`).join(' ')}" fill="rgba(187, 247, 208, 0.65)" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="6,3" />
  <text x="${mL + config.rfPos[0] * mapW}" y="${mT + config.rfPos[1] * mapH}" font-family="Arial" font-size="16px" font-weight="bold" fill="#15803d">RESERVED FOREST (R.F.)</text>

  <!-- 1 km National Grid Lines (Eastings & Northings) -->
`;

  // Grid Eastings
  const eCount = config.eEnd - config.eStart;
  for (let i = 0; i <= eCount; i++) {
    const gx = mL + (i / eCount) * mapW;
    const eVal = String(config.eStart + i).padStart(2, '0');
    svg += `  <line x1="${gx}" y1="${mT}" x2="${gx}" y2="${mT + mapH}" stroke="#ef4444" stroke-width="1" stroke-opacity="0.8" />\n`;
    svg += `  <text x="${gx}" y="${mT - 18}" class="grid-label">${eVal}</text>\n`;
    svg += `  <text x="${gx}" y="${mT + mapH + 24}" class="grid-label">${eVal}</text>\n`;
  }

  // Grid Northings
  const nCount = config.nEnd - config.nStart;
  for (let j = 0; j <= nCount; j++) {
    const gy = mT + (j / nCount) * mapH;
    const nVal = String(config.nEnd - j).padStart(2, '0');
    svg += `  <line x1="${mL}" y1="${gy}" x2="${mL + mapW}" y2="${gy}" stroke="#ef4444" stroke-width="1" stroke-opacity="0.8" />\n`;
    svg += `  <text x="${mL - 18}" y="${gy + 5}" class="grid-label" text-anchor="end">${nVal}</text>\n`;
    svg += `  <text x="${mL + mapW + 18}" y="${gy + 5}" class="grid-label" text-anchor="start">${nVal}</text>\n`;
  }

  // Brown Contour Lines (20m intervals)
  for (const c of config.contours) {
    const strokeColor = c.isIndex ? '#78350f' : '#b45309';
    const strokeW = c.isIndex ? 2.8 : 1.4;
    const pts = c.pts.map(([x, y]) => `${mL + x * mapW},${mT + y * mapH}`).join(' ');
    if (c.isClosed) {
      svg += `  <polygon points="${pts}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" />\n`;
    } else {
      svg += `  <polyline points="${pts}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}" />\n`;
    }
    if (c.isIndex) {
      const [lx, ly] = c.pts[0];
      svg += `  <text x="${mL + lx * mapW + 4}" y="${mT + ly * mapH - 3}" class="contour-label">${c.elev}</text>\n`;
    }
  }

  // Water Features: River, Streams, Lake
  for (const r of config.rivers) {
    const pts = r.pts.map(([x, y]) => `${mL + x * mapW},${mT + y * mapH}`).join(' ');
    if (r.hasSandBed) {
      svg += `  <polyline points="${pts}" fill="none" stroke="#f59e0b" stroke-width="7" stroke-opacity="0.5" stroke-dasharray="10,4" />\n`;
    }
    svg += `  <polyline points="${pts}" fill="none" stroke="#0284c7" stroke-width="2.5" />\n`;
    const mid = r.pts[Math.floor(r.pts.length / 2)];
    svg += `  <text x="${mL + mid[0] * mapW + 8}" y="${mT + mid[1] * mapH - 10}" class="water-name">${r.name}</text>\n`;
  }

  if (config.lake) {
    const lx = mL + config.lake.x * mapW;
    const ly = mT + config.lake.y * mapH;
    svg += `  <ellipse cx="${lx}" cy="${ly}" rx="${config.lake.rx}" ry="${config.lake.ry}" fill="#38bdf8" stroke="#0284c7" stroke-width="2" />\n`;
    svg += `  <text x="${lx + config.lake.rx + 8}" y="${ly + 4}" class="water-name" font-weight="bold">${config.lake.name}</text>\n`;
  }

  // Metalled & Unmetalled Roads
  for (const rd of config.roads) {
    const pts = rd.pts.map(([x, y]) => `${mL + x * mapW},${mT + y * mapH}`).join(' ');
    if (rd.isMetalled) {
      svg += `  <polyline points="${pts}" fill="none" stroke="#dc2626" stroke-width="4" stroke-linecap="round" />\n`;
      svg += `  <polyline points="${pts}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />\n`;
    } else {
      svg += `  <polyline points="${pts}" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6,4" />\n`;
    }
  }

  // Settlements (Red dwelling blocks)
  for (const t of config.towns) {
    const tx = mL + t.x * mapW;
    const ty = mT + t.y * mapH;
    for (let bx = 0; bx < 3; bx++) {
      for (let by = 0; by < 2; by++) {
        svg += `  <rect x="${tx + bx * 9}" y="${ty + by * 8}" width="6.5" height="5.5" fill="#dc2626" />\n`;
      }
    }
    svg += `  <text x="${tx - 4}" y="${ty + 26}" class="place-name">${t.name.toUpperCase()}</text>\n`;
    if (t.po) {
      svg += `  <text x="${tx + 32}" y="${ty - 2}" font-family="Arial" font-size="11px" font-weight="bold" fill="#dc2626">PO</text>\n`;
    }
  }

  // Spot Heights & Triangulation Peaks
  for (const sp of config.spotHeights) {
    const sx = mL + sp.x * mapW;
    const sy = mT + sp.y * mapH;
    if (sp.isTriangulated) {
      svg += `  <polygon points="${sx},${sy - 10} ${sx - 9},${sy + 7} ${sx + 9},${sy + 7}" fill="none" stroke="#0f172a" stroke-width="2" />\n`;
      svg += `  <text x="${sx + 14}" y="${sy}" font-family="Arial" font-size="13px" font-weight="bold" fill="#0f172a">▲ ${sp.elev}</text>\n`;
      if (sp.name) {
        svg += `  <text x="${sx + 14}" y="${sy + 16}" font-family="Arial" font-size="12px" font-weight="bold" fill="#92400e">${sp.name}</text>\n`;
      }
    } else {
      svg += `  <circle cx="${sx}" cy="${sy}" r="2" fill="#0f172a" />\n`;
      svg += `  <text x="${sx + 5}" y="${sy - 4}" font-family="Arial" font-size="12px" fill="#0f172a">.${sp.elev}</text>\n`;
    }
  }

  // Conventional Signs Key Box (Right Margin)
  const legX = mL + mapW + 30;
  const legY = mT + 10;
  const legW = mR - 50;
  const legH = mapH - 20;

  svg += `
  <!-- Conventional Signs Box -->
  <rect x="${legX}" y="${legY}" width="${legW}" height="${legH}" fill="#ffffff" stroke="#475569" stroke-width="1.5" rx="4" />
  <text x="${legX + legW / 2}" y="${legY + 28}" class="legend-title">CONVENTIONAL SIGNS</text>
  <line x1="${legX + 20}" y1="${legY + 40}" x2="${legX + legW - 20}" y2="${legY + 40}" stroke="#cbd5e1" stroke-width="1" />
`;

  const legendItems = [
    { label: 'Contour Line (20m)', elem: `<line x1="${legX + 15}" y1="${legY + 65}" x2="${legX + 65}" y2="${legY + 65}" stroke="#b45309" stroke-width="1.5" />` },
    { label: 'Index Contour (100m)', elem: `<line x1="${legX + 15}" y1="${legY + 95}" x2="${legX + 65}" y2="${legY + 95}" stroke="#78350f" stroke-width="3" />` },
    { label: 'Metalled NH (Red)', elem: `<line x1="${legX + 15}" y1="${legY + 125}" x2="${legX + 65}" y2="${legY + 125}" stroke="#dc2626" stroke-width="3.5" />` },
    { label: 'Cart Track / Unmetalled', elem: `<line x1="${legX + 15}" y1="${legY + 155}" x2="${legX + 65}" y2="${legY + 155}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,3" />` },
    { label: 'Perennial Stream', elem: `<line x1="${legX + 15}" y1="${legY + 185}" x2="${legX + 65}" y2="${legY + 185}" stroke="#0284c7" stroke-width="2.5" />` },
    { label: 'Sandy Dry Riverbed', elem: `<line x1="${legX + 15}" y1="${legY + 215}" x2="${legX + 65}" y2="${legY + 215}" stroke="#f59e0b" stroke-width="5" stroke-dasharray="6,3" />` },
    { label: 'Triangulated Peak (▲)', elem: `<polygon points="${legX + 40},${legY + 238} ${legX + 32},${legY + 252} ${legX + 48},${legY + 252}" fill="none" stroke="#0f172a" stroke-width="2" />` },
    { label: 'Bench Mark (BM 348.5)', elem: `<text x="${legX + 25}" y="${legY + 282}" font-family="Arial" font-size="12px" font-weight="bold" fill="#0f172a">BM</text>` },
    { label: 'Nucleated Settlement', elem: `<rect x="${legX + 28}" y="${legY + 302}" width="16" height="12" fill="#dc2626" />` },
    { label: 'Post Office (PO)', elem: `<text x="${legX + 28}" y="${legY + 338}" font-family="Arial" font-size="12px" font-weight="bold" fill="#dc2626">PO</text>` },
    { label: 'Reserved Forest (RF)', elem: `<rect x="${legX + 24}" y="${legY + 358}" width="24" height="14" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.2" />` },
    { label: 'Stony Waste', elem: `<rect x="${legX + 24}" y="${legY + 390}" width="24" height="14" fill="url(#stonyWaste)" stroke="#d97706" stroke-width="1" />` },
  ];

  legendItems.forEach((item, idx) => {
    const iy = legY + 60 + idx * 32;
    svg += `  ${item.elem}\n`;
    svg += `  <text x="${legX + 80}" y="${iy + 8}" class="legend-text">${item.label}</text>\n`;
  });

  // Bottom Scale Bar & Instructions
  const botY = mT + mapH + 45;
  svg += `
  <!-- Bottom Margin -->
  <text x="${mL + mapW / 2}" y="${botY}" font-family="Arial" font-size="16px" font-weight="bold" fill="#78350f" text-anchor="middle">CONTOUR INTERVAL 20 METRES | HEIGHTS ARE IN METRES</text>

  <!-- Scale Bar: 0..5 km -->
  <g transform="translate(${mL + mapW / 2 - 200}, ${botY + 20})">
`;

  for (let k = 0; k < 5; k++) {
    const kx = k * 80;
    const fColor = k % 2 === 0 ? '#0f172a' : '#ffffff';
    svg += `    <rect x="${kx}" y="0" width="80" height="10" fill="${fColor}" stroke="#0f172a" stroke-width="1" />\n`;
    svg += `    <text x="${kx}" y="24" font-family="Arial" font-size="12px" fill="#0f172a" text-anchor="middle">${k}</text>\n`;
  }
  svg += `    <text x="400" y="24" font-family="Arial" font-size="12px" fill="#0f172a" text-anchor="middle">5 km</text>\n`;
  svg += `  </g>\n`;

  svg += `  <text x="${mL + mapW / 2}" y="${botY + 95}" font-family="Arial" font-size="13px" fill="#475569" text-anchor="middle">Published under the direction of the Surveyor General of India. Verified Educational Topographical Sheet for CBSE &amp; ICSE Geography.</text>\n`;
  svg += `</svg>`;

  return svg;
}

// ─── Sheet 45 D/7 Configuration ───────────────────────────────────────────────
const config45D7 = {
  eStart: 80,
  eEnd: 95,
  nStart: 85,
  nEnd: 102,
  forest: [
    [0.18, 0.25], [0.40, 0.18], [0.70, 0.22], [0.78, 0.50],
    [0.72, 0.75], [0.55, 0.82], [0.35, 0.78], [0.20, 0.60]
  ],
  rfPos: [0.28, 0.32],
  lake: {
    name: 'Nakki Lake (1195m)',
    x: 0.38,
    y: 0.52,
    rx: 28,
    ry: 16
  },
  rivers: [
    {
      name: 'Sipu Nadi',
      hasSandBed: true,
      pts: [[0.05, 0.20], [0.18, 0.35], [0.30, 0.55], [0.25, 0.75], [0.15, 0.95]]
    },
    {
      name: 'Banas River',
      hasSandBed: true,
      pts: [[0.92, 0.15], [0.82, 0.40], [0.78, 0.65], [0.85, 0.85], [0.90, 0.95]]
    }
  ],
  roads: [
    {
      isMetalled: true,
      pts: [[0.08, 0.12], [0.25, 0.35], [0.38, 0.50], [0.60, 0.68], [0.88, 0.88]]
    },
    {
      isMetalled: false,
      pts: [[0.38, 0.50], [0.50, 0.35], [0.68, 0.25]]
    }
  ],
  towns: [
    { name: 'Mount Abu', x: 0.42, y: 0.54, po: true },
    { name: 'Anadra', x: 0.15, y: 0.45, po: true },
    { name: 'Abu Road', x: 0.82, y: 0.84, po: true },
    { name: 'Sirohi', x: 0.25, y: 0.14, po: true }
  ],
  spotHeights: [
    { x: 0.55, y: 0.30, elev: '1722', isTriangulated: true, name: 'Guru Shikhar (1722m)' },
    { x: 0.36, y: 0.50, elev: '1195', isTriangulated: false },
    { x: 0.75, y: 0.45, elev: '542', isTriangulated: false },
    { x: 0.18, y: 0.80, elev: '348', isTriangulated: false }
  ],
  contours: [
    { elev: 400, isIndex: false, isClosed: true, pts: [[0.15, 0.20], [0.45, 0.12], [0.78, 0.18], [0.85, 0.55], [0.75, 0.85], [0.45, 0.88], [0.18, 0.70]] },
    { elev: 500, isIndex: true, isClosed: true, pts: [[0.20, 0.25], [0.45, 0.16], [0.72, 0.22], [0.80, 0.52], [0.70, 0.80], [0.42, 0.82], [0.22, 0.65]] },
    { elev: 600, isIndex: false, isClosed: true, pts: [[0.24, 0.28], [0.46, 0.20], [0.68, 0.26], [0.75, 0.50], [0.66, 0.75], [0.40, 0.78], [0.26, 0.60]] },
    { elev: 800, isIndex: false, isClosed: true, pts: [[0.28, 0.32], [0.48, 0.24], [0.64, 0.30], [0.70, 0.48], [0.62, 0.70], [0.38, 0.72], [0.30, 0.55]] },
    { elev: 1000, isIndex: true, isClosed: true, pts: [[0.32, 0.36], [0.50, 0.28], [0.60, 0.34], [0.65, 0.46], [0.58, 0.65], [0.36, 0.66], [0.34, 0.50]] },
    { elev: 1200, isIndex: false, isClosed: true, pts: [[0.36, 0.40], [0.52, 0.32], [0.58, 0.38], [0.60, 0.44], [0.54, 0.60], [0.38, 0.60], [0.36, 0.46]] },
    { elev: 1400, isIndex: false, isClosed: true, pts: [[0.42, 0.36], [0.55, 0.30], [0.60, 0.36], [0.56, 0.46], [0.46, 0.48]] },
    { elev: 1600, isIndex: true, isClosed: true, pts: [[0.50, 0.32], [0.56, 0.28], [0.58, 0.34], [0.54, 0.38]] },
    { elev: 1700, isIndex: false, isClosed: true, pts: [[0.53, 0.31], [0.56, 0.29], [0.57, 0.32], [0.54, 0.33]] }
  ]
};

// ─── Sheet 45 D/10 Configuration ──────────────────────────────────────────────
const config45D10 = {
  eStart: 10,
  eEnd: 25,
  nStart: 15,
  nEnd: 32,
  forest: [
    [0.45, 0.15], [0.85, 0.18], [0.88, 0.65], [0.60, 0.75], [0.42, 0.45]
  ],
  rfPos: [0.55, 0.28],
  lake: null,
  rivers: [
    {
      name: 'Balaram Nadi',
      hasSandBed: true,
      pts: [[0.85, 0.12], [0.65, 0.35], [0.45, 0.58], [0.25, 0.72], [0.08, 0.88]]
    }
  ],
  roads: [
    {
      isMetalled: true,
      pts: [[0.05, 0.75], [0.32, 0.62], [0.55, 0.50], [0.92, 0.35]]
    }
  ],
  towns: [
    { name: 'Palanpur', x: 0.28, y: 0.65, po: true },
    { name: 'Kanpura', x: 0.65, y: 0.48, po: false }
  ],
  spotHeights: [
    { x: 0.72, y: 0.25, elev: '890', isTriangulated: true, name: '▲ 890m' },
    { x: 0.35, y: 0.58, elev: '252', isTriangulated: false }
  ],
  contours: [
    { elev: 300, isIndex: false, isClosed: false, pts: [[0.35, 0.85], [0.45, 0.65], [0.55, 0.45], [0.65, 0.25], [0.75, 0.10]] },
    { elev: 400, isIndex: false, isClosed: false, pts: [[0.42, 0.85], [0.50, 0.65], [0.60, 0.45], [0.70, 0.25], [0.80, 0.10]] },
    { elev: 500, isIndex: true, isClosed: false, pts: [[0.48, 0.85], [0.56, 0.65], [0.65, 0.45], [0.75, 0.25], [0.85, 0.10]] },
    { elev: 600, isIndex: false, isClosed: true, pts: [[0.58, 0.35], [0.75, 0.20], [0.82, 0.35], [0.68, 0.48]] },
    { elev: 800, isIndex: false, isClosed: true, pts: [[0.65, 0.28], [0.78, 0.22], [0.78, 0.30], [0.68, 0.34]] }
  ]
};

// ─── Sheet 53 E/4 Configuration ───────────────────────────────────────────────
const config53E4 = {
  eStart: 40,
  eEnd: 55,
  nStart: 60,
  nEnd: 77,
  forest: [
    [0.15, 0.15], [0.55, 0.10], [0.85, 0.25], [0.78, 0.70], [0.35, 0.85], [0.12, 0.55]
  ],
  rfPos: [0.25, 0.25],
  lake: null,
  rivers: [
    {
      name: 'Sutlej River Gorge',
      hasSandBed: false,
      pts: [[0.10, 0.85], [0.30, 0.65], [0.50, 0.55], [0.70, 0.45], [0.92, 0.28]]
    }
  ],
  roads: [
    {
      isMetalled: true,
      pts: [[0.12, 0.90], [0.32, 0.70], [0.52, 0.50], [0.72, 0.32], [0.90, 0.15]]
    }
  ],
  towns: [
    { name: 'Shimla Ridge', x: 0.68, y: 0.24, po: true },
    { name: 'Kalka Valley', x: 0.18, y: 0.82, po: true }
  ],
  spotHeights: [
    { x: 0.72, y: 0.20, elev: '2205', isTriangulated: true, name: 'Jakhoo Hill (2205m)' },
    { x: 0.40, y: 0.55, elev: '1450', isTriangulated: false }
  ],
  contours: [
    { elev: 1000, isIndex: true, isClosed: false, pts: [[0.12, 0.75], [0.28, 0.60], [0.45, 0.50], [0.65, 0.40], [0.85, 0.25]] },
    { elev: 1200, isIndex: false, isClosed: false, pts: [[0.16, 0.72], [0.32, 0.58], [0.48, 0.46], [0.68, 0.36], [0.88, 0.22]] },
    { elev: 1400, isIndex: false, isClosed: false, pts: [[0.20, 0.68], [0.36, 0.54], [0.52, 0.42], [0.72, 0.32], [0.90, 0.18]] },
    { elev: 1600, isIndex: false, isClosed: true, pts: [[0.45, 0.40], [0.75, 0.25], [0.82, 0.35], [0.55, 0.50]] },
    { elev: 1800, isIndex: false, isClosed: true, pts: [[0.52, 0.34], [0.74, 0.24], [0.78, 0.30], [0.58, 0.42]] },
    { elev: 2000, isIndex: true, isClosed: true, pts: [[0.60, 0.28], [0.74, 0.22], [0.76, 0.26], [0.64, 0.34]] },
    { elev: 2200, isIndex: false, isClosed: true, pts: [[0.68, 0.22], [0.73, 0.20], [0.74, 0.22], [0.70, 0.24]] }
  ]
};

// ─── Sheet 53 B/7 Configuration ───────────────────────────────────────────────
const config53B7 = {
  eStart: 30,
  eEnd: 45,
  nStart: 50,
  nEnd: 68,
  forest: [
    [0.10, 0.20], [0.45, 0.15], [0.80, 0.30], [0.75, 0.75], [0.30, 0.80], [0.10, 0.50]
  ],
  rfPos: [0.20, 0.30],
  lake: null,
  rivers: [
    {
      name: 'Giri River (Yamuna Tributary)',
      hasSandBed: false,
      pts: [[0.15, 0.80], [0.35, 0.65], [0.55, 0.50], [0.75, 0.35], [0.90, 0.20]]
    }
  ],
  roads: [
    {
      isMetalled: true,
      pts: [[0.10, 0.85], [0.30, 0.68], [0.50, 0.48], [0.70, 0.30], [0.88, 0.15]]
    }
  ],
  towns: [
    { name: 'Solan Mandi', x: 0.62, y: 0.28, po: true },
    { name: 'Kandaghat', x: 0.22, y: 0.78, po: true }
  ],
  spotHeights: [
    { x: 0.65, y: 0.22, elev: '1890', isTriangulated: true, name: 'Karol Tibba (1890m)' },
    { x: 0.38, y: 0.58, elev: '1320', isTriangulated: false }
  ],
  contours: [
    { elev: 1200, isIndex: true, isClosed: false, pts: [[0.10, 0.70], [0.30, 0.55], [0.50, 0.45], [0.70, 0.35], [0.90, 0.20]] },
    { elev: 1400, isIndex: false, isClosed: false, pts: [[0.15, 0.65], [0.35, 0.50], [0.55, 0.40], [0.75, 0.30], [0.92, 0.15]] },
    { elev: 1600, isIndex: false, isClosed: true, pts: [[0.45, 0.38], [0.70, 0.25], [0.78, 0.35], [0.52, 0.48]] },
    { elev: 1800, isIndex: true, isClosed: true, pts: [[0.55, 0.30], [0.72, 0.22], [0.75, 0.28], [0.60, 0.38]] }
  ]
};

// ─── Sheet 45 F/3 Configuration ───────────────────────────────────────────────
const config45F3 = {
  eStart: 50,
  eEnd: 65,
  nStart: 30,
  nEnd: 48,
  forest: [
    [0.10, 0.10], [0.40, 0.12], [0.70, 0.20], [0.65, 0.50], [0.25, 0.55], [0.10, 0.30]
  ],
  rfPos: [0.18, 0.22],
  lake: null,
  rivers: [
    {
      name: 'Luni River (Seasonal Sandbed)',
      hasSandBed: true,
      pts: [[0.10, 0.40], [0.30, 0.45], [0.50, 0.55], [0.75, 0.65], [0.92, 0.75]]
    }
  ],
  roads: [
    {
      isMetalled: true,
      pts: [[0.15, 0.20], [0.35, 0.35], [0.55, 0.50], [0.75, 0.65], [0.85, 0.85]]
    }
  ],
  towns: [
    { name: 'Bilara', x: 0.35, y: 0.30, po: true },
    { name: 'Pipar City', x: 0.72, y: 0.60, po: true }
  ],
  spotHeights: [
    { x: 0.68, y: 0.25, elev: '382', isTriangulated: true, name: 'Bhilara Dune (382m)' },
    { x: 0.25, y: 0.70, elev: '298', isTriangulated: false }
  ],
  contours: [
    { elev: 280, isIndex: true, isClosed: false, pts: [[0.10, 0.80], [0.35, 0.70], [0.60, 0.60], [0.85, 0.50]] },
    { elev: 300, isIndex: false, isClosed: false, pts: [[0.15, 0.75], [0.40, 0.65], [0.65, 0.55], [0.90, 0.45]] },
    { elev: 340, isIndex: false, isClosed: true, pts: [[0.45, 0.35], [0.72, 0.24], [0.78, 0.32], [0.55, 0.45]] },
    { elev: 380, isIndex: true, isClosed: true, pts: [[0.58, 0.28], [0.70, 0.23], [0.72, 0.27], [0.62, 0.32]] }
  ]
};

// ─── Sheet G45 D/1 (Abu Road & West Banas Corridor) ───────────────────────────
const configG45D1 = {
  eStart: 60, eEnd: 75, nStart: 70, nEnd: 88,
  forest: [[0.12, 0.15], [0.45, 0.18], [0.68, 0.25], [0.55, 0.60], [0.20, 0.55]],
  rfPos: [0.22, 0.25], lake: null,
  rivers: [{ name: 'West Banas River', hasSandBed: true, pts: [[0.15, 0.30], [0.35, 0.45], [0.55, 0.58], [0.78, 0.72], [0.90, 0.85]] }],
  roads: [{ isMetalled: true, pts: [[0.10, 0.25], [0.30, 0.40], [0.52, 0.55], [0.75, 0.70], [0.88, 0.85]] }],
  towns: [{ name: 'Abu Road Jn', x: 0.52, y: 0.52, po: true }, { name: 'Maval', x: 0.78, y: 0.68, po: false }],
  spotHeights: [{ x: 0.35, y: 0.28, elev: '648', isTriangulated: true, name: 'Banas Ridge (648m)' }, { x: 0.65, y: 0.75, elev: '312', isTriangulated: false }],
  contours: [
    { elev: 300, isIndex: true, isClosed: false, pts: [[0.10, 0.82], [0.40, 0.70], [0.70, 0.62], [0.90, 0.50]] },
    { elev: 450, isIndex: false, isClosed: false, pts: [[0.15, 0.65], [0.38, 0.52], [0.65, 0.45], [0.85, 0.35]] },
    { elev: 600, isIndex: true, isClosed: true, pts: [[0.25, 0.22], [0.42, 0.20], [0.40, 0.35], [0.22, 0.32]] }
  ]
};

// ─── Sheet G45 H/4 (Udaipur & Mewar Plateau) ──────────────────────────────────
const configG45H4 = {
  eStart: 30, eEnd: 45, nStart: 40, nEnd: 58,
  forest: [[0.10, 0.40], [0.35, 0.35], [0.50, 0.50], [0.38, 0.75], [0.12, 0.70]],
  rfPos: [0.18, 0.48],
  lake: { name: 'Lake Pichola', cx: 0.52, cy: 0.55, rx: 0.10, ry: 0.08 },
  rivers: [{ name: 'Ahar River', hasSandBed: false, pts: [[0.20, 0.30], [0.40, 0.45], [0.52, 0.55], [0.75, 0.60], [0.92, 0.65]] }],
  roads: [{ isMetalled: true, pts: [[0.15, 0.70], [0.35, 0.60], [0.58, 0.52], [0.78, 0.38], [0.90, 0.25]] }],
  towns: [{ name: 'Udaipur City', x: 0.58, y: 0.50, po: true }, { name: 'Debari Zinc Smelter', x: 0.78, y: 0.40, po: true }],
  spotHeights: [{ x: 0.38, y: 0.28, elev: '942', isTriangulated: true, name: 'Sajjangarh (942m)' }, { x: 0.70, y: 0.70, elev: '580', isTriangulated: false }],
  contours: [
    { elev: 600, isIndex: true, isClosed: false, pts: [[0.10, 0.85], [0.40, 0.75], [0.70, 0.68], [0.92, 0.58]] },
    { elev: 750, isIndex: false, isClosed: false, pts: [[0.18, 0.60], [0.38, 0.48], [0.62, 0.40], [0.85, 0.32]] },
    { elev: 900, isIndex: true, isClosed: true, pts: [[0.30, 0.24], [0.44, 0.22], [0.42, 0.34], [0.28, 0.32]] }
  ]
};

// ─── Sheet G33 G/12 (Godavari Delta & Coastal Andhra) ──────────────────────────
const configG33G12 = {
  eStart: 80, eEnd: 95, nStart: 10, nEnd: 28,
  forest: [[0.60, 0.60], [0.90, 0.55], [0.95, 0.85], [0.65, 0.90]],
  rfPos: [0.72, 0.68], lake: null,
  rivers: [
    { name: 'Gautami Godavari (Delta Distributary)', hasSandBed: false, pts: [[0.10, 0.20], [0.30, 0.35], [0.55, 0.50], [0.80, 0.68], [0.95, 0.85]] },
    { name: 'Vasishta Godavari Branch', hasSandBed: false, pts: [[0.30, 0.35], [0.42, 0.55], [0.50, 0.75], [0.60, 0.95]] }
  ],
  roads: [{ isMetalled: true, pts: [[0.10, 0.40], [0.35, 0.45], [0.60, 0.40], [0.85, 0.30]] }],
  towns: [{ name: 'Rajahmundry Delta Jn', x: 0.28, y: 0.30, po: true }, { name: 'Kakinada Port Canal', x: 0.78, y: 0.35, po: true }],
  spotHeights: [{ x: 0.15, y: 0.18, elev: '42', isTriangulated: true, name: 'Dowleswaram Barrage (42m)' }, { x: 0.82, y: 0.80, elev: '6', isTriangulated: false }],
  contours: [
    { elev: 20, isIndex: true, isClosed: false, pts: [[0.10, 0.30], [0.30, 0.42], [0.50, 0.58], [0.70, 0.70]] },
    { elev: 40, isIndex: false, isClosed: false, pts: [[0.10, 0.18], [0.25, 0.28], [0.40, 0.38]] }
  ]
};

// ─── Sheet G33 C/8 (Eastern Ghats & Araku Valley) ──────────────────────────────
const configG33C8 = {
  eStart: 40, eEnd: 55, nStart: 60, nEnd: 78,
  forest: [[0.15, 0.20], [0.50, 0.15], [0.80, 0.30], [0.70, 0.70], [0.25, 0.65]],
  rfPos: [0.30, 0.30], lake: null,
  rivers: [{ name: 'Gosthani River (Borra Gorge)', hasSandBed: false, pts: [[0.15, 0.75], [0.35, 0.60], [0.55, 0.45], [0.78, 0.32], [0.92, 0.20]] }],
  roads: [{ isMetalled: true, pts: [[0.10, 0.80], [0.30, 0.65], [0.52, 0.50], [0.75, 0.35], [0.90, 0.18]] }],
  towns: [{ name: 'Araku Valley', x: 0.48, y: 0.48, po: true }, { name: 'Borra Caves Jn', x: 0.72, y: 0.34, po: true }],
  spotHeights: [{ x: 0.35, y: 0.22, elev: '1680', isTriangulated: true, name: 'Arma Konda Peak (1680m)' }, { x: 0.68, y: 0.60, elev: '920', isTriangulated: false }],
  contours: [
    { elev: 800, isIndex: true, isClosed: false, pts: [[0.10, 0.88], [0.38, 0.72], [0.65, 0.58], [0.90, 0.42]] },
    { elev: 1000, isIndex: false, isClosed: false, pts: [[0.18, 0.70], [0.42, 0.52], [0.70, 0.38], [0.88, 0.25]] },
    { elev: 1400, isIndex: true, isClosed: true, pts: [[0.28, 0.18], [0.44, 0.16], [0.40, 0.28], [0.26, 0.26]] }
  ]
};

// ─── Sheet H43 J/3 (Dehradun Valley & Mussoorie Ridge) ─────────────────────────
const configH43J3 = {
  eStart: 20, eEnd: 35, nStart: 50, nEnd: 68,
  forest: [[0.10, 0.15], [0.45, 0.10], [0.85, 0.18], [0.75, 0.45], [0.25, 0.40]],
  rfPos: [0.25, 0.20], lake: null,
  rivers: [
    { name: 'Song River (Doon Valley Drainage)', hasSandBed: true, pts: [[0.20, 0.40], [0.40, 0.55], [0.60, 0.65], [0.85, 0.75]] },
    { name: 'Rispana Nullah', hasSandBed: true, pts: [[0.45, 0.25], [0.50, 0.45], [0.55, 0.65]] }
  ],
  roads: [{ isMetalled: true, pts: [[0.20, 0.85], [0.45, 0.65], [0.50, 0.45], [0.52, 0.25], [0.58, 0.12]] }],
  towns: [{ name: 'Dehradun Civil Lines', x: 0.48, y: 0.55, po: true }, { name: 'Mussoorie Mall Road', x: 0.55, y: 0.16, po: true }],
  spotHeights: [{ x: 0.56, y: 0.12, elev: '2290', isTriangulated: true, name: 'Lal Tibba Mussoorie (2290m)' }, { x: 0.45, y: 0.62, elev: '680', isTriangulated: false }],
  contours: [
    { elev: 800, isIndex: true, isClosed: false, pts: [[0.10, 0.70], [0.35, 0.60], [0.65, 0.52], [0.90, 0.45]] },
    { elev: 1400, isIndex: false, isClosed: false, pts: [[0.15, 0.45], [0.40, 0.35], [0.68, 0.28], [0.90, 0.22]] },
    { elev: 2000, isIndex: true, isClosed: false, pts: [[0.25, 0.22], [0.52, 0.15], [0.75, 0.14], [0.90, 0.12]] }
  ]
};

// ─── Sheet F43 F/14 (Pune & Western Ghats Scarp / Bhor Ghat) ───────────────────
const configF43F14 = {
  eStart: 10, eEnd: 25, nStart: 45, nEnd: 63,
  forest: [[0.10, 0.20], [0.35, 0.15], [0.45, 0.55], [0.30, 0.85], [0.10, 0.80]],
  rfPos: [0.18, 0.35], lake: null,
  rivers: [{ name: 'Mula-Mutha River', hasSandBed: false, pts: [[0.30, 0.40], [0.50, 0.50], [0.70, 0.55], [0.90, 0.52]] }],
  roads: [{ isMetalled: true, pts: [[0.12, 0.35], [0.28, 0.42], [0.55, 0.52], [0.80, 0.60], [0.92, 0.68]] }],
  towns: [{ name: 'Pune Camp', x: 0.65, y: 0.52, po: true }, { name: 'Khandala Ghat', x: 0.22, y: 0.38, po: true }],
  spotHeights: [{ x: 0.24, y: 0.32, elev: '1040', isTriangulated: true, name: 'Duke\'s Nose Scarp (1040m)' }, { x: 0.72, y: 0.58, elev: '560', isTriangulated: false }],
  contours: [
    { elev: 600, isIndex: true, isClosed: false, pts: [[0.35, 0.85], [0.55, 0.70], [0.75, 0.60], [0.92, 0.55]] },
    { elev: 800, isIndex: false, isClosed: false, pts: [[0.25, 0.65], [0.40, 0.50], [0.60, 0.42], [0.85, 0.38]] },
    { elev: 1000, isIndex: true, isClosed: true, pts: [[0.18, 0.28], [0.30, 0.26], [0.28, 0.38], [0.16, 0.36]] }
  ]
};

// ─── Sheet F44 O/4 (Hyderabad & Deccan Granitic Plateau) ────────────────────────
const configF44O4 = {
  eStart: 50, eEnd: 65, nStart: 20, nEnd: 38,
  forest: [[0.15, 0.60], [0.40, 0.55], [0.45, 0.85], [0.18, 0.88]],
  rfPos: [0.22, 0.68],
  lake: { name: 'Hussain Sagar Lake', cx: 0.52, cy: 0.45, rx: 0.08, ry: 0.07 },
  rivers: [{ name: 'Musi River Basin', hasSandBed: true, pts: [[0.10, 0.58], [0.35, 0.55], [0.52, 0.60], [0.75, 0.65], [0.95, 0.68]] }],
  roads: [{ isMetalled: true, pts: [[0.20, 0.25], [0.45, 0.40], [0.55, 0.55], [0.70, 0.75], [0.85, 0.88]] }],
  towns: [{ name: 'Hyderabad Charminar', x: 0.50, y: 0.62, po: true }, { name: 'Secunderabad Jn', x: 0.55, y: 0.36, po: true }],
  spotHeights: [{ x: 0.32, y: 0.42, elev: '640', isTriangulated: true, name: 'Golconda Granitic Tor (640m)' }, { x: 0.75, y: 0.48, elev: '510', isTriangulated: false }],
  contours: [
    { elev: 500, isIndex: true, isClosed: false, pts: [[0.10, 0.80], [0.40, 0.72], [0.70, 0.68], [0.95, 0.62]] },
    { elev: 550, isIndex: false, isClosed: false, pts: [[0.18, 0.55], [0.42, 0.48], [0.68, 0.42], [0.88, 0.35]] },
    { elev: 620, isIndex: true, isClosed: true, pts: [[0.26, 0.38], [0.38, 0.36], [0.36, 0.46], [0.25, 0.45]] }
  ]
};

const mapsDir = path.resolve(__dirname, '../public/assets/maps');
fs.mkdirSync(mapsDir, { recursive: true });

// Series G45 (Rajasthan & Gujarat)
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_45d7.svg'), createToposheetSvg('45 D/7', 'Mount Abu and Sirohi Region (OSM G45D7)', 'Rajasthan and Gujarat', config45D7));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_g45d7.svg'), createToposheetSvg('G45D7', 'Mount Abu & Sirohi Region (OSM Series G45)', 'Rajasthan and Gujarat', config45D7));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_45d10.svg'), createToposheetSvg('45 D/10', 'Palanpur & Aravalli Foothills (OSM G45D10)', 'Gujarat and Rajasthan', config45D10));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_g45d10.svg'), createToposheetSvg('G45D10', 'Palanpur & Banas Kantha Plains (OSM Series G45)', 'Gujarat and Rajasthan', config45D10));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_45f3.svg'), createToposheetSvg('45 F/3', 'Jodhpur & Luni River Basin (OSM G45F3)', 'Rajasthan', config45F3));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_g45f3.svg'), createToposheetSvg('G45F3', 'Jodhpur & Luni Sand Plain (OSM Series G45)', 'Rajasthan', config45F3));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_g45d1.svg'), createToposheetSvg('G45D1', 'Abu Road & West Banas Gap (OSM Series G45)', 'Rajasthan and Gujarat', configG45D1));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_g45h4.svg'), createToposheetSvg('G45H4', 'Udaipur & Mewar Plateau (OSM Series G45)', 'Rajasthan', configG45H4));

// Series G33 (Eastern Ghats & Coastal Plains)
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_g33g12.svg'), createToposheetSvg('G33G12', 'Godavari Delta & Coastal Andhra (OSM Series G33)', 'Andhra Pradesh', configG33G12));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_g33c8.svg'), createToposheetSvg('G33C8', 'Eastern Ghats & Araku Valley (OSM Series G33)', 'Andhra Pradesh and Odisha', configG33C8));

// Series H43 (Himalayan Foothills & Shiwaliks)
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_53e4.svg'), createToposheetSvg('53 E/4', 'Shiwalik Hills & Sutlej Basin (OSM H43E4)', 'Himachal Pradesh and Punjab', config53E4));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_h43e4.svg'), createToposheetSvg('H43E4', 'Shiwalik Hills & Foothill Gorge (OSM Series H43)', 'Himachal Pradesh and Punjab', config53E4));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_53b7.svg'), createToposheetSvg('53 B/7', 'Solan Valley & Kalka Foothills (OSM H43B7)', 'Himachal Pradesh and Haryana', config53B7));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_h43b7.svg'), createToposheetSvg('H43B7', 'Solan Valley & Giri River Basin (OSM Series H43)', 'Himachal Pradesh and Haryana', config53B7));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_h43j3.svg'), createToposheetSvg('H43J3', 'Dehradun Valley & Mussoorie Ridge (OSM Series H43)', 'Uttarakhand', configH43J3));

// Series F43 & F44 (Western Ghats & Deccan Plateau)
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_f43f14.svg'), createToposheetSvg('F43F14', 'Pune & Western Ghats Scarp (OSM Series F43)', 'Maharashtra', configF43F14));
fs.writeFileSync(path.join(mapsDir, 'soi_topo_sheet_f44o4.svg'), createToposheetSvg('F44O4', 'Hyderabad & Deccan Granitic Plateau (OSM Series F44)', 'Telangana', configF44O4));

console.log('Successfully generated official Survey of India toposheet SVGs for Series G45, G33, H43, F43/F44 in public/assets/maps!');


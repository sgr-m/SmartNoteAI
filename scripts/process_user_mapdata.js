/**
 * Script: process_user_mapdata.js
 * Converts all official Survey of India maps from assets/MapsData (PDFs)
 * into high-resolution classroom images in public/assets/maps and dist/renderer/assets/maps
 */

const fs = require('fs');
const path = require('path');
const canvasModule = require('@napi-rs/canvas');

global.Path2D = canvasModule.Path2D;
global.ImageData = canvasModule.ImageData;
global.DOMMatrix = canvasModule.DOMMatrix;
global.Image = canvasModule.Image;

const rootDir = path.resolve(__dirname, '..');
const mapsDataDir = path.join(rootDir, 'assets/MapsData');
const eduMapsDir = path.join(mapsDataDir, 'Educational Maps');
const publicMapsDir = path.join(rootDir, 'public/assets/maps');
const distMapsDir = path.join(rootDir, 'dist/renderer/assets/maps');

if (!fs.existsSync(publicMapsDir)) fs.mkdirSync(publicMapsDir, { recursive: true });
if (!fs.existsSync(distMapsDir)) fs.mkdirSync(distMapsDir, { recursive: true });

const MAPS_TO_PROCESS = [
  // ─── 1. Outline & Educational Worksheet Maps ──────────────────────────────
  {
    pdfPath: path.join(mapsDataDir, 'Outline_map_of_India.pdf'),
    outputName: 'soi_outline_map_blank.jpg',
    scale: 4.0,
    title: 'Official Blank Outline Map of India',
  },
  {
    pdfPath: path.join(mapsDataDir, 'Outline_Map_of_India_with_Rivers.pdf'),
    outputName: 'soi_outline_map_with_rivers.jpg',
    scale: 4.0,
    title: 'Outline Map of India with Major Rivers',
  },
  {
    pdfPath: path.join(mapsDataDir, 'Outline_Map_of_India_with_State_Boundary.pdf'),
    outputName: 'soi_outline_map_with_state_boundary.jpg',
    scale: 4.0,
    title: 'Outline Map of India with State Boundaries',
  },
  {
    pdfPath: path.join(mapsDataDir, 'Outline_Map_of_India_with_State_Name.pdf'),
    outputName: 'soi_outline_map_with_state_names.jpg',
    scale: 4.0,
    title: 'Outline Map of India with State Names & Capitals',
  },

  // ─── 2. Survey of India National & World Atlas Maps ───────────────────────
  {
    pdfPath: path.join(mapsDataDir, 'POLMAP_ENGLISH_23JAN2026_NEW_UPDATED.pdf'),
    outputName: 'soi_political_map_india_2026_official.jpg',
    scale: 1.8,
    title: 'Official Political Map of India (Latest 2026 Edition)',
  },
  {
    pdfPath: path.join(mapsDataDir, 'physicalmap-en.pdf'),
    outputName: 'soi_physical_map_india_official_hd.jpg',
    scale: 1.8,
    title: 'Official Physical Map of India (Survey of India Edition)',
  },
  {
    pdfPath: path.join(mapsDataDir, 'FINAL_RAIL_MAP_10M_ENG_23rdEdn2026.pdf'),
    outputName: 'soi_railway_map_india_2026.jpg',
    scale: 3.5,
    title: 'Official Indian Railways Network Map (23rd Edn 2026)',
  },
  {
    pdfPath: path.join(mapsDataDir, 'Worldmap with rivers name-en.pdf'),
    outputName: 'soi_world_map_with_rivers_official.jpg',
    scale: 1.8,
    title: 'Survey of India World Map with Major Rivers (English)',
  },

  // ─── 3. Authentic 1:50,000 Open Series Toposheets ─────────────────────────
  {
    pdfPath: path.join(eduMapsDir, '45D7_G43S7.pdf'),
    outputName: 'soi_topo_sheet_45d7_official.jpg',
    scale: 1.6,
    title: 'OSM Toposheet 45D/7 (G43S7) — Mount Abu & Aravalli Range',
  },
  {
    pdfPath: path.join(eduMapsDir, '45D10_G43S10.pdf'),
    outputName: 'soi_topo_sheet_45d10_official.jpg',
    scale: 2.0,
    title: 'OSM Toposheet 45D/10 (G43S10) — Palanpur & Banas Valley',
  },
  {
    pdfPath: path.join(eduMapsDir, '45F3_G43H3.pdf'),
    outputName: 'soi_topo_sheet_45f3_official.jpg',
    scale: 1.8,
    title: 'OSM Toposheet 45F/3 (G43H3) — Jodhpur & Luni Inland Basin',
  },
  {
    pdfPath: path.join(eduMapsDir, '53B7_H43K7.pdf'),
    outputName: 'soi_topo_sheet_53b7_official.jpg',
    scale: 2.2,
    title: 'OSM Toposheet 53B/7 (H43K7) — Solan, Kalka & Shiwalik',
  },
  {
    pdfPath: path.join(mapsDataDir, 'H43F16_53E16.pdf'),
    outputName: 'soi_topo_sheet_53e16_official.jpg',
    scale: 2.2,
    title: 'OSM Toposheet H43F16 / 53E16 — Shimla & Giri River Catchment',
  },
  {
    pdfPath: path.join(eduMapsDir, '56D11_E43W11.pdf'),
    outputName: 'soi_topo_sheet_56d11_official.jpg',
    scale: 2.0,
    title: 'OSM Toposheet 56D/11 (E43W11) — Gulbarga & Bhima-Krishna Basin',
  },
  {
    pdfPath: path.join(eduMapsDir, '63K12_G44Q12.pdf'),
    outputName: 'soi_topo_sheet_63k12_official.jpg',
    scale: 2.2,
    title: 'OSM Toposheet 63K/12 (G44Q12) — Mirzapur & Vindhyan Escarpment',
  },
  {
    pdfPath: path.join(eduMapsDir, '64P13_F44X13.pdf'),
    outputName: 'soi_topo_sheet_64p13_official.jpg',
    scale: 2.0,
    title: 'OSM Toposheet 64P/13 (F44X13) — Balangir & Eastern Ghats',
  },
];

async function main() {
  const pdfjsLib = await import('pdfjs-dist');
  console.log(`Starting processing of ${MAPS_TO_PROCESS.length} official Survey of India maps from assets/MapsData...`);

  for (let i = 0; i < MAPS_TO_PROCESS.length; i++) {
    const item = MAPS_TO_PROCESS[i];
    console.log(`[${i + 1}/${MAPS_TO_PROCESS.length}] Processing: ${path.basename(item.pdfPath)} -> ${item.outputName}`);

    if (!fs.existsSync(item.pdfPath)) {
      console.warn(`  WARNING: File not found: ${item.pdfPath}`);
      continue;
    }

    const t0 = Date.now();
    const data = new Uint8Array(fs.readFileSync(item.pdfPath));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: item.scale });

    const canvas = canvasModule.createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const ctx = canvas.getContext('2d');

    // Fill white background before rendering
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const jpegBuffer = canvas.toBuffer('image/jpeg', 85);
    const pubOut = path.join(publicMapsDir, item.outputName);
    const distOut = path.join(distMapsDir, item.outputName);

    fs.writeFileSync(pubOut, jpegBuffer);
    fs.writeFileSync(distOut, jpegBuffer);

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const sizeMb = (jpegBuffer.length / 1024 / 1024).toFixed(2);
    console.log(`  ✓ Created ${item.outputName} (${viewport.width}x${viewport.height}, ${sizeMb} MB) in ${elapsed}s`);
  }

  console.log('\nAll Survey of India maps successfully converted and deployed to public/assets/maps & dist/renderer/assets/maps!');
}

main().catch((err) => {
  console.error('Fatal error during map processing:', err);
  process.exit(1);
});

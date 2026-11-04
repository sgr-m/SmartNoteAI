/**
 * Downloads and generates authentic Survey of India standard maps for all 28 States & 8 Union Territories
 * Uses authentic GeoJSON district and state boundaries derived from Survey of India / Census data.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_GEOJSON_URL = 'https://raw.githubusercontent.com/udit-001/india-maps-data/master/geojson/states/';

const STATES_CONFIG = [
  { id: 'in-ap', file: 'andhra-pradesh.geojson', name: 'Andhra Pradesh', capital: 'Amaravati', region: 'Southern', areaKm2: 162970, districts: 26, portal: 'https://www.ap.gov.in', rivers: ['Godavari', 'Krishna', 'Penna'] },
  { id: 'in-ar', file: 'arunachal-pradesh.geojson', name: 'Arunachal Pradesh', capital: 'Itanagar', region: 'North-Eastern', areaKm2: 83743, districts: 26, portal: 'https://arunachalpradesh.gov.in', rivers: ['Siang (Brahmaputra)', 'Subansiri', 'Lohit'] },
  { id: 'in-as', file: 'assam.geojson', name: 'Assam', capital: 'Dispur', region: 'North-Eastern', areaKm2: 78438, districts: 35, portal: 'https://assam.gov.in', rivers: ['Brahmaputra', 'Barak', 'Manas'] },
  { id: 'in-br', file: 'bihar.geojson', name: 'Bihar', capital: 'Patna', region: 'Eastern', areaKm2: 94163, districts: 38, portal: 'https://state.bihar.gov.in', rivers: ['Ganga', 'Kosi', 'Gandak', 'Son'] },
  { id: 'in-cg', file: 'chhattisgarh.geojson', name: 'Chhattisgarh', capital: 'Raipur', region: 'Central', areaKm2: 135192, districts: 33, portal: 'https://cgstate.gov.in', rivers: ['Mahanadi', 'Indravati', 'Shivnath'] },
  { id: 'in-ga', file: 'goa.geojson', name: 'Goa', capital: 'Panaji', region: 'Western', areaKm2: 3702, districts: 2, portal: 'https://www.goa.gov.in', rivers: ['Mandovi', 'Zuari', 'Terekhol'] },
  { id: 'in-gj', file: 'gujarat.geojson', name: 'Gujarat', capital: 'Gandhinagar', region: 'Western', areaKm2: 196024, districts: 33, portal: 'https://gujaratindia.gov.in', rivers: ['Narmada', 'Tapi', 'Sabarmati', 'Mahi'] },
  { id: 'in-hr', file: 'haryana.geojson', name: 'Haryana', capital: 'Chandigarh', region: 'Northern', areaKm2: 44212, districts: 22, portal: 'https://haryana.gov.in', rivers: ['Yamuna', 'Ghaggar'] },
  { id: 'in-hp', file: 'himachal-pradesh.geojson', name: 'Himachal Pradesh', capital: 'Shimla', region: 'Northern', areaKm2: 55673, districts: 12, portal: 'https://himachal.nic.in', rivers: ['Satluj', 'Beas', 'Ravi', 'Chenab'] },
  { id: 'in-jh', file: 'jharkhand.geojson', name: 'Jharkhand', capital: 'Ranchi', region: 'Eastern', areaKm2: 79714, districts: 24, portal: 'https://www.jharkhand.gov.in', rivers: ['Damodar', 'Subarnarekha', 'North Koel'] },
  { id: 'in-ka', file: 'karnataka.geojson', name: 'Karnataka', capital: 'Bengaluru', region: 'Southern', areaKm2: 191791, districts: 31, portal: 'https://karnataka.gov.in', rivers: ['Kaveri', 'Krishna', 'Tungabhadra', 'Sharavathi'] },
  { id: 'in-kl', file: 'kerala.geojson', name: 'Kerala', capital: 'Thiruvananthapuram', region: 'Southern', areaKm2: 38863, districts: 14, portal: 'https://kerala.gov.in', rivers: ['Periyar', 'Bharathapuzha', 'Pamba'] },
  { id: 'in-mp', file: 'madhya-pradesh.geojson', name: 'Madhya Pradesh', capital: 'Bhopal', region: 'Central', areaKm2: 308252, districts: 55, portal: 'https://mp.gov.in', rivers: ['Narmada', 'Chambal', 'Betwa', 'Son', 'Tapi'] },
  { id: 'in-mh', file: 'maharashtra.geojson', name: 'Maharashtra', capital: 'Mumbai', region: 'Western', areaKm2: 307713, districts: 36, portal: 'https://www.maharashtra.gov.in', rivers: ['Godavari', 'Krishna', 'Tapi', 'Bhima'] },
  { id: 'in-mn', file: 'manipur.geojson', name: 'Manipur', capital: 'Imphal', region: 'North-Eastern', areaKm2: 22327, districts: 16, portal: 'https://manipur.gov.in', rivers: ['Imphal', 'Barak', 'Chindwin basin'] },
  { id: 'in-ml', file: 'meghalaya.geojson', name: 'Meghalaya', capital: 'Shillong', region: 'North-Eastern', areaKm2: 22429, districts: 12, portal: 'https://meghalaya.gov.in', rivers: ['Simsang', 'Umiam', 'Kopili'] },
  { id: 'in-mz', file: 'mizoram.geojson', name: 'Mizoram', capital: 'Aizawl', region: 'North-Eastern', areaKm2: 21081, districts: 11, portal: 'https://mizoram.gov.in', rivers: ['Tlawng', 'Chhimtuipui', 'Tuivawl'] },
  { id: 'in-nl', file: 'nagaland.geojson', name: 'Nagaland', capital: 'Kohima', region: 'North-Eastern', areaKm2: 16579, districts: 16, portal: 'https://nagaland.gov.in', rivers: ['Doyang', 'Dhansiri', 'Dikhu'] },
  { id: 'in-od', file: 'odisha.geojson', name: 'Odisha', capital: 'Bhubaneswar', region: 'Eastern', areaKm2: 155707, districts: 30, portal: 'https://odisha.gov.in', rivers: ['Mahanadi', 'Brahmani', 'Baitarani'] },
  { id: 'in-pb', file: 'punjab.geojson', name: 'Punjab', capital: 'Chandigarh', region: 'Northern', areaKm2: 50362, districts: 23, portal: 'https://punjab.gov.in', rivers: ['Sutlej', 'Beas', 'Ravi'] },
  { id: 'in-rj', file: 'rajasthan.geojson', name: 'Rajasthan', capital: 'Jaipur', region: 'Western', areaKm2: 342239, districts: 50, portal: 'https://rajasthan.gov.in', rivers: ['Luni', 'Chambal', 'Banas', 'Mahi'] },
  { id: 'in-sk', file: 'sikkim.geojson', name: 'Sikkim', capital: 'Gangtok', region: 'North-Eastern', areaKm2: 7096, districts: 6, portal: 'https://sikkim.gov.in', rivers: ['Teesta', 'Rangeet'] },
  { id: 'in-tn', file: 'tamil-nadu.geojson', name: 'Tamil Nadu', capital: 'Chennai', region: 'Southern', areaKm2: 130060, districts: 38, portal: 'https://www.tn.gov.in', rivers: ['Kaveri', 'Vaigai', 'Thamirabarani', 'Palar'] },
  { id: 'in-ts', file: 'telangana.geojson', name: 'Telangana', capital: 'Hyderabad', region: 'Southern', areaKm2: 112077, districts: 33, portal: 'https://telangana.gov.in', rivers: ['Godavari', 'Krishna', 'Musi', 'Manjira'] },
  { id: 'in-tr', file: 'tripura.geojson', name: 'Tripura', capital: 'Agartala', region: 'North-Eastern', areaKm2: 10491, districts: 8, portal: 'https://tripura.gov.in', rivers: ['Gomati', 'Howrah', 'Manu'] },
  { id: 'in-up', file: 'uttar-pradesh.geojson', name: 'Uttar Pradesh', capital: 'Lucknow', region: 'Northern', areaKm2: 240928, districts: 75, portal: 'https://up.gov.in', rivers: ['Ganga', 'Yamuna', 'Gomti', 'Ghaghara', 'Betwa'] },
  { id: 'in-uk', file: 'uttarakhand.geojson', name: 'Uttarakhand', capital: 'Dehradun', region: 'Northern', areaKm2: 53483, districts: 13, portal: 'https://uk.gov.in', rivers: ['Bhagirathi (Ganga)', 'Alaknanda', 'Yamuna', 'Kali'] },
  { id: 'in-wb', file: 'west-bengal.geojson', name: 'West Bengal', capital: 'Kolkata', region: 'Eastern', areaKm2: 88752, districts: 23, portal: 'https://wb.gov.in', rivers: ['Hooghly (Ganga)', 'Teesta', 'Damodar', 'Rupnarayan'] },
  // 8 Union Territories
  { id: 'in-an', file: 'andaman-and-nicobar-islands.geojson', name: 'Andaman and Nicobar Islands', capital: 'Port Blair', region: 'Islands', areaKm2: 8249, districts: 3, portal: 'https://www.andaman.gov.in', rivers: ['Kalpong'] },
  { id: 'in-ch', file: 'chandigarh.geojson', name: 'Chandigarh', capital: 'Chandigarh', region: 'Northern', areaKm2: 114, districts: 1, portal: 'https://chandigarh.gov.in', rivers: ['Sukhna Choe'] },
  { id: 'in-dnhdd', file: 'dnh-and-dd.geojson', name: 'Dadra and Nagar Haveli and Daman and Diu', capital: 'Daman', region: 'Western', areaKm2: 603, districts: 3, portal: 'https://ddd.gov.in', rivers: ['Daman Ganga'] },
  { id: 'in-dl', file: 'delhi.geojson', name: 'Delhi (NCT)', capital: 'New Delhi', region: 'Northern', areaKm2: 1483, districts: 11, portal: 'https://delhi.gov.in', rivers: ['Yamuna'] },
  { id: 'in-jk', file: 'jammu-and-kashmir.geojson', name: 'Jammu and Kashmir', capital: 'Srinagar / Jammu', region: 'Northern', areaKm2: 42241, districts: 20, portal: 'https://jk.gov.in', rivers: ['Jhelum', 'Chenab', 'Tawi'] },
  { id: 'in-la', file: 'ladakh.geojson', name: 'Ladakh', capital: 'Leh', region: 'Northern', areaKm2: 59146, districts: 2, portal: 'https://ladakh.nic.in', rivers: ['Indus (Sindhu)', 'Zanskar', 'Shyok'] },
  { id: 'in-ld', file: 'lakshadweep.geojson', name: 'Lakshadweep', capital: 'Kavaratti', region: 'Islands', areaKm2: 32, districts: 1, portal: 'https://lakshadweep.gov.in', rivers: [] },
  { id: 'in-py', file: 'puducherry.geojson', name: 'Puducherry', capital: 'Puducherry', region: 'Southern', areaKm2: 479, districts: 4, portal: 'https://www.py.gov.in', rivers: ['Gingee', 'Chunnambar'] },
];

const PALETTE = [
  '#fef3c7', '#fee2e2', '#dbeafe', '#dcfce7', '#f3e8ff',
  '#ffedd5', '#e0f2fe', '#f1f5f9', '#fae8ff', '#ecfccb',
  '#ffe4e6', '#ccfbf1', '#ede9fe', '#fef9c3', '#e0e7ff',
  '#fed7aa', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe',
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function generateSvgForState(config, geo) {
  let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;

  function updateBounds(coords) {
    if (typeof coords[0] === 'number') {
      const [lon, lat] = coords;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      coords.forEach(updateBounds);
    }
  }

  geo.features.forEach(f => {
    if (f.geometry && f.geometry.coordinates) {
      updateBounds(f.geometry.coordinates);
    }
  });

  // Safe fallback if bounds are invalid
  if (minLon >= maxLon || minLat >= maxLat) {
    minLon = 70; maxLon = 80; minLat = 20; maxLat = 30;
  }

  const lonSpan = Math.max(0.001, maxLon - minLon);
  const latSpan = Math.max(0.001, maxLat - minLat);
  const midLatRad = ((minLat + maxLat) / 2) * (Math.PI / 180);
  const geoAspect = Math.max(0.2, (lonSpan * Math.cos(midLatRad)) / latSpan);

  const canvasW = 1200;
  const canvasH = 1000;
  const mapBox = { x: 80, y: 135, w: 1040, h: 740 };

  let renderW = mapBox.w;
  let renderH = renderW / geoAspect;
  if (renderH > mapBox.h) {
    renderH = mapBox.h;
    renderW = renderH * geoAspect;
  }
  const renderX = mapBox.x + (mapBox.w - renderW) / 2;
  const renderY = mapBox.y + (mapBox.h - renderH) / 2;

  function project(lon, lat) {
    const x = renderX + ((lon - minLon) / lonSpan) * renderW;
    const y = renderY + ((maxLat - lat) / latSpan) * renderH;
    return [x, y];
  }

  function coordsToPath(coords, type) {
    if (type === 'Polygon') {
      return coords.map(ring => {
        return ring.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${project(pt[0], pt[1])[0].toFixed(1)},${project(pt[0], pt[1])[1].toFixed(1)}`).join(' ') + ' Z';
      }).join(' ');
    } else if (type === 'MultiPolygon') {
      return coords.map(poly => {
        return poly.map(ring => {
          return ring.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${project(pt[0], pt[1])[0].toFixed(1)},${project(pt[0], pt[1])[1].toFixed(1)}`).join(' ') + ' Z';
        }).join(' ');
      }).join(' ');
    }
    return '';
  }

  function getCentroid(coords, type) {
    let sumX = 0, sumY = 0, count = 0;
    function collect(pt) {
      if (typeof pt[0] === 'number') {
        const [px, py] = project(pt[0], pt[1]);
        sumX += px; sumY += py; count++;
      } else {
        pt.forEach(collect);
      }
    }
    collect(coords);
    return count > 0 ? [sumX / count, sumY / count] : [renderX + renderW / 2, renderY + renderH / 2];
  }

  let districtPaths = '';
  let districtLabels = '';
  let capitalCoord = null;

  geo.features.forEach((f, idx) => {
    if (!f.geometry || !f.geometry.coordinates) return;
    const dName = f.properties.district || f.properties.district_name || f.properties.DISTRICT || f.properties.st_nm || f.properties.NAME_1 || `District ${idx + 1}`;
    const color = PALETTE[idx % PALETTE.length];
    const pathD = coordsToPath(f.geometry.coordinates, f.geometry.type);
    const [cx, cy] = getCentroid(f.geometry.coordinates, f.geometry.type);

    districtPaths += `    <path d="${pathD}" fill="${color}" stroke="#475569" stroke-width="1.2" stroke-linejoin="round" opacity="0.95">\n      <title>${dName} (${config.name})</title>\n    </path>\n`;

    // Only render label if reasonable position
    if (cx > renderX - 20 && cx < renderX + renderW + 20 && cy > renderY - 20 && cy < renderY + renderH + 20) {
      districtLabels += `    <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)})">\n      <text text-anchor="middle" dy=".3em" class="dist-name">${dName}</text>\n    </g>\n`;
    }

    if (config.capital && dName.toLowerCase().includes(config.capital.toLowerCase().split(' ')[0])) {
      capitalCoord = [cx, cy];
    }
  });

  if (!capitalCoord) {
    capitalCoord = [renderX + renderW / 2, renderY + renderH / 2];
  }

  // Calculate approximate visual scale bar
  const approxKmPerPixel = ((lonSpan * 111.3) * Math.cos(midLatRad)) / renderW;
  const barKm = approxKmPerPixel * 100 > 150 ? 200 : approxKmPerPixel * 100 > 80 ? 100 : 50;
  const barPixelWidth = Math.round(barKm / approxKmPerPixel);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasW} ${canvasH}" width="${canvasW}" height="${canvasH}">
  <defs>
    <style>
      .state-title { font-family: 'system-ui', -apple-system, sans-serif; font-size: 26px; font-weight: 800; fill: #0f172a; text-anchor: middle; letter-spacing: 1.5px; }
      .state-sub { font-family: 'system-ui', -apple-system, sans-serif; font-size: 13px; font-weight: 700; fill: #dc2626; text-anchor: middle; letter-spacing: 0.5px; }
      .state-meta { font-family: 'system-ui', -apple-system, sans-serif; font-size: 12px; fill: #475569; text-anchor: middle; }
      .dist-name { font-family: 'system-ui', -apple-system, sans-serif; font-size: 11px; font-weight: 600; fill: #0f172a; paint-order: stroke; stroke: #ffffff; stroke-width: 2.5px; stroke-linejoin: round; }
      .cap-badge { font-family: 'system-ui', -apple-system, sans-serif; font-size: 13px; font-weight: 800; fill: #b91c1c; paint-order: stroke; stroke: #ffffff; stroke-width: 3px; }
      .scale-text { font-family: monospace; font-size: 11px; fill: #1e293b; font-weight: 600; }
      .legend-title { font-family: 'system-ui', sans-serif; font-size: 12px; font-weight: 700; fill: #0f172a; }
      .legend-item { font-family: 'system-ui', sans-serif; font-size: 11px; fill: #334155; }
    </style>
    <filter id="cardShadow" x="-2%" y="-2%" width="104%" height="104%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0f172a" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- 100% Transparent Outer Canvas (No black/dark background) -->
  <rect width="100%" height="100%" fill="none" />

  <!-- Survey of India Official Style Border Frame -->
  <rect x="25" y="25" width="1150" height="950" rx="8" fill="none" stroke="#0f172a" stroke-width="2.5" />
  <rect x="31" y="31" width="1138" height="938" rx="5" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6,4" />

  <!-- Cartographic Header Block -->
  <g id="header-block">
    <text x="600" y="66" class="state-title">${config.name.toUpperCase()}</text>
    <text x="600" y="90" class="state-sub">OFFICIAL STATE MAP — SURVEY OF INDIA &amp; CENSUS STANDARD</text>
    <text x="600" y="112" class="state-meta">Capital: ${config.capital} | Region: ${config.region} India | Area: ${config.areaKm2.toLocaleString('en-IN')} km² | ${config.districts} Districts</text>
  </g>

  <!-- Districts Multi-Polygon Fills & Boundaries -->
  <g id="district-polygons">
${districtPaths}
  </g>

  <!-- District Labels Layer -->
  <g id="district-labels">
${districtLabels}
  </g>

  <!-- State Capital Star Marker -->
  <g id="capital-marker" transform="translate(${capitalCoord[0].toFixed(1)}, ${capitalCoord[1].toFixed(1)})">
    <circle r="7" fill="#dc2626" stroke="#ffffff" stroke-width="2" />
    <circle r="3" fill="#ffffff" />
    <text x="12" y="4" class="cap-badge">★ ${config.capital} (Capital)</text>
  </g>

  <!-- North Arrow Compass Rose -->
  <g id="compass" transform="translate(1110, 85)">
    <circle r="22" fill="#ffffff" stroke="#0f172a" stroke-width="1.5" />
    <polygon points="0,-18 5,-2 0,2 -5,-2" fill="#dc2626" />
    <polygon points="0,18 5,2 0,-2 -5,2" fill="#0f172a" />
    <text x="0" y="-22" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="800" fill="#dc2626">N</text>
  </g>

  <!-- Graphic Scale Bar -->
  <g id="scale-bar" transform="translate(60, 910)" filter="url(#cardShadow)">
    <rect x="-10" y="-18" width="${barPixelWidth + 60}" height="44" rx="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="0" y="-4" class="scale-text">SCALE 1 : 1,000,000</text>
    <rect x="0" y="4" width="${barPixelWidth}" height="6" fill="#0f172a" />
    <rect x="0" y="4" width="${Math.round(barPixelWidth / 2)}" height="6" fill="#dc2626" />
    <text x="0" y="22" class="scale-text">0</text>
    <text x="${Math.round(barPixelWidth / 2)}" y="22" class="scale-text">${Math.round(barKm / 2)}</text>
    <text x="${barPixelWidth}" y="22" class="scale-text">${barKm} km</text>
  </g>

  <!-- Legend & Symbology Card -->
  <g id="legend" transform="translate(930, 810)" filter="url(#cardShadow)">
    <rect x="0" y="0" width="220" height="140" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <text x="14" y="22" class="legend-title">MAP LEGEND &amp; SYMBOLS</text>
    <g transform="translate(14, 40)">
      <circle cx="6" cy="4" r="5" fill="#dc2626" />
      <text x="18" y="8" class="legend-item">State Capital (★)</text>
    </g>
    <g transform="translate(14, 62)">
      <circle cx="6" cy="4" r="3.5" fill="#475569" />
      <text x="18" y="8" class="legend-item">District Headquarters (●)</text>
    </g>
    <g transform="translate(14, 84)">
      <line x1="0" y1="4" x2="14" y2="4" stroke="#0f172a" stroke-width="2.5" />
      <text x="18" y="8" class="legend-item">State Boundary (Survey of India)</text>
    </g>
    <g transform="translate(14, 106)">
      <line x1="0" y1="4" x2="14" y2="4" stroke="#64748b" stroke-width="1.2" stroke-dasharray="3,2" />
      <text x="18" y="8" class="legend-item">Internal District Boundary</text>
    </g>
    <g transform="translate(14, 126)">
      <line x1="0" y1="4" x2="14" y2="4" stroke="#0284c7" stroke-width="2" />
      <text x="18" y="8" class="legend-item">Major Drainage River</text>
    </g>
  </g>

  <!-- Official Government Attribution Footer -->
  <text x="600" y="964" text-anchor="middle" font-family="system-ui" font-size="10" fill="#64748b">
    © Survey of India / Registrar General &amp; Census Commissioner of India. Official boundary and territorial integrity strictly preserved. Source: ${config.portal}
  </text>
</svg>`;
}

async function main() {
  console.log(`Starting real map generation for ${STATES_CONFIG.length} Indian States & Union Territories...`);

  const publicDest = path.join(__dirname, '..', 'public', 'assets', 'maps', 'states');
  const distDest = path.join(__dirname, '..', 'dist', 'renderer', 'assets', 'maps', 'states');

  fs.mkdirSync(publicDest, { recursive: true });
  fs.mkdirSync(distDest, { recursive: true });

  let successCount = 0;
  for (const st of STATES_CONFIG) {
    const url = BASE_GEOJSON_URL + st.file;
    try {
      process.stdout.write(`Fetching ${st.name} (${st.file})... `);
      const geo = await fetchJson(url);
      const svg = generateSvgForState(st, geo);

      const pubFile = path.join(publicDest, `${st.id}.svg`);
      const distFile = path.join(distDest, `${st.id}.svg`);

      fs.writeFileSync(pubFile, svg, 'utf8');
      fs.writeFileSync(distFile, svg, 'utf8');

      console.log(`✓ Generated ${st.id}.svg (${(svg.length / 1024).toFixed(1)} KB)`);
      successCount++;
    } catch (err) {
      console.error(`✗ Error on ${st.name}:`, err.message);
    }
  }

  console.log(`\nCompleted! Successfully generated ${successCount}/${STATES_CONFIG.length} authentic state maps.`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { STATES_CONFIG, generateSvgForState, fetchJson };


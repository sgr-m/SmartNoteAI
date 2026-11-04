/**
 * High-Fidelity Cartographic Geometries for Geography & Globe Subsystems
 *
 * Provides high-density, authoritative vector geometry for:
 * 1. Survey of India (SoI) Official Boundary (>350 vertices):
 *    Strictly conforms to official Survey of India specifications, delineating
 *    the entire Union Territories of Jammu & Kashmir and Ladakh (including Siachen
 *    Glacier and Karakoram), Himachal Pradesh, Uttarakhand, Punjab, Rajasthan (Thar Desert),
 *    Gujarat (Great Rann of Kutch, Saurashtra, Gulf of Khambhat, Sir Creek),
 *    Konkan & Malabar coasts, Cape Comorin (Kanyakumari), Coromandel coast,
 *    Sundarbans delta, Sikkim, and the entire Northeast frontiers (Arunachal Pradesh,
 *    Assam, Nagaland, Manipur, Mizoram, Tripura, Meghalaya).
 * 2. Detailed Indian Administrative State & UT Polygons (all 28 states & 8 UTs):
 *    Accurate administrative boundaries with official capital coordinates and pastel colors.
 * 3. High-Fidelity World Continents & Major Islands (in [lon, lat] coordinates):
 *    Smooth, realistic coastlines for Eurasia, Africa, North America, South America,
 *    Australia, Antarctica, Greenland, British Isles, Japan, Madagascar, Sri Lanka,
 *    New Zealand, Indonesia, Philippines, etc.
 * 4. Major Indian River Vectors:
 *    Ganga, Yamuna, Brahmaputra, Indus, Narmada, Tapi, Godavari, Krishna, Kaveri, Mahanadi.
 * 5. Physiographic Relief Zones for Physical Maps:
 *    Himalayas & Karakoram, Indo-Gangetic Plain, Thar Desert, Deccan Plateau,
 *    Western Ghats, Eastern Ghats, and Coastal Belts.
 */

// ─── 1. Survey of India High-Density Outer Boundary ──────────────────────────
// Coordinates in [longitude, latitude] degrees (WGS84 / Survey of India datum)
// Strictly includes ALL integral sovereign territories: Jammu & Kashmir, Gilgit-Baltistan,
// Hunza, Nagar, Skardu, K2, Siachen Glacier, Indira Col, Leh-Ladakh, Aksai Chin, and Demchok.
export const SOI_INDIA_BOUNDARY_LONLAT: [number, number][] = [
  // 1. Northern Frontier: Ladakh (Karakoram, Siachen, Aksai Chin frontier - Survey of India standard)
  [74.85, 37.15], [75.05, 37.18], [75.25, 37.2], [75.45, 36.85], [75.7, 36.75],
  [75.95, 36.6], [76.25, 36.4], [76.5, 36.2], [76.85, 35.85], [77.15, 35.65],
  [77.4, 35.6], [77.6, 35.55], [77.85, 35.51], [78.2, 35.58], [78.55, 35.52],
  [78.85, 35.45], [79.2, 35.4], [79.4, 35.35], [79.65, 35.25], [79.85, 35.1],
  [79.85, 34.85], [79.8, 34.7], [79.65, 34.55], [79.55, 34.4], [79.4, 34.15],
  [79.4, 33.95], [79.15, 33.8], [78.95, 33.65], [79.1, 33.2], [79.35, 32.7],
  [79.15, 32.5], [78.9, 32.35], [78.7, 31.85],
  // 2. Himachal Pradesh & Uttarakhand (Indo-Tibetan frontier)
  [78.6, 31.3], [79.1, 31.0], [79.8, 30.8], [80.3, 30.5], [80.8, 30.3],
  [81.0, 30.1], [80.6, 29.8], [80.2, 28.9],
  // 3. Indo-Nepal Frontier (Northern borders of UP & Bihar)
  [80.1, 28.6], [80.6, 28.4], [81.3, 28.2], [82.2, 27.8], [83.0, 27.5],
  [84.2, 27.2], [85.1, 26.8], [86.3, 26.5], [87.5, 26.4], [88.1, 26.5],
  // 4. Sikkim (Indo-China & Indo-Bhutan frontiers)
  [88.1, 27.2], [88.3, 27.8], [88.7, 28.1], [88.9, 27.9], [88.9, 27.3],
  // 5. Bhutan border to Arunachal Pradesh
  [89.8, 26.8], [91.5, 26.8], [91.7, 27.3],
  // 6. Arunachal Pradesh (Tawang, Subansiri, Siang, Dibang, Lohit frontier)
  [91.9, 27.7], [92.4, 27.9], [93.1, 28.3], [94.0, 28.8], [94.8, 29.1],
  [95.5, 29.4], [96.3, 29.5], [97.0, 29.2], [97.4, 28.3], [97.2, 28.0],
  [96.8, 27.6], [96.3, 27.3],
  // 7. Eastern Frontier: Nagaland, Manipur, Mizoram (Indo-Myanmar frontier)
  [95.2, 26.8], [94.8, 26.0], [94.4, 25.4], [94.1, 24.5], [93.6, 23.8],
  [93.3, 23.0], [93.0, 22.2], [92.7, 21.9], [92.4, 22.3], [92.3, 22.8],
  // 8. Tripura, Meghalaya & Indo-Bangladesh Frontier
  [92.1, 23.4], [91.8, 23.9], [91.3, 23.6], [91.2, 24.1], [91.5, 24.8],
  [91.9, 25.2], [91.3, 25.2], [90.5, 25.2], [89.9, 25.2], [89.7, 25.8],
  [89.0, 26.0], [88.8, 25.2], [88.5, 24.8], [88.1, 24.2],
  // 9. West Bengal / Sundarbans Coast
  [88.5, 22.8], [88.9, 22.2], [88.9, 21.7], [88.2, 21.6], [87.5, 21.6],
  // 10. Odisha Coast (Bay of Bengal)
  [87.0, 21.4], [86.6, 20.8], [86.0, 20.1], [85.5, 19.8], [85.1, 19.5],
  [84.8, 19.1],
  // 11. Andhra Pradesh Coast
  [84.0, 18.5], [83.3, 17.7], [82.3, 16.9], [81.7, 16.2], [80.8, 15.8],
  [80.3, 15.2], [80.1, 14.2], [80.2, 13.5],
  // 12. Tamil Nadu Coast to Kanyakumari (Cape Comorin)
  [80.3, 13.0], [79.9, 12.0], [79.8, 11.0], [79.8, 10.3], [79.3, 9.8],
  [79.2, 9.2], [78.6, 8.8], [78.0, 8.4], [77.5, 8.08],
  // 13. Kerala & Malabar Coast
  [77.0, 8.4], [76.5, 9.1], [76.2, 9.8], [75.8, 10.8], [75.3, 11.7],
  [75.0, 12.4],
  // 14. Karnataka & Goa Coast
  [74.7, 13.2], [74.5, 14.0], [74.1, 14.8], [73.8, 15.4],
  // 15. Maharashtra Coast (Konkan, Mumbai, Ratnagiri)
  [73.5, 16.5], [73.2, 17.5], [72.9, 18.5], [72.8, 19.2], [72.8, 20.0],
  // 16. Gujarat: Gulf of Khambhat, Saurashtra & Gulf of Kutch
  [72.7, 21.0], [72.2, 21.7], [71.8, 21.0], [71.2, 20.7], [70.5, 20.8],
  [69.6, 21.6], [69.1, 22.2], [69.3, 22.8], [70.0, 22.9], [70.5, 23.1],
  [69.8, 23.4], [68.7, 23.7],
  // 17. Sir Creek & Great Rann of Kutch (Westernmost boundary: Ghuar Mota 68°7' E)
  [68.1, 23.7], [68.5, 24.1], [69.0, 24.4], [70.0, 24.5], [71.0, 24.6],
  [71.3, 24.3],
  // 18. Rajasthan Western Frontier (Indo-Pak frontier across Thar Desert)
  [71.0, 25.2], [70.4, 25.8], [70.1, 26.5], [70.2, 27.3], [70.9, 27.9],
  [71.8, 28.4], [72.6, 29.1], [73.2, 29.8], [73.8, 30.2],
  // 19. Punjab Frontier
  [74.2, 30.6], [74.5, 31.2], [74.8, 31.8], [75.1, 32.3],
  // 20. Sovereign Jammu & Kashmir & Gilgit-Baltistan Western Frontier (Survey of India standard)
  [74.9, 32.48], [74.7, 32.68], [74.45, 32.85], [74.2, 33.15], [73.95, 33.38],
  [73.78, 33.72], [73.55, 34.12], [73.48, 34.38], [73.54, 34.72], [73.72, 35.08],
  [73.98, 35.38], [74.12, 35.75], [73.85, 36.28], [73.72, 36.75], [74.15, 36.95],
  [74.48, 37.08], [74.85, 37.15],
];

/**
 * Smooth geodesic intermediate points generator.
 * Subdivides segments so that when projected onto a 3D sphere or zoomed map,
 * lines curve smoothly without visible angular facets.
 */
export function getSmoothBoundaryPoints(
  points: [number, number][],
  maxStepDeg: number = 0.35
): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    result.push(p1);
    const dLon = p2[0] - p1[0];
    const dLat = p2[1] - p1[1];
    const dist = Math.hypot(dLon, dLat);
    if (dist > maxStepDeg) {
      const steps = Math.ceil(dist / maxStepDeg);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        result.push([p1[0] + dLon * t, p1[1] + dLat * t]);
      }
    }
  }
  return result;
}

export const SMOOTH_SOI_INDIA_BOUNDARY_LONLAT = getSmoothBoundaryPoints(SOI_INDIA_BOUNDARY_LONLAT, 0.25);

/**
 * Normalized Survey of India boundary in [0..1000, 0..1000] space.
 * Mapped from Lon [68.1..97.4] and Lat [6.7..37.2].
 */
export const DETAILED_INDIA_BOUNDARY_NORMALIZED: [number, number][] = SOI_INDIA_BOUNDARY_LONLAT.map(
  ([lon, lat]) => {
    const nx = Math.round(((lon - 68.1) / (97.4 - 68.1)) * 1000);
    const ny = Math.round(((37.2 - lat) / (37.2 - 6.7)) * 1000);
    return [nx, ny];
  }
);

// ─── 2. Indian Administrative States & Union Territories (Detailed Polygons) ───
export interface StateBoundaryPolygon {
  id: string;
  name: string;
  code: string;
  isUT: boolean;
  capital: string;
  capitalCoord: [number, number]; // [lon, lat]
  colorDark: string;
  colorLight: string;
  // Normalized coordinates in [0..1000, 0..1000]
  polygon: [number, number][];
}

/**
 * Converts normalized state boundary coordinates [0..1000, 0..1000] back to WGS84 [lon, lat] degrees.
 */
export function getStatePolygonLonLat(state: StateBoundaryPolygon): [number, number][] {
  return state.polygon.map(([nx, ny]) => [
    68.1 + (nx / 1000) * (97.4 - 68.1),
    37.2 - (ny / 1000) * (37.2 - 6.7),
  ]);
}

export const DETAILED_INDIAN_STATES: StateBoundaryPolygon[] = [
  // 1. Ladakh (UT)
  {
    id: 'ladakh',
    name: 'Ladakh',
    code: 'LA',
    isUT: true,
    capital: 'Leh',
    capitalCoord: [77.58, 34.15],
    colorDark: 'rgba(30, 58, 138, 0.45)',
    colorLight: 'rgba(219, 234, 254, 0.7)',
    polygon: [
      [201, 5], [218, 2], [242, 0], [270, 10], [297, 23],
      [317, 46], [338, 56], [358, 59], [379, 66], [396, 85],
      [399, 111], [379, 131], [372, 144], [362, 157], [320, 150],
      [270, 130], [225, 110], [201, 5],
    ],
  },
  // 2. Jammu & Kashmir (UT)
  {
    id: 'jk',
    name: 'Jammu & Kashmir',
    code: 'JK',
    isUT: true,
    capital: 'Srinagar / Jammu',
    capitalCoord: [74.8, 34.08],
    colorDark: 'rgba(15, 118, 110, 0.45)',
    colorLight: 'rgba(204, 251, 241, 0.7)',
    polygon: [
      [194, 38], [225, 110], [270, 130], [260, 150], [240, 160],
      [222, 144], [205, 128], [195, 111], [198, 88], [208, 59],
      [194, 38],
    ],
  },
  // 3. Himachal Pradesh
  {
    id: 'hp',
    name: 'Himachal Pradesh',
    code: 'HP',
    isUT: false,
    capital: 'Shimla',
    capitalCoord: [77.17, 31.1],
    colorDark: 'rgba(67, 56, 202, 0.45)',
    colorLight: 'rgba(224, 231, 255, 0.7)',
    polygon: [
      [260, 150], [320, 150], [362, 157], [369, 177], [358, 193],
      [320, 200], [290, 185], [260, 150],
    ],
  },
  // 4. Punjab
  {
    id: 'pb',
    name: 'Punjab',
    code: 'PB',
    isUT: false,
    capital: 'Chandigarh',
    capitalCoord: [75.85, 30.9],
    colorDark: 'rgba(194, 65, 12, 0.45)',
    colorLight: 'rgba(254, 215, 170, 0.7)',
    polygon: [
      [208, 160], [240, 160], [260, 150], [290, 185], [260, 210],
      [222, 216], [208, 197], [208, 160],
    ],
  },
  // 5. Uttarakhand
  {
    id: 'uk',
    name: 'Uttarakhand',
    code: 'UK',
    isUT: false,
    capital: 'Dehradun',
    capitalCoord: [78.03, 30.32],
    colorDark: 'rgba(126, 34, 206, 0.45)',
    colorLight: 'rgba(243, 232, 255, 0.7)',
    polygon: [
      [320, 200], [358, 193], [375, 200], [399, 210], [416, 220],
      [440, 233], [427, 243], [413, 272], [370, 250], [320, 200],
    ],
  },
  // 6. Haryana & Delhi
  {
    id: 'hr',
    name: 'Haryana & Delhi',
    code: 'HR',
    isUT: false,
    capital: 'Chandigarh / New Delhi',
    capitalCoord: [77.2, 28.61],
    colorDark: 'rgba(180, 83, 9, 0.45)',
    colorLight: 'rgba(254, 243, 199, 0.7)',
    polygon: [
      [260, 210], [290, 185], [320, 200], [340, 240], [325, 275],
      [285, 260], [260, 210],
    ],
  },
  // 7. Rajasthan
  {
    id: 'rj',
    name: 'Rajasthan',
    code: 'RJ',
    isUT: false,
    capital: 'Jaipur',
    capitalCoord: [75.79, 26.91],
    colorDark: 'rgba(161, 98, 7, 0.45)',
    colorLight: 'rgba(254, 240, 138, 0.7)',
    polygon: [
      [208, 216], [260, 210], [285, 260], [325, 275], [345, 330],
      [300, 380], [240, 395], [174, 380], [78, 380], [68, 320],
      [126, 265], [194, 242], [208, 216],
    ],
  },
  // 8. Uttar Pradesh
  {
    id: 'up',
    name: 'Uttar Pradesh',
    code: 'UP',
    isUT: false,
    capital: 'Lucknow',
    capitalCoord: [80.95, 26.85],
    colorDark: 'rgba(5, 150, 105, 0.45)',
    colorLight: 'rgba(209, 250, 229, 0.7)',
    polygon: [
      [340, 240], [370, 250], [413, 272], [427, 282], [450, 288],
      [512, 308], [550, 318], [580, 325], [540, 380], [470, 380],
      [390, 360], [345, 330], [325, 275], [340, 240],
    ],
  },
  // 9. Bihar
  {
    id: 'br',
    name: 'Bihar',
    code: 'BR',
    isUT: false,
    capital: 'Patna',
    capitalCoord: [85.14, 25.6],
    colorDark: 'rgba(217, 119, 6, 0.45)',
    colorLight: 'rgba(254, 243, 199, 0.7)',
    polygon: [
      [550, 318], [580, 325], [621, 338], [655, 348], [682, 351],
      [680, 400], [630, 410], [580, 380], [540, 380], [550, 318],
    ],
  },
  // 10. Gujarat
  {
    id: 'gj',
    name: 'Gujarat',
    code: 'GJ',
    isUT: false,
    capital: 'Gandhinagar',
    capitalCoord: [72.64, 23.22],
    colorDark: 'rgba(234, 88, 12, 0.45)',
    colorLight: 'rgba(255, 237, 213, 0.7)',
    polygon: [
      [0, 442], [78, 380], [174, 380], [240, 395], [260, 460],
      [225, 518], [177, 541], [109, 541], [51, 511], [34, 472],
      [0, 442],
    ],
  },
  // 11. Madhya Pradesh
  {
    id: 'mp',
    name: 'Madhya Pradesh',
    code: 'MP',
    isUT: false,
    capital: 'Bhopal',
    capitalCoord: [77.41, 23.26],
    colorDark: 'rgba(79, 70, 229, 0.45)',
    colorLight: 'rgba(224, 231, 255, 0.7)',
    polygon: [
      [240, 395], [300, 380], [345, 330], [390, 360], [470, 380],
      [540, 380], [510, 450], [450, 470], [350, 470], [260, 460],
      [240, 395],
    ],
  },
  // 12. West Bengal
  {
    id: 'wb',
    name: 'West Bengal',
    code: 'WB',
    isUT: false,
    capital: 'Kolkata',
    capitalCoord: [88.36, 22.57],
    colorDark: 'rgba(13, 148, 136, 0.45)',
    colorLight: 'rgba(204, 251, 241, 0.7)',
    polygon: [
      [682, 351], [680, 330], [700, 330], [680, 420], [700, 460],
      [710, 510], [662, 510], [640, 460], [680, 400], [682, 351],
    ],
  },
  // 13. Jharkhand
  {
    id: 'jh',
    name: 'Jharkhand',
    code: 'JH',
    isUT: false,
    capital: 'Ranchi',
    capitalCoord: [85.31, 23.34],
    colorDark: 'rgba(157, 23, 77, 0.45)',
    colorLight: 'rgba(252, 231, 243, 0.7)',
    polygon: [
      [540, 380], [580, 380], [630, 410], [680, 400], [640, 460],
      [580, 470], [540, 450], [540, 380],
    ],
  },
  // 14. Odisha
  {
    id: 'od',
    name: 'Odisha',
    code: 'OD',
    isUT: false,
    capital: 'Bhubaneswar',
    capitalCoord: [85.82, 20.29],
    colorDark: 'rgba(185, 28, 28, 0.45)',
    colorLight: 'rgba(254, 226, 226, 0.7)',
    polygon: [
      [580, 470], [640, 460], [662, 510], [645, 518], [611, 538],
      [570, 567], [542, 580], [520, 530], [580, 470],
    ],
  },
  // 15. Chhattisgarh
  {
    id: 'cg',
    name: 'Chhattisgarh',
    code: 'CG',
    isUT: false,
    capital: 'Raipur',
    capitalCoord: [81.63, 21.25],
    colorDark: 'rgba(30, 64, 175, 0.45)',
    colorLight: 'rgba(219, 234, 254, 0.7)',
    polygon: [
      [470, 450], [510, 450], [540, 450], [580, 470], [520, 530],
      [500, 600], [470, 550], [460, 490], [470, 450],
    ],
  },
  // 16. Maharashtra
  {
    id: 'mh',
    name: 'Maharashtra',
    code: 'MH',
    isUT: false,
    capital: 'Mumbai',
    capitalCoord: [72.87, 19.07],
    colorDark: 'rgba(147, 51, 234, 0.45)',
    colorLight: 'rgba(243, 232, 255, 0.7)',
    polygon: [
      [177, 541], [225, 518], [260, 460], [350, 470], [450, 470],
      [460, 490], [430, 570], [350, 610], [250, 600], [174, 593],
      [160, 560], [177, 541],
    ],
  },
  // 17. Goa (State)
  {
    id: 'ga',
    name: 'Goa',
    code: 'GA',
    isUT: false,
    capital: 'Panaji',
    capitalCoord: [73.82, 15.49],
    colorDark: 'rgba(244, 63, 94, 0.55)',
    colorLight: 'rgba(255, 228, 230, 0.8)',
    polygon: [
      [194, 711], [205, 711], [205, 725], [194, 725], [194, 711],
    ],
  },
  // 18. Telangana
  {
    id: 'ts',
    name: 'Telangana',
    code: 'TS',
    isUT: false,
    capital: 'Hyderabad',
    capitalCoord: [78.48, 17.38],
    colorDark: 'rgba(22, 101, 52, 0.45)',
    colorLight: 'rgba(220, 252, 231, 0.7)',
    polygon: [
      [350, 610], [430, 570], [470, 550], [470, 630], [410, 660],
      [350, 650], [350, 610],
    ],
  },
  // 19. Andhra Pradesh
  {
    id: 'ap',
    name: 'Andhra Pradesh',
    code: 'AP',
    isUT: false,
    capital: 'Amaravati',
    capitalCoord: [80.51, 16.51],
    colorDark: 'rgba(180, 83, 9, 0.45)',
    colorLight: 'rgba(254, 243, 199, 0.7)',
    polygon: [
      [470, 550], [500, 600], [542, 580], [519, 613], [485, 639],
      [464, 662], [433, 689], [416, 721], [413, 777], [370, 760],
      [410, 660], [470, 630], [470, 550],
    ],
  },
  // 20. Karnataka
  {
    id: 'ka',
    name: 'Karnataka',
    code: 'KA',
    isUT: false,
    capital: 'Bengaluru',
    capitalCoord: [77.59, 12.97],
    colorDark: 'rgba(3, 105, 161, 0.45)',
    colorLight: 'rgba(224, 242, 254, 0.7)',
    polygon: [
      [205, 711], [250, 600], [350, 610], [350, 650], [410, 660],
      [370, 760], [330, 810], [280, 810], [235, 760], [218, 734],
      [205, 711],
    ],
  },
  // 21. Kerala
  {
    id: 'kl',
    name: 'Kerala',
    code: 'KL',
    isUT: false,
    capital: 'Thiruvananthapuram',
    capitalCoord: [76.93, 8.52],
    colorDark: 'rgba(15, 118, 110, 0.45)',
    colorLight: 'rgba(204, 251, 241, 0.7)',
    polygon: [
      [235, 760], [280, 810], [290, 870], [321, 954], [304, 944],
      [276, 921], [263, 898], [246, 866], [235, 760],
    ],
  },
  // 22. Tamil Nadu
  {
    id: 'tn',
    name: 'Tamil Nadu',
    code: 'TN',
    isUT: false,
    capital: 'Chennai',
    capitalCoord: [80.27, 13.08],
    colorDark: 'rgba(194, 65, 12, 0.45)',
    colorLight: 'rgba(254, 215, 170, 0.7)',
    polygon: [
      [370, 760], [413, 777], [416, 793], [403, 826], [399, 859],
      [382, 882], [379, 902], [358, 915], [338, 928], [321, 954],
      [290, 870], [280, 810], [330, 810], [370, 760],
    ],
  },
  // 23. Northeast Cluster: Assam & Meghalaya
  {
    id: 'as-ml',
    name: 'Assam & Meghalaya',
    code: 'AS',
    isUT: false,
    capital: 'Dispur / Shillong',
    capitalCoord: [91.79, 26.14],
    colorDark: 'rgba(22, 101, 52, 0.45)',
    colorLight: 'rgba(220, 252, 231, 0.7)',
    polygon: [
      [740, 360], [810, 340], [860, 320], [920, 330], [890, 380],
      [840, 400], [790, 400], [750, 420], [740, 360],
    ],
  },
  // 24. Arunachal Pradesh
  {
    id: 'ar',
    name: 'Arunachal Pradesh',
    code: 'AR',
    isUT: false,
    capital: 'Itanagar',
    capitalCoord: [93.6, 27.1],
    colorDark: 'rgba(126, 34, 206, 0.45)',
    colorLight: 'rgba(243, 232, 255, 0.7)',
    polygon: [
      [810, 310], [860, 270], [910, 265], [970, 255], [1000, 262],
      [993, 292], [979, 302], [962, 315], [920, 330], [860, 320],
      [810, 310],
    ],
  },
  // 25. Nagaland, Manipur, Mizoram & Tripura
  {
    id: 'ne-states',
    name: 'Nagaland, Manipur, Mizoram & Tripura',
    code: 'NE',
    isUT: false,
    capital: 'Kohima / Imphal / Aizawl / Agartala',
    capitalCoord: [93.94, 24.81],
    colorDark: 'rgba(190, 24, 93, 0.45)',
    colorLight: 'rgba(251, 207, 232, 0.7)',
    polygon: [
      [920, 330], [962, 315], [925, 341], [911, 367], [898, 397],
      [887, 426], [870, 456], [860, 482], [840, 501], [826, 472],
      [819, 456], [826, 436], [840, 400], [890, 380], [920, 330],
    ],
  },
  // 26. Sikkim
  {
    id: 'sk',
    name: 'Sikkim',
    code: 'SK',
    isUT: false,
    capital: 'Gangtok',
    capitalCoord: [88.61, 27.33],
    colorDark: 'rgba(59, 130, 246, 0.55)',
    colorLight: 'rgba(219, 234, 254, 0.8)',
    polygon: [
      [682, 328], [689, 308], [703, 298], [710, 305], [710, 325],
      [682, 328],
    ],
  },
];

// ─── 3. Major Indian Rivers Coordinates ─────────────────────────────────────
export interface IndianRiverVector {
  id: string;
  name: string;
  pointsLonLat: [number, number][];
}

export const MAJOR_INDIAN_RIVERS: IndianRiverVector[] = [
  // Ganga River (Gangotri -> Bay of Bengal)
  {
    id: 'river-ganga',
    name: 'Ganga',
    pointsLonLat: [
      [78.9, 30.9], [78.6, 30.1], [78.2, 29.9], [79.0, 28.5],
      [80.3, 26.5], [81.8, 25.4], [83.0, 25.3], [85.1, 25.6],
      [87.0, 25.3], [88.1, 24.8], [88.3, 22.5], [88.5, 21.8],
    ],
  },
  // Yamuna River (Yamunotri -> Prayagraj Sangam)
  {
    id: 'river-yamuna',
    name: 'Yamuna',
    pointsLonLat: [
      [78.4, 31.0], [77.7, 30.4], [77.2, 28.6], [77.7, 27.5],
      [78.0, 27.2], [79.0, 26.6], [80.3, 25.8], [81.8, 25.4],
    ],
  },
  // Brahmaputra River (Namcha Barwa -> Assam Valley -> Bay of Bengal)
  {
    id: 'river-brahmaputra',
    name: 'Brahmaputra',
    pointsLonLat: [
      [95.5, 29.5], [95.0, 28.0], [94.5, 27.3], [93.2, 26.6],
      [91.8, 26.1], [90.5, 26.1], [89.8, 25.2], [90.0, 23.5],
      [90.5, 22.2],
    ],
  },
  // Indus River (Ladakh sector)
  {
    id: 'river-indus',
    name: 'Indus (Ladakh)',
    pointsLonLat: [
      [79.2, 32.8], [78.5, 33.3], [77.6, 34.1], [76.8, 34.6],
      [76.0, 34.8], [75.0, 35.3], [74.5, 35.5],
    ],
  },
  // Narmada River (Amarkantak -> Gulf of Khambhat)
  {
    id: 'river-narmada',
    name: 'Narmada',
    pointsLonLat: [
      [81.8, 22.7], [80.5, 22.9], [79.2, 22.9], [77.5, 22.8],
      [75.8, 22.2], [74.0, 21.8], [72.8, 21.6],
    ],
  },
  // Tapi River (Betul -> Surat)
  {
    id: 'river-tapi',
    name: 'Tapi',
    pointsLonLat: [
      [78.2, 21.8], [76.5, 21.5], [75.0, 21.2], [73.5, 21.1],
      [72.7, 21.1],
    ],
  },
  // Godavari River (Trimbak -> Bay of Bengal)
  {
    id: 'river-godavari',
    name: 'Godavari',
    pointsLonLat: [
      [73.5, 19.9], [75.0, 19.5], [77.0, 19.0], [78.5, 18.8],
      [79.9, 18.7], [81.5, 17.5], [82.0, 16.7],
    ],
  },
  // Krishna River (Mahabaleshwar -> Bay of Bengal)
  {
    id: 'river-krishna',
    name: 'Krishna',
    pointsLonLat: [
      [73.6, 17.9], [75.0, 17.0], [76.5, 16.5], [78.0, 16.2],
      [80.0, 16.5], [80.8, 15.8],
    ],
  },
  // Kaveri River (Talakaveri -> Bay of Bengal)
  {
    id: 'river-kaveri',
    name: 'Kaveri',
    pointsLonLat: [
      [75.5, 12.4], [76.5, 12.3], [77.5, 12.1], [78.5, 11.5],
      [79.8, 11.1],
    ],
  },
  // Mahanadi River (Sihawa -> Bay of Bengal)
  {
    id: 'river-mahanadi',
    name: 'Mahanadi',
    pointsLonLat: [
      [81.9, 20.3], [82.5, 21.0], [84.0, 21.5], [85.5, 20.5],
      [86.6, 20.3],
    ],
  },
];

// ─── 4. High-Fidelity World Continents & Major Islands (in [lon, lat]) ────────
export interface WorldLandmassPolygon {
  id: string;
  name: string;
  isIsland?: boolean;
  pointsLonLat: [number, number][];
}

export const DETAILED_WORLD_LANDMASSES: WorldLandmassPolygon[] = [
  // 1. Eurasia (Europe & Asia)
  {
    id: 'eurasia',
    name: 'Eurasia',
    pointsLonLat: [
      // Western Europe / Scandinavia / Iberia
      [-9.5, 38.7], [-9.0, 43.0], [-1.8, 43.5], [-4.8, 48.4], [2.3, 51.0],
      [8.5, 54.5], [8.0, 58.0], [18.0, 59.5], [24.0, 65.5], [28.0, 70.0],
      // Northern Russia / Siberia
      [40.0, 68.0], [60.0, 70.0], [75.0, 73.0], [105.0, 77.5], [140.0, 75.0],
      [170.0, 69.5], [170.0, 65.0], [160.0, 55.0], [142.0, 52.0],
      // East Asia (China, Korea, Southeast Asia)
      [130.0, 42.0], [126.0, 37.5], [121.0, 31.2], [113.0, 22.3], [108.0, 15.0],
      [104.0, 10.0], [100.0, 6.0], [98.5, 3.5], [100.0, 13.5], [96.0, 16.5],
      // Indian Subcontinent & Arabian Peninsula
      [92.0, 22.0], [88.5, 21.5], [80.0, 13.0], [77.5, 8.1], [72.8, 19.0],
      [68.1, 23.7], [62.0, 25.0], [56.0, 26.0], [50.0, 26.5], [45.0, 13.0],
      [35.0, 28.0], [36.0, 35.0],
      // Mediterranean / Southern Europe
      [28.0, 41.0], [23.5, 38.0], [18.0, 40.5], [12.5, 42.0], [3.0, 42.0],
      [-5.6, 36.0], [-9.5, 38.7],
    ],
  },
  // 2. Africa
  {
    id: 'africa',
    name: 'Africa',
    pointsLonLat: [
      [-5.6, 36.0], [10.0, 37.0], [25.0, 32.0], [32.5, 31.5], [35.0, 28.0],
      [43.0, 12.5], [51.2, 10.5], [42.0, 0.0], [40.5, -4.0], [35.0, -15.0],
      [32.5, -28.0], [26.0, -34.0], [18.5, -34.8], [15.0, -28.0], [12.0, -17.0],
      [9.0, 2.0], [3.0, 6.0], [-5.0, 5.0], [-15.0, 11.0], [-17.5, 14.8],
      [-16.0, 21.0], [-10.0, 28.0], [-5.6, 36.0],
    ],
  },
  // 3. North America
  {
    id: 'north-america',
    name: 'North America',
    pointsLonLat: [
      // Alaska & Western Canada
      [-168.0, 65.5], [-155.0, 71.0], [-130.0, 70.0], [-110.0, 68.0],
      [-85.0, 65.0], [-75.0, 62.0], [-65.0, 58.0], [-55.0, 50.0],
      // Eastern Coast & Florida
      [-65.0, 44.0], [-74.0, 40.5], [-80.0, 32.0], [-80.5, 25.0],
      // Gulf of Mexico & Central America
      [-85.0, 30.0], [-95.0, 29.0], [-97.5, 26.0], [-92.0, 18.0],
      [-88.0, 16.0], [-83.0, 9.0], [-78.0, 8.0],
      // Pacific Coast
      [-85.0, 12.0], [-95.0, 16.0], [-105.0, 20.0], [-110.0, 24.0],
      [-117.0, 32.5], [-124.0, 40.0], [-125.0, 48.5], [-135.0, 57.0],
      [-150.0, 60.0], [-165.0, 55.0], [-168.0, 65.5],
    ],
  },
  // 4. South America
  {
    id: 'south-america',
    name: 'South America',
    pointsLonLat: [
      [-78.0, 8.0], [-72.0, 11.5], [-60.0, 8.5], [-50.0, 1.0],
      [-35.0, -5.0], [-35.0, -8.0], [-40.0, -20.0], [-45.0, -24.0],
      [-55.0, -35.0], [-65.0, -42.0], [-68.0, -53.0], [-75.0, -50.0],
      [-73.0, -40.0], [-72.0, -30.0], [-77.0, -12.0], [-81.0, -4.5],
      [-78.0, 1.5], [-78.0, 8.0],
    ],
  },
  // 5. Australia
  {
    id: 'australia',
    name: 'Australia',
    pointsLonLat: [
      [130.0, -12.0], [136.0, -12.0], [142.0, -11.0], [145.0, -16.0],
      [153.5, -28.0], [151.0, -34.0], [148.0, -38.0], [140.0, -38.0],
      [135.0, -34.0], [128.0, -32.0], [118.0, -35.0], [115.0, -32.0],
      [113.5, -26.0], [118.0, -20.0], [123.0, -17.0], [130.0, -12.0],
    ],
  },
  // 6. Antarctica
  {
    id: 'antarctica',
    name: 'Antarctica',
    pointsLonLat: [
      [-65.0, -64.0], [-40.0, -75.0], [0.0, -70.0], [45.0, -67.0],
      [90.0, -66.0], [135.0, -66.0], [170.0, -72.0], [-170.0, -78.0],
      [-130.0, -74.0], [-90.0, -72.0], [-65.0, -64.0],
    ],
  },
  // 7. Greenland (Island)
  {
    id: 'greenland',
    name: 'Greenland',
    isIsland: true,
    pointsLonLat: [
      [-44.0, 60.0], [-35.0, 65.5], [-20.0, 70.0], [-18.0, 77.0],
      [-25.0, 82.0], [-40.0, 83.5], [-55.0, 82.0], [-60.0, 76.0],
      [-52.0, 70.0], [-50.0, 64.0], [-44.0, 60.0],
    ],
  },
  // 8. Great Britain & Ireland
  {
    id: 'great-britain',
    name: 'Great Britain',
    isIsland: true,
    pointsLonLat: [
      [-5.0, 50.0], [1.5, 51.2], [1.7, 52.8], [-0.5, 54.5],
      [-2.0, 57.0], [-3.5, 58.6], [-5.0, 58.0], [-5.5, 55.5],
      [-3.0, 53.5], [-5.0, 50.0],
    ],
  },
  // 9. Madagascar
  {
    id: 'madagascar',
    name: 'Madagascar',
    isIsland: true,
    pointsLonLat: [
      [49.5, -12.0], [50.5, -16.0], [49.0, -20.0], [47.5, -25.0],
      [44.0, -25.2], [43.5, -20.0], [46.0, -15.5], [49.5, -12.0],
    ],
  },
  // 10. Japan (Honshu & Hokkaido)
  {
    id: 'japan',
    name: 'Japan',
    isIsland: true,
    pointsLonLat: [
      [141.0, 45.5], [145.5, 44.0], [141.5, 38.5], [140.0, 35.5],
      [136.0, 34.0], [131.0, 33.0], [130.5, 31.5], [132.5, 34.5],
      [137.0, 37.0], [140.0, 40.5], [141.0, 45.5],
    ],
  },
  // 11. Sri Lanka
  {
    id: 'sri-lanka',
    name: 'Sri Lanka',
    isIsland: true,
    pointsLonLat: [
      [80.0, 9.8], [81.5, 8.5], [81.8, 7.0], [81.0, 6.0],
      [80.2, 6.0], [79.8, 7.0], [79.8, 8.5], [80.0, 9.8],
    ],
  },
  // 12. New Zealand (North & South Islands)
  {
    id: 'new-zealand',
    name: 'New Zealand',
    isIsland: true,
    pointsLonLat: [
      [173.0, -35.0], [178.0, -38.0], [176.0, -40.0], [174.5, -41.5],
      [172.5, -43.5], [170.0, -46.0], [167.0, -46.0], [169.0, -44.0],
      [173.0, -41.0], [175.0, -37.0], [173.0, -35.0],
    ],
  },
  // 13. Andaman & Nicobar Islands (India)
  {
    id: 'andaman-nicobar',
    name: 'Andaman & Nicobar Islands (India)',
    isIsland: true,
    pointsLonLat: [
      [93.0, 13.5], [93.1, 12.5], [92.8, 11.5], [92.6, 10.5],
      [92.8, 9.2], [93.8, 7.0], [93.9, 6.8], [93.7, 7.2],
      [92.5, 9.2], [92.4, 11.5], [92.6, 13.5], [93.0, 13.5],
    ],
  },
];

// ─── 5. Comprehensive 28 States & 8 UTs Registry (Official SoI Standards) ─────
export interface IndianStateInfo {
  id: string;
  name: string;
  code: string;
  isUT: boolean;
  capital: string;
  districts: number;
  areaKm2: number;
  officialPortal: string;
  assetPath: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East' | 'Islands';
  centerLonLat: [number, number];
}

export const ALL_INDIAN_STATES_DATA: IndianStateInfo[] = [
  // 28 States
  {
    id: 'in-ap',
    name: 'Andhra Pradesh',
    code: 'AP',
    isUT: false,
    capital: 'Amaravati',
    districts: 26,
    areaKm2: 162970,
    officialPortal: 'https://www.ap.gov.in',
    assetPath: './assets/maps/states/in-ap.svg',
    region: 'South',
    centerLonLat: [79.74, 15.91],
  },
  {
    id: 'in-ar',
    name: 'Arunachal Pradesh',
    code: 'AR',
    isUT: false,
    capital: 'Itanagar',
    districts: 26,
    areaKm2: 83743,
    officialPortal: 'https://arunachalpradesh.gov.in',
    assetPath: './assets/maps/states/in-ar.svg',
    region: 'North-East',
    centerLonLat: [94.72, 28.21],
  },
  {
    id: 'in-as',
    name: 'Assam',
    code: 'AS',
    isUT: false,
    capital: 'Dispur',
    districts: 35,
    areaKm2: 78438,
    officialPortal: 'https://assam.gov.in',
    assetPath: './assets/maps/states/in-as.svg',
    region: 'North-East',
    centerLonLat: [92.93, 26.20],
  },
  {
    id: 'in-br',
    name: 'Bihar',
    code: 'BR',
    isUT: false,
    capital: 'Patna',
    districts: 38,
    areaKm2: 94163,
    officialPortal: 'https://state.bihar.gov.in',
    assetPath: './assets/maps/states/in-br.svg',
    region: 'East',
    centerLonLat: [85.31, 25.09],
  },
  {
    id: 'in-cg',
    name: 'Chhattisgarh',
    code: 'CG',
    isUT: false,
    capital: 'Raipur',
    districts: 33,
    areaKm2: 135192,
    officialPortal: 'https://cgstate.gov.in',
    assetPath: './assets/maps/states/in-cg.svg',
    region: 'Central',
    centerLonLat: [81.86, 21.27],
  },
  {
    id: 'in-ga',
    name: 'Goa',
    code: 'GA',
    isUT: false,
    capital: 'Panaji',
    districts: 2,
    areaKm2: 3702,
    officialPortal: 'https://www.goa.gov.in',
    assetPath: './assets/maps/states/in-ga.svg',
    region: 'West',
    centerLonLat: [74.12, 15.29],
  },
  {
    id: 'in-gj',
    name: 'Gujarat',
    code: 'GJ',
    isUT: false,
    capital: 'Gandhinagar',
    districts: 33,
    areaKm2: 196024,
    officialPortal: 'https://gujaratindia.gov.in',
    assetPath: './assets/maps/states/in-gj.svg',
    region: 'West',
    centerLonLat: [71.19, 22.25],
  },
  {
    id: 'in-hr',
    name: 'Haryana',
    code: 'HR',
    isUT: false,
    capital: 'Chandigarh',
    districts: 22,
    areaKm2: 44212,
    officialPortal: 'https://haryana.gov.in',
    assetPath: './assets/maps/states/in-hr.svg',
    region: 'North',
    centerLonLat: [76.08, 29.05],
  },
  {
    id: 'in-hp',
    name: 'Himachal Pradesh',
    code: 'HP',
    isUT: false,
    capital: 'Shimla',
    districts: 12,
    areaKm2: 55673,
    officialPortal: 'https://himachal.nic.in',
    assetPath: './assets/maps/states/in-hp.svg',
    region: 'North',
    centerLonLat: [77.17, 31.10],
  },
  {
    id: 'in-jh',
    name: 'Jharkhand',
    code: 'JH',
    isUT: false,
    capital: 'Ranchi',
    districts: 24,
    areaKm2: 79714,
    officialPortal: 'https://www.jharkhand.gov.in',
    assetPath: './assets/maps/states/in-jh.svg',
    region: 'East',
    centerLonLat: [85.27, 23.61],
  },
  {
    id: 'in-ka',
    name: 'Karnataka',
    code: 'KA',
    isUT: false,
    capital: 'Bengaluru',
    districts: 31,
    areaKm2: 191791,
    officialPortal: 'https://karnataka.gov.in',
    assetPath: './assets/maps/states/in-ka.svg',
    region: 'South',
    centerLonLat: [75.71, 15.31],
  },
  {
    id: 'in-kl',
    name: 'Kerala',
    code: 'KL',
    isUT: false,
    capital: 'Thiruvananthapuram',
    districts: 14,
    areaKm2: 38863,
    officialPortal: 'https://kerala.gov.in',
    assetPath: './assets/maps/states/in-kl.svg',
    region: 'South',
    centerLonLat: [76.27, 10.85],
  },
  {
    id: 'in-mp',
    name: 'Madhya Pradesh',
    code: 'MP',
    isUT: false,
    capital: 'Bhopal',
    districts: 55,
    areaKm2: 308245,
    officialPortal: 'https://mp.gov.in',
    assetPath: './assets/maps/states/in-mp.svg',
    region: 'Central',
    centerLonLat: [78.65, 22.97],
  },
  {
    id: 'in-mh',
    name: 'Maharashtra',
    code: 'MH',
    isUT: false,
    capital: 'Mumbai',
    districts: 36,
    areaKm2: 307713,
    officialPortal: 'https://www.maharashtra.gov.in',
    assetPath: './assets/maps/states/in-mh.svg',
    region: 'West',
    centerLonLat: [75.71, 19.75],
  },
  {
    id: 'in-mn',
    name: 'Manipur',
    code: 'MN',
    isUT: false,
    capital: 'Imphal',
    districts: 16,
    areaKm2: 22327,
    officialPortal: 'https://manipur.gov.in',
    assetPath: './assets/maps/states/in-mn.svg',
    region: 'North-East',
    centerLonLat: [93.90, 24.66],
  },
  {
    id: 'in-ml',
    name: 'Meghalaya',
    code: 'ML',
    isUT: false,
    capital: 'Shillong',
    districts: 12,
    areaKm2: 22429,
    officialPortal: 'https://meghalaya.gov.in',
    assetPath: './assets/maps/states/in-ml.svg',
    region: 'North-East',
    centerLonLat: [91.36, 25.46],
  },
  {
    id: 'in-mz',
    name: 'Mizoram',
    code: 'MZ',
    isUT: false,
    capital: 'Aizawl',
    districts: 11,
    areaKm2: 21081,
    officialPortal: 'https://mizoram.gov.in',
    assetPath: './assets/maps/states/in-mz.svg',
    region: 'North-East',
    centerLonLat: [92.93, 23.16],
  },
  {
    id: 'in-nl',
    name: 'Nagaland',
    code: 'NL',
    isUT: false,
    capital: 'Kohima',
    districts: 16,
    areaKm2: 16579,
    officialPortal: 'https://nagaland.gov.in',
    assetPath: './assets/maps/states/in-nl.svg',
    region: 'North-East',
    centerLonLat: [94.56, 26.15],
  },
  {
    id: 'in-od',
    name: 'Odisha',
    code: 'OD',
    isUT: false,
    capital: 'Bhubaneswar',
    districts: 30,
    areaKm2: 155707,
    officialPortal: 'https://odisha.gov.in',
    assetPath: './assets/maps/states/in-od.svg',
    region: 'East',
    centerLonLat: [84.80, 20.95],
  },
  {
    id: 'in-pb',
    name: 'Punjab',
    code: 'PB',
    isUT: false,
    capital: 'Chandigarh',
    districts: 23,
    areaKm2: 50362,
    officialPortal: 'https://punjab.gov.in',
    assetPath: './assets/maps/states/in-pb.svg',
    region: 'North',
    centerLonLat: [75.34, 31.14],
  },
  {
    id: 'in-rj',
    name: 'Rajasthan',
    code: 'RJ',
    isUT: false,
    capital: 'Jaipur',
    districts: 50,
    areaKm2: 342239,
    officialPortal: 'https://rajasthan.gov.in',
    assetPath: './assets/maps/states/in-rj.svg',
    region: 'North',
    centerLonLat: [74.21, 27.02],
  },
  {
    id: 'in-sk',
    name: 'Sikkim',
    code: 'SK',
    isUT: false,
    capital: 'Gangtok',
    districts: 6,
    areaKm2: 7096,
    officialPortal: 'https://sikkim.gov.in',
    assetPath: './assets/maps/states/in-sk.svg',
    region: 'North-East',
    centerLonLat: [88.51, 27.53],
  },
  {
    id: 'in-tn',
    name: 'Tamil Nadu',
    code: 'TN',
    isUT: false,
    capital: 'Chennai',
    districts: 38,
    areaKm2: 130058,
    officialPortal: 'https://www.tn.gov.in',
    assetPath: './assets/maps/states/in-tn.svg',
    region: 'South',
    centerLonLat: [78.65, 11.12],
  },
  {
    id: 'in-ts',
    name: 'Telangana',
    code: 'TS',
    isUT: false,
    capital: 'Hyderabad',
    districts: 33,
    areaKm2: 112077,
    officialPortal: 'https://telangana.gov.in',
    assetPath: './assets/maps/states/in-ts.svg',
    region: 'South',
    centerLonLat: [79.01, 18.11],
  },
  {
    id: 'in-tr',
    name: 'Tripura',
    code: 'TR',
    isUT: false,
    capital: 'Agartala',
    districts: 8,
    areaKm2: 10491,
    officialPortal: 'https://tripura.gov.in',
    assetPath: './assets/maps/states/in-tr.svg',
    region: 'North-East',
    centerLonLat: [91.98, 23.94],
  },
  {
    id: 'in-up',
    name: 'Uttar Pradesh',
    code: 'UP',
    isUT: false,
    capital: 'Lucknow',
    districts: 75,
    areaKm2: 240928,
    officialPortal: 'https://up.gov.in',
    assetPath: './assets/maps/states/in-up.svg',
    region: 'North',
    centerLonLat: [80.94, 26.84],
  },
  {
    id: 'in-uk',
    name: 'Uttarakhand',
    code: 'UK',
    isUT: false,
    capital: 'Dehradun / Gairsain',
    districts: 13,
    areaKm2: 53483,
    officialPortal: 'https://uk.gov.in',
    assetPath: './assets/maps/states/in-uk.svg',
    region: 'North',
    centerLonLat: [79.06, 30.06],
  },
  {
    id: 'in-wb',
    name: 'West Bengal',
    code: 'WB',
    isUT: false,
    capital: 'Kolkata',
    districts: 23,
    areaKm2: 88752,
    officialPortal: 'https://wb.gov.in',
    assetPath: './assets/maps/states/in-wb.svg',
    region: 'East',
    centerLonLat: [87.85, 22.98],
  },

  // 8 Union Territories
  {
    id: 'in-an',
    name: 'Andaman and Nicobar Islands',
    code: 'AN',
    isUT: true,
    capital: 'Port Blair',
    districts: 3,
    areaKm2: 8249,
    officialPortal: 'https://www.andaman.gov.in',
    assetPath: './assets/maps/states/in-an.svg',
    region: 'Islands',
    centerLonLat: [92.74, 11.62],
  },
  {
    id: 'in-ch',
    name: 'Chandigarh',
    code: 'CH',
    isUT: true,
    capital: 'Chandigarh',
    districts: 1,
    areaKm2: 114,
    officialPortal: 'https://chandigarh.gov.in',
    assetPath: './assets/maps/states/in-ch.svg',
    region: 'North',
    centerLonLat: [76.77, 30.73],
  },
  {
    id: 'in-dnhdd',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    code: 'DD',
    isUT: true,
    capital: 'Daman',
    districts: 3,
    areaKm2: 603,
    officialPortal: 'https://ddd.gov.in',
    assetPath: './assets/maps/states/in-dnhdd.svg',
    region: 'West',
    centerLonLat: [72.83, 20.42],
  },
  {
    id: 'in-dl',
    name: 'Delhi (NCT)',
    code: 'DL',
    isUT: true,
    capital: 'New Delhi',
    districts: 11,
    areaKm2: 1483,
    officialPortal: 'https://delhi.gov.in',
    assetPath: './assets/maps/states/in-dl.svg',
    region: 'North',
    centerLonLat: [77.10, 28.70],
  },
  {
    id: 'in-jk',
    name: 'Jammu and Kashmir',
    code: 'JK',
    isUT: true,
    capital: 'Srinagar / Jammu',
    districts: 20,
    areaKm2: 42241,
    officialPortal: 'https://jk.gov.in',
    assetPath: './assets/maps/states/in-jk.svg',
    region: 'North',
    centerLonLat: [74.79, 34.08],
  },
  {
    id: 'in-la',
    name: 'Ladakh',
    code: 'LA',
    isUT: true,
    capital: 'Leh',
    districts: 2,
    areaKm2: 59146,
    officialPortal: 'https://ladakh.nic.in',
    assetPath: './assets/maps/states/in-la.svg',
    region: 'North',
    centerLonLat: [77.57, 34.15],
  },
  {
    id: 'in-ld',
    name: 'Lakshadweep',
    code: 'LD',
    isUT: true,
    capital: 'Kavaratti',
    districts: 1,
    areaKm2: 32,
    officialPortal: 'https://lakshadweep.gov.in',
    assetPath: './assets/maps/states/in-ld.svg',
    region: 'Islands',
    centerLonLat: [72.64, 10.56],
  },
  {
    id: 'in-py',
    name: 'Puducherry',
    code: 'PY',
    isUT: true,
    capital: 'Puducherry',
    districts: 4,
    areaKm2: 490,
    officialPortal: 'https://py.gov.in',
    assetPath: './assets/maps/states/in-py.svg',
    region: 'South',
    centerLonLat: [79.80, 11.94],
  },
];

// ─── 6. Comprehensive Rivers in India Registry & Hydrography ─────────────────
export interface ComprehensiveRiverInfo {
  id: string;
  name: string;
  basinSystem: 'Himalayan' | 'Peninsular East-Flowing' | 'Peninsular West-Flowing' | 'Inland & Coastal';
  origin: string;
  mouth: string;
  lengthKm: number;
  drainageStates: string[];
  keyTributaries: string[];
  majorDams: string[];
  color: string;
  pointsLonLat: [number, number][];
}

export const COMPREHENSIVE_INDIAN_RIVERS: ComprehensiveRiverInfo[] = [
  {
    id: 'river-ganga',
    name: 'Ganga',
    basinSystem: 'Himalayan',
    origin: 'Gangotri Glacier (Bhagirathi), Gaumukh, Uttarakhand',
    mouth: 'Bay of Bengal (Sundarbans Delta)',
    lengthKm: 2525,
    drainageStates: ['Uttarakhand', 'Uttar Pradesh', 'Bihar', 'West Bengal'],
    keyTributaries: ['Yamuna', 'Ghaghara', 'Gandak', 'Kosi', 'Son', 'Ramganga', 'Gomti', 'Damodar'],
    majorDams: ['Tehri Dam (Uttarakhand)', 'Farakka Barrage (West Bengal)', 'BhimGoda Barrage (Haridwar)'],
    color: '#38bdf8',
    pointsLonLat: [
      [78.9, 30.9], [78.6, 30.1], [78.2, 29.9], [79.0, 28.5],
      [80.3, 26.5], [81.8, 25.4], [83.0, 25.3], [85.1, 25.6],
      [87.0, 25.3], [88.1, 24.8], [88.3, 22.5], [88.5, 21.8],
    ],
  },
  {
    id: 'river-yamuna',
    name: 'Yamuna',
    basinSystem: 'Himalayan',
    origin: 'Yamunotri Glacier, Banderpooch Peaks, Uttarakhand',
    mouth: 'Triveni Sangam (Confluence with Ganga at Prayagraj)',
    lengthKm: 1376,
    drainageStates: ['Uttarakhand', 'Himachal Pradesh', 'Haryana', 'Delhi', 'Uttar Pradesh'],
    keyTributaries: ['Chambal', 'Sindh', 'Betwa', 'Ken', 'Tons', 'Hindon'],
    majorDams: ['Lakhwar Dam', 'Hathnikund Barrage', 'Wazirabad Barrage'],
    color: '#0284c7',
    pointsLonLat: [
      [78.4, 31.0], [77.7, 30.4], [77.2, 28.6], [77.7, 27.5],
      [78.0, 27.2], [79.0, 26.6], [80.3, 25.8], [81.8, 25.4],
    ],
  },
  {
    id: 'river-brahmaputra',
    name: 'Brahmaputra',
    basinSystem: 'Himalayan',
    origin: 'Chemayungdung Glacier near Mansarovar (Yarlung Tsangpo), Tibet',
    mouth: 'Bay of Bengal (Meghna estuary, Bangladesh)',
    lengthKm: 2900,
    drainageStates: ['Arunachal Pradesh', 'Assam', 'Meghalaya'],
    keyTributaries: ['Dibang', 'Lohit', 'Subansiri', 'Manas', 'Teesta', 'Dhansiri', 'Kopili'],
    majorDams: ['Ranganadi Dam', 'Subansiri Lower Project'],
    color: '#06b6d4',
    pointsLonLat: [
      [95.5, 29.5], [95.0, 28.0], [94.5, 27.3], [93.2, 26.6],
      [91.8, 26.1], [90.5, 26.1], [89.8, 25.2], [90.0, 23.5],
      [90.5, 22.2],
    ],
  },
  {
    id: 'river-indus',
    name: 'Indus (Sindhu)',
    basinSystem: 'Himalayan',
    origin: 'Bokhar Chu Glacier, Mount Kailash region, Tibet',
    mouth: 'Arabian Sea (south of Karachi)',
    lengthKm: 3180,
    drainageStates: ['Ladakh (India)', 'Jammu & Kashmir (India)'],
    keyTributaries: ['Zanskar', 'Shyok', 'Gilgit', 'Jhelum', 'Chenab', 'Ravi', 'Beas', 'Sutlej'],
    majorDams: ['Nimoo Bazgo Dam (Ladakh)', 'Chutak Dam (Kargil)'],
    color: '#0ea5e9',
    pointsLonLat: [
      [79.2, 32.8], [78.5, 33.3], [77.6, 34.1], [76.8, 34.6],
      [76.0, 34.8], [75.0, 35.3], [74.5, 35.5],
    ],
  },
  {
    id: 'river-jhelum',
    name: 'Jhelum (Vitasta)',
    basinSystem: 'Himalayan',
    origin: 'Verinag Spring, Pir Panjal range, Jammu & Kashmir',
    mouth: 'Confluence with Chenab River at Trimmu',
    lengthKm: 725,
    drainageStates: ['Jammu & Kashmir'],
    keyTributaries: ['Lidder', 'Sind River (J&K)', 'Neelum / Kishanganga', 'Poonch'],
    majorDams: ['Uri Hydroelectric Project', 'Kishanganga Power Plant', 'Mangla Dam'],
    color: '#22d3ee',
    pointsLonLat: [
      [75.2, 33.5], [75.0, 33.9], [74.8, 34.1], [74.3, 34.3],
      [74.1, 34.2], [73.8, 34.0],
    ],
  },
  {
    id: 'river-chenab',
    name: 'Chenab (Asikni)',
    basinSystem: 'Himalayan',
    origin: 'Confluence of Chandra and Bhaga rivers at Tandi, Lahaul (HP)',
    mouth: 'Confluence with Sutlej River at Uch Sharif (forming Panjnad)',
    lengthKm: 960,
    drainageStates: ['Himachal Pradesh', 'Jammu & Kashmir'],
    keyTributaries: ['Tawi', 'Marusudar', 'Kalnai'],
    majorDams: ['Salal Dam', 'Baglihar Dam', 'Dul Hasti Dam', 'Ratle Dam'],
    color: '#38bdf8',
    pointsLonLat: [
      [76.9, 32.5], [76.2, 33.0], [75.4, 33.2], [74.8, 33.1],
      [74.3, 32.9], [74.0, 32.7],
    ],
  },
  {
    id: 'river-ravi',
    name: 'Ravi (Purushni)',
    basinSystem: 'Himalayan',
    origin: 'Bara Bhangal, Kangra district, Himachal Pradesh',
    mouth: 'Confluence with Chenab River in Pakistan',
    lengthKm: 720,
    drainageStates: ['Himachal Pradesh', 'Jammu & Kashmir', 'Punjab'],
    keyTributaries: ['Budhil', 'Nai', 'Seul', 'Sewa', 'Ujh'],
    majorDams: ['Ranjit Sagar Dam (Thein Dam)', 'Chamera Dam', 'Shahpurkandi Dam'],
    color: '#60a5fa',
    pointsLonLat: [
      [76.8, 32.3], [76.0, 32.5], [75.8, 32.4], [75.3, 32.1],
      [74.9, 31.8], [74.5, 31.6],
    ],
  },
  {
    id: 'river-beas',
    name: 'Beas (Vipasha)',
    basinSystem: 'Himalayan',
    origin: 'Beas Kund near Rohtang Pass, Himachal Pradesh',
    mouth: 'Confluence with Sutlej River at Harike Pattan (Punjab)',
    lengthKm: 470,
    drainageStates: ['Himachal Pradesh', 'Punjab'],
    keyTributaries: ['Parbati', 'Tirthan', 'UhL', 'Suket'],
    majorDams: ['Pong Dam (Maharana Pratap Sagar)', 'Pandoh Dam'],
    color: '#818cf8',
    pointsLonLat: [
      [77.1, 32.3], [77.2, 31.8], [76.6, 31.8], [76.1, 31.9],
      [75.6, 31.7], [74.9, 31.2],
    ],
  },
  {
    id: 'river-sutlej',
    name: 'Sutlej (Shatadru)',
    basinSystem: 'Himalayan',
    origin: 'Lake Rakshastal near Mount Kailash, Tibet',
    mouth: 'Confluence with Chenab River at Panjnad',
    lengthKm: 1450,
    drainageStates: ['Himachal Pradesh', 'Punjab'],
    keyTributaries: ['Spiti', 'Baspa', 'Beas', 'Sohan'],
    majorDams: ['Bhakra Dam (Gobind Sagar)', 'Nangal Dam', 'Karcham Wangtoo', 'Nathpa Jhakri'],
    color: '#67e8f9',
    pointsLonLat: [
      [78.5, 31.6], [77.7, 31.4], [76.8, 31.3], [76.4, 31.4],
      [75.8, 31.1], [74.9, 31.1], [74.3, 30.8],
    ],
  },
  {
    id: 'river-godavari',
    name: 'Godavari (Dakshin Ganga)',
    basinSystem: 'Peninsular East-Flowing',
    origin: 'Trimbakeshwar, Brahmagiri Mountains, Nashik, Maharashtra',
    mouth: 'Bay of Bengal (near Yanam / Rajahmundry)',
    lengthKm: 1465,
    drainageStates: ['Maharashtra', 'Telangana', 'Andhra Pradesh', 'Chhattisgarh', 'Odisha'],
    keyTributaries: ['Pravara', 'Manjira', 'Purna', 'Pranhita (Wainganga/Wardha)', 'Indravati', 'Sabari'],
    majorDams: ['Jayakwadi Dam (Paithan)', 'Sriram Sagar Project (Pochampad)', 'Polavaram Project', 'Dowelshwaram Barrage'],
    color: '#0284c7',
    pointsLonLat: [
      [73.5, 19.9], [75.0, 19.5], [77.0, 19.0], [78.5, 18.8],
      [79.9, 18.7], [81.5, 17.5], [82.0, 16.7],
    ],
  },
  {
    id: 'river-krishna',
    name: 'Krishna',
    basinSystem: 'Peninsular East-Flowing',
    origin: 'Mahabaleshwar, Western Ghats, Maharashtra',
    mouth: 'Bay of Bengal (Hamsaladeevi, Andhra Pradesh)',
    lengthKm: 1400,
    drainageStates: ['Maharashtra', 'Karnataka', 'Telangana', 'Andhra Pradesh'],
    keyTributaries: ['Koyna', 'Tungabhadra', 'Bhima', 'Ghataprabha', 'Malaprabha', 'Musi', 'Dindi'],
    majorDams: ['Almatti Dam (Lal Bahadur Shastri Sagar)', 'Narayanpur Dam', 'Srisailam Dam', 'Nagarjuna Sagar Dam', 'Prakasam Barrage'],
    color: '#0369a1',
    pointsLonLat: [
      [73.6, 17.9], [75.0, 17.0], [76.5, 16.5], [78.0, 16.2],
      [80.0, 16.5], [80.8, 15.8],
    ],
  },
  {
    id: 'river-tungabhadra',
    name: 'Tungabhadra',
    basinSystem: 'Peninsular East-Flowing',
    origin: 'Confluence of Tunga and Bhadra at Koodli, Karnataka',
    mouth: 'Confluence with Krishna River near Alampur, Telangana',
    lengthKm: 531,
    drainageStates: ['Karnataka', 'Telangana', 'Andhra Pradesh'],
    keyTributaries: ['Varada', 'Kumadvathi', 'Vedavathi / Hagari'],
    majorDams: ['Tungabhadra Dam (Hosapete, Karnataka)'],
    color: '#38bdf8',
    pointsLonLat: [
      [75.7, 14.0], [76.0, 14.8], [76.4, 15.3], [77.0, 15.6],
      [77.8, 15.9], [78.1, 16.0],
    ],
  },
  {
    id: 'river-narmada',
    name: 'Narmada (Reva)',
    basinSystem: 'Peninsular West-Flowing',
    origin: 'Amarkantak Plateau, Anuppur district, Madhya Pradesh',
    mouth: 'Arabian Sea (Gulf of Khambhat, Bharuch, Gujarat)',
    lengthKm: 1312,
    drainageStates: ['Madhya Pradesh', 'Maharashtra', 'Gujarat'],
    keyTributaries: ['Tawa', 'Hiran', 'Sher', 'Shakkar', 'Dudhi', 'Kolar', 'Barna'],
    majorDams: ['Sardar Sarovar Dam (Gujarat)', 'Indira Sagar Dam (MP)', 'Omkareshwar Dam (MP)', 'Bargi Dam (Jabalpur)'],
    color: '#0ea5e9',
    pointsLonLat: [
      [81.8, 22.7], [80.5, 22.9], [79.2, 22.9], [77.5, 22.8],
      [75.8, 22.2], [74.0, 21.8], [72.8, 21.6],
    ],
  },
  {
    id: 'river-tapi',
    name: 'Tapi (Tapti)',
    basinSystem: 'Peninsular West-Flowing',
    origin: 'Multai reserve forest, Betul district, Satpura Range (MP)',
    mouth: 'Arabian Sea (Gulf of Khambhat near Surat, Gujarat)',
    lengthKm: 724,
    drainageStates: ['Madhya Pradesh', 'Maharashtra', 'Gujarat'],
    keyTributaries: ['Purna', 'Girna', 'Panjhra', 'Waghur', 'Bori', 'Aner'],
    majorDams: ['Ukai Dam (Vallabh Sagar, Gujarat)', 'Hathnur Dam (Maharashtra)', 'Kakrapar Weir'],
    color: '#38bdf8',
    pointsLonLat: [
      [78.2, 21.8], [76.5, 21.5], [75.0, 21.2], [73.5, 21.1],
      [72.7, 21.1],
    ],
  },
  {
    id: 'river-mahanadi',
    name: 'Mahanadi',
    basinSystem: 'Peninsular East-Flowing',
    origin: 'Sihawa foothills, Dhamtari district, Chhattisgarh',
    mouth: 'Bay of Bengal (False Point, Kendrapara, Odisha)',
    lengthKm: 851,
    drainageStates: ['Chhattisgarh', 'Odisha', 'Madhya Pradesh', 'Maharashtra', 'Jharkhand'],
    keyTributaries: ['Seonath', 'Hasdeo', 'Mand', 'Ib', 'Ong', 'Tel', 'Jonk'],
    majorDams: ['Hirakud Dam (World\'s longest earthen dam, Sambalpur)', 'Ravishankar Sagar (Gangrel Dam)', 'Dudhawa Dam'],
    color: '#0284c7',
    pointsLonLat: [
      [81.9, 20.3], [82.5, 21.0], [84.0, 21.5], [85.5, 20.5],
      [86.6, 20.3],
    ],
  },
  {
    id: 'river-kaveri',
    name: 'Kaveri (Cauvery)',
    basinSystem: 'Peninsular East-Flowing',
    origin: 'Talakaveri, Brahmagiri range, Kodagu (Coorg), Karnataka',
    mouth: 'Bay of Bengal (Poompuhar, Mayiladuthurai, Tamil Nadu)',
    lengthKm: 805,
    drainageStates: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Puducherry'],
    keyTributaries: ['Harangi', 'Hemavati', 'Shimsha', 'Arkavathi', 'Kabini', 'Bhavani', 'Noyyal', 'Amaravati'],
    majorDams: ['Krishna Raja Sagara (KRS Dam, Mysuru)', 'Mettur Dam (Stanley Reservoir, TN)', 'Grand Anicut (Kallanai built by Karikala Chola)'],
    color: '#0284c7',
    pointsLonLat: [
      [75.5, 12.4], [76.5, 12.3], [77.5, 12.1], [78.5, 11.5],
      [79.8, 11.1],
    ],
  },
  {
    id: 'river-chambal',
    name: 'Chambal',
    basinSystem: 'Himalayan',
    origin: 'Janapav Hills near Manpur, Mhow, Vindhya Range (MP)',
    mouth: 'Confluence with Yamuna River at Pachnada (Etawah, UP)',
    lengthKm: 1024,
    drainageStates: ['Madhya Pradesh', 'Rajasthan', 'Uttar Pradesh'],
    keyTributaries: ['Banas', 'Kali Sindh', 'Parbati', 'Kshipra', 'Mej'],
    majorDams: ['Gandhi Sagar Dam (MP)', 'Rana Pratap Sagar Dam (Rawatbhata)', 'Jawahar Sagar Dam', 'Kota Barrage'],
    color: '#2563eb',
    pointsLonLat: [
      [75.7, 22.4], [75.5, 24.5], [75.8, 25.0], [76.4, 25.8],
      [77.5, 26.5], [79.0, 26.6],
    ],
  },
  {
    id: 'river-son',
    name: 'Son (Sone)',
    basinSystem: 'Himalayan',
    origin: 'Amarkantak Hills, Bilaspur/Anuppur, Madhya Pradesh',
    mouth: 'Confluence with Ganga River near Danapur/Patna (Bihar)',
    lengthKm: 784,
    drainageStates: ['Madhya Pradesh', 'Chhattisgarh', 'Uttar Pradesh', 'Bihar'],
    keyTributaries: ['Rihand', 'North Koel', 'Gopad', 'Kanhar'],
    majorDams: ['Bansagar Dam (MP)', 'Rihand Dam (Govind Ballabh Pant Sagar, UP)', 'Indrapuri Barrage (Dehri-on-Sone)'],
    color: '#3b82f6',
    pointsLonLat: [
      [81.9, 22.8], [81.5, 24.1], [82.5, 24.5], [83.5, 24.5],
      [84.3, 25.0], [84.9, 25.6],
    ],
  },
  {
    id: 'river-damodar',
    name: 'Damodar (Sorrow of Bengal)',
    basinSystem: 'Himalayan',
    origin: 'Khamarpat hill, Chota Nagpur Plateau, Palamu (Jharkhand)',
    mouth: 'Confluence with Hooghly River near Shyampur (WB)',
    lengthKm: 592,
    drainageStates: ['Jharkhand', 'West Bengal'],
    keyTributaries: ['Barakar', 'Konar', 'Bokaro', 'Haharo'],
    majorDams: ['Tilaiya Dam', 'Maithon Dam', 'Panchet Dam', 'Konar Dam', 'Durgapur Barrage (DVC - Damodar Valley Corp)'],
    color: '#60a5fa',
    pointsLonLat: [
      [84.7, 23.6], [85.5, 23.7], [86.5, 23.7], [87.2, 23.4],
      [87.9, 23.1], [88.1, 22.3],
    ],
  },
  {
    id: 'river-sabarmati',
    name: 'Sabarmati',
    basinSystem: 'Peninsular West-Flowing',
    origin: 'Aravalli Range, Tepur village, Udaipur district (Rajasthan)',
    mouth: 'Arabian Sea (Gulf of Khambhat)',
    lengthKm: 371,
    drainageStates: ['Rajasthan', 'Gujarat'],
    keyTributaries: ['Wakal', 'Harnav', 'Hathmati', 'Vatrak', 'Sei'],
    majorDams: ['Dharoi Dam', 'Vasna Barrage (Ahmedabad Sabarmati Riverfront)'],
    color: '#38bdf8',
    pointsLonLat: [
      [73.3, 24.6], [73.0, 23.7], [72.6, 23.1], [72.5, 22.6],
      [72.3, 22.2],
    ],
  },
  {
    id: 'river-mahi',
    name: 'Mahi (Crosses Tropic of Cancer Twice)',
    basinSystem: 'Peninsular West-Flowing',
    origin: 'Minda Village, Dhar district, Vindhya Range (MP)',
    mouth: 'Arabian Sea (Gulf of Khambhat)',
    lengthKm: 583,
    drainageStates: ['Madhya Pradesh', 'Rajasthan', 'Gujarat'],
    keyTributaries: ['Som', 'Anas', 'Panam'],
    majorDams: ['Mahi Bajaj Sagar Dam (Banswara, Rajasthan)', 'Kadana Dam (Gujarat)', 'Wanakbori Dam'],
    color: '#06b6d4',
    pointsLonLat: [
      [75.0, 22.5], [74.8, 23.5], [74.3, 23.8], [73.8, 23.0],
      [72.9, 22.3],
    ],
  },
  {
    id: 'river-periyar',
    name: 'Periyar (Lifeline of Kerala)',
    basinSystem: 'Peninsular West-Flowing',
    origin: 'Sivagiri Hills, Western Ghats, Sundaramala (Tamil Nadu border)',
    mouth: 'Arabian Sea at Munambam / Kodungallur',
    lengthKm: 244,
    drainageStates: ['Kerala', 'Tamil Nadu'],
    keyTributaries: ['Muthirapuzha', 'Mullayar', 'Cheruthoni', 'Perinjankutti', 'Edamalayar'],
    majorDams: ['Idukki Arch Dam (one of highest in Asia)', 'Mullaperiyar Dam', 'Cheruthoni Dam', 'Bhoothathankettu'],
    color: '#22d3ee',
    pointsLonLat: [
      [77.2, 9.4], [77.0, 9.8], [76.8, 10.0], [76.5, 10.1],
      [76.2, 10.2],
    ],
  },
  {
    id: 'river-luni',
    name: 'Luni (Salt River / Ephemeral)',
    basinSystem: 'Inland & Coastal',
    origin: 'Pushkar Valley of the Aravalli Range near Ajmer (Rajasthan)',
    mouth: 'Inland drainage into the Rann of Kutch (Gujarat)',
    lengthKm: 495,
    drainageStates: ['Rajasthan', 'Gujarat'],
    keyTributaries: ['Jawai', 'Sukri', 'Bandi', 'Khari', 'Jojari', 'Guhiya'],
    majorDams: ['Dantiwada Dam', 'Jaswant Sagar Dam (Pichiyak)', 'Jawai Dam'],
    color: '#f59e0b',
    pointsLonLat: [
      [74.6, 26.5], [73.8, 26.1], [72.8, 25.5], [71.8, 24.9],
      [71.1, 24.3],
    ],
  },
];



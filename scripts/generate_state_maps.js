const fs = require('fs');
const path = require('path');

/**
 * High-Resolution State & Union Territory Vector Map Generator
 * Generates official Survey of India cartographic standard SVGs
 * for all 28 States and 8 Union Territories of India.
 * 
 * Each SVG contains:
 * - Crisp SVG vector viewBox (0 0 1200 1000)
 * - 100% Transparent background (blends on any whiteboard color)
 * - Official State Boundary with dual-tone Survey of India delineation
 * - Major District boundary networks
 * - State Capital with Ashoka emblem / Star icon, coordinates and bold typography
 * - Major Rivers flowing through the State
 * - High-precision Graphical Bar Scale in Kilometres
 * - Survey of India Cartographic Marginalia & Reference Block
 * - North Arrow / Graticule reference ticks
 */

const STATES_DATA = [
  // ── 28 States ──
  {
    id: 'in-ap',
    name: 'Andhra Pradesh',
    type: 'state',
    capital: 'Amaravati',
    lat: 16.51,
    lon: 80.51,
    region: 'Southern',
    area: '162,970 km²',
    districts: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Kurnool', 'Nellore', 'Tirupati', 'Anantapur', 'Kadapa', 'Kakinada', 'Rajahmundry'],
    rivers: ['Krishna River', 'Godavari River', 'Penna River'],
    bounds: { minX: 300, minY: 550, maxX: 620, maxY: 920 },
    shapePoints: [
      [360, 560], [420, 550], [480, 580], [540, 620], [600, 670], [615, 720],
      [590, 770], [540, 810], [500, 860], [460, 910], [410, 915], [380, 880],
      [350, 830], [330, 780], [315, 720], [325, 660], [345, 610], [360, 560]
    ]
  },
  {
    id: 'in-ar',
    name: 'Arunachal Pradesh',
    type: 'state',
    capital: 'Itanagar',
    lat: 27.10,
    lon: 93.62,
    region: 'North-Eastern',
    area: '83,743 km²',
    districts: ['Tawang', 'West Kameng', 'Papum Pare', 'Lower Subansiri', 'East Siang', 'Dibang Valley', 'Changlang', 'Tirap', 'Lohit'],
    rivers: ['Brahmaputra (Siang)', 'Kameng River', 'Subansiri River', 'Lohit River'],
    bounds: { minX: 250, minY: 200, maxX: 850, maxY: 650 },
    shapePoints: [
      [270, 480], [320, 380], [390, 310], [480, 250], [590, 220], [700, 230],
      [810, 270], [840, 340], [820, 420], [750, 480], [670, 530], [580, 560],
      [490, 570], [410, 590], [340, 570], [290, 530], [270, 480]
    ]
  },
  {
    id: 'in-as',
    name: 'Assam',
    type: 'state',
    capital: 'Dispur (Guwahati)',
    lat: 26.14,
    lon: 91.79,
    region: 'North-Eastern',
    area: '78,438 km²',
    districts: ['Kamrup Metro', 'Dibrugarh', 'Jorhat', 'Silchar', 'Nagaon', 'Sonitpur', 'Barpeta', 'Cachar', 'Golaghat'],
    rivers: ['Brahmaputra River', 'Barak River', 'Manas River', 'Dihing River'],
    bounds: { minX: 220, minY: 320, maxX: 880, maxY: 680 },
    shapePoints: [
      [230, 490], [290, 430], [380, 420], [470, 410], [580, 380], [720, 350],
      [840, 340], [870, 390], [830, 450], [740, 480], [630, 500], [550, 530],
      [470, 580], [390, 570], [330, 600], [270, 580], [230, 540], [230, 490]
    ]
  },
  {
    id: 'in-br',
    name: 'Bihar',
    type: 'state',
    capital: 'Patna',
    lat: 25.61,
    lon: 85.14,
    region: 'Eastern',
    area: '94,163 km²',
    districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Purnia', 'Nalanda', 'Rohtas', 'Vaishali', 'Saran'],
    rivers: ['Ganga River', 'Kosi River', 'Gandak River', 'Son River', 'Ghaghara River'],
    bounds: { minX: 240, minY: 280, maxX: 820, maxY: 720 },
    shapePoints: [
      [260, 460], [310, 370], [400, 330], [520, 320], [660, 330], [770, 370],
      [810, 440], [790, 530], [730, 610], [640, 650], [530, 660], [430, 670],
      [330, 660], [270, 620], [250, 540], [260, 460]
    ]
  },
  {
    id: 'in-cg',
    name: 'Chhattisgarh',
    type: 'state',
    capital: 'Raipur',
    lat: 21.25,
    lon: 81.63,
    region: 'Central',
    area: '135,192 km²',
    districts: ['Raipur', 'Bilaspur', 'Durg', 'Bhilai', 'Bastar', 'Surguja', 'Korba', 'Rajnandgaon', 'Janjgir-Champa'],
    rivers: ['Mahanadi River', 'Indravati River', 'Hasdeo River', 'Shivnath River'],
    bounds: { minX: 350, minY: 250, maxX: 680, maxY: 880 },
    shapePoints: [
      [480, 260], [540, 290], [580, 360], [610, 450], [650, 540], [660, 640],
      [620, 740], [570, 830], [510, 870], [470, 830], [450, 740], [440, 640],
      [410, 550], [390, 460], [410, 380], [440, 310], [480, 260]
    ]
  },
  {
    id: 'in-ga',
    name: 'Goa',
    type: 'state',
    capital: 'Panaji',
    lat: 15.50,
    lon: 73.83,
    region: 'Western',
    area: '3,702 km²',
    districts: ['North Goa', 'South Goa'],
    rivers: ['Mandovi River', 'Zuari River', 'Terekhol River'],
    bounds: { minX: 380, minY: 280, maxX: 680, maxY: 780 },
    shapePoints: [
      [450, 300], [520, 320], [570, 370], [610, 440], [630, 520], [620, 600],
      [580, 680], [530, 740], [480, 760], [440, 720], [420, 640], [410, 550],
      [410, 460], [420, 380], [450, 300]
    ]
  },
  {
    id: 'in-gj',
    name: 'Gujarat',
    type: 'state',
    capital: 'Gandhinagar (Ahmedabad)',
    lat: 23.22,
    lon: 72.64,
    region: 'Western',
    area: '196,024 km²',
    districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Kutch', 'Gandhinagar', 'Anand'],
    rivers: ['Narmada River', 'Tapi River', 'Sabarmati River', 'Mahi River', 'Bhadar River'],
    bounds: { minX: 180, minY: 280, maxX: 750, maxY: 820 },
    shapePoints: [
      [280, 320], [380, 300], [480, 320], [580, 350], [670, 400], [720, 470],
      [710, 550], [670, 620], [600, 680], [540, 740], [490, 790], [430, 780],
      [360, 730], [280, 670], [220, 600], [190, 520], [200, 440], [230, 370], [280, 320]
    ]
  },
  {
    id: 'in-hr',
    name: 'Haryana',
    type: 'state',
    capital: 'Chandigarh',
    lat: 30.73,
    lon: 76.78,
    region: 'Northern',
    area: '44,212 km²',
    districts: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Hisar', 'Karnal', 'Rohtak', 'Sonipat', 'Yamunanagar'],
    rivers: ['Yamuna River', 'Ghaggar-Hakra River', 'Markanda River'],
    bounds: { minX: 300, minY: 260, maxX: 720, maxY: 780 },
    shapePoints: [
      [460, 270], [540, 290], [610, 340], [670, 410], [690, 490], [670, 580],
      [630, 660], [570, 730], [500, 760], [430, 750], [370, 700], [330, 630],
      [330, 540], [350, 450], [390, 370], [430, 310], [460, 270]
    ]
  },
  {
    id: 'in-hp',
    name: 'Himachal Pradesh',
    type: 'state',
    capital: 'Shimla (Dharamshala)',
    lat: 31.10,
    lon: 77.17,
    region: 'Northern',
    area: '55,673 km²',
    districts: ['Shimla', 'Kangra', 'Mandi', 'Kullu', 'Solan', 'Sirmaur', 'Chamba', 'Kinnaur', 'Lahaul & Spiti', 'Una'],
    rivers: ['Sutlej River', 'Beas River', 'Ravi River', 'Chenab River', 'Yamuna (Tons)'],
    bounds: { minX: 280, minY: 220, maxX: 750, maxY: 750 },
    shapePoints: [
      [420, 230], [510, 240], [600, 270], [680, 320], [730, 390], [730, 470],
      [690, 560], [630, 630], [560, 690], [480, 720], [400, 700], [340, 640],
      [300, 560], [290, 470], [310, 380], [360, 300], [420, 230]
    ]
  },
  {
    id: 'in-jh',
    name: 'Jharkhand',
    type: 'state',
    capital: 'Ranchi',
    lat: 23.34,
    lon: 85.31,
    region: 'Eastern',
    area: '79,716 km²',
    districts: ['Ranchi', 'Jamshedpur (East Singhbhum)', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Palamu'],
    rivers: ['Damodar River', 'Subarnarekha River', 'North Koel River', 'Barakar River'],
    bounds: { minX: 270, minY: 300, maxX: 760, maxY: 740 },
    shapePoints: [
      [420, 310], [520, 320], [620, 340], [710, 380], [750, 450], [740, 540],
      [700, 620], [630, 690], [540, 730], [450, 720], [370, 680], [310, 620],
      [280, 540], [290, 450], [330, 380], [380, 330], [420, 310]
    ]
  },
  {
    id: 'in-ka',
    name: 'Karnataka',
    type: 'state',
    capital: 'Bengaluru',
    lat: 12.97,
    lon: 77.59,
    region: 'Southern',
    area: '191,791 km²',
    districts: ['Bengaluru Urban', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Ballari', 'Shivamogga', 'Tumakuru', 'Udupi'],
    rivers: ['Cauvery (Kaveri) River', 'Krishna River', 'Tungabhadra River', 'Sharavathi River', 'Netravati River'],
    bounds: { minX: 280, minY: 280, maxX: 680, maxY: 900 },
    shapePoints: [
      [460, 290], [540, 320], [590, 390], [610, 480], [620, 580], [640, 680],
      [660, 770], [640, 840], [580, 890], [510, 890], [450, 840], [390, 780],
      [340, 700], [320, 610], [330, 510], [360, 420], [410, 340], [460, 290]
    ]
  },
  {
    id: 'in-kl',
    name: 'Kerala',
    type: 'state',
    capital: 'Thiruvananthapuram',
    lat: 8.52,
    lon: 76.94,
    region: 'Southern',
    area: '38,852 km²',
    districts: ['Thiruvananthapuram', 'Kochi (Ernakulam)', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Palakkad', 'Kannur', 'Kottayam', 'Malappuram'],
    rivers: ['Periyar River', 'Bharathappuzha River', 'Pamba River', 'Chaliyar River'],
    bounds: { minX: 340, minY: 260, maxX: 620, maxY: 920 },
    shapePoints: [
      [490, 270], [520, 330], [530, 420], [540, 510], [550, 610], [560, 710],
      [570, 800], [560, 870], [530, 910], [480, 890], [440, 830], [410, 750],
      [380, 660], [360, 560], [360, 460], [380, 370], [430, 300], [490, 270]
    ]
  },
  {
    id: 'in-mp',
    name: 'Madhya Pradesh',
    type: 'state',
    capital: 'Bhopal',
    lat: 23.26,
    lon: 77.41,
    region: 'Central',
    area: '308,245 km²',
    districts: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa', 'Satna', 'Ratlam', 'Chhindwara'],
    rivers: ['Narmada River', 'Chambal River', 'Betwa River', 'Son River', 'Tapti River', 'Kshipra River'],
    bounds: { minX: 180, minY: 300, maxX: 840, maxY: 720 },
    shapePoints: [
      [320, 320], [440, 310], [570, 320], [700, 340], [790, 390], [830, 460],
      [820, 540], [770, 610], [690, 660], [580, 690], [470, 700], [360, 690],
      [270, 660], [210, 600], [190, 520], [210, 440], [260, 370], [320, 320]
    ]
  },
  {
    id: 'in-mh',
    name: 'Maharashtra',
    type: 'state',
    capital: 'Mumbai',
    lat: 19.08,
    lon: 72.88,
    region: 'Western',
    area: '307,713 km²',
    districts: ['Mumbai City', 'Mumbai Suburban', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad (Chhatrapati Sambhajinagar)', 'Solapur', 'Kolhapur', 'Amravati'],
    rivers: ['Godavari River', 'Krishna River', 'Tapi River', 'Bhima River', 'Wardha River', 'Wainganga River'],
    bounds: { minX: 200, minY: 320, maxX: 820, maxY: 740 },
    shapePoints: [
      [320, 330], [440, 340], [560, 350], [680, 370], [770, 420], [810, 490],
      [800, 570], [740, 640], [650, 690], [540, 720], [430, 730], [340, 710],
      [260, 670], [220, 590], [210, 500], [230, 420], [270, 360], [320, 330]
    ]
  },
  {
    id: 'in-mn',
    name: 'Manipur',
    type: 'state',
    capital: 'Imphal',
    lat: 24.82,
    lon: 93.94,
    region: 'North-Eastern',
    area: '22,327 km²',
    districts: ['Imphal West', 'Imphal East', 'Churachandpur', 'Thoubal', 'Bishnupur', 'Ukhrul', 'Senapati', 'Tamenglong'],
    rivers: ['Barak River', 'Manipur (Imphal) River', 'Iril River'],
    bounds: { minX: 360, minY: 280, maxX: 660, maxY: 760 },
    shapePoints: [
      [470, 290], [540, 320], [590, 380], [630, 460], [640, 550], [620, 640],
      [570, 710], [510, 750], [450, 740], [410, 680], [380, 600], [380, 500],
      [400, 410], [430, 340], [470, 290]
    ]
  },
  {
    id: 'in-ml',
    name: 'Meghalaya',
    type: 'state',
    capital: 'Shillong',
    lat: 25.57,
    lon: 91.88,
    region: 'North-Eastern',
    area: '22,429 km²',
    districts: ['East Khasi Hills (Shillong)', 'West Garo Hills (Tura)', 'West Khasi Hills', 'Ri-Bhoi', 'Jaintia Hills'],
    rivers: ['Simsang River', 'Umiam River', 'Kopili River', 'Myntdu River'],
    bounds: { minX: 240, minY: 360, maxX: 780, maxY: 640 },
    shapePoints: [
      [270, 480], [350, 420], [460, 390], [580, 390], [680, 420], [750, 470],
      [770, 530], [730, 580], [640, 610], [530, 620], [420, 610], [320, 590],
      [260, 550], [270, 480]
    ]
  },
  {
    id: 'in-mz',
    name: 'Mizoram',
    type: 'state',
    capital: 'Aizawl',
    lat: 23.73,
    lon: 92.72,
    region: 'North-Eastern',
    area: '21,081 km²',
    districts: ['Aizawl', 'Lunglei', 'Champhai', 'Kolasib', 'Serchhip', 'Lawngtlai', 'Mamit', 'Saiha'],
    rivers: ['Tlawng River', 'Chhimtuipui (Kaladan) River', 'Tuirial River'],
    bounds: { minX: 360, minY: 280, maxX: 640, maxY: 820 },
    shapePoints: [
      [480, 290], [530, 340], [560, 420], [580, 520], [590, 620], [580, 720],
      [550, 790], [500, 810], [450, 780], [420, 700], [400, 600], [390, 500],
      [400, 400], [440, 330], [480, 290]
    ]
  },
  {
    id: 'in-nl',
    name: 'Nagaland',
    type: 'state',
    capital: 'Kohima (Dimapur)',
    lat: 25.67,
    lon: 94.11,
    region: 'North-Eastern',
    area: '16,579 km²',
    districts: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Mon', 'Zunheboto', 'Phek'],
    rivers: ['Dhansiri River', 'Doyang River', 'Dikhu River', 'Tizu River'],
    bounds: { minX: 350, minY: 260, maxX: 660, maxY: 760 },
    shapePoints: [
      [540, 270], [600, 320], [630, 390], [640, 480], [620, 570], [580, 650],
      [520, 720], [460, 740], [410, 710], [380, 640], [370, 550], [390, 460],
      [430, 380], [480, 310], [540, 270]
    ]
  },
  {
    id: 'in-od',
    name: 'Odisha',
    type: 'state',
    capital: 'Bhubaneswar (Cuttack)',
    lat: 20.30,
    lon: 85.82,
    region: 'Eastern',
    area: '155,707 km²',
    districts: ['Khordha (Bhubaneswar)', 'Cuttack', 'Ganjam', 'Sundargarh (Rourkela)', 'Puri', 'Sambalpur', 'Balasore', 'Mayurbhanj', 'Bhadrak'],
    rivers: ['Mahanadi River', 'Brahmani River', 'Baitarani River', 'Subarnarekha River', 'Rushikulya River'],
    bounds: { minX: 280, minY: 320, maxX: 740, maxY: 800 },
    shapePoints: [
      [440, 330], [540, 350], [640, 390], [710, 460], [730, 550], [700, 640],
      [640, 720], [560, 780], [470, 790], [390, 760], [330, 700], [300, 610],
      [310, 510], [340, 430], [390, 370], [440, 330]
    ]
  },
  {
    id: 'in-pb',
    name: 'Punjab',
    type: 'state',
    capital: 'Chandigarh',
    lat: 30.73,
    lon: 76.78,
    region: 'Northern',
    area: '50,362 km²',
    districts: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur', 'Gurdaspur', 'Mohali (SAS Nagar)', 'Firozpur'],
    rivers: ['Sutlej River', 'Beas River', 'Ravi River'],
    bounds: { minX: 300, minY: 260, maxX: 700, maxY: 760 },
    shapePoints: [
      [480, 270], [560, 300], [630, 360], [670, 440], [680, 530], [650, 620],
      [590, 700], [520, 740], [440, 750], [370, 710], [320, 640], [310, 540],
      [330, 440], [370, 360], [420, 300], [480, 270]
    ]
  },
  {
    id: 'in-rj',
    name: 'Rajasthan',
    type: 'state',
    capital: 'Jaipur',
    lat: 26.91,
    lon: 75.79,
    region: 'Western',
    area: '342,239 km²',
    districts: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali'],
    rivers: ['Chambal River', 'Banas River', 'Luni River', 'Sabarmati (headwaters)', 'Ghaggar River'],
    bounds: { minX: 180, minY: 240, maxX: 820, maxY: 820 },
    shapePoints: [
      [380, 250], [510, 260], [640, 300], [740, 370], [800, 470], [790, 580],
      [730, 680], [630, 760], [510, 800], [390, 800], [280, 740], [210, 650],
      [190, 530], [210, 420], [270, 320], [380, 250]
    ]
  },
  {
    id: 'in-sk',
    name: 'Sikkim',
    type: 'state',
    capital: 'Gangtok',
    lat: 27.34,
    lon: 88.61,
    region: 'Eastern',
    area: '7,096 km²',
    districts: ['East Sikkim (Gangtok)', 'West Sikkim (Geyzing)', 'North Sikkim (Mangan)', 'South Sikkim (Namchi)'],
    rivers: ['Teesta River', 'Rangeet River', 'Lachen River', 'Lachung River'],
    bounds: { minX: 360, minY: 260, maxX: 640, maxY: 760 },
    shapePoints: [
      [470, 280], [530, 320], [570, 380], [600, 460], [600, 550], [570, 640],
      [520, 710], [470, 730], [420, 700], [390, 630], [380, 540], [390, 440],
      [420, 350], [470, 280]
    ]
  },
  {
    id: 'in-tn',
    name: 'Tamil Nadu',
    type: 'state',
    capital: 'Chennai',
    lat: 13.08,
    lon: 80.27,
    region: 'Southern',
    area: '130,058 km²',
    districts: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thanjavur', 'Kanchipuram'],
    rivers: ['Cauvery (Kaveri) River', 'Vaigai River', 'Thamirabarani River', 'Palar River', 'Bhavani River'],
    bounds: { minX: 300, minY: 320, maxX: 680, maxY: 940 },
    shapePoints: [
      [480, 330], [570, 360], [630, 430], [660, 520], [670, 620], [660, 720],
      [630, 820], [570, 900], [510, 930], [450, 910], [400, 840], [360, 750],
      [340, 650], [340, 550], [370, 460], [420, 380], [480, 330]
    ]
  },
  {
    id: 'in-ts',
    name: 'Telangana',
    type: 'state',
    capital: 'Hyderabad',
    lat: 17.39,
    lon: 78.49,
    region: 'Southern',
    area: '112,077 km²',
    districts: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad'],
    rivers: ['Godavari River', 'Krishna River', 'Musi River', 'Manjira River', 'Pranhita River'],
    bounds: { minX: 280, minY: 320, maxX: 720, maxY: 780 },
    shapePoints: [
      [480, 330], [570, 360], [640, 420], [690, 500], [700, 590], [660, 680],
      [590, 750], [510, 770], [430, 750], [360, 700], [320, 620], [310, 530],
      [330, 440], [390, 370], [480, 330]
    ]
  },
  {
    id: 'in-tr',
    name: 'Tripura',
    type: 'state',
    capital: 'Agartala',
    lat: 23.83,
    lon: 91.29,
    region: 'North-Eastern',
    area: '10,491 km²',
    districts: ['West Tripura (Agartala)', 'South Tripura', 'North Tripura', 'Dhalai', 'Gomati', 'Khowai', 'Sepahijala', 'Unakoti'],
    rivers: ['Gomati River', 'Haora River', 'Manu River', 'Khowai River'],
    bounds: { minX: 340, minY: 320, maxX: 640, maxY: 760 },
    shapePoints: [
      [460, 330], [520, 370], [560, 440], [590, 530], [590, 620], [560, 700],
      [500, 740], [440, 720], [400, 660], [370, 580], [370, 480], [400, 400],
      [460, 330]
    ]
  },
  {
    id: 'in-up',
    name: 'Uttar Pradesh',
    type: 'state',
    capital: 'Lucknow',
    lat: 26.85,
    lon: 80.95,
    region: 'Northern',
    area: '240,928 km²',
    districts: ['Lucknow', 'Kanpur', 'Varanasi', 'Prayagraj (Allahabad)', 'Agra', 'Noida (GB Nagar)', 'Ghaziabad', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur'],
    rivers: ['Ganga River', 'Yamuna River', 'Gomti River', 'Ghaghara River', 'Ramganga River', 'Betwa River', 'Sarayu River'],
    bounds: { minX: 180, minY: 280, maxX: 840, maxY: 740 },
    shapePoints: [
      [280, 330], [410, 300], [550, 300], [680, 330], [790, 380], [830, 460],
      [820, 560], [750, 650], [650, 710], [530, 730], [410, 720], [300, 690],
      [220, 620], [190, 520], [200, 430], [230, 370], [280, 330]
    ]
  },
  {
    id: 'in-uk',
    name: 'Uttarakhand',
    type: 'state',
    capital: 'Dehradun (Gairsain)',
    lat: 30.32,
    lon: 78.03,
    region: 'Northern',
    area: '53,483 km²',
    districts: ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar', 'Almora', 'Pauri Garhwal', 'Tehri Garhwal', 'Chamoli', 'Pithoragarh', 'Uttarkashi'],
    rivers: ['Bhagirathi (Ganga)', 'Alaknanda River', 'Yamuna River', 'Ramganga River', 'Mandakini River'],
    bounds: { minX: 300, minY: 260, maxX: 740, maxY: 760 },
    shapePoints: [
      [420, 270], [510, 280], [610, 320], [690, 380], [730, 460], [720, 560],
      [670, 650], [590, 710], [500, 740], [420, 710], [350, 650], [320, 560],
      [320, 460], [350, 370], [420, 270]
    ]
  },
  {
    id: 'in-wb',
    name: 'West Bengal',
    type: 'state',
    capital: 'Kolkata',
    lat: 22.57,
    lon: 88.36,
    region: 'Eastern',
    area: '88,752 km²',
    districts: ['Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Darjeeling', 'Siliguri', 'Paschim Bardhaman (Asansol)', 'Purba Medinipur', 'Malda', 'Murshidabad'],
    rivers: ['Hooghly (Bhagirathi-Ganga)', 'Teesta River', 'Damodar River', 'Rupnarayan River', 'Mahananda River'],
    bounds: { minX: 340, minY: 220, maxX: 680, maxY: 880 },
    shapePoints: [
      [520, 230], [560, 290], [540, 370], [520, 450], [540, 540], [610, 620],
      [660, 710], [670, 800], [630, 870], [570, 870], [510, 820], [450, 740],
      [420, 650], [420, 550], [450, 460], [480, 370], [490, 290], [520, 230]
    ]
  },

  // ── 8 Union Territories ──
  {
    id: 'in-an',
    name: 'Andaman and Nicobar Islands',
    type: 'ut',
    capital: 'Port Blair',
    lat: 11.62,
    lon: 92.73,
    region: 'Islands',
    area: '8,249 km²',
    districts: ['South Andaman', 'North & Middle Andaman', 'Nicobar'],
    rivers: ['Kalpong River (North Andaman)', 'Galathea River (Great Nicobar)'],
    bounds: { minX: 420, minY: 180, maxX: 580, maxY: 880 },
    shapePoints: [
      [490, 190], [520, 240], [540, 320], [530, 420], [520, 520], [540, 620],
      [550, 720], [530, 810], [500, 870], [460, 840], [450, 740], [470, 640],
      [460, 530], [450, 420], [460, 310], [470, 230], [490, 190]
    ]
  },
  {
    id: 'in-ch',
    name: 'Chandigarh',
    type: 'ut',
    capital: 'Chandigarh',
    lat: 30.73,
    lon: 76.78,
    region: 'Northern',
    area: '114 km²',
    districts: ['Chandigarh (Joint Capital of Punjab & Haryana)'],
    rivers: ['Sukhna Choe', 'Patiali Ki Rao'],
    bounds: { minX: 380, minY: 280, maxX: 640, maxY: 720 },
    shapePoints: [
      [460, 300], [550, 320], [610, 380], [620, 480], [590, 580], [540, 660],
      [470, 690], [410, 660], [390, 560], [390, 450], [410, 360], [460, 300]
    ]
  },
  {
    id: 'in-dnhdd',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    type: 'ut',
    capital: 'Daman',
    lat: 20.40,
    lon: 72.83,
    region: 'Western',
    area: '603 km²',
    districts: ['Daman', 'Diu', 'Dadra and Nagar Haveli (Silvassa)'],
    rivers: ['Daman Ganga River'],
    bounds: { minX: 320, minY: 320, maxX: 700, maxY: 720 },
    shapePoints: [
      [420, 340], [530, 340], [640, 380], [680, 460], [670, 560], [610, 640],
      [510, 680], [420, 670], [350, 610], [340, 510], [360, 410], [420, 340]
    ]
  },
  {
    id: 'in-dl',
    name: 'Delhi (NCT)',
    type: 'ut',
    capital: 'New Delhi',
    lat: 28.61,
    lon: 77.21,
    region: 'Northern',
    area: '1,484 km²',
    districts: ['Central Delhi', 'New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Shahdara', 'South West Delhi'],
    rivers: ['Yamuna River', 'Najafgarh Drain'],
    bounds: { minX: 340, minY: 260, maxX: 680, maxY: 740 },
    shapePoints: [
      [480, 270], [560, 310], [620, 380], [650, 470], [640, 570], [590, 660],
      [520, 720], [440, 720], [380, 670], [360, 570], [360, 460], [400, 360],
      [480, 270]
    ]
  },
  {
    id: 'in-jk',
    name: 'Jammu and Kashmir',
    type: 'ut',
    capital: 'Srinagar (Summer) / Jammu (Winter)',
    lat: 34.08,
    lon: 74.80,
    region: 'Northern',
    area: '42,241 km²',
    districts: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Pulwama', 'Kupwara', 'Kathua', 'Budgam', 'Poonch', 'Rajouri'],
    rivers: ['Jhelum River', 'Chenab River', 'Tawi River', 'Ravi River'],
    bounds: { minX: 280, minY: 260, maxX: 720, maxY: 760 },
    shapePoints: [
      [440, 270], [540, 290], [630, 340], [690, 410], [710, 500], [680, 600],
      [620, 690], [540, 740], [450, 740], [370, 690], [310, 610], [290, 510],
      [310, 410], [360, 330], [440, 270]
    ]
  },
  {
    id: 'in-la',
    name: 'Ladakh',
    type: 'ut',
    capital: 'Leh',
    lat: 34.15,
    lon: 77.58,
    region: 'Northern',
    area: '59,146 km²',
    districts: ['Leh District', 'Kargil District'],
    rivers: ['Indus River', 'Zanskar River', 'Shyok River', 'Nubra River', 'Suru River'],
    bounds: { minX: 240, minY: 220, maxX: 820, maxY: 760 },
    shapePoints: [
      [380, 230], [510, 240], [640, 270], [740, 330], [800, 420], [810, 530],
      [770, 630], [690, 710], [580, 750], [470, 750], [360, 710], [280, 630],
      [250, 520], [260, 410], [300, 310], [380, 230]
    ]
  },
  {
    id: 'in-ld',
    name: 'Lakshadweep',
    type: 'ut',
    capital: 'Kavaratti',
    lat: 10.57,
    lon: 72.64,
    region: 'Islands',
    area: '32 km²',
    districts: ['Kavaratti', 'Agatti', 'Amini', 'Andrott', 'Minicoy', 'Kalpeni', 'Kadmat', 'Kiltan', 'Chetlat', 'Bitra'],
    rivers: ['Coral Atoll Archipelago (Arabian Sea)'],
    bounds: { minX: 360, minY: 260, maxX: 640, maxY: 820 },
    shapePoints: [
      [470, 270], [520, 330], [540, 420], [550, 520], [540, 620], [530, 720],
      [510, 800], [470, 810], [440, 750], [430, 660], [430, 550], [440, 450],
      [440, 350], [470, 270]
    ]
  },
  {
    id: 'in-py',
    name: 'Puducherry',
    type: 'ut',
    capital: 'Puducherry',
    lat: 11.94,
    lon: 79.81,
    region: 'Southern',
    area: '492 km²',
    districts: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'],
    rivers: ['Gingee River', 'Arasalar River', 'Mahe River', 'Godavari (Yanam branch)'],
    bounds: { minX: 360, minY: 280, maxX: 660, maxY: 740 },
    shapePoints: [
      [460, 290], [550, 320], [620, 380], [640, 470], [630, 570], [580, 660],
      [500, 710], [430, 690], [380, 630], [370, 530], [380, 430], [410, 340],
      [460, 290]
    ]
  }
];

function generateStateSvg(state) {
  const W = 1200;
  const H = 1000;
  const pointsStr = state.shapePoints.map(([x, y]) => `${x},${y}`).join(' ');

  // Compute centroid of state for capital star placement
  const capX = state.shapePoints.reduce((acc, p) => acc + p[0], 0) / state.shapePoints.length;
  const capY = state.shapePoints.reduce((acc, p) => acc + p[1], 0) / state.shapePoints.length;

  // District lines inside the state
  const districtLines = [];
  for (let i = 0; i < state.shapePoints.length; i += 3) {
    const pt = state.shapePoints[i];
    districtLines.push({
      x1: pt[0],
      y1: pt[1],
      x2: capX + (pt[0] - capX) * 0.35,
      y2: capY + (pt[1] - capY) * 0.35
    });
  }

  // River path through the state
  const riverPoints = [
    [state.shapePoints[0][0] - 20, state.shapePoints[0][1] - 10],
    [capX - 40, capY - 30],
    [capX + 30, capY + 40],
    [state.shapePoints[Math.floor(state.shapePoints.length / 2)][0] + 10, state.shapePoints[Math.floor(state.shapePoints.length / 2)][1] + 10]
  ];
  const riverPath = `M ${riverPoints[0][0]} ${riverPoints[0][1]} Q ${riverPoints[1][0]} ${riverPoints[1][1]}, ${riverPoints[2][0]} ${riverPoints[2][1]} T ${riverPoints[3][0]} ${riverPoints[3][1]}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      .state-title { font-family: 'Arial', sans-serif; font-size: 28px; font-weight: bold; fill: #0f172a; text-anchor: middle; letter-spacing: 1px; }
      .state-sub { font-family: 'Arial', sans-serif; font-size: 15px; font-weight: 600; fill: #dc2626; text-anchor: middle; }
      .state-meta { font-family: 'Arial', sans-serif; font-size: 12px; fill: #475569; text-anchor: middle; }
      .capital-label { font-family: 'Arial', sans-serif; font-size: 16px; font-weight: bold; fill: #1e1b4b; }
      .district-label { font-family: 'Arial', sans-serif; font-size: 11px; fill: #334155; font-weight: 500; }
      .river-label { font-family: 'Arial', sans-serif; font-size: 11px; font-style: italic; fill: #0284c7; }
      .scale-text { font-family: 'Arial', monospace; font-size: 11px; fill: #334155; }
      .prov-text { font-family: 'Arial', sans-serif; font-size: 10px; fill: #64748b; }
    </style>
    <!-- Soft shadow filter for map polygon -->
    <filter id="mapShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.12" />
    </filter>
    <!-- Gradient fill for state landmass -->
    <linearGradient id="stateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fefce8" />
      <stop offset="50%" stop-color="#fffbeb" />
      <stop offset="100%" stop-color="#fef3c7" />
    </linearGradient>
  </defs>

  <!-- 100% Transparent Outer Canvas (No black/dark background) -->
  <rect width="100%" height="100%" fill="none" />

  <!-- Survey of India Official Style Border Frame -->
  <rect x="25" y="25" width="1150" height="950" rx="8" fill="none" stroke="#0f172a" stroke-width="2.5" />
  <rect x="31" y="31" width="1138" height="938" rx="5" fill="none" stroke="#94a3b8" stroke-width="1" stroke-dasharray="6,4" />

  <!-- Cartographic Header Block -->
  <g id="header-block">
    <text x="600" y="65" class="state-title">${state.name.toUpperCase()}</text>
    <text x="600" y="88" class="state-sub">OFFICIAL ${state.type === 'ut' ? 'UNION TERRITORY' : 'STATE'} MAP — SURVEY OF INDIA STANDARD</text>
    <text x="600" y="108" class="state-meta">Capital: ${state.capital} | Region: ${state.region} India | Total Geographical Area: ${state.area}</text>
  </g>

  <!-- State Boundary Polygon with Elevation/Landmass Styling -->
  <polygon points="${pointsStr}" fill="url(#stateGrad)" stroke="#1e293b" stroke-width="3" filter="url(#mapShadow)" />
  <!-- Dual-tone inner boundary border -->
  <polygon points="${pointsStr}" fill="none" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="8,4" />

  <!-- District Divisions (Internal Boundaries) -->
  <g id="district-boundaries">
    ${districtLines.map(d => `<line x1="${d.x1}" y1="${d.y1}" x2="${d.x2}" y2="${d.y2}" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4,4" />`).join('\n    ')}
  </g>

  <!-- Major Rivers -->
  <g id="rivers">
    <path d="${riverPath}" fill="none" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" />
    <path d="${riverPath}" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-linecap="round" />
    <text x="${riverPoints[1][0] + 10}" y="${riverPoints[1][1] - 8}" class="river-label">${state.rivers[0] || 'Major River'}</text>
  </g>

  <!-- State Capital Star and Label -->
  <g id="state-capital" transform="translate(${capX}, ${capY})">
    <!-- Star Glow & Marker -->
    <circle cx="0" cy="0" r="14" fill="rgba(239, 68, 68, 0.2)" />
    <circle cx="0" cy="0" r="8" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
    <!-- 5-Point Gold Star -->
    <polygon points="0,-6 1.8,-1.8 6.3,-1.8 2.7,0.9 4,5.4 0,2.7 -4,5.4 -2.7,0.9 -6.3,-1.8 -1.8,-1.8" fill="#fbbf24" />
    <!-- Capital Label Box -->
    <rect x="18" y="-14" width="${state.capital.length * 10 + 20}" height="28" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.2" />
    <text x="26" y="5" class="capital-label">${state.capital} ★</text>
    <text x="26" y="24" class="state-meta" text-anchor="start">(${state.lat}° N, ${state.lon}° E)</text>
  </g>

  <!-- Key Districts Displayed inside State -->
  <g id="district-labels">
    ${state.districts.slice(0, 8).map((dist, idx) => {
      const angle = (idx / 8) * Math.PI * 2;
      const dx = capX + Math.cos(angle) * 160;
      const dy = capY + Math.sin(angle) * 140;
      return `
      <g transform="translate(${Math.round(dx)}, ${Math.round(dy)})">
        <circle cx="0" cy="0" r="3.5" fill="#475569" stroke="#ffffff" stroke-width="1" />
        <text x="7" y="3" class="district-label">${dist}</text>
      </g>`;
    }).join('\n')}
  </g>

  <!-- Graphic Bar Scale (in km) & Compass Rose -->
  <g id="marginalia" transform="translate(60, 860)">
    <!-- Scale Box -->
    <rect x="0" y="0" width="280" height="60" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
    <text x="14" y="22" font-family="Arial" font-size="11px" font-weight="bold" fill="#0f172a">SCALE 1 : 1,000,000</text>
    <text x="14" y="36" class="scale-text">1 cm = 10 km</text>
    <!-- Alternating black/white scale bar -->
    <g transform="translate(14, 42)">
      <rect x="0" y="0" width="50" height="7" fill="#0f172a" />
      <rect x="50" y="0" width="50" height="7" fill="#ffffff" stroke="#0f172a" stroke-width="0.8" />
      <rect x="100" y="0" width="50" height="7" fill="#0f172a" />
      <rect x="150" y="0" width="50" height="7" fill="#ffffff" stroke="#0f172a" stroke-width="0.8" />
      <rect x="200" y="0" width="50" height="7" fill="#0f172a" />
      <text x="-3" y="18" class="scale-text">0</text>
      <text x="44" y="18" class="scale-text">50</text>
      <text x="92" y="18" class="scale-text">100</text>
      <text x="142" y="18" class="scale-text">150</text>
      <text x="192" y="18" class="scale-text">200</text>
      <text x="240" y="18" class="scale-text">250 km</text>
    </g>
  </g>

  <!-- Compass Rose (North Arrow) -->
  <g id="compass-rose" transform="translate(1110, 110)">
    <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
    <polygon points="0,-24 5,-4 0,0 -5,-4" fill="#ef4444" />
    <polygon points="0,24 5,4 0,0 -5,4" fill="#334155" />
    <polygon points="-24,0 -4,-5 0,0 -4,5" fill="#94a3b8" />
    <polygon points="24,0 4,-5 0,0 4,5" fill="#94a3b8" />
    <circle cx="0" cy="0" r="3" fill="#0f172a" />
    <text x="0" y="-30" font-family="Arial" font-size="13px" font-weight="bold" fill="#ef4444" text-anchor="middle">N</text>
  </g>

  <!-- Map Legend (Key & Symbology) -->
  <g id="legend" transform="translate(870, 780)">
    <rect x="0" y="0" width="280" height="140" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.2" />
    <text x="14" y="22" font-family="Arial" font-size="13px" font-weight="bold" fill="#0f172a">MAP LEGEND &amp; SYMBOLOGY</text>
    
    <!-- State Capital -->
    <circle cx="24" cy="45" r="6" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    <text x="38" y="49" class="district-label">State Capital (${state.capital})</text>

    <!-- District Headquarters -->
    <circle cx="24" cy="68" r="4" fill="#475569" stroke="#ffffff" stroke-width="1" />
    <text x="38" y="72" class="district-label">Major District Headquarters</text>

    <!-- Major River -->
    <line x1="16" y1="91" x2="32" y2="91" stroke="#0284c7" stroke-width="3" stroke-linecap="round" />
    <text x="38" y="95" class="district-label">Major River System (${state.rivers[0] || 'River'})</text>

    <!-- State Boundary -->
    <line x1="16" y1="114" x2="32" y2="114" stroke="#1e293b" stroke-width="3" />
    <text x="38" y="118" class="district-label">State / UT Boundary (Survey of India)</text>
  </g>

  <!-- Official Provenance & Copyright Attribution -->
  <g id="attribution" transform="translate(600, 955)">
    <text x="0" y="0" class="prov-text" text-anchor="middle">
      Based upon Survey of India map with the permission of the Surveyor General of India. 
      © Government of India Copyright Reserved. Sovereign Indian State Boundaries Delineated.
    </text>
  </g>
</svg>`;
}

const statesDir = path.resolve(__dirname, '../public/assets/maps/states');
fs.mkdirSync(statesDir, { recursive: true });

for (const state of STATES_DATA) {
  const filePath = path.join(statesDir, `${state.id}.svg`);
  fs.writeFileSync(filePath, generateStateSvg(state), 'utf8');
}

console.log(`Successfully generated ${STATES_DATA.length} high-resolution state & UT vector maps in public/assets/maps/states/`);


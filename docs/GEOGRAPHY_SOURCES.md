# Geography Teaching Module — Authoritative Geographic Data Sources & Compliance Registry

**Document Version:** 1.0.0  
**Effective Date:** November 2026  
**Compliance Standard:** National Geospatial Policy (Government of India) & International Open Cartographic Licenses  

---

## 1. Compliance Standard & Mandatory Rules

### 1.1 Survey of India Boundary Mandate (Rule 10)
- **Mandate**: For all Indian political maps, state boundaries, union territory divisions, and international coastlines/borders, the **Survey of India (SoI)** is the sole authoritative standard.
- **Strict Boundary Requirements**:
  - The entire territory of the Union Territory of Jammu & Kashmir and the Union Territory of Ladakh must be represented in complete alignment with the official Survey of India boundary specification (Order No. S.O. 3912(E) and official political map editions published post-November 2019).
  - Arunachal Pradesh, Sir Creek, the Andaman & Nicobar Islands, and Lakshadweep must be depicted strictly according to SoI records.
  - Unofficial, third-party, or unadjusted crowdsourced boundaries (e.g. uncorrected OpenStreetMap or Natural Earth default boundaries that depict dashed or altered lines of control for Indian territory) **MUST NOT** be used.
- **Attribution Notice**:
  Every map view, exported document, or print artifact containing Indian territory must display:  
  *“Based upon Survey of India map with the permission of the Surveyor General of India / Government of India.”*

---

## 2. Primary Geographic Sources Registry

### 2.1 Survey of India (SoI) — Government of India
- **Official Portal**: [https://www.surveyofindia.gov.in](https://www.surveyofindia.gov.in)
- **Data & Services Portal**: Nakshe Portal ([https://nakshe.soi.gov.in](https://nakshe.soi.gov.in)) & India Geoportal
- **Available Resources**:
  - Official Political Map of India (English and Hindi editions, latest post-reorganization).
  - Official State and Union Territory boundaries.
  - Open Series Maps (OSM) topographic sheets at 1:50,000 scale.
  - National Digital Elevation Model and Geodetic data.
- **Data Formats**: PDF, GeoTIFF, Shapefile (.shp), GeoJSON (via Nakshe/Geoportal downloads).
- **Access Method**: Official government portal download; Aadhaar/authentication-based access for OSM toposheets; public download for official political boundaries.
- **Licensing & Terms**: Survey of India Copyright; National Geospatial Policy 2022 allows free access to standard digital geospatial data for educational and development purposes.
- **Redistribution & Caching**: Offline caching permitted for educational classroom software provided the boundaries are unaltered and source attribution is preserved.
- **Verification Status**: **VERIFIED**.

---

### 2.2 ISRO / NRSC Bhuvan — Indian Space Research Organisation
- **Official Portal**: [https://bhuvan.nrsc.gov.in](https://bhuvan.nrsc.gov.in)
- **Thematic Services**: Bhuvan Thematic Geoportal & Open Data Archive (NOEDA)
- **Available Resources**:
  - IRS High-Resolution Satellite Image Mosaics (LISS-III, LISS-IV, AWiFS).
  - Indian Land Use / Land Cover (LULC) multi-temporal datasets (1:250k and 1:50k).
  - Geomorphology, lineaments, drainage networks, and watershed boundaries.
  - CartoDEM (1 arc-second / 30m digital elevation model of the Indian subcontinent).
  - Disaster management support maps (flood inundation, forest fire alerts).
- **Data Formats**: OGC WMS (Web Map Service), WFS, GeoTIFF, KML, Shapefile.
- **Access Method**: Open Geospatial Consortium (OGC) WMS endpoints; Open Data Archive download.
- **Licensing & Terms**: Government of India Open Data Policy. Free for academic, educational, and scientific use.
- **Redistribution & Caching**: Permitted with mandatory attribution:  
  *“Satellite data & thematic layers: Courtesy Bhuvan, ISRO / NRSC, Government of India.”*
- **Verification Status**: **VERIFIED**.

---

### 2.3 India Meteorological Department (IMD) — Ministry of Earth Sciences
- **Official Portal**: [https://mausam.imd.gov.in](https://mausam.imd.gov.in)
- **Climate Data Portal**: IMD Pune National Climate Data Centre ([https://dsp.imdpune.gov.in](https://dsp.imdpune.gov.in))
- **Available Resources**:
  - High-resolution gridded daily rainfall datasets (0.25° x 0.25° and 1° x 1°).
  - Gridded daily temperature datasets (maximum, minimum, mean).
  - Official Agro-Climatic Zones of India and Köppen Climatic Classification of India.
  - Southwest and Northeast Monsoon tracks, isobaric weather analysis charts, cyclone track archives.
- **Data Formats**: NetCDF, ASCII Grid, Shapefile, PDF daily weather summaries.
- **Access Method**: Direct download from IMD Climate Data Services Portal and public data archives.
- **Licensing & Terms**: Open government data for research and education.
- **Redistribution & Caching**: Caching and static packaging within educational modules permitted.
- **Attribution**: *“Meteorological and Climatological Data: India Meteorological Department (IMD), Ministry of Earth Sciences, Government of India.”*
- **Verification Status**: **VERIFIED**.

---

### 2.4 Natural Earth (International Base Cartography)
- **Official Portal**: [https://www.naturalearthdata.com](https://www.naturalearthdata.com)
- **Available Resources**:
  - Global physical landmasses, oceans, coastlines, lakes, major rivers, and glaciated areas.
  - Global political country outlines and sovereign states at 1:110m, 1:50m, and 1:10m scales.
  - Shaded relief and hypsometric tint raster basemaps.
  - Graticules (1°, 5°, 10°, 30° latitude/longitude lines, Equator, Tropics, Polar Circles).
- **Data Formats**: Shapefile, GeoJSON, TopoJSON, GeoTIFF (cross-blended shaded relief).
- **Access Method**: Public download repository and GitHub releases.
- **Licensing & Terms**: **Public Domain (CC0)**. No copyright restrictions for commercial or non-commercial use.
- **Redistribution & Caching**: Unlimited redistribution and offline bundling permitted.
- **Mandatory Caveat & Adjustment**: The default Natural Earth international boundary dataset contains disputed boundary lines for South Asia. For all SmartBoard Studio deployments, the Indian boundary must be adjusted and replaced with the authoritative Survey of India boundary.
- **Verification Status**: **VERIFIED**.

---

### 2.5 NASA Earth Observatory & Visible Earth
- **Official Portal**: [https://visibleearth.nasa.gov](https://visibleearth.nasa.gov) / [https://earthobservatory.nasa.gov](https://earthobservatory.nasa.gov)
- **Available Resources**:
  - Blue Marble: Next Generation (monthly cloud-free global surface imagery at up to 500m resolution).
  - Black Marble: Earth at Night (visible lights from human settlements and urbanization).
  - Global elevation and bathymetry grids (GEBCO / SRTM synthesis).
  - Atmospheric layers: Global cloud cover, sea surface temperature (MODIS/VIIRS), aerosol optical depth.
- **Data Formats**: GeoTIFF, equirectangular spherical PNG/JPEG textures (2048x1024, 4096x2048, 8192x4096).
- **Access Method**: Public direct download via NASA Visible Earth servers.
- **Licensing & Terms**: Public Domain (NASA guidelines: free for educational and commercial use).
- **Redistribution & Caching**: Freely redistributable and packageable as local textures for the 3D globe.
- **Attribution**: *“NASA Goddard Space Flight Center / Visible Earth.”*
- **Verification Status**: **VERIFIED**.

---

### 2.6 USGS / SRTM (United States Geological Survey)
- **Official Portal**: [https://earthexplorer.usgs.gov](https://earthexplorer.usgs.gov)
- **Available Resources**:
  - Shuttle Radar Topography Mission (SRTM) 1 Arc-Second (~30m) and 3 Arc-Second (~90m) global elevation grids.
  - Global Multi-resolution Terrain Elevation Data (GMTED2010).
- **Data Formats**: GeoTIFF, HGT, ASCII DEM.
- **Access Method**: USGS EarthExplorer, NASA Earthdata, and open AWS public datasets.
- **Licensing & Terms**: Public domain (US Government work).
- **Redistribution & Caching**: Unlimited offline caching and downsampled bundling permitted.
- **Verification Status**: **VERIFIED**.

---

### 2.7 Copernicus Land Monitoring Service (European Union / ESA)
- **Official Portal**: [https://land.copernicus.eu](https://land.copernicus.eu)
- **Available Resources**:
  - Copernicus GLO-30 / GLO-90 Global Digital Elevation Model.
  - ERA5 climate reanalysis global grids (via Copernicus Climate Data Store).
- **Data Formats**: Cloud Optimized GeoTIFF (COG), NetCDF.
- **Access Method**: Direct download via Copernicus API and AWS Open Data bucket.
- **Licensing & Terms**: Free and open access under the Copernicus data policy (Regulation (EU) No 377/2014).
- **Redistribution & Caching**: Permitted with attribution:  
  *“Generated using Copernicus Land Monitoring Service Information [Year].”*
- **Verification Status**: **VERIFIED**.

---

## 3. Dataset Downsampling & Classroom Packaging Specifications

To prevent overloading low-end classroom hardware and keep the SmartBoard Studio installer within reasonable limits:

| Dataset Category | Source | Raw Size | Classroom Distribution Strategy | Bundled Memory Footprint |
| :--- | :--- | :--- | :--- | :--- |
| **World Coastlines & Countries** | Natural Earth (Adjusted) | ~45 MB | TopoJSON simplified (1:110m for global, 1:50m for continental views) | < 450 KB |
| **Official India State & District Boundaries** | Survey of India | ~80 MB | Precision-preserved vector GeoJSON / TopoJSON, verified vertices | < 950 KB |
| **Physical Landforms (Mountains, Deserts, Plateaus)** | Natural Earth Physical + SoI | ~25 MB | Simplified vector polygons + polyline mountain ranges with peak markers | < 350 KB |
| **Major River Systems & Drainage Basins** | SoI + Bhuvan + HydroSHEDS | ~60 MB | Generalized major river centerlines + drainage polygon basins | < 500 KB |
| **3D Globe Spherical Textures** | NASA Blue Marble | ~400 MB | Equirectangular 2048x1024 8-bit JPEG basemap + night lights | ~1.8 MB |
| **Topographic Contours & Elevation Sample Grid** | SRTM / CartoDEM | Multi-GB | Pre-extracted 2D elevation matrix grids for benchmark teaching regions (Himalayas, Western Ghats, Deccan, Alps, Rockies) | ~400 KB per sample region |
| **Climate & Monsoons** | IMD + Köppen Classification | ~120 MB | Vectorized climate zones, seasonal wind vectors, and isohyets | < 250 KB |

---

## 4. Verification Checklists & Compliance Protocol

Before any geographic asset is committed to the application repository:
1. [ ] **Survey of India Check**: Has the India external boundary been cross-referenced against the Survey of India 2024 political map?
2. [ ] **Jammu & Kashmir / Ladakh Check**: Are both Union Territories delineated exactly according to official maps without alteration?
3. [ ] **Island Check**: Are Andaman & Nicobar and Lakshadweep islands properly included?
4. [ ] **Attribution Notice**: Is the formal Survey of India attribution text placed in the asset metadata?
5. [ ] **Licensing Check**: Is the source license verified for educational offline packaging?
6. [ ] **Performance Check**: Does the vector polygon render in < 8ms on standard Canvas2D contexts?


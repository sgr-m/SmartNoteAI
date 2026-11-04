/**
 * Geography Subject Module
 * Implements the SubjectModule interface for the SubjectRegistry
 */

import { SubjectModule, SubjectTool, SubjectTemplate, ToolExecutionContext } from '../subjectRegistry/types';
import { createShape, executeAddObject, executeAddMultipleObjects } from './commonHelpers';
import { CanvasObject, ShapeObject, TextObject } from '../../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { createDefaultGeoResourceState } from '../geography/types';

export const GeographyModule: SubjectModule = {
  id: 'geography',
  name: 'Geography',
  icon: '🌍',
  description: 'Physical, political, thematic maps, 3D globe, and Survey of India topographical Open Series Maps',
  tools: [
    // 1. Geography Resource Centre Launcher
    {
      id: 'geo-tool-resource-centre',
      subjectId: 'geography',
      name: 'Geography Resource Centre',
      category: 'Curriculum & Resources',
      icon: '🌍',
      description: 'Comprehensive 15-category Geography resource library with maps, atlas, remote sensing, and activities',
      badge: 'Resource Centre',
      tags: ['geography', 'atlas', 'india', 'world', 'maps', 'resources', 'curriculum'],
      interactiveModal: 'geographyResourceCentre',
      execute: (context) => {
        // Fallback direct execution if launched directly without modal
        const shape = createShape('geoMap', 180, 140, 760, 480, {
          label: 'Survey of India Official Political Map',
          params: createDefaultGeoResourceState(
            'soi-india-political',
            'Survey of India Official Political Map'
          ),
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert India Political Map');
      },
    },

    // 2. India Official Political Map (Survey of India)
    {
      id: 'geo-tool-india-political',
      subjectId: 'geography',
      name: 'Official Survey of India Map',
      category: 'India Maps & Administration',
      icon: '🇮🇳',
      description: 'Authoritative administrative map with 28 States, 8 UTs (including complete J&K and Ladakh), and capitals',
      badge: 'Official SoI',
      tags: ['india', 'political', 'states', 'capitals', 'union-territories', 'soi'],
      interactiveModal: 'geographyAtlas',
      execute: (context) => {
        const shape = createShape('geoMap', 200, 120, 720, 520, {
          label: 'Survey of India Political Map (28 States, 8 UTs)',
          params: createDefaultGeoResourceState(
            'soi-india-political',
            'Survey of India Political Map (28 States, 8 UTs)'
          ),
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert Survey of India Political Map');
      },
    },

    // 3. World Atlas & Thematic Explorer (Stage 3)
    {
      id: 'geo-tool-atlas',
      subjectId: 'geography',
      name: 'World Atlas & Thematic Explorer',
      category: 'World Cartography',
      icon: '🌍',
      description: '17 verified thematic layers: tectonic plates, ocean currents, climate zones, volcanoes, mountains, and trade routes',
      badge: 'Atlas',
      tags: ['atlas', 'world', 'thematic', 'tectonics', 'currents', 'climate', 'volcanoes'],
      interactiveModal: 'geographyAtlas',
      execute: (context) => {
        const defaultState = createDefaultGeoResourceState('world-atlas', 'World Thematic Atlas');
        const shape = createShape('geoMap', 160, 120, 820, 480, {
          label: 'World Thematic Atlas',
          params: {
            ...defaultState,
            scope: 'world',
            projection: 'robinson',
            layers: {
              ...defaultState.layers,
              tectonicPlates: true,
              oceanCurrents: true,
              volcanoes: true,
              mountainRanges: true,
              legend: true,
            },
          },
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert World Thematic Atlas');
      },
    },

    // 4. Survey of India Educational Toposheets (Stage 4)
    {
      id: 'geo-tool-soi-toposheets',
      subjectId: 'geography',
      name: 'Interactive Topographical Map Viewer',
      category: 'Topographical Maps',
      icon: '📐',
      description: 'Official Survey of India 1:50,000 educational toposheets (45 D/7 Mt Abu, 45 D/10 Palanpur, 53 E/4 Shiwaliks) with 20m contours and National Grid',
      badge: '1:50,000 SoI',
      tags: ['toposheet', 'soi', 'mount-abu', 'palanpur', 'contours', 'grid-reference', 'conventional-signs', 'elevation'],
      interactiveModal: 'topographicalViewer',
      execute: (context) => {
        const shape = createShape('geoTopoProfile', 180, 130, 800, 520, {
          label: 'SoI Toposheet 45 D/7 (Mount Abu)',
          params: {
            ...createDefaultGeoResourceState('soi-topo-45d7', 'SoI Toposheet 45 D/7 (Mount Abu)'),
            resourceType: 'topographic-sheet',
            contourInterval: 20,
            scaleRF: 50000,
            sheetNumber: '45 D/7',
            attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
          },
          strokeColor: '#f59e0b',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert Survey of India Educational Toposheet');
      },
    },

    // 5. National Topographical Grid & Reference Demonstrator (Stage 4)
    {
      id: 'geo-tool-topo-grid-lab',
      subjectId: 'geography',
      name: 'National Grid Reference Demonstrator',
      category: 'Topographical Maps',
      icon: '🌐',
      description: 'Educational demonstrations of Eastings, Northings, 4-figure and 6-figure grid references, and geographic coordinates',
      badge: 'Grid Ref',
      tags: ['grid', 'eastings', 'northings', 'four-figure', 'six-figure', 'soi', 'coordinates'],
      interactiveModal: 'topographicalViewer',
      execute: (context) => {
        const shape = createShape('geoTopoProfile', 180, 130, 800, 520, {
          label: 'SoI Grid Reference Lab (Sheet 45 D/7)',
          params: {
            ...createDefaultGeoResourceState('soi-topo-45d7', 'SoI Grid Reference Lab (Sheet 45 D/7)'),
            resourceType: 'topographic-sheet',
            gridReferenceMode: '6figure',
            scaleRF: 50000,
            sheetNumber: '45 D/7',
            attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
          },
          strokeColor: '#a855f7',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert Grid Reference Demonstrator');
      },
    },

    // 6. Survey of India Conventional Signs & Symbols Panel (Stage 4)
    {
      id: 'geo-tool-topo-symbols',
      subjectId: 'geography',
      name: 'Conventional Signs & Symbols Panel',
      category: 'Topographical Maps',
      icon: '🛕',
      description: 'Official Survey of India conventional symbols learning panel with meanings, topographical contexts, and CBSE/ICSE exam tips',
      badge: 'Legend',
      tags: ['symbols', 'conventional-signs', 'legend', 'temple', 'well', 'roads', 'settlements', 'soi'],
      interactiveModal: 'topographicalViewer',
      execute: (context) => {
        const shape = createShape('geoTopoProfile', 180, 130, 800, 520, {
          label: 'Survey of India Conventional Signs & Symbols',
          params: {
            ...createDefaultGeoResourceState('soi-topo-45d7', 'Survey of India Conventional Signs & Symbols'),
            resourceType: 'topographic-sheet',
            scaleRF: 50000,
            sheetNumber: '45 D/7',
            attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
          },
          strokeColor: '#ef4444',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert Conventional Symbols Panel');
      },
    },

    // 7. Geodesic Great-Circle Distance Measurement (Stage 3)
    {
      id: 'geo-tool-geodesic-distance',
      subjectId: 'geography',
      name: 'Geodesic Distance & Compass Bearing',
      category: 'GIS and Spatial Analysis',
      icon: '📏',
      description: 'Spherical Haversine great-circle distance calculator with nautical miles, statute miles, and 16-wind compass bearings',
      badge: 'Geodesic',
      tags: ['distance', 'haversine', 'great-circle', 'bearing', 'navigation', 'nautical-miles'],
      interactiveModal: 'geographyAtlas',
      execute: (context) => {
        const defaultState = createDefaultGeoResourceState('world-geodesic', 'World Geodesic Distance Tool');
        const shape = createShape('geoMap', 160, 120, 820, 480, {
          label: 'Geodesic Distance & Compass Measuring Tool',
          params: {
            ...defaultState,
            scope: 'world',
            projection: 'robinson',
            measurement: {
              active: true,
              startPoint: { lat: 28.6139, lon: 77.2090, label: 'New Delhi' },
              endPoint: { lat: 51.5074, lon: -0.1278, label: 'London' },
            },
            layers: {
              ...defaultState.layers,
              distanceTool: true,
              legend: true,
            },
          },
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert Geodesic Distance Tool');
      },
    },

    // 6. World Political Atlas
    {
      id: 'geo-tool-world-atlas',
      subjectId: 'geography',
      name: 'World Political Atlas',
      category: 'World Cartography',
      icon: '🌐',
      description: 'Global sovereign nations, continental boundaries, major oceans, and international capitals',
      badge: 'Interactive',
      tags: ['world', 'atlas', 'countries', 'capitals', 'continents', 'global'],
      interactiveModal: 'geographyAtlas',
      execute: (context) => {
        const shape = createShape('geoMap', 160, 140, 800, 440, {
          label: 'World Political Map',
          params: {
            mapType: 'world_political',
            projection: 'robinson',
            scope: 'world',
          },
          strokeColor: '#0ea5e9',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert World Political Map');
      },
    },

    // 4. 3D Globe with Solar Terminator (Stage 6)
    {
      id: 'geo-tool-3d-globe',
      subjectId: 'geography',
      name: 'Interactive 3D Earth & Globe Lab',
      category: 'Globe and Earth',
      icon: '🌐',
      description: 'Orthographic 3D spherical globe with 23.44° axial tilt, diurnal rotation, seasonal revolution, solar terminator, and graticule',
      badge: '3D Lab',
      tags: ['globe', '3d', 'earth', 'rotation', 'tilt', 'seasons', 'terminator', 'equinox', 'solstice'],
      interactiveModal: 'globe3DModal',
      execute: (context) => {
        const shape = createShape('geoGlobe', 220, 130, 600, 460, {
          label: 'Interactive 3D Earth & Globe Lab',
          params: {
            ...createDefaultGeoResourceState('earth-3d-globe', 'Interactive 3D Earth & Globe Lab'),
            resourceType: '3d-globe',
            title: 'Interactive 3D Earth & Globe Lab',
            globeState: {
              centerLon: 78.9629,
              centerLat: 20.5937,
              zoom: 1.0,
              axialTilt: 23.44,
              dayOfYear: 172,
              timeOfDayHours: 6.5,
              projectionMode: 'orthographic',
              demoMode: 'solstice-summer',
              animating: false,
              animSpeed: 1,
              layers: {
                graticule: true,
                terminator: true,
                equator: true,
                tropics: true,
                polarCircles: true,
                atmosphere: true,
                cityLights: true,
                countries: true,
                rivers: true,
                mountains: true,
                landmarks: true,
                labels: true,
              },
            },
          },
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert 3D Earth & Globe');
      },
    },

    // 5. Blank India Outline Map for Classroom Drawing
    {
      id: 'geo-tool-india-outline-worksheet',
      subjectId: 'geography',
      name: 'India Outline Map (Classroom Drawing)',
      category: 'Geography Activities',
      icon: '✏️',
      description: 'High-contrast blank vector outline based on official Survey of India boundary for teacher drawing and quizzes',
      badge: 'Worksheet',
      tags: ['outline', 'blank-map', 'drawing', 'worksheet', 'activity', 'india'],
      interactiveModal: 'geographyResourceCentre',
      execute: (context) => {
        const shape = createShape('geoMap', 200, 110, 700, 520, {
          label: 'India Outline Map (Drawing Layer)',
          params: {
            mapType: 'india_outline',
            scope: 'india',
            mode: 'blank_outline',
            attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
          },
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert India Outline Map');
      },
    },

    // 8. GIS, Satellite Imagery & Thematic Map Laboratory (Stage 7)
    {
      id: 'geo-tool-gis-lab',
      subjectId: 'geography',
      name: 'GIS & Satellite Thematic Laboratory',
      category: 'GIS and Spatial Analysis',
      icon: '🛰️',
      description: 'Educational GIS viewer with 15 verified ISRO Bhuvan/USGS/GEBCO layers, location inspector, and dual-map swipe comparison',
      badge: 'GIS Lab',
      tags: ['gis', 'satellite', 'bhuvan', 'isro', 'lulc', 'drainage', 'soils', 'floods', 'remote-sensing', 'swipe-compare'],
      interactiveModal: 'gisThematicLab',
      execute: (context) => {
        const defaultState = createDefaultGeoResourceState('gis-thematic-lab', 'GIS Thematic Viewer');
        const shape = createShape('geoMap', 180, 130, 840, 520, {
          label: 'GIS & Satellite Thematic Laboratory',
          params: {
            ...defaultState,
            resourceType: 'gis-viewer',
            title: 'GIS & Satellite Thematic Laboratory',
            provider: 'NRSC / ISRO (Bhuvan) & Survey of India',
            attribution: 'GIS Layers: © NRSC/ISRO Bhuvan • Boundaries: Official Survey of India',
            sourceUrl: 'https://bhuvan.nrsc.gov.in/',
            scope: 'india',
            gisState: {
              activeLayerIds: ['isro-bhuvan-satellite', 'isro-bhuvan-lulc'],
              layerOpacities: {
                'isro-bhuvan-satellite': 1.0,
                'isro-bhuvan-lulc': 0.75,
              },
              layerOrder: ['isro-bhuvan-satellite', 'isro-bhuvan-lulc'],
              comparisonMode: 'swipe',
              comparisonLayerAId: 'isro-bhuvan-satellite',
              comparisonLayerBId: 'isro-bhuvan-lulc',
              swipePosition: 50,
            },
          },
          strokeColor: '#0284c7',
          strokeWidth: 2,
          fillColor: 'rgba(15, 23, 42, 0.95)',
        });
        executeAddObject(context, shape, 'Insert GIS & Thematic Map Laboratory');
      },
    },

    // 6. Physical Geography Interactive Laboratory
    {
      id: 'geo-tool-physical-geo-lab',
      subjectId: 'geography',
      name: 'Physical Geography Interactive Laboratory',
      category: 'Physical Geography',
      icon: '🏔️',
      description: 'Comprehensive geomorphology with 15 3D landforms, plate tectonics, earthquakes, volcanoes, weathering, hydrology & oceanography',
      badge: 'Physical Geo Lab',
      tags: ['physical', 'landforms', 'tectonics', 'earthquakes', 'volcanoes', 'weathering', 'hydrology', 'oceanography'],
      interactiveModal: 'physicalGeoLab',
      execute: (context) => {
        const defaultState = createDefaultGeoResourceState('physical-geo-lab', 'Physical Geography Laboratory');
        const shape = createShape('geoMap', 180, 130, 840, 520, {
          label: 'Physical Geography Laboratory',
          params: {
            ...defaultState,
            resourceType: 'physical-geo-lab',
            title: 'Physical Geography Laboratory',
            provider: 'Geological Survey of India (GSI), USGS & NCERT',
            attribution: 'Educational Geodynamic Model • NCERT/CBSE Physical Geography Syllabus',
            scope: 'world',
            physicalGeoState: {
              activeCategory: 'landforms',
              selectedItemId: 'lf-fold-mountains',
              viewMode: '3d-model',
              animationPlaying: false,
              parameters: {
                faultSlipMeters: 3.5,
                faultAreaKm2: 600,
                plateSpeedCmYr: 5.0,
                volcanoVei: 4,
                riverGradientMPerKm: 12,
                tideRangeMeters: 4.2,
              },
            },
          },
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'rgba(9, 19, 34, 0.95)',
        });
        executeAddObject(context, shape, 'Insert Physical Geography Laboratory');
      },
    },

    // 13. Human and Economic Geography Laboratory (Stage 10)
    {
      id: 'geo-tool-human-economic-lab',
      subjectId: 'geography',
      name: 'Human and Economic Geography Laboratory',
      category: 'Human & Economic Geography',
      icon: '👥',
      description: 'Demographics, Census 2011, population pyramids, major crops, mineral & energy reserves, industrial regions, transport corridors & thematic charts',
      badge: 'Human & Economic Lab',
      tags: ['human', 'economic', 'population', 'demographics', 'census', 'agriculture', 'crops', 'minerals', 'energy', 'industry', 'transport', 'trade'],
      interactiveModal: 'humanEconomicLab',
      execute: (context) => {
        const defaultState = createDefaultGeoResourceState('human-economic-geo', 'Human & Economic Geography Laboratory');
        const shape = createShape('geoMap', 180, 130, 840, 520, {
          label: 'Human & Economic Geography Laboratory',
          params: {
            ...defaultState,
            resourceType: 'human-economic-geo',
            title: 'Human & Economic Geography Laboratory',
            provider: 'Census of India (ORGI), MoA&FW, Ministry of Mines, CEA, NHAI & Survey of India',
            attribution: 'Statistics: Authentic Government Portals • Base Boundaries: Survey of India (Official)',
            scope: 'india',
            humanEconomicState: {
              activeCategory: 'population',
              selectedMetricId: 'density',
              selectedItemId: 'UP',
              viewMode: 'distribution',
              chartType: 'line',
              referenceYear: 'Census of India 2011',
              showLabels: true,
              classifiedBreaks: true,
            },
          },
          strokeColor: '#c084fc',
          strokeWidth: 2,
          fillColor: 'rgba(9, 19, 34, 0.95)',
        });
        executeAddObject(context, shape, 'Insert Human & Economic Geography Laboratory');
      },
    },
  ],

  templates: [
    // Template 1: Physical Divisions of India
    {
      id: 'geo-template-india-physiography',
      subjectId: 'geography',
      name: 'Physical Divisions of India Lesson Kit',
      category: 'Physical Geography',
      icon: '🏔️',
      description: 'Complete classroom board layout with India map, key physiographic divisions legend, and elevation notes',
      createObjects: (origin) => {
        const title: TextObject = {
          id: uuidv4(),
          type: 'text',
          x: origin.x,
          y: origin.y,
          width: 600,
          height: 48,
          content: '🏔️ Physiographic Divisions of India',
          fontFamily: 'Inter, sans-serif',
          fontSize: 24,
          fontWeight: 700,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: '#38bdf8',
          backgroundColor: 'transparent',
          opacity: 1,
          rotation: 0,
          preset: 'heading',
          locked: false,
          layerId: 'objects',
        };

        const mapShape: ShapeObject = {
          id: uuidv4(),
          type: 'shape',
          shapeType: 'geoMap',
          x: origin.x,
          y: origin.y + 60,
          width: 580,
          height: 480,
          rotation: 0,
          fillColor: 'rgba(15, 23, 42, 0.95)',
          fillOpacity: 1,
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          strokeOpacity: 1,
          strokeStyle: 'solid',
          locked: false,
          layerId: 'objects',
          label: 'Physiographic Divisions of India',
          params: {
            mapType: 'india_physical',
            scope: 'india',
            attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
          },
        };

        const notesBox: TextObject = {
          id: uuidv4(),
          type: 'text',
          x: origin.x + 600,
          y: origin.y + 60,
          width: 320,
          height: 480,
          content: '• Northern Mountains (Himalayas)\n  - Greater, Lesser & Shiwaliks\n• Great Northern Plains\n  - Bhabar, Terai, Bhangar, Khadar\n• Peninsular Plateau\n  - Central Highlands & Deccan\n• Coastal Plains & Islands\n  - Western/Eastern Ghats\n  - Andaman & Lakshadweep',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'left',
          color: '#cbd5e1',
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          opacity: 1,
          rotation: 0,
          preset: 'body',
          locked: false,
          layerId: 'objects',
        };

        return [title, mapShape, notesBox];
      },
    },
  ],
};


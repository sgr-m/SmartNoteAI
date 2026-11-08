/**
 * Geography Subject Module
 * Implements the SubjectModule interface for the SubjectRegistry
 */

import { SubjectModule } from '../subjectRegistry/types';
import { createShape, executeAddObject } from './commonHelpers';
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
      description: 'Comprehensive Geography resource library with official maps, atlas, remote sensing, and activities',
      badge: 'Resource Centre',
      tags: ['geography', 'atlas', 'india', 'world', 'maps', 'resources', 'curriculum'],
      interactiveModal: 'geographyResourceCentre',
      execute: (context) => {
        const shape = createShape('geoMap', 180, 140, 760, 480, {
          label: 'Survey of India Official Political Map',
          params: createDefaultGeoResourceState(
            'soi-india-political',
            'Survey of India Official Political Map'
          ),
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'transparent',
          fillOpacity: 0,
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
          fillColor: 'transparent',
          fillOpacity: 0,
        });
        executeAddObject(context, shape, 'Insert Survey of India Political Map');
      },
    },

    // 3. Survey of India Educational Toposheets
    {
      id: 'geo-tool-soi-toposheets',
      subjectId: 'geography',
      name: 'Interactive Topographical Map Viewer',
      category: 'Topographical Maps',
      icon: '📐',
      description: 'Official Survey of India 1:50,000 educational toposheet with 20m contours and National Grid',
      badge: '1:50,000 SoI',
      tags: ['toposheet', 'soi', 'mount-abu', 'contours', 'elevation'],
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
          fillColor: 'transparent',
          fillOpacity: 0,
        });
        executeAddObject(context, shape, 'Insert Survey of India Educational Toposheet');
      },
    },

    // 4. Survey of India Conventional Signs & Symbols Panel
    {
      id: 'geo-tool-topo-symbols',
      subjectId: 'geography',
      name: 'Conventional Signs & Symbols Panel',
      category: 'Topographical Maps',
      icon: '🛕',
      description: 'Official Survey of India conventional symbols learning panel with meanings and topographical contexts',
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
          fillColor: 'transparent',
          fillOpacity: 0,
        });
        executeAddObject(context, shape, 'Insert Conventional Symbols Panel');
      },
    },

    // 5. 3D Globe with Solar Terminator
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
          fillColor: 'transparent',
          fillOpacity: 0,
        });
        executeAddObject(context, shape, 'Insert 3D Earth & Globe');
      },
    },

    // 6. Blank India Outline Map for Classroom Drawing
    {
      id: 'geo-tool-india-outline-worksheet',
      subjectId: 'geography',
      name: 'India Outline Map (Classroom Drawing)',
      category: 'Geography Activities',
      icon: '✏️',
      description: 'Select from official Survey of India blank outline maps, state boundaries, and river outlines for drawing and quizzes',
      badge: 'Outline Maps',
      tags: ['outline', 'blank-map', 'drawing', 'worksheet', 'activity', 'india'],
      interactiveModal: 'geographyOutlineMaps',
      execute: (context) => {
        const shape = createShape('geoMap', 200, 110, 700, 520, {
          label: 'Survey of India Official Blank Outline Map of India',
          params: {
            ...createDefaultGeoResourceState('geo-outline-india-blank', 'Survey of India Official Blank Outline Map of India'),
            mapType: 'india_outline',
            scope: 'india',
            mode: 'blank_outline',
            attribution: 'Based upon Survey of India map with the permission of the Surveyor General of India.',
          },
          strokeColor: '#38bdf8',
          strokeWidth: 2,
          fillColor: 'transparent',
          fillOpacity: 0,
        });
        executeAddObject(context, shape, 'Insert India Outline Map');
      },
    },
  ],

  templates: [],
};

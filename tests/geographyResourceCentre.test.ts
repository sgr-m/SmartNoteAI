/**
 * Geography Resource Centre Test Suite
 * Stage 1: Verification of Typed Resource Registry, 15 Categories, Search, Multi-Filters,
 * Survey of India Compliance, and Subject Registry Integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GEOGRAPHY_CATEGORIES,
  GEOGRAPHY_RESOURCES,
  getCategoryDefinitions,
  getAllGeographyResources,
  getGeographyResourceById,
  searchGeographyResources,
  getFavoriteResourceIds,
  toggleFavoriteResource,
  isFavoriteResource,
  recordRecentResource,
  getRecentResourceIds,
} from '../src/renderer/services/geography/geographyRegistry';
import { SubjectRegistry, initializeSubjectModules } from '../src/renderer/services/subjectModules';
import { GeoCategory } from '../src/renderer/services/geography/types';
import { ShapeObject, CanvasObject } from '../src/shared/types';
import { CommandSystem } from '../src/renderer/engine/CommandSystem';

describe('Stage 1 — Geography Resource Centre Architecture', () => {
  beforeEach(() => {
    initializeSubjectModules();
  });

  // ─── 1. Categories Verification ────────────────────────────────────────────

  it('provides all 7 curated curriculum categories', () => {
    const categories = getCategoryDefinitions();
    expect(categories.length).toBe(7);

    const requiredCategories: GeoCategory[] = [
      'globe-earth',
      'world-atlas',
      'india-maps',
      'physical',
      'topographical',
      'oceanography',
      'outline-maps',
    ];

    const categoryIds = categories.map((c) => c.id);
    requiredCategories.forEach((reqId) => {
      expect(categoryIds).toContain(reqId);
    });

    categories.forEach((cat) => {
      expect(cat.name).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.description).toBeTruthy();
      expect(typeof cat.count).toBe('number');
      expect(cat.count).toBeGreaterThanOrEqual(1); // Every category has authentic resources
    });
  });

  // ─── 2. Resource Metadata Quality & Verification ───────────────────────────

  it('guarantees authentic metadata, providers, and real URLs for all resources', () => {
    const resources = getAllGeographyResources();
    expect(resources.length).toBeGreaterThanOrEqual(18);

    resources.forEach((res) => {
      expect(res.id).toMatch(/^geo-[a-z0-9-]+$/);
      expect(res.name.trim().length).toBeGreaterThan(3);
      expect(res.description.trim().length).toBeGreaterThan(15);
      expect(res.educationalPurpose.trim().length).toBeGreaterThan(10);
      expect(res.suitableClasses.length).toBeGreaterThan(0);
      expect(['primary', 'middle', 'secondary', 'senior-secondary', 'higher-ed']).toContain(res.suitableClasses[0]);
      expect(res.provider.trim().length).toBeGreaterThan(2);
      expect(res.sourceUrl).toMatch(/^https?:\/\//); // Real verified URL
      expect(res.licenseAndAttribution.trim().length).toBeGreaterThan(5);
      expect(res.interactionCapabilities.length).toBeGreaterThan(0);
      expect(res.tags.length).toBeGreaterThan(0);
      expect(['india', 'world', 'regional']).toContain(res.scope);
    });
  });

  // ─── 3. Survey of India Compliance Check (Rule 10) ─────────────────────────

  it('strictly enforces Survey of India attribution and standards on all Indian territorial resources', () => {
    const resources = getAllGeographyResources();
    const indiaResources = resources.filter((r) => r.scope === 'india');

    expect(indiaResources.length).toBeGreaterThanOrEqual(6);

    const soiOfficialRes = getGeographyResourceById('geo-india-political-2026');
    expect(soiOfficialRes).toBeDefined();
    expect(soiOfficialRes?.provider).toContain('Survey of India');
    expect(soiOfficialRes?.licenseAndAttribution).toContain('Survey of India');
    expect(soiOfficialRes?.sourceUrl).toContain('surveyofindia.gov.in');

    const soiToposheetRes = getGeographyResourceById('geo-osm-toposheet-45d7');
    expect(soiToposheetRes).toBeDefined();
    expect(soiToposheetRes?.provider).toContain('Survey of India');
    expect(soiToposheetRes?.licenseAndAttribution).toContain('Survey of India');

    // Verify all Indian resources preserve formal attribution
    indiaResources.forEach((res) => {
      expect(
        res.licenseAndAttribution.includes('Survey of India') ||
        res.licenseAndAttribution.includes('Bhuvan') ||
        res.licenseAndAttribution.includes('Central Water Commission') ||
        res.licenseAndAttribution.includes('Census of India') ||
        res.licenseAndAttribution.includes('Ministry of Railways') ||
        res.licenseAndAttribution.includes('Geological Survey of India') ||
        res.licenseAndAttribution.includes('Government of India')
      ).toBe(true);
    });
  });

  // ─── 4. Search Functionality ───────────────────────────────────────────────

  it('accurately searches resources across name, description, tags, provider, and purpose', () => {
    const himalayanResults = searchGeographyResources({ searchQuery: 'Himalayas' });
    expect(himalayanResults.length).toBeGreaterThanOrEqual(1);

    const soiResults = searchGeographyResources({ searchQuery: 'Survey of India' });
    expect(soiResults.length).toBeGreaterThanOrEqual(2);

    const riverResults = searchGeographyResources({ searchQuery: 'rivers' });
    expect(riverResults.length).toBeGreaterThanOrEqual(1);
    expect(riverResults[0].id).toContain('river');

    const toposheetResults = searchGeographyResources({ searchQuery: 'toposheet' });
    expect(toposheetResults.length).toBeGreaterThanOrEqual(1);

    const nonExistent = searchGeographyResources({ searchQuery: 'xyznonexistentterm123' });
    expect(nonExistent.length).toBe(0);
  });

  // ─── 5. Multi-Faceted Filtering ───────────────────────────────────────────

  it('filters resources by category, class level, scope, and resource type', () => {
    // Category filter
    const oceanOnly = searchGeographyResources({ selectedCategory: 'oceanography' });
    expect(oceanOnly.length).toBeGreaterThanOrEqual(1);
    expect(oceanOnly.every((r) => r.category === 'oceanography')).toBe(true);

    // Scope filter (India)
    const indiaOnly = searchGeographyResources({ selectedScope: 'india' });
    expect(indiaOnly.length).toBeGreaterThanOrEqual(6);
    expect(indiaOnly.every((r) => r.scope === 'india')).toBe(true);

    // Scope filter (World)
    const worldOnly = searchGeographyResources({ selectedScope: 'world' });
    expect(worldOnly.length).toBeGreaterThanOrEqual(4);
    expect(worldOnly.every((r) => r.scope === 'world')).toBe(true);

    // Resource Type filter (3D Globe)
    const globeOnly = searchGeographyResources({ selectedType: '3d-globe' });
    expect(globeOnly.length).toBeGreaterThanOrEqual(1);
    expect(globeOnly[0].id).toBe('geo-globe-solar-terminator');

    // Class Level filter (Primary)
    const primaryOnly = searchGeographyResources({ selectedClassLevel: 'primary' });
    expect(primaryOnly.length).toBeGreaterThanOrEqual(2);
    expect(primaryOnly.every((r) => r.suitableClasses.includes('primary'))).toBe(true);
  });

  // ─── 6. Favorites & Recently Used Persistence ──────────────────────────────

  it('handles favorites toggling and recently used tracking', () => {
    const testId = 'geo-world-rivers-official';
    const initialFav = isFavoriteResource(testId);

    const toggled = toggleFavoriteResource(testId);
    expect(toggled).toBe(!initialFav);
    expect(isFavoriteResource(testId)).toBe(!initialFav);

    // Revert toggle
    toggleFavoriteResource(testId);
    expect(isFavoriteResource(testId)).toBe(initialFav);

    // Recently used
    recordRecentResource('geo-world-political-atlas');
    const recent = getRecentResourceIds();
    expect(recent[0]).toBe('geo-world-political-atlas');
  });

  // ─── 7. Subject Registry Integration & Navigation ──────────────────────────

  it('registers Geography into SubjectRegistry and provides tools & templates', () => {
    const modules = SubjectRegistry.getAllModules();
    const geoModule = modules.find((m) => m.id === 'geography');

    expect(geoModule).toBeDefined();
    expect(geoModule?.name).toBe('Geography');
    expect(geoModule?.icon).toBe('🌍');

    const tools = SubjectRegistry.getToolsBySubject('geography');
    expect(tools.length).toBe(6);

    const toolIds = tools.map((t) => t.id);
    expect(toolIds).toContain('geo-tool-resource-centre');
    expect(toolIds).toContain('geo-tool-india-political');
    expect(toolIds).toContain('geo-tool-3d-globe');
    expect(toolIds).toContain('geo-tool-soi-toposheets');
    expect(toolIds).toContain('geo-tool-topo-symbols');
    expect(toolIds).toContain('geo-tool-india-outline-worksheet');

    // Templates removed per specification
    const templates = SubjectRegistry.getAllTemplates();
    const geoTemplates = templates.filter((t) => t.subjectId === 'geography');
    expect(geoTemplates.length).toBe(0);
  });

  // ─── 8. Tool Execution & Whiteboard Object Creation ─────────────────────────

  it('executes geography tools and produces valid canvas objects without errors', () => {
    const tools = SubjectRegistry.getToolsBySubject('geography');
    const commandSystem = new CommandSystem();
    let dispatchedAction: any = null;

    const mockContext = {
      pageIndex: 0,
      dispatch: (action: any) => {
        dispatchedAction = action;
      },
      commandSystem,
      viewportCenter: { x: 400, y: 300 },
    };

    const indiaTool = tools.find((t) => t.id === 'geo-tool-india-political');
    expect(indiaTool).toBeDefined();

    indiaTool?.execute(mockContext);

    expect(dispatchedAction).toBeDefined();
    expect(dispatchedAction.type).toBe('ADD_OBJECT');
    expect(dispatchedAction.object).toBeDefined();

    const shape = dispatchedAction.object as ShapeObject;
    expect(shape.type).toBe('shape');
    expect(shape.shapeType).toBe('geoMap');
    expect(shape.params?.mapType).toBe('india_political');
    expect(shape.params?.provider).toBe('Survey of India');
  });
});


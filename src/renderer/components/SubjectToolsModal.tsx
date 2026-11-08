/**
 * SubjectToolsModal — Subject-Specific Teaching Platform (Section 16)
 * Unifies Mathematics, Physics, Chemistry, Computer Science, Digital Logic, Flowcharts, and General Teaching
 * Powered by the independent Subject Modules and shared SubjectRegistry.
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SubjectRegistry } from '../services/subjectModules';
import { SubjectId, SubjectTool } from '../services/subjectRegistry/types';
import { ScientificCalculatorModal } from './subjectModals/ScientificCalculatorModal';
import { PeriodicTableModal } from './subjectModals/PeriodicTableModal';
import { FunctionPlotterModal } from './subjectModals/FunctionPlotterModal';
import { EquationBalancerModal } from './subjectModals/EquationBalancerModal';
import { TruthTableModal } from './subjectModals/TruthTableModal';
import { LogicGateModal } from './subjectModals/LogicGateModal';
import { AngleConstructionModal } from './subjectModals/AngleConstructionModal';
import { CartesianPlaneModal } from './subjectModals/CartesianPlaneModal';
import { Cartesian3DPlaneModal } from './subjectModals/Cartesian3DPlaneModal';
import { NumberLineModal } from './subjectModals/NumberLineModal';
import { Geometry3DModal } from './subjectModals/Geometry3DModal';
import { ResistorModal } from './subjectModals/ResistorModal';
import { CircuitDiagramModal } from './subjectModals/CircuitDiagramModal';
import { ForceVectorModal } from './subjectModals/ForceVectorModal';
import { FreeBodyDiagramModal } from './subjectModals/FreeBodyDiagramModal';
import { MotionDiagramModal } from './subjectModals/MotionDiagramModal';
import { ElementCardModal } from './subjectModals/ElementCardModal';
import { BohrModelModal } from './subjectModals/BohrModelModal';
import { LabApparatusModal, ApparatusMode } from './subjectModals/LabApparatusModal';
import { CodeEditorModal } from './subjectModals/CodeEditorModal';
import { PseudocodeModal } from './subjectModals/PseudocodeModal';
import { FlowchartBuilderModal } from './subjectModals/FlowchartBuilderModal';
import { TraceTableModal } from './subjectModals/TraceTableModal';
import { CallStackModal } from './subjectModals/CallStackModal';
import { MemoryLayoutModal } from './subjectModals/MemoryLayoutModal';
import { LinkedListModal } from './subjectModals/LinkedListModal';
import { TreeGraphModal } from './subjectModals/TreeGraphModal';
import { SortingSearchingModal } from './subjectModals/SortingSearchingModal';
import { DatabaseTableModal } from './subjectModals/DatabaseTableModal';
import { CpuArchModal } from './subjectModals/CpuArchModal';
import { InstructionCycleModal } from './subjectModals/InstructionCycleModal';
import { NetworkTopologyModal } from './subjectModals/NetworkTopologyModal';
import { KarnaughMapModal } from './subjectModals/KarnaughMapModal';
import { DigitalCircuitModal } from './subjectModals/DigitalCircuitModal';
import { HierarchyChartModal } from './subjectModals/HierarchyChartModal';
import { MindmapModal } from './subjectModals/MindmapModal';
import { TimelineModal } from './subjectModals/TimelineModal';
import { ProcessChartModal } from './subjectModals/ProcessChartModal';
import { GeographyResourceCentreModal } from './geography/GeographyResourceCentreModal';
import { GeographyAtlasModal } from './geography/GeographyAtlasModal';
import { Globe3DModal } from './geography/Globe3DModal';
import { GisThematicModal } from './geography/GisThematicModal';
import { Solid3DType } from '../engine/geometry3DMath';
import { executeAddMultipleObjects } from '../services/subjectModules/commonHelpers';
import './SubjectToolsModal.css';

interface SubjectToolsModalProps {
  onClose: () => void;
}

export function SubjectToolsModal({ onClose }: SubjectToolsModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const [activeSubject, setActiveSubject] = useState<SubjectId | 'all'>('commonResources');
  const [searchQuery, setSearchQuery] = useState('');

  // Submodal States
  const [activeSubmodal, setActiveSubmodal] = useState<
    | 'calculator'
    | 'periodicTable'
    | 'elementCard'
    | 'bohrModel'
    | 'labApparatus'
    | 'functionPlotter'
    | 'equationBalancer'
    | 'truthTable'
    | 'logicGate'
    | 'karnaughMap'
    | 'digitalCircuit'
    | 'angleConstruction'
    | 'cartesianPlane'
    | 'cartesian3DPlane'
    | 'numberLine'
    | 'geometry3D'
    | 'resistor'
    | 'circuitDiagram'
    | 'forceVector'
    | 'resultantForce'
    | 'freeBodyDiagram'
    | 'motionDiagram'
    | 'codeEditor'
    | 'pseudocodeEditor'
    | 'flowchartBuilder'
    | 'traceTable'
    | 'callStack'
    | 'memoryLayout'
    | 'linkedList'
    | 'treeGraph'
    | 'sortingSearching'
    | 'databaseTable'
    | 'cpuArchitecture'
    | 'instructionCycle'
    | 'networkTopology'
    | 'hierarchyChart'
    | 'mindmap'
    | 'timeline'
    | 'processChart'
    | 'geographyResourceCentre'
    | 'geographyOutlineMaps'
    | 'geographyAtlas'
    | 'topographicalViewer'
    | 'globe3DModal'
    | 'gisThematicLab'
    | null
  >(null);
  const [bridgePseudocode, setBridgePseudocode] = useState<string>('');
  const [bridgeTitle, setBridgeTitle] = useState<string>('');
  const [selectedSolidType, setSelectedSolidType] = useState<Solid3DType>('cube');
  const [resistorMode, setResistorMode] = useState<'resistor' | 'rheostat'>('resistor');
  const [circuitMode, setCircuitMode] = useState<'seriesCircuit' | 'parallelCircuit'>('seriesCircuit');
  const [apparatusMode, setApparatusMode] = useState<ApparatusMode>('beaker');
  const [digitalCircuitMode, setDigitalCircuitMode] = useState<'mux' | 'adder' | 'flipflop' | 'counter'>('mux');

  const handleSubmodalInsertSuccess = () => {
    setActiveSubmodal(null);
    onClose();
  };

  const currentPageIndex = docState.currentPageIndex;

  const subjects = SubjectRegistry.getAllModules();

  // Filter tools based on active tab and query
  const allTools = SubjectRegistry.getAllTools();
  const displayedTools = allTools.filter((t) => {
    if (activeSubject !== 'all' && t.subjectId !== activeSubject) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const handleToolClick = (tool: SubjectTool) => {
    if (tool.interactiveModal) {
      switch (tool.interactiveModal) {
        case 'calculator':
          setActiveSubmodal('calculator');
          return;
        case 'periodicTable':
          setActiveSubmodal('periodicTable');
          return;
        case 'elementCard':
          setActiveSubmodal('elementCard');
          return;
        case 'bohrModel':
          setActiveSubmodal('bohrModel');
          return;
        case 'labApparatus': {
          let aMode: ApparatusMode = 'beaker';
          if (tool.id.includes('flask')) aMode = 'flask';
          else if (tool.id.includes('burner')) aMode = 'bunsenBurner';
          else if (tool.id.includes('testtube')) aMode = 'testTubeRack';
          setApparatusMode(aMode);
          setActiveSubmodal('labApparatus');
          return;
        }
        case 'functionPlotter':
          setActiveSubmodal('functionPlotter');
          return;
        case 'equationBalancer':
          setActiveSubmodal('equationBalancer');
          return;
        case 'truthTable':
          setActiveSubmodal('truthTable');
          return;
        case 'logicGate':
          setActiveSubmodal('logicGate');
          return;
        case 'digitalCircuit': {
          let mode: 'mux' | 'adder' | 'flipflop' | 'counter' = 'mux';
          if (tool.id.includes('adder')) mode = 'adder';
          else if (tool.id.includes('flip-flop')) mode = 'flipflop';
          else if (tool.id.includes('counter') || tool.id.includes('register')) mode = 'counter';
          setDigitalCircuitMode(mode);
          setActiveSubmodal('digitalCircuit');
          return;
        }
        case 'karnaughMap':
          setActiveSubmodal('karnaughMap');
          return;
        case 'angleConstruction':
          setActiveSubmodal('angleConstruction');
          return;
        case 'cartesianPlane':
          setActiveSubmodal('cartesianPlane');
          return;
        case 'cartesian3DPlane':
          setActiveSubmodal('cartesian3DPlane');
          return;
        case 'numberLine':
          setActiveSubmodal('numberLine');
          return;
        case 'geometry3D': {
          let sType: Solid3DType = 'cube';
          if (tool.id.includes('pyramid')) sType = 'pyramid';
          else if (tool.id.includes('cylinder')) sType = 'cylinder';
          else if (tool.id.includes('sphere')) sType = 'sphere';
          else if (tool.id.includes('cone')) sType = 'cone';
          else if (tool.id.includes('prism')) sType = 'prism';
          setSelectedSolidType(sType);
          setActiveSubmodal('geometry3D');
          return;
        }
        case 'resistor':
          setResistorMode(tool.id.includes('rheostat') ? 'rheostat' : 'resistor');
          setActiveSubmodal('resistor');
          return;
        case 'circuitDiagram':
          setCircuitMode(tool.id.includes('parallel') ? 'parallelCircuit' : 'seriesCircuit');
          setActiveSubmodal('circuitDiagram');
          return;
        case 'forceVector':
          setActiveSubmodal('forceVector');
          return;
        case 'resultantForce':
          setActiveSubmodal('resultantForce');
          return;
        case 'freeBodyDiagram':
          setActiveSubmodal('freeBodyDiagram');
          return;
        case 'motionDiagram':
          setActiveSubmodal('motionDiagram');
          return;
        case 'codeEditor':
          setActiveSubmodal('codeEditor');
          return;
        case 'pseudocodeEditor':
          setActiveSubmodal('pseudocodeEditor');
          return;
        case 'flowchartBuilder':
          setBridgePseudocode('');
          setBridgeTitle('');
          setActiveSubmodal('flowchartBuilder');
          return;
        case 'traceTable':
          setActiveSubmodal('traceTable');
          return;
        case 'callStack':
          setActiveSubmodal('callStack');
          return;
        case 'memoryLayout':
          setActiveSubmodal('memoryLayout');
          return;
        case 'linkedList':
          setActiveSubmodal('linkedList');
          return;
        case 'treeGraph':
          setActiveSubmodal('treeGraph');
          return;
        case 'sortingSearching':
          setActiveSubmodal('sortingSearching');
          return;
        case 'databaseTable':
          setActiveSubmodal('databaseTable');
          return;
        case 'cpuArchitecture':
          setActiveSubmodal('cpuArchitecture');
          return;
        case 'instructionCycle':
          setActiveSubmodal('instructionCycle');
          return;
        case 'networkTopology':
          setActiveSubmodal('networkTopology');
          return;
        case 'hierarchyChart':
          setActiveSubmodal('hierarchyChart');
          return;
        case 'mindmap':
          setActiveSubmodal('mindmap');
          return;
        case 'timeline':
          setActiveSubmodal('timeline');
          return;
        case 'processChart':
          setActiveSubmodal('processChart');
          return;
        case 'geographyResourceCentre':
          setActiveSubmodal('geographyResourceCentre');
          return;
        case 'geographyOutlineMaps':
          setActiveSubmodal('geographyOutlineMaps');
          return;
        case 'geographyAtlas':
          setActiveSubmodal('geographyAtlas');
          return;
        case 'topographicalViewer':
          setActiveSubmodal('geographyResourceCentre');
          return;
        case 'globe3DModal':
          setActiveSubmodal('globe3DModal');
          return;
        case 'gisThematicLab':
          setActiveSubmodal('gisThematicLab');
          return;
      }
    }

    // Direct execution onto whiteboard
    tool.execute({
      pageIndex: currentPageIndex,
      dispatch: docDispatch,
      commandSystem,
      viewportCenter: { x: 300, y: 240 },
    });
    onClose();
  };

  const currentPage = docState.lesson.pages[currentPageIndex];
  const boardBgColor = currentPage?.background?.color || '#1b4332';

  return (
    <>
      <div
        className="subject-tools-overlay"
        style={{ '--board-bg-color': boardBgColor } as React.CSSProperties}
        onClick={onClose}
      >
        <div
          className="subject-tools-modal"
          style={{ '--board-bg-color': boardBgColor } as React.CSSProperties}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="subject-tools-header">
            <div className="subject-tools-title-group">
              <span className="subject-tools-icon">🎓</span>
              <div>
                <h3>Subject Teaching Platform</h3>
                <p>Curriculum STEM modules, instruments, interactive simulators & diagrams</p>
              </div>
            </div>
            <button className="subject-tools-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div className="subject-tools-filter-bar">
            <input
              type="text"
              className="subject-search-input"
              placeholder="Search tools, formulas, diagrams (e.g. Ruler, Ohm, Bohr, Binary Tree, AND gate)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Subject Category Tabs */}
          <div className="subject-tools-tabs">
            <button
              className={`tab-btn ${activeSubject === 'all' ? 'active' : ''}`}
              onClick={() => setActiveSubject('all')}
            >
              🌟 All Subjects
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                className={`tab-btn ${activeSubject === sub.id ? 'active' : ''}`}
                onClick={() => setActiveSubject(sub.id)}
              >
                {sub.icon} {sub.name}
              </button>
            ))}
          </div>

          {/* Content Body */}
          <div className="subject-tools-body">
            {activeSubject === 'geography' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  margin: '0 0 16px 0',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(14, 165, 233, 0.12) 100%)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '28px' }}>🌍</span>
                  <div>
                    <strong style={{ fontSize: '14.5px', display: 'block', color: '#38bdf8' }}>
                      Geography Resource Centre
                    </strong>
                    <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                      Official Survey of India maps, Topography, River Basins, 3D Globe & Outline Maps
                    </span>
                  </div>
                </div>
                <button
                  className="insert-btn"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', background: '#0284c7', color: '#ffffff', fontWeight: 600, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  onClick={() => setActiveSubmodal('geographyResourceCentre')}
                >
                  Open Resource Centre ↗
                </button>
              </div>
            )}
            <div className="tools-grid">
              {displayedTools.map((tool) => (
                <div key={tool.id} className="tool-card" onClick={() => handleToolClick(tool)}>
                  <div className="tool-card-top">
                    <span className="tool-card-icon">{tool.icon}</span>
                    {tool.badge && <span className="tool-card-badge">{tool.badge}</span>}
                  </div>
                  <h4>{tool.name}</h4>
                  <p>{tool.description}</p>
                  <button className="insert-btn">
                    {tool.interactiveModal ? 'Open Interactive Tool ↗' : 'Insert on Board'}
                  </button>
                </div>
              ))}
              {displayedTools.length === 0 && (
                <div className="no-tools-message">
                  <span>🔍</span>
                  <p>No subject tools found matching "{searchQuery}".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Submodals */}
      {activeSubmodal === 'calculator' && (
        <ScientificCalculatorModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'periodicTable' && (
        <PeriodicTableModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'functionPlotter' && (
        <FunctionPlotterModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'equationBalancer' && (
        <EquationBalancerModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'logicGate' && (
        <LogicGateModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'truthTable' && (
        <TruthTableModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'karnaughMap' && (
        <KarnaughMapModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'angleConstruction' && (
        <AngleConstructionModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'cartesianPlane' && (
        <CartesianPlaneModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'cartesian3DPlane' && (
        <Cartesian3DPlaneModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'numberLine' && (
        <NumberLineModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'geometry3D' && (
        <Geometry3DModal
          defaultSolid={selectedSolidType}
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'resistor' && (
        <ResistorModal
          defaultMode={resistorMode}
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'circuitDiagram' && (
        <CircuitDiagramModal
          defaultMode={circuitMode}
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'forceVector' && (
        <ForceVectorModal
          defaultMode="forceVector"
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'resultantForce' && (
        <ForceVectorModal
          defaultMode="resultantForce"
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'freeBodyDiagram' && (
        <FreeBodyDiagramModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'motionDiagram' && (
        <MotionDiagramModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'elementCard' && (
        <ElementCardModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'bohrModel' && (
        <BohrModelModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'labApparatus' && (
        <LabApparatusModal
          defaultMode={apparatusMode}
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'codeEditor' && (
        <CodeEditorModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'pseudocodeEditor' && (
        <PseudocodeModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
          onConvertToFlowchart={(pseudo, title) => {
            setBridgePseudocode(pseudo);
            setBridgeTitle(title);
            setActiveSubmodal('flowchartBuilder');
          }}
        />
      )}
      {activeSubmodal === 'flowchartBuilder' && (
        <FlowchartBuilderModal
          initialPseudocode={bridgePseudocode || undefined}
          initialTitle={bridgeTitle || undefined}
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'traceTable' && (
        <TraceTableModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'callStack' && (
        <CallStackModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'memoryLayout' && (
        <MemoryLayoutModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'linkedList' && (
        <LinkedListModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'treeGraph' && (
        <TreeGraphModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'sortingSearching' && (
        <SortingSearchingModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'databaseTable' && (
        <DatabaseTableModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'cpuArchitecture' && (
        <CpuArchModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'instructionCycle' && (
        <InstructionCycleModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'networkTopology' && (
        <NetworkTopologyModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'digitalCircuit' && (
        <DigitalCircuitModal
          defaultMode={digitalCircuitMode}
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'hierarchyChart' && (
        <HierarchyChartModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'mindmap' && (
        <MindmapModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'timeline' && (
        <TimelineModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'processChart' && (
        <ProcessChartModal
          onClose={() => setActiveSubmodal(null)}
          onInsertSuccess={handleSubmodalInsertSuccess}
        />
      )}
      {activeSubmodal === 'geographyResourceCentre' && (
        <GeographyResourceCentreModal
          onClose={() => setActiveSubmodal(null)}
          onOpenAtlas={() => setActiveSubmodal('geographyAtlas')}
          onOpenGlobe={() => setActiveSubmodal('globe3DModal')}
          onOpenGisLab={() => setActiveSubmodal('gisThematicLab')}
        />
      )}
      {activeSubmodal === 'geographyOutlineMaps' && (
        <GeographyResourceCentreModal
          onlyOutlineMaps={true}
          onClose={() => setActiveSubmodal(null)}
        />
      )}
      {activeSubmodal === 'geographyAtlas' && (
        <GeographyAtlasModal
          onClose={() => setActiveSubmodal(null)}
        />
      )}
      {activeSubmodal === 'globe3DModal' && (
        <Globe3DModal
          onClose={() => setActiveSubmodal(null)}
        />
      )}
      {activeSubmodal === 'gisThematicLab' && (
        <GisThematicModal
          onClose={() => setActiveSubmodal(null)}
        />
      )}
    </>
  );
}

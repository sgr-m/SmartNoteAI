/**
 * SubjectToolsModal — Subject-Specific Teaching Platform (Section 16)
 * Unifies Mathematics, Physics, Chemistry, Computer Science, Digital Logic, Flowcharts, and General Teaching
 * Powered by the independent Subject Modules and shared SubjectRegistry.
 */

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SubjectRegistry } from '../services/subjectModules';
import { SubjectId, SubjectTool, SubjectTemplate } from '../services/subjectRegistry/types';
import { ScientificCalculatorModal } from './subjectModals/ScientificCalculatorModal';
import { PeriodicTableModal } from './subjectModals/PeriodicTableModal';
import { FunctionPlotterModal } from './subjectModals/FunctionPlotterModal';
import { EquationBalancerModal } from './subjectModals/EquationBalancerModal';
import { TruthTableModal } from './subjectModals/TruthTableModal';
import { AngleConstructionModal } from './subjectModals/AngleConstructionModal';
import { CartesianPlaneModal } from './subjectModals/CartesianPlaneModal';
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
import { Solid3DType } from '../engine/geometry3DMath';
import { executeAddMultipleObjects } from '../services/subjectModules/commonHelpers';
import './SubjectToolsModal.css';

interface SubjectToolsModalProps {
  onClose: () => void;
}

export function SubjectToolsModal({ onClose }: SubjectToolsModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const [activeSubject, setActiveSubject] = useState<SubjectId | 'all'>('mathematics');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tools' | 'templates'>('tools');

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
    | 'angleConstruction'
    | 'cartesianPlane'
    | 'numberLine'
    | 'geometry3D'
    | 'resistor'
    | 'circuitDiagram'
    | 'forceVector'
    | 'resultantForce'
    | 'freeBodyDiagram'
    | 'motionDiagram'
    | null
  >(null);
  const [selectedSolidType, setSelectedSolidType] = useState<Solid3DType>('cube');
  const [resistorMode, setResistorMode] = useState<'resistor' | 'rheostat'>('resistor');
  const [circuitMode, setCircuitMode] = useState<'seriesCircuit' | 'parallelCircuit'>('seriesCircuit');
  const [apparatusMode, setApparatusMode] = useState<ApparatusMode>('beaker');

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

  // Filter templates
  const allTemplates = SubjectRegistry.getAllTemplates();
  const displayedTemplates = allTemplates.filter((tmpl) => {
    if (activeSubject !== 'all' && tmpl.subjectId !== activeSubject) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tmpl.name.toLowerCase().includes(q) ||
      tmpl.description.toLowerCase().includes(q) ||
      tmpl.category.toLowerCase().includes(q)
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
        case 'angleConstruction':
          setActiveSubmodal('angleConstruction');
          return;
        case 'cartesianPlane':
          setActiveSubmodal('cartesianPlane');
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

  const handleTemplateClick = (tmpl: SubjectTemplate) => {
    const objects = tmpl.createObjects({ x: 200, y: 160 });
    executeAddMultipleObjects(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      objects,
      `Insert Template: ${tmpl.name}`
    );
    onClose();
  };

  return (
    <>
      <div className="subject-tools-overlay" onClick={onClose}>
        <div className="subject-tools-modal" onClick={(e) => e.stopPropagation()}>
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

          {/* Search & Mode Switcher */}
          <div className="subject-tools-filter-bar">
            <input
              type="text"
              className="subject-search-input"
              placeholder="Search tools, formulas, diagrams (e.g. Ruler, Ohm, Bohr, Binary Tree, AND gate)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="view-mode-toggle">
              <button
                className={`mode-btn ${viewMode === 'tools' ? 'active' : ''}`}
                onClick={() => setViewMode('tools')}
              >
                🎓 Subject Tools ({displayedTools.length})
              </button>
              <button
                className={`mode-btn ${viewMode === 'templates' ? 'active' : ''}`}
                onClick={() => setViewMode('templates')}
              >
                📋 Templates ({displayedTemplates.length})
              </button>
            </div>
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
            {viewMode === 'tools' ? (
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
            ) : (
              <div className="tools-grid">
                {displayedTemplates.map((tmpl) => (
                  <div key={tmpl.id} className="tool-card" onClick={() => handleTemplateClick(tmpl)}>
                    <div className="tool-card-top">
                      <span className="tool-card-icon">{tmpl.icon}</span>
                      <span className="tool-card-badge">Template</span>
                    </div>
                    <h4>{tmpl.name}</h4>
                    <p>{tmpl.description}</p>
                    <button className="insert-btn">Place Template on Board</button>
                  </div>
                ))}
                {displayedTemplates.length === 0 && (
                  <div className="no-tools-message">
                    <span>📋</span>
                    <p>No lesson templates found matching "{searchQuery}".</p>
                  </div>
                )}
              </div>
            )}
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
      {activeSubmodal === 'truthTable' && (
        <TruthTableModal
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
    </>
  );
}

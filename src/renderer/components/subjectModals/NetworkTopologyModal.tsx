/**
 * Network Topology Modal (CS Teaching Platform)
 * Interactive builder for computer network topologies:
 * Star, Mesh, Bus, Ring, Tree, and Client-Server architectures.
 * Models network nodes, transmission lines, IP addresses, and packet flow.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

interface NetworkTopologyModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

export type TopologyType = 'star' | 'mesh' | 'bus' | 'ring' | 'tree' | 'clientServer';

export interface NetworkNodeDef {
  id: string;
  name: string;
  type: 'pc' | 'switch' | 'router' | 'server' | 'printer';
  ip?: string;
}

const TOPOLOGY_PRESETS: Record<
  TopologyType,
  {
    name: string;
    title: string;
    description: string;
    nodes: NetworkNodeDef[];
  }
> = {
  star: {
    name: 'Star Topology',
    title: 'Star Network Topology (Central Switch / Hub)',
    description: 'All workstations connect independently to a central network switch or hub',
    nodes: [
      { id: 'SW', name: 'Switch (Core)', type: 'switch', ip: '192.168.1.1' },
      { id: 'PC1', name: 'PC 1 (Lab)', type: 'pc', ip: '192.168.1.10' },
      { id: 'PC2', name: 'PC 2 (Lab)', type: 'pc', ip: '192.168.1.11' },
      { id: 'PC3', name: 'PC 3 (Lab)', type: 'pc', ip: '192.168.1.12' },
      { id: 'PRN', name: 'Printer', type: 'printer', ip: '192.168.1.20' },
    ],
  },
  mesh: {
    name: 'Full Mesh Topology',
    title: 'Full Mesh Topology (High Redundancy)',
    description: 'Every node connects directly to every other node for maximum fault tolerance',
    nodes: [
      { id: 'R1', name: 'Router A', type: 'router', ip: '10.0.0.1' },
      { id: 'R2', name: 'Router B', type: 'router', ip: '10.0.0.2' },
      { id: 'R3', name: 'Router C', type: 'router', ip: '10.0.0.3' },
      { id: 'R4', name: 'Router D', type: 'router', ip: '10.0.0.4' },
    ],
  },
  bus: {
    name: 'Bus Topology',
    title: 'Linear Bus Topology (Backbone Cable with Terminators)',
    description: 'Nodes connect via drop lines to a single shared central coaxial backbone',
    nodes: [
      { id: 'PC1', name: 'Workstation 1', type: 'pc', ip: '192.168.0.2' },
      { id: 'PC2', name: 'Workstation 2', type: 'pc', ip: '192.168.0.3' },
      { id: 'PC3', name: 'Workstation 3', type: 'pc', ip: '192.168.0.4' },
      { id: 'SRV', name: 'File Server', type: 'server', ip: '192.168.0.1' },
    ],
  },
  ring: {
    name: 'Ring Topology',
    title: 'Token Ring Topology (Circular Transmission)',
    description: 'Each node connects to exactly two neighbors forming a closed loop with token passing',
    nodes: [
      { id: 'N1', name: 'Node 1', type: 'pc', ip: '172.16.0.1' },
      { id: 'N2', name: 'Node 2', type: 'pc', ip: '172.16.0.2' },
      { id: 'N3', name: 'Node 3', type: 'pc', ip: '172.16.0.3' },
      { id: 'N4', name: 'Node 4', type: 'pc', ip: '172.16.0.4' },
    ],
  },
  tree: {
    name: 'Tree / Hierarchical Topology',
    title: 'Tree Topology (Core ➔ Distribution ➔ Access)',
    description: 'Hierarchical branching structure combining star groups connected via backbone',
    nodes: [
      { id: 'CORE', name: 'Core Router', type: 'router', ip: '10.1.0.1' },
      { id: 'SW1', name: 'Switch Floor 1', type: 'switch', ip: '10.1.1.1' },
      { id: 'SW2', name: 'Switch Floor 2', type: 'switch', ip: '10.1.2.1' },
      { id: 'PC1', name: 'Client 101', type: 'pc', ip: '10.1.1.10' },
      { id: 'PC2', name: 'Client 201', type: 'pc', ip: '10.1.2.10' },
    ],
  },
  clientServer: {
    name: 'Client-Server Architecture',
    title: 'Client-Server Model (Centralized Services)',
    description: 'Dedicated high-performance servers providing authentication, web, and DB to clients',
    nodes: [
      { id: 'SRV1', name: 'Web Server', type: 'server', ip: '192.168.1.100' },
      { id: 'SRV2', name: 'Database Server', type: 'server', ip: '192.168.1.101' },
      { id: 'CL1', name: 'Browser Client', type: 'pc', ip: '192.168.1.10' },
      { id: 'CL2', name: 'Mobile Client', type: 'pc', ip: '192.168.1.11' },
    ],
  },
};

export function NetworkTopologyModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: NetworkTopologyModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [topology, setTopology] = useState<TopologyType>(
    (existingShape?.params?.topology as TopologyType) || 'star'
  );
  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || TOPOLOGY_PRESETS.star.title
  );
  const [nodes, setNodes] = useState<NetworkNodeDef[]>(
    existingShape?.params?.nodes || TOPOLOGY_PRESETS.star.nodes
  );
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );

  const currentPageIndex = docState.currentPageIndex;

  const handleSelectTopology = (type: TopologyType) => {
    setTopology(type);
    const p = TOPOLOGY_PRESETS[type];
    setTitle(p.title);
    setNodes(p.nodes.map((n) => ({ ...n })));
  };

  const handleUpdateNode = (idx: number, field: keyof NetworkNodeDef, val: string) => {
    const updated = [...nodes];
    updated[idx] = { ...updated[idx], [field]: val };
    setNodes(updated);
  };

  const handleSave = () => {
    const width = 560;
    const height = 400;

    const params = {
      diagramType: 'networkTopology',
      topology,
      title,
      nodes,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        label: title,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('csDiagram', 200, 160, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      label: title,
    });

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      `Insert ${title}`
    );

    onInsertSuccess?.();
    onClose();
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card"
        style={{ maxWidth: '840px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🌐</span>
            <div>
              <h3>Network Topology & Infrastructure Designer</h3>
              <p>Configure network layout architectures, node interfaces, and IP addressing</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Topology Architecture:</label>
            <select
              className="cs-modal-select"
              value={topology}
              onChange={(e) => handleSelectTopology(e.target.value as TopologyType)}
            >
              {Object.entries(TOPOLOGY_PRESETS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="cs-toolbar-field" style={{ flex: 1 }}>
            <label>Font Size:</label>
            <select
              className="cs-modal-select"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              {[11, 12, 14, 16, 18, 20, 24].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}px
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="submodal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Topology Description Card */}
          <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8, padding: 12 }}>
            <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
              {TOPOLOGY_PRESETS[topology].name}
            </div>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
              {TOPOLOGY_PRESETS[topology].description}
            </p>
          </div>

          {/* Connected Network Nodes List */}
          <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: 'rgba(56,189,248,0.08)', borderBottom: '1px solid rgba(56,189,248,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>CONNECTED NODES ({nodes.length})</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>PC • Switch • Router • Server • Printer</span>
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {nodes.map((n, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ width: 24, fontSize: 11, color: '#64748b' }}>{idx + 1}</span>

                  <input
                    type="text"
                    value={n.name}
                    onChange={(e) => handleUpdateNode(idx, 'name', e.target.value)}
                    className="cs-modal-input"
                    style={{ flex: 2, padding: '4px 8px', fontSize: 12 }}
                    placeholder="Device name"
                  />

                  <select
                    value={n.type}
                    onChange={(e) => handleUpdateNode(idx, 'type', e.target.value)}
                    className="cs-modal-select"
                    style={{ width: '110px', padding: '4px 8px', fontSize: 12 }}
                  >
                    <option value="pc">🖥️ PC</option>
                    <option value="switch">🔀 Switch</option>
                    <option value="router">📡 Router</option>
                    <option value="server">🗄️ Server</option>
                    <option value="printer">🖨️ Printer</option>
                  </select>

                  <input
                    type="text"
                    value={n.ip || ''}
                    onChange={(e) => handleUpdateNode(idx, 'ip', e.target.value)}
                    className="cs-modal-input"
                    style={{ flex: 1.5, padding: '4px 8px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}
                    placeholder="192.168.1.X"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            💡 Double-click diagram on whiteboard anytime to edit nodes
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="submodal-btn submodal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="submodal-btn submodal-btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Topology on Board' : 'Insert Topology onto Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


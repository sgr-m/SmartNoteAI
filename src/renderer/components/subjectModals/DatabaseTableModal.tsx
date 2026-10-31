/**
 * Database Table & ER Diagram Modal (CS Teaching Platform)
 * Interactive schema designer for relational database tables and ER models.
 * Supports primary keys (PK), foreign keys (FK), column types, constraints,
 * SQL preview, and whiteboard insertion.
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

export interface ColumnDef {
  name: string;
  type: string;
  isPK: boolean;
  isFK: boolean;
  refTable?: string;
}

interface DatabaseTableModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const PRESETS: Record<
  string,
  {
    tableName: string;
    description: string;
    columns: ColumnDef[];
  }
> = {
  students: {
    tableName: 'Students',
    description: 'Student records with enrolled course relation',
    columns: [
      { name: 'id', type: 'INT', isPK: true, isFK: false },
      { name: 'name', type: 'VARCHAR(100)', isPK: false, isFK: false },
      { name: 'email', type: 'VARCHAR(255)', isPK: false, isFK: false },
      { name: 'course_id', type: 'INT', isPK: false, isFK: true, refTable: 'Courses.id' },
      { name: 'enrolled_at', type: 'TIMESTAMP', isPK: false, isFK: false },
    ],
  },
  orders: {
    tableName: 'Orders',
    description: 'E-commerce orders with customer and product relations',
    columns: [
      { name: 'order_id', type: 'INT', isPK: true, isFK: false },
      { name: 'customer_id', type: 'INT', isPK: false, isFK: true, refTable: 'Customers.id' },
      { name: 'total_amount', type: 'DECIMAL(10,2)', isPK: false, isFK: false },
      { name: 'status', type: 'VARCHAR(20)', isPK: false, isFK: false },
      { name: 'created_at', type: 'TIMESTAMP', isPK: false, isFK: false },
    ],
  },
  users: {
    tableName: 'Users',
    description: 'Authentication and profile schema',
    columns: [
      { name: 'user_id', type: 'INT', isPK: true, isFK: false },
      { name: 'username', type: 'VARCHAR(50)', isPK: false, isFK: false },
      { name: 'password_hash', type: 'VARCHAR(255)', isPK: false, isFK: false },
      { name: 'role', type: 'VARCHAR(20)', isPK: false, isFK: false },
      { name: 'is_active', type: 'BOOLEAN', isPK: false, isFK: false },
    ],
  },
  courses: {
    tableName: 'Courses',
    description: 'Academic course curriculum schema',
    columns: [
      { name: 'course_id', type: 'INT', isPK: true, isFK: false },
      { name: 'title', type: 'VARCHAR(150)', isPK: false, isFK: false },
      { name: 'credits', type: 'INT', isPK: false, isFK: false },
      { name: 'department', type: 'VARCHAR(50)', isPK: false, isFK: false },
    ],
  },
};

const COMMON_TYPES = ['INT', 'BIGINT', 'VARCHAR(50)', 'VARCHAR(100)', 'VARCHAR(255)', 'TEXT', 'BOOLEAN', 'DECIMAL(10,2)', 'DATE', 'TIMESTAMP'];

export function DatabaseTableModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: DatabaseTableModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [tableName, setTableName] = useState<string>(
    existingShape?.params?.tableName || 'Students'
  );
  const [columns, setColumns] = useState<ColumnDef[]>(
    existingShape?.params?.columns || PRESETS.students.columns
  );
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);

  // New column form
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<string>('VARCHAR(100)');
  const [newColIsPK, setNewColIsPK] = useState<boolean>(false);
  const [newColIsFK, setNewColIsFK] = useState<boolean>(false);
  const [newColRef, setNewColRef] = useState<string>('');

  const currentPageIndex = docState.currentPageIndex;

  const handleSelectPreset = (key: string) => {
    const p = PRESETS[key];
    if (p) {
      setTableName(p.tableName);
      setColumns(p.columns.map((c) => ({ ...c })));
    }
  };

  const handleAddColumn = () => {
    const name = newColName.trim();
    if (!name) return;
    if (columns.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;

    setColumns([
      ...columns,
      {
        name,
        type: newColType,
        isPK: newColIsPK,
        isFK: newColIsFK,
        refTable: newColIsFK && newColRef.trim() ? newColRef.trim() : undefined,
      },
    ]);

    setNewColName('');
    setNewColIsPK(false);
    setNewColIsFK(false);
    setNewColRef('');
  };

  const handleRemoveColumn = (idx: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, i) => i !== idx));
  };

  const handleTogglePK = (idx: number) => {
    setColumns(
      columns.map((c, i) => (i === idx ? { ...c, isPK: !c.isPK } : c))
    );
  };

  const handleToggleFK = (idx: number) => {
    setColumns(
      columns.map((c, i) => (i === idx ? { ...c, isFK: !c.isFK } : c))
    );
  };

  const handleSave = () => {
    const width = 480;
    const height = Math.max(280, 70 + columns.length * 32 + 50);

    const params = {
      diagramType: 'databaseTable',
      tableName,
      columns,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: { ...existingShape.params, ...params },
        label: `Table: ${tableName}`,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('csDiagram', 200, 160, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      label: `Table: ${tableName}`,
    });

    executeAddObject(
      { pageIndex: currentPageIndex, dispatch: docDispatch, commandSystem },
      shapeObj,
      `Insert Database Table: ${tableName}`
    );

    onInsertSuccess?.();
    onClose();
  };

  // SQL Preview
  const sqlPreview = `CREATE TABLE ${tableName || 'MyTable'} (\n` +
    columns
      .map(
        (c) =>
          `  ${c.name} ${c.type}${c.isPK ? ' PRIMARY KEY' : ''}${c.isFK ? ` REFERENCES ${c.refTable || 'OtherTable(id)'}` : ''}`
      )
      .join(',\n') +
    '\n);';

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card"
        style={{ maxWidth: '820px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>🗄️</span>
            <div>
              <h3>Relational Database Table & Schema Designer</h3>
              <p>Configure tables, column data types, Primary/Foreign keys, and insert onto whiteboard</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Table Name:</label>
            <input
              type="text"
              className="cs-modal-input"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. Students"
            />
          </div>

          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Preset Schema:</label>
            <select
              className="cs-modal-select"
              onChange={(e) => handleSelectPreset(e.target.value)}
              defaultValue="students"
            >
              {Object.entries(PRESETS).map(([k, p]) => (
                <option key={k} value={k}>
                  {p.tableName} ({p.description})
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

        {/* Content Body */}
        <div className="submodal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Columns Table */}
          <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid rgba(56,189,248,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', background: 'rgba(56,189,248,0.08)', borderBottom: '1px solid rgba(56,189,248,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#38bdf8' }}>TABLE COLUMNS ({columns.length})</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>🔑 = Primary Key &nbsp;|&nbsp; 🔗 = Foreign Key</span>
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span style={{ width: 24, fontSize: 11, color: '#64748b', textAlign: 'center' }}>{idx + 1}</span>

                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => {
                      const updated = [...columns];
                      updated[idx].name = e.target.value;
                      setColumns(updated);
                    }}
                    className="cs-modal-input"
                    style={{ flex: 2, padding: '4px 8px', fontSize: 12 }}
                  />

                  <select
                    value={col.type}
                    onChange={(e) => {
                      const updated = [...columns];
                      updated[idx].type = e.target.value;
                      setColumns(updated);
                    }}
                    className="cs-modal-select"
                    style={{ flex: 2, padding: '4px 8px', fontSize: 12 }}
                  >
                    {COMMON_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleTogglePK(idx)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: col.isPK ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                      background: col.isPK ? 'rgba(251,191,36,0.2)' : 'transparent',
                      color: col.isPK ? '#fbbf24' : '#64748b',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    title="Toggle Primary Key"
                  >
                    🔑 PK
                  </button>

                  <button
                    onClick={() => handleToggleFK(idx)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: col.isFK ? '#a78bfa' : 'rgba(255,255,255,0.15)',
                      background: col.isFK ? 'rgba(167,139,250,0.2)' : 'transparent',
                      color: col.isFK ? '#a78bfa' : '#64748b',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    title="Toggle Foreign Key"
                  >
                    🔗 FK
                  </button>

                  <button
                    onClick={() => handleRemoveColumn(idx)}
                    disabled={columns.length <= 1}
                    style={{
                      padding: '3px 6px',
                      borderRadius: 4,
                      border: 'none',
                      background: 'rgba(239,68,68,0.15)',
                      color: '#ef4444',
                      fontSize: 11,
                      cursor: columns.length > 1 ? 'pointer' : 'not-allowed',
                      opacity: columns.length > 1 ? 1 : 0.4,
                    }}
                    title="Delete Column"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add Column Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                background: 'rgba(15,23,42,0.7)',
                borderTop: '1px solid rgba(56,189,248,0.15)',
              }}
            >
              <input
                type="text"
                placeholder="New column name..."
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                className="cs-modal-input"
                style={{ flex: 2, padding: '5px 8px', fontSize: 12 }}
              />

              <select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value)}
                className="cs-modal-select"
                style={{ flex: 2, padding: '5px 8px', fontSize: 12 }}
              >
                {COMMON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#fbbf24', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newColIsPK}
                  onChange={(e) => setNewColIsPK(e.target.checked)}
                />
                PK
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#a78bfa', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newColIsFK}
                  onChange={(e) => setNewColIsFK(e.target.checked)}
                />
                FK
              </label>

              <button
                onClick={handleAddColumn}
                className="cs-action-btn-sm cs-action-btn-primary"
                style={{ padding: '5px 12px' }}
              >
                + Add Column
              </button>
            </div>
          </div>

          {/* SQL Preview Box */}
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>
              GENERATED DDL (SQL)
            </div>
            <pre
              style={{
                background: '#090d16',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '10px 14px',
                color: '#38bdf8',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {sqlPreview}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            💡 Double-click table on whiteboard anytime to edit schema
          </span>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="submodal-btn submodal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="submodal-btn submodal-btn-primary" onClick={handleSave}>
              {existingShape ? 'Update Table on Board' : 'Insert Table onto Board'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


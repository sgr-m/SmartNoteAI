/**
 * Chemical Equation Balancer Modal (Section 16.3)
 * Stoichiometric balancer with equation parser, verified matrix search, and KaTeX rendering
 */

import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { balanceChemicalEquation, BalancedEquationResult } from '../../services/subjectModules/chemistryModule';
import { createFormula, executeAddObject } from '../../services/subjectModules/commonHelpers';
import './SubjectModals.css';

interface EquationBalancerModalProps {
  onClose: () => void;
  onInsertSuccess?: () => void;
}

const PRESET_REACTIONS = [
  { label: 'Water Synthesis', eq: 'H2 + O2 -> H2O' },
  { label: 'Methane Combustion', eq: 'CH4 + O2 -> CO2 + H2O' },
  { label: 'Rust Formation', eq: 'Fe + O2 -> Fe2O3' },
  { label: 'Aluminum + HCl', eq: 'Al + HCl -> AlCl3 + H2' },
  { label: 'Ammonia Synthesis', eq: 'N2 + H2 -> NH3' },
  { label: 'Sodium in Water', eq: 'Na + H2O -> NaOH + H2' },
];

export function EquationBalancerModal({ onClose, onInsertSuccess }: EquationBalancerModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const [equationInput, setEquationInput] = useState('CH4 + O2 -> CO2 + H2O');
  const [result, setResult] = useState<BalancedEquationResult>(() =>
    balanceChemicalEquation('CH4 + O2 -> CO2 + H2O')
  );

  const currentPageIndex = docState.currentPageIndex;

  const handleInputChange = (val: string) => {
    setEquationInput(val);
    setResult(balanceChemicalEquation(val));
  };

  const selectPreset = (eq: string) => {
    setEquationInput(eq);
    setResult(balanceChemicalEquation(eq));
  };

  const insertBalancedEquation = () => {
    const formulaObj = createFormula(result.latex, 260, 220, 32);
    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      formulaObj,
      `Insert Balanced Reaction: ${result.balancedString}`
    );
    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div className="subject-submodal-card equation-balancer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="submodal-header">
          <div className="submodal-title">
            <span>⚖️</span>
            <div>
              <h3>Chemical Equation Balancer</h3>
              <p>Automatically balances reaction stoichiometry and formats chemical equation notation</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>✕</button>
        </div>

        {/* Input */}
        <div className="eq-input-section">
          <label style={{ fontSize: 13, color: '#94a3b8' }}>Unbalanced Reaction:</label>
          <input
            type="text"
            className="eq-text-input"
            value={equationInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="e.g. Fe + O2 -> Fe2O3"
          />

          {/* Quick presets */}
          <div className="eq-presets-row">
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Common Reactions:</span>
            {PRESET_REACTIONS.map((p) => (
              <button
                key={p.eq}
                className={`preset-pill ${equationInput === p.eq ? 'active' : ''}`}
                onClick={() => selectPreset(p.eq)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Result Card */}
        <div className="eq-result-card">
          <div className="eq-result-label">Balanced Reaction Result:</div>
          <div className="eq-balanced-string">{result.balancedString}</div>

          <div className="eq-stoichiometry-breakdown">
            <div className="side-breakdown">
              <b>Reactants:</b>
              {result.reactants.map((r, i) => (
                <span key={i} className="coef-tag">
                  {r.coefficient} × {r.formula}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 20, color: '#38bdf8' }}>⟶</span>
            <div className="side-breakdown">
              <b>Products:</b>
              {result.products.map((p, i) => (
                <span key={i} className="coef-tag">
                  {p.coefficient} × {p.formula}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={insertBalancedEquation}>
            🧪 Insert Balanced Reaction onto Canvas
          </button>
        </div>
      </div>
    </div>
  );
}

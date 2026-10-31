/**
 * Sorting & Searching Demonstration Modal (CS Teaching Platform)
 * Fully interactive step-by-step simulator for Bubble Sort, Selection Sort, Insertion Sort,
 * Binary Search, and Linear Search with array bar visualizations, active comparison pointers,
 * status explanations, and whiteboard insertion.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import './SubjectModals.css';

export type AlgorithmType =
  | 'bubbleSort'
  | 'selectionSort'
  | 'insertionSort'
  | 'binarySearch'
  | 'linearSearch';

export interface SimStep {
  step: number;
  array: number[];
  activeIndices: number[];
  sortedIndices: number[];
  pointers?: { label: string; index: number }[];
  statusText: string;
}

interface SortingSearchingModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

// Generate simulation steps based on algorithm
export function generateSimulationSteps(algo: AlgorithmType, rawArr: number[], targetVal: number): SimStep[] {
  const steps: SimStep[] = [];
  const arr = [...rawArr];

  if (algo === 'bubbleSort') {
    steps.push({
      step: 0,
      array: [...arr],
      activeIndices: [],
      sortedIndices: [],
      statusText: 'Initial unsorted array. Bubble Sort compares adjacent elements.',
    });

    const n = arr.length;
    let stepNum = 1;
    const sorted: number[] = [];

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        // Compare step
        steps.push({
          step: stepNum++,
          array: [...arr],
          activeIndices: [j, j + 1],
          sortedIndices: [...sorted],
          statusText: `Comparing arr[${j}]=${arr[j]} and arr[${j + 1}]=${arr[j + 1]} (${arr[j] > arr[j + 1] ? `${arr[j]} > ${arr[j + 1]} -> Swap!` : 'In order, no swap'})`,
        });

        if (arr[j] > arr[j + 1]) {
          const temp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = temp;
          swapped = true;

          steps.push({
            step: stepNum++,
            array: [...arr],
            activeIndices: [j, j + 1],
            sortedIndices: [...sorted],
            statusText: `Swapped arr[${j}] and arr[${j + 1}]. Array: [${arr.join(', ')}]`,
          });
        }
      }
      sorted.push(n - i - 1);
      if (!swapped) break;
    }

    // All sorted
    steps.push({
      step: stepNum,
      array: [...arr],
      activeIndices: [],
      sortedIndices: arr.map((_, idx) => idx),
      statusText: 'Sorting complete! Array is in ascending order.',
    });
  } else if (algo === 'selectionSort') {
    steps.push({
      step: 0,
      array: [...arr],
      activeIndices: [],
      sortedIndices: [],
      statusText: 'Selection Sort finds the minimum element in unsorted portion and swaps to front.',
    });

    const n = arr.length;
    let stepNum = 1;
    const sorted: number[] = [];

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      steps.push({
        step: stepNum++,
        array: [...arr],
        activeIndices: [i],
        sortedIndices: [...sorted],
        pointers: [{ label: 'min', index: minIdx }],
        statusText: `Pass ${i + 1}: Starting search for minimum from index ${i} (current min=${arr[minIdx]}).`,
      });

      for (let j = i + 1; j < n; j++) {
        const isNewMin = arr[j] < arr[minIdx];
        if (isNewMin) minIdx = j;
        steps.push({
          step: stepNum++,
          array: [...arr],
          activeIndices: [i, j],
          sortedIndices: [...sorted],
          pointers: [{ label: 'min', index: minIdx }],
          statusText: `Inspecting arr[${j}]=${arr[j]}. ${isNewMin ? `Found new minimum: ${arr[j]} at index ${j}!` : `Not smaller than min (${arr[minIdx]}).`}`,
        });
      }

      if (minIdx !== i) {
        const temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
        steps.push({
          step: stepNum++,
          array: [...arr],
          activeIndices: [i, minIdx],
          sortedIndices: [...sorted],
          statusText: `Swapping minimum element ${arr[i]} into sorted position index ${i}.`,
        });
      }
      sorted.push(i);
    }

    steps.push({
      step: stepNum,
      array: [...arr],
      activeIndices: [],
      sortedIndices: arr.map((_, idx) => idx),
      statusText: 'Selection Sort complete! Array fully sorted.',
    });
  } else if (algo === 'insertionSort') {
    steps.push({
      step: 0,
      array: [...arr],
      activeIndices: [],
      sortedIndices: [0],
      statusText: 'Insertion Sort builds a sorted prefix one element at a time.',
    });

    let stepNum = 1;
    for (let i = 1; i < arr.length; i++) {
      const key = arr[i];
      let j = i - 1;

      steps.push({
        step: stepNum++,
        array: [...arr],
        activeIndices: [i],
        sortedIndices: Array.from({ length: i }, (_, k) => k),
        statusText: `Picking element arr[${i}]=${key} to insert into sorted left subarray.`,
      });

      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        steps.push({
          step: stepNum++,
          array: [...arr],
          activeIndices: [j, j + 1],
          sortedIndices: Array.from({ length: i }, (_, k) => k),
          statusText: `arr[${j}]=${arr[j]} > key (${key}), shifting arr[${j}] right.`,
        });
        j--;
      }
      arr[j + 1] = key;

      steps.push({
        step: stepNum++,
        array: [...arr],
        activeIndices: [j + 1],
        sortedIndices: Array.from({ length: i + 1 }, (_, k) => k),
        statusText: `Inserted key ${key} at index ${j + 1}.`,
      });
    }

    steps.push({
      step: stepNum,
      array: [...arr],
      activeIndices: [],
      sortedIndices: arr.map((_, idx) => idx),
      statusText: 'Insertion Sort complete! All elements placed.',
    });
  } else if (algo === 'binarySearch') {
    // Binary search requires sorted array
    const sortedArr = [...arr].sort((a, b) => a - b);
    let low = 0;
    let high = sortedArr.length - 1;
    let stepNum = 0;
    let found = false;

    steps.push({
      step: stepNum++,
      array: [...sortedArr],
      activeIndices: [],
      sortedIndices: [],
      pointers: [
        { label: 'low', index: low },
        { label: 'high', index: high },
      ],
      statusText: `Binary Search for target ${targetVal} on sorted array. Range [0 .. ${high}].`,
    });

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midVal = sortedArr[mid];

      steps.push({
        step: stepNum++,
        array: [...sortedArr],
        activeIndices: [mid],
        sortedIndices: [],
        pointers: [
          { label: 'low', index: low },
          { label: 'mid', index: mid },
          { label: 'high', index: high },
        ],
        statusText: `Checking mid index ${mid} (val = ${midVal}). Target = ${targetVal}.`,
      });

      if (midVal === targetVal) {
        steps.push({
          step: stepNum++,
          array: [...sortedArr],
          activeIndices: [mid],
          sortedIndices: [mid],
          pointers: [{ label: 'TARGET', index: mid }],
          statusText: `Found target ${targetVal} at index ${mid}! Search successful.`,
        });
        found = true;
        break;
      } else if (midVal < targetVal) {
        low = mid + 1;
        steps.push({
          step: stepNum++,
          array: [...sortedArr],
          activeIndices: [],
          sortedIndices: [],
          pointers: [
            { label: 'low', index: Math.min(low, sortedArr.length - 1) },
            { label: 'high', index: high },
          ],
          statusText: `${midVal} < ${targetVal}: target is in right half. low updated to mid + 1 (${low}).`,
        });
      } else {
        high = mid - 1;
        steps.push({
          step: stepNum++,
          array: [...sortedArr],
          activeIndices: [],
          sortedIndices: [],
          pointers: [
            { label: 'low', index: low },
            { label: 'high', index: Math.max(0, high) },
          ],
          statusText: `${midVal} > ${targetVal}: target is in left half. high updated to mid - 1 (${high}).`,
        });
      }
    }

    if (!found) {
      steps.push({
        step: stepNum,
        array: [...sortedArr],
        activeIndices: [],
        sortedIndices: [],
        statusText: `Target ${targetVal} not found in array (low > high). Returns -1.`,
      });
    }
  } else if (algo === 'linearSearch') {
    let stepNum = 0;
    let found = false;

    steps.push({
      step: stepNum++,
      array: [...arr],
      activeIndices: [],
      sortedIndices: [],
      statusText: `Linear Search scanning sequentially for target ${targetVal}.`,
    });

    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === targetVal) {
        steps.push({
          step: stepNum++,
          array: [...arr],
          activeIndices: [i],
          sortedIndices: [i],
          pointers: [{ label: 'FOUND', index: i }],
          statusText: `Found target ${targetVal} at index ${i}! Linear Search ends.`,
        });
        found = true;
        break;
      } else {
        steps.push({
          step: stepNum++,
          array: [...arr],
          activeIndices: [i],
          sortedIndices: [],
          pointers: [{ label: 'i', index: i }],
          statusText: `arr[${i}]=${arr[i]} !== target ${targetVal}. Advancing to next element.`,
        });
      }
    }

    if (!found) {
      steps.push({
        step: stepNum,
        array: [...arr],
        activeIndices: [],
        sortedIndices: [],
        statusText: `Target ${targetVal} not found in array after inspecting all ${arr.length} elements.`,
      });
    }
  }

  return steps.length > 0
    ? steps
    : [
        {
          step: 0,
          array: [...arr],
          activeIndices: [],
          sortedIndices: [],
          statusText: 'No steps generated.',
        },
      ];
}

export function SortingSearchingModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: SortingSearchingModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();

  const [title, setTitle] = useState<string>(
    existingShape?.params?.title || existingShape?.label || 'Sorting / Searching Demonstration'
  );
  const [algo, setAlgo] = useState<AlgorithmType>(
    (existingShape?.params?.algorithm as AlgorithmType) || 'bubbleSort'
  );
  const [arrayStr, setArrayStr] = useState<string>(
    existingShape?.params?.array ? existingShape.params.array.join(', ') : '14, 33, 27, 10, 35, 19, 42, 44'
  );
  const [targetVal, setTargetVal] = useState<number>(existingShape?.params?.targetVal ?? 35);
  const [stepIndex, setStepIndex] = useState<number>(existingShape?.params?.stepIndex || 0);
  const [fontSize, setFontSize] = useState<number>(
    existingShape?.params?.fontSize || 14
  );

  const currentPageIndex = docState.currentPageIndex;

  // Parse raw array
  const rawArray = useMemo(() => {
    const parts = arrayStr
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    return parts.length > 0 ? parts : [10, 20, 30, 40];
  }, [arrayStr]);

  // Compute simulation steps
  const steps = useMemo(() => {
    return generateSimulationSteps(algo, rawArray, targetVal);
  }, [algo, rawArray, targetVal]);

  // Clamp stepIndex
  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [steps.length, stepIndex]);

  const currentStep = steps[stepIndex] || steps[0];

  // Presets / Generators
  const handleRandomize = () => {
    const randoms = Array.from({ length: 8 }, () => Math.floor(Math.random() * 85) + 10);
    setArrayStr(randoms.join(', '));
    setStepIndex(0);
  };

  const handleSorted = () => {
    const sorted = [12, 18, 23, 29, 35, 47, 56, 72, 88];
    setArrayStr(sorted.join(', '));
    setStepIndex(0);
  };

  const handleReverseSorted = () => {
    const rev = [80, 65, 50, 42, 33, 25, 15, 8];
    setArrayStr(rev.join(', '));
    setStepIndex(0);
  };

  // Step Navigation
  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleReset = () => {
    setStepIndex(0);
  };

  const handleFinish = () => {
    setStepIndex(steps.length - 1);
  };

  // Save / Insert
  const handleSave = () => {
    const width = Math.max(520, Math.min(840, currentStep.array.length * 55 + 140));
    const height = 340;

    const params = {
      diagramType: 'sortingArray',
      title,
      algorithm: algo,
      array: currentStep.array,
      activeIndices: currentStep.activeIndices,
      sortedIndices: currentStep.sortedIndices,
      pointers: currentStep.pointers,
      statusText: currentStep.statusText,
      stepIndex,
      targetVal,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: {
          ...existingShape.params,
          ...params,
        },
        label: `${title} (Step ${stepIndex + 1})`,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const shapeObj = createShape('csDiagram', 200, 160, width, height, {
      params,
      fillColor: 'rgba(15, 23, 42, 0.94)',
      strokeColor: '#38bdf8',
      label: `${title} (Step ${stepIndex + 1})`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      shapeObj,
      `Insert ${title}`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  const maxVal = Math.max(...currentStep.array, 50);

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card cs-sorting-modal"
        style={{ maxWidth: '880px', maxHeight: '92vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span>📶</span>
            <div>
              <h3>Sorting & Searching Demonstration</h3>
              <p>Step through execution states, pointer markers, and comparison swaps in real time</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Algorithm & Inputs Bar */}
        <div className="cs-modal-toolbar">
          <div className="cs-toolbar-field" style={{ flex: 1.5 }}>
            <label>Algorithm:</label>
            <select
              className="cs-modal-select"
              value={algo}
              onChange={(e) => {
                setAlgo(e.target.value as AlgorithmType);
                setStepIndex(0);
              }}
            >
              <option value="bubbleSort">Bubble Sort</option>
              <option value="selectionSort">Selection Sort</option>
              <option value="insertionSort">Insertion Sort</option>
              <option value="binarySearch">Binary Search (O(log n))</option>
              <option value="linearSearch">Linear Search (O(n))</option>
            </select>
          </div>

          {(algo === 'binarySearch' || algo === 'linearSearch') && (
            <div className="cs-toolbar-field" style={{ width: '110px' }}>
              <label>Search Target:</label>
              <input
                type="number"
                className="cs-modal-input"
                value={targetVal}
                onChange={(e) => {
                  setTargetVal(parseInt(e.target.value, 10) || 0);
                  setStepIndex(0);
                }}
              />
            </div>
          )}

          <div className="cs-toolbar-field" style={{ flex: 2 }}>
            <label>Array Elements (comma-separated):</label>
            <input
              type="text"
              className="cs-modal-input"
              value={arrayStr}
              onChange={(e) => {
                setArrayStr(e.target.value);
                setStepIndex(0);
              }}
            />
          </div>

          <div className="cs-toolbar-field" style={{ width: '90px' }}>
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

        {/* Quick Array Preset Buttons */}
        <div className="cs-sort-generators-bar">
          <button className="cs-action-btn-sm" onClick={handleRandomize}>
            🎲 Randomize Array
          </button>
          <button className="cs-action-btn-sm" onClick={handleSorted}>
            📈 Sorted Array
          </button>
          <button className="cs-action-btn-sm" onClick={handleReverseSorted}>
            📉 Reverse Sorted
          </button>
        </div>

        {/* Interactive Step-by-Step Visualization Screen */}
        <div className="cs-sort-vis-container">
          {/* Step Progress & Controls */}
          <div className="cs-sort-controls-bar">
            <div className="cs-step-counter">
              Step <strong>{stepIndex + 1}</strong> of <strong>{steps.length}</strong>
            </div>

            <div className="cs-sim-btn-group">
              <button
                className="cs-sim-btn"
                onClick={handleReset}
                disabled={stepIndex === 0}
                title="Go to initial state"
              >
                ⏮ Start
              </button>
              <button
                className="cs-sim-btn"
                onClick={handlePrevStep}
                disabled={stepIndex === 0}
                title="Previous comparison step"
              >
                ◀ Prev
              </button>
              <button
                className="cs-sim-btn cs-btn-highlight"
                onClick={handleNextStep}
                disabled={stepIndex >= steps.length - 1}
                title="Next comparison step"
              >
                Next ▶
              </button>
              <button
                className="cs-sim-btn"
                onClick={handleFinish}
                disabled={stepIndex >= steps.length - 1}
                title="Fast forward to sorted state"
              >
                ⏭ Finish
              </button>
            </div>
          </div>

          {/* Visual Array Bars Stage */}
          <div className="cs-bars-stage">
            {currentStep.array.map((val, idx) => {
              const isActive = currentStep.activeIndices.includes(idx);
              const isSorted = currentStep.sortedIndices.includes(idx);
              const pointer = currentStep.pointers?.find((p) => p.index === idx);
              const barHeightPct = Math.max(15, Math.min(100, (val / maxVal) * 100));

              return (
                <div key={idx} className="cs-bar-column">
                  {/* Pointer tag */}
                  <div className={`cs-bar-pointer-tag ${pointer ? 'has-pointer' : ''}`}>
                    {pointer?.label || ''}
                  </div>

                  {/* Value on top */}
                  <span className="cs-bar-val-text">{val}</span>

                  {/* Vertical bar */}
                  <div
                    className={`cs-bar-item ${
                      isActive ? 'bar-active' : isSorted ? 'bar-sorted' : 'bar-normal'
                    }`}
                    style={{ height: `${barHeightPct}%` }}
                  />

                  {/* Index under baseline */}
                  <span className="cs-bar-idx-text">[{idx}]</span>
                </div>
              );
            })}
          </div>

          {/* Status Explanation Banner */}
          <div className="cs-sort-status-banner">
            <span className="cs-status-icon">⚡</span>
            <span className="cs-status-message">{currentStep.statusText}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button className="subject-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="subject-btn-primary" onClick={handleSave}>
            {existingShape ? 'Update Array Demo' : 'Insert onto Whiteboard'}
          </button>
        </div>
      </div>
    </div>
  );
}


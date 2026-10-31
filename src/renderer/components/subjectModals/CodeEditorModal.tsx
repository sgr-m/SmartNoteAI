/**
 * Syntax-Highlighted Code Block Modal
 * Fully interactive code editor supporting custom filenames, language selection,
 * indentation preservation, VS Code copy-pasting, multi-color syntax highlighting,
 * and live SmartBoard insertion.
 */

import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { createShape, executeAddObject } from '../../services/subjectModules/commonHelpers';
import { ShapeObject } from '../../../shared/types';
import { tokenizeCodeLine, getTokenColor } from '../../services/subjectModules/csSyntaxHighlighter';
import './SubjectModals.css';

interface CodeEditorModalProps {
  existingShape?: ShapeObject | null;
  onClose: () => void;
  onUpdateShape?: (shape: ShapeObject) => void;
  onInsertSuccess?: () => void;
}

const PRESET_SNIPPETS: Record<string, { fileName: string; language: string; code: string }> = {
  binarySearchPy: {
    fileName: 'binary_search.py',
    language: 'python',
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    return -1`,
  },
  quickSortJs: {
    fileName: 'quick_sort.js',
    language: 'javascript',
    code: `function quickSort(arr) {
    if (arr.length <= 1) return arr;

    const pivot = arr[arr.length - 1];
    const left = [];
    const right = [];

    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) {
            left.push(arr[i]);
        } else {
            right.push(arr[i]);
        }
    }

    return [...quickSort(left), pivot, ...quickSort(right)];
}`,
  },
  bubbleSortCpp: {
    fileName: 'bubble_sort.cpp',
    language: 'cpp',
    code: `#include <vector>
#include <iostream>

void bubbleSort(std::vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
  },
  factorialJava: {
    fileName: 'Factorial.java',
    language: 'java',
    code: `public class Factorial {
    public static long compute(int n) {
        if (n <= 1) {
            return 1;
        }
        return n * compute(n - 1);
    }

    public static void main(String[] args) {
        System.out.println("5! = " + compute(5));
    }
}`,
  },
  sqlQuery: {
    fileName: 'students_report.sql',
    language: 'sql',
    code: `SELECT 
    s.student_id,
    s.first_name,
    c.course_name,
    AVG(g.grade) AS gpa
FROM students s
JOIN enrollments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
JOIN grades g ON e.enrollment_id = g.enrollment_id
WHERE e.status = 'ACTIVE'
GROUP BY s.student_id, s.first_name, c.course_name
HAVING AVG(g.grade) >= 3.5
ORDER BY gpa DESC;`,
  },
  blank: {
    fileName: 'script.py',
    language: 'python',
    code: `# Paste your VS Code code here with full formatting & indentation\n`,
  },
};

const LANGUAGES = [
  { id: 'python', name: 'Python (.py)', ext: 'py' },
  { id: 'javascript', name: 'JavaScript (.js)', ext: 'js' },
  { id: 'typescript', name: 'TypeScript (.ts)', ext: 'ts' },
  { id: 'java', name: 'Java (.java)', ext: 'java' },
  { id: 'cpp', name: 'C++ (.cpp)', ext: 'cpp' },
  { id: 'sql', name: 'SQL (.sql)', ext: 'sql' },
  { id: 'html', name: 'HTML (.html)', ext: 'html' },
  { id: 'css', name: 'CSS (.css)', ext: 'css' },
  { id: 'pseudocode', name: 'Pseudocode (.pseudo)', ext: 'txt' },
];

export function CodeEditorModal({
  existingShape,
  onClose,
  onUpdateShape,
  onInsertSuccess,
}: CodeEditorModalProps): React.ReactElement {
  const { docState, docDispatch, commandSystem } = useAppContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial values from existingShape or defaults
  const [fileName, setFileName] = useState<string>(
    existingShape?.params?.fileName ||
      (existingShape?.params?.language ? `${existingShape.params.language}.${existingShape.params.language === 'python' ? 'py' : 'js'}` : 'solution.py')
  );
  const [language, setLanguage] = useState<string>(existingShape?.params?.language || 'python');
  const [code, setCode] = useState<string>(
    existingShape?.params?.code || PRESET_SNIPPETS.binarySearchPy.code
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(existingShape?.params?.theme || 'dark');
  const [fontSize, setFontSize] = useState<number>(existingShape?.params?.fontSize || 14);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const currentPageIndex = docState.currentPageIndex;

  // Handle language change with smart extension updating
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const target = LANGUAGES.find((l) => l.id === newLang);
    if (target) {
      const baseName = fileName.includes('.') ? fileName.split('.')[0] : fileName;
      setFileName(`${baseName}.${target.ext}`);
    }
  };

  // Preset snippet selection
  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESET_SNIPPETS[presetKey];
    if (preset) {
      setFileName(preset.fileName);
      setLanguage(preset.language);
      setCode(preset.code);
    }
  };

  // Indentation support: Tab, Shift+Tab, and Auto-Indent on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const tabSpaces = '    '; // 4 spaces

      if (e.shiftKey) {
        // Outdent lines
        const before = code.substring(0, start);
        const lineStart = before.lastIndexOf('\n') + 1;
        const currentLine = code.substring(lineStart, end);
        if (currentLine.startsWith(tabSpaces)) {
          const newCode = code.substring(0, lineStart) + currentLine.slice(tabSpaces.length) + code.substring(end);
          setCode(newCode);
          setTimeout(() => {
            textarea.selectionStart = Math.max(lineStart, start - tabSpaces.length);
            textarea.selectionEnd = Math.max(lineStart, end - tabSpaces.length);
          }, 0);
        }
      } else {
        // Indent
        const newCode = code.substring(0, start) + tabSpaces + code.substring(end);
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
        }, 0);
      }
    } else if (e.key === 'Enter') {
      // Auto-indent: inherit previous line's leading indentation
      const start = textarea.selectionStart;
      const currentLine = code.substring(0, start).split('\n').pop() || '';
      const match = currentLine.match(/^(\s+)/);
      let indent = match ? match[1] : '';

      // Extra indent if line ends with ':' or '{'
      if (currentLine.trim().endsWith(':') || currentLine.trim().endsWith('{')) {
        indent += '    ';
      }

      if (indent.length > 0) {
        e.preventDefault();
        const newCode = code.substring(0, start) + '\n' + indent + code.substring(start);
        setCode(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  // Copy code to system clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  // Paste directly from system clipboard preserving raw indentation
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
      }
    } catch (err) {
      console.warn('Clipboard read error', err);
    }
  };

  // Clean / normalize indentation (e.g. tabs to 4 spaces)
  const handleFormatCode = () => {
    const formatted = code.replace(/\t/g, '    ');
    setCode(formatted);
  };

  // Save / Insert
  const handleSave = () => {
    const lines = code.split('\n');
    const dynamicHeight = Math.max(260, Math.min(650, 70 + lines.length * 22));
    const dynamicWidth = Math.max(480, Math.min(760, 200 + Math.max(...lines.map((l) => l.length)) * 9));

    const params = {
      diagramType: 'codeBlock',
      fileName,
      language,
      code,
      theme,
      fontSize,
    };

    if (existingShape && onUpdateShape) {
      const updated: ShapeObject = {
        ...existingShape,
        params: {
          ...existingShape.params,
          ...params,
        },
        label: `${fileName} (${language.toUpperCase()})`,
      };
      onUpdateShape(updated);
      onClose();
      return;
    }

    const codeObj = createShape('csDiagram', 200, 140, dynamicWidth, dynamicHeight, {
      params,
      fillColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
      strokeColor: '#38bdf8',
      label: `${fileName} (${language.toUpperCase()})`,
    });

    executeAddObject(
      {
        pageIndex: currentPageIndex,
        dispatch: docDispatch,
        commandSystem,
      },
      codeObj,
      `Insert Code Block (${fileName})`
    );

    if (onInsertSuccess) {
      onInsertSuccess();
    } else {
      onClose();
    }
  };

  const codeLines = code.split('\n');

  return (
    <div className="subject-submodal-overlay" onClick={onClose}>
      <div
        className="subject-submodal-card code-editor-submodal"
        style={{ maxWidth: '980px', width: '95%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="submodal-header">
          <div className="submodal-title">
            <span style={{ fontSize: '26px' }}>💻</span>
            <div>
              <h3>Interactive Syntax Code Block</h3>
              <p>Editable code block with indentation preservation, VS Code copy-paste, and syntax font coloring</p>
            </div>
          </div>
          <button className="submodal-close" onClick={onClose}>✕</button>
        </div>

        {/* Top Control Bar */}
        <div className="cs-code-toolbar">
          <div className="cs-code-toolbar-group">
            <label className="cs-label">File Name:</label>
            <div className="cs-file-input-wrapper">
              <span className="cs-file-icon">📄</span>
              <input
                type="text"
                className="cs-file-input"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. main.py, script.js"
              />
            </div>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Language:</label>
            <select
              className="cs-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Starter Template:</label>
            <select
              className="cs-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handlePresetSelect(e.target.value);
              }}
            >
              <option value="" disabled>Load Algorithm Snippet...</option>
              <option value="binarySearchPy">Binary Search (Python)</option>
              <option value="quickSortJs">Quick Sort (JavaScript)</option>
              <option value="bubbleSortCpp">Bubble Sort (C++))</option>
              <option value="factorialJava">Recursion Factorial (Java)</option>
              <option value="sqlQuery">Multi-Table Join (SQL)</option>
              <option value="blank">Custom / Blank File</option>
            </select>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Theme:</label>
            <div className="cs-theme-toggle">
              <button
                type="button"
                className={`cs-theme-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                🌙 Dark
              </button>
              <button
                type="button"
                className={`cs-theme-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                ☀️ Light
              </button>
            </div>
          </div>

          <div className="cs-code-toolbar-group">
            <label className="cs-label">Font Size:</label>
            <select
              className="cs-select"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            >
              <option value={12}>12px (Compact)</option>
              <option value={14}>14px (Standard)</option>
              <option value={16}>16px (Readable)</option>
              <option value={18}>18px (Large Board)</option>
              <option value={20}>20px (Presentation)</option>
            </select>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="cs-action-bar">
          <div className="cs-action-left">
            <button type="button" className="cs-chip-btn" onClick={handlePasteFromClipboard}>
              📥 Paste from Clipboard
            </button>
            <button type="button" className="cs-chip-btn" onClick={handleCopyCode}>
              {copiedNotification ? '✓ Copied!' : '📋 Copy Code'}
            </button>
            <button type="button" className="cs-chip-btn" onClick={handleFormatCode}>
              🧹 Convert Tabs to 4 Spaces
            </button>
          </div>
          <div className="cs-action-right">
            <span className="cs-line-counter">
              {codeLines.length} lines • {code.length} chars
            </span>
          </div>
        </div>

        {/* Split Editor & Live Highlighted Preview */}
        <div className="cs-editor-split">
          {/* Left: Input Textarea with Line Numbers */}
          <div className="cs-editor-pane">
            <div className="cs-pane-header">
              <span>✏️ Source Code Input (Paste directly from VS Code)</span>
              <span className="cs-pane-tip">Press Tab to indent • Auto-indent enabled</span>
            </div>
            <div className="cs-textarea-container">
              <div className="cs-line-numbers">
                {codeLines.map((_, idx) => (
                  <div key={idx} className="cs-line-num">
                    {idx + 1}
                  </div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="cs-code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="Paste or type code here..."
              />
            </div>
          </div>

          {/* Right: Live Visual Highlighting Preview */}
          <div className="cs-preview-pane">
            <div className="cs-pane-header">
              <span>👁️ Whiteboard Highlighting Preview</span>
              <span className="cs-badge-highlight">{language.toUpperCase()}</span>
            </div>

            <div
              className={`cs-board-card-preview ${theme}`}
              style={{
                fontSize: `${fontSize}px`,
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                borderColor: theme === 'dark' ? '#0284c7' : '#94a3b8',
              }}
            >
              {/* Window dots & filename bar */}
              <div className="cs-card-title-bar">
                <div className="cs-window-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="cs-card-filename" style={{ color: theme === 'dark' ? '#94a3b8' : '#475569' }}>
                  {fileName}
                </div>
              </div>

              {/* Formatted Code Lines */}
              <div className="cs-card-content">
                {codeLines.map((line, lIdx) => {
                  const tokens = tokenizeCodeLine(line, language);
                  return (
                    <div key={lIdx} className="cs-code-preview-row">
                      <span className="cs-row-num" style={{ color: theme === 'dark' ? '#475569' : '#94a3b8' }}>
                        {lIdx + 1}
                      </span>
                      <span className="cs-row-tokens">
                        {tokens.length === 0 ? (
                          <>&nbsp;</>
                        ) : (
                          tokens.map((token, tIdx) => (
                            <span
                              key={tIdx}
                              style={{
                                color: getTokenColor(token.type, theme),
                                whiteSpace: 'pre',
                                fontWeight: token.type === 'keyword' || token.type === 'declaration' ? '600' : 'normal',
                                fontStyle: token.type === 'comment' ? 'italic' : 'normal',
                              }}
                            >
                              {token.text}
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="submodal-footer">
          <button type="button" className="submodal-btn submodal-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="submodal-btn submodal-btn-primary" onClick={handleSave}>
            {existingShape ? 'Update Code Block' : 'Insert on Board'}
          </button>
        </div>
      </div>
    </div>
  );
}


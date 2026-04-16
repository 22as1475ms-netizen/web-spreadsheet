import { useEffect, useMemo, useRef, useState } from 'react';

import AppShellHeader from '../components/AppShellHeader';
import RecordTable from '../components/RecordTable';
import { exportWorkbookAsPdf, exportWorkbookAsXlsx } from '../utils/workbook';

const defaultRowColor = '#ffffff';
const rowLabelField = '__sheetLabel';
const columnTypeOptions = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime-local', label: 'Date & Time' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'url', label: 'URL' }
];

const rowAlignmentOptions = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

const colorSwatches = [
  '#ffffff',
  '#f8e6e1',
  '#fde9c9',
  '#f8f1be',
  '#d9f0df',
  '#d8ecfa',
  '#dfe4fb',
  '#eadcf9',
  '#1f3347',
  '#335d89',
  '#5e7ca3',
  '#91abc7'
];

const textColorSwatches = [
  '#173654',
  '#264564',
  '#335d89',
  '#4b6783',
  '#6e7f93',
  '#9c2b1d',
  '#a4631d',
  '#1d6a47',
  '#14537f',
  '#5c3d8b',
  '#ffffff',
  '#0f1720'
];

const fontFamilyOptions = [
  { value: '', label: 'Default UI' },
  { value: '"Trebuchet MS", "Segoe UI", sans-serif', label: 'Trebuchet' },
  { value: '"Aptos", "Segoe UI", sans-serif', label: 'Aptos' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: '"Courier New", monospace', label: 'Courier' }
];

function ToolIcon({ name }) {
  if (name === 'add') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'copy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'delete') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4h6l1 2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 8h12l-1 11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M10 11v6M14 11v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'show') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12c2.2-3.5 5.3-5.3 9-5.3s6.8 1.8 9 5.3c-2.2 3.5-5.3 5.3-9 5.3S5.2 15.5 3 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'hide') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 12c2.2-3.5 5.3-5.3 9-5.3s6.8 1.8 9 5.3c-2.2 3.5-5.3 5.3-9 5.3S5.2 15.5 3 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 4l16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'columns') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10 5v14M16 5v14" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'chevron-left') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.5 6 8.5 12l6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'chevron-right') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9.5 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'chevron-down') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'chevron-up') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 8.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4.7 13.2v-2.4l2-0.6c.2-.5.4-.9.8-1.4l-.4-2.1 1.7-1.7 2.1.4c.5-.3.9-.5 1.4-.6l.6-2h2.4l.6 2c.5.2.9.4 1.4.8l2.1-.4 1.7 1.7-.4 2.1c.3.5.5.9.6 1.4l2 .6v2.4l-2 .6c-.2.5-.4.9-.8 1.4l.4 2.1-1.7 1.7-2.1-.4c-.5.3-.9.5-1.4.6l-.6 2h-2.4l-.6-2c-.5-.2-.9-.4-1.4-.8l-2.1.4-1.7-1.7.4-2.1c-.3-.5-.5-.9-.6-1.4l-2-.6Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'back-home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M10 5 3 12l7 7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 12h8.5a6.5 6.5 0 1 1 0 13H8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'save') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h11l3 3v13H5z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M8 4v5h8V4M8 19h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'checks') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m4.5 12.5 3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m11.5 12.5 3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'sort') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 6v12M8 18l-3-3M8 18l3-3M16 6l3 3M16 6l-3 3M16 6v12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'heading') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6v12M19 6v12M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'subheading') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 8v8M12 8v8M5 12h7M15 8h4M15 12h4M15 16h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'grid') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 10h16M4 16h16M10 4v16M16 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return null;
}

function ColorSwatchGroup({ label, value, colors, disabled, onChange }) {
  return (
    <div className={`swatch-group ${disabled ? 'swatch-group--disabled' : ''}`}>
      <span className="swatch-group__label">{label}</span>
      <div className="swatch-grid" role="list" aria-label={label}>
        {colors.map((color) => {
          const isActive = value === color;

          return (
            <button
              key={color}
              className={`swatch-grid__item ${isActive ? 'swatch-grid__item--active' : ''}`}
              type="button"
              disabled={disabled}
              onClick={() => onChange(color)}
              aria-label={`${label} ${color}`}
              aria-pressed={isActive}
              style={{ '--swatch-color': color }}
            />
          );
        })}
      </div>
    </div>
  );
}

function getColumnHolder(index) {
  let value = index;
  let label = '';

  while (value >= 0) {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  }

  return label;
}

function getColumnIndexFromHolder(label) {
  let value = 0;

  for (const char of String(label || '').toUpperCase()) {
    if (char < 'A' || char > 'Z') {
      return -1;
    }

    value = value * 26 + (char.charCodeAt(0) - 64);
  }

  return value - 1;
}

function parseClipboardTable(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((row, index, rows) => !(index === rows.length - 1 && row === ''))
    .map((row) => row.split('\t'));
}

function buildRecord(values) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...values
  };
}

function createSheet(name) {
  return {
    id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    records: [],
    hiddenRows: [],
    frozenRows: [],
    hiddenColumns: [],
    columnTypes: {},
    columnStyles: {},
    columnWidths: {},
    rowHeights: {},
    cellStyles: {},
    merges: [],
    rowMeta: {}
  };
}

function cloneSheet(sheet, copyCount) {
  const idMap = new Map(
    sheet.records.map((record) => [
      record.id,
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    ])
  );

  const nextRecords = sheet.records.map((record) => ({
    ...record,
    id: idMap.get(record.id)
  }));
  const nextHiddenRows = sheet.hiddenRows
    .map((rowId) => idMap.get(rowId))
    .filter(Boolean);
  const nextRowMeta = Object.fromEntries(
    Object.entries(sheet.rowMeta).map(([rowId, meta]) => [idMap.get(rowId), { ...meta }])
  );

  return {
    id: `sheet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: `${sheet.name} Copy${copyCount > 0 ? ` ${copyCount + 1}` : ''}`,
    records: nextRecords,
    hiddenRows: nextHiddenRows,
    frozenRows: (sheet.frozenRows || []).map((rowId) => idMap.get(rowId)).filter(Boolean),
    hiddenColumns: [...sheet.hiddenColumns],
    columnTypes: { ...sheet.columnTypes },
    columnStyles: { ...(sheet.columnStyles || {}) },
    columnWidths: { ...(sheet.columnWidths || {}) },
    rowHeights: { ...(sheet.rowHeights || {}) },
    cellStyles: { ...(sheet.cellStyles || {}) },
    merges: Array.isArray(sheet.merges) ? sheet.merges.map((merge) => ({ ...merge })) : [],
    rowMeta: nextRowMeta
  };
}

function normalizeSheet(sheet, index) {
  const nextRowMeta =
    sheet.rowMeta && typeof sheet.rowMeta === 'object'
      ? Object.fromEntries(
          Object.entries(sheet.rowMeta).map(([rowId, meta]) => [
            rowId,
            {
              kind: meta?.kind || 'row',
              color: meta?.color || defaultRowColor,
              alignment: meta?.alignment || 'left'
            }
          ])
        )
      : {};

  return {
    id: sheet.id || `sheet-${Date.now()}-${index}`,
    name: sheet.name || `Sheet ${index + 1}`,
    records: Array.isArray(sheet.records) ? sheet.records : [],
    hiddenRows: Array.isArray(sheet.hiddenRows) ? sheet.hiddenRows : [],
    frozenRows: Array.isArray(sheet.frozenRows) ? sheet.frozenRows : [],
    hiddenColumns: Array.isArray(sheet.hiddenColumns) ? sheet.hiddenColumns : [],
    columnTypes: sheet.columnTypes && typeof sheet.columnTypes === 'object' ? sheet.columnTypes : {},
    columnStyles: sheet.columnStyles && typeof sheet.columnStyles === 'object' ? sheet.columnStyles : {},
    columnWidths: sheet.columnWidths && typeof sheet.columnWidths === 'object' ? sheet.columnWidths : {},
    rowHeights: sheet.rowHeights && typeof sheet.rowHeights === 'object' ? sheet.rowHeights : {},
    cellStyles: sheet.cellStyles && typeof sheet.cellStyles === 'object' ? sheet.cellStyles : {},
    merges: Array.isArray(sheet.merges) ? sheet.merges : [],
    rowMeta: nextRowMeta
  };
}

function getInitialSheets(file) {
  if (Array.isArray(file.sheets) && file.sheets.length > 0) {
    return file.sheets.map(normalizeSheet);
  }

  return [
    normalizeSheet(
      {
        name: 'Sheet 1',
        records: file.records || [],
        hiddenRows: file.hiddenRows || [],
        frozenRows: file.frozenRows || [],
        hiddenColumns: file.hiddenColumns || [],
        columnTypes: file.columnTypes || {},
        columnStyles: file.columnStyles || {},
        columnWidths: file.columnWidths || {},
        rowHeights: file.rowHeights || {},
        cellStyles: file.cellStyles || {},
        merges: file.merges || [],
        rowMeta: file.rowMeta || {}
      },
      0
    )
  ];
}

function createBlankRow(columns, kind) {
  if (kind !== 'row') {
    return buildRecord({
      [rowLabelField]: ''
    });
  }

  const values = {};

  for (const column of columns) {
    values[column] = '';
  }

  return buildRecord(values);
}

function moveItem(items, draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) {
    return items;
  }

  const draggedIndex = items.findIndex((item) => item.id === draggedId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return items;
  }

  const nextItems = [...items];
  const [draggedItem] = nextItems.splice(draggedIndex, 1);
  nextItems.splice(targetIndex, 0, draggedItem);
  return nextItems;
}

function compareRecordValues(leftValue, rightValue, type, direction) {
  const multiplier = direction === 'desc' ? -1 : 1;
  const left = leftValue ?? '';
  const right = rightValue ?? '';

  if (type === 'number') {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const safeLeft = Number.isFinite(leftNumber) ? leftNumber : Number.NEGATIVE_INFINITY;
    const safeRight = Number.isFinite(rightNumber) ? rightNumber : Number.NEGATIVE_INFINITY;
    return (safeLeft - safeRight) * multiplier;
  }

  if (type === 'date' || type === 'datetime-local') {
    const leftTime = new Date(left).getTime();
    const rightTime = new Date(right).getTime();
    const safeLeft = Number.isFinite(leftTime) ? leftTime : Number.NEGATIVE_INFINITY;
    const safeRight = Number.isFinite(rightTime) ? rightTime : Number.NEGATIVE_INFINITY;
    return (safeLeft - safeRight) * multiplier;
  }

  return (
    String(left).localeCompare(String(right), undefined, {
      numeric: true,
      sensitivity: 'base'
    }) * multiplier
  );
}

export default function Dashboard({ activeFile, onBackToFiles, onSaveFile, session, onLogout }) {
  const initialSheets = useMemo(() => getInitialSheets(activeFile), [activeFile]);
  const [sheets, setSheets] = useState(initialSheets);
  const [activeSheetId, setActiveSheetId] = useState(initialSheets[0]?.id || '');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeCell, setActiveCell] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [showHiddenRows, setShowHiddenRows] = useState(false);
  const [title, setTitle] = useState(activeFile.name || '');
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumn, setSearchColumn] = useState('all');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [pendingSortColumn, setPendingSortColumn] = useState('');
  const [pendingSortDirection, setPendingSortDirection] = useState('asc');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dragState, setDragState] = useState({ draggedId: null, overId: null });
  const [sheetTabDrag, setSheetTabDrag] = useState({ draggedId: null, overId: null });
  const [draftColumnType, setDraftColumnType] = useState('text');
  const [draftSheetName, setDraftSheetName] = useState(initialSheets[0]?.name || 'Sheet 1');
  const [draftWorkbookTitle, setDraftWorkbookTitle] = useState(activeFile.name || '');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [saveState, setSaveState] = useState('saved');
  const [openSidebarSections, setOpenSidebarSections] = useState({
    summary: true,
    names: false,
    sheets: false,
    visibility: true
  });
  const [isColumnsManagerOpen, setIsColumnsManagerOpen] = useState(false);
  const [isRowsManagerOpen, setIsRowsManagerOpen] = useState(false);
  const [activeToolbarView, setActiveToolbarView] = useState('main');
  const notificationTimersRef = useRef(new Map());
  const autosaveTimerRef = useRef(null);
  const saveFeedbackTimerRef = useRef(null);
  const draftRef = useRef({
    name: activeFile.name || '',
    sheets: initialSheets,
    activeSheetId: initialSheets[0]?.id || ''
  });

  useEffect(() => {
    const nextSheets = getInitialSheets(activeFile);
    setSheets(nextSheets);
    setActiveSheetId(nextSheets[0]?.id || '');
    setSelectedRecord(null);
    setActiveCell(null);
    setSelectedRange(null);
    setSelectedRowIds([]);
    setShowHiddenRows(false);
    setTitle(activeFile.name || '');
    setNotifications([]);
    setAutosaveEnabled(true);
    setSaveState('saved');
    setSearchQuery('');
    setSearchColumn('all');
    setSortColumn('');
    setSortDirection('asc');
    setPendingSortColumn('');
    setPendingSortDirection('asc');
    setIsSidebarCollapsed(false);
    setDragState({ draggedId: null, overId: null });
    setSheetTabDrag({ draggedId: null, overId: null });
    setDraftColumnType('text');
    setDraftSheetName(nextSheets[0]?.name || 'Sheet 1');
    setDraftWorkbookTitle(activeFile.name || '');
    setOpenSidebarSections({
      summary: true,
      names: false,
      sheets: false,
      visibility: true
    });
    setIsRowsManagerOpen(false);
    setIsColumnsManagerOpen(false);
    setActiveToolbarView('main');
    draftRef.current = {
      name: activeFile.name || '',
      sheets: nextSheets,
      activeSheetId: nextSheets[0]?.id || ''
    };
  }, [activeFile.id]);

  const activeSheet = useMemo(
    () => sheets.find((sheet) => sheet.id === activeSheetId) || sheets[0] || createSheet('Sheet 1'),
    [activeSheetId, sheets]
  );

  useEffect(() => {
    if (activeSheet) {
      setDraftSheetName(activeSheet.name);
    }
  }, [activeSheet]);

  useEffect(() => {
    setDraftWorkbookTitle(title || '');
  }, [title]);

  useEffect(() => () => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    if (saveFeedbackTimerRef.current) {
      window.clearTimeout(saveFeedbackTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (autosaveEnabled) {
      if (saveState === 'dirty') {
        scheduleAutosave();
      }

      return;
    }

    if (saveState === 'saving') {
      clearSaveTimers();
      setSaveState('dirty');
    }
  }, [autosaveEnabled]);

  useEffect(() => () => {
    notificationTimersRef.current.forEach((timers) => {
      timers.forEach((timer) => window.clearTimeout(timer));
    });
    notificationTimersRef.current.clear();
  }, []);

  const records = activeSheet.records || [];
  const hiddenRows = activeSheet.hiddenRows || [];
  const frozenRows = activeSheet.frozenRows || [];
  const hiddenColumns = activeSheet.hiddenColumns || [];
  const columnTypes = activeSheet.columnTypes || {};
  const columnStyles = activeSheet.columnStyles || {};
  const columnWidths = activeSheet.columnWidths || {};
  const rowHeights = activeSheet.rowHeights || {};
  const cellStyles = activeSheet.cellStyles || {};
  const merges = activeSheet.merges || [];
  const rowMeta = activeSheet.rowMeta || {};

  const allColumns = useMemo(
    () =>
      Array.from(
        new Set([
          ...records.flatMap((record) =>
            Object.keys(record).filter((key) => key !== 'id' && key !== rowLabelField)
          ),
          ...Object.keys(columnTypes)
        ])
      ),
    [columnTypes, records]
  );

  const visibleColumns = useMemo(
    () => allColumns.filter((column) => !hiddenColumns.includes(column)),
    [allColumns, hiddenColumns]
  );

  const visibleRecords = useMemo(
    () => records.filter((record) => showHiddenRows || !hiddenRows.includes(record.id)),
    [records, hiddenRows, showHiddenRows]
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return visibleRecords;
    }

    return visibleRecords.filter((record) => {
      const meta = rowMeta[record.id] || { kind: 'row' };

      if (meta.kind !== 'row') {
        return String(record[rowLabelField] ?? '')
          .toLowerCase()
          .includes(normalizedQuery);
      }

      const columnsToSearch =
        searchColumn === 'all'
          ? visibleColumns
          : visibleColumns.includes(searchColumn)
            ? [searchColumn]
            : [];

      return columnsToSearch.some((column) =>
        String(record[column] ?? '')
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
  }, [rowMeta, searchColumn, searchQuery, visibleColumns, visibleRecords]);

  const displayedRecords = useMemo(() => {
    if (!sortColumn) {
      return filteredRecords;
    }

    const nextRecords = [...filteredRecords];

    nextRecords.sort((leftRecord, rightRecord) => {
      const leftMeta = rowMeta[leftRecord.id] || { kind: 'row' };
      const rightMeta = rowMeta[rightRecord.id] || { kind: 'row' };

      if (leftMeta.kind !== 'row' && rightMeta.kind === 'row') {
        return -1;
      }

      if (leftMeta.kind === 'row' && rightMeta.kind !== 'row') {
        return 1;
      }

      return compareRecordValues(
        leftRecord[sortColumn],
        rightRecord[sortColumn],
        columnTypes[sortColumn] || 'text',
        sortDirection
      );
    });

    return nextRecords;
  }, [columnTypes, filteredRecords, rowMeta, sortColumn, sortDirection]);

  const alignmentTargetIds = selectedRowIds.length > 0
    ? selectedRowIds
    : selectedRecord
      ? [selectedRecord.id]
      : [];

  const currentAlignment = selectedRecord
    ? rowMeta[selectedRecord.id]?.alignment || 'left'
    : alignmentTargetIds.length === 1
      ? rowMeta[alignmentTargetIds[0]]?.alignment || 'left'
      : null;

  const selectedColumnIds = useMemo(() => {
    const normalizedRange = normalizeRange(selectedRange);

    if (normalizedRange) {
      return visibleColumns.slice(normalizedRange.columnStart, normalizedRange.columnEnd + 1);
    }

    if (activeCell?.column && activeCell.column !== rowLabelField) {
      return [activeCell.column];
    }

    return [];
  }, [activeCell, selectedRange, visibleColumns]);

  const currentColumnColor = selectedColumnIds.length > 0
    ? columnStyles[selectedColumnIds[0]]?.backgroundColor || '#ffffff'
    : '#ffffff';

  const activeCellRecord = activeCell
    ? records.find((record) => record.id === activeCell.recordId) || null
    : null;
  const activeCellValue = activeCellRecord && activeCell
    ? String(activeCellRecord[activeCell.column] ?? '')
    : '';
  const activeCellCharacterCount = activeCellValue.length;
  const activeCellLabel = useMemo(() => {
    const normalizedRange = normalizeRange(selectedRange);

    if (normalizedRange) {
      const startLabel = `${getColumnHolder(normalizedRange.columnStart)}${normalizedRange.rowStart + 1}`;
      const endLabel = `${getColumnHolder(normalizedRange.columnEnd)}${normalizedRange.rowEnd + 1}`;
      return startLabel === endLabel ? startLabel : `${startLabel}:${endLabel}`;
    }

    if (!activeCell) {
      return 'No active cell';
    }

    const rowIndex = displayedRecords.findIndex((record) => record.id === activeCell.recordId);
    const columnIndex =
      activeCell.column === rowLabelField ? 0 : visibleColumns.indexOf(activeCell.column);

    if (rowIndex === -1 || columnIndex === -1) {
      return 'No active cell';
    }

    return `${getColumnHolder(columnIndex)}${rowIndex + 1}`;
  }, [activeCell, displayedRecords, selectedRange, visibleColumns]);

  function getRecordIndex(recordId) {
    return records.findIndex((record) => record.id === recordId);
  }

  function clearNotificationTimers(id) {
    const timers = notificationTimersRef.current.get(id) || [];
    timers.forEach((timer) => window.clearTimeout(timer));
    notificationTimersRef.current.delete(id);
  }

  function removeNotification(id) {
    clearNotificationTimers(id);
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }

  function notify(message, tone = 'success') {
    if (!message) {
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((current) => [
      ...current,
      {
        id,
        message,
        tone,
        phase: 'entering'
      }
    ]);

    const showTimer = window.setTimeout(() => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, phase: 'visible' } : notification
        )
      );
    }, 20);

    const leaveTimer = window.setTimeout(() => {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, phase: 'leaving' } : notification
        )
      );
    }, 4680);

    const removeTimer = window.setTimeout(() => {
      removeNotification(id);
    }, 5000);

    notificationTimersRef.current.set(id, [showTimer, leaveTimer, removeTimer]);
  }

  function dismissNotification(id) {
    clearNotificationTimers(id);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, phase: 'leaving' } : notification
      )
    );

    const removeTimer = window.setTimeout(() => {
      removeNotification(id);
    }, 320);

    notificationTimersRef.current.set(id, [removeTimer]);
  }

  function getAllColumnIndex(column) {
    return allColumns.indexOf(column);
  }

  function getDisplayedRowIndex(recordId) {
    return displayedRecords.findIndex((record) => record.id === recordId);
  }

  function normalizeRange(range) {
    if (!range?.start || !range?.end) {
      return null;
    }

    const startRowIndex = getDisplayedRowIndex(range.start.recordId);
    const endRowIndex = getDisplayedRowIndex(range.end.recordId);
    const startColumnIndex = visibleColumns.indexOf(range.start.column);
    const endColumnIndex = visibleColumns.indexOf(range.end.column);

    if (
      startRowIndex < 0 ||
      endRowIndex < 0 ||
      startColumnIndex < 0 ||
      endColumnIndex < 0
    ) {
      return null;
    }

    return {
      rowStart: Math.min(startRowIndex, endRowIndex),
      rowEnd: Math.max(startRowIndex, endRowIndex),
      columnStart: Math.min(startColumnIndex, endColumnIndex),
      columnEnd: Math.max(startColumnIndex, endColumnIndex)
    };
  }

  function getRangeCells(range = selectedRange) {
    const normalizedRange = normalizeRange(range);

    if (!normalizedRange) {
      return activeCell ? [{ recordId: activeCell.recordId, column: activeCell.column }] : [];
    }

    const cells = [];

    for (let rowIndex = normalizedRange.rowStart; rowIndex <= normalizedRange.rowEnd; rowIndex += 1) {
      const record = displayedRecords[rowIndex];
      if (!record) {
        continue;
      }

      for (
        let columnIndex = normalizedRange.columnStart;
        columnIndex <= normalizedRange.columnEnd;
        columnIndex += 1
      ) {
        const column = visibleColumns[columnIndex];
        if (!column) {
          continue;
        }

        cells.push({
          recordId: record.id,
          column
        });
      }
    }

    return cells;
  }

  function resolveCellReference(columnHolder, rowNumber, visited = new Set()) {
    const rowIndex = Number(rowNumber) - 1;
    const columnIndex = getColumnIndexFromHolder(columnHolder);
    const targetRecord = records[rowIndex];
    const targetColumn = allColumns[columnIndex];

    if (!targetRecord || !targetColumn) {
      return 0;
    }

    return Number(resolveCellDisplayValue(targetRecord, targetColumn, false, visited)) || 0;
  }

  function resolveRangeValues(startHolder, startRowNumber, endHolder, endRowNumber, visited = new Set()) {
    const startRowIndex = Math.max(0, Number(startRowNumber) - 1);
    const endRowIndex = Math.max(0, Number(endRowNumber) - 1);
    const startColumnIndex = getColumnIndexFromHolder(startHolder);
    const endColumnIndex = getColumnIndexFromHolder(endHolder);

    if (startColumnIndex < 0 || endColumnIndex < 0) {
      return [];
    }

    const rowFrom = Math.min(startRowIndex, endRowIndex);
    const rowTo = Math.max(startRowIndex, endRowIndex);
    const columnFrom = Math.min(startColumnIndex, endColumnIndex);
    const columnTo = Math.max(startColumnIndex, endColumnIndex);
    const values = [];

    for (let rowIndex = rowFrom; rowIndex <= rowTo; rowIndex += 1) {
      for (let columnIndex = columnFrom; columnIndex <= columnTo; columnIndex += 1) {
        const targetRecord = records[rowIndex];
        const targetColumn = allColumns[columnIndex];
        if (!targetRecord || !targetColumn) {
          continue;
        }

        values.push(Number(resolveCellDisplayValue(targetRecord, targetColumn, false, visited)) || 0);
      }
    }

    return values;
  }

  function evaluateFormula(formula, visited = new Set()) {
    const expression = String(formula || '').slice(1);
    const withFunctions = expression.replace(
      /\b(SUM|AVERAGE|AVG|MIN|MAX|COUNT)\(([A-Z]+)(\d+):([A-Z]+)(\d+)\)/gi,
      (_, fnName, startHolder, startRow, endHolder, endRow) => {
        const values = resolveRangeValues(startHolder, startRow, endHolder, endRow, visited);
        const functionName = String(fnName).toUpperCase();

        if (functionName === 'SUM') {
          return String(values.reduce((sum, value) => sum + value, 0));
        }

        if (functionName === 'AVERAGE' || functionName === 'AVG') {
          return values.length > 0 ? String(values.reduce((sum, value) => sum + value, 0) / values.length) : '0';
        }

        if (functionName === 'MIN') {
          return values.length > 0 ? String(Math.min(...values)) : '0';
        }

        if (functionName === 'MAX') {
          return values.length > 0 ? String(Math.max(...values)) : '0';
        }

        if (functionName === 'COUNT') {
          return String(values.filter((value) => value !== 0).length);
        }

        return '0';
      }
    );
    const replaced = withFunctions.replace(/\b([A-Z]+)(\d+)\b/g, (_, columnHolder, rowNumber) =>
      String(resolveCellReference(columnHolder, rowNumber, visited))
    );

    if (!/^[0-9+\-*/().\s]+$/.test(replaced)) {
      return '#ERR';
    }

    try {
      const result = Function(`"use strict"; return (${replaced});`)();
      return Number.isFinite(result) ? String(result) : '#ERR';
    } catch {
      return '#ERR';
    }
  }

  function resolveCellDisplayValue(record, column, showRawForActive = true, visited = new Set()) {
    const rawValue = record?.[column] ?? '';

    if (
      showRawForActive &&
      activeCell &&
      activeCell.recordId === record?.id &&
      activeCell.column === column
    ) {
      return String(rawValue);
    }

    if (typeof rawValue === 'string' && rawValue.startsWith('=')) {
      const visitKey = `${record.id}:${column}`;
      if (visited.has(visitKey)) {
        return '#CYCLE';
      }

      const nextVisited = new Set(visited);
      nextVisited.add(visitKey);
      return evaluateFormula(rawValue, nextVisited);
    }

    return String(rawValue ?? '');
  }

  function getCellStyleKey(recordId, column) {
    return `${recordId}:${column}`;
  }

  function getActiveCellStyle() {
    if (!activeCell) {
      return {};
    }

    return cellStyles[getCellStyleKey(activeCell.recordId, activeCell.column)] || {};
  }

  function getCellStyle(recordId, column) {
    return cellStyles[getCellStyleKey(recordId, column)] || {};
  }

  function buildActiveColumnRangeFormula(functionName) {
    if (!activeCell || !activeCell.column || activeCell.column === rowLabelField) {
      notify('Select a data cell first before using a compute function.', 'error');
      return null;
    }

    const targetIds = selectedRowIds.length > 0 ? selectedRowIds : [activeCell.recordId];
    const rowIndexes = targetIds
      .map((recordId) => getRecordIndex(recordId))
      .filter((index) => index >= 0)
      .sort((left, right) => left - right);
    const columnIndex = getAllColumnIndex(activeCell.column);

    if (rowIndexes.length === 0 || columnIndex < 0) {
      notify('Select at least one row in the active column to compute.', 'error');
      return null;
    }

    const columnHolder = getColumnHolder(columnIndex);
    const startRow = rowIndexes[0] + 1;
    const endRow = rowIndexes[rowIndexes.length - 1] + 1;
    return `=${functionName}(${columnHolder}${startRow}:${columnHolder}${endRow})`;
  }

  function buildFileDraft(nextSheets, overrides = {}) {
    const normalizedTitle = (overrides.name ?? title).trim() || 'Untitled Spreadsheet';
    const nextActiveSheetId = overrides.activeSheetId ?? activeSheetId;
    const nextActiveSheet =
      nextSheets.find((sheet) => sheet.id === nextActiveSheetId) ||
      nextSheets[0] ||
      createSheet('Sheet 1');

    return {
      normalizedTitle,
      nextActiveSheetId: nextActiveSheet.id,
      nextFile: {
      ...activeFile,
      name: normalizedTitle,
      sheets: nextSheets,
      records: nextActiveSheet.records,
      hiddenRows: nextActiveSheet.hiddenRows,
      frozenRows: nextActiveSheet.frozenRows,
      hiddenColumns: nextActiveSheet.hiddenColumns,
      columnTypes: nextActiveSheet.columnTypes,
      columnStyles: nextActiveSheet.columnStyles,
      columnWidths: nextActiveSheet.columnWidths,
      rowHeights: nextActiveSheet.rowHeights,
      cellStyles: nextActiveSheet.cellStyles,
      merges: nextActiveSheet.merges,
      rowMeta: nextActiveSheet.rowMeta,
      updatedAt: new Date().toISOString()
      }
    };
  }

  function clearSaveTimers() {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (saveFeedbackTimerRef.current) {
      window.clearTimeout(saveFeedbackTimerRef.current);
      saveFeedbackTimerRef.current = null;
    }
  }

  async function persistDraft(mode = 'manual', successMessage = '') {
    clearSaveTimers();

    const { nextFile } = buildFileDraft(draftRef.current.sheets, {
      name: draftRef.current.name,
      activeSheetId: draftRef.current.activeSheetId
    });

    setSaveState('saving');
    try {
      await onSaveFile(nextFile);
      setSaveState('saved');

      if (mode === 'manual') {
        notify(successMessage || 'Workbook saved.');
      }
    } catch (error) {
      setSaveState('dirty');
      notify(error.message || 'Unable to save workbook.', 'error');
      return;
    }

    saveFeedbackTimerRef.current = window.setTimeout(() => {
      saveFeedbackTimerRef.current = null;
    }, 320);
  }

  function scheduleAutosave() {
    clearSaveTimers();
    setSaveState('saving');
    autosaveTimerRef.current = window.setTimeout(() => {
      persistDraft('auto');
    }, 700);
  }

  function syncFile(nextSheets, nextMessage, overrides = {}, options = {}) {
    const { normalizedTitle, nextActiveSheetId } = buildFileDraft(nextSheets, overrides);

    setTitle(normalizedTitle);
    setSheets(nextSheets);
    setActiveSheetId(nextActiveSheetId);
    draftRef.current = {
      name: normalizedTitle,
      sheets: nextSheets,
      activeSheetId: nextActiveSheetId
    };

    if (options.forceSave) {
      persistDraft('manual', options.successMessage || nextMessage);
    } else if (autosaveEnabled) {
      scheduleAutosave();
    } else {
      clearSaveTimers();
      setSaveState('dirty');
    }

    if (!options.forceSave) {
      notify(nextMessage);
    }
  }

  function updateActiveSheet(updater, nextMessage) {
    const nextSheets = sheets.map((sheet) => {
      if (sheet.id !== activeSheet.id) {
        return sheet;
      }

      return normalizeSheet(updater(sheet), 0);
    });

    syncFile(nextSheets, nextMessage);
  }

  function resetViewState() {
    setSelectedRecord(null);
    setActiveCell(null);
    setSelectedRange(null);
    setSelectedRowIds([]);
    setSearchQuery('');
    setSearchColumn('all');
    setSortColumn('');
    setSortDirection('asc');
    setDragState({ draggedId: null, overId: null });
    setDraftColumnType('text');
  }

  function handleSwitchSheet(sheetId) {
    setActiveSheetId(sheetId);
    resetViewState();
  }

  function handleAddSheet() {
    const nextSheet = createSheet(`Sheet ${sheets.length + 1}`);
    const nextSheets = [...sheets, nextSheet];

    resetViewState();
    setDraftSheetName(nextSheet.name);
    syncFile(nextSheets, 'New sheet added.', { activeSheetId: nextSheet.id });
  }

  function handleRenameSheet() {
    const nextName = draftSheetName.trim();

    if (!nextName) {
      notify('Enter a sheet name first.', 'error');
      return;
    }

    const nextSheets = sheets.map((sheet) =>
      sheet.id === activeSheet.id ? { ...sheet, name: nextName } : sheet
    );

    syncFile(nextSheets, 'Sheet renamed.');
  }

  function handleDuplicateSheet() {
    const copyCount = sheets.filter((sheet) => sheet.name.startsWith(`${activeSheet.name} Copy`)).length;
    const nextSheet = cloneSheet(activeSheet, copyCount);
    const activeIndex = sheets.findIndex((sheet) => sheet.id === activeSheet.id);
    const nextSheets = [...sheets];
    nextSheets.splice(activeIndex + 1, 0, nextSheet);

    resetViewState();
    setDraftSheetName(nextSheet.name);
    syncFile(nextSheets, 'Sheet duplicated.', { activeSheetId: nextSheet.id });
  }

  function handleDeleteSheet() {
    if (sheets.length === 1) {
      notify('Keep at least one sheet in the workbook.', 'error');
      return;
    }

    const activeIndex = sheets.findIndex((sheet) => sheet.id === activeSheet.id);
    const nextSheets = sheets.filter((sheet) => sheet.id !== activeSheet.id);
    const nextActiveSheet = nextSheets[Math.max(0, activeIndex - 1)] || nextSheets[0];

    resetViewState();
    setDraftSheetName(nextActiveSheet.name);
    syncFile(nextSheets, 'Sheet deleted.', { activeSheetId: nextActiveSheet.id });
  }

  function handleSheetTabDrag(draggedId, targetId, phase) {
    if (phase === 'start') {
      setSheetTabDrag({ draggedId, overId: null });
      return;
    }

    if (phase === 'over') {
      setSheetTabDrag((current) => ({ ...current, overId: targetId }));
      return;
    }

    if (phase === 'end') {
      setSheetTabDrag({ draggedId: null, overId: null });
      return;
    }

    const nextSheets = moveItem(sheets, draggedId, targetId);
    setSheetTabDrag({ draggedId: null, overId: null });

    if (nextSheets !== sheets) {
      syncFile(nextSheets, 'Sheet order updated.');
    }
  }

  function handleDelete(id) {
    updateActiveSheet((sheet) => {
      const nextRowMeta = { ...sheet.rowMeta };
      delete nextRowMeta[id];
      const deletedRowIndex = sheet.records.findIndex((record) => record.id === id);

      return {
        ...sheet,
        records: sheet.records.filter((record) => record.id !== id),
        hiddenRows: sheet.hiddenRows.filter((rowId) => rowId !== id),
        frozenRows: (sheet.frozenRows || []).filter((rowId) => rowId !== id),
        merges: (sheet.merges || []).filter((merge) => {
          const startRowIndex = sheet.records.findIndex((record) => record.id === merge.startRowId);
          const endRowIndex = sheet.records.findIndex((record) => record.id === merge.endRowId);

          if (startRowIndex < 0 || endRowIndex < 0 || deletedRowIndex < 0) {
            return false;
          }

          return deletedRowIndex < startRowIndex || deletedRowIndex > endRowIndex;
        }),
        rowMeta: nextRowMeta
      };
    }, 'Row removed.');

    setSelectedRowIds((current) => current.filter((rowId) => rowId !== id));

    if (selectedRecord?.id === id) {
      setSelectedRecord(null);
    }

    if (activeCell?.recordId === id) {
      setActiveCell(null);
    }

    if (selectedRange?.start?.recordId === id || selectedRange?.end?.recordId === id) {
      setSelectedRange(null);
    }
  }

  function setRowsHidden(ids, hidden) {
    if (ids.length === 0) {
      return;
    }

    updateActiveSheet((sheet) => ({
      ...sheet,
      hiddenRows: hidden
        ? Array.from(new Set([...sheet.hiddenRows, ...ids]))
        : sheet.hiddenRows.filter((rowId) => !ids.includes(rowId))
    }), hidden ? 'Selected rows hidden.' : 'Selected rows restored.');
  }

  function toggleRowHidden(recordId) {
    setRowsHidden([recordId], !hiddenRows.includes(recordId));
  }

  function handleToggleColumnHidden(column) {
    updateActiveSheet((sheet) => ({
      ...sheet,
      hiddenColumns: sheet.hiddenColumns.includes(column)
        ? sheet.hiddenColumns.filter((currentColumn) => currentColumn !== column)
        : [...sheet.hiddenColumns, column]
    }), hiddenColumns.includes(column) ? 'Column shown.' : 'Column hidden.');
  }

  function handleShowAllColumns() {
    updateActiveSheet((sheet) => ({
      ...sheet,
      hiddenColumns: []
    }), 'All columns shown.');
  }

  function applySort() {
    setSortColumn(pendingSortColumn);
    setSortDirection(pendingSortDirection);
  }

  function handleDeleteSelectedColumns() {
    const normalizedRange = normalizeRange(selectedRange);
    const targetColumns = normalizedRange
      ? visibleColumns.slice(normalizedRange.columnStart, normalizedRange.columnEnd + 1)
      : activeCell?.column && activeCell.column !== rowLabelField
        ? [activeCell.column]
        : [];

    if (targetColumns.length === 0) {
      notify('Select a column cell first before deleting columns.', 'error');
      return;
    }

    openConfirmDialog({
      tone: 'danger',
      title: targetColumns.length === 1 ? `Delete column ${targetColumns[0]}?` : `Delete ${targetColumns.length} columns?`,
      description: 'This removes the selected columns and all values inside them from the active sheet.',
      confirmLabel: targetColumns.length === 1 ? 'Delete Column' : 'Delete Columns',
      onConfirm: () => {
        updateActiveSheet((sheet) => {
          const targetSet = new Set(targetColumns);
          const nextRecords = sheet.records.map((record) => {
            const nextRecord = { ...record };
            targetColumns.forEach((column) => {
              delete nextRecord[column];
            });
            return nextRecord;
          });

          const nextColumnTypes = { ...(sheet.columnTypes || {}) };
          const nextColumnWidths = { ...(sheet.columnWidths || {}) };
          targetColumns.forEach((column) => {
            delete nextColumnTypes[column];
            delete nextColumnWidths[column];
          });

          const nextCellStyles = Object.fromEntries(
            Object.entries(sheet.cellStyles || {}).filter(([styleKey]) => {
              const [, column] = styleKey.split(':');
              return !targetSet.has(column);
            })
          );

          return {
            ...sheet,
            records: nextRecords,
            hiddenColumns: (sheet.hiddenColumns || []).filter((column) => !targetSet.has(column)),
            columnTypes: nextColumnTypes,
            columnWidths: nextColumnWidths,
            cellStyles: nextCellStyles,
            merges: (sheet.merges || []).filter((merge) => {
              const startIndex = allColumns.indexOf(merge.startColumn);
              const endIndex = allColumns.indexOf(merge.endColumn);
              const overlapsDeletedColumn = targetColumns.some((column) => {
                const columnIndex = allColumns.indexOf(column);
                return columnIndex >= startIndex && columnIndex <= endIndex;
              });

              return !overlapsDeletedColumn;
            })
          };
        }, targetColumns.length === 1 ? 'Column deleted.' : 'Columns deleted.');

        setActiveCell(null);
        setSelectedRange(null);
        closeConfirmDialog();
      }
    });
  }

  function handleAddColumn() {
    let nextColumn = '';
    let columnIndex = 0;

    while (!nextColumn) {
      const candidate = getColumnHolder(columnIndex);
      if (!allColumns.includes(candidate)) {
        nextColumn = candidate;
      }
      columnIndex += 1;
    }

    updateActiveSheet((sheet) => ({
      ...sheet,
      records: sheet.records.map((record) => {
        const meta = sheet.rowMeta[record.id] || { kind: 'row' };
        return meta.kind === 'row' ? { ...record, [nextColumn]: '' } : record;
      }),
      columnTypes: {
        ...sheet.columnTypes,
        [nextColumn]: draftColumnType
      }
    }), 'Column added.');

    setDraftColumnType('text');
  }

  function handleFreezeSelectedRows() {
    if (selectedRowIds.length === 0) {
      notify('Select one or more rows first to freeze them.', 'error');
      return;
    }

    updateActiveSheet((sheet) => ({
      ...sheet,
      frozenRows: Array.from(
        new Set(
          sheet.records
            .map((record) => record.id)
            .filter((rowId) => (sheet.frozenRows || []).includes(rowId) || selectedRowIds.includes(rowId))
        )
      )
    }), 'Selected rows frozen.');
  }

  function handleUnfreezeSelectedRows() {
    if (selectedRowIds.length === 0) {
      notify('Select one or more frozen rows first to unfreeze them.', 'error');
      return;
    }

    updateActiveSheet((sheet) => ({
      ...sheet,
      frozenRows: (sheet.frozenRows || []).filter((rowId) => !selectedRowIds.includes(rowId))
    }), 'Selected rows unfrozen.');
  }

  function handleCellChange(recordId, column, value) {
    updateActiveSheet((sheet) => ({
      ...sheet,
      records: sheet.records.map((record) =>
        record.id === recordId ? { ...record, [column]: value } : record
      )
    }), '');
  }

  function handleCellFocus(record, column) {
    setSelectedRecord(record);
    setActiveCell({ recordId: record.id, column });
    setSelectedRange({
      start: { recordId: record.id, column },
      end: { recordId: record.id, column }
    });
  }

  function handleCellRangeStart(recordId, column) {
    setSelectedRange({
      start: { recordId, column },
      end: { recordId, column }
    });
    setActiveCell({ recordId, column });

    const targetRecord = displayedRecords.find((record) => record.id === recordId);
    if (targetRecord) {
      setSelectedRecord(targetRecord);
    }
  }

  function handleCellRangeEnter(recordId, column) {
    setSelectedRange((current) =>
      current?.start
        ? {
            ...current,
            end: { recordId, column }
          }
        : current
    );
  }

  function handleCellRangeEnd() {
    setSelectedRange((current) => current);
  }

  function handleCellNavigate(recordId, column, direction, reverse = false) {
    const rowIndex = displayedRecords.findIndex((record) => record.id === recordId);
    const columnIndex = column === rowLabelField ? 0 : visibleColumns.indexOf(column);

    if (rowIndex === -1 || columnIndex === -1) {
      return;
    }

    let nextRowIndex = rowIndex;
    let nextColumnIndex = columnIndex;

    if (direction === 'left') {
      nextColumnIndex = Math.max(0, columnIndex - 1);
    }

    if (direction === 'right') {
      nextColumnIndex = Math.min(visibleColumns.length - 1, columnIndex + 1);
    }

    if (direction === 'up') {
      nextRowIndex = Math.max(0, rowIndex - 1);
    }

    if (direction === 'down') {
      nextRowIndex = Math.min(displayedRecords.length - 1, rowIndex + 1);
    }

    if (direction === 'enter') {
      nextRowIndex = Math.min(
        displayedRecords.length - 1,
        Math.max(0, rowIndex + (reverse ? -1 : 1))
      );
    }

    const nextRecord = displayedRecords[nextRowIndex];
    const nextColumn = visibleColumns[nextColumnIndex];

    if (nextRecord && nextColumn) {
      setSelectedRecord(nextRecord);
      setActiveCell({ recordId: nextRecord.id, column: nextColumn });
      setSelectedRange({
        start: { recordId: nextRecord.id, column: nextColumn },
        end: { recordId: nextRecord.id, column: nextColumn }
      });
    }
  }

  function handleCellPaste(recordId, column, text) {
    const startRowIndex = displayedRecords.findIndex((record) => record.id === recordId);
    const startColumnIndex = visibleColumns.indexOf(column);
    const rows = parseClipboardTable(text);

    if (startRowIndex === -1 || startColumnIndex === -1 || rows.length === 0) {
      return;
    }

    updateActiveSheet((sheet) => {
      const nextRecords = sheet.records.map((record) => ({ ...record }));

      rows.forEach((rowValues, rowOffset) => {
        const visibleRecord = displayedRecords[startRowIndex + rowOffset];
        if (!visibleRecord) {
          return;
        }

        const recordIndex = nextRecords.findIndex((record) => record.id === visibleRecord.id);
        if (recordIndex === -1) {
          return;
        }

        rowValues.forEach((cellValue, columnOffset) => {
          const targetColumn = visibleColumns[startColumnIndex + columnOffset];
          if (!targetColumn) {
            return;
          }

          nextRecords[recordIndex][targetColumn] = cellValue;
        });
      });

      return {
        ...sheet,
        records: nextRecords
      };
    }, '');
  }

  function handleColumnResize(column, width) {
    updateActiveSheet((sheet) => ({
      ...sheet,
      columnWidths: {
        ...sheet.columnWidths,
        [column]: Math.max(120, Math.round(width))
      }
    }), '');
  }

  function handleRowResize(recordId, height) {
    updateActiveSheet((sheet) => ({
      ...sheet,
      rowHeights: {
        ...sheet.rowHeights,
        [recordId]: Math.max(34, Math.round(height))
      }
    }), '');
  }

  function handleApplyCompute(functionName) {
    const formula = buildActiveColumnRangeFormula(functionName);
    if (!formula || !activeCell) {
      return;
    }

    handleCellChange(activeCell.recordId, activeCell.column, formula);
    notify(`${functionName} formula inserted into the active cell.`);
  }

  function handleApplyCellStyle(patch) {
    const targetCells = getRangeCells();

    if (targetCells.length === 0) {
      notify('Select a cell first before applying formatting.', 'error');
      return;
    }

    updateActiveSheet((sheet) => {
      const nextCellStyles = {
        ...(sheet.cellStyles || {})
      };

      targetCells.forEach(({ recordId, column }) => {
        const styleKey = getCellStyleKey(recordId, column);
        const currentStyle = nextCellStyles[styleKey] || {};
        const nextStyle = { ...currentStyle, ...patch };

        Object.keys(nextStyle).forEach((key) => {
          if (nextStyle[key] == null || nextStyle[key] === '' || nextStyle[key] === false) {
            delete nextStyle[key];
          }
        });

        if (Object.keys(nextStyle).length === 0) {
          delete nextCellStyles[styleKey];
        } else {
          nextCellStyles[styleKey] = nextStyle;
        }
      });

      return {
        ...sheet,
        cellStyles: nextCellStyles
      };
    }, '');
  }

  function handleSetColumnColor(color) {
    if (selectedColumnIds.length === 0) {
      notify('Select a cell in the target column first before applying column color.', 'error');
      return;
    }

    updateActiveSheet((sheet) => {
      const nextColumnStyles = {
        ...(sheet.columnStyles || {})
      };

      selectedColumnIds.forEach((column) => {
        const nextStyle = {
          ...(nextColumnStyles[column] || {}),
          backgroundColor: color
        };

        if (!nextStyle.backgroundColor || nextStyle.backgroundColor === '#ffffff') {
          delete nextStyle.backgroundColor;
        }

        if (Object.keys(nextStyle).length === 0) {
          delete nextColumnStyles[column];
        } else {
          nextColumnStyles[column] = nextStyle;
        }
      });

      return {
        ...sheet,
        columnStyles: nextColumnStyles
      };
    }, 'Column highlight updated.');
  }

  function handleMergeSelectedCells() {
    const normalizedRange = normalizeRange(selectedRange);

    if (!normalizedRange) {
      notify('Select two or more cells first to merge them.', 'error');
      return;
    }

    if (
      normalizedRange.columnStart === normalizedRange.columnEnd &&
      normalizedRange.rowStart === normalizedRange.rowEnd
    ) {
      notify('Select more than one cell before merging.', 'error');
      return;
    }

    const startRowRecord = displayedRecords[normalizedRange.rowStart];
    const endRowRecord = displayedRecords[normalizedRange.rowEnd];
    const startColumn = visibleColumns[normalizedRange.columnStart];
    const endColumn = visibleColumns[normalizedRange.columnEnd];

    if (!startRowRecord || !endRowRecord || !startColumn || !endColumn) {
      notify('That range could not be merged.', 'error');
      return;
    }

    updateActiveSheet((sheet) => {
      const startRowIndex = sheet.records.findIndex((record) => record.id === startRowRecord.id);
      const endRowIndex = sheet.records.findIndex((record) => record.id === endRowRecord.id);
      const startIndex = allColumns.indexOf(startColumn);
      const endIndex = allColumns.indexOf(endColumn);
      const nextMerges = (sheet.merges || []).filter((merge) => {
        const mergeStartRowIndex = sheet.records.findIndex((record) => record.id === merge.startRowId);
        const mergeEndRowIndex = sheet.records.findIndex((record) => record.id === merge.endRowId);
        const mergeStart = allColumns.indexOf(merge.startColumn);
        const mergeEnd = allColumns.indexOf(merge.endColumn);
        const rowOverlap = !(mergeEndRowIndex < startRowIndex || mergeStartRowIndex > endRowIndex);
        const columnOverlap = !(mergeEnd < startIndex || mergeStart > endIndex);

        return !(rowOverlap && columnOverlap);
      });

      nextMerges.push({
        startRowId: startRowRecord.id,
        endRowId: endRowRecord.id,
        startColumn,
        endColumn
      });

      return {
        ...sheet,
        merges: nextMerges
      };
    }, 'Cells merged.');
  }

  function handleUnmergeSelectedCells() {
    const normalizedRange = normalizeRange(selectedRange);
    const targetStartRowId = normalizedRange
      ? displayedRecords[normalizedRange.rowStart]?.id
      : activeCell?.recordId;
    const targetEndRowId = normalizedRange
      ? displayedRecords[normalizedRange.rowEnd]?.id
      : activeCell?.recordId;
    const targetStartColumn = normalizedRange
      ? visibleColumns[normalizedRange.columnStart]
      : activeCell?.column;
    const targetEndColumn = normalizedRange
      ? visibleColumns[normalizedRange.columnEnd]
      : activeCell?.column;

    if (!targetStartRowId || !targetEndRowId || !targetStartColumn || !targetEndColumn) {
      notify('Select a merged cell first.', 'error');
      return;
    }

    const startRowIndex = records.findIndex((record) => record.id === targetStartRowId);
    const endRowIndex = records.findIndex((record) => record.id === targetEndRowId);
    const startIndex = allColumns.indexOf(targetStartColumn);
    const endIndex = allColumns.indexOf(targetEndColumn);
    let removedCount = 0;

    updateActiveSheet((sheet) => ({
      ...sheet,
      merges: (sheet.merges || []).filter((merge) => {
        const mergeStartRowIndex = sheet.records.findIndex((record) => record.id === merge.startRowId);
        const mergeEndRowIndex = sheet.records.findIndex((record) => record.id === merge.endRowId);
        const mergeStart = allColumns.indexOf(merge.startColumn);
        const mergeEnd = allColumns.indexOf(merge.endColumn);
        const rowOverlap = mergeEndRowIndex >= startRowIndex && mergeStartRowIndex <= endRowIndex;
        const columnOverlap = mergeEnd >= startIndex && mergeStart <= endIndex;
        const overlaps = rowOverlap && columnOverlap;

        if (overlaps) {
          removedCount += 1;
        }

        return !overlaps;
      })
    }), removedCount > 0 ? 'Cells unmerged.' : 'No merged cells were found in that selection.');
  }

  function handleExport(format = 'xlsx') {
    const normalizedTitle = title.trim() || 'Untitled Spreadsheet';
    if (format === 'pdf') {
      exportWorkbookAsPdf({
        name: normalizedTitle,
        sheets
      });
      notify('Web print opened for PDF export.');
      return;
    }

    exportWorkbookAsXlsx({
      name: normalizedTitle,
      sheets
    });
    notify('Workbook exported.');
  }

  function handleTitleSave(nextTitle) {
    syncFile(sheets, 'Workbook title updated.', { name: nextTitle });
  }

  function handleWorkbookTitleCommit() {
    const nextTitle = draftWorkbookTitle.trim();

    if (!nextTitle) {
      setDraftWorkbookTitle(title || 'Untitled Spreadsheet');
      return;
    }

    if (nextTitle === title) {
      return;
    }

    handleTitleSave(nextTitle);
  }

  function openConfirmDialog(config) {
    setIsRowsManagerOpen(false);
    setIsColumnsManagerOpen(false);
    setConfirmDialog(config);
  }

  function closeConfirmDialog() {
    setConfirmDialog(null);
  }

  function toggleSidebarSection(section) {
    setOpenSidebarSections((current) => ({
      ...current,
      [section]: !current[section]
    }));
  }

  function handleToggleRowSelection(recordId) {
    const targetRecord = records.find((record) => record.id === recordId) || null;
    setSelectedRowIds((current) =>
      current.includes(recordId)
        ? current.filter((rowId) => rowId !== recordId)
        : [...current, recordId]
    );
    if (targetRecord) {
      setSelectedRecord(targetRecord);
    }
  }

  function handleSelectAllVisibleRows() {
    const visibleIds = visibleRecords.map((record) => record.id);
    const alreadySelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRowIds.includes(id));

    if (alreadySelected) {
      setSelectedRowIds((current) => current.filter((rowId) => !visibleIds.includes(rowId)));
      return;
    }

    setSelectedRowIds((current) => Array.from(new Set([...current, ...visibleIds])));
  }

  function handleCreateTypedRow(kind = 'row') {
    if (kind === 'row' && allColumns.length === 0) {
      notify('Add at least one column before inserting a data row.', 'error');
      return;
    }

    const blankRow = createBlankRow(allColumns, kind);
    if (kind !== 'row') {
      blankRow[rowLabelField] = kind === 'heading' ? 'New Heading' : 'New Subheading';
    }

    updateActiveSheet((sheet) => ({
      ...sheet,
      records: [...sheet.records, blankRow],
      rowMeta: {
        ...sheet.rowMeta,
        [blankRow.id]: {
          kind,
          color: defaultRowColor,
          alignment: 'left'
        }
      }
    }), kind === 'row' ? 'Row added.' : `${kind === 'heading' ? 'Heading' : 'Subheading'} added.`);

    setSelectedRecord(blankRow);
    setSelectedRowIds([blankRow.id]);
  }

  function handleSetRowAlignment(alignment) {
    if (alignmentTargetIds.length === 0) {
      notify('Select a row first to change its text alignment.', 'error');
      return;
    }

    updateActiveSheet((sheet) => ({
      ...sheet,
      rowMeta: {
        ...sheet.rowMeta,
        ...Object.fromEntries(
          alignmentTargetIds.map((rowId) => [
            rowId,
            {
              ...(sheet.rowMeta[rowId] || {
                kind: 'row',
                color: defaultRowColor,
                alignment: 'left'
              }),
              alignment
            }
          ])
        )
      }
    }), `Row alignment set to ${alignment}.`);
  }

  function handleSetRowColor(color) {
    if (alignmentTargetIds.length === 0) {
      notify('Select a row first to change its highlight color.', 'error');
      return;
    }

    updateActiveSheet((sheet) => ({
      ...sheet,
      rowMeta: {
        ...sheet.rowMeta,
        ...Object.fromEntries(
          alignmentTargetIds.map((rowId) => [
            rowId,
            {
              ...(sheet.rowMeta[rowId] || {
                kind: 'row',
                color: defaultRowColor,
                alignment: 'left'
              }),
              color
            }
          ])
        )
      }
    }), 'Row highlight updated.');
  }

  function handleDeleteColumn(column) {
    openConfirmDialog({
      tone: 'danger',
      title: `Delete column ${column}?`,
      description: 'This removes the column, its values, and any merge/style data attached to it.',
      confirmLabel: 'Delete Column',
      onConfirm: () => {
        updateActiveSheet((sheet) => {
          const nextRecords = sheet.records.map((record) => {
            const nextRecord = { ...record };
            delete nextRecord[column];
            return nextRecord;
          });

          const nextColumnTypes = { ...(sheet.columnTypes || {}) };
          const nextColumnStyles = { ...(sheet.columnStyles || {}) };
          const nextColumnWidths = { ...(sheet.columnWidths || {}) };
          delete nextColumnTypes[column];
          delete nextColumnStyles[column];
          delete nextColumnWidths[column];

          const nextCellStyles = Object.fromEntries(
            Object.entries(sheet.cellStyles || {}).filter(([styleKey]) => styleKey.split(':')[1] !== column)
          );

          return {
            ...sheet,
            records: nextRecords,
            hiddenColumns: (sheet.hiddenColumns || []).filter((currentColumn) => currentColumn !== column),
            columnTypes: nextColumnTypes,
            columnStyles: nextColumnStyles,
            columnWidths: nextColumnWidths,
            cellStyles: nextCellStyles,
            merges: (sheet.merges || []).filter(
              (merge) =>
                merge.startColumn !== column &&
                merge.endColumn !== column &&
                !(
                  allColumns.indexOf(column) >= allColumns.indexOf(merge.startColumn) &&
                  allColumns.indexOf(column) <= allColumns.indexOf(merge.endColumn)
                )
            )
          };
        }, `Column ${column} deleted.`);

        if (activeCell?.column === column) {
          setActiveCell(null);
        }

        closeConfirmDialog();
      }
    });
  }

  function handleMoveRow(draggedId, targetId, phase) {
    if (phase === 'start') {
      setDragState({ draggedId, overId: null });
      return;
    }

    if (phase === 'over') {
      setDragState((current) => ({ ...current, overId: targetId }));
      return;
    }

    if (phase === 'end') {
      setDragState({ draggedId: null, overId: null });
      return;
    }

    const nextRecords = moveItem(records, draggedId, targetId);
    setDragState({ draggedId: null, overId: null });

    updateActiveSheet((sheet) => ({
      ...sheet,
      records: nextRecords
    }), 'Rows reordered.');
  }

  const selectedRowsAreHidden =
    selectedRowIds.length > 0 && selectedRowIds.every((rowId) => hiddenRows.includes(rowId));
  const selectedRowsAreFrozen =
    selectedRowIds.length > 0 && selectedRowIds.every((rowId) => frozenRows.includes(rowId));
  const dragDisabled = Boolean(sortColumn || searchQuery.trim());
  const nextColumnHolder = getColumnHolder(allColumns.length);
  const activeCellStyle = getActiveCellStyle();
  const saveStatusLabel = autosaveEnabled
    ? saveState === 'saving'
      ? 'Auto-save...'
      : 'Saved'
    : saveState === 'saving'
      ? 'Saving...'
      : saveState === 'saved'
        ? 'Saved'
        : 'Unsaved';

  function clearExploreTools() {
    setSearchQuery('');
    setSearchColumn('all');
    setSortColumn('');
    setSortDirection('asc');
    setPendingSortColumn('');
    setPendingSortDirection('asc');
  }

  return (
    <div className="workspace">
      <AppShellHeader
        className="appbar"
        session={session}
        onBrandClick={onBackToFiles}
        contextLabel="Workspace"
        contextValue="Spreadsheet editor"
        contextMeta={`${sheets.length} sheet${sheets.length === 1 ? '' : 's'} ready`}
        actions={[
          {
            label: 'Log Out',
            variant: 'danger',
            onClick: () =>
              openConfirmDialog({
                tone: 'danger',
                title: 'Log out of this workspace?',
                description: 'You will return to the sign-in screen for this device.',
                confirmLabel: 'Log Out',
                onConfirm: () => {
                  closeConfirmDialog();
                  onLogout();
                }
              })
          }
        ]} />
      <div className="workspace-layout">
        <aside className={`sidebar ${isSidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
          <div className="sidebar-header">
            <h3>Workbook info</h3>
            <button
              className="sidebar-toggle"
              type="button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="tool-btn__icon">
                <ToolIcon name={isSidebarCollapsed ? 'chevron-right' : 'chevron-left'} />
              </span>
            </button>
          </div>
          <div className="sidebar-body">
            <div className="sidebar-section sidebar-section--info">
              <button className="sidebar-section__toggle" type="button" onClick={() => toggleSidebarSection('summary')}>
                <h4 className="sidebar-section__title">Summary</h4>
                <span className="sidebar-section__chevron">
                  <ToolIcon name={openSidebarSections.summary ? 'chevron-up' : 'chevron-down'} />
                </span>
              </button>
              {openSidebarSections.summary ? (
                <section className="panel panel--top panel--stats">
                  <div className="info-list info-list--top">
                    <div>
                      <span>Title</span>
                      <strong>{title || 'Untitled Spreadsheet'}</strong>
                    </div>
                    <div>
                      <span>Sheets</span>
                      <strong>{sheets.length}</strong>
                    </div>
                    <div>
                      <span>Current Sheet</span>
                      <strong>{activeSheet.name}</strong>
                    </div>
                    <div>
                      <span>Visible Rows</span>
                      <strong>{displayedRecords.length}</strong>
                    </div>
                    <div>
                      <span>Account</span>
                      <strong>{session.user.name}</strong>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>

            <div className="sidebar-section">
              <button className="sidebar-section__toggle" type="button" onClick={() => toggleSidebarSection('names')}>
                <h4 className="sidebar-section__title">Names</h4>
                <span className="sidebar-section__chevron">
                  <ToolIcon name={openSidebarSections.names ? 'chevron-up' : 'chevron-down'} />
                </span>
              </button>
              {openSidebarSections.names ? (
                <>
                  <label className="toolbar-field toolbar-field--wide">
                    <span>Spreadsheet Name</span>
                    <input
                      value={draftWorkbookTitle}
                      onChange={(event) => setDraftWorkbookTitle(event.target.value)}
                      onBlur={handleWorkbookTitleCommit}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleWorkbookTitleCommit();
                        }
                      }}
                      placeholder="Untitled Spreadsheet"
                    />
                  </label>
                  <label className="toolbar-field toolbar-field--wide">
                    <span>Active Sheet Name</span>
                    <input
                      value={draftSheetName}
                      onChange={(event) => setDraftSheetName(event.target.value)}
                      onBlur={handleRenameSheet}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleRenameSheet();
                        }
                      }}
                      placeholder="Sheet name"
                    />
                  </label>
                </>
              ) : null}
            </div>

            <div className="sidebar-section">
              <button className="sidebar-section__toggle" type="button" onClick={() => toggleSidebarSection('sheets')}>
                <h4 className="sidebar-section__title">Sheets</h4>
                <span className="sidebar-section__chevron">
                  <ToolIcon name={openSidebarSections.sheets ? 'chevron-up' : 'chevron-down'} />
                </span>
              </button>
              {openSidebarSections.sheets ? (
                <div className="sidebar-action-row sidebar-action-row--compact">
                  <button className="tool-btn tool-btn--icononly" type="button" onClick={handleAddSheet} aria-label="Add sheet" title="Add sheet">
                    <span className="tool-btn__icon"><ToolIcon name="add" /></span>
                  </button>
                  <button className="tool-btn tool-btn--icononly" type="button" onClick={handleDuplicateSheet} aria-label="Duplicate sheet" title="Duplicate sheet">
                    <span className="tool-btn__icon"><ToolIcon name="copy" /></span>
                  </button>
                  <button className="tool-btn tool-btn--icononly" type="button" disabled={sheets.length === 1} onClick={() => openConfirmDialog({
                    tone: 'danger',
                    title: `Delete sheet ${activeSheet.name}?`,
                    description: 'This removes the active sheet from the workbook.',
                    confirmLabel: 'Delete Sheet',
                    onConfirm: () => {
                      handleDeleteSheet();
                      closeConfirmDialog();
                    }
                  })} aria-label="Delete sheet" title="Delete sheet">
                    <span className="tool-btn__icon"><ToolIcon name="delete" /></span>
                  </button>
                </div>
              ) : null}
            </div>

            <div className="sidebar-section">
              <button className="sidebar-section__toggle" type="button" onClick={() => toggleSidebarSection('visibility')}>
                <h4 className="sidebar-section__title">Visibility</h4>
                <span className="sidebar-section__chevron">
                  <ToolIcon name={openSidebarSections.visibility ? 'chevron-up' : 'chevron-down'} />
                </span>
              </button>
              {openSidebarSections.visibility ? (
                <>
                  <div className="sidebar-pill-row">
                    <span className="sidebar-pill">Rows: {hiddenRows.length} hidden</span>
                    <span className="sidebar-pill">Columns: {hiddenColumns.length} hidden</span>
                  </div>
                  {(selectedRowIds.length > 0 || hiddenRows.length > 0) ? (
                    <div className="sidebar-action-row sidebar-action-row--compact">
                      <button className="tool-btn tool-btn--icononly" type="button" disabled={selectedRowIds.length === 0} onClick={() => setRowsHidden(selectedRowIds, true)} aria-label="Hide selected rows" title="Hide selected rows">
                        <span className="tool-btn__icon"><ToolIcon name="hide" /></span>
                      </button>
                      <button className="tool-btn tool-btn--icononly" type="button" disabled={selectedRowIds.length === 0 || !selectedRowsAreHidden} onClick={() => setRowsHidden(selectedRowIds, false)} aria-label="Show selected rows" title="Show selected rows">
                        <span className="tool-btn__icon"><ToolIcon name="show" /></span>
                      </button>
                      <label className="sidebar-toggle-row sidebar-toggle-row--compact">
                        <input
                          type="checkbox"
                          checked={showHiddenRows}
                          onChange={(event) => setShowHiddenRows(event.target.checked)}
                        />
                        <span>Reveal</span>
                      </label>
                    </div>
                  ) : null}
                  <div className="sidebar-action-row">
                    <button className="tool-btn" type="button" onClick={() => setIsRowsManagerOpen(true)}>
                      <span className="tool-btn__icon"><ToolIcon name="show" /></span>
                      <span>Manage Rows</span>
                    </button>
                    <button className="tool-btn" type="button" onClick={() => setIsColumnsManagerOpen(true)}>
                      <span className="tool-btn__icon"><ToolIcon name="columns" /></span>
                      <span>Manage Columns</span>
                    </button>
                    <button className="tool-btn" type="button" disabled={hiddenColumns.length === 0} onClick={handleShowAllColumns}>
                      <span className="tool-btn__icon"><ToolIcon name="show" /></span>
                      <span>Show All</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
            <div className="sidebar-section sidebar-section--legacy">
              <h4 className="sidebar-section__title">Explore</h4>
              <label className="toolbar-field toolbar-field--search">
                <span>Search</span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search visible data"
                  type="search" />
              </label>
              <label className="toolbar-field">
                <span>Search In</span>
                <select value={searchColumn} onChange={(event) => setSearchColumn(event.target.value)}>
                  <option value="all">All visible columns</option>
                  {visibleColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toolbar-field">
                <span>Sort By</span>
                <select value={pendingSortColumn} onChange={(event) => setPendingSortColumn(event.target.value)}>
                  <option value="">Manual order</option>
                  {visibleColumns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toolbar-field">
                <span>Direction</span>
                <select value={pendingSortDirection} onChange={(event) => setPendingSortDirection(event.target.value)}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
              <button
                className="tool-btn"
                type="button"
                onClick={applySort}
                disabled={pendingSortColumn === sortColumn && pendingSortDirection === sortDirection}
              >
                <span className="tool-btn__icon">↻</span>
                <span>Apply Sort</span>
              </button>
              <button
                className="tool-btn"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchColumn('all');
                  setSortColumn('');
                  setSortDirection('asc');
                  setPendingSortColumn('');
                  setPendingSortDirection('asc');
                } }
              >
                <span className="tool-btn__icon">C</span>
                <span>Clear</span>
              </button>
            </div>

            <div className="sidebar-section sidebar-section--legacy">
              <h4 className="sidebar-section__title">Workbook</h4>
              <button className="tool-btn" type="button" disabled={selectedRowIds.length === 0} onClick={() => setRowsHidden(selectedRowIds, true)}>
                <span className="tool-btn__icon">-</span>
                <span>Hide</span>
              </button>
              <button className="tool-btn" type="button" disabled={selectedRowIds.length === 0 || !selectedRowsAreHidden} onClick={() => setRowsHidden(selectedRowIds, false)}>
                <span className="tool-btn__icon">^</span>
                <span>Show</span>
              </button>
              <button className="tool-btn" type="button" disabled={selectedRowIds.length === 0} onClick={handleFreezeSelectedRows}>
                <span className="tool-btn__icon">F</span>
                <span>Freeze</span>
              </button>
              <button className="tool-btn" type="button" disabled={selectedRowIds.length === 0 || !selectedRowsAreFrozen} onClick={handleUnfreezeSelectedRows}>
                <span className="tool-btn__icon">U</span>
                <span>Unfreeze</span>
              </button>
              <button className="tool-btn" type="button" disabled={!selectedRecord} onClick={() => selectedRecord && handleDelete(selectedRecord.id)}>
                <span className="tool-btn__icon">x</span>
                <span>Delete Row</span>
              </button>
              <button className="tool-btn" type="button" onClick={() => syncFile(sheets, 'Workbook saved.')}>
                <span className="tool-btn__icon">*</span>
                <span>Save</span>
              </button>
            </div>

            <div className="sidebar-section sidebar-section--legacy">
              <h4 className="sidebar-section__title">Structure</h4>
              <button className="tool-btn" type="button" disabled={!activeCell && !selectedRange} onClick={handleDeleteSelectedColumns}>
                <span className="tool-btn__icon">C</span>
                <span>Delete Column</span>
              </button>
              <button className="tool-btn" type="button" onClick={handleMergeSelectedCells}>
                <span className="tool-btn__icon">[]</span>
                <span>Merge</span>
              </button>
              <button className="tool-btn" type="button" onClick={handleUnmergeSelectedCells}>
                <span className="tool-btn__icon">][</span>
                <span>Unmerge</span>
              </button>
            </div>

            <div className="sidebar-section sidebar-section--legacy">
              <h4 className="sidebar-section__title">Compute</h4>
              <button className="tool-btn" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('SUM')}>
                <span className="tool-btn__icon">S</span>
                <span>SUM</span>
              </button>
              <button className="tool-btn" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('AVERAGE')}>
                <span className="tool-btn__icon">A</span>
                <span>AVG</span>
              </button>
              <button className="tool-btn" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('MIN')}>
                <span className="tool-btn__icon">N</span>
                <span>MIN</span>
              </button>
              <button className="tool-btn" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('MAX')}>
                <span className="tool-btn__icon">M</span>
                <span>MAX</span>
              </button>
              <button className="tool-btn" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('COUNT')}>
                <span className="tool-btn__icon">#</span>
                <span>COUNT</span>
              </button>
            </div>

            <div className="sidebar-section sidebar-section--legacy">
              <h4 className="sidebar-section__title">Format</h4>
              <button
                className={`tool-btn tool-btn--compact ${getActiveCellStyle().fontWeight === '700' ? 'tool-btn--active' : ''}`}
                type="button"
                disabled={!activeCell}
                onClick={() => handleApplyCellStyle({
                  fontWeight: getActiveCellStyle().fontWeight === '700' ? '' : '700'
                })}
              >
                <span className="tool-btn__icon">B</span>
                <span>Bold</span>
              </button>
              <button
                className={`tool-btn tool-btn--compact ${getActiveCellStyle().fontStyle === 'italic' ? 'tool-btn--active' : ''}`}
                type="button"
                disabled={!activeCell}
                onClick={() => handleApplyCellStyle({
                  fontStyle: getActiveCellStyle().fontStyle === 'italic' ? '' : 'italic'
                })}
              >
                <span className="tool-btn__icon">I</span>
                <span>Italic</span>
              </button>
              <button
                className={`tool-btn tool-btn--compact ${getActiveCellStyle().textDecoration === 'underline' ? 'tool-btn--active' : ''}`}
                type="button"
                disabled={!activeCell}
                onClick={() => handleApplyCellStyle({
                  textDecoration: getActiveCellStyle().textDecoration === 'underline' ? '' : 'underline'
                })}
              >
                <span className="tool-btn__icon">U</span>
                <span>Underline</span>
              </button>
              <label className="toolbar-field toolbar-field--compact toolbar-field--inline">
                <span>Fill</span>
                <input
                  type="color"
                  value={getActiveCellStyle().backgroundColor || '#ffffff'}
                  disabled={!activeCell}
                  onInput={(event) => handleApplyCellStyle({ backgroundColor: event.target.value })} />
              </label>
              <label className="toolbar-field toolbar-field--compact toolbar-field--inline">
                <span>Text</span>
                <input
                  type="color"
                  value={getActiveCellStyle().color || '#264564'}
                  disabled={!activeCell}
                  onInput={(event) => handleApplyCellStyle({ color: event.target.value })} />
              </label>
              <label className="toolbar-field toolbar-field--compact toolbar-field--inline">
                <span>Size</span>
                <select
                  value={getActiveCellStyle().fontSize || '14px'}
                  disabled={!activeCell}
                  onChange={(event) => handleApplyCellStyle({ fontSize: event.target.value })}
                >
                  <option value="12px">12</option>
                  <option value="14px">14</option>
                  <option value="16px">16</option>
                  <option value="18px">18</option>
                  <option value="20px">20</option>
                </select>
              </label>
            </div>

          </div>
        </aside>

        <div className="dashboard-shell">
          <div className="workbook-masthead">
            <div className="workbook-masthead__main">
              <button className="workbook-masthead__back" type="button" onClick={onBackToFiles}>
                <span className="workbook-masthead__back-icon">
                  <ToolIcon name="back-home" />
                </span>
                <span>Back to Home</span>
              </button>
              <div className="workbook-masthead__eyebrow">Workbook Title</div>
              <input
                className="workbook-title-input"
                type="text"
                value={draftWorkbookTitle}
                onChange={(event) => setDraftWorkbookTitle(event.target.value)}
                onBlur={handleWorkbookTitleCommit}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleWorkbookTitleCommit();
                  }
                }}
                placeholder="Untitled Spreadsheet"
                aria-label="Workbook title"
              />
            </div>
            <div className="workbook-masthead__meta">
              <div className="workbook-savebar">
                <label className="workbook-savebar__toggle">
                  <input
                    type="checkbox"
                    checked={autosaveEnabled}
                    onChange={(event) => setAutosaveEnabled(event.target.checked)}
                  />
                  <span>Auto-save</span>
                </label>
                {!autosaveEnabled ? (
                  <button
                    className="workbook-savebar__button"
                    type="button"
                    disabled={saveState === 'saving' || saveState === 'saved'}
                    onClick={() => persistDraft('manual', 'Workbook saved.')}
                    aria-label="Save workbook"
                  >
                    <ToolIcon name="save" />
                  </button>
                ) : null}
                <div className={`workbook-savebar__status workbook-savebar__status--${saveState}`}>
                  <span className="workbook-savebar__status-icon">
                    {saveState === 'saving' ? (
                      <span className="loading-dot" aria-hidden="true" />
                    ) : saveState === 'saved' ? (
                      <span className="workbook-savebar__checks" aria-hidden="true">✔✔</span>
                    ) : (
                      <ToolIcon name="save" />
                    )}
                  </span>
                  <span>{saveStatusLabel}</span>
                </div>
                <div className="workbook-savebar__exports">
                  <button
                    className="workbook-savebar__button"
                    type="button"
                    onClick={() => handleExport('xlsx')}
                    aria-label="Export workbook as Excel"
                    title="Export workbook as Excel"
                  >
                    <span>Excel</span>
                  </button>
                  <button
                    className="workbook-savebar__button"
                    type="button"
                    onClick={() => handleExport('pdf')}
                    aria-label="Web print to PDF"
                    title="Web print to PDF"
                  >
                    <span>Web Print</span>
                  </button>
                </div>
              </div>
              <span>{activeSheet.name}</span>
              <span>{displayedRecords.length} visible row{displayedRecords.length === 1 ? '' : 's'}</span>
              <span>{visibleColumns.length} visible column{visibleColumns.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          <div className="commandbar commandbar--ribbon">
            <div className="ribbon-nav" aria-label="Toolbar navigation">
              <button
                className="ribbon-nav__button"
                type="button"
                disabled={activeToolbarView === 'main'}
                onClick={() => setActiveToolbarView('main')}
                aria-label="Return to main toolbar"
                title="Return to main toolbar"
              >
                <ToolIcon name="chevron-left" />
              </button>
              <div className="ribbon-nav__title">
                {activeToolbarView === 'main' ? 'Main toolbar' : 'More tools'}
              </div>
              <button
                className="ribbon-nav__button"
                type="button"
                disabled={activeToolbarView === 'more'}
                onClick={() => setActiveToolbarView('more')}
                aria-label="Open more tools"
                title="Open more tools"
              >
                <ToolIcon name="chevron-right" />
              </button>
            </div>

            {activeToolbarView === 'main' ? (
            <>
            <div className="ribbon-panels">
            <section className="ribbon-section ribbon-section--font">
              <div className="ribbon-section__body">
                <div className="ribbon-stack">
                  <label className="toolbar-field toolbar-field--compact">
                    <span>Font</span>
                    <select
                      value={activeCellStyle.fontFamily || ''}
                      disabled={!activeCell}
                      onChange={(event) => handleApplyCellStyle({ fontFamily: event.target.value })}
                    >
                      {fontFamilyOptions.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="toolbar-field toolbar-field--compact toolbar-field--narrow">
                    <span>Size</span>
                    <select
                      value={activeCellStyle.fontSize || '14px'}
                      disabled={!activeCell}
                      onChange={(event) => handleApplyCellStyle({ fontSize: event.target.value })}
                    >
                      <option value="12px">12</option>
                      <option value="14px">14</option>
                      <option value="16px">16</option>
                      <option value="18px">18</option>
                      <option value="20px">20</option>
                    </select>
                  </label>
                </div>
                <div className="ribbon-stack ribbon-stack--tight">
                  <div className="ribbon-inline">
                    <button
                      className={`tool-btn tool-btn--toolbar ${activeCellStyle.fontWeight === '700' ? 'tool-btn--active' : ''}`}
                      type="button"
                      disabled={!activeCell}
                      aria-label="Bold"
                      title="Bold"
                      onClick={() => handleApplyCellStyle({
                        fontWeight: activeCellStyle.fontWeight === '700' ? '' : '700'
                      })}
                    >
                      <span className="tool-btn__icon">B</span>
                    </button>
                    <button
                      className={`tool-btn tool-btn--toolbar ${activeCellStyle.fontStyle === 'italic' ? 'tool-btn--active' : ''}`}
                      type="button"
                      disabled={!activeCell}
                      aria-label="Italic"
                      title="Italic"
                      onClick={() => handleApplyCellStyle({
                        fontStyle: activeCellStyle.fontStyle === 'italic' ? '' : 'italic'
                      })}
                    >
                      <span className="tool-btn__icon">I</span>
                    </button>
                    <button
                      className={`tool-btn tool-btn--toolbar ${activeCellStyle.textDecoration === 'underline' ? 'tool-btn--active' : ''}`}
                      type="button"
                      disabled={!activeCell}
                      aria-label="Underline"
                      title="Underline"
                      onClick={() => handleApplyCellStyle({
                        textDecoration: activeCellStyle.textDecoration === 'underline' ? '' : 'underline'
                      })}
                    >
                      <span className="tool-btn__icon">U</span>
                    </button>
                  </div>
                  <div className="ribbon-inline">
                    <ColorSwatchGroup
                      label="Fill"
                      value={activeCellStyle.backgroundColor || '#ffffff'}
                      colors={colorSwatches.slice(0, 6)}
                      disabled={!activeCell}
                      onChange={(color) => handleApplyCellStyle({ backgroundColor: color })}
                    />
                    <ColorSwatchGroup
                      label="Text"
                      value={activeCellStyle.color || '#264564'}
                      colors={textColorSwatches.slice(0, 6)}
                      disabled={!activeCell}
                      onChange={(color) => handleApplyCellStyle({ color })}
                    />
                  </div>
                </div>
              </div>
              <div className="ribbon-section__foot">Font</div>
            </section>

            <section className="ribbon-section ribbon-section--cells">
              <div className="ribbon-section__body">
                <button className="tool-btn tool-btn--toolbar" type="button" disabled={!activeCell && !selectedRange} onClick={handleDeleteSelectedColumns} title="Delete selected columns">
                  <span className="tool-btn__icon"><ToolIcon name="delete" /></span>
                  <span>Delete</span>
                </button>
                <button className="tool-btn tool-btn--toolbar" type="button" onClick={handleMergeSelectedCells} title="Merge selected cells">
                  <span className="tool-btn__icon">M</span>
                  <span>Merge</span>
                </button>
                <button className="tool-btn tool-btn--toolbar" type="button" onClick={handleUnmergeSelectedCells} title="Unmerge selected cells">
                  <span className="tool-btn__icon">U</span>
                  <span>Unmerge</span>
                </button>
                <button className="tool-btn tool-btn--toolbar" type="button" onClick={() => handleCreateTypedRow('heading')} title="Add heading row">
                  <span className="tool-btn__icon"><ToolIcon name="heading" /></span>
                  <span>Heading</span>
                </button>
                <button className="tool-btn tool-btn--toolbar" type="button" onClick={() => handleCreateTypedRow('subheading')} title="Add subheading row">
                  <span className="tool-btn__icon"><ToolIcon name="subheading" /></span>
                  <span>Subheading</span>
                </button>
              </div>
              <div className="ribbon-section__foot">Cells</div>
            </section>

            <section className="ribbon-section ribbon-section--explore ribbon-section--grow">
              <div className="ribbon-section__body">
                <div className="ribbon-inline ribbon-inline--grow">
                  <label className="toolbar-field toolbar-field--search">
                    <span>Search</span>
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search visible data"
                      type="search"
                    />
                  </label>
                </div>
                <div className="ribbon-inline">
                  <label className="toolbar-field">
                    <span>Search In</span>
                    <select value={searchColumn} onChange={(event) => setSearchColumn(event.target.value)}>
                      <option value="all">All visible columns</option>
                      {visibleColumns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="toolbar-field">
                    <span>Sort By</span>
                    <select value={pendingSortColumn} onChange={(event) => setPendingSortColumn(event.target.value)}>
                      <option value="">Manual order</option>
                      {visibleColumns.map((column) => (
                        <option key={column} value={column}>
                          {column}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="toolbar-field">
                    <span>Direction</span>
                    <select value={pendingSortDirection} onChange={(event) => setPendingSortDirection(event.target.value)}>
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </label>
                  <button
                    className="tool-btn tool-btn--toolbar"
                    type="button"
                    onClick={applySort}
                    disabled={pendingSortColumn === sortColumn && pendingSortDirection === sortDirection}
                  >
                    <span className="tool-btn__icon"><ToolIcon name="sort" /></span>
                    <span>Apply</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" onClick={clearExploreTools}>
                    <span className="tool-btn__icon">C</span>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
              <div className="ribbon-section__foot">Explore</div>
            </section>
            </div>

            </>
            ) : (
            <div className="toolbar-settings" id="toolbar-settings-panel">
              <div className="toolbar-settings__section">
                <span className="commandbar__label">Row Controls</span>
                <div className="toolbar-settings__actions">
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={selectedRowIds.length === 0} onClick={() => setRowsHidden(selectedRowIds, true)}>
                    <span className="tool-btn__icon"><ToolIcon name="hide" /></span>
                    <span>Hide</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={selectedRowIds.length === 0 || !selectedRowsAreHidden} onClick={() => setRowsHidden(selectedRowIds, false)}>
                    <span className="tool-btn__icon"><ToolIcon name="show" /></span>
                    <span>Show</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={selectedRowIds.length === 0} onClick={handleFreezeSelectedRows}>
                    <span className="tool-btn__icon">F</span>
                    <span>Freeze</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={selectedRowIds.length === 0 || !selectedRowsAreFrozen} onClick={handleUnfreezeSelectedRows}>
                    <span className="tool-btn__icon">U</span>
                    <span>Unfreeze</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={!selectedRecord} onClick={() => selectedRecord && handleDelete(selectedRecord.id)}>
                    <span className="tool-btn__icon"><ToolIcon name="delete" /></span>
                    <span>Delete Row</span>
                  </button>
                </div>
              </div>

              <div className="toolbar-settings__section">
                <span className="commandbar__label">Formatting</span>
                <div className="alignment-toolbar" role="toolbar" aria-label="Text alignment">
                  <span className="alignment-toolbar__label">Align</span>
                  {rowAlignmentOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`alignment-btn ${currentAlignment === option.value ? 'alignment-btn--active' : ''}`}
                      type="button"
                      disabled={alignmentTargetIds.length === 0}
                      onClick={() => handleSetRowAlignment(option.value)}
                      aria-pressed={currentAlignment === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <ColorSwatchGroup
                  label="Row Color"
                  value={currentAlignment && alignmentTargetIds.length > 0
                    ? rowMeta[alignmentTargetIds[0]]?.color || defaultRowColor
                    : defaultRowColor}
                  colors={colorSwatches}
                  disabled={alignmentTargetIds.length === 0}
                  onChange={handleSetRowColor}
                />
                <ColorSwatchGroup
                  label="Column Color"
                  value={currentColumnColor}
                  colors={colorSwatches}
                  disabled={selectedColumnIds.length === 0}
                  onChange={handleSetColumnColor}
                />
              </div>

              <div className="toolbar-settings__section">
                <span className="commandbar__label">Functions</span>
                <div className="toolbar-settings__actions">
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('SUM')}>
                    <span className="tool-btn__icon">S</span>
                    <span>SUM</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('AVERAGE')}>
                    <span className="tool-btn__icon">A</span>
                    <span>AVG</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('MIN')}>
                    <span className="tool-btn__icon">N</span>
                    <span>MIN</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('MAX')}>
                    <span className="tool-btn__icon">X</span>
                    <span>MAX</span>
                  </button>
                  <button className="tool-btn tool-btn--toolbar" type="button" disabled={!activeCell || activeCell.column === rowLabelField} onClick={() => handleApplyCompute('COUNT')}>
                    <span className="tool-btn__icon">#</span>
                    <span>COUNT</span>
                  </button>
                </div>
              </div>

            </div>
            )}
          </div>

          <div className="sheet-tabs">
            <div className="sheet-tabs__list">
              {sheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className={`sheet-tab ${sheet.id === activeSheet.id ? 'sheet-tab--active' : ''} ${sheetTabDrag.draggedId === sheet.id ? 'sheet-tab--dragging' : ''} ${sheetTabDrag.overId === sheet.id ? 'sheet-tab--target' : ''}`}
                  draggable
                  onDragStart={() => handleSheetTabDrag(sheet.id, sheet.id, 'start')}
                  onDragOver={(event) => {
                    event.preventDefault();
                    handleSheetTabDrag(sheet.id, sheet.id, 'over');
                  } }
                  onDrop={(event) => {
                    event.preventDefault();
                    handleSheetTabDrag(sheetTabDrag.draggedId, sheet.id, 'drop');
                  } }
                  onDragEnd={() => handleSheetTabDrag(sheet.id, sheet.id, 'end')}
                >
                  <button
                    className="sheet-tab__main"
                    type="button"
                    onClick={() => handleSwitchSheet(sheet.id)}
                  >
                    {sheet.name}
                  </button>
                  <button className="sheet-tab__drag" type="button" aria-label={`Drag ${sheet.name}`}>
                    ::
                  </button>
                </div>
              ))}
            </div>
            <button className="sheet-tab sheet-tab--add" type="button" onClick={handleAddSheet}>
              + New Sheet
            </button>
          </div>
          

          <div className="sheet-grid-builder">
            <div className="sheet-grid-builder__group">
              <button className="tool-btn" type="button" onClick={() => handleCreateTypedRow('row')}>
                <span className="tool-btn__icon">+</span>
                <span>Add Row</span>
              </button>
            </div>
            <div className="sheet-grid-builder__group">
              <div className="alignment-toolbar" role="toolbar" aria-label="Text alignment">
                <span className="alignment-toolbar__label">Text Align</span>
                {rowAlignmentOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`alignment-btn ${currentAlignment === option.value ? 'alignment-btn--active' : ''}`}
                    type="button"
                    disabled={alignmentTargetIds.length === 0}
                    onClick={() => handleSetRowAlignment(option.value)}
                    aria-pressed={currentAlignment === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="toolbar-field toolbar-field--compact toolbar-field--inline">
                <span>Row Color</span>
                <input
                  type="color"
                  value={currentAlignment && alignmentTargetIds.length > 0
                    ? rowMeta[alignmentTargetIds[0]]?.color || defaultRowColor
                    : defaultRowColor}
                  disabled={alignmentTargetIds.length === 0}
                  onInput={(event) => handleSetRowColor(event.target.value)} />
              </label>
              <label className="toolbar-field toolbar-field--compact toolbar-field--inline">
                <span>Column Color</span>
                <input
                  type="color"
                  value={currentColumnColor}
                  disabled={selectedColumnIds.length === 0}
                  onInput={(event) => handleSetColumnColor(event.target.value)} />
              </label>
            </div>
            <div className="sheet-grid-builder__group sheet-grid-builder__group--column">
              <div className="sheet-grid-builder__hint">
                Next column: <strong>{nextColumnHolder}</strong>
              </div>
              <select
                className="sheet-grid-builder__select"
                value={draftColumnType}
                onChange={(event) => setDraftColumnType(event.target.value)}
              >
                {columnTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button className="tool-btn" type="button" onClick={handleAddColumn}>
                <span className="tool-btn__icon">C</span>
                <span>Add Column</span>
              </button>
            </div>
          </div>

          <div className="formula-bar">
            <span className="formula-bar__label">fx</span>
            <span className="formula-bar__cell">{activeCellLabel}</span>
            <input
              className="formula-bar__input"
              type="text"
              value={activeCellValue}
              onChange={(event) => {
                if (!activeCell) {
                  return;
                }

                handleCellChange(activeCell.recordId, activeCell.column, event.target.value);
              } }
              placeholder="Select a cell to edit its value here"
              disabled={!activeCell} />
          </div>

          {dragDisabled ? (
            <div className="sheet-banner">
              Dragging is available in manual order mode. Clear search and sorting to move rows freely.
            </div>
          ) : null}

          <RecordTable
            activeCell={activeCell}
            columnTypes={columnTypes}
            columnStyles={columnStyles}
            columns={visibleColumns}
            columnWidths={columnWidths}
            dragDisabled={dragDisabled}
            dragState={dragState}
            getCellDisplayValue={resolveCellDisplayValue}
            getCellStyle={getCellStyle}
            frozenRowIds={frozenRows}
            hiddenRowIds={hiddenRows}
            loading={false}
            merges={merges}
            records={displayedRecords}
            rowHeights={rowHeights}
            rowMeta={rowMeta}
            selectedRange={selectedRange}
            selectedRecord={selectedRecord}
            selectedRowIds={selectedRowIds}
            onCellChange={handleCellChange}
            onCellFocus={handleCellFocus}
            onCellNavigate={handleCellNavigate}
            onCellPaste={handleCellPaste}
            onCellRangeEnd={handleCellRangeEnd}
            onCellRangeEnter={handleCellRangeEnter}
            onCellRangeStart={handleCellRangeStart}
            onAddColumn={handleAddColumn}
            onColumnResize={handleColumnResize}
            onCreateTypedRow={handleCreateTypedRow}
            onEdit={setSelectedRecord}
            onMoveRow={handleMoveRow}
            onRowResize={handleRowResize}
            onToggleColumnHidden={handleToggleColumnHidden}
            onToggleRowSelection={handleToggleRowSelection} />

          <footer className="statusbar">
            <span>Workbook: {title || 'Untitled Spreadsheet'}</span>
            <span>Sheet: {activeSheet.name}</span>
            <span>Cell: {activeCellLabel}</span>
            <span>Characters: {activeCellCharacterCount}</span>
            <span>{hiddenRows.length} hidden rows</span>
            <span>{hiddenColumns.length} hidden columns</span>
          </footer>
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="toast-stack" aria-live="polite" aria-atomic="false">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`toast toast--${notification.phase} ${notification.tone === 'error' ? 'toast--error' : 'toast--success'}`}
            >
              <span>{notification.message}</span>
              <button type="button" className="toast__dismiss" onClick={() => dismissNotification(notification.id)} aria-label="Dismiss notification">
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {confirmDialog ? (
        <div className="confirm-overlay" role="presentation" onClick={closeConfirmDialog}>
          <div
            className={`confirm-dialog ${confirmDialog.tone === 'danger' ? 'confirm-dialog--danger' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="confirm-dialog-title">{confirmDialog.title}</h3>
            <p>{confirmDialog.description}</p>
            <div className="confirm-dialog__actions">
              <button className="btn secondary" type="button" onClick={closeConfirmDialog}>
                Cancel
              </button>
              <button className="btn danger" type="button" onClick={confirmDialog.onConfirm}>
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isRowsManagerOpen ? (
        <div className="confirm-overlay" role="presentation" onClick={() => setIsRowsManagerOpen(false)}>
          <div
            className="confirm-dialog columns-manager"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rows-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="columns-manager__header">
              <h3 id="rows-manager-title">Manage Rows</h3>
              <button className="tool-btn tool-btn--icononly" type="button" onClick={() => setIsRowsManagerOpen(false)} aria-label="Close rows manager">
                <span className="tool-btn__icon">X</span>
              </button>
            </div>
            {records.length === 0 ? (
              <p className="empty">Add a row to manage visibility.</p>
            ) : (
              <div className="sidebar-column-list">
                {records.map((record, index) => {
                  const meta = rowMeta[record.id] || { kind: 'row' };
                  const isHidden = hiddenRows.includes(record.id);
                  const label = meta.kind === 'row'
                    ? `Row ${index + 1}`
                    : `${meta.kind === 'heading' ? 'Heading' : 'Subheading'} ${index + 1}`;

                  return (
                    <div className="sidebar-column-item" key={record.id}>
                      <div className="sidebar-column-item__meta">
                        <strong>{label}</strong>
                        <small>{isHidden ? 'Hidden' : 'Visible'}</small>
                      </div>
                      <div className="sidebar-column-item__actions">
                        <button
                          className="tool-btn tool-btn--toolbar"
                          type="button"
                          onClick={() => toggleRowHidden(record.id)}
                        >
                          <span className="tool-btn__icon"><ToolIcon name={isHidden ? 'show' : 'hide'} /></span>
                          <span>{isHidden ? 'Show' : 'Hide'}</span>
                        </button>
                        <button
                          className="tool-btn tool-btn--toolbar"
                          type="button"
                          onClick={() => handleDelete(record.id)}
                        >
                          <span className="tool-btn__icon"><ToolIcon name="delete" /></span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isColumnsManagerOpen ? (
        <div className="confirm-overlay" role="presentation" onClick={() => setIsColumnsManagerOpen(false)}>
          <div
            className="confirm-dialog columns-manager"
            role="dialog"
            aria-modal="true"
            aria-labelledby="columns-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="columns-manager__header">
              <h3 id="columns-manager-title">Manage Columns</h3>
              <button className="tool-btn tool-btn--icononly" type="button" onClick={() => setIsColumnsManagerOpen(false)} aria-label="Close columns manager">
                <span className="tool-btn__icon">X</span>
              </button>
            </div>
            {allColumns.length === 0 ? (
              <p className="empty">Add a column to manage visibility.</p>
            ) : (
              <div className="sidebar-column-list">
                {allColumns.map((column) => {
                  const isHidden = hiddenColumns.includes(column);

                  return (
                    <div className="sidebar-column-item" key={column}>
                      <div className="sidebar-column-item__meta">
                        <strong>{column}</strong>
                        <small>{isHidden ? 'Hidden' : 'Visible'}</small>
                      </div>
                      <div className="sidebar-column-item__actions">
                        <button
                          className="tool-btn tool-btn--toolbar"
                          type="button"
                          onClick={() => handleToggleColumnHidden(column)}
                        >
                          <span className="tool-btn__icon"><ToolIcon name={isHidden ? 'show' : 'hide'} /></span>
                          <span>{isHidden ? 'Show' : 'Hide'}</span>
                        </button>
                        <button
                          className="tool-btn tool-btn--toolbar"
                          type="button"
                          onClick={() => handleDeleteColumn(column)}
                        >
                          <span className="tool-btn__icon"><ToolIcon name="delete" /></span>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

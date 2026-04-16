const rowLabelField = '__sheetLabel';

function getInputType(column, columnTypes) {
  return columnTypes[column] || 'text';
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

function getRowMeta(rowMeta, recordId) {
  return rowMeta[recordId] || { kind: 'row', color: '#ffffff', alignment: 'left' };
}

function getSelectionBounds(selectedRange, records, columns) {
  if (!selectedRange?.start || !selectedRange?.end) {
    return null;
  }

  const startRowIndex = records.findIndex((record) => record.id === selectedRange.start.recordId);
  const endRowIndex = records.findIndex((record) => record.id === selectedRange.end.recordId);
  const startColumnIndex = columns.indexOf(selectedRange.start.column);
  const endColumnIndex = columns.indexOf(selectedRange.end.column);

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

function isCellSelected(selectionBounds, rowIndex, columnIndex) {
  if (!selectionBounds) {
    return false;
  }

  return (
    rowIndex >= selectionBounds.rowStart &&
    rowIndex <= selectionBounds.rowEnd &&
    columnIndex >= selectionBounds.columnStart &&
    columnIndex <= selectionBounds.columnEnd
  );
}

function getVisibleMergeForCell(recordId, column, merges, records, columns) {
  const merge = (merges || []).find((item) => {
    const rowIndex = records.findIndex((record) => record.id === recordId);
    const startRowIndex = records.findIndex((record) => record.id === item.startRowId);
    const endRowIndex = records.findIndex((record) => record.id === item.endRowId);
    const startIndex = columns.indexOf(item.startColumn);
    const endIndex = columns.indexOf(item.endColumn);
    const columnIndex = columns.indexOf(column);

    if (rowIndex < 0 || startRowIndex < 0 || endRowIndex < 0 || startIndex < 0 || endIndex < 0 || columnIndex < 0) {
      return false;
    }

    return (
      rowIndex >= startRowIndex &&
      rowIndex <= endRowIndex &&
      columnIndex >= startIndex &&
      columnIndex <= endIndex
    );
  });

  if (!merge) {
    return null;
  }

  const rowIndex = records.findIndex((record) => record.id === recordId);
  const startRowIndex = records.findIndex((record) => record.id === merge.startRowId);
  const endRowIndex = records.findIndex((record) => record.id === merge.endRowId);
  const startIndex = columns.indexOf(merge.startColumn);
  const endIndex = columns.indexOf(merge.endColumn);
  const columnIndex = columns.indexOf(column);

  return {
    merge,
    isAnchor: columnIndex === startIndex && rowIndex === startRowIndex,
    colSpan: endIndex - startIndex + 1,
    rowSpan: endRowIndex - startRowIndex + 1
  };
}

export default function RecordTable({
  activeCell,
  columnTypes,
  columns,
  columnWidths,
  dragDisabled,
  dragState,
  frozenRowIds,
  getCellDisplayValue,
  getCellStyle,
  hiddenRowIds,
  loading,
  merges,
  records,
  rowHeights,
  rowMeta,
  selectedRange,
  selectedRecord,
  selectedRowIds,
  onCellChange,
  onCellFocus,
  onCellNavigate,
  onCellPaste,
  onCellRangeEnd,
  onCellRangeEnter,
  onCellRangeStart,
  onAddColumn,
  onCreateTypedRow,
  onColumnResize,
  onEdit,
  onMoveRow,
  onRowResize,
  onToggleColumnHidden,
  onToggleRowSelection
}) {
  const onlyStandardRows = records.every((record) => getRowMeta(rowMeta, record.id).kind === 'row');
  const selectionBounds = getSelectionBounds(selectedRange, records, columns);
  const frozenVisibleRows = records.filter((record) => (frozenRowIds || []).includes(record.id));

  function getFrozenRowOffset(recordId) {
    let offset = 46;

    for (const frozenRecord of frozenVisibleRows) {
      if (frozenRecord.id === recordId) {
        break;
      }

      offset += rowHeights?.[frozenRecord.id] || 44;
    }

    return offset;
  }

  function startColumnResize(event, column) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = columnWidths?.[column] || 160;

    function handlePointerMove(moveEvent) {
      onColumnResize(column, startWidth + (moveEvent.clientX - startX));
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function handleCellKeyDown(event, recordId, column) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onCellNavigate(recordId, column, 'left');
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onCellNavigate(recordId, column, 'right');
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      onCellNavigate(recordId, column, 'up');
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      onCellNavigate(recordId, column, 'down');
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      onCellNavigate(recordId, column, 'enter', event.shiftKey);
    }
  }

  function handleCellPasteEvent(event, recordId, column) {
    const text = event.clipboardData?.getData('text/plain') || '';
    if (!text.includes('\t') && !text.includes('\n')) {
      return;
    }

    event.preventDefault();
    onCellPaste(recordId, column, text);
  }

  function startRowResize(event, recordId) {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = rowHeights?.[recordId] || 44;

    function handlePointerMove(moveEvent) {
      onRowResize(recordId, startHeight + (moveEvent.clientY - startY));
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  function buildCellMouseHandlers(recordId, column) {
    return {
      onMouseDown: () => onCellRangeStart(recordId, column),
      onMouseEnter: (event) => {
        if (event.buttons === 1) {
          onCellRangeEnter(recordId, column);
        }
      },
      onMouseUp: () => onCellRangeEnd()
    };
  }

  return (
    <section className="sheet-card">
      <div className="sheet-grid-toolbar sheet-grid-toolbar--top">
        <div className="sheet-grid-toolbar__spacer" />
        <button
          className="sheet-grid-toolbar__action"
          type="button"
          onClick={onAddColumn}
          aria-label="Add column"
          title="Add column"
        >
          <span className="sheet-grid-toolbar__action-icon">+</span>
          <span>Add Column</span>
        </button>
      </div>
      {loading ? (
        <p className="empty">Loading records...</p>
      ) : records.length === 0 && columns.length === 0 ? (
        <p className="empty">Add a heading, column, or row from the sheet creator to start building this spreadsheet.</p>
      ) : columns.length === 0 && onlyStandardRows ? (
        <p className="empty">Add a column to start entering row data, or insert a heading/subheading to organize the sheet first.</p>
      ) : (
        <table className="sheet-table">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th className="sheet-index-head">#</th>
              {columns.map((column, columnIndex) => (
                <th
                  key={column}
                  style={{ width: `${columnWidths?.[column] || 160}px`, minWidth: `${columnWidths?.[column] || 160}px` }}
                >
                  <div className="sheet-column sheet-column--header">
                    <div className="sheet-column__meta">
                      <strong>{getColumnHolder(columnIndex)}</strong>
                    </div>
                    <button
                      className="sheet-column__action"
                      type="button"
                      onClick={() => onToggleColumnHidden(column)}
                      aria-label={`Hide column ${column}`}
                      title={`Hide column ${column}`}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M3 12c2.2-3.5 5.3-5.3 9-5.3s6.8 1.8 9 5.3c-2.2 3.5-5.3 5.3-9 5.3S5.2 15.5 3 12Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="2.7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      </svg>
                    </button>
                    <span
                      className="sheet-column__resize"
                      onPointerDown={(event) => startColumnResize(event, column)}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3}>
                  <p className="empty">Columns are ready. Add a row whenever you want to start entering data.</p>
                </td>
              </tr>
            ) : null}
            {records.map((record, rowIndex) => {
              const meta = getRowMeta(rowMeta, record.id);
              const isFrozenRow = (frozenRowIds || []).includes(record.id);
              const frozenRowOffset = getFrozenRowOffset(record.id);
              const frozenCellStyle = isFrozenRow
                ? {
                    position: 'sticky',
                    top: `${frozenRowOffset}px`,
                    zIndex: 5,
                    background: meta.color || '#ffffff'
                  }
                : {};
              const rowClassName = [
                selectedRecord?.id === record.id ? 'selected-row' : '',
                hiddenRowIds.includes(record.id) ? 'is-hidden-row' : '',
                dragState?.draggedId === record.id ? 'is-dragging' : '',
                dragState?.overId === record.id ? 'is-drop-target' : '',
                isFrozenRow ? 'is-frozen-row' : '',
                meta.kind !== 'row' ? `row-kind-${meta.kind}` : ''
              ]
                .filter(Boolean)
                .join(' ');

              const dragEvents = {
                draggable: !dragDisabled,
                onDragStart: () => onMoveRow(record.id, record.id, 'start'),
                onDragOver: (event) => {
                  if (dragDisabled) {
                    return;
                  }

                  event.preventDefault();
                  onMoveRow(record.id, record.id, 'over');
                },
                onDrop: (event) => {
                  if (dragDisabled) {
                    return;
                  }

                  event.preventDefault();
                  onMoveRow(dragState?.draggedId, record.id, 'drop');
                },
                onDragEnd: () => onMoveRow(record.id, record.id, 'end')
              };

              if (meta.kind !== 'row') {
                const leadValue = record[rowLabelField] || `${meta.kind} ${rowIndex + 1}`;

                return (
                  <tr
                    key={record.id}
                    className={rowClassName}
                    style={{
                      '--row-highlight': meta.color || '#ffffff',
                      '--row-text-align': meta.alignment || 'left',
                      height: `${rowHeights?.[record.id] || 44}px`
                    }}
                    {...dragEvents}
                  >
                    <td style={frozenCellStyle}>
                      <div className="row-tools">
                        <button
                          className="drag-handle"
                          type="button"
                          disabled={dragDisabled}
                          aria-label={`Drag row ${rowIndex + 1}`}
                        >
                          ::
                        </button>
                        <span
                          className="row-resize"
                          onPointerDown={(event) => startRowResize(event, record.id)}
                        />
                      </div>
                    </td>
                    <td style={frozenCellStyle}>
                      <input
                        checked={selectedRowIds.includes(record.id)}
                        type="checkbox"
                        onChange={() => onToggleRowSelection(record.id)}
                      />
                    </td>
                    <td style={frozenCellStyle}>
                      <button
                        className="row-index"
                        type="button"
                        onClick={() => onEdit(record)}
                        aria-label={`Select row ${rowIndex + 1}`}
                      >
                        {rowIndex + 1}
                      </button>
                    </td>
                    <td colSpan={Math.max(columns.length, 1)} style={frozenCellStyle}>
                      <input
                        className={`sheet-heading-input sheet-heading-input--${meta.kind}`}
                        type="text"
                        value={
                          activeCell?.recordId === record.id && activeCell?.column === rowLabelField
                            ? leadValue
                            : getCellDisplayValue(record, rowLabelField)
                        }
                        onFocus={() => {
                          onEdit(record);
                          onCellFocus(record, rowLabelField);
                        }}
                        onKeyDown={(event) => handleCellKeyDown(event, record.id, rowLabelField)}
                        onPaste={(event) => handleCellPasteEvent(event, record.id, rowLabelField)}
                        style={getCellStyle(record.id, rowLabelField)}
                        onChange={(event) => onCellChange(record.id, rowLabelField, event.target.value)}
                      />
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={record.id}
                  className={rowClassName}
                  style={{
                    '--row-highlight': meta.color || '#ffffff',
                    '--row-text-align': meta.alignment || 'left',
                    height: `${rowHeights?.[record.id] || 44}px`
                  }}
                  {...dragEvents}
                >
                  <td style={frozenCellStyle}>
                    <div className="row-tools">
                      <button
                        className="drag-handle"
                        type="button"
                        disabled={dragDisabled}
                        aria-label={`Drag row ${rowIndex + 1}`}
                      >
                        ::
                      </button>
                      <span
                        className="row-resize"
                        onPointerDown={(event) => startRowResize(event, record.id)}
                      />
                    </div>
                  </td>
                  <td style={frozenCellStyle}>
                    <input
                      checked={selectedRowIds.includes(record.id)}
                      type="checkbox"
                      onChange={() => onToggleRowSelection(record.id)}
                    />
                  </td>
                  <td style={frozenCellStyle}>
                    <button
                      className="row-index"
                      type="button"
                      onClick={() => onEdit(record)}
                      aria-label={`Select row ${rowIndex + 1}`}
                    >
                      {rowIndex + 1}
                    </button>
                  </td>
                  {columns.map((column, columnIndex) => {
                    const mergeInfo = getVisibleMergeForCell(record.id, column, merges, records, columns);

                    if (mergeInfo && !mergeInfo.isAnchor) {
                      return null;
                    }

                    const isSelected = isCellSelected(selectionBounds, rowIndex, columnIndex);
                    const cellClassName = [
                      'sheet-cell',
                      isSelected ? 'sheet-cell--selected' : '',
                      mergeInfo?.isAnchor ? 'sheet-cell--merged-anchor' : ''
                    ]
                      .filter(Boolean)
                      .join(' ');
                    const mouseHandlers = buildCellMouseHandlers(record.id, column);

                    return (
                      <td
                        key={`${record.id}-${column}`}
                        className={cellClassName}
                        colSpan={mergeInfo?.colSpan || 1}
                        rowSpan={mergeInfo?.rowSpan || 1}
                        style={{
                          width: `${(mergeInfo?.colSpan || 1) > 1
                            ? columns
                                .slice(columnIndex, columnIndex + (mergeInfo?.colSpan || 1))
                                .reduce((sum, currentColumn) => sum + (columnWidths?.[currentColumn] || 160), 0)
                            : (columnWidths?.[column] || 160)}px`,
                          minWidth: `${(mergeInfo?.colSpan || 1) > 1
                            ? columns
                                .slice(columnIndex, columnIndex + (mergeInfo?.colSpan || 1))
                                .reduce((sum, currentColumn) => sum + (columnWidths?.[currentColumn] || 160), 0)
                            : (columnWidths?.[column] || 160)}px`,
                          ...frozenCellStyle
                        }}
                        {...mouseHandlers}
                      >
                        <input
                          className={`sheet-cell-input ${activeCell?.recordId === record.id && activeCell?.column === column ? 'sheet-cell-input--active' : ''}`}
                          type={getInputType(column, columnTypes)}
                          value={getCellDisplayValue(record, column)}
                          onFocus={() => {
                            onEdit(record);
                            onCellFocus(record, column);
                          }}
                          onKeyDown={(event) => handleCellKeyDown(event, record.id, column)}
                          onPaste={(event) => handleCellPasteEvent(event, record.id, column)}
                          style={getCellStyle(record.id, column)}
                          onChange={(event) => onCellChange(record.id, column, event.target.value)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="sheet-grid-toolbar sheet-grid-toolbar--bottom">
        <button
          className="sheet-grid-toolbar__action"
          type="button"
          onClick={() => onCreateTypedRow('row')}
          aria-label="Add row"
          title="Add row"
        >
          <span className="sheet-grid-toolbar__action-icon">+</span>
          <span>Add Row</span>
        </button>
      </div>
    </section>
  );
}

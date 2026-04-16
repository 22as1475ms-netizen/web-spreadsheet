import * as XLSX from 'xlsx';

const rowLabelField = '__sheetLabel';
const metadataSheetName = '_web_spreadsheet_meta';

function buildId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeSheetName(name, index) {
  const value = String(name || `Sheet ${index + 1}`)
    .replace(/[\\/*?:[\]]/g, ' ')
    .trim();
  return value.slice(0, 31) || `Sheet ${index + 1}`;
}

function isGenericHeaderName(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '' || /^column\s+\d+$/.test(normalized);
}

function normalizeCell(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function hasMeaningfulValue(value) {
  return normalizeCell(value) !== '';
}

function countFilledCells(row = []) {
  return row.filter(hasMeaningfulValue).length;
}

function rowContainsHeaderKeywords(row = []) {
  const text = row.map(normalizeCell).join(' ').toLowerCase();
  const keywords = [
    'region',
    'original name',
    'new name',
    'remarks',
    'province',
    'municipality',
    'barangay',
    'registration',
    'date registered',
    'status',
    'cbfma',
    'po members'
  ];

  return keywords.some((keyword) => text.includes(keyword));
}

function isMostlyGenericHeaderRow(row = []) {
  const values = row.filter(hasMeaningfulValue);
  if (values.length === 0) {
    return false;
  }

  return values.filter(isGenericHeaderName).length / values.length >= 0.6;
}

function findHeaderStartIndex(matrix) {
  for (let index = 0; index < matrix.length; index += 1) {
    const row = matrix[index] || [];
    if (countFilledCells(row) >= 4 && (rowContainsHeaderKeywords(row) || isMostlyGenericHeaderRow(row))) {
      return index;
    }
  }

  return 0;
}

function findHeaderRowSpan(matrix, startIndex) {
  let span = 1;

  for (let index = startIndex + 1; index < Math.min(matrix.length, startIndex + 4); index += 1) {
    const row = matrix[index] || [];
    if (countFilledCells(row) === 0) {
      break;
    }

    const looksLikeGroupedHeader =
      countFilledCells(row) <= Math.max(4, Math.ceil((matrix[startIndex] || []).length * 0.35));

    if (!looksLikeGroupedHeader) {
      break;
    }

    span += 1;
  }

  return span;
}

function getWorksheetMerges(worksheet) {
  return Array.isArray(worksheet?.['!merges']) ? worksheet['!merges'] : [];
}

function expandHeaderBandWithMerges(headerRows, headerStartIndex, merges) {
  return headerRows.map((row, localRowIndex) => {
    const expandedRow = [...row];
    const sheetRowIndex = headerStartIndex + localRowIndex;

    merges.forEach((merge) => {
      if (merge.s.r > sheetRowIndex || merge.e.r < sheetRowIndex) {
        return;
      }

      const sourceRowIndex = merge.s.r - headerStartIndex;
      const sourceValue = normalizeCell(headerRows[sourceRowIndex]?.[merge.s.c]);
      if (!sourceValue) {
        return;
      }

      for (let columnIndex = merge.s.c; columnIndex <= merge.e.c; columnIndex += 1) {
        if (!normalizeCell(expandedRow[columnIndex])) {
          expandedRow[columnIndex] = sourceValue;
        }
      }
    });

    return expandedRow;
  });
}

function buildHeadersFromBand(headerRows) {
  const maxLength = Math.max(...headerRows.map((row) => row.length), 0);
  const headers = [];

  for (let columnIndex = 0; columnIndex < maxLength; columnIndex += 1) {
    const parts = headerRows
      .map((row) => normalizeCell(row[columnIndex]))
      .filter(Boolean);
    const uniqueParts = parts.filter((part, index) => parts.indexOf(part) === index);
    const combined = uniqueParts.join(' - ');
    headers.push(combined);
  }

  return headers;
}

function getMergedWidthForRow(rowIndex, merges) {
  return merges
    .filter((merge) => merge.s.r <= rowIndex && merge.e.r >= rowIndex)
    .reduce((largest, merge) => Math.max(largest, merge.e.c - merge.s.c + 1), 0);
}

function inferRowKind(row, rowIndex, columnCount, merges) {
  const meaningfulCells = row
    .map((value, index) => ({ value: normalizeCell(value), index }))
    .filter((cell) => cell.value);

  if (meaningfulCells.length === 0) {
    return null;
  }

  const mergedWidth = getMergedWidthForRow(rowIndex, merges);
  const hasMostlySingleLabel = meaningfulCells.length === 1 && !/^\d+$/.test(meaningfulCells[0].value);
  const spansMostColumns = mergedWidth >= Math.max(3, Math.ceil(columnCount * 0.6));

  if (hasMostlySingleLabel && spansMostColumns) {
    return 'heading';
  }

  if (hasMostlySingleLabel) {
    return 'subheading';
  }

  return 'row';
}

function shouldPromoteFirstDataRowToHeaders(headerRow, dataRows) {
  if (!Array.isArray(headerRow) || headerRow.length === 0 || dataRows.length === 0) {
    return false;
  }

  const meaningfulHeaders = headerRow.filter((cell) => String(cell || '').trim() !== '');
  if (meaningfulHeaders.length === 0) {
    return false;
  }

  const genericHeaderCount = meaningfulHeaders.filter(isGenericHeaderName).length;
  const mostlyGenericHeaders = genericHeaderCount / meaningfulHeaders.length >= 0.6;
  if (!mostlyGenericHeaders) {
    return false;
  }

  const firstDataRow = dataRows[0] || [];
  const filledCells = firstDataRow.filter((cell) => String(cell || '').trim() !== '');
  return filledCells.length >= Math.max(2, Math.ceil(headerRow.length * 0.35));
}

function uniqueColumnName(name, index, used) {
  const base = String(name || '').trim() || `Column ${index + 1}`;

  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let suffix = 2;
  while (used.has(`${base} ${suffix}`)) {
    suffix += 1;
  }

  const next = `${base} ${suffix}`;
  used.add(next);
  return next;
}

function inferColumnType(values) {
  const samples = values
    .map((value) => (value == null ? '' : String(value).trim()))
    .filter(Boolean);

  if (samples.length === 0) {
    return 'text';
  }

  if (samples.every((value) => /^-?\d+(\.\d+)?$/.test(value))) {
    return 'number';
  }

  if (samples.every((value) => !Number.isNaN(Date.parse(value)))) {
    return samples.some((value) => value.includes(':')) ? 'datetime-local' : 'date';
  }

  if (samples.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
    return 'email';
  }

  if (samples.every((value) => /^\+?[0-9()\-\s]{7,}$/.test(value))) {
    return 'tel';
  }

  if (samples.every((value) => /^https?:\/\//i.test(value))) {
    return 'url';
  }

  return 'text';
}

function collectColumns(records, columnTypes) {
  return Array.from(
    new Set([
      ...records.flatMap((record) =>
        Object.keys(record).filter((key) => key !== 'id' && key !== rowLabelField)
      ),
      ...Object.keys(columnTypes || {})
    ])
  );
}

function getSheetColumns(sheet) {
  return collectColumns(sheet.records || [], sheet.columnTypes || {});
}

function buildSheetHeaders(sheet) {
  const columns = getSheetColumns(sheet);
  return columns.length > 0 ? columns : ['Label'];
}

function calculateColumnWidths(headers, rows) {
  return headers.map((header, columnIndex) => {
    const headerLabel = header === rowLabelField ? 'Label' : header;
    const cellLengths = rows.map((row) => String(row[columnIndex] ?? '').length);
    const longest = Math.max(headerLabel.length, ...cellLengths, 0);
    return {
      wch: Math.min(Math.max(longest + 2, 10), 40)
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMetadataSheet(worksheet) {
  if (!worksheet) {
    return null;
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (rows[0]?.[0] !== 'web-spreadsheet-meta-v1') {
    return null;
  }

  try {
    return JSON.parse(rows[1]?.[0] || '{}');
  } catch {
    return null;
  }
}

function worksheetToMatrix(worksheet) {
  const ref = worksheet?.['!ref'];
  if (!ref) {
    return [];
  }

  const range = XLSX.utils.decode_range(ref);
  const rows = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row = [];

    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
      const cell = worksheet[address];
      row.push(cell ? XLSX.utils.format_cell(cell) : '');
    }

    rows.push(row);
  }

  return rows;
}

function buildSheetMerges(worksheetMerges, records, columns) {
  return (worksheetMerges || [])
    .map((merge) => {
      const startRecord = records[merge.s.r];
      const endRecord = records[merge.e.r];
      const startColumn = columns[merge.s.c];
      const endColumn = columns[merge.e.c];

      if (!startRecord || !endRecord || !startColumn || !endColumn) {
        return null;
      }

      return {
        startRowId: startRecord.id,
        endRowId: endRecord.id,
        startColumn,
        endColumn
      };
    })
    .filter(Boolean);
}

function buildDirectSheetFromMatrix(name, matrix, worksheet, index) {
  const sanitizedName = sanitizeSheetName(name, index);
  const merges = getWorksheetMerges(worksheet);
  const columnCount = Math.max(...matrix.map((row) => row.length), 0);
  const columns = Array.from({ length: columnCount }, (_, columnIndex) => XLSX.utils.encode_col(columnIndex));
  const hiddenColumns = Array.isArray(worksheet?.['!cols'])
    ? worksheet['!cols']
        .map((column, columnIndex) => (column?.hidden ? XLSX.utils.encode_col(columnIndex) : null))
        .filter(Boolean)
    : [];
  const hiddenRows = [];
  const rowMeta = {};

  const records = matrix.map((row, rowIndex) => {
    const record = { id: buildId('row') };
    const filledCells = row
      .map((value, columnIndex) => ({ value: normalizeCell(value), columnIndex }))
      .filter((cell) => cell.value !== '');
    const inferredKind = inferRowKind(row, rowIndex, Math.max(columnCount, 1), merges);

    columns.forEach((column, columnIndex) => {
      const value = row[columnIndex] ?? '';
      record[column] = value === '' ? '' : String(value);
    });

    if (Array.isArray(worksheet?.['!rows']) && worksheet['!rows'][rowIndex]?.hidden) {
      hiddenRows.push(record.id);
    }

    if (inferredKind && inferredKind !== 'row' && filledCells.length > 0) {
      rowMeta[record.id] = {
        kind: inferredKind,
        color: '#ffffff',
        alignment: 'left'
      };
      record[rowLabelField] = filledCells[0].value;
    }

    return record;
  });

  return {
    id: buildId('sheet'),
    name: sanitizedName,
    records,
    hiddenRows,
    frozenRows: [],
    hiddenColumns,
    columnTypes: Object.fromEntries(columns.map((column) => [column, 'text'])),
    columnWidths: {},
    rowHeights: {},
    cellStyles: {},
    merges: buildSheetMerges(merges, records, columns),
    rowMeta
  };
}

function buildSheetFromMatrix(name, matrix, worksheet, metadata, index) {
  const sanitizedName = sanitizeSheetName(name, index);
  const merges = getWorksheetMerges(worksheet);
  const headerStartIndex = findHeaderStartIndex(matrix);
  const headerSpan = findHeaderRowSpan(matrix, headerStartIndex);
  const rawHeaderBand = matrix.slice(headerStartIndex, headerStartIndex + headerSpan);
  const headerBand = expandHeaderBandWithMerges(rawHeaderBand, headerStartIndex, merges);
  const rawHeaderRow = buildHeadersFromBand(headerBand);
  const rawDataRows = matrix.slice(headerStartIndex + headerSpan);
  const useFirstDataRowAsHeaders = shouldPromoteFirstDataRowToHeaders(rawHeaderRow, rawDataRows);
  const headerRow = useFirstDataRowAsHeaders ? rawDataRows[0] || [] : rawHeaderRow;
  const usedNames = new Set();
  const columns = headerRow.map((cell, columnIndex) => uniqueColumnName(cell, columnIndex, usedNames));
  const dataStartIndex = headerStartIndex + headerSpan + (useFirstDataRowAsHeaders ? 1 : 0);
  const dataRows = (useFirstDataRowAsHeaders ? rawDataRows.slice(1) : rawDataRows).filter((row) => countFilledCells(row) > 0);
  const labelColumnPresent = columns.includes(rowLabelField);
  const metaForSheet = metadata?.sheets?.find((sheet) => sheet.name === sanitizedName);
  const rowMeta = metaForSheet?.rowMeta && typeof metaForSheet.rowMeta === 'object' ? metaForSheet.rowMeta : {};
  const cellStyles = metaForSheet?.cellStyles && typeof metaForSheet.cellStyles === 'object' ? metaForSheet.cellStyles : {};

  const records = dataRows
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row, rowIndex) => {
      const nextRecord = { id: buildId('row') };
      const savedMeta = metaForSheet?.rowOrder?.[rowIndex]
        ? rowMeta[metaForSheet.rowOrder[rowIndex]]
        : null;
      const inferredKind = savedMeta?.kind || inferRowKind(row, dataStartIndex + rowIndex, columns.length, merges);

      if (inferredKind !== 'row' && !labelColumnPresent) {
        const labelValue = String(row.find((value) => hasMeaningfulValue(value)) ?? '');
        if (labelValue.trim()) {
          nextRecord[rowLabelField] = labelValue;
        }
      }

      columns.forEach((column, columnIndex) => {
        const rawValue = row[columnIndex];
        const normalizedValue = rawValue == null ? '' : String(rawValue);
        if (inferredKind !== 'row' && !labelColumnPresent) {
          return;
        }
        if (normalizedValue !== '') {
          nextRecord[column] = normalizedValue;
        }
      });

      if (inferredKind !== 'row' && !nextRecord[rowLabelField]) {
        nextRecord[rowLabelField] =
          String(row.find((value) => hasMeaningfulValue(value)) ?? '') ||
          (inferredKind === 'heading' ? 'Heading' : 'Subheading');
      }

      return nextRecord;
    });

  const rowIdMap = new Map(
    records.map((record, rowIndex) => [metaForSheet?.rowOrder?.[rowIndex], record.id]).filter(([savedId]) => savedId)
  );
  const nextCellStyles = Object.fromEntries(
    Object.entries(cellStyles).map(([styleKey, styleValue]) => {
      const [savedRowId, column] = styleKey.split(':');
      const nextRowId = rowIdMap.get(savedRowId);
      return nextRowId ? [`${nextRowId}:${column}`, styleValue] : null;
    }).filter(Boolean)
  );

  const nextColumnTypes = columns
    .filter((column) => column !== rowLabelField)
    .reduce((result, column) => {
      result[column] = metaForSheet?.columnTypes?.[column] || inferColumnType(records.map((record) => record[column]));
      return result;
    }, {});

  const nextRowMeta = records.reduce((result, record, rowIndex) => {
    const savedRowId = metaForSheet?.rowOrder?.[rowIndex];
    const savedMeta = savedRowId ? rowMeta[savedRowId] : null;

    if (savedMeta) {
      result[record.id] = { ...savedMeta };
      return result;
    }

    const inferredKind = inferRowKind(
      dataRows[rowIndex] || [],
      dataStartIndex + rowIndex,
      columns.length,
      merges
    );

    if (inferredKind && inferredKind !== 'row') {
      result[record.id] = {
        kind: inferredKind,
        color: '#ffffff',
        alignment: 'left'
      };
    }

    return result;
  }, {});

  return {
    id: metaForSheet?.id || buildId('sheet'),
    name: sanitizedName,
    records,
    hiddenRows: Array.isArray(metaForSheet?.hiddenRows)
      ? metaForSheet.hiddenRows.map((rowId) => rowIdMap.get(rowId)).filter(Boolean)
      : [],
    frozenRows: Array.isArray(metaForSheet?.frozenRows)
      ? metaForSheet.frozenRows.map((rowId) => rowIdMap.get(rowId)).filter(Boolean)
      : [],
    hiddenColumns: Array.isArray(metaForSheet?.hiddenColumns)
      ? metaForSheet.hiddenColumns.filter((column) => nextColumnTypes[column])
      : [],
    columnTypes: nextColumnTypes,
    columnWidths: metaForSheet?.columnWidths && typeof metaForSheet.columnWidths === 'object' ? metaForSheet.columnWidths : {},
    rowHeights: metaForSheet?.rowHeights && typeof metaForSheet.rowHeights === 'object'
      ? Object.fromEntries(
          Object.entries(metaForSheet.rowHeights).map(([savedRowId, height]) => {
            const nextRowId = rowIdMap.get(savedRowId);
            return nextRowId ? [nextRowId, height] : null;
          }).filter(Boolean)
        )
      : {},
    cellStyles: nextCellStyles,
    merges: Array.isArray(metaForSheet?.merges)
      ? metaForSheet.merges
          .map((merge) => {
            const nextStartRowId = rowIdMap.get(merge.startRowId);
            const nextEndRowId = rowIdMap.get(merge.endRowId);
            return nextStartRowId && nextEndRowId
              ? {
                  ...merge,
                  startRowId: nextStartRowId,
                  endRowId: nextEndRowId
                }
              : null;
          })
          .filter(Boolean)
      : buildSheetMerges(merges, records, columns),
    rowMeta: nextRowMeta
  };
}

export function createImportFileFromJson(payload, fileName) {
  const fallbackName = fileName.replace(/\.[^.]+$/, '') || 'Imported Spreadsheet';
  const records = Array.isArray(payload) ? payload : payload.records;
  const sheets =
    payload && Array.isArray(payload.sheets) && payload.sheets.length > 0
      ? payload.sheets
      : [
          {
            id: buildId('sheet'),
            name: 'Sheet 1',
            records: Array.isArray(records) ? records : [],
            hiddenRows: Array.isArray(payload.hiddenRows) ? payload.hiddenRows : [],
            frozenRows: Array.isArray(payload.frozenRows) ? payload.frozenRows : [],
            hiddenColumns: Array.isArray(payload.hiddenColumns) ? payload.hiddenColumns : [],
            columnTypes: payload.columnTypes && typeof payload.columnTypes === 'object' ? payload.columnTypes : {},
            merges: Array.isArray(payload.merges) ? payload.merges : [],
            rowMeta: payload.rowMeta && typeof payload.rowMeta === 'object' ? payload.rowMeta : {}
          }
        ];

  if (!Array.isArray(records) && !Array.isArray(payload?.sheets)) {
    throw new Error('The selected file must contain a records array.');
  }

  return {
    id: buildId('file'),
    name: payload.name || fallbackName,
    sheets,
    records: sheets[0]?.records || [],
    hiddenRows: sheets[0]?.hiddenRows || [],
    frozenRows: sheets[0]?.frozenRows || [],
    hiddenColumns: sheets[0]?.hiddenColumns || [],
    columnTypes: sheets[0]?.columnTypes || {},
    merges: sheets[0]?.merges || [],
    rowMeta: sheets[0]?.rowMeta || {},
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceLabel: 'Opened from file manager'
  };
}

export async function createImportFileFromWorkbook(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'json') {
    const content = await file.text();
    return createImportFileFromJson(JSON.parse(content), file.name);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const metadata = parseMetadataSheet(workbook.Sheets[metadataSheetName]);
  const sheetNames = workbook.SheetNames.filter((name) => name !== metadataSheetName);

  const sheets = sheetNames.map((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const matrix = worksheetToMatrix(worksheet);

    if (!metadata) {
      return buildDirectSheetFromMatrix(sheetName, matrix, worksheet, index);
    }

    return buildSheetFromMatrix(sheetName, matrix, worksheet, metadata, index);
  });

  if (sheets.length === 0) {
    throw new Error('The selected workbook does not contain any readable sheets.');
  }

  return {
    id: buildId('file'),
    name: file.name.replace(/\.[^.]+$/, '') || 'Imported Spreadsheet',
    sheets,
    records: sheets[0].records,
    hiddenRows: sheets[0].hiddenRows,
    frozenRows: sheets[0].frozenRows,
    hiddenColumns: sheets[0].hiddenColumns,
    columnTypes: sheets[0].columnTypes,
    merges: sheets[0].merges,
    rowMeta: sheets[0].rowMeta,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceLabel: 'Opened from file manager'
  };
}

export function exportWorkbookAsXlsx({ name, sheets }) {
  const workbook = XLSX.utils.book_new();
  const workbookMetadata = {
    sheets: []
  };

  sheets.forEach((sheet, index) => {
    const headers = buildSheetHeaders(sheet);
    const rows = [headers];
    const rowOrder = [];
    const hiddenColumns = Array.isArray(sheet.hiddenColumns) ? sheet.hiddenColumns : [];
    const hiddenRows = Array.isArray(sheet.hiddenRows) ? sheet.hiddenRows : [];
    const merges = [];

    (sheet.records || []).forEach((record, rowIndex) => {
      rowOrder.push(record.id);
      const meta = sheet.rowMeta?.[record.id] || { kind: 'row' };

      if (meta.kind !== 'row') {
        rows.push([
          record[rowLabelField] == null ? '' : record[rowLabelField],
          ...headers.slice(1).map(() => '')
        ]);

        if (headers.length > 1) {
          merges.push({
            s: { r: rowIndex + 1, c: 0 },
            e: { r: rowIndex + 1, c: headers.length - 1 }
          });
        }

        return;
      }

      rows.push(headers.map((header) => (record[header] == null ? '' : record[header])));
    });

    (sheet.merges || []).forEach((merge) => {
      const startRowIndex = rowOrder.indexOf(merge.startRowId);
      const endRowIndex = rowOrder.indexOf(merge.endRowId);
      const startColumnIndex = headers.indexOf(merge.startColumn);
      const endColumnIndex = headers.indexOf(merge.endColumn);

      if (
        startRowIndex < 0 ||
        endRowIndex < 0 ||
        startColumnIndex < 0 ||
        endColumnIndex < 0 ||
        (startColumnIndex === endColumnIndex && startRowIndex === endRowIndex)
      ) {
        return;
      }

      merges.push({
        s: {
          r: Math.min(startRowIndex, endRowIndex) + 1,
          c: Math.min(startColumnIndex, endColumnIndex)
        },
        e: {
          r: Math.max(startRowIndex, endRowIndex) + 1,
          c: Math.max(startColumnIndex, endColumnIndex)
        }
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const worksheetName = sanitizeSheetName(sheet.name, index);
    const columnWidths = calculateColumnWidths(headers, rows.slice(1));
    worksheet['!cols'] = headers.map((header, columnIndex) => ({
      ...columnWidths[columnIndex],
      hidden: header !== rowLabelField && hiddenColumns.includes(header)
    }));
    worksheet['!rows'] = [
      { hpt: 22 },
      ...(sheet.records || []).map((record) => ({
        hidden: hiddenRows.includes(record.id)
      }))
    ];
    if (merges.length > 0) {
      worksheet['!merges'] = merges;
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    workbookMetadata.sheets.push({
      id: sheet.id,
      name: worksheetName,
      hiddenRows: Array.isArray(sheet.hiddenRows) ? sheet.hiddenRows : [],
      frozenRows: Array.isArray(sheet.frozenRows) ? sheet.frozenRows : [],
      hiddenColumns: Array.isArray(sheet.hiddenColumns) ? sheet.hiddenColumns : [],
      columnTypes: sheet.columnTypes || {},
      columnWidths: sheet.columnWidths || {},
      rowHeights: sheet.rowHeights || {},
      cellStyles: sheet.cellStyles || {},
      merges: sheet.merges || [],
      rowMeta: sheet.rowMeta || {},
      rowOrder
    });
  });

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ['web-spreadsheet-meta-v1'],
    [JSON.stringify(workbookMetadata)]
  ]);
  XLSX.utils.book_append_sheet(workbook, metaSheet, metadataSheetName);

  workbook.Workbook = workbook.Workbook || {};
  workbook.Workbook.Sheets = workbook.SheetNames.map((sheetName) => ({
    name: sheetName,
    Hidden: sheetName === metadataSheetName ? 1 : 0
  }));

  const data = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const blob = new Blob([data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${String(name || 'spreadsheet').replace(/\s+/g, '-').toLowerCase() || 'spreadsheet'}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportWorkbookAsPdf({ name, sheets }) {
  const pages = sheets
    .map((sheet) => {
      const headers = buildSheetHeaders(sheet).filter((header) => !(sheet.hiddenColumns || []).includes(header));
      const records = (sheet.records || []).filter((record) => !(sheet.hiddenRows || []).includes(record.id));
      const headerCells = headers
        .map((header) => `<th>${escapeHtml(header)}</th>`)
        .join('');

      const bodyRows = records
        .map((record) => {
          const meta = sheet.rowMeta?.[record.id] || { kind: 'row', color: '#ffffff', alignment: 'left' };

          if (meta.kind !== 'row') {
            return `
              <tr>
                <td
                  class="print-cell print-cell--${escapeHtml(meta.kind)}"
                  style="text-align:${meta.alignment || 'left'};background:${meta.color || '#ffffff'}"
                  colspan="${Math.max(headers.length, 1)}"
                >
                  ${escapeHtml(record[rowLabelField] ?? '')}
                </td>
              </tr>
            `;
          }

          const cells = headers
            .map((header) => {
              const value = record[header] ?? '';
              return `<td class="print-cell" style="text-align:${meta.alignment || 'left'}">${escapeHtml(value)}</td>`;
            })
            .join('');

          return `<tr>${cells}</tr>`;
        })
        .join('');

      return `
        <section class="print-sheet">
          <header class="print-sheet__header">
            <h2>${escapeHtml(sheet.name)}</h2>
          </header>
          <table class="print-table">
            <thead>
              <tr>${headerCells}</tr>
            </thead>
            <tbody>
              ${bodyRows || `<tr><td class="print-empty" colspan="${Math.max(headers.length, 1)}">No rows to export.</td></tr>`}
            </tbody>
          </table>
        </section>
      `;
    })
    .join('');

  const title = `${String(name || 'spreadsheet')} Export`;
  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root { color-scheme: light; }
          body {
            margin: 0;
            padding: 24px;
            font-family: "Segoe UI", sans-serif;
            background: #f5f8fb;
            color: #244568;
          }
          .print-sheet {
            margin: 0 0 28px;
            break-after: page;
          }
          .print-sheet:last-child {
            break-after: auto;
          }
          .print-sheet__header h2 {
            margin: 0 0 12px;
            font-size: 20px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            background: white;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #d8e2ec;
            padding: 8px 10px;
            vertical-align: top;
            word-break: break-word;
          }
          .print-table th {
            background: #edf3f9;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
          }
          .print-cell--heading {
            font-size: 18px;
            font-weight: 700;
          }
          .print-cell--subheading {
            font-size: 15px;
            font-weight: 700;
          }
          .print-empty {
            text-align: center;
            color: #5b7290;
          }
          @page {
            size: landscape;
            margin: 12mm;
          }
          @media print {
            body {
              padding: 0;
              background: white;
            }
          }
        </style>
        <script>
          window.addEventListener('load', function () {
            window.setTimeout(function () {
              window.focus();
              window.print();
            }, 300);
          });
        </script>
      </head>
      <body>${pages}</body>
    </html>
  `;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error('Unable to open the print preview window.');
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

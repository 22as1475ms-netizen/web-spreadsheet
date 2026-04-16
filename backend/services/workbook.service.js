const { deleteWorkbookById, listWorkbooksByUserId, upsertWorkbook } = require('../db/database');
const { createError } = require('../utils/validator');

function normalizeWorkbookPayload(workbookId, payload) {
  const sheets = Array.isArray(payload?.sheets) ? payload.sheets : [];

  if (sheets.length === 0) {
    throw createError(400, 'A workbook must include at least one sheet.');
  }

  const createdAt = payload.createdAt || new Date().toISOString();
  const updatedAt = payload.updatedAt || new Date().toISOString();
  const name = String(payload.name || '').trim() || 'Untitled Spreadsheet';

  return {
    id: workbookId || payload.id,
    name,
    sheets,
    records: payload.records || sheets[0]?.records || [],
    hiddenRows: payload.hiddenRows || sheets[0]?.hiddenRows || [],
    frozenRows: payload.frozenRows || sheets[0]?.frozenRows || [],
    hiddenColumns: payload.hiddenColumns || sheets[0]?.hiddenColumns || [],
    columnTypes: payload.columnTypes || sheets[0]?.columnTypes || {},
    columnWidths: payload.columnWidths || sheets[0]?.columnWidths || {},
    rowHeights: payload.rowHeights || sheets[0]?.rowHeights || {},
    cellStyles: payload.cellStyles || sheets[0]?.cellStyles || {},
    merges: payload.merges || sheets[0]?.merges || [],
    rowMeta: payload.rowMeta || sheets[0]?.rowMeta || {},
    createdAt,
    updatedAt,
    sourceLabel: payload.sourceLabel || 'Workbook Dashboard'
  };
}

async function listWorkbooks(userId) {
  return listWorkbooksByUserId(userId);
}

async function saveWorkbook(userId, workbookId, payload) {
  const workbook = normalizeWorkbookPayload(workbookId, payload);
  return upsertWorkbook(userId, workbook);
}

async function removeWorkbook(userId, workbookId) {
  const wasDeleted = await deleteWorkbookById(userId, workbookId);

  if (!wasDeleted) {
    throw createError(404, 'Workbook not found.');
  }
}

module.exports = {
  deleteWorkbook: removeWorkbook,
  listWorkbooks,
  upsertWorkbook: saveWorkbook
};

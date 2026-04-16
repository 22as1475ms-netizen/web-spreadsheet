const crypto = require('crypto');

const {
  createRecord: insertRecord,
  deleteRecord: removeRecord,
  findRecordById,
  listRecordsByUserId,
  updateRecord: persistRecord
} = require('../db/database');
const { requireFields, createError } = require('../utils/validator');

function normalizeRecord(record) {
  return {
    id: record.id,
    userId: record.userId,
    stationName: record.stationName || record.title || 'Untitled Station',
    river: record.river || 'Unknown River',
    municipality: record.municipality || 'Unknown Area',
    samplingDate: record.samplingDate || '2026-01-01',
    ph: Number(record.ph ?? 7),
    dissolvedOxygen: Number(record.dissolvedOxygen ?? record.amount ?? 0),
    temperature: Number(record.temperature ?? 21),
    status: record.status || 'Pending',
    notes: record.notes || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

async function listRecords(userId) {
  const records = await listRecordsByUserId(userId);
  return records
    .map(normalizeRecord)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

async function createRecord(userId, payload) {
  requireFields(payload, [
    'stationName',
    'river',
    'municipality',
    'samplingDate',
    'ph',
    'dissolvedOxygen',
    'temperature',
    'status'
  ]);

  const record = {
    id: crypto.randomUUID(),
    userId,
    stationName: payload.stationName.trim(),
    river: payload.river.trim(),
    municipality: payload.municipality.trim(),
    samplingDate: payload.samplingDate,
    ph: Number(payload.ph),
    dissolvedOxygen: Number(payload.dissolvedOxygen),
    temperature: Number(payload.temperature),
    status: payload.status.trim(),
    notes: (payload.notes || '').trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (
    Number.isNaN(record.ph) ||
    Number.isNaN(record.dissolvedOxygen) ||
    Number.isNaN(record.temperature)
  ) {
    throw createError(400, 'pH, dissolved oxygen, and temperature must be valid numbers.');
  }

  const createdRecord = await insertRecord(record);
  return normalizeRecord(createdRecord);
}

async function updateRecord(userId, recordId, payload) {
  requireFields(payload, [
    'stationName',
    'river',
    'municipality',
    'samplingDate',
    'ph',
    'dissolvedOxygen',
    'temperature',
    'status'
  ]);

  const record = await findRecordById(userId, recordId);

  if (!record) {
    throw createError(404, 'Record not found.');
  }

  const ph = Number(payload.ph);
  const dissolvedOxygen = Number(payload.dissolvedOxygen);
  const temperature = Number(payload.temperature);

  if (Number.isNaN(ph) || Number.isNaN(dissolvedOxygen) || Number.isNaN(temperature)) {
    throw createError(400, 'pH, dissolved oxygen, and temperature must be valid numbers.');
  }

  record.stationName = payload.stationName.trim();
  record.river = payload.river.trim();
  record.municipality = payload.municipality.trim();
  record.samplingDate = payload.samplingDate;
  record.ph = ph;
  record.dissolvedOxygen = dissolvedOxygen;
  record.temperature = temperature;
  record.status = payload.status.trim();
  record.notes = (payload.notes || '').trim();
  record.updatedAt = new Date().toISOString();

  const updatedRecord = await persistRecord(record);
  return normalizeRecord(updatedRecord);
}

async function deleteRecord(userId, recordId) {
  const wasDeleted = await removeRecord(userId, recordId);

  if (!wasDeleted) {
    throw createError(404, 'Record not found.');
  }
}

module.exports = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord
};

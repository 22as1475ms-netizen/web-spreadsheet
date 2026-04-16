const crypto = require('crypto');

const { readDb, writeDb } = require('../db/database');
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
  const db = await readDb();
  return db.records
    .filter((record) => record.userId === userId)
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

  const db = await readDb();
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

  db.records.push(record);
  await writeDb(db);
  return record;
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

  const db = await readDb();
  const record = db.records.find(
    (entry) => entry.id === recordId && entry.userId === userId
  );

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

  await writeDb(db);
  return normalizeRecord(record);
}

async function deleteRecord(userId, recordId) {
  const db = await readDb();
  const index = db.records.findIndex(
    (entry) => entry.id === recordId && entry.userId === userId
  );

  if (index === -1) {
    throw createError(404, 'Record not found.');
  }

  db.records.splice(index, 1);
  await writeDb(db);
}

module.exports = {
  listRecords,
  createRecord,
  updateRecord,
  deleteRecord
};

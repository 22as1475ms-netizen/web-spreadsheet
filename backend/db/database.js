const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');

const emptyDb = {
  users: [],
  records: []
};

let pool;

function resolveDbPath() {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'web-spreadsheet-data.json');
  }

  return path.join(__dirname, 'data.json');
}

function getStorageDriver() {
  if (process.env.STORAGE_DRIVER) {
    return process.env.STORAGE_DRIVER;
  }

  return process.env.DATABASE_URL ? 'postgres' : 'json';
}

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for Postgres storage.');
  }

  pool = new Pool({
    connectionString,
    ssl:
      process.env.PGSSLMODE === 'disable' || /localhost|127\.0\.0\.1/.test(connectionString)
        ? false
        : { rejectUnauthorized: false }
  });

  return pool;
}

async function ensureJsonDb() {
  const dbPath = resolveDbPath();

  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(emptyDb, null, 2));
  }
}

async function readJsonDb() {
  const dbPath = resolveDbPath();
  await ensureJsonDb();
  const raw = await fs.readFile(dbPath, 'utf8');
  return raw ? JSON.parse(raw) : { ...emptyDb };
}

async function writeJsonDb(data) {
  const dbPath = resolveDbPath();
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

async function query(text, params = []) {
  return getPool().query(text, params);
}

async function findUserByEmail(email) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    return db.users.find((user) => user.email === email) || null;
  }

  const result = await query(
    `
      select id, name, email, password_hash as "passwordHash", created_at as "createdAt"
      from app_users
      where email = $1
      limit 1
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function createUser(user) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    db.users.push(user);
    await writeJsonDb(db);
    return user;
  }

  const result = await query(
    `
      insert into app_users (id, name, email, password_hash, created_at)
      values ($1, $2, $3, $4, $5)
      returning
        id,
        name,
        email,
        password_hash as "passwordHash",
        created_at as "createdAt"
    `,
    [user.id, user.name, user.email, user.passwordHash, user.createdAt]
  );

  return result.rows[0];
}

async function listRecordsByUserId(userId) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    return db.records.filter((record) => record.userId === userId);
  }

  const result = await query(
    `
      select
        id,
        user_id as "userId",
        station_name as "stationName",
        river,
        municipality,
        sampling_date as "samplingDate",
        ph,
        dissolved_oxygen as "dissolvedOxygen",
        temperature,
        status,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from water_quality_records
      where user_id = $1
      order by updated_at desc
    `,
    [userId]
  );

  return result.rows;
}

async function createRecord(record) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    db.records.push(record);
    await writeJsonDb(db);
    return record;
  }

  const result = await query(
    `
      insert into water_quality_records (
        id,
        user_id,
        station_name,
        river,
        municipality,
        sampling_date,
        ph,
        dissolved_oxygen,
        temperature,
        status,
        notes,
        created_at,
        updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning
        id,
        user_id as "userId",
        station_name as "stationName",
        river,
        municipality,
        sampling_date as "samplingDate",
        ph,
        dissolved_oxygen as "dissolvedOxygen",
        temperature,
        status,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [
      record.id,
      record.userId,
      record.stationName,
      record.river,
      record.municipality,
      record.samplingDate,
      record.ph,
      record.dissolvedOxygen,
      record.temperature,
      record.status,
      record.notes,
      record.createdAt,
      record.updatedAt
    ]
  );

  return result.rows[0];
}

async function findRecordById(userId, recordId) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    return db.records.find((entry) => entry.id === recordId && entry.userId === userId) || null;
  }

  const result = await query(
    `
      select
        id,
        user_id as "userId",
        station_name as "stationName",
        river,
        municipality,
        sampling_date as "samplingDate",
        ph,
        dissolved_oxygen as "dissolvedOxygen",
        temperature,
        status,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
      from water_quality_records
      where id = $1 and user_id = $2
      limit 1
    `,
    [recordId, userId]
  );

  return result.rows[0] || null;
}

async function updateRecord(record) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    const index = db.records.findIndex((entry) => entry.id === record.id && entry.userId === record.userId);

    if (index === -1) {
      return null;
    }

    db.records[index] = record;
    await writeJsonDb(db);
    return record;
  }

  const result = await query(
    `
      update water_quality_records
      set
        station_name = $3,
        river = $4,
        municipality = $5,
        sampling_date = $6,
        ph = $7,
        dissolved_oxygen = $8,
        temperature = $9,
        status = $10,
        notes = $11,
        updated_at = $12
      where id = $1 and user_id = $2
      returning
        id,
        user_id as "userId",
        station_name as "stationName",
        river,
        municipality,
        sampling_date as "samplingDate",
        ph,
        dissolved_oxygen as "dissolvedOxygen",
        temperature,
        status,
        notes,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [
      record.id,
      record.userId,
      record.stationName,
      record.river,
      record.municipality,
      record.samplingDate,
      record.ph,
      record.dissolvedOxygen,
      record.temperature,
      record.status,
      record.notes,
      record.updatedAt
    ]
  );

  return result.rows[0] || null;
}

async function deleteRecord(userId, recordId) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    const initialLength = db.records.length;
    db.records = db.records.filter((entry) => !(entry.id === recordId && entry.userId === userId));

    if (db.records.length === initialLength) {
      return false;
    }

    await writeJsonDb(db);
    return true;
  }

  const result = await query(
    `
      delete from water_quality_records
      where id = $1 and user_id = $2
    `,
    [recordId, userId]
  );

  return result.rowCount > 0;
}

module.exports = {
  createRecord,
  createUser,
  deleteRecord,
  findRecordById,
  findUserByEmail,
  getStorageDriver,
  listRecordsByUserId,
  updateRecord
};

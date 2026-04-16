const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');

const emptyDb = {
  users: [],
  workbooks: []
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

async function listWorkbooksByUserId(userId) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    return db.workbooks
      .filter((workbook) => workbook.userId === userId)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .map((workbook) => workbook.payload);
  }

  const result = await query(
    `
      select
        id,
        name,
        payload,
        source_label as "sourceLabel",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from workbooks
      where user_id = $1
      order by updated_at desc
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row.payload,
    id: row.id,
    name: row.name,
    sourceLabel: row.sourceLabel,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }));
}

async function upsertWorkbook(userId, workbook) {
  const payload = {
    ...workbook,
    id: workbook.id
  };

  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    const index = db.workbooks.findIndex((entry) => entry.id === workbook.id && entry.userId === userId);
    const entry = {
      id: workbook.id,
      userId,
      updatedAt: workbook.updatedAt,
      payload
    };

    if (index === -1) {
      db.workbooks.push(entry);
    } else {
      db.workbooks[index] = entry;
    }

    await writeJsonDb(db);
    return payload;
  }

  const result = await query(
    `
      insert into workbooks (id, user_id, name, payload, source_label, created_at, updated_at)
      values ($1, $2, $3, $4::jsonb, $5, $6, $7)
      on conflict (id) do update
      set
        name = excluded.name,
        payload = excluded.payload,
        source_label = excluded.source_label,
        updated_at = excluded.updated_at
      returning
        id,
        name,
        payload,
        source_label as "sourceLabel",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `,
    [
      workbook.id,
      userId,
      workbook.name,
      JSON.stringify(payload),
      workbook.sourceLabel || 'Workbook Dashboard',
      workbook.createdAt,
      workbook.updatedAt
    ]
  );

  const row = result.rows[0];
  return {
    ...row.payload,
    id: row.id,
    name: row.name,
    sourceLabel: row.sourceLabel,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

async function deleteWorkbookById(userId, workbookId) {
  if (getStorageDriver() === 'json') {
    const db = await readJsonDb();
    const initialLength = db.workbooks.length;
    db.workbooks = db.workbooks.filter((entry) => !(entry.id === workbookId && entry.userId === userId));

    if (db.workbooks.length === initialLength) {
      return false;
    }

    await writeJsonDb(db);
    return true;
  }

  const result = await query(
    `
      delete from workbooks
      where id = $1 and user_id = $2
    `,
    [workbookId, userId]
  );

  return result.rowCount > 0;
}

module.exports = {
  createUser,
  deleteWorkbookById,
  findUserByEmail,
  getStorageDriver,
  listWorkbooksByUserId,
  upsertWorkbook
};

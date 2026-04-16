const fs = require('fs/promises');
const path = require('path');

function resolveDbPath() {
  if (process.env.VERCEL) {
    return path.join('/tmp', 'web-spreadsheet-data.json');
  }

  return path.join(__dirname, 'data.json');
}

const emptyDb = {
  users: [],
  records: []
};

async function ensureDb() {
  const dbPath = resolveDbPath();

  try {
    await fs.access(dbPath);
  } catch (error) {
    await fs.writeFile(dbPath, JSON.stringify(emptyDb, null, 2));
  }
}

async function readDb() {
  const dbPath = resolveDbPath();
  await ensureDb();
  const raw = await fs.readFile(dbPath, 'utf8');
  return raw ? JSON.parse(raw) : { ...emptyDb };
}

async function writeDb(data) {
  const dbPath = resolveDbPath();
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  readDb,
  writeDb
};

require('dotenv').config();

const path = require('path');
const fs = require('fs/promises');
const { Pool } = require('pg');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run the migration.');
  }

  const dbPath = path.join(__dirname, '..', 'db', 'data.json');
  const raw = await fs.readFile(dbPath, 'utf8');
  const payload = raw ? JSON.parse(raw) : { users: [] };
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.PGSSLMODE === 'disable' || /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
        ? false
        : { rejectUnauthorized: false }
  });

  try {
    for (const user of payload.users || []) {
      await pool.query(
        `
          insert into app_users (id, name, email, password_hash, created_at)
          values ($1, $2, $3, $4, $5)
          on conflict (email) do update
          set
            name = excluded.name,
            password_hash = excluded.password_hash
        `,
        [user.id, user.name, user.email, user.passwordHash, user.createdAt]
      );
    }

    console.log(`Migrated ${payload.users?.length || 0} users.`);
    console.log('Workbook data will start syncing once users sign in and save through the app.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

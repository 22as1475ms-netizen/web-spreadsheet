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
  const payload = raw ? JSON.parse(raw) : { users: [], records: [] };
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

    for (const record of payload.records || []) {
      await pool.query(
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
          on conflict (id) do update
          set
            station_name = excluded.station_name,
            river = excluded.river,
            municipality = excluded.municipality,
            sampling_date = excluded.sampling_date,
            ph = excluded.ph,
            dissolved_oxygen = excluded.dissolved_oxygen,
            temperature = excluded.temperature,
            status = excluded.status,
            notes = excluded.notes,
            updated_at = excluded.updated_at
        `,
        [
          record.id,
          record.userId,
          record.stationName,
          record.river,
          record.municipality,
          record.samplingDate,
          Number(record.ph),
          Number(record.dissolvedOxygen),
          Number(record.temperature),
          record.status,
          record.notes || '',
          record.createdAt,
          record.updatedAt
        ]
      );
    }

    console.log(`Migrated ${payload.users?.length || 0} users and ${payload.records?.length || 0} records.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

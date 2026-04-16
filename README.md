# Web Spreadsheet

This project is prepared for Vercel with:

- a static Vite frontend build from `frontend/`
- a serverless API handler at `api/index.js`
- same-origin frontend API calls through `/api`
- optional Postgres storage through Supabase using `DATABASE_URL`

## Vercel deployment

Set these environment variables in Vercel:

- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `DATABASE_URL`
- `STORAGE_DRIVER`

Recommended `CLIENT_ORIGIN` value:

- your production URL, for example `https://your-project.vercel.app`

## Supabase storage

1. Create a Supabase project.
2. In the SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql).
3. Copy the Supabase Postgres connection string into `DATABASE_URL`.
4. Set `STORAGE_DRIVER=postgres`.
5. Migrate any existing JSON user seed data with:

```bash
npm --prefix backend run migrate:json-to-postgres
```

The actual spreadsheet system is stored in the `workbooks` table as workbook JSON payloads, so saved sheets, rows, merges, hidden columns, styling, and workbook metadata now map to the real editor instead of the old placeholder domain model.

For local JSON-only development, keep:

- `STORAGE_DRIVER=json`
- `PGSSLMODE=disable`

## Important storage note

If you stay on JSON storage, Vercel write access is only temporary, so the app falls back to `/tmp/web-spreadsheet-data.json` during serverless execution.

That means:

- the deployment works for demos and short-lived sessions
- data is not durable across cold starts or instance changes

For production persistence, replace the JSON file storage in `backend/db/database.js` with a hosted database.

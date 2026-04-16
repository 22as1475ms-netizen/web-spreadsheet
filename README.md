# Web Spreadsheet

This project is prepared for Vercel with:

- a static Vite frontend build from `frontend/`
- a serverless API handler at `api/index.js`
- same-origin frontend API calls through `/api`

## Vercel deployment

Set these environment variables in Vercel:

- `JWT_SECRET`
- `CLIENT_ORIGIN`

Recommended `CLIENT_ORIGIN` value:

- your production URL, for example `https://your-project.vercel.app`

## Important storage note

The backend currently stores users and records in a JSON file. On Vercel, write access is only temporary, so the app now falls back to `/tmp/web-spreadsheet-data.json` during serverless execution.

That means:

- the deployment works for demos and short-lived sessions
- data is not durable across cold starts or instance changes

For production persistence, replace the JSON file storage in `backend/db/database.js` with a hosted database.

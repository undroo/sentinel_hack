# Update Guide

This file documents the current setup, endpoints, and required environment variables to run the frontend + backend together.

## 1) Prerequisites

- Node.js 18+
- Supabase project (URL + keys)
- Google Maps API key with **Maps JavaScript API** enabled
- Google Geocoding API key (or reuse the Maps key if it has Geocoding enabled)
- ngrok (required for ElevenLabs webhooks)

## 2) Install Dependencies

```bash
npm install
```

## 3) Environment Variables

Create `.env` in the project root (this repo already uses one). Example:

```bash
# Frontend (Vite)
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
VITE_GEMINI_API_KEY=YOUR_GEMINI_KEY

# Backend (Node server)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
GOOGLE_GEOCODING_API_KEY=YOUR_GOOGLE_GEOCODING_KEY

# Optional (used in some workflow tools)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=YOUR_SUPABASE_ANON_KEY
```

Notes:
- The **service role key** is required for backend updates to Supabase.
- Do not commit secrets.

## 4) Database Setup (Supabase)

In Supabase SQL Editor, run:

1) `scripts/schema.sql`  
2) `scripts/fix_schema_missing_columns.sql`  
3) `scripts/seed-data.sql`  

Or use the single script:

`scripts/setup-database.sql`

## 5) Start the Backend

```bash
npm run dev:api
```

Backend listens at:

```
http://localhost:8787
```

Health check:

```
GET /health
```

## 6) Start the Frontend

```bash
npm run dev
```

Frontend:

```
http://localhost:5173
```

## 7) Webhook Endpoints

These are the backend endpoints used by ElevenLabs workflows.

### Call Start

```
POST /v1/dispatch/call-start
```

Example payload:

```json
{
  "incident_id": "INC-2024-001234",
  "incident_type": "Medical Emergency",
  "location_text": "Caller reports Angeles City"
}
```

### Location Updates

```
POST /v1/dispatch/events
```

Example payload:

```json
{
  "incident_id": "INC-2024-001234",
  "event_type": "location_update",
  "location_json": {
    "address": {
      "Building_House_Number": "12-2",
      "Street": "Remy Street",
      "State_Province_Town_City": "Angeles City",
      "landmark": "near Nena Drive"
    }
  }
}
```

## 8) ngrok (Required)

Install ngrok (Windows):

```bash
winget install --id ngrok.ngrok --accept-package-agreements --accept-source-agreements
```

Configure ngrok with your authtoken:

```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

Expose the backend for ElevenLabs webhooks:

```bash
ngrok http 8787
```

Your webhook URLs become:

```
https://<your-ngrok-subdomain>.ngrok-free.dev/v1/dispatch/call-start
https://<your-ngrok-subdomain>.ngrok-free.dev/v1/dispatch/events
```

Open the ngrok dashboard to find your current subdomain:

```
http://127.0.0.1:4040
```

## 9) Live Dashboard Behavior

- New calls appear when `/v1/dispatch/call-start` creates a row in `calls`.
- Location updates write `location_lat` / `location_lon`, which power the Google Maps pin.
- Frontend polls every 1s for new calls (fallback if realtime isn’t working).

## 10) Clearing the Dashboard

To hide active calls but keep history:

```sql
update calls
set status = 'closed'
where status in ('ai_handling', 'human_active');
```

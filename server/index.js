import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = Number(process.env.PORT || 8787);

const idempotencyCache = new Set();
const callStartCache = new Set();
const storedEvents = [];

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);
app.use(express.json({ limit: '2mb' }));

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}


app.get('/health', (_req, res) => {
  sendJson(res, 200, { ok: true });
});

app.post('/v1/dispatch/events', async (req, res) => {
  const idempotencyKey = String(req.headers['idempotency-key'] || '');
  if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
    return sendJson(res, 200, { ok: true, duplicate: true });
  }
  let locationPin = null;
  const body = req.body || {};

  if (typeof body.location_json === 'string') {
    try {
      body.location_json = JSON.parse(body.location_json);
    } catch {
      return sendJson(res, 422, { ok: false, error: 'location_json must be JSON' });
    }
  }

  const eventTypes = ['location_update', 'location_confirmed', 'escalation_request'];
  if (body.event_type && !eventTypes.includes(body.event_type)) {
    console.warn('[dispatch webhook] invalid event_type', body.event_type);
  }

  if (idempotencyKey) {
    idempotencyCache.add(idempotencyKey);
  }

  storedEvents.push({
    received_at: new Date().toISOString(),
    ...body,
  });

  console.log('[dispatch webhook] event received', {
    incident_id: body.incident_id,
    location__json: body.location_json,
  });

  const addressString = buildAddressString(body.location_json);
  if (addressString) {
    console.log('CHECK ADDRESS STRING: ', addressString);
    locationPin = await geocodeAddress(addressString);
    console.log(locationPin);
  } else {
    console.warn('[dispatch webhook] No location_json provided, skipping geocode');
  }
  if (locationPin) {
    if (!supabase) {
      console.warn('[dispatch webhook] Supabase not configured for updates');
    } else if (!body.incident_id) {
      console.warn('[dispatch webhook] Missing incident_id, cannot update Supabase');
    } else {
      const { error } = await supabase
        .from('calls')
        .update({
          location_lat: locationPin.lat,
          location_lon: locationPin.lng,
          location_text: locationPin.formatted_address,
        })
        .eq('call_id', body.incident_id);

      if (error) {
        console.error('[dispatch webhook] Supabase update failed', error);
      } else {
        console.log('[dispatch webhook] Supabase updated call location', body.incident_id);
        console.log('confirmed lat and long:', locationPin.lat, locationPin.lng);
      }
    }
  }

  const result = sendJson(res, 200, { ok: true, event_received: true });
  return result;
});

app.post('/v1/dispatch/call-start', async (req, res) => {
  const body = req.body || {};
  const incidentId = body.incident_id;

  if (!incidentId) {
    return sendJson(res, 422, { ok: false, error: 'Missing incident_id' });
  }

  if (callStartCache.has(incidentId)) {
    return sendJson(res, 200, { ok: true, duplicate: true });
  }

  if (!supabase) {
    console.warn('[dispatch call-start] Supabase not configured for updates');
    return sendJson(res, 500, { ok: false, error: 'Supabase not configured' });
  }

  const insertData = {
    call_id: incidentId,
    status: 'ai_handling',
    incident_type: body.incident_type || 'Incoming Call...',
    location_text: body.location_text || 'Identifying...',
    source_type: 'web_voice',
    started_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('calls')
    .upsert(insertData, { onConflict: 'call_id' })
    .select()
    .single();

  if (error) {
    console.error('[dispatch call-start] Supabase upsert failed', error);
    return sendJson(res, 500, { ok: false, error: 'Supabase upsert failed' });
  }

  callStartCache.add(incidentId);
  console.log('[dispatch call-start] call created/updated', data?.call_id);

  return sendJson(res, 200, { ok: true, call: data });
});

app.get('/v1/dispatch/events', (_req, res) => {
  sendJson(res, 200, { ok: true, count: storedEvents.length, data: storedEvents });
});

function buildAddressString(locationJson) {
  if (!locationJson) {
    return '';
  }

  const address = locationJson?.address || locationJson;
  if (!address || typeof address !== 'object') {
    return '';
  }

  const parts = [
    address.Building_House_Number,
    address.Street,
    address.State_Province_Town_City,
    address.landmark
  ].filter(Boolean);

  const result = parts.join(' ').trim();
  if (result.length === 0) {
    return '';
  }

  return result;
}

async function geocodeAddress(addressString) {
  const geocodingApiKey = 'AIzaSyDam7LCuyAVKFs23ZGcydBPGOklkQcVaKI';

  if (!geocodingApiKey) {
    console.warn('[dispatch webhook] Missing Google Geocoding API key');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${geocodingApiKey}`
    );
    if (!response.ok) {
      console.warn('[dispatch webhook] Geocoding request failed', response.status);
      return null;
    }

    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.length) {
      console.warn('[dispatch webhook] Geocoding returned no results', data.status);
      return null;
    }

    const best = data.results[0];
    const location = best.geometry?.location;
    if (!location) {
      console.warn('[dispatch webhook] Geocoding missing location geometry');
      return null;
    }

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: best.formatted_address,
    };
  } catch (error) {
    console.error('[dispatch webhook] Geocoding API error:', error);
    return null;
  }
}

app.listen(port, () => {
  console.log(`[dispatch webhook] listening on http://localhost:${port}`);
});

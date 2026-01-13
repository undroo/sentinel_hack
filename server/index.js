import express from 'express';
import cors from 'cors';

const app = express();
const port = Number(process.env.PORT || 8787);

const idempotencyCache = new Set();
const storedEvents = [];

const webhookApiKey =
  process.env.ELEVENLABS_WEBHOOK_API_KEY ||
  process.env.VITE_ELEVENLABS_WEBHOOK_API_KEY ||
  '';

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);
app.use(express.json({ limit: '2mb' }));

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

function authenticate(req, res, next) {
  if (!webhookApiKey) {
    return next();
  }

  const authHeader = String(req.headers.authorization || '');
  const apiKeyHeader = String(req.headers['x-api-key'] || '');
  const expectedBearer = `Bearer ${webhookApiKey}`;

  if (authHeader !== expectedBearer && apiKeyHeader !== webhookApiKey) {
    return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
  }

  return next();
}

app.get('/health', (_req, res) => {
  sendJson(res, 200, { ok: true });
});

app.post('/v1/dispatch/events', authenticate, async (req, res) => {
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

  const requiredFields = ['incident_id', 'call_sid', 'event_type'];
  const missingFields = requiredFields.filter((field) => !body[field]);
  if (missingFields.length > 0) {
    console.warn('[dispatch webhook] missing fields', missingFields);
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
    call_sid: body.call_sid,
    event_type: body.event_type,
    priority: body.priority,
    verified: body.verified,
    location__json: body.location_json,
  });

  const addressString = buildAddressString(body.location_json);
  if (addressString) {
    locationPin = await geocodeAddress(addressString);
    if (locationPin) {
      console.log('[dispatch webhook] location pin resolved:', locationPin);
    } else {
      console.warn('[dispatch webhook] location pin not resolved');
    }
  } else {
    console.warn('[dispatch webhook] missing address details');
  }

  console.log(locationPin);

  const result = sendJson(res, 200, { ok: true, event_received: true });
  return result;
});

app.get('/v1/dispatch/events', (_req, res) => {
  sendJson(res, 200, { ok: true, count: storedEvents.length, data: storedEvents });
});

function buildAddressString(locationJson) {
  if (!locationJson) {
    return '';
  }

  if (typeof locationJson === 'string') {
    return locationJson;
  }

  const address = locationJson.address || locationJson;
  if (!address || typeof address !== 'object') {
    return '';
  }

  const parts = [
    address.building_number,
    address.street_name,
    address.district_or_barangay,
    address.city,
    address.region,
    address.country,
  ].filter(Boolean);

  const result = parts.join(' ').trim();
  if (result.length === 0) {
    return '';
  }

  return result;
}

async function geocodeAddress(addressString) {
  const geocodingApiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    '';

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

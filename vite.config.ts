import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const idempotencyCache = new Set<string>();

function sendJson(res: any, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const webhookApiKey =
    env.VITE_ELEVENLABS_WEBHOOK_API_KEY || env.ELEVENLABS_WEBHOOK_API_KEY || '';
  const strictWebhookValidation =
    String(env.VITE_ELEVENLABS_WEBHOOK_STRICT || '').toLowerCase() === 'true';

  return {
    plugins: [
      react(),
      {
        name: 'sentinel-dispatch-webhook',
        configureServer(server) {
          server.middlewares.use('/v1/dispatch/events', (req, res) => {
            if (req.method !== 'POST') {
              return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' });
            }

            const contentType = String(req.headers['content-type'] || '');
            if (!contentType.includes('application/json')) {
              return sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
            }

            if (webhookApiKey) {
              const authHeader = String(req.headers.authorization || '');
              const apiKeyHeader = String(req.headers['x-api-key'] || '');
              const expectedBearer = `Bearer ${webhookApiKey}`;
              if (authHeader !== expectedBearer && apiKeyHeader !== webhookApiKey) {
                return sendJson(res, 401, { ok: false, error: 'Unauthorized' });
              }
            }

            const idempotencyKey = String(req.headers['idempotency-key'] || '');
            if (idempotencyKey && idempotencyCache.has(idempotencyKey)) {
              return sendJson(res, 200, { ok: true, duplicate: true });
            }

            let rawBody = '';
            req.on('data', (chunk) => {
              rawBody += chunk;
            });
            req.on('end', () => {
              let body: any;
              try {
                body = rawBody ? JSON.parse(rawBody) : {};
              } catch {
                return sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
              }

              if (typeof body.location_json === 'string') {
                try {
                  body.location_json = JSON.parse(body.location_json);
                } catch {
                  return sendJson(res, 422, { ok: false, error: 'location_json must be JSON' });
                }
              }

              const requiredFields = ['incident_id', 'call_sid', 'event_type'];
              const missingFields = requiredFields.filter((field) => !body[field]);
              if (missingFields.length > 0 && strictWebhookValidation) {
                return sendJson(res, 422, {
                  ok: false,
                  error: `Missing ${missingFields.join(', ')}`,
                });
              }

              const eventTypes = ['location_update', 'location_confirmed', 'escalation_request'];
              if (!eventTypes.includes(body.event_type)) {
                return sendJson(res, 422, { ok: false, error: 'Invalid event_type' });
              }

              if (idempotencyKey) {
                idempotencyCache.add(idempotencyKey);
              }

              console.log('[dispatch webhook] event received', {
                incident_id: body.incident_id,
                call_sid: body.call_sid,
                event_type: body.event_type,
                priority: body.priority,
                verified: body.verified,
              });

              return sendJson(res, 200, {
                ok: true,
                event_received: true,
                missing_fields: missingFields.length > 0 ? missingFields : undefined,
              });
            });

            req.on('error', () => sendJson(res, 500, { ok: false, error: 'Server error' }));
          });
        },
      },
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});

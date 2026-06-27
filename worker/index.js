const STATE_ID = 'main';

function buildCorsHeaders(request, env) {
  const requestOrigin = request.headers.get('Origin') || '';
  const configuredOrigin = env.ALLOWED_ORIGIN || '*';
  const allowOrigin =
    configuredOrigin.includes('your-frontend.pages.dev') || configuredOrigin === '*'
      ? '*'
      : requestOrigin === configuredOrigin
        ? configuredOrigin
        : configuredOrigin;

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, init = {}, corsHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

function defaultState() {
  return {
    exchangeRate: 58,
    products: [],
    batches: [],
    catalogItems: [],
    sales: [],
    purchaseRequests: [],
    // SECURITY NOTE: Existing app auth stores plaintext passwords in this users array.
    // This is preserved for compatibility only and should be replaced with hashed auth in a separate approved change.
    users: [],
  };
}

function normalizeState(input) {
  const base = defaultState();
  if (!input || typeof input !== 'object') return base;

  return {
    exchangeRate: Number(input.exchangeRate) || base.exchangeRate,
    products: Array.isArray(input.products) ? input.products : [],
    batches: Array.isArray(input.batches) ? input.batches : [],
    catalogItems: Array.isArray(input.catalogItems) ? input.catalogItems : [],
    sales: Array.isArray(input.sales) ? input.sales : [],
    purchaseRequests: Array.isArray(input.purchaseRequests) ? input.purchaseRequests : [],
    users: Array.isArray(input.users) ? input.users : [],
  };
}

async function ensureSchema(env) {
  if (!env.DB) throw new Error('D1 binding DB is not available.');

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
}

async function getState(env) {
  await ensureSchema(env);

  const row = await env.DB
    .prepare('SELECT value, updated_at FROM app_state WHERE id = ?')
    .bind(STATE_ID)
    .first();

  if (!row) {
    return { exists: false, state: defaultState(), updatedAt: null };
  }

  let parsed = defaultState();
  try {
    parsed = normalizeState(JSON.parse(row.value));
  } catch (_error) {
    parsed = defaultState();
  }

  return { exists: true, state: parsed, updatedAt: row.updated_at };
}

async function saveState(env, inputState) {
  await ensureSchema(env);

  const incomingState = inputState || {};
  const state = normalizeState(incomingState);

  // Preserve existing users when older clients save inventory snapshots that do not include users.
  if (!Object.prototype.hasOwnProperty.call(incomingState, 'users')) {
    const existing = await getState(env);
    state.users = Array.isArray(existing.state.users) ? existing.state.users : [];
  }

  const updatedAt = new Date().toISOString();

  await env.DB
    .prepare(`
      INSERT INTO app_state (id, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    .bind(STATE_ID, JSON.stringify(state), updatedAt)
    .run();

  return { state, updatedAt };
}

async function createUser(request, env, corsHeaders) {
  const body = await request.json();
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const role = String(body.role || 'Administrator');

  if (!username || !password) {
    return json({ ok: false, error: 'Username and password are required.' }, { status: 400 }, corsHeaders);
  }

  const stateResult = await getState(env);
  const state = stateResult.state;
  const exists = state.users.some(u => String(u.username || '').toLowerCase() === username.toLowerCase());
  if (exists) {
    return json({ ok: false, error: 'Username already exists.' }, { status: 409 }, corsHeaders);
  }

  const newUser = {
    id: body.id || `user-${Date.now()}`,
    username,
    // SECURITY NOTE: Plaintext is retained only to preserve the current login flow.
    password,
    role,
    isDefault: !!body.isDefault,
  };

  const saved = await saveState(env, { ...state, users: [...state.users, newUser] });
  return json({ ok: true, user: newUser, updatedAt: saved.updatedAt }, { status: 201 }, corsHeaders);
}

async function deleteUser(path, env, corsHeaders) {
  const userId = decodeURIComponent(path.slice('/api/users/'.length));
  if (!userId) {
    return json({ ok: false, error: 'Missing user id.' }, { status: 400 }, corsHeaders);
  }

  const stateResult = await getState(env);
  const state = stateResult.state;
  if (state.users.length <= 1) {
    return json({ ok: false, error: 'Cannot delete the last user.' }, { status: 400 }, corsHeaders);
  }

  const nextUsers = state.users.filter(u => String(u.id) !== userId);
  const saved = await saveState(env, { ...state, users: nextUsers });
  return json({ ok: true, data: nextUsers, updatedAt: saved.updatedAt }, { status: 200 }, corsHeaders);
}

function getPhotoKeyFromPath(path) {
  const prefix = '/api/photos/';
  if (!path.startsWith(prefix)) return '';
  return decodeURIComponent(path.slice(prefix.length));
}

function extensionFromContentType(contentType) {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg';
}

async function handlePhotoUpload(request, env, corsHeaders) {
  if (!env.PHOTOS) return json({ ok: false, error: 'R2 binding PHOTOS is not available.' }, { status: 500 }, corsHeaders);

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') return json({ ok: false, error: 'Missing image file field named file.' }, { status: 400 }, corsHeaders);

  const contentType = file.type || 'image/jpeg';
  if (!contentType.startsWith('image/')) return json({ ok: false, error: 'Only image uploads are allowed.' }, { status: 400 }, corsHeaders);

  const ext = extensionFromContentType(contentType);
  const key = `photos/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  await env.PHOTOS.put(key, file.stream(), {
    httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' },
  });

  const workerUrl = new URL(request.url);
  const photoPath = `/api/photos/${key}`;
  return json({ ok: true, key, url: photoPath, absoluteUrl: `${workerUrl.origin}${photoPath}` }, { status: 201 }, corsHeaders);
}

async function handlePhotoRead(path, env, corsHeaders) {
  if (!env.PHOTOS) return json({ ok: false, error: 'R2 binding PHOTOS is not available.' }, { status: 500 }, corsHeaders);

  const key = getPhotoKeyFromPath(path);
  if (!key) return json({ ok: false, error: 'Missing photo key.' }, { status: 400 }, corsHeaders);

  const object = await env.PHOTOS.get(key);
  if (!object) return json({ ok: false, error: 'Photo not found.' }, { status: 404 }, corsHeaders);

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    try {
      if (path === '/' || path === '/api/health') {
        return json({
          ok: true,
          service: 'gfbaa',
          message: 'Cloudflare Worker is running.',
          bindings: { DB: Boolean(env.DB), PHOTOS: Boolean(env.PHOTOS), ASSETS: Boolean(env.ASSETS) },
        }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/state') {
        const stateResult = await getState(env);
        return json({ ok: true, ...stateResult }, { status: 200 }, corsHeaders);
      }

      if ((request.method === 'PUT' || request.method === 'POST') && path === '/api/state') {
        const body = await request.json();
        const saved = await saveState(env, body.state || body);
        return json({ ok: true, ...saved }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/products') {
        const { state, updatedAt } = await getState(env);
        return json({ ok: true, data: state.products, updatedAt }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/batches') {
        const { state, updatedAt } = await getState(env);
        return json({ ok: true, data: state.batches, updatedAt }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/catalog-items') {
        const { state, updatedAt } = await getState(env);
        return json({ ok: true, data: state.catalogItems, updatedAt }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/sales') {
        const { state, updatedAt } = await getState(env);
        return json({ ok: true, data: state.sales, updatedAt }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/requests') {
        const { state, updatedAt } = await getState(env);
        return json({ ok: true, data: state.purchaseRequests, updatedAt }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/users') {
        const { state, updatedAt } = await getState(env);
        return json({ ok: true, data: state.users, updatedAt }, { status: 200 }, corsHeaders);
      }

      if (request.method === 'POST' && path === '/api/users') {
        return createUser(request, env, corsHeaders);
      }

      if (request.method === 'DELETE' && path.startsWith('/api/users/')) {
        return deleteUser(path, env, corsHeaders);
      }

      if (request.method === 'POST' && path === '/api/photos') return handlePhotoUpload(request, env, corsHeaders);
      if (request.method === 'GET' && path.startsWith('/api/photos/')) return handlePhotoRead(path, env, corsHeaders);
      if (env.ASSETS && request.method === 'GET') return env.ASSETS.fetch(request);

      return json({ ok: false, error: 'Route not found.', path }, { status: 404 }, corsHeaders);
    } catch (error) {
      return json({ ok: false, error: 'Internal Server Error', details: error.message }, { status: 500 }, corsHeaders);
    }
  },
};

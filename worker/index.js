function buildCorsHeaders(request, env) {
  const requestOrigin = request.headers.get('Origin') || '';
  const configuredOrigin = env.ALLOWED_ORIGIN || '*';

  // Keep development and first deploy forgiving when ALLOWED_ORIGIN is still the placeholder.
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
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(data, init = {}, corsHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

async function safeTableList(env, tableName) {
  if (!env.DB) {
    return { ok: false, error: 'D1 binding DB is not available.' };
  }

  try {
    const result = await env.DB.prepare(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 100`).all();
    return { ok: true, data: result.results || [] };
  } catch (error) {
    return {
      ok: false,
      error: `D1 table '${tableName}' is not ready yet. Create the table first or update this route to match your schema.`,
      details: error.message,
    };
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';

    // Serve the React frontend for non-API routes (SPA Routing)
    if (!path.startsWith('/api')) {
      if (env.ASSETS) {
        const response = await env.ASSETS.fetch(request.clone());
        if (response.status === 404) {
          const indexUrl = new URL('/index.html', request.url);
          return await env.ASSETS.fetch(new Request(indexUrl, request));
        }
        return response;
      }
      return new Response('Assets binding not found. Please deploy with assets configured.', { status: 500 });
    }

    try {
      if (path === '/' || path === '/api/health') {
        return json(
          {
            ok: true,
            service: 'gfbaa-preloved-api',
            message: 'Cloudflare Worker is running.',
            bindings: {
              DB: Boolean(env.DB),
              PHOTOS: Boolean(env.PHOTOS),
            },
          },
          { status: 200 },
          corsHeaders
        );
      }

      if (request.method === 'GET' && path === '/api/products') {
        return json(await safeTableList(env, 'products'), { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/batches') {
        return json(await safeTableList(env, 'batches'), { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/sales') {
        return json(await safeTableList(env, 'sales'), { status: 200 }, corsHeaders);
      }

      if (request.method === 'GET' && path === '/api/requests') {
        return json(await safeTableList(env, 'purchase_requests'), { status: 200 }, corsHeaders);
      }

      return json(
        {
          ok: false,
          error: 'Route not found.',
          path,
        },
        { status: 404 },
        corsHeaders
      );
    } catch (error) {
      return json(
        {
          ok: false,
          error: 'Internal Server Error',
          details: error.message,
        },
        { status: 500 },
        corsHeaders
      );
    }
  },
};

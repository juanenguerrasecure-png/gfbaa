let schemaEnsured = false;

async function ensureSchema(env) {
  if (schemaEnsured) return;
  if (!env.DB) {
    throw new Error('D1 binding DB is not available.');
  }

  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      brand TEXT,
      cat TEXT,
      price REAL,
      orig REAL,
      emoji TEXT,
      photoUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      productId TEXT,
      batchNumber TEXT,
      date TEXT,
      quantity INTEGER,
      remainingQty INTEGER,
      productCost REAL,
      shipping REAL,
      tariff REAL,
      totalCost REAL,
      costPerItem REAL,
      condition TEXT,
      exchangeRateUsed REAL,
      enteredInPhp INTEGER
    );

    CREATE TABLE IF NOT EXISTS catalog_items (
      id TEXT PRIMARY KEY,
      productId TEXT,
      name TEXT,
      brand TEXT,
      cat TEXT,
      price REAL,
      orig REAL,
      emoji TEXT,
      photoUrl TEXT,
      quantity INTEGER,
      remainingQty INTEGER,
      batchId TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT,
      buyer TEXT,
      totalPrice REAL,
      totalCogs REAL,
      profit REAL,
      items TEXT,
      selectionMethod TEXT
    );

    CREATE TABLE IF NOT EXISTS purchase_requests (
      id TEXT PRIMARY KEY,
      date TEXT,
      buyerName TEXT,
      buyerEmail TEXT,
      buyerAddress TEXT,
      items TEXT,
      status TEXT,
      shippingCost REAL,
      specialInstructions TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  schemaEnsured = true;
}

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
      // Ensure DB tables are ready on any api call
      await ensureSchema(env);

      const pathParts = path.split('/').filter(Boolean); // e.g. ['api', 'products'] or ['api', 'products', '123']
      const resource = pathParts[1];
      const resourceId = pathParts[2];

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

      // --- AGGREGATED SYNC ENDPOINT ---
      if (request.method === 'GET' && path === '/api/sync') {
        const productsRes = await env.DB.prepare("SELECT * FROM products").all();
        const batchesRes = await env.DB.prepare("SELECT * FROM batches").all();
        const catalogRes = await env.DB.prepare("SELECT * FROM catalog_items").all();
        const salesRes = await env.DB.prepare("SELECT * FROM sales").all();
        const requestsRes = await env.DB.prepare("SELECT * FROM purchase_requests").all();
        const settingsRes = await env.DB.prepare("SELECT * FROM settings").all();

        const products = productsRes.results || [];
        const batches = (batchesRes.results || []).map(b => ({
          ...b,
          productId: isNaN(Number(b.productId)) ? b.productId : Number(b.productId),
          quantity: Number(b.quantity),
          remainingQty: Number(b.remainingQty),
          productCost: Number(b.productCost),
          shipping: Number(b.shipping),
          tariff: Number(b.tariff),
          totalCost: Number(b.totalCost),
          costPerItem: Number(b.costPerItem),
          exchangeRateUsed: Number(b.exchangeRateUsed),
          enteredInPhp: Boolean(b.enteredInPhp)
        }));
        const catalogItems = (catalogRes.results || []).map(c => ({
          ...c,
          productId: isNaN(Number(c.productId)) ? c.productId : Number(c.productId),
          price: Number(c.price),
          orig: c.orig !== null ? Number(c.orig) : null,
          quantity: Number(c.quantity),
          remainingQty: Number(c.remainingQty)
        }));
        const sales = (salesRes.results || []).map(s => ({
          ...s,
          totalPrice: Number(s.totalPrice),
          totalCogs: Number(s.totalCogs),
          profit: Number(s.profit),
          items: JSON.parse(s.items || '[]')
        }));
        const purchaseRequests = (requestsRes.results || []).map(r => ({
          ...r,
          items: JSON.parse(r.items || '[]'),
          shippingCost: r.shippingCost !== null ? Number(r.shippingCost) : null
        }));

        const exchangeRateSetting = (settingsRes.results || []).find(s => s.key === 'exchange_rate');
        const exchangeRate = exchangeRateSetting ? Number(exchangeRateSetting.value) : 58.0;

        return json({
          ok: true,
          products,
          batches,
          catalogItems,
          sales,
          purchaseRequests,
          exchangeRate
        }, { status: 200 }, corsHeaders);
      }

      // --- CLEAR ENDPOINT ---
      if (request.method === 'POST' && path === '/api/clear') {
        await env.DB.exec(`
          DELETE FROM products;
          DELETE FROM batches;
          DELETE FROM catalog_items;
          DELETE FROM sales;
          DELETE FROM purchase_requests;
          DELETE FROM settings;
        `);
        return json({ ok: true, message: 'All tables cleared successfully.' }, { status: 200 }, corsHeaders);
      }

      // --- PRODUCTS ENDPOINTS ---
      if (resource === 'products') {
        if (!resourceId) {
          if (request.method === 'GET') {
            const result = await env.DB.prepare("SELECT * FROM products ORDER BY rowid DESC").all();
            return json({ ok: true, data: result.results || [] }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'POST') {
            const p = await request.json();
            await env.DB.prepare(`
              INSERT INTO products (id, name, brand, cat, price, orig, emoji, photoUrl)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                brand=excluded.brand,
                cat=excluded.cat,
                price=excluded.price,
                orig=excluded.orig,
                emoji=excluded.emoji,
                photoUrl=excluded.photoUrl
            `).bind(
              String(p.id),
              p.name,
              p.brand,
              p.cat,
              Number(p.price) || 0,
              p.orig !== undefined && p.orig !== null ? Number(p.orig) : null,
              p.emoji || null,
              p.photoUrl || null
            ).run();
            return json({ ok: true, data: p }, { status: 201 }, corsHeaders);
          }
        } else {
          if (request.method === 'PUT') {
            const p = await request.json();
            await env.DB.prepare(`
              UPDATE products SET
                name = COALESCE(?, name),
                brand = COALESCE(?, brand),
                cat = COALESCE(?, cat),
                price = COALESCE(?, price),
                orig = COALESCE(?, orig),
                emoji = COALESCE(?, emoji),
                photoUrl = COALESCE(?, photoUrl)
              WHERE id = ?
            `).bind(
              p.name,
              p.brand,
              p.cat,
              p.price !== undefined ? Number(p.price) : null,
              p.orig !== undefined ? Number(p.orig) : null,
              p.emoji,
              p.photoUrl,
              resourceId
            ).run();
            return json({ ok: true, message: 'Product updated.' }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'DELETE') {
            await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(resourceId).run();
            return json({ ok: true, message: 'Product deleted.' }, { status: 200 }, corsHeaders);
          }
        }
      }

      // --- BATCHES ENDPOINTS ---
      if (resource === 'batches') {
        if (!resourceId) {
          if (request.method === 'GET') {
            const result = await env.DB.prepare("SELECT * FROM batches ORDER BY rowid DESC").all();
            return json({ ok: true, data: result.results || [] }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'POST') {
            const b = await request.json();
            await env.DB.prepare(`
              INSERT INTO batches (id, productId, batchNumber, date, quantity, remainingQty, productCost, shipping, tariff, totalCost, costPerItem, condition, exchangeRateUsed, enteredInPhp)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                productId=excluded.productId,
                batchNumber=excluded.batchNumber,
                date=excluded.date,
                quantity=excluded.quantity,
                remainingQty=excluded.remainingQty,
                productCost=excluded.productCost,
                shipping=excluded.shipping,
                tariff=excluded.tariff,
                totalCost=excluded.totalCost,
                costPerItem=excluded.costPerItem,
                condition=excluded.condition,
                exchangeRateUsed=excluded.exchangeRateUsed,
                enteredInPhp=excluded.enteredInPhp
            `).bind(
              String(b.id),
              String(b.productId),
              b.batchNumber || null,
              b.date || null,
              Number(b.quantity) || 0,
              Number(b.remainingQty) || 0,
              Number(b.productCost) || 0,
              Number(b.shipping) || 0,
              Number(b.tariff) || 0,
              Number(b.totalCost) || 0,
              Number(b.costPerItem) || 0,
              b.condition || null,
              Number(b.exchangeRateUsed) || 58.0,
              b.enteredInPhp ? 1 : 0
            ).run();
            return json({ ok: true, data: b }, { status: 201 }, corsHeaders);
          }
        } else {
          if (request.method === 'PUT') {
            const b = await request.json();
            await env.DB.prepare(`
              UPDATE batches SET
                productId = COALESCE(?, productId),
                batchNumber = COALESCE(?, batchNumber),
                date = COALESCE(?, date),
                quantity = COALESCE(?, quantity),
                remainingQty = COALESCE(?, remainingQty),
                productCost = COALESCE(?, productCost),
                shipping = COALESCE(?, shipping),
                tariff = COALESCE(?, tariff),
                totalCost = COALESCE(?, totalCost),
                costPerItem = COALESCE(?, costPerItem),
                condition = COALESCE(?, condition),
                exchangeRateUsed = COALESCE(?, exchangeRateUsed),
                enteredInPhp = COALESCE(?, enteredInPhp)
              WHERE id = ?
            `).bind(
              b.productId !== undefined ? String(b.productId) : null,
              b.batchNumber,
              b.date,
              b.quantity !== undefined ? Number(b.quantity) : null,
              b.remainingQty !== undefined ? Number(b.remainingQty) : null,
              b.productCost !== undefined ? Number(b.productCost) : null,
              b.shipping !== undefined ? Number(b.shipping) : null,
              b.tariff !== undefined ? Number(b.tariff) : null,
              b.totalCost !== undefined ? Number(b.totalCost) : null,
              b.costPerItem !== undefined ? Number(b.costPerItem) : null,
              b.condition,
              b.exchangeRateUsed !== undefined ? Number(b.exchangeRateUsed) : null,
              b.enteredInPhp !== undefined ? (b.enteredInPhp ? 1 : 0) : null,
              resourceId
            ).run();
            return json({ ok: true, message: 'Batch updated.' }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'DELETE') {
            await env.DB.prepare("DELETE FROM batches WHERE id = ?").bind(resourceId).run();
            return json({ ok: true, message: 'Batch deleted.' }, { status: 200 }, corsHeaders);
          }
        }
      }

      // --- CATALOG ITEMS ENDPOINTS ---
      if (resource === 'catalog_items') {
        if (!resourceId) {
          if (request.method === 'GET') {
            const result = await env.DB.prepare("SELECT * FROM catalog_items ORDER BY rowid DESC").all();
            return json({ ok: true, data: result.results || [] }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'POST') {
            const c = await request.json();
            await env.DB.prepare(`
              INSERT INTO catalog_items (id, productId, name, brand, cat, price, orig, emoji, photoUrl, quantity, remainingQty, batchId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                productId=excluded.productId,
                name=excluded.name,
                brand=excluded.brand,
                cat=excluded.cat,
                price=excluded.price,
                orig=excluded.orig,
                emoji=excluded.emoji,
                photoUrl=excluded.photoUrl,
                quantity=excluded.quantity,
                remainingQty=excluded.remainingQty,
                batchId=excluded.batchId
            `).bind(
              String(c.id),
              c.productId !== undefined && c.productId !== null ? String(c.productId) : null,
              c.name || null,
              c.brand || null,
              c.cat || null,
              Number(c.price) || 0,
              c.orig !== undefined && c.orig !== null ? Number(c.orig) : null,
              c.emoji || null,
              c.photoUrl || null,
              Number(c.quantity) || 1,
              Number(c.remainingQty) || 1,
              c.batchId || null
            ).run();
            return json({ ok: true, data: c }, { status: 201 }, corsHeaders);
          }
        } else {
          if (request.method === 'PUT') {
            const c = await request.json();
            await env.DB.prepare(`
              UPDATE catalog_items SET
                productId = COALESCE(?, productId),
                name = COALESCE(?, name),
                brand = COALESCE(?, brand),
                cat = COALESCE(?, cat),
                price = COALESCE(?, price),
                orig = COALESCE(?, orig),
                emoji = COALESCE(?, emoji),
                photoUrl = COALESCE(?, photoUrl),
                quantity = COALESCE(?, quantity),
                remainingQty = COALESCE(?, remainingQty),
                batchId = COALESCE(?, batchId)
              WHERE id = ?
            `).bind(
              c.productId !== undefined ? String(c.productId) : null,
              c.name,
              c.brand,
              c.cat,
              c.price !== undefined ? Number(c.price) : null,
              c.orig !== undefined ? Number(c.orig) : null,
              c.emoji,
              c.photoUrl,
              c.quantity !== undefined ? Number(c.quantity) : null,
              c.remainingQty !== undefined ? Number(c.remainingQty) : null,
              c.batchId,
              resourceId
            ).run();
            return json({ ok: true, message: 'Catalog item updated.' }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'DELETE') {
            await env.DB.prepare("DELETE FROM catalog_items WHERE id = ?").bind(resourceId).run();
            return json({ ok: true, message: 'Catalog item deleted.' }, { status: 200 }, corsHeaders);
          }
        }
      }

      // --- SALES ENDPOINTS ---
      if (resource === 'sales') {
        if (!resourceId) {
          if (request.method === 'GET') {
            const result = await env.DB.prepare("SELECT * FROM sales ORDER BY rowid DESC").all();
            return json({ ok: true, data: result.results || [] }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'POST') {
            const s = await request.json();
            await env.DB.prepare(`
              INSERT INTO sales (id, date, buyer, totalPrice, totalCogs, profit, items, selectionMethod)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                date=excluded.date,
                buyer=excluded.buyer,
                totalPrice=excluded.totalPrice,
                totalCogs=excluded.totalCogs,
                profit=excluded.profit,
                items=excluded.items,
                selectionMethod=excluded.selectionMethod
            `).bind(
              String(s.id),
              s.date || null,
              s.buyer || null,
              Number(s.totalPrice) || 0,
              Number(s.totalCogs) || 0,
              Number(s.profit) || 0,
              JSON.stringify(s.items || []),
              s.selectionMethod || null
            ).run();
            return json({ ok: true, data: s }, { status: 201 }, corsHeaders);
          }
        } else {
          if (request.method === 'DELETE') {
            await env.DB.prepare("DELETE FROM sales WHERE id = ?").bind(resourceId).run();
            return json({ ok: true, message: 'Sale deleted.' }, { status: 200 }, corsHeaders);
          }
        }
      }

      // --- PURCHASE REQUESTS ENDPOINTS ---
      if (resource === 'requests' || resource === 'purchase_requests') {
        if (!resourceId) {
          if (request.method === 'GET') {
            const result = await env.DB.prepare("SELECT * FROM purchase_requests ORDER BY rowid DESC").all();
            return json({ ok: true, data: result.results || [] }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'POST') {
            const r = await request.json();
            await env.DB.prepare(`
              INSERT INTO purchase_requests (id, date, buyerName, buyerEmail, buyerAddress, items, status, shippingCost, specialInstructions)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                date=excluded.date,
                buyerName=excluded.buyerName,
                buyerEmail=excluded.buyerEmail,
                buyerAddress=excluded.buyerAddress,
                items=excluded.items,
                status=excluded.status,
                shippingCost=excluded.shippingCost,
                specialInstructions=excluded.specialInstructions
            `).bind(
              String(r.id),
              r.date || null,
              r.buyerName || null,
              r.buyerEmail || null,
              r.buyerAddress || null,
              JSON.stringify(r.items || []),
              r.status || 'pending',
              r.shippingCost !== undefined && r.shippingCost !== null ? Number(r.shippingCost) : null,
              r.specialInstructions || null
            ).run();
            return json({ ok: true, data: r }, { status: 201 }, corsHeaders);
          }
        } else {
          if (request.method === 'PUT') {
            const r = await request.json();
            await env.DB.prepare(`
              UPDATE purchase_requests SET
                buyerName = COALESCE(?, buyerName),
                buyerEmail = COALESCE(?, buyerEmail),
                buyerAddress = COALESCE(?, buyerAddress),
                status = COALESCE(?, status),
                shippingCost = COALESCE(?, shippingCost),
                specialInstructions = COALESCE(?, specialInstructions)
              WHERE id = ?
            `).bind(
              r.buyerName,
              r.buyerEmail,
              r.buyerAddress,
              r.status,
              r.shippingCost !== undefined && r.shippingCost !== null ? Number(r.shippingCost) : null,
              r.specialInstructions,
              resourceId
            ).run();
            return json({ ok: true, message: 'Request updated.' }, { status: 200 }, corsHeaders);
          }
          if (request.method === 'DELETE') {
            await env.DB.prepare("DELETE FROM purchase_requests WHERE id = ?").bind(resourceId).run();
            return json({ ok: true, message: 'Request deleted.' }, { status: 200 }, corsHeaders);
          }
        }
      }

      // --- EXCHANGE RATE SETTING ENDPOINT ---
      if (resource === 'settings' && resourceId === 'exchange_rate') {
        if (request.method === 'POST' || request.method === 'PUT') {
          const body = await request.json();
          await env.DB.prepare(`
            INSERT INTO settings (key, value)
            VALUES ('exchange_rate', ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value
          `).bind(String(body.value)).run();
          return json({ ok: true, value: body.value }, { status: 200 }, corsHeaders);
        }
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

const STATE_ID = 'main';
const HASH_PREFIX = 'sha256$';
const SESSION_HOURS = 8;

function buildCorsHeaders(request, env) {
  const requestOrigin = request.headers.get('Origin') || '';
  const configuredOrigin = env.ALLOWED_ORIGIN || '*';
  const allowOrigin = configuredOrigin.includes('your-frontend.pages.dev') || configuredOrigin === '*'
    ? '*'
    : requestOrigin === configuredOrigin
      ? configuredOrigin
      : '';

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
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders, ...(init.headers || {}) },
  });
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function isPasswordHash(value) {
  return typeof value === 'string' && value.startsWith(HASH_PREFIX) && value.length === HASH_PREFIX.length + 64;
}

async function hashPassword(plaintext) {
  if (isPasswordHash(plaintext)) return plaintext;
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(plaintext || '')));
  return `${HASH_PREFIX}${bufferToHex(digest)}`;
}

async function verifyPassword(plaintext, storedHash) {
  if (!isPasswordHash(storedHash)) return storedHash === plaintext;
  const incomingHash = await hashPassword(plaintext);
  return incomingHash === storedHash;
}

function defaultPaymentMethods() {
  return { zelle: { handle: '', instructions: '', qrUrl: '' }, venmo: { handle: '', instructions: '', qrUrl: '' } };
}

function defaultHeroImage() {
  return { url: '', alt: 'Good Finds by AA Featured Collection' };
}

function normalizePaymentMethods(value) {
  const base = defaultPaymentMethods();
  return { zelle: { ...base.zelle, ...(value?.zelle || {}) }, venmo: { ...base.venmo, ...(value?.venmo || {}) } };
}

function normalizeHeroImage(value) {
  const base = defaultHeroImage();
  if (!value || typeof value !== 'object') return base;
  return {
    url: String(value.url || '').trim(),
    alt: String(value.alt || base.alt).trim() || base.alt,
  };
}

function defaultState() {
  return {
    exchangeRate: 58,
    products: [],
    batches: [],
    catalogItems: [],
    sales: [],
    purchaseRequests: [],
    users: [],
    sessions: [],
    socialLinks: {},
    paymentMethods: defaultPaymentMethods(),
    heroImage: defaultHeroImage(),
    season: 'classic',
    pastCollections: [],
    galleryPhotos: [],
    comments: [],
    messages: [],
    siteContent: {
      homeIntro: 'Sourced with refinement, preserved for posterity',
      shopIntro: 'Vetted designer handbags, fine pieces, and pristine seasonal acquisitions.',
      galleryIntro: 'Visual diaries, styling stories, and close-up lifestyle curations.',
      archiveIntro: 'An archival directory of previously loved curations now residing with new owners.'
    },
  };
}

function publicState(state) {
  return { ...state, sessions: [] };
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
    sessions: Array.isArray(input.sessions) ? input.sessions : [],
    socialLinks: input.socialLinks && typeof input.socialLinks === 'object' ? input.socialLinks : {},
    paymentMethods: normalizePaymentMethods(input.paymentMethods),
    heroImage: normalizeHeroImage(input.heroImage),
    season: typeof input.season === 'string' ? input.season : base.season,
    pastCollections: Array.isArray(input.pastCollections) ? input.pastCollections : [],
    galleryPhotos: Array.isArray(input.galleryPhotos) ? input.galleryPhotos : [],
    comments: Array.isArray(input.comments) ? input.comments : [],
    messages: Array.isArray(input.messages) ? input.messages : [],
    siteContent: input.siteContent && typeof input.siteContent === 'object' ? { ...base.siteContent, ...input.siteContent } : base.siteContent,
  };
}

async function ensureSchema(env) {
  if (!env.DB) throw new Error('D1 binding DB is not available.');
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS app_state (id TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS subscribers (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL, source TEXT)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_method TEXT NOT NULL CHECK (contact_method IN ('email', 'whatsapp')),
    contact_value TEXT NOT NULL,
    message TEXT NOT NULL,
    photo_key TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'fulfilled')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC)`).run();
}

async function getState(env) {
  await ensureSchema(env);
  const row = await env.DB.prepare('SELECT value, updated_at FROM app_state WHERE id = ?').bind(STATE_ID).first();
  if (!row) return { exists: false, state: defaultState(), updatedAt: null };
  let parsed = defaultState();
  try { parsed = normalizeState(JSON.parse(row.value)); } catch (_error) { parsed = defaultState(); }
  return { exists: true, state: parsed, updatedAt: row.updated_at };
}

function pruneExpiredSessions(sessions) {
  const now = Date.now();
  return (sessions || []).filter(session => session?.token && Date.parse(session.expiresAt) > now);
}

async function saveState(env, inputState) {
  await ensureSchema(env);
  const incomingState = inputState || {};
  const state = normalizeState(incomingState);
  const existing = await getState(env);
  if (!Object.prototype.hasOwnProperty.call(incomingState, 'users')) state.users = Array.isArray(existing.state.users) ? existing.state.users : [];
  if (!Object.prototype.hasOwnProperty.call(incomingState, 'sessions')) state.sessions = Array.isArray(existing.state.sessions) ? existing.state.sessions : [];
  if (!Object.prototype.hasOwnProperty.call(incomingState, 'socialLinks')) state.socialLinks = existing.state.socialLinks || {};
  if (!Object.prototype.hasOwnProperty.call(incomingState, 'paymentMethods')) state.paymentMethods = normalizePaymentMethods(existing.state.paymentMethods);
  if (!Object.prototype.hasOwnProperty.call(incomingState, 'heroImage')) state.heroImage = normalizeHeroImage(existing.state.heroImage);
  if (!Object.prototype.hasOwnProperty.call(incomingState, 'season')) state.season = existing.state.season || 'classic';
  state.sessions = pruneExpiredSessions(state.sessions);
  const updatedAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO app_state (id, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(STATE_ID, JSON.stringify(state), updatedAt).run();
  return { state, updatedAt };
}

function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function validateToken(request, state) {
  const token = getBearerToken(request);
  if (!token) return false;
  return pruneExpiredSessions(state.sessions || []).some(session => session.token === token);
}

function unauthorized(corsHeaders) {
  return json({ ok: false, error: 'Unauthorized' }, { status: 401 }, corsHeaders);
}

function createToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes);
}

function normalizePublicRequest(body) {
  const now = new Date().toISOString();
  const items = Array.isArray(body.items) ? body.items : [];
  const firstItem = items[0] || {};
  const buyerName = String(body.buyerName || '').trim();
  const buyerEmail = String(body.buyerEmail || body.buyerContact || '').trim();
  const buyerAddress = String(body.buyerAddress || '').trim();
  return {
    id: body.id || `req-${Date.now()}`,
    productId: body.productId || firstItem.productId || '',
    productName: body.productName || firstItem.name || '',
    buyerName,
    buyerEmail,
    buyerContact: String(body.buyerContact || buyerEmail || '').trim(),
    buyerAddress,
    message: String(body.message || body.specialInstructions || '').trim(),
    items,
    status: 'pending',
    shippingCost: null,
    specialInstructions: String(body.specialInstructions || body.message || '').trim(),
    date: body.date || now.split('T')[0],
    createdAt: body.createdAt || now,
    paymentMethod: String(body.paymentMethod || '').trim(),
  };
}

async function createPurchaseRequest(request, env, corsHeaders) {
  const body = await request.json();
  const nextRequest = normalizePublicRequest(body);
  if (!nextRequest.buyerName) return json({ ok: false, error: 'Buyer name is required.' }, { status: 400 }, corsHeaders);
  if (!nextRequest.buyerEmail && !nextRequest.buyerContact) return json({ ok: false, error: 'Buyer contact is required.' }, { status: 400 }, corsHeaders);
  if (!nextRequest.items.length && !nextRequest.productId) return json({ ok: false, error: 'At least one requested item is required.' }, { status: 400 }, corsHeaders);
  const stateResult = await getState(env);
  const state = stateResult.state;
  const saved = await saveState(env, { ...state, purchaseRequests: [nextRequest, ...(state.purchaseRequests || [])] });
  return json({ ok: true, request: nextRequest, updatedAt: saved.updatedAt }, { status: 200 }, corsHeaders);
}

async function createSession(request, env, corsHeaders) {
  const body = await request.json();
  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  if (!username || !password) return json({ ok: false, error: 'Username and password are required.' }, { status: 400 }, corsHeaders);
  const stateResult = await getState(env);
  const state = stateResult.state;
  const user = state.users.find(u => String(u.username || '').toLowerCase() === username.toLowerCase());
  const passwordMatches = (user && await verifyPassword(password, user.password))
    || (user && isPasswordHash(password) && password === user.password);

  if (!user || !passwordMatches) return json({ ok: false, error: 'Invalid username or password.' }, { status: 401 }, corsHeaders);
  let nextUser = user;
  let users = state.users;
  if (!isPasswordHash(user.password)) {
    const migratedPassword = await hashPassword(password);
    users = state.users.map(u => u.id === user.id ? { ...u, password: migratedPassword } : u);
    nextUser = { ...user, password: migratedPassword };
  }
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
  const session = { userId: nextUser.id, token: createToken(), expiresAt };
  const sessions = [...pruneExpiredSessions(state.sessions || []).filter(s => s.userId !== nextUser.id), session];
  const saved = await saveState(env, { ...state, users, sessions });
  return json({ ok: true, user: nextUser, session, updatedAt: saved.updatedAt }, { status: 200 }, corsHeaders);
}

async function deleteCurrentSession(request, env, corsHeaders) {
  const stateResult = await getState(env);
  const state = stateResult.state;
  if (!validateToken(request, state)) return unauthorized(corsHeaders);
  const token = getBearerToken(request);
  const sessions = pruneExpiredSessions(state.sessions || []).filter(session => session.token !== token);
  const saved = await saveState(env, { ...state, sessions });
  return json({ ok: true, updatedAt: saved.updatedAt }, { status: 200 }, corsHeaders);
}

async function createUser(request, env, corsHeaders) {
  const stateResult = await getState(env);
  const state = stateResult.state;
  if (state.users.length > 0 && !validateToken(request, state)) return unauthorized(corsHeaders);
  const body = await request.json();
  const username = String(body.username || '').trim();
  const rawPassword = String(body.password || '');
  const role = String(body.role || 'Administrator');
  if (!username || !rawPassword) return json({ ok: false, error: 'Username and password are required.' }, { status: 400 }, corsHeaders);
  const exists = state.users.some(u => String(u.username || '').toLowerCase() === username.toLowerCase());
  if (exists) return json({ ok: false, error: 'Username already exists.' }, { status: 409 }, corsHeaders);
  const newUser = { id: body.id || `user-${Date.now()}`, username, password: await hashPassword(rawPassword), role, isDefault: !!body.isDefault };
  const saved = await saveState(env, { ...state, users: [...state.users, newUser] });
  return json({ ok: true, user: newUser, updatedAt: saved.updatedAt }, { status: 201 }, corsHeaders);
}

async function deleteUser(request, path, env, corsHeaders) {
  const stateResult = await getState(env);
  const state = stateResult.state;
  if (!validateToken(request, state)) return unauthorized(corsHeaders);
  const userId = decodeURIComponent(path.slice('/api/users/'.length));
  if (!userId) return json({ ok: false, error: 'Missing user id.' }, { status: 400 }, corsHeaders);
  if (state.users.length <= 1) return json({ ok: false, error: 'Cannot delete the last user.' }, { status: 400 }, corsHeaders);
  const nextUsers = state.users.filter(u => String(u.id) !== userId);
  const nextSessions = pruneExpiredSessions(state.sessions || []).filter(session => String(session.userId) !== userId);
  const saved = await saveState(env, { ...state, users: nextUsers, sessions: nextSessions });
  return json({ ok: true, data: nextUsers, updatedAt: saved.updatedAt }, { status: 200 }, corsHeaders);
}

function getPhotoKeyFromPath(path) {
  const prefix = '/api/photos/';
  return path.startsWith(prefix) ? decodeURIComponent(path.slice(prefix.length)) : '';
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
  await env.PHOTOS.put(key, file.stream(), { httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' } });
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

async function requireWriteAuth(request, env, corsHeaders) {
  const stateResult = await getState(env);
  if (!validateToken(request, stateResult.state)) return { authorized: false, response: unauthorized(corsHeaders), state: stateResult.state };
  return { authorized: true, state: stateResult.state };
}

async function handleCreateCommentOrReply(request, env, corsHeaders) {
  const body = await request.json();
  const stateResult = await getState(env);
  const state = stateResult.state;
  const isAdmin = validateToken(request, state);

  const comments = Array.isArray(state.comments) ? state.comments : [];

  // It is a reply to a comment
  if (body.commentId) {
    const comment = comments.find(c => c.id === body.commentId);
    if (!comment) {
      return json({ ok: false, error: 'Comment not found.' }, { status: 404 }, corsHeaders);
    }
    const reply = {
      id: `reply-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      authorName: isAdmin ? (body.authorName || 'Admin') : String(body.authorName || 'Visitor').trim(),
      text: String(body.text || '').trim(),
      createdAt: new Date().toISOString(),
      isAdmin: isAdmin
    };
    if (!reply.text) {
      return json({ ok: false, error: 'Reply text is required.' }, { status: 400 }, corsHeaders);
    }
    if (!reply.authorName) {
      return json({ ok: false, error: 'Author name is required.' }, { status: 400 }, corsHeaders);
    }
    comment.replies = Array.isArray(comment.replies) ? comment.replies : [];
    comment.replies.push(reply);
    
    const saved = await saveState(env, { ...state, comments });
    return json({ ok: true, comment, updatedAt: saved.updatedAt }, { status: 200 }, corsHeaders);
  }

  // It is a parent comment
  const newItemId = String(body.itemId || '').trim();
  const newItemType = String(body.itemType || '').trim(); // 'gallery', 'past_collection', 'catalog_item'
  const authorName = String(body.authorName || '').trim();
  const text = String(body.text || '').trim();

  if (!newItemId || !newItemType) {
    return json({ ok: false, error: 'itemId and itemType are required.' }, { status: 400 }, corsHeaders);
  }
  if (!authorName) {
    return json({ ok: false, error: 'Your name is required.' }, { status: 400 }, corsHeaders);
  }
  if (!text) {
    return json({ ok: false, error: 'Comment text is required.' }, { status: 400 }, corsHeaders);
  }

  const newComment = {
    id: `comment-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    itemId: newItemId,
    itemType: newItemType,
    authorName: isAdmin ? `${authorName} (Admin)` : authorName,
    text,
    createdAt: new Date().toISOString(),
    isAdmin: isAdmin,
    replies: []
  };

  comments.push(newComment);
  const saved = await saveState(env, { ...state, comments });
  return json({ ok: true, comment: newComment, updatedAt: saved.updatedAt }, { status: 201 }, corsHeaders);
}

async function handleDeleteCommentOrReply(request, env, corsHeaders) {
  const stateResult = await getState(env);
  const state = stateResult.state;
  if (!validateToken(request, state)) return unauthorized(corsHeaders);

  const url = new URL(request.url);
  const commentId = url.searchParams.get('commentId');
  const replyId = url.searchParams.get('replyId');

  if (!commentId) {
    return json({ ok: false, error: 'commentId query parameter is required.' }, { status: 400 }, corsHeaders);
  }

  const comments = Array.isArray(state.comments) ? state.comments : [];

  if (replyId) {
    // Delete a reply inside a comment
    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      return json({ ok: false, error: 'Comment not found.' }, { status: 404 }, corsHeaders);
    }
    const initialLen = comment.replies?.length || 0;
    comment.replies = (comment.replies || []).filter(r => r.id !== replyId);
    if (comment.replies.length === initialLen) {
      return json({ ok: false, error: 'Reply not found.' }, { status: 404 }, corsHeaders);
    }
  } else {
    // Delete the entire comment
    const initialLen = comments.length;
    const nextComments = comments.filter(c => c.id !== commentId);
    if (nextComments.length === initialLen) {
      return json({ ok: false, error: 'Comment not found.' }, { status: 404 }, corsHeaders);
    }
    state.comments = nextComments;
  }

  const saved = await saveState(env, { ...state, comments: state.comments || comments });
  return json({ ok: true, updatedAt: saved.updatedAt }, { status: 200 }, corsHeaders);
}

async function handleCreateMessage(request, env, corsHeaders) {
  const body = await request.json();
  const stateResult = await getState(env);
  const state = stateResult.state;

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const text = String(body.text || '').trim();

  if (!name) {
    return json({ ok: false, error: 'Name is required.' }, { status: 400 }, corsHeaders);
  }
  if (!email) {
    return json({ ok: false, error: 'Email or Contact info is required.' }, { status: 400 }, corsHeaders);
  }
  if (!text) {
    return json({ ok: false, error: 'Message content is required.' }, { status: 400 }, corsHeaders);
  }

  const messages = Array.isArray(state.messages) ? state.messages : [];
  const newMessage = {
    id: `msg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    name,
    email,
    text,
    createdAt: new Date().toISOString(),
    reviewed: false
  };

  messages.push(newMessage);
  const saved = await saveState(env, { ...state, messages });
  return json({ ok: true, message: newMessage, updatedAt: saved.updatedAt }, { status: 201 }, corsHeaders);
}

async function createSubscriber(request, env, corsHeaders) {
  await ensureSchema(env);
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const source = String(body.source || 'homepage').trim();

  if (!email || !email.includes('@')) {
    return json({ ok: false, error: 'A valid email address is required.' }, { status: 400 }, corsHeaders);
  }

  try {
    const existing = await env.DB.prepare('SELECT id FROM subscribers WHERE email = ?').bind(email).first();
    if (existing) {
      return json({ ok: true, message: 'You are already subscribed to our newsletter!', alreadySubscribed: true }, { status: 200 }, corsHeaders);
    }

    const id = `sub-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = new Date().toISOString();
    await env.DB.prepare('INSERT INTO subscribers (id, email, created_at, source) VALUES (?, ?, ?, ?)')
      .bind(id, email, createdAt, source)
      .run();

    return json({ ok: true, message: 'Successfully subscribed to our newsletter!', id }, { status: 201 }, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: 'Database insertion failed.', details: err.message }, { status: 500 }, corsHeaders);
  }
}

async function getSubscribers(request, env, corsHeaders) {
  const auth = await requireWriteAuth(request, env, corsHeaders);
  if (!auth.authorized) return auth.response;

  await ensureSchema(env);
  try {
    const { results } = await env.DB.prepare('SELECT id, email, created_at AS createdAt, source FROM subscribers ORDER BY created_at DESC').all();
    return json({ ok: true, data: results || [] }, { status: 200 }, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: 'Failed to retrieve subscribers.', details: err.message }, { status: 500 }, corsHeaders);
  }
}

async function deleteSubscriber(request, env, corsHeaders) {
  const auth = await requireWriteAuth(request, env, corsHeaders);
  if (!auth.authorized) return auth.response;

  await ensureSchema(env);
  const url = new URL(request.url);
  const subscriberId = url.searchParams.get('id');

  if (!subscriberId) {
    return json({ ok: false, error: 'Missing subscriber id parameter.' }, { status: 400 }, corsHeaders);
  }

  try {
    const result = await env.DB.prepare('DELETE FROM subscribers WHERE id = ?').bind(subscriberId).run();
    return json({ ok: true, message: 'Subscriber deleted successfully.', changes: result.meta?.changes || 1 }, { status: 200 }, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: 'Failed to delete subscriber.', details: err.message }, { status: 500 }, corsHeaders);
  }
}

async function handleCreateRequest(request, env, corsHeaders) {
  await ensureSchema(env);
  
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return json({ ok: false, error: 'Invalid multipart/form-data request.' }, { status: 400 }, corsHeaders);
  }

  const name = String(formData.get('name') || '').trim();
  const contactMethod = String(formData.get('contact_method') || '').trim();
  const contactValue = String(formData.get('contact_value') || '').trim();
  const message = String(formData.get('message') || '').trim();

  if (!name) {
    return json({ ok: false, error: 'Name is required.' }, { status: 400 }, corsHeaders);
  }
  if (!['email', 'whatsapp'].includes(contactMethod)) {
    return json({ ok: false, error: 'Contact method must be email or whatsapp.' }, { status: 400 }, corsHeaders);
  }
  if (!contactValue) {
    return json({ ok: false, error: 'Contact details are required.' }, { status: 400 }, corsHeaders);
  }
  if (!message) {
    return json({ ok: false, error: 'Message is required.' }, { status: 400 }, corsHeaders);
  }

  // Validate contact value
  if (contactMethod === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactValue)) {
      return json({ ok: false, error: 'Please enter a valid email address.' }, { status: 400 }, corsHeaders);
    }
  } else if (contactMethod === 'whatsapp') {
    const digitsOnly = contactValue.replace(/\D/g, '');
    if (digitsOnly.length < 5) {
      return json({ ok: false, error: 'Please enter a valid WhatsApp number (must include digits).' }, { status: 400 }, corsHeaders);
    }
  }

  let photoKey = null;
  const file = formData.get('photo');
  if (file && typeof file !== 'string') {
    const contentType = file.type || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return json({ ok: false, error: 'Only image files are allowed.' }, { status: 400 }, corsHeaders);
    }
    if (!env.PHOTOS) {
      return json({ ok: false, error: 'R2 binding PHOTOS is not available.' }, { status: 500 }, corsHeaders);
    }
    const ext = extensionFromContentType(contentType);
    photoKey = `requests/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    try {
      await env.PHOTOS.put(photoKey, file.stream(), {
        httpMetadata: { contentType, cacheControl: 'public, max-age=31536000, immutable' }
      });
    } catch (err) {
      return json({ ok: false, error: 'Failed to upload photo to R2.', details: err.message }, { status: 500 }, corsHeaders);
    }
  }

  const id = `req-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const createdAt = new Date().toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO requests (id, name, contact_method, contact_value, message, photo_key, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'new', ?)
    `).bind(id, name, contactMethod, contactValue, message, photoKey, createdAt).run();

    const newRequest = {
      id,
      name,
      contact_method: contactMethod,
      contact_value: contactValue,
      message,
      photo_key: photoKey,
      status: 'new',
      created_at: createdAt
    };

    return json({ ok: true, request: newRequest }, { status: 201 }, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: 'Failed to save request to database.', details: err.message }, { status: 500 }, corsHeaders);
  }
}

async function getAdminRequests(request, env, corsHeaders) {
  const auth = await requireWriteAuth(request, env, corsHeaders);
  if (!auth.authorized) return auth.response;

  await ensureSchema(env);
  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status');

  try {
    let query = 'SELECT id, name, contact_method, contact_value, message, photo_key, status, created_at FROM requests';
    let params = [];
    if (statusFilter) {
      query += ' WHERE status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY created_at DESC';

    const { results } = await env.DB.prepare(query).bind(...params).all();
    return json({ ok: true, data: results || [] }, { status: 200 }, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: 'Failed to retrieve requests.', details: err.message }, { status: 500 }, corsHeaders);
  }
}

async function updateAdminRequestStatus(request, path, env, corsHeaders) {
  const auth = await requireWriteAuth(request, env, corsHeaders);
  if (!auth.authorized) return auth.response;

  await ensureSchema(env);
  const requestId = decodeURIComponent(path.slice('/api/admin/requests/'.length));
  if (!requestId) return json({ ok: false, error: 'Missing request id.' }, { status: 400 }, corsHeaders);

  const body = await request.json().catch(() => ({}));
  const status = String(body.status || '').trim();

  if (!['new', 'in_progress', 'fulfilled'].includes(status)) {
    return json({ ok: false, error: 'Invalid status. Must be one of: new, in_progress, fulfilled.' }, { status: 400 }, corsHeaders);
  }

  try {
    const result = await env.DB.prepare('UPDATE requests SET status = ? WHERE id = ?').bind(status, requestId).run();
    if (result.meta?.changes === 0) {
      return json({ ok: false, error: 'Request not found.' }, { status: 404 }, corsHeaders);
    }
    return json({ ok: true, message: 'Request status updated successfully.', id: requestId, status }, { status: 200 }, corsHeaders);
  } catch (err) {
    return json({ ok: false, error: 'Failed to update request status.', details: err.message }, { status: 500 }, corsHeaders);
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    try {
      if (path === '/' || path === '/api/health') return json({ ok: true, service: 'gfbaa', message: 'Cloudflare Worker is running.', bindings: { DB: Boolean(env.DB), PHOTOS: Boolean(env.PHOTOS), ASSETS: Boolean(env.ASSETS) } }, { status: 200 }, corsHeaders);
      if (request.method === 'GET' && path === '/api/state') {
        const stateResult = await getState(env);
        return json({ ok: true, ...stateResult, state: publicState(stateResult.state) }, { status: 200 }, corsHeaders);
      }
      if (request.method === 'POST' && path === '/api/requests') {
        const contentType = request.headers.get('Content-Type') || '';
        if (contentType.includes('multipart/form-data')) {
          return handleCreateRequest(request, env, corsHeaders);
        } else {
          return createPurchaseRequest(request, env, corsHeaders);
        }
      }
      if (request.method === 'GET' && path === '/api/admin/requests') return getAdminRequests(request, env, corsHeaders);
      if (request.method === 'PATCH' && path.startsWith('/api/admin/requests/')) return updateAdminRequestStatus(request, path, env, corsHeaders);
      if (request.method === 'POST' && path === '/api/messages') return handleCreateMessage(request, env, corsHeaders);
      if (request.method === 'POST' && path === '/api/sessions') return createSession(request, env, corsHeaders);
      if (request.method === 'POST' && path === '/api/newsletter/subscribe') return createSubscriber(request, env, corsHeaders);
      if (request.method === 'GET' && path === '/api/newsletter/subscribers') return getSubscribers(request, env, corsHeaders);
      if (request.method === 'DELETE' && path === '/api/newsletter/subscribers') return deleteSubscriber(request, env, corsHeaders);
      if (request.method === 'POST' && path === '/api/comments') return handleCreateCommentOrReply(request, env, corsHeaders);
      if (request.method === 'DELETE' && path === '/api/comments') return handleDeleteCommentOrReply(request, env, corsHeaders);
      if (request.method === 'DELETE' && path === '/api/sessions/current') return deleteCurrentSession(request, env, corsHeaders);
      if ((request.method === 'PUT' || request.method === 'POST') && path === '/api/state') {
        const auth = await requireWriteAuth(request, env, corsHeaders);
        if (!auth.authorized) return auth.response;
        const body = await request.json();
        const incomingState = body.state || body;
        const mergedState = {
          ...incomingState,
          sessions: auth.state.sessions || [],
          users: Object.prototype.hasOwnProperty.call(incomingState, 'users') && Array.isArray(incomingState.users)
            ? incomingState.users
            : (auth.state.users || []),
        };
        const saved = await saveState(env, mergedState);
        return json({ ok: true, ...saved, state: publicState(saved.state) }, { status: 200 }, corsHeaders);
      }
      if (request.method === 'GET' && path === '/api/products') { const { state, updatedAt } = await getState(env); return json({ ok: true, data: state.products, updatedAt }, { status: 200 }, corsHeaders); }
      if (request.method === 'GET' && path === '/api/batches') { const { state, updatedAt } = await getState(env); return json({ ok: true, data: state.batches, updatedAt }, { status: 200 }, corsHeaders); }
      if (request.method === 'GET' && path === '/api/catalog-items') { const { state, updatedAt } = await getState(env); return json({ ok: true, data: state.catalogItems, updatedAt }, { status: 200 }, corsHeaders); }
      if (request.method === 'GET' && path === '/api/sales') { const { state, updatedAt } = await getState(env); return json({ ok: true, data: state.sales, updatedAt }, { status: 200 }, corsHeaders); }
      if (request.method === 'GET' && path === '/api/requests') { const { state, updatedAt } = await getState(env); return json({ ok: true, data: state.purchaseRequests, updatedAt }, { status: 200 }, corsHeaders); }
      if (request.method === 'GET' && path === '/api/users') {
        const auth = await requireWriteAuth(request, env, corsHeaders);
        if (!auth.authorized) return auth.response;
        const { state, updatedAt } = await getState(env);
        return json({ ok: true, data: state.users, updatedAt }, { status: 200 }, corsHeaders);
      }
      if (request.method === 'POST' && path === '/api/users') return createUser(request, env, corsHeaders);
      if (request.method === 'DELETE' && path.startsWith('/api/users/')) return deleteUser(request, path, env, corsHeaders);
      if (request.method === 'POST' && path === '/api/photos') {
        const auth = await requireWriteAuth(request, env, corsHeaders);
        if (!auth.authorized) return auth.response;
        return handlePhotoUpload(request, env, corsHeaders);
      }
      if (request.method === 'GET' && path.startsWith('/api/photos/')) return handlePhotoRead(path, env, corsHeaders);
      if (env.ASSETS && request.method === 'GET') return env.ASSETS.fetch(request);
      return json({ ok: false, error: 'Route not found.', path }, { status: 404 }, corsHeaders);
    } catch (error) {
      return json({ ok: false, error: 'Internal Server Error', details: error.message }, { status: 500 }, corsHeaders);
    }
  },
};

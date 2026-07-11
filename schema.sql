-- Schema file for Cloudflare D1 Database gfbaa-preloved
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  source TEXT
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('email', 'whatsapp')),
  contact_value TEXT NOT NULL,
  message TEXT NOT NULL,
  photo_key TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'fulfilled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

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

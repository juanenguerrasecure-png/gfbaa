import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import worker from './worker/index.js'

class MockD1 {
  constructor() {
    this.data = new Map();
    try {
      if (fs.existsSync('.d1_local.json')) {
        const parsed = JSON.parse(fs.readFileSync('.d1_local.json', 'utf8'));
        for (const [k, v] of Object.entries(parsed)) {
          this.data.set(k, v);
        }
      }
    } catch (e) {
      console.warn('Failed to load local D1 JSON:', e);
    }
  }
  
  save() {
    try {
      const obj = {};
      for (const [k, v] of this.data.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync('.d1_local.json', JSON.stringify(obj, null, 2), 'utf8');
    } catch (e) {
      console.warn('Failed to save local D1 JSON:', e);
    }
  }

  prepare(sql) {
    const self = this;
    return {
      bind(...args) {
        return {
          async first() {
            if (sql.includes('SELECT')) {
              const id = args[0];
              const row = self.data.get(id);
              return row ? { value: row.value, updated_at: row.updated_at } : null;
            }
            return null;
          },
          async run() {
            if (sql.includes('INSERT')) {
              const id = args[0];
              const value = args[1];
              const updated_at = args[2];
              self.data.set(id, { value, updated_at });
              self.save();
            }
            return { success: true };
          }
        };
      },
      async run() {
        return { success: true };
      }
    };
  }
}

class MockR2 {
  constructor() {
    if (!fs.existsSync('.r2_local')) {
      try {
        fs.mkdirSync('.r2_local', { recursive: true });
      } catch (e) {}
    }
  }

  async put(key, stream, options) {
    const targetPath = path.join('.r2_local', key.replace(/\//g, '_'));
    
    const chunks = [];
    const reader = stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const buffer = Buffer.concat(chunks);
    fs.writeFileSync(targetPath, buffer);
    
    const metaPath = targetPath + '.meta';
    fs.writeFileSync(metaPath, JSON.stringify({
      contentType: options?.httpMetadata?.contentType || 'image/jpeg',
      etag: 'etag-' + Date.now()
    }));
  }

  async get(key) {
    const targetPath = path.join('.r2_local', key.replace(/\//g, '_'));
    if (!fs.existsSync(targetPath)) return null;
    
    const body = fs.readFileSync(targetPath);
    let meta = { contentType: 'image/jpeg', etag: 'etag-static' };
    try {
      meta = JSON.parse(fs.readFileSync(targetPath + '.meta', 'utf8'));
    } catch (e) {}

    return {
      body,
      httpEtag: meta.etag,
      writeHttpMetadata(headers) {
        headers.set('Content-Type', meta.contentType);
      }
    };
  }
}

const mockDB = new MockD1();
const mockPhotos = new MockR2();

function workerDevServerPlugin() {
  return {
    name: 'worker-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api')) {
          try {
            const url = `http://${req.headers.host || 'localhost:3000'}${req.url}`;
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) {
                if (Array.isArray(value)) {
                  value.forEach(v => headers.append(key, v));
                } else {
                  headers.set(key, value);
                }
              }
            }

            let body = null;
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              body = await new Promise((resolve, reject) => {
                const chunks = [];
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', () => resolve(Buffer.concat(chunks)));
                req.on('error', err => reject(err));
              });
            }

            const webReq = new Request(url, {
              method: req.method,
              headers,
              body,
              duplex: body ? 'half' : undefined
            });

            const response = await worker.fetch(webReq, { DB: mockDB, PHOTOS: mockPhotos });

            res.statusCode = response.status;
            response.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });

            const responseBody = await response.arrayBuffer();
            res.end(Buffer.from(responseBody));
          } catch (error) {
            console.error('Worker dev server bridge error:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'Internal Server Error', details: error.message }));
          }
        } else {
          next();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), workerDevServerPlugin()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    hmr: process.env.DISABLE_HMR !== 'true',
    // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
})

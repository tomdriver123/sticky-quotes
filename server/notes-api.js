'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { URL } = require('node:url');

// Configuration (all optional). Defaults keep a fresh clone self-contained: notes land in ./data,
// nothing is committed anywhere, and the server only listens on localhost.
//   STICKY_QUOTES_PORT         listen port (default 4310)
//   STICKY_QUOTES_HOST         bind address (default 127.0.0.1; put a reverse proxy or Tailscale in front for phones)
//   STICKY_QUOTES_DATA_DIR     where note markdown files live (default <repo>/data, gitignored)
//   STICKY_QUOTES_COMMIT_REPO  a git repo that CONTAINS the data dir; when set, saves are auto-committed there
//                              with a pathspec limited to the data dir, under a separate automation identity
//   STICKY_QUOTES_CORS_ORIGIN  allowed origin for cross-origin callers (default: none, same-origin only)
const PORT = Number(process.env.STICKY_QUOTES_PORT) || 4310;
const HOST = process.env.STICKY_QUOTES_HOST || '127.0.0.1';
const DATA_DIR = path.resolve(process.env.STICKY_QUOTES_DATA_DIR || path.resolve(__dirname, '../data'));
const COMMIT_REPO = process.env.STICKY_QUOTES_COMMIT_REPO ? path.resolve(process.env.STICKY_QUOTES_COMMIT_REPO) : null;
const CORS_ORIGIN = process.env.STICKY_QUOTES_CORS_ORIGIN || '';
const WWW_DIR = path.resolve(__dirname, '../www');
const GIT = process.env.GIT_BIN || '/usr/bin/git';
const AUTOMATION_IDENT = ['-c', 'user.name=Shadow Automation', '-c', 'user.email=shadow-automation@localhost'];

const CONTENT_TYPES = {
  html: 'text/html', js: 'application/javascript', css: 'text/css',
  json: 'application/json', webmanifest: 'application/manifest+json',
  png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml',
  ico: 'image/x-icon', woff2: 'font/woff2',
};

const ID_RE = /^[A-Za-z0-9T:\-]+$/;

// ── Frontmatter parse/serialize ───────────────────────────────────────────────

function parseFile(raw) {
  const fm = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/m.exec(raw);
  if (!fm) return { createdAt: '', editedAt: '', body: raw };
  const header = fm[1];
  const body = fm[2];
  const get = (key) => { const m = new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(header); return m ? m[1].trim() : ''; };
  return { createdAt: get('createdAt'), editedAt: get('editedAt'), body };
}

function serializeFile({ createdAt, editedAt, body }) {
  return `---\ncreatedAt: ${createdAt}\neditedAt: ${editedAt}\n---\n${body}`;
}

// ── ID / file helpers ─────────────────────────────────────────────────────────

function makeId() {
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
  const hex = crypto.randomBytes(3).toString('hex');
  return `${iso}-${hex}`;
}

function idToPath(id) { return path.join(DATA_DIR, `${id}.md`); }

function readNote(id) {
  const fp = idToPath(id);
  if (!fs.existsSync(fp)) return null;
  const { createdAt, editedAt, body } = parseFile(fs.readFileSync(fp, 'utf8'));
  return { id, body, createdAt, editedAt };
}

function writeNote(id, createdAt, editedAt, body) {
  const fp = idToPath(id);
  const tmp = fp + '.tmp';
  fs.writeFileSync(tmp, serializeFile({ createdAt, editedAt, body }), 'utf8');
  fs.renameSync(tmp, fp);
  return { id, body, createdAt, editedAt };
}

function allNotes() {
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.md') && f !== '.gitkeep')
    .map(f => readNote(f.slice(0, -3)))
    .filter(Boolean)
    .sort((a, b) => (b.editedAt || '') < (a.editedAt || '') ? -1 : 1);
}

// ── Auto-commit (debounced, opt-in) ──────────────────────────────────────────
// Only when STICKY_QUOTES_COMMIT_REPO is set AND the data dir sits inside that repo. The commit is
// limited to the data dir pathspec, so nothing a human has staged in that repo is ever swept in.

function commitPathspec() {
  if (!COMMIT_REPO) return null;
  const rel = path.relative(COMMIT_REPO, DATA_DIR);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return rel;
}

let commitTimer = null;
function scheduleCommit() {
  const rel = commitPathspec();
  if (!rel) return;
  if (commitTimer) clearTimeout(commitTimer);
  commitTimer = setTimeout(() => {
    commitTimer = null;
    try {
      execFileSync(GIT, ['-C', COMMIT_REPO, 'add', '--', rel], { stdio: 'pipe' });
      execFileSync(GIT, ['-C', COMMIT_REPO, ...AUTOMATION_IDENT, 'commit', '-q', '-m', 'auto(sticky-quotes): save notes', '--', rel], { stdio: 'pipe' });
    } catch (e) {
      // "nothing to commit" exits non-zero, which is fine; log anything unexpected
      const msg = e.stderr ? e.stderr.toString().trim() : e.message;
      if (msg && !msg.includes('nothing to commit') && !msg.includes('nothing added')) {
        process.stderr.write(`[auto-commit] ${msg}\n`);
      }
    }
  }, 2000);
}

// ── CORS / response helpers ───────────────────────────────────────────────────

function cors(res) {
  if (!CORS_ORIGIN) return; // same-origin only: the built app is served by this process
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let buf = '';
    req.on('data', c => { buf += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(buf)); }
      catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

// ── Static file serving ───────────────────────────────────────────────────────

function serveStatic(res, urlPath) {
  const wwwExists = fs.existsSync(WWW_DIR);
  if (!wwwExists) {
    return json(res, 503, { error: 'www/ not built. Run npm run build first.' });
  }
  // Decode and resolve, guard traversal
  let rel = decodeURIComponent(urlPath === '/' ? '/index.html' : urlPath);
  let abs = path.resolve(WWW_DIR, '.' + rel);
  if (!abs.startsWith(WWW_DIR + path.sep) && abs !== WWW_DIR) {
    return json(res, 400, { error: 'Bad path' });
  }
  if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    abs = path.join(WWW_DIR, 'index.html'); // SPA fallback
  }
  const ext = path.extname(abs).slice(1).toLowerCase();
  const ct = CONTENT_TYPES[ext] || 'application/octet-stream';
  cors(res);
  res.writeHead(200, { 'Content-Type': ct });
  fs.createReadStream(abs).pipe(res);
}

// ── Validate id ───────────────────────────────────────────────────────────────

function validId(id) {
  return id && ID_RE.test(id) && !id.includes('/') && !id.includes('..');
}

// ── Request handler ───────────────────────────────────────────────────────────

async function handle(req, res) {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = u.pathname;
  const method = req.method.toUpperCase();

  // OPTIONS
  if (method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    return res.end();
  }

  // API routes
  if (pathname.startsWith('/api/notes')) {
    const parts = pathname.split('/').filter(Boolean); // ['api','notes',?id]
    const id = parts[2];

    // GET /api/notes
    if (method === 'GET' && !id) {
      return json(res, 200, { notes: allNotes() });
    }

    // GET /api/notes/:id
    if (method === 'GET' && id) {
      if (!validId(id)) return json(res, 400, { error: 'Invalid id' });
      const note = readNote(id);
      return note ? json(res, 200, note) : json(res, 404, { error: 'Not found' });
    }

    // POST /api/notes
    if (method === 'POST' && !id) {
      const data = await readBody(req);
      if (!data.body || typeof data.body !== 'string' || !data.body.trim()) {
        return json(res, 400, { error: 'body is required' });
      }
      const newId = makeId();
      const now = new Date().toISOString();
      const note = writeNote(newId, now, now, data.body);
      scheduleCommit();
      return json(res, 201, note);
    }

    // PUT /api/notes/:id
    if (method === 'PUT' && id) {
      if (!validId(id)) return json(res, 400, { error: 'Invalid id' });
      const existing = readNote(id);
      if (!existing) return json(res, 404, { error: 'Not found' });
      const data = await readBody(req);
      if (!data.body || typeof data.body !== 'string' || !data.body.trim()) {
        return json(res, 400, { error: 'body is required' });
      }
      const note = writeNote(id, existing.createdAt, new Date().toISOString(), data.body);
      scheduleCommit();
      return json(res, 200, note);
    }

    // DELETE /api/notes/:id
    if (method === 'DELETE' && id) {
      if (!validId(id)) return json(res, 400, { error: 'Invalid id' });
      const fp = idToPath(id);
      if (!fs.existsSync(fp)) return json(res, 404, { error: 'Not found' });
      fs.unlinkSync(fp);
      scheduleCommit();
      cors(res);
      res.writeHead(204);
      return res.end();
    }

    return json(res, 405, { error: 'Method not allowed' });
  }

  // Static serving for non-API GET requests
  if (method === 'GET') {
    return serveStatic(res, pathname);
  }

  return json(res, 404, { error: 'Not found' });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

fs.mkdirSync(DATA_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    await handle(req, res);
  } catch (e) {
    if (e.message === 'invalid JSON') {
      return json(res, 400, { error: 'Malformed JSON body' });
    }
    process.stderr.write(`[server error] ${e.stack || e.message}\n`);
    try { json(res, 500, { error: 'Internal server error' }); } catch {}
  }
});

server.listen(PORT, HOST, () => {
  const wwwReady = fs.existsSync(WWW_DIR);
  console.log(`Sticky Quotes API listening on http://${HOST}:${PORT}`);
  console.log(`Notes dir: ${DATA_DIR}`);
  console.log(`Static serving: ${wwwReady ? `active (${WWW_DIR})` : 'inactive (www/ not built)'}`);
  if (COMMIT_REPO && !commitPathspec()) {
    console.warn(`[auto-commit] disabled: ${DATA_DIR} is not inside STICKY_QUOTES_COMMIT_REPO (${COMMIT_REPO})`);
  } else {
    console.log(`Auto-commit: ${COMMIT_REPO ? `on (${COMMIT_REPO}, pathspec ${commitPathspec()})` : 'off'}`);
  }
});

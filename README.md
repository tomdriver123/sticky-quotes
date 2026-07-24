# sticky-quotes

Ionic Angular app for **Sticky Quotes** — three tabs: Notes, Votes, Quotes. v1 is the Notes tab: title-less notes with full CRUD, each persisted as a markdown file on the Mac.

> **Project docs live outside this folder**:
> [`vault/projects/sticky-quotes/`](../vault/projects/sticky-quotes/) — start at its `README.md`.
> The v1 spec and definition-of-done is `build-brief.md`.

_Renamed from `sticky-quotes-opus/` on 2026-07-24 — the model-bake-off framing was retired (one codebase, multiple models). History in `vault/projects/sticky-quotes/decisions.md`._

## Run it

Two processes in dev:

```bash
node server/notes-api.js    # file API + static server on http://localhost:4310
npm start                   # Angular dev server on http://localhost:4300 (proxies /api → :4310)
```

One process in production: `npm run build`, then the same `node server/notes-api.js` serves the built `www/` **and** the API on **:4310**. A launchd agent (`server/com.shadow.sticky-quotes.plist`, label `com.shadow.sticky-quotes`) keeps it running — see "Server" below.

Port **4300** (dev) is pinned in `angular.json`; **4310** is the API/production port. The Shadow dashboard keeps 4200.

Other scripts: `npm run build` (→ `www/`), `npm test` (Karma/Jasmine), `npm run lint` (ESLint).

## Where notes live

Repo-root [`../sticky-quotes-data/`](../sticky-quotes-data/) — one markdown file per note (`createdAt`/`editedAt` frontmatter + body), git-tracked. The server auto-commits that folder a few seconds after each write; git history is the backup story. **Browser storage is never the source of truth** (it's evictable — permanence is the product thesis).

All storage access in the app goes through the `NotesRepository` abstract class (`src/app/services/notes-repository.ts`); `HttpNotesRepository` is the implementation. Components never touch storage directly.

## Phone access (LAN)

Open `http://<mac-hostname>.local:4310` on the phone (same Wi-Fi), then "Add to Home Screen" for a standalone web clip. No service worker in v1 (needs HTTPS over LAN); the data lives on the Mac anyway, so offline capture is a v1.1 problem (outbox).

## Server

`server/notes-api.js` — single-file Node HTTP server, zero npm dependencies. Routes: `GET/POST /api/notes`, `GET/PUT/DELETE /api/notes/:id`; everything else serves `www/` with an `index.html` SPA fallback. Writes are atomic (temp file + rename).

Install the launchd agent:

```bash
mkdir -p ~/Library/Logs/shadow
cp server/com.shadow.sticky-quotes.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.shadow.sticky-quotes.plist
curl http://localhost:4310/api/notes   # verify
```

The plist hardcodes the node binary path (launchd has no shell PATH) — check it matches `which node` before loading. Logs: `~/Library/Logs/shadow/sticky-quotes.{stdout,stderr}.log`.

## Stack

Pinned to match [`dashboard/`](../dashboard/) exactly, so anything learned in one app transfers to the other:

- Angular 20 · Ionic 8 · Capacitor 8 · TypeScript 5.9
- **NgModules, not standalone components** — every component carries `standalone: false`, and `@angular-eslint/prefer-standalone` is off
- Classic `@angular-devkit/build-angular:browser` builder
- SCSS, dark mode always on (`dark.always.css`)

Deliberately dropped from the dashboard's dependency list: `chart.js`, `marked`, `ngx-markdown`, `swiper`. Add them back if a feature actually needs them.

## Layout

```
src/app/
├── app.module.ts / app-routing.module.ts   '' → /tabs
├── models/note.model.ts                    Note = id + body + createdAt + editedAt (no title, by design)
├── services/                               NotesRepository (abstract) + HttpNotesRepository
├── tabs/                                   ion-tabs shell, tab bar, child routes
└── pages/
    ├── notes/                              list + note-editor/ (create/edit/delete)
    ├── votes/                              blank (disabled tab)
    └── quotes/                             blank (disabled tab)
server/
├── notes-api.js                            the file API
└── com.shadow.sticky-quotes.plist          launchd template
```

## Note on dashboard conventions

`dashboard/node_modules/` has ~54k files accidentally committed to git. This app's build artifacts are covered by explicit `sticky-quotes/…` lines in the repo root `.gitignore` — check `git status` before committing if you change build tooling.

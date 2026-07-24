# sticky-quotes-opus

Ionic Angular app for **Sticky Quotes** — three tabs: Notes, Votes, Quotes.

The `-opus` suffix marks this as the **Opus-built variant** of a model bake-off. Sibling variants (`sticky-quotes-sonnet/`, `sticky-quotes-fable/`) may be built from the same brief for comparison.

> **Project docs live outside this repo folder**, so all variants share one source of truth:
> [`vault/projects/sticky-quotes/`](../vault/projects/sticky-quotes/) — start at its `README.md`.
> The spec each variant builds from is `build-brief.md`.

## Run it

```bash
npm install
npm start       # http://localhost:4300
```

Port **4300** is pinned in `angular.json` so this doesn't collide with the Shadow dashboard on 4200. Siblings should use 4301 (sonnet) and 4302 (fable).

Other scripts: `npm run build` (→ `www/`), `npm test` (Karma/Jasmine), `npm run lint` (ESLint).

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
├── tabs/                                   ion-tabs shell, tab bar, child routes
└── pages/
    ├── notes/    5 files: .page.ts/.html/.scss + .module.ts + -routing.module.ts
    ├── votes/
    └── quotes/
```

All three pages are intentionally blank — header + empty `ion-content`. Adding a page means copying a folder, then registering it in `tabs-routing.module.ts` and `tabs.page.html`.

## Note on dashboard conventions

`dashboard/node_modules/` has ~54k files accidentally committed to git. This app's build artifacts are covered by the `sticky-quotes-*/` globs in the repo root `.gitignore` — check `git status` before committing if you change build tooling.

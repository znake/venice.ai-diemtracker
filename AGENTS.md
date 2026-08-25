# PROJECT KNOWLEDGE BASE — Diemtracker

**Generated:** 2026-08-25
**Commit:** 62671f8 (main)

## OVERVIEW
React 19 + Vite 7 + Tailwind 4 SPA tracking Venice.ai API balances (USD/DIEM) across multiple API keys, with usage analytics and per-wallet/per-key breakdowns. Client-side only — no backend, no router, no state library, no tests.

## STRUCTURE
```
├── index.html          # PWA shell (manifest link, theme #09090b, safe-area viewport)
├── public/             # PWA assets: manifest.json, favicon.svg, apple-touch-icon, README screenshots
├── src/
│   ├── api/venice.js   # Entire Venice API client + aggregation (308 LOC, named exports)
│   ├── components/     # KeyCard, KeyForm, UsageDashboard — display only
│   ├── hooks/          # useLocalStorage (persistence), useInterval (auto-refresh)
│   ├── App.jsx         # THE controller: state, fetch orchestration, filtering (507 LOC)
│   ├── main.jsx        # StrictMode bootstrap
│   └── index.css       # Tailwind 4 entry + dark-theme/safe-area globals
├── Dockerfile          # Multi-stage: node:22 build → nginx serve
└── nginx.conf          # SPA fallback, caching, gzip, security headers
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Add/change API call | `src/api/venice.js` | Return error objects, never throw |
| State / refresh / filtering logic | `src/App.jsx` | All orchestration lives here |
| Dashboard UI (models, per-key tables) | `src/components/UsageDashboard.jsx` | Internal subcomponents — see NOTES |
| Add/edit key modal | `src/components/KeyForm.jsx` | Controlled form, inline validation |
| Persistence | `src/hooks/useLocalStorage.js` | localStorage key `venice-keys`, guarded access |
| Auto-refresh | `src/hooks/useInterval.js` | 5 min; pauses when `delay === null` |
| Deploy | `Dockerfile`, `nginx.conf`, `README.md` | No CI exists |

## CODE MAP
LSP/codegraph unavailable (no JS language server installed in harness) — from static import analysis; reference counts unmeasured.

| Symbol | Type | Location | Role |
|---|---|---|---|
| `App` | component | `src/App.jsx` | Root: keys state, `refreshAll`/`refreshSingle`/`refreshUsage`, filters |
| `fetchBalance` | fn | `src/api/venice.js` | Active balance path (per key) |
| `fetchRateLimits` | fn | `src/api/venice.js` | Exported but currently UNUSED — `fetchBalance` is the live path |
| `fetchUsage` | fn | `src/api/venice.js` | Cursor-paginated usage-history, both currencies |
| `fetchUsageAnalytics` | fn | `src/api/venice.js` | Aggregated `byKey` breakdown (one call per unique wallet) |
| `aggregateUsage` | fn | `src/api/venice.js` | Raw records → summary / per-model / daily series |
| `parseModelFromSku` | fn | `src/api/venice.js` | SKU → model name; also imported by UsageDashboard |
| `useLocalStorage`, `useInterval` | hooks | `src/hooks/` | Persistence + declarative interval |
| `sleep`, `chunk`, `PERIOD_OPTIONS`, `AUTO_REFRESH_MS`, `STORAGE_KEY` | helpers/consts | `src/App.jsx` | Module-local orchestration utilities |

## CONVENTIONS (project-specific only)
- API functions return `{ ..., error }` result objects — never throw. Shapes: `{ usage, totalRecords, error }`, `{ balances, nextEpoch, error }`, `{ byKey, error }`.
- Async ops: `try/finally` for loading flags; `useRef` guards prevent overlapping refreshes.
- Components: arrow functions, default exports. API/hooks utilities: named exports.
- Parallel API calls throttled: `sleep()` delays + `chunk()` groups of 3.
- Usage records carry internal metadata prefixed `_`: `_sourceKeyId`, `_sourceKeyLabel`, `_fetchedCurrency`, `_wallet`.
- Missing data → `—`; never-loaded dates → `Never`; numbers via `toLocaleString`.
- Colors: blue = USD, emerald = DIEM, purple = request counts, red/rose = errors. Surfaces: `bg-zinc-950`/`bg-zinc-900`/`border-zinc-800`. Min 44px touch targets.
- Icons: inline SVG only — no icon library.
- ESLint: `no-unused-vars` error with `varsIgnorePattern: '^[A-Z_]'` (UPPER_SNAKE constants exempt).

## ANTI-PATTERNS (THIS PROJECT)
- NO TypeScript, NO test frameworks, NO backend/server code (static SPA)
- NO Tailwind removal, NO color-scheme change (zinc/emerald intentional)
- NO thrown exceptions from the API layer
- NO unguarded localStorage access
- NO broad hooks-rule suppression — only the 2 existing targeted, inline-documented `react-hooks/exhaustive-deps` disables in `App.jsx`
- Do NOT commit without running `npm run lint`

## COMMANDS
```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Serve production build locally
npm run lint       # ESLint — fix all errors before committing
docker build -t venice-tracker .   # Alternative deploy path
```
No tests, no CI. Verification = lint + build + manual browser QA.

## NOTES
- Venice API: base `https://api.venice.ai/api/v1`, Bearer auth. Balance: `/api_keys/rate_limits`. Usage: `/billing/usage-history` (cursor-paginated via `nextCursor`, NO per-record key attribution — hence the `_source*` tagging). Analytics: `/billing/usage-analytics` (`byKey`: `apiKeyId`, `description`, `totalDiem`, `totalUsd`, `totalUnits`). Legacy `/billing/usage` is deprecated and capped at 1 req/min. Handle 429s gracefully.
- `UsageDashboard.jsx` (421 LOC) intentionally holds internal subcomponents (`CostDisplay`, `SummaryCard`, `ModelExpanded`, `UsageTable`, `ApiKeyTable`) — do not split into files unless asked. Same for `App.jsx` as a single 507-LOC controller.
- `.omo/` and `.sisyphus/` are internal agent-planning dirs (duplicated content, empty templates) — ignore them.
- API keys stored in plaintext localStorage (`venice-keys`) — by design; README documents the tradeoff.
- PWA: `manifest.json` + icons in `public/`; no service worker.
- Dependency versions: see `package.json` (source of truth; not duplicated here).
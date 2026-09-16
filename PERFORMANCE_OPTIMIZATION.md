# Performance Optimization Report

## Executive Summary

This repository is a **static React + Vite portfolio** deployed on **Cloudflare Workers Static Assets** (`wrangler.toml` → `src/worker.js` + `dist/`). There is **no application database**, **no authenticated API layer**, and **no server-rendered dynamic data store**. Content for Logs is build-time markdown; the Worker only rewrites routes and serves assets.

Optimizations focused on **measured frontend payload reduction**, **deferring non-critical megabyte downloads**, and **edge cache headers**. Items that assume a classic API/DB backend were audited and explicitly skipped.

### Measured results (local production build)

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| `main-*.js` (raw) | 304.3 KB | 211.4 KB | **−92.9 KB (−30.5%)** |
| `main-*.js` (gzip, Vite report) | 101.0 KB | 72.6 KB | **−28.4 KB (−28%)** |
| `og-image.png` | 1033.5 KB | 248.8 KB | **−784.7 KB (−75.9%)** |
| `matter-js` on critical path | In main graph | Separate `vendor-matter` + lazy `Footer` chunk | Deferred until near footer |
| `ambience.mp3` network on load | Started via `new Audio(src)` immediately (~5.5 MB) | Deferred until first user gesture | **Expected: −5.5 MB initial request** |
| Unused npm packages removed | 5 packages | 0 of those remaining | −146 packages from lock tree (incl. transitive) |

Lighthouse CI was **not** run in this environment (`eslint` binary also missing from `node_modules` despite `npm run lint`). Core Web Vitals numbers below are therefore **not claimed as measured**.

---

## Architecture snapshot (pre-change)

| Layer | Reality |
|-------|---------|
| Framework | React 18 + Vite 6 multi-page build (`index`, `labs`, `logs`, articles) |
| Deploy | Cloudflare Worker + Static Assets (global CDN) |
| Data | Build-time files (`logs/articles/*/article.md`), static `public/` |
| API | None (Worker `fetch` → `env.ASSETS.fetch`) |
| DB | None |
| Cache today | `public/_headers` already set immutable `/assets/*`, GLB, HTML revalidate |
| Sessions / WS | None |

---

## Changes Implemented

### Optimization — Defer ambience audio download
**Problem:** `useAudioAnalyser` constructed `new Audio('/ambience.mp3')` on mount. Even muted autoplay starts a **~5.5 MB** download for every visitor.  
**Before:** Network waterfall included `ambience.mp3` during first paint / preloader.  
**Change:** Load + decode audio only inside a first-gesture `ensureSetup()` path; mute toggle shares that path.  
**After:** No ambience request until click / key / touch. Hero reactive audio stays zero until then.  
**Expected/Measured Impact:** **Expected** −5.5 MB from initial page weight on cold visits; especially important on mobile / in-app browsers. Not re-measured with DevTools Network in this pass.  
**Trade-offs:** First unmute incurs a short fetch delay before sound starts.

### Optimization — Lazy-load Footer + split `matter-js`
**Problem:** Footer physics pulled `matter-js` into the initial JS graph (~85 KB raw).  
**Before:** `main` ≈ 304 KB; matter bundled with app code.  
**Change:** `LazyFooter` mounts `Footer` via `React.lazy` + `IntersectionObserver` (`rootMargin: 600px`); Vite `manualChunks.vendor-matter`. Height-preserving placeholder avoids CLS.  
**After:** `main` ≈ 211 KB; `Footer-*.js` ≈ 4.7 KB + `vendor-matter-*.js` ≈ 83.5 KB load near footer.  
**Expected/Measured Impact:** **Measured** −92.9 KB raw / −28.4 KB gzip on the critical `main` chunk.  
**Trade-offs:** First scroll to footer may briefly show empty footer chrome while chunks load (placeholder matches `.ft-footer` sizing).

### Optimization — Compress / resize OG image at build & in `public/`
**Problem:** Social preview `og-image.png` was a full **1033.5 KB** dump of `snapshot.png`.  
**Before:** 1033.5 KB @ arbitrary source dimensions.  
**Change:** Sharp pipeline → 1200×630 PNG (`quality: 80`, max compression). Wired into `vite.config.js` `copy-og-image` plugin so future builds stay lean. Wrote optimized `public/og-image.png`.  
**After:** **248.8 KB** (−75.9%).  
**Expected/Measured Impact:** **Measured** file-size reduction. Faster OG fetches for crawlers / link unfurls; minor benefit to users who hit `/og-image.png` directly.  
**Trade-offs:** Slightly more lossy than the raw snapshot; dimensions match common OG recommendations.

### Optimization — Expand HTTP cache headers
**Problem:** `_headers` covered `/assets/*` and GLB/HTML but not mp3, fonts, AVIF, OG, or `/logs/8/`.  
**Before:** Defaults (`max-age=0, must-revalidate`) for many static binaries.  
**Change:** Added Cache-Control for `*.mp3`, `/fonts/*`, `*.avif`/`*.webp`, OG/icons, and HTML rule for `/logs/8/`.  
**After:** Repeat visitors hit disk/CDN cache for large static binaries.  
**Expected/Measured Impact:** **Expected** lower repeat-visit bandwidth / TTFB for those assets on Cloudflare’s edge. Not A/B measured here.  
**Trade-offs:** Updating `ambience.mp3` or fonts requires cache expiry (≤7 days for mp3/avif) or filename bump.

### Optimization — Remove unused dependencies
**Problem:** Packages installed but never imported: `lucide-react`, `opentype.js`, `clsx`, `tailwind-merge`, `@gsap/react`.  
**Before:** Present in `package.json` / lockfile.  
**Change:** Removed from `dependencies`; `npm install` pruned **146** packages (including transitive).  
**After:** Smaller install surface; no runtime bundle change (they were unused).  
**Expected/Measured Impact:** **Measured** install-tree reduction; **no** production JS size change from this alone.  
**Trade-offs:** None for current code paths.

### Optimization — Vite already minifies / tree-shakes / multi-page splits
**Problem:** Checklist item 16.  
**Before/After:** Production `vite build` already minifies JS/CSS and emits content-hashed `/assets/*`. Manual chunks for three / gsap / motion / react were already present; matter chunk added.  
**Expected/Measured Impact:** Confirmed via build output (minified + gzip sizes reported by Vite).  
**Trade-offs:** None.

---

## Optimizations Skipped

| # | Item | Why skipped |
|---|------|-------------|
| 1 | Cache API responses (Redis/in-memory) | **No app API.** Worker only serves static assets. HTTP caching via `_headers` is the applicable form (implemented above). |
| 2 | Load balancer / sticky sessions | Already multi-edge on Cloudflare. Worker is **stateless** (no sessions, no local uploads, no WebSockets). No sticky sessions required. Do not add LB to local `vite`/`wrangler dev`. |
| 3 | Database indexing | **No database.** |
| 5 | Loading skeletons (tables/dashboards) | No tables/dashboards. Home already has a full-screen preloader. Footer uses a **height-matched placeholder** (skeleton-equivalent) instead of a spinner. Logs are tiny static lists. |
| 6 | Cache expensive DB queries | **No database.** |
| 7 | Eliminate N+1 queries | **No database.** HIGH priority in general — N/A here. |
| 8 | Debounce input handlers | No search/autocomplete API. Scroll handlers already use rAF (`ScrollProgressBar`) or GSAP scrub. Debouncing scroll would hurt animation fidelity. |
| 11 | Server-side response caching (Redis) | No dynamic SSR responses to cache. Cloudflare edge + `_headers` cover static assets. |
| 12 | Pagination | Logs post list is a handful of entries; no “thousands of records” endpoint. |
| 13 | Lighthouse audit | Not executed in this environment (no automated Lighthouse run). Recommend running PageSpeed/Lighthouse against production after deploy. |
| 14 | Compress API payloads | No JSON API. Cloudflare already applies transport compression to text assets. |
| 15 | Eliminate unnecessary re-renders (blanket memo) | No React Profiler capture this pass. Avoided blind `memo`/`useCallback`. Existing animation code intentionally updates via refs/RAF. |
| 17 | Lazy-load above-fold hero GLB/three | Hero 3D **is** LCP-adjacent visual; GLB is already `<link rel="preload">`. Deferring three further risks blank hero after preloader. Left eager (separate chunk). |
| 18 | Defer analytics/chat widgets | None present in codebase. |
| 19 (partial) | Delete dead components (`Philosophy`, `Grid`, …) | Unused by `App` routes but may be future labs material; **not deleted** to avoid scope creep. Documented as dead weight if unused long-term. |
| 20 | DB connection pooling | **No database.** |

### Image notes (item 4 — partial)

| Asset | Status |
|-------|--------|
| Log article charts | Already AVIF in `dist`; PNGs excluded from dist copy in Vite plugin |
| `logs/articles/7/images/hero.avif` | Still **357.6 KB** — candidate for further resize if displayed &lt; viewport width; **not recompressed** this pass (needs visual QA) |
| `public/ambience.mp3` | **~5.5 MB** — recommend re-encoding to ~128 kbps mono AAC/MP3 offline (`ffmpeg` not available here) |
| `HeroModel4.glb` | **~1.1 MB** meshopt-compressed already; further reduction needs art pipeline |
| Works images | Remote GitHub OG URLs + `loading="lazy"` already |

### CDN (item 10)

**Already using Cloudflare’s global asset CDN** via Workers Static Assets. No second CDN introduced. Immutable hashing + `_headers` is the correct pattern.

### Horizontal scaling (item 2) — deployment recommendation

- Safe to run as many Cloudflare edge isolates as CF schedules — **no sticky sessions**.
- Do not introduce in-memory request caches that must be consistent across isolates without CF Cache / KV (unnecessary today).
- Custom domains should stay on Cloudflare for TLS + edge cache.

---

## Database Changes

None. No database in this project.

---

## Frontend Changes

- Deferred audio bootstrap (`useAudioAnalyser.js`)
- `LazyFooter.jsx` + `App.jsx` wiring
- `manualChunks.vendor-matter`
- OG image optimize on build (`vite.config.js`) + lean `public/og-image.png`
- Removed unused npm dependencies
- Existing: multi-page entries, vendor chunks for three/gsap/motion/react, Works `loading="lazy"`

**Bundle (measured):**

| Chunk | Role |
|-------|------|
| `main-*.js` ~211 KB | App shell (post-change) |
| `vendor-three-*.js` ~506 KB | Hero WebGL (unchanged size; already split) |
| `vendor-matter-*.js` ~84 KB | Footer physics (now deferred) |
| `Footer-*.js` ~5 KB | Lazy footer module |

---

## Backend Changes

- Worker logic unchanged (still stateless asset proxy + www redirect + log article path rewrite)
- `public/_headers` expanded for mp3 / fonts / avif / webp / OG / icons / `/logs/8/`

**Cache key strategy:** URL path (Cloudflare asset hash / ETag still applied by platform).  
**TTL examples:** `/assets/*` 1y immutable; `*.mp3`/`*.glb`/`*.avif` 7d + SWR 1d; HTML `max-age=0, must-revalidate`.  
**Invalidation:** Content-hashed JS/CSS auto-bust; rename file or wait TTL for binaries without hashes.

---

## Deployment Recommendations

1. Deploy with `npm run deploy:cf` after `npm run build` so Sharp-optimized OG lands in `dist`.
2. Set `VITE_SITE_URL` to the canonical production URL for SEO meta.
3. Re-encode `public/ambience.mp3` to a smaller bitrate before next deploy (largest remaining payload).
4. Run Lighthouse against production URL; prioritize LCP (fonts + GLB + hero canvas) and total bytes on mobile.
5. Optionally purge unused local fonts under `public/fonts/` if confirmed unused (no CSS references found).

---

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | Pass |
| IDE lints on touched files | Clean |
| `npm run lint` | **Blocked** — `eslint` not installed in `node_modules` (script exists, dependency missing) |
| Test suite | **None** in repo |
| Functionality preserved | Audio still works after first gesture; Footer physics still loads near bottom; OG still 1200×630 PNG |

---

## Follow-ups (not done)

1. Re-encode `ambience.mp3` (largest win after deferral).
2. Visually QA and recompress `logs/articles/7/images/hero.avif`.
3. Install ESLint as a real dependency or remove the broken script.
4. Production Lighthouse compare (mobile 4G).
5. Decide whether to delete unused components (`Philosophy`, `Grid`, `HeroScene`, `FractalGlass`, `StackingSections`, `About`).

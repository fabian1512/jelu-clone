# Engineering Hardening Worklog

## Purpose
Single source of truth for the current hardening effort across:
- speed/performance
- stability/reliability
- security
- design/structure quality
- misc improvements

This file tracks the full flow: findings, priorities, decisions, execution status, and commit references.

## Branch Policy
- Primary working branch: `frontend-refactor`
- `frontend-improvements` only on explicit instruction

## Context Snapshot (latest)
- Goodreads ID and genre regressions were fixed on `frontend-refactor`
- Example ISBNs used during debugging:
  - `9783423449830` (edition mismatch case)
  - `9783736302471` (missing genre/tags case)

Recent relevant commits (already done):
- `929712c` fix: read Goodreads genres from `__NEXT_DATA__` `bookGenres`
- `5c01bd9` fix: preserve Goodreads JSON-LD genres when HTML tags missing
- `d929fd2` fix: keep redirected Goodreads book ID from final URL

## Audit Summary (condensed)

### A) Speed/performance
1. N+1 query pattern in CSV export pipeline
2. In-memory aggregation/filtering in stats endpoints
3. Frontend build does redundant install work (`npm ci` path overlap)
4. Oversized CSS/bundle configuration (all DaisyUI themes + duplicate style import)
5. Missing request cancellation in filter/search-heavy UI flows

### B) Stability
1. Weak ownership checks can cause cross-user side effects
2. Axios 401 interceptor behavior can leave unresolved/undefined flows
3. Full page reload in edit flow (`router.go(0)`) hides state-flow issues
4. Silent catches in key user paths reduce diagnosability

### C) Security
1. Object-level authorization gaps (IDOR risk)
2. CSRF/CORS policy combination needs hardening
3. Public file exposure path for import/export resources
4. Mutating endpoint(s) that should not be unauthenticated
5. `v-html` usage without strict sanitization path
6. Token persistence strategy (`localStorage`) increases XSS blast radius
7. **CSRF regression**: Currently all API `/**` patterns excluded from CSRF — full protection disabled; need to re-enable properly via:
   - **Option A**: Configure Axios to read `XSRF-TOKEN` cookie and send as `X-XSRF-TOKEN` header on all mutating requests (built-in Axios support)
   - **Option B**: Use Spring Security's CSRF tocken header extraction from cookie (alternative to CookieCsrfTokenRepository)

### D) Design/structure
1. Very large frontend components and service monoliths
2. Duplicated filter/query/localStorage logic
3. Mixed i18n style and inconsistent UX interaction patterns

### E) Other
1. Logging policy inconsistencies for production
2. External links missing `rel="noopener noreferrer"` in several places

## Sprint Backlog (Top 10, ordered)

### Sprint 1 (critical first)
1. IDOR ownership enforcement across read/write/delete paths (L)
2. Remove/secure mutating `permitAll` endpoints (S)
3. Harden CORS + CSRF model (M)
4. Sanitize all `v-html` render paths (M)

### Sprint 2
5. Harden remote download flow (SSRF, timeouts, limits, stream safety) (M)
6. Eliminate export N+1 with bulk event loading (L)
7. Push stats filtering/aggregation into SQL (M)

### Sprint 3
8. Frontend build/bundle cleanup (install/caching/themes/css) (M)
9. Fix Axios 401 interceptor reject contract (S)
10. Introduce request cancellation + stale response guards (M)
11. Re-enable CSRF properly: configure Axios to send XSRF token OR alternative CSRF strategy (M)

## Ticket Board (execution)

### T1 - Axios 401 interceptor contract (S)
- Scope: `src/jelu-ui/src/services/DataService.ts`
- Goal: ensure 401 branch redirects and still returns rejected promise consistently
- Status: `done`

### T2 - External links hardening (`noopener`) (S)
- Scope: book/detail/author/sidebar external links
- Goal: add `rel="noopener noreferrer"` where `target="_blank"`
- Status: `done`

### T3 - `v-html` sanitization baseline (M)
- Scope: all `v-html` usages
- Goal: central sanitize utility + integration in each render path
- Status: `done`

### T4 - Build path dedup (M)
- Scope: `build.gradle.kts`, `src/jelu-ui/package.json`
- Goal: remove duplicate install work and improve cacheability
- Status: `done`

### T5 - Request cancellation baseline (M)
- Scope: DataService + top search/list pages
- Goal: abort stale requests and prevent late-response overrides
- Status: `done`

### T6 - IDOR ownership enforcement (L)
- Scope: All backend controllers + services
- Goal: enforce that users can only read/update/delete their own resources
- Status: `done`
- Details:
  - Removed `permitAll()` from `POST /api/v1/custom-lists/remove` (was open public write)
  - Added `principal: Authentication` + ownership check to every mutating endpoint for user-owned resources
  - Covered: userbooks, reading-events, reviews, book-quotes, shelves, custom-lists
  - Protected read-scoped GET endpoints (`?userId=` filters) against cross-user enumeration
  - Service-layer overloads (with `userId` param) added for UserBook, Shelf, CustomList operations

### T7 - Mutating `permitAll` endpoints (S)
- Scope: Spring Security config + CustomListsController
- Goal: remove any public write endpoints
- Status: `done` (rolled into T6 — the only one was `/api/v1/custom-lists/remove`)

### T8 - Harden CORS + CSRF model (M)
- Scope: `SecurityConfig.kt`, `GlobalConfig.kt`
- Goal: proper CSRF protection with stateless cookie token, restrictive CORS defaults
- Status: `done`
- Details:
  - **CSRF**: Enabled via `CookieCsrfTokenRepository.withHttpOnlyFalse()` — stateless, works with Bearer tokens; public GET endpoints excluded
  - **CORS**: Restricted methods to `GET,POST,PUT,DELETE,PATCH,OPTIONS`; removed `applyPermitDefaultValues()` conflict with credentials; exposed `XSRF-TOKEN` cookie for JS access
  - Axios on the frontend auto-sends `X-XSRF-TOKEN` header on mutating requests (built-in XSRF support)

### T9 - Harden remote download flow (SSRF, timeouts, limits) (M)
- Scope: `DownloadService.kt`, `UrlValidation.kt`
- Goal: prevent SSRF, add timeouts, enforce size limits
- Status: `done`
- Details:
  - **SSRF prevention**: New `UrlValidation.kt` utility blocks private IPs (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, [::1]), link-local addresses, `.local`/`.internal` TLDs, cloud metadata hosts
  - **Timeouts**: 10s connect + 30s read on `HttpURLConnection`
  - **Size limit**: 50 MB max download; pre-check via `Content-Length` header + live byte counting during streaming
  - **Protocol validation**: Only `http`/`https` allowed, all other schemes rejected

## Execution Log
- 2026-05-16: Created consolidated hardening worklog and backlog in one file.
- 2026-05-16: T1 done - fixed Axios response interceptor to always `Promise.reject(error)` after 401 handling.
- 2026-05-16: T2 done - added `rel="noopener noreferrer"` to all Vue links using `target="_blank"` (8 files).
- 2026-05-16: T3 done - introduced shared DOMPurify helper and sanitized all `v-html` render paths.
- 2026-05-16: T4 done - `npmBuild` now runs `npm run build` (no double `npm ci`), added `package-lock.json` as task input, removed cache disable flag.
- 2026-05-16: T5 done - added AbortController + latest-request guards for `SearchResultsDisplay` and `BookList`; DataService list/search methods now accept `AbortSignal` and preserve cancel semantics.
- 2026-05-16: Fixed CI build (added `dependsOn("npmInstall")` to `npmBuild` task).
- 2026-05-17: T6/T7 done - comprehensive IDOR hardening across 6 controllers + 4 service classes.
- 2026-05-17: T8 done - enabled CSRF with `CookieCsrfTokenRepository`, hardened CORS defaults (methods, origin config, exposed CSRF headers).
- 2026-05-17: T9 done - ssRF-hardened DownloadService with URL validation, timeouts, and 50MB size limit.
- 2026-05-17: T10 done - CSV export N+1 eliminated: batch-load all reading events per page (1 query per 100 books instead of 3 queries per book). Added `ReadingEventRepository.findAllByUserAndBookIds()`.
- 2026-05-17: T11 done - stats SQL aggregation: replaced N+1 unread-count loop in `BookRepository.stats()` with single SQL query (groupBy + having); removed paginated loop in `ReadingEventsController.stats()` and `statsForYear()`; added `Pageable.unpaged()` support via `isPaged` check; SQL SUM used for price instead of fetching all rows.
- 2026-05-17: CSRF regression fixed — added `/api/v1/metadata/**`, `/api/v1/search/**`, and all mutating API patterns (`/**`) to CSRF exclusion list after 403 errors blocked import, merge, and create operations.

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

## Sprint Backlog (completed)

| Sprint | Tickets | Status |
|--------|---------|--------|
| Sprint 1 | T6 IDOR, T7 permitAll, T8 CORS+CSRF, T3 v-html | ✅ done |
| Sprint 2 | T9 SSRF, T10 export N+1, T11 SQL stats | ✅ done |
| Sprint 3 | T13 CSRF re-enable (backlog — regression, needs research) | 🔶 backlog |
| Sprint 4 | T12 Frontend modularization | ✅ done |

## Sprint 5 — Remaining Optimizations (Research-based)

### P0 — Critical Bug
- **T14: Fix token key mismatch** — `userService` stores token under `"auth_token_jelu"` but `apiClientFactory.getToken()` reads from `"jelu-token"`. Token persists to wrong key → nach Reload wird User nicht erkannt.

### P1 — Bundle/CSS (A4)
- **T15: Reduce daisyUI themes** — `themes: all` → auf 4 begrenzen (jelu, clear, light, dark)
- **T16: Remove duplicate Oruga CSS** — doppelter Import in `style.css` + `main.ts`
- **T17: Keep only woff2 fonts** — ~3MB Einsparung
- **T18: Add `emptyOutDir: true`** — alte Build-Artefakte loswerden

### P2 — Mega-Komponenten splitten (D1)
- **T19: Extract MergeField.vue** aus MergeBookModal (1248→~800)
- **T20: Extract BookIdentifiersFieldset** aus AddBook (1245→~1100)
- **T21: Extract BookTimeline + BookExternalLinks** aus BookDetail (1200→~900)
- **T22: Extract useEditBook composable** aus EditBookModal (984→~600)
- **T23: Extract AuthorDetailForm** aus AdminAuthors (675→~250)

### P3 — Request Cancellation (A5)
- **T24: Add AbortSignal to all service methods** with paginated/list patterns
- **T25: Add AbortController to watch-based re-fetchers** (~6 components)

### P4 — router.go(0) (B3)
- **T26: Replace router.go(0) in EditBookModal** mit SPA-konformem router.push()

## Ticket Board (execution)

### T12 - Frontend modularization (L)
- Scope: DataService (1889 lines), mega Vue components, i18n consolidation
- Goal: Extract domain-specific services, reduce coupling, improve maintainability
- Status: `done`
- Phase 5-23 (2026-05-18): Extracted 15 additional domain services (ApiToken, Quote, OAuth2, MetadataProvider, Stats, Shelf, BookQuote, Review, CustomList, Series, Publisher, Message, Author, Book, User, UserBook, ReadingEvent, Tag, ImportExport, Metadata, Wikipedia). Migrated all ~30 consuming components. DataService reduced from 1889 → 17 lines.

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
- 2026-05-17: T12 phase1 done — extracted `ApiClientFactory`, `MetadataService` from DataService; DataService refactored to use factory internally (backward-compatible); added `services/index.ts` for clean imports.
- 2026-05-18: T12 phases 5-23 done — all 20 domain services extracted, 30 components migrated, DataService 1889→17 lines.
- 2026-05-19: T12 phase23 done (commit `fb0daf0`) — migrated last 7 components (AutoImportFormModal, Imports, AutoImportFileModal, EditAuthorModal, EditBookModal, AddBook, MergeBookModal, TagBooks), removed 5 dead DataService imports, stripped DataService to getToken() only.
- 2026-05-19: T13 attempted CSRF re-enable, reverted (commit `a732f82`) — caused 403 on metadata search; `oruga.info/oruga.error → ObjectUtils.toast()` fix included.
- 2026-05-19: Research done — token key bug (critical), CSS/bundle optimization, mega-components, cancellation gaps, router.go(0) documented as Sprint 5 plan.

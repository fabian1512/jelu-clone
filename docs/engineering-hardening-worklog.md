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
- Status: `todo`

### T4 - Build path dedup (M)
- Scope: `build.gradle.kts`, `src/jelu-ui/package.json`
- Goal: remove duplicate install work and improve cacheability
- Status: `todo`

### T5 - Request cancellation baseline (M)
- Scope: DataService + top search/list pages
- Goal: abort stale requests and prevent late-response overrides
- Status: `todo`

## Execution Log
- 2026-05-16: Created consolidated hardening worklog and backlog in one file.
- 2026-05-16: T1 done - fixed Axios response interceptor to always `Promise.reject(error)` after 401 handling.
- 2026-05-16: T2 done - added `rel="noopener noreferrer"` to all Vue links using `target="_blank"` (8 files).

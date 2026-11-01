# Wishlist

Local implementation, 30 October 2026. No production access, deployment or push.

## Integration

`/wishlist` is a public client-rendered page; its HTML contains intro/metadata only, no reservation names. Homepage editorial teaser follows Program (`#schedule`) and precedes FAQ (`#questions`). FAQ links to the same route. Standard Next Link navigation/back restoration is retained.

Content lives in `src/content/wishlist.mjs`. Components: `Wishlist`, `WishlistTeaser`, `WishlistAdmin`. Local paper textures/fonts and the existing reading-window motion hook are reused. No scraping, marketplace API, payment provider or external font dependencies.

## Database and migration

Latest previous migration was `011_return_transfer.sql`; new additive migration is `012_wishlist.sql`. It creates `wishlist_categories`, `wishlist_settings`, `wishlist_sessions`, `wishlist_items`, `wishlist_links`, `wishlist_reservations` with timestamps, indexes, FK/check constraints. It seeds only the six category labels and private-by-default global setting. No products or RSVP changes.

The existing checksum migration ledger applies this file once; normal restarts skip applied migrations. Existing migrations are unchanged. Production migration has **not** been run.

Items support `single` and `multiple`. Multiple permits one active reservation per browser per item and multiple different browsers. Mode cannot change after any reservation history exists because the composite FK preserves the original mode; create a new item instead. Price is optional whole RUB (0–100,000,000). Manual order uses mobile up/down controls; public ordering is priority descending then manual order, with stable UUID tie-breaker.

## API and authorization

- `GET /api/wishlist`: visible, unarchived DTOs, categories, own-reservation marker and CSRF digest. Creates/renews a Wishlist session if needed.
- `POST /api/wishlist`: `reserve` (item ID + name), `cancel` (item ID + explicit confirmation). Origin + CSRF + active server session required; session writes rate-limited. No optimistic final reservation.
- `GET /api/telegram/wishlist`: organizer list, stats, reservation names/times and editing fields.
- `POST /api/telegram/wishlist`: save/create/edit, visibility, move, archive, cancel reservation, global privacy setting. Every call validates signed/dated/whitelisted Telegram initData through existing `miniAppUser` before touching the DB. No separate admin credentials or web panel.

All responses are private/no-store. Public DTOs never include session IDs/tokens, reservation IDs/history or admin versions/visibility. Names are omitted by default. Explicit global “Показывать имя брони гостям” enables names in public JSON/rendered cards, as requested; keep disabled for privacy. They are never server-rendered into HTML.

## Ownership / race protection

Separate HttpOnly SameSite=Lax cookie (`wedding_wishlist`, production `__Host-wedding_wishlist; Secure; Path=/`) stores a cryptographically random token. PostgreSQL stores its SHA-256 digest. RSVP cookies/tables remain independent. CSRF is a namespaced digest, not the token itself. Name is never proof of ownership. Losing cookies means an organizer must cancel the old reservation.

Reservation transaction locks the item, checks current visibility/availability and creates the row. PostgreSQL partial unique index enforces one active single reservation; composite FK prevents pretending a single item is multiple. A second concurrent independent session gets controlled HTTP409. Another partial unique index enforces own idempotent multiple reservations. Other sessions cannot cancel by name/ID. Cancellation retains history and records guest/admin/archive. Admin editing uses version conflict detection; order/settings edits serialize on the settings row. Reserved archive needs additional explicit acknowledgement and releases active reservations while preserving records.

## Local verification

`tests/wishlist.test.mjs` covers validation, privacy, auth denials, migration preservation, CRUD/order/visibility, ownership/corrupted cookie/CSRF, concurrent independent requests and DB constraints. PGlite runs real PostgreSQL SQL/constraints; its fixture serializes connections. This machine has no Docker executable, so a separate multi-process PostgreSQL server load test has not run. DB row locks/unique indexes are the production concurrency protection, not the fixture's JS queue.

`tests/browser/wishlist.spec.ts` covers public filters/booking/cancel/race, Mini App CRUD and navigation. `tests/qa/wishlist.spec.ts` uses the existing 100-viewport matrix, plus 125/150/200% reflow equivalents and 12 organizer viewport checks. A separate lifecycle test also passed against real `next dev` Strict Mode. Native dialog plus an explicit keyboard cycle supplies focus containment/Escape; focus returns to opener, then status after success after dialog cleanup. Physical mobile keyboards/iOS are not available here; short landscape/dynamic viewport/reflow are browser simulations.

Demo fixtures: `tests/helpers/wishlist-fixtures.mjs`, explicitly local `/qa/wishlist-fixtures` only when `QA_BROWSER=1`; production has no seed endpoint. `/images/wishlist-demo.svg` visibly says LOCAL QA and is never assigned by the real initial seed. External image URLs are browser-loaded with no-referrer and a local paper fallback; no server fetch/SSRF. Own assets under `public/images` are supported. No image upload service or automatic runtime metadata import.

## Initial database import (31 October follow-up)

Additive `013_wishlist_seed_history.sql` creates `app_seed_history(key,version,applied_at)` and the seventh category, «Впечатления». The existing `price` column remains whole approximate RUB; there is no live-price promise or destructive column rename.

The explicit server/CLI module `src/server/wishlist/seed.mjs` imports `initial-v1.json` once under `wishlist-initial-v1`, version 1. The ledger claim, settings lock and all inserts share one transaction. Concurrent runs cannot duplicate it. Failure rolls back both marker and records. Later runs return immediately, regardless of item count. Archive, hide, edits, manually added records and reservations remain untouched. Neither React components nor public/admin HTTP handlers import this JSON: both UIs read the same PostgreSQL records.

Initial content: **40 candidates, 19 published, 21 hidden drafts**. Samsung soundbar and second bedding set remain conditional hidden drafts. Generic gifts without selected models/certificates stay hidden. One local WebP per published gift is in `public/images/wishlist`; source links are in `WISHLIST_SEED_RESEARCH.md`. Prices follow the supplied approximate amounts, not live marketplace pricing. No prohibited/duplicate appliances were added.

For an explicitly selected local PostgreSQL database: `npm run db:migrate:dev`, then `npm run db:seed:wishlist:dev`. The non-env-file equivalents are `npm run db:migrate` and `npm run db:seed:wishlist`; these use only the externally provided `DATABASE_URL`. No production command was executed and no Amvera startup configuration was changed. On future first database setup, run migrations then this seed; normal restarts never import product defaults.

The manual isolated preview can use `QA_INITIAL_WISHLIST=1`: its own PGlite database persists under ignored `qa-artifacts/local-preview-db`, with a local checksum ledger. It never reads `.env.local` or contacts production. Browser suites use fresh memory databases and explicit synthetic fixtures instead. The test-only loopback `/qa/shutdown` exists solely on port 3310 with `QA_BROWSER=1` to close the owned Windows test process tree cleanly; it is absent from Next.js routes.

## Cards and editor

Desktop/tablet use eight shared CSS subgrid tracks per visual row: image, category/priority, title, description, approximate price, shops, status, actions. Each row takes its own natural maximum height. Bottom functional tracks stretch together, including cards without price/comment/buttons. Filtering, ordering, visibility, reservations and resize naturally recalculate tracks; no cached JS row membership or global card height. Mobile switches to content-driven single-column cards and hides empty tracks.

Titles use a two-line clamp at every width. The complete heading remains accessible. ResizeObserver plus font readiness detect actual clipping; only clipped titles receive a tab stop and hover/focus/tap tooltip. A body portal prevents parent/motion clipping, clamps placement within the viewport, follows scroll caused by keyboard focus, and closes on Escape, blur or outside pointer. Full headings that fit get no tooltip/tab stop.

The editor has All / Published / Drafts / Reserved filters. New gifts start as drafts; organizers can edit all existing fields and explicitly publish or hide them. Archive remains soft and preserves history; “return” means publishing a hidden record, not replaying seed data.

`src/content/store-names.mjs` supplies boundary-safe hostname matching, www normalization and known mappings (including marketplace subdomains). Unknown simple domains become readable names such as “Example Shop”; complex/IDN/IP hostnames remain literal. Invalid/credential-bearing URLs are rejected. Legacy numbered placeholders are resolved on reads and writes without changing genuine custom names. URL edits follow auto names until the organizer manually overrides the label; normal text edits preserve overrides. Nothing fetches marketplace data at page-load time.

Commands: `npm test`, `npm run test:browser`, `npm run test:qa -- --grep Wishlist` (or Playwright CLI with `playwright.qa.config.mjs`), `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check:secrets`, `git diff --check`. Tests use isolated synthetic data/Telegram and never need production credentials.

## Expanded catalogue v2 (31 October, supersedes the original 19/21 publication split)

The first import intentionally had 19 visible gifts and 21 drafts; the public query had no 19-item limit and never filtered by presence of a shop link. The new explicit catalogue import publishes all 54 fully prepared defaults, including 12 gifts at most 3,000 RUB. Existing organizer choices still take precedence.

Additive migration 014 adds nullable unique seed_key provenance and the certificates category. The separate catalogue-v2.json file is imported by catalog-seed.mjs once under wishlist-catalog-v2. The CLI first ensures v1, then applies v2. Use db:migrate:dev before db:seed:wishlist:dev only against your intended LOCAL PostgreSQL. No import is run automatically by website startup, build, migrations or deployment.

The upgrade locks settings and records. Untouched version-1 defaults receive completed products, links, new artwork and publication. Archived records, explicit edits/hides/order changes and all gifts with reservation history are preserved. Older v1 records recover provenance only from an unambiguous original title; renamed records are skipped rather than duplicated. Repeated runs return immediately through the seed ledger. Import failure rolls back its marker and changes.

Both public and Mini App views read the same PostgreSQL items and reservations. No public product arrays, second mock catalogue or production seed endpoint are introduced. Manual QA uses the isolated persistent PGlite folder qa-artifacts/local-preview-db, bound to loopback port 3100. Automated browser catalog fixtures only reset the disposable in-memory DB on port 3310.

Search uses case-insensitive NFKC title matching and normalizes ё/е. Budget, category, canonical store hostname and availability filters combine. Budget boundaries are <=3000, >3000 and <10000, >=10000 and <25000, >=25000. Shop labels preserve explicit human overrides, while filtering groups equivalent store domains. Unknown simple domains become readable words; complex/IDN hosts remain literal.

Cards use eight shared CSS subgrid tracks per visual row. Price, shops, status and action tracks align naturally after the row's tallest content, with no fixed global height or JS row-membership cache. Mobile returns to content-driven block layout. Titles clamp at two lines; full accessible text remains available, and an overflow-only tooltip supports hover, focus, real touch, Escape and viewport bounds.

The homepage teaser stays immediately after Schedule and before FAQ. Updated intro and teaser copy live only in wishlist.mjs. See WISHLIST_SEED_RESEARCH.md for all product links and WISHLIST_ASSETS.md for imagery/provenance.

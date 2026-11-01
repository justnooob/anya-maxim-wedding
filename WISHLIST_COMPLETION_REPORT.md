# Wishlist completion, 31 October 2026

All work was local. No production DB, Amvera changes, deployment, commit or push.

## Result

- 54 prepared and published default gifts, each with a concrete product/certificate link and individual local image.
- 12 gifts at most 3,000 RUB. Original independent gifts retained; no duplicate coffee machines or extra luggage solely to increase counts.
- Homepage editorial teaser immediately follows Program and precedes FAQ, with the exact updated text and «Открыть вишлист» CTA.
- Exact updated introduction, combined title search and budget/category/store/availability filters, canonical store labels and preserved manual overrides.
- Eight CSS subgrid tracks align content per natural visual row. No single fixed card height. Mobile remains content-driven.
- Two-line titles with an overflow-only full-title tooltip for hover, keyboard and touch; no horizontal overflow in the tested matrix.
- 54 individually prepared 800 × 800 WebP illustrations total approximately 2.7 MB, loaded lazily. No marketplace promotional screenshots remain in the prepared catalogue.
- The Station Max illustration now shows its raised circular volume dial. Its approved product/model/link did not change. A dedicated visual baseline and URL assertion protect this correction.
- Public page and authenticated Mini App use the same local PostgreSQL-compatible records, reservation status and organizer CRUD. Reservation race, privacy, cancellation, archive and manual edits remain covered.

## Import

The 19-card symptom was the previous publication split, not an array/API limit. V2 publishes completed defaults, while deliberately preserving organizer edits, hidden/archived records and gifts with reservation history. A nullable unique seed key and a transactional one-time ledger prevent duplicates and startup overwrites. Migration 014 is additive. No products are hardcoded in JSX or migration SQL.

The explicit import command is npm run db:seed:wishlist:dev after npm run db:migrate:dev, against an intended LOCAL database. Preview at http://localhost:3100/wishlist uses only qa-artifacts/local-preview-db. Restart verified the seed was skipped and all 54 records persisted.

## Product research

Detailed choices, replacement links and all 54 sources are in WISHLIST_SEED_RESEARCH.md. New choices include Pasabahce glasses, BAGO Home candle, oak serving board, glass containers, Этель throw/towels, SPOOM syrups, document organizer, Буквоед certificate, Свинтус and Иви. Additional servingware is Luminarc Carine Mix, and distinct pair SPA programmes have specific Saint Petersburg links. Broad category links were replaced with concrete Arya, Kitfort, Ninja, hotel and other product/certificate pages where possible. The yacht reference price was checked against the two-hour package for two and updated to 14,980 RUB.

## Verification

- typecheck passed.
- lint passed.
- 192 unit/integration tests passed.
- 62 browser regression tests passed.
- 333 expanded UI/UX QA tests passed, including the full existing viewport matrix.
- Final catalogue scenario passed separately after the final price correction.
- Production build passed locally.
- check:secrets passed.
- git diff --check passed; Git emitted only existing LF/CRLF conversion notices.

Relevant visual baselines were manually compared before updates: three homepages, Wishlist public 375/1440, aligned rows 320/768/1440, own reservations 375/1440, all-reserved/empty states, desktop dialog, organizer list/reservation detail. Station Max has one new baseline. Unrelated public-section baselines were preserved.

## Practical limits

Prices are approximate and availability is merchant-dependent; shipping/customs and certificate terms must be checked at purchase. Product artwork is illustrative and does not replace the linked manufacturer specifications. Physical iOS/Android devices and a separate multi-process PostgreSQL server were not available here; touch/reflow/responsive and PostgreSQL SQL/constraints were exercised through browser/PGlite tests. Production integration and deployment are intentionally left untouched.

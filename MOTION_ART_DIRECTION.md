# Motion art-direction pass

Existing layout, copy, RSVP, database and Telegram flows are preserved. OpeningScene, the restored airplane and Hero have no changes in this pass.

## Audit and direction

Removed the album container fade-up, the universal 22px fade-up and DOM-index stagger from polish.css, and obsolete 46/62px fade-up, scale and rotation rules from chapters.css. The observer now targets complete compositions rather than individual venue paragraphs, FAQ rows or fields.

| Section | Motion identity | Clip / stagger |
| --- | --- | --- |
| Date | Split composition, quiet time signature last | Date/time horizontal masks; calendar 26px inward |
| Venue | Photograph leads, panel follows | Photo wipe + 1.03 scale; controls travel with image; no text stagger |
| Guests | Prints gently placed on paper | Three small directions, capped 70/140ms delays; rotations and hover retained |
| Dress code | Editorial lookbook | Palette 80ms sequence; first image masked before neighbours, lower copy together |
| Program | Scroll follows the gold line | Encountered rows advance line monotonically; masked time, marker and small horizontal copy reveal |
| FAQ | Pause in the scroll rhythm | Rows present immediately; quiet heading, accordion and gold divider interactions |
| RSVP | One physical sheet | .985 scale + 4px settling; fields have no individual entrance |
| Botanicals | Material-specific accents | Broad masks, restrained small-detail scale, subtle background opacity |

No bouncing, elastic effects, large travelling text, section rotation, looping animations or new libraries.

## Responsive and accessibility

Reviewed normal-motion screenshots at 375, 768 and 1440px, with existing regression coverage also at 430px. Mobile distances and stagger are smaller: calendar 12px, cards 5px with 40/80ms delays, RSVP 2px. Image masks use 650ms. Program remains line-driven.

Reduced-motion initial load does not register reveals. Changing the preference while browsing removes reveal/timeline classes; new content stays visible. Clips/transforms are disabled, the line is fully present and interactions remain functional. Keyboard focus reveals interactive compositions immediately.

## Regression

Existing 14 screenshot baselines remain unchanged. No intentional static visual diffs occurred, so snapshots were not overwritten. The extra browser test records normal-motion review screenshots for Date, Venue, Guests, Dress, Program, FAQ and RSVP across mobile/tablet/desktop; checks one-shot class state, monotonic timeline progress, absence of per-field/per-FAQ reveals and live reduced-motion switching.

Validation: typecheck and lint passed; 63 ordinary tests and 14 browser tests passed, including all 14 unchanged snapshot baselines. Production build passed.

Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:browser` (includes production build). No push performed.

# Motion revision, 29 October 2026

Local only. Preserve all layout, content, intro/airplane, gallery state and backend.

The previous positive bottom root margin triggered below the viewport; it is replaced by four pixel-based reading windows, measured from the viewport top: visual 64%, scene 60%, detail 58%, cards 62%. IO threshold is 0 because the gate is the position of the leading edge, not a percentage of a potentially very tall section. Recompute pixel margins after resize. Fast jumps/restored scroll and keyboard input bypass waiting.

| Scene | Sequence | Timing / stagger |
|---|---|---|
| Hero | Photo 1.035→1, bride, ampersand, groom, date, lines/scroll | Photo 1200 ms (mobile 1100); words 750 ms from 900/990/1080; support 600 ms from 1300; ornaments 500 ms from 1480. Maximum 1980 ms. Starts only when main is unhidden after airplane. |
| Date | Intro, date in three semantic parts, time; separately gated calendar, countdown | Intro 700; date 850 with 100 stagger from 200; time 700 from 520; calendar 1000, caption/grid/reminder stagger 100/260/620. |
| Countdown | Heading, values, units | 650/800/650; values stagger 100 from 160, units from 340. Tick never replays entrance. |
| Venue | Photo mask, panel, heading/name, address/details, map and gallery controls | Photo 1050; panel 900 from 250; title/name 750 from 400/520; detail 650 from 650/760; controls 600 from 950. No animated backing blur. |
| Dress intro | Heading/subtitle; two notices; two tab rows | Heading 800, subtitle 700 from 130; notices 750 with 140 stagger; tabs 700 with 110 stagger. Each semantic group has its own reading-window gate. |
| Palette | Heading/copy, group heading, description, five swatches, hint | 700–850; swatches 110 stagger from 260. Groups gated individually on mobile, no offscreen wave. |
| Materials | Heading, group labels, opposite-direction groups, three photo masks, notes | 750–900, photo stagger 100 from 180; mobile movement 18 px, no horizontal travel. |
| Lookbook | Heading, cream frame, image mask, badge, title/caption, pagination | 650/850/1000/600/750/700/550; delays up to 920. Allowed vertical mask, avoid horizontal mask. Navigation does not replay entrance. |
| Guests | Heading/subtitle, selectors/group labels, whole paper cards, photos, names/roles | Cards 850 with 100 wave desktop / 70 mobile; image from 160, captions 260/340. Pair cards share paper language, opposite desktop direction. |
| Program | Heading/subtitle, progressive stem, per-event time/title/detail | Stem 1100; time 850; title 750 from 160, detail 700 from 300; each event gated independently. |
| FAQ | Heading mask, short wave of rows, botanical detail | Heading 850; rows 750, 85 stagger modulo 3; each row gated at 58%. Accordion keeps its own interaction. |
| RSVP | Heading/intro, paper, identity/attendance, food/drinks/transport/other semantic groups, consents, submit/privacy | Paper 850; groups 700 with at most 140 delay, each gated at 62%; no per-radio delays. Keyboard bypass is immediate. |
| Footer | Final quiet rise/fade | 700 ms, 18 px mobile / 24 desktop. |

Main curve: cubic-bezier(.22,1,.36,1). Desktop travel 24–36 px, mobile 16–24 px. No parallax added, no large animated filters. Existing floating dock keeps 220 ms independent transition and portal placement. Reduced motion has no entrance delay, masks or movement. Existing page has one photographic Hero, not a separate two-photo chapter; no new content section is invented.


Final implementation supersedes preliminary timing estimates in this planning table: see MOTION_MAP.md. Calendar reminder, Venue panel and lookbook caption use independent reading-window gates. Full final timing, lifecycle and reduced-motion behavior are documented there.

User review adjustment: start earlier at visual80%, scene75%, card77%, detail72% from viewport top (roughly20–28% entry). Durations/choreography unchanged. Previous58–64% plan is historical.

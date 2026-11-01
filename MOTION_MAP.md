# Scroll motion: composition choreography

29 October 2026, second revision. Local only. Envelope, letter and paper-airplane choreography remain separate. No public layout redesign or backend change.

## Trigger policy

Source: `src/client/motion-scenes.mjs`. Leading edges enter reading windows measured from viewport top: **visual80%, scene75%, card77%, detail72%**. IO threshold0; negative bottom margins use pixels calculated from viewport HEIGHT. IO percentage margins resolve against WIDTH and would be incorrect in landscape. Resize recalculates margins without resetting completed scenes.

Previously the positive bottom margin started reveals below the viewport;420–650ms durations and tiny movements made some text feel static. Venue panel and lookbook caption now have independent gates so mobile text below tall images cannot finish offscreen.

Durations and delays below are ms; default easing `cubic-bezier(.22,1,.36,1)`. Opacity/travel run together. No bounce, loops, added parallax or animated backdrop blur.

| Section / trigger | Main effect and sequence | Durations, delays and stagger | Mobile |
|---|---|---|---|
| Hero / main unhidden after airplane | Photo opacity/scale1.035→1; names; date; lines/scroll | Photo1200; names750 at900/990/1080; date600 at1300; details500 at1480; total1980 | Photo1100; names700 at800/900/1000 |
| Date75% | Intro; three date segments; start time | Intro700/800; date750/850 at200/300/400; time700/800 at520 | Existing responsive date geometry retained |
| Calendar80%; reminder72% independently | Paper from side; ornament/month/weekdays/grid; reminder | Paper850/1000; contents700 at100/180/260/360; leaves900 at180; reminder550/650 | Side18; original leaf opacity .24/.25, tablet .28/.25, desktop .34/.38 |
| Countdown75% | Heading; values; unit labels | Heading650/750; values750/800 from160 in100 steps; units650/700 from340 in100 steps | Narrow layout retained; ticks never replay entrance |
| Venue photo80%, panel75% | Photo mask/scale1.025→1; separately gated olive panel; kicker/title/name/address/map | Photo900/1050; panel800/900 at250; contents650/750 from400/520/650; map600/650 at760 | Panel vertical22 instead of horizontal28; own gate below photo. Removed parking/separator and extra CTA/arrow dock have no reserved delay or wrapper |
| Dress heading75%, notices72%, tabs75% | Heading mask/subtitle; notice paragraphs; two tab rows | Heading750/850; subtitle700/800 at140; notices700/850 step140; tabs650/750 step110 | Main rise22 instead of28; original sizes retained |
| Palette heading72%, each family77% | Heading/copy; family name/description; fan of five shades; hint | Heading700/800 step140; family700/800 step120; shades750/850 from260 step110 | Each family gated separately; no offscreen second-fan wave |
| Materials heading72%, groups80%, notes72% | Labels; opposing photo groups and masks; notes | Labels700/850; photos750/900 from180/280/380; notes700/850 | Photo rise18;750/800/850; no lateral travel |
| Lookbook77%, caption77% independently | Heading; cream frame; image; badge; eyebrow/title/caption; pagination | Heading700/800; frame750/850 at160; mask1000 at300 (avoid350); badge550/650 at650; caption700/800 at480/580/700; controls550 at920 | Frame rise22; mask850; caption own gate below photo; slides do not replay entrance |
| Guests heading75%, selectors/labels72%, cards77% | Heading; selectors; couple card; family-side label; relatives. Whole paper cards, portraits and names/roles participate | Cards750/850 with0/100/200 wave; portrait850 from160; name650/750 from260; role from340 | Whole cards rise20, wave0/70/140; desktop opposing24px. Couple prints have balanced -2°/+2° tilt; side labels follow the print on every breakpoint |
| Program heading72%, events75% | Heading/subtitle; progressive stem; per-event time/title/caption | Stem1100; markers450 at160; time750/850; title700/850 at160; caption700/850 at300 | Time travel16 instead of24; each event independently gated |
| FAQ heading72%, rows72% | Heading mask; short row wave; independent accordion | Heading750/850; rows650/750 with0/85/170 repeating | Same behavior; no auto-scroll or added accordion delay; clicked-row compensation runs after layout via ResizeObserver |
| RSVP intro72%, shared trigger for whole form | Heading/intro starts paper and every semantic group, including fields below viewport; action/privacy follow | Paper750/850; groups650/750; cumulative delays100ms +85ms per group; success opacity450 | No per-field viewport gate; newly mounted details join the completed intro scene; keyboard and reduced-motion bypass retained |
| Footer75% or document-end fallback | Quiet rise/opacity | 650/750 | Remains reachable when tall viewport prevents reaching75% gate |
| Botanicals80% | Opacity and scale .98→1 | 900/1000 at180 | Existing computed opacity captured; no new assets |

## Lifecycle, accessibility and compatibility

Stable scene keys remember completed entrances across scrolling and category/slide changes. Inert family content registers on activation. Countdown text-node updates do not trigger page registration. One shared passive scroll/resize RAF continues to serve both motion and floating tabs.

A jump exceeding90% viewport height exposes passed/current content immediately. Ordinary smaller scroll uses reading windows. At document end visible pending content reveals even if a gate is physically unreachable. Focus bypass applies only to pending ancestors, avoiding a snap when already appearing controls gain focus. Instant overrides last two frames and do not disable later hover/swipe.

Floating dock keeps220ms transition, upward intent and portal placement. Venue autoplay and manual pause window remain independent. Gallery swipe/modal controls and RSVP two-guest session/validation are unchanged. No main transform, animated margins or section heights.

Reduced motion exposes content immediately with no entrance masks, translation or stagger. Switching preference flushes pending scenes. Controls never require finishing an animation for access.

## Browser evidence

`tests/qa/choreography.spec.ts`: pending at90% viewport, visible intermediate animation inside58–80%, settled compositions at390/768/1440; Hero mid/after at375/1440; restored scroll/focus/reduced motion.

`tests/qa/motion.spec.ts`:22 normal-motion viewport/reflow sizes, fast/back scroll, finished heading masks and unshifted cards, CPU4× storyboard, reduced motion. Existing100-viewport layout matrix and interaction suites retained. The125/150/200% zoom scenarios use equivalent CSS reflow, not native browser-menu zoom.

Before/mid/after screenshots and performance JSON are local artifacts under ignored `qa-artifacts/`. Ordinary baselines are captured after animation completion. Final counts and limitations are in `FULL_UI_UX_QA_REPORT.md`. The page has one photo Hero plus couple cards; no separate two-photo chapter was invented.

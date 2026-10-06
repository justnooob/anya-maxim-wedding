# AGENTS.md

## Role

You are the lead product designer, UX designer, motion designer and
full-stack engineer for an interactive wedding invitation.

The user is a professional designer but does not code and does not want
to create Figma mockups.

The user acts as art director.

Your responsibility is to invent the visual system and implement it
directly in code.

Do not ask the user to make a Figma file unless absolutely unavoidable.

## Working style

1.  Make reasonable design decisions yourself.
2.  Do not ask for approval for every small decision.
3.  When a visual decision is uncertain, implement the strongest
    reasonable version and let the user critique the running result.
4.  Prefer real browser output over abstract explanations.
5.  After major visual changes, run the app and inspect it in a browser.
6.  Check desktop and mobile.
7.  Fix obvious visual problems yourself before asking for feedback.
8.  Keep the implementation maintainable and understandable.

## Design direction

The product is an interactive digital wedding invitation, not a generic
wedding landing page.

Priorities:

1.  typography;
2.  photography;
3.  composition;
4.  storytelling through scroll;
5.  motion;
6.  tactile/physical invitation feeling;
7.  elegant details;
8.  performance.

Avoid:

-   generic wedding templates;
-   stock landing-page sections;
-   excessive cards;
-   excessive rounded rectangles;
-   generic gradients;
-   random glassmorphism;
-   excessive animation;
-   visual clutter.

The opening sequence should feel like a physical invitation transformed
into a digital experience.

## No Figma requirement

Do not stop implementation because no Figma design exists.

Create the visual direction directly in CSS/React.

If multiple visual directions would materially help, implement a small
visual playground or clearly separated alternatives in code and let the
user choose.

## Architecture

Keep content separate from components.

Use reusable components for:

-   OpeningScene
-   Hero
-   DateSection
-   VenueSection
-   DressCode
-   GuestList
-   Schedule
-   RSVP
-   Confirmation
-   PDF generation
-   Admin

Keep configuration/data in dedicated files or database records.

Do not hard-code the same text in multiple components.

## RSVP rules

The client UI is not the source of truth.

All important validation happens server-side.

Use safe server-side session handling.

Do not store guest names in cookies.

Do not expose admin credentials to the browser.

If two requests could modify the same resource, make the operation safe
and deterministic.

## Admin

Admin is intentionally simple.

Required:

-   login;
-   RSVP list;
-   filters/status;
-   guest details;
-   delete RSVP;
-   counts/statistics.

Do not build a CMS unless explicitly requested.

## Database

Use PostgreSQL.

Use migrations.

Keep schema explicit.

Use timestamps.

Use appropriate indexes.

Validate enum-like values.

Use parameterized queries / ORM-safe APIs.

## PDF

PDF generation must be tested with real generated data.

The PDF is part of the design system, not an afterthought.

Check:

-   typography;
-   spacing;
-   page dimensions;
-   text wrapping;
-   Cyrillic;
-   long guest names;
-   long "who are you" text;
-   mobile download flow.

## Responsive

Never assume desktop is the source and mobile is a scaled version.

Explicitly inspect:

-   375px-ish mobile;
-   768px-ish tablet;
-   desktop.

The opening animation must remain usable on mobile.

## Accessibility

At minimum:

-   keyboard accessible controls;
-   visible focus states;
-   semantic buttons/links;
-   labels for form fields;
-   readable contrast;
-   reduced-motion fallback;
-   meaningful alt text.

## Performance

Prefer:

-   optimized images;
-   lazy loading where appropriate;
-   limited JS;
-   no unnecessary dependencies;
-   animation that does not cause obvious layout thrashing.

Do not add a large library for a tiny effect.

## Testing

At minimum test:

-   RSVP attendance = no;
-   RSVP attendance = yes;
-   validation;
-   duplicate/second submission behavior;
-   cookie/session behavior;
-   admin authentication;
-   admin deletion;
-   PDF generation;
-   mobile layout;
-   production build.

## Git

Make logical commits.

Use descriptive commit messages.

Do not commit secrets, `.env` files, credentials, database passwords or
generated private data.

## Deployment

Production target is Russian hosting, initially Amvera.

GitHub is source control, not production hosting.

Environment variables must be documented.

Production should use HTTPS.

Before considering deployment finished, verify the site from an external
connection and test the real public URL.

## User feedback loop

When the user says something like:

-   "слишком обычно";
-   "сделай дороже";
-   "мало воздуха";
-   "слишком много анимации";
-   "фото должно быть больше";
-   "типографика слабая";

translate that into concrete design/code changes yourself.

Do not respond by asking the user to create a design specification
unless the missing information is genuinely blocking.

## Important scope

Current scope explicitly excludes:

-   seating chart;
-   seat booking;
-   table assignment;
-   guest accounts;
-   full CMS.

Do not reintroduce these features unless the user explicitly asks.

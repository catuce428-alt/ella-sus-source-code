# Local Fitness Finder

An app for sharing and finding local exercise classes, groups, and races.

## Current state — fake data phase

Per the plan: no database yet. `index.html` is fully self-contained and runs
on ~20 made-up listings, kept in one clearly marked block near the top of
the `<script>` tag (`FAKE DATA — swap this array for a real database call
later`). New listings submitted through the form are added to that same
in-memory array for the current session — they don't persist after a page
reload, which is expected at this stage.

Open `index.html` directly in a browser — nothing to install, no build step.

## What's built

- **Find Fitness** (looking view) — browse all listings, filter by category,
  filter by age group, sort by price
- **Share a Listing** (adding view) — a form to add a new listing
- Required-field validation, a 500-character cap on text fields, a 300-row
  display cap, and the empty state ("The ball's in your court — app is
  waiting for uploads")

## What's intentionally not built (per the plan)

- Accounts, logins, or passwords
- Editing or deleting a listing after it's submitted
- Real-time chat or messaging

## Moving to the real database, when it's time

1. Run `schema.sql` in the Supabase SQL editor for the project at
   `sayvdhthkbuwcbzlnmnz.supabase.co`. It creates one table,
   `fitness_listings`, with columns matching the app exactly, plus Row
   Level Security that allows public read and public insert — and
   deliberately no update/delete policy, since editing/deleting isn't a
   feature here.
2. `config.js` already has the project URL and public key filled in — it's
   just not loaded by `index.html` yet.
3. Swap the FAKE DATA array and the form's `listings.unshift(...)` line for
   real Supabase calls — see the comments inside `config.js` for the exact
   calls to use.

## Files

- `index.html` — the whole app
- `schema.sql` — database schema, ready to run when needed
- `config.js` — Supabase credentials, ready to wire in when needed

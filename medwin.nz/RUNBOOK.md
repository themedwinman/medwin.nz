# Dynamic projects — setup & operations

The projects on the site are now driven by a **Supabase** database and edited
through a password-protected admin page — no code edits, no commits, no pushes
to add a project.

- **Supabase project:** `medwin-nz` (region Sydney) — ref `ruvwewscxjmnrqsggoys`
- **Dashboard:** https://supabase.com/dashboard/project/ruvwewscxjmnrqsggoys
- **Admin page (once deployed):** `https://medwin.nz/admin.html`
- **Admin login email:** `oli@medwin.nz` (writes are locked to this address in the DB)

---

## Already done (by Claude, via the Supabase API)

- Created the Supabase project and the `projects` table (see `schema.sql`).
- Row Level Security: the public can **read** visible projects; only the admin
  account (`oli@medwin.nz`) can **write**. Verified: anonymous writes return 401.
- Created a public **`project-images`** storage bucket for thumbnails (5 MB /
  image, images only), with admin-only uploads.
- Seeded your four real projects (Arena — featured, Homelab — featured, Personal
  Finance Dashboard, MCP-Hosting VPS).
- Wrote the frontend integration and the admin page. Security advisors: clean.

The Supabase URL and publishable key live in `supabase.js`. **Both are safe to
commit and expose** — they are designed for browser use, and RLS is the actual
access control. No environment variables or secrets are required.

---

## What you need to do (one-time, ~3 minutes)

### 1. Create your admin user
Dashboard → **Authentication → Users → Add user → Create new user**
(https://supabase.com/dashboard/project/ruvwewscxjmnrqsggoys/auth/users)

- Email: **oli@medwin.nz**  (must match exactly — writes are gated on it)
- Password: choose a strong one (this is your admin password)
- Tick **Auto Confirm User** so you can log in immediately.

> Claude can't create accounts or set passwords — this step is yours.

### 2. Disable public sign-ups (recommended)
Dashboard → **Authentication → Sign In / Providers → Email** → turn **off**
"Allow new users to sign up", then Save.

Not strictly required (writes are already locked to your email), but it stops
strangers creating accounts at all. Belt and suspenders.

### 3. Deploy
The site is still fully static — Vercel needs no new settings, no env vars, no
build step. Just merge this branch to `main` and Vercel deploys as usual.

Then visit `https://medwin.nz/admin.html`, log in, and add/edit projects.

---

## Using the admin page

- **Add**: fill the form (only *Title* is required) and Save.
  - *Card description* = the short blurb on the tile.
  - *Detail* = the modal content; HTML is allowed (`<h4>`, `<ul><li>…`).
  - *Category* = the label after "Project 0N ·" (e.g. `Full-stack`).
  - *Tags* = comma-separated.
  - *Featured* = also show it on the homepage (first featured gets the big split
    layout). *Visible* = uncheck to hide without deleting.
  - *Photo* = optional; uploads straight to Supabase Storage.
- **Edit**: click *Edit* on a row; leave the photo empty to keep the current one.
- **Delete**: removes the row (and best-effort deletes its stored image).
- **Log out** when done.

Changes appear on the site immediately on next page load.

---

## Good to know

- **Free-tier pause:** if the database gets *zero* traffic for 7 days, Supabase
  pauses it. The site handles this gracefully — real project cards are baked into
  the HTML as a fallback and only get replaced once a live fetch succeeds, so
  visitors always see content. To unpause: open the dashboard and click Resume.
  Any normal traffic keeps it awake; a free weekly cron ping would keep it awake
  permanently if you ever want that.
- **The fallback cards** live in `index.html` and `projects.html`. If you change
  your seeded projects a lot, it's worth updating those static cards to match, so
  the offline/paused view stays current. (Optional.)
- **Changing the admin email** later means updating the RLS policies in
  `schema.sql` and re-applying them — ask Claude to do it.

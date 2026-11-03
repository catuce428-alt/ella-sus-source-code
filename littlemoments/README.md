# Little Moments ♡

A complete source package for a small private memory journal, rebuilt from scratch around Ella’s pink AI Lab Portfolio reference. It preserves the two external project links and includes a new Little Moments experience. It does not modify the existing Lovable site or import its users/data.

**Start here:** unzip this folder. Follow the numbered steps below. You do not need Lovable to run this version.

## What is included

- Pink/plum responsive design, landing page, project hub, and journal dashboard.
- Email/password sign-up, confirmation flow, sign-in, sign-out, password recovery, optional Google OAuth.
- Create/edit memories, dates, moods, tags, search, favorites, Trash/restore/permanent deletion.
- Private files: JPEG, PNG, WebP, PDF, MP3, WAV, MP4; 10 MB maximum per file, enforced by the bucket. Image/audio/video previews and downloads; PDFs download only.
- Read-only sharing to another registered account using its Settings sharing code. Revoke access or leave a received share.
- Profile editing, JSON writing export, and account deletion (remove attachments first).
- Database-enforced administrator permissions, account suspension/restoration, announcements, and account-action audit log. Admins cannot read unshared journals through the app.
- Supabase SQL migration and administrator bootstrap SQL.
- GitHub Pages deployment workflow, reproducible dependency lockfile, and automated tests.
- Explicit demo mode: writing saved in sessionStorage for this tab; attachments in memory only. Demo sign-in/sharing/admin are not simulated as working cloud features.

## 1. Install and preview

Install Node.js 22 or newer from https://nodejs.org. Open a terminal in the extracted `little-moments` folder (the folder containing `package.json`). Run:

```sh
npm ci
npm run dev
```

Open the localhost address printed in the terminal. Click **Explore a demo** to inspect the design without Supabase. Do not double-click `index.html`: the app needs Vite or a deployed build.

## 2. Create your Supabase project

1. Open https://supabase.com/dashboard and create a **new** project. Keep the database password private.
2. Wait for the project to finish provisioning.
3. Open **SQL Editor → New query**.
4. Open `supabase/migrations/202611030001_initial.sql` on your computer. Copy the entire file into SQL Editor and run it **once**.
5. Confirm the `profiles`, `admins`, `memories`, `memory_shares`, `announcements`, and `admin_audit` tables exist, and that Storage contains a **private** `memory-files` bucket.

The migration creates database constraints, row-level security policies, private storage rules, signup profile creation, and restricted admin/account-deletion functions. Do not disable RLS or make the bucket public to solve an error. This migration is for a new project; do not run it against an existing production schema without reviewing conflicts.

CLI alternative, for developers who already use Supabase CLI: initialize/link your project and run `supabase db push` using the included migrations directory. Do not apply the same migration both manually and through the CLI without first reconciling migration history.

## 3. Connect the app

Find your project URL and **publishable key** (or legacy `anon` key) in the project Connect/API settings. Make a copy of `.env.example` called `.env` in the same folder:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
VITE_ENABLE_GOOGLE=false
```

Paste the two public client values. Never put a `service_role` key, Supabase secret key, database password, or Google client secret in a `VITE_` variable: these are bundled into the browser. Stop and restart `npm run dev` after editing `.env`.

The client key is intentionally public; database and storage RLS protect the data. `.gitignore` excludes `.env` and permits `.env.example`.

## 4. Configure sign-in and email

In Supabase Authentication:

1. Enable the Email provider and **Confirm email**.
2. Set a minimum password length of **12** characters to match the app.
3. Under URL configuration, add your local development URL as an allowed redirect, normally `http://localhost:5173/` (use the actual port printed by Vite).
4. Later, set **Site URL** to your deployed HTTPS app URL and add that exact URL, including the repository path/trailing slash, to allowed redirects.
5. Configure your own SMTP provider for real users. Supabase’s default mail service has restrictions; verify confirmation and reset mail delivery before launch.
6. Test sign-up with an email you control. Open the confirmation link. Sign in, then test **Forgot password?** in a signed-out browser. The reset link must open the new-password form.
7. Review auth rate limits and abuse protections before opening public registration.

Optional Google sign-in: configure a Google OAuth client in Google Cloud and Supabase’s Google provider, using the callback URL Supabase supplies. Put the Google secret only in Supabase. Set `VITE_ENABLE_GOOGLE=true`, then rebuild. Keep it false until the provider is configured.

## 5. Make your own account an administrator

1. Sign up through your app and confirm your email.
2. Open `supabase/bootstrap-admin.sql`.
3. Replace `REPLACE_WITH_YOUR_EMAIL` with your exact account email.
4. Run that SQL in Supabase SQL Editor.
5. Sign out and back in. **Admin panel** appears in the sidebar.

No browser user can grant themselves this role. Admins can view the account roster, suspend/restore non-admin accounts, and publish/remove notices. They cannot suspend themselves or other admins through the app. To remove a role, a project owner can run `delete from public.admins where user_id = 'THE_USER_UUID';` in SQL Editor.

Suspension blocks journal/database/file operations, including reads, and hides the suspended owner’s shared memories. It does not itself revoke the underlying Supabase Auth session. If you need a full identity ban, use Supabase Authentication administration as well. The SQL policies remain the enforcement boundary.

## 6. Check sharing and uploads

Create two accounts, A and B, using separate browser profiles:

1. As A, save a memory, then upload a small image. Open it to preview/download.
2. As B, copy the sharing code from **Settings**.
3. As A, open the memory → **Share** → paste B’s code.
4. As B, refresh and open **Shared with me**. Only that memory should appear. B cannot edit or add files.
5. Revoke B’s access as A. Refresh B’s app. The memory and future attachment downloads must be unavailable.
6. Move A’s memory to Trash. Restore it, or permanently delete it and its files.

Sharing codes are account UUIDs, not passwords. They avoid a publicly searchable email directory. Recipients must already have an account. There is no email invitation delivery. Revocation cannot recall downloaded copies, or erase a page already loaded into someone’s browser. Restoring a trashed memory restores its existing shares.

## 7. Upload the folder to GitHub

Create a new empty repository, for example `little-moments`. Upload the **contents** of this folder to the repository root, keeping the directory structure. Include `.github/workflows/pages.yml`, `.gitignore`, `.env.example`, `src/`, `supabase/`, `tests/`, `package.json`, `package-lock.json`, `vite.config.js`, and `index.html`.

Do not upload `node_modules/`, `dist/`, or `.env`. A Git client is the easiest way to preserve dotfiles:

```sh
git init
git add .
git commit -m "Build Little Moments memory journal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/little-moments.git
git push -u origin main
```

Use your actual repository URL. If using a graphical Git client, add this folder, commit, and publish the repository instead.

## 8. Publish with GitHub Pages

1. In the repository, open **Settings → Secrets and variables → Actions → Variables**.
2. Add repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same public values as `.env`.
3. Add `VITE_ENABLE_GOOGLE` with `false` (or `true` once configured).
4. Open **Settings → Pages** and select **GitHub Actions** as the build source.
5. Open **Actions → Deploy Little Moments → Run workflow**. Future pushes to `main` also deploy.
6. Wait for both jobs to pass. Use the URL returned by the deployment; normally `https://YOUR_USERNAME.github.io/little-moments/`.
7. Put that exact production URL into Supabase’s Site URL and allowed redirect list (Step 4).
8. Test sign-up, email verification, password recovery, sharing, and upload again on the deployed URL.

Vite uses a relative asset base, so repository subpaths work. Navigation uses hashes; no server rewrite is required. Do not deploy raw source as a static site: the workflow builds `dist/`. If you change environment variables, rerun the workflow to rebuild. A deployment without variables shows the demo and a setup message, not functioning authentication.

Alternative hosting: build command `npm ci && npm run build`, output directory `dist`, same environment variables. Configure the exact host URL in Supabase.

## 9. Before you call it finished

The source is implemented and locally tested, but your live Supabase configuration is not pre-provisioned. Complete these acceptance checks:

- [ ] SQL migration succeeds in your new project; Supabase Security Advisor reviewed.
- [ ] Confirmation emails and recovery links work on the production domain.
- [ ] Two-user isolation/sharing/revocation tested against actual Supabase.
- [ ] Image, PDF, audio/video upload/download tested; disallowed type and >10 MB rejected.
- [ ] Admin role cannot be self-assigned; suspension and restoration work.
- [ ] Export downloaded and inspected; Trash restore and permanent deletion checked.
- [ ] Mobile layout and keyboard navigation checked on your devices.
- [ ] Replace generic privacy copy with your operator/contact details and actual retention/backup practices before accepting other people’s personal data.
- [ ] Review your Supabase plan, spending limits, database backups, and **separate storage-file backup** process. JSON export contains writing, not attachments.
- [ ] Run `npm test`, `npm run build`, and `npm audit` after dependency changes.

## Security and intentional limits

- This is a private-journal application, not end-to-end encrypted storage. The Supabase project owner can access data through operator tools. The in-app admin role does not bypass journal RLS.
- No journal content is sent to an AI provider. Google Fonts requests load typography; remove the CSS import and use system fonts if you prefer no third-party font requests.
- Storage access uses authenticated blob downloads instead of long-lived public URLs. Files are never served from a public bucket. HTML/SVG are disallowed. Browser MIME checks and bucket restrictions are not malware scanning; do not treat uploaded PDFs/media as inherently safe.
- Per-file limit is 10 MB. No per-account total-storage or memory-count quota is implemented. Monitor project usage; add a server-controlled quota system before a large public rollout.
- First 100 attachments are displayed per memory. Permanent deletion processes all file pages. Normal memories are fetched in 500-row batches; large journals should move to server-side search/pagination rather than loading everything into the browser. Admin roster is subject to the project’s API row limit.
- Account deletion requires removing all uploaded attachments first. Admins must first have their admin role removed by the project owner. Suspension may require operator assistance for export/deletion.
- Trash has no automatic expiry. Permanent deletion removes files first, then the record. If interrupted, retry; remaining files and the record are preserved for cleanup. Already deleted files cannot be restored.
- A database trigger refuses direct deletion of a memory while its files still exist. Delete files through the Storage API first. Never delete storage metadata directly in SQL.
- Sharing is read-only and account-based; no public links, comments, friend directory, email invites, or real-time synchronization. Refresh to see another user’s changes.
- No migration of the original Lovable database and no modification of the linked game/fitness projects is included.

## Project map

```text
src/main.js                   screens, forms, auth lifecycle, interactions
src/api.js                    Supabase data and private storage operations
src/domain.js                 validation, filtering, escaping, UUIDs
src/style.css                 responsive visual design
supabase/migrations/          database, policies, storage, restricted functions
supabase/bootstrap-admin.sql  one-time admin assignment
tests/                       validation and PostgreSQL authorization tests
.github/workflows/pages.yml   test/build/deploy to GitHub Pages
```

## Test coverage and verification

`npm test` runs input/filter tests plus a PGlite PostgreSQL test that executes the actual migration against mock Supabase auth/storage schemas. It checks owner isolation, file permissions, share/revoke, trash visibility, spoofed owners, admin escalation, protected profile columns, suspension, audit entries, account deletion guards, and anonymous denial. This exercises real PostgreSQL RLS; it is **not** a live Supabase Storage/Auth integration test.

Browser QA exercises the local demo. Email delivery, Google OAuth, real uploads, real account lifecycle, and deployment require your Supabase project and remain part of the acceptance checklist above.

Official setup references:

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

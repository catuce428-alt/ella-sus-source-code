# Little Moments
Build 2 plan: CONFIRMED by Build 2 Planner on October 6, 2026.

## What the app does and who it's for
"Little Moments" is a private personal memory journal app built for friends and family. Users can record special memories with titles, dates, journal text, and photos. Users view their memories arranged chronologically in a "Memory Lane" timeline. Test users include classmates Bob, Bobby, and Stephany.

## Sign-in
- Email and password sign-in.
- GitHub OAuth sign-in.
- Supabase password policy: minimum 8 characters, requiring at least one lowercase letter, one uppercase letter, and one number.

## Tables
1. `profiles`
   - `id` (uuid, primary key, references auth.users)
   - `username` (text, unique)
   - `created_at` (timestamp)

2. `memories`
   - `id` (uuid, primary key)
   - `user_id` (uuid, references auth.users)
   - `title` (text)
   - `memory_date` (date)
   - `entry` (text)
   - `photo_url` (text, optional)
   - `created_at` (timestamp)

## Who can see what
- `profiles`: Users can read any username to check availability, but can only insert or update their own row (`id = auth.uid()`).
- `memories`: Strict Row-Level Security (RLS). Signed-in users can SELECT, INSERT, UPDATE, and DELETE rows where `user_id = auth.uid()`. No user can view or alter another user's memories.

## Buckets
- Bucket name: `memory-photos`
- Bucket privacy: Private
- File size limit: 5 MB per photo
- Allowed file types: `.png`, `.jpg`, `.jpeg`, `.webp`
- RLS Policy: Users can upload, read, and delete files stored under their own user ID folder (`user_id/*`).

## Screens
1. **Authentication Screen:** Sign up, sign in with email/password or GitHub.
2. **Username Setup Screen:** First-time onboarding screen to choose a unique username.
3. **Memory Lane (Main View):** Timeline feed showing memory cards (photo, date, title, preview). Includes controls to view details, create a new entry, edit, or delete.
4. **Account & Password Settings Screen:** Allows email users to change their password and view account details.

## Code files
- `index.html`: Contains all markup structure and CSS styling, loading `config.js` before `app.js`.
- `app.js`: Houses all application logic, Supabase authentication handlers, database queries, and storage logic.
- `config.js`: Contains only the Supabase URL and publishable API key.

## Rules for every chat
- This app uses exactly three code files: index.html, app.js, config.js. Do not create more.
- index.html contains the HTML and CSS, and loads config.js before app.js.
- config.js contains only the Supabase URL and the publishable key.
- When you change code, name the file and give me the whole file, not a snippet.
- Change nothing I did not ask you to change.
- Never put a secret key in any file.

## Addresses
GitHub Pages URL: to fill in

## Secrets
- GitHub Client Secret: Stored exclusively in the Supabase Dashboard under Auth Settings (never in code or project.md).

## Where we are right now
Planning complete, nothing built yet.

## NOT doing, on purpose
- Social sharing / public memory feeds (belongs to social apps in future builds).
- AI automatic memory summarization (belongs to Build 4).
- Password recovery via automated reset emails (limited by Supabase free email quota).

## Next thing I want to add
Set up Supabase sign-in settings, then email + password sign-in.

## Change log
- October 6, 2026: Planning session with Build 2 Planner. Plan confirmed.
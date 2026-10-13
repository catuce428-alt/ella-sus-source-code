# Little Moments
Build 2 plan: CONFIRMED by Build 2 Planner on October 6, 2026.

## What the app does and who it's for
"Little Moments" is a personal memory journal and selective sharing app built for friends and family. Users can write entries with titles, dates, journal text, and photos. Memories can remain strictly private, be published to all app users, or shared with specific chosen users. Test users include classmates Bob, Bobby, and Stephany.

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
   - `visibility` (text: 'private', 'public', or 'shared')
   - `created_at` (timestamp)

3. `memory_shares`
   - `id` (uuid, primary key)
   - `memory_id` (uuid, references memories)
   - `shared_with_user_id` (uuid, references auth.users)

## Who can see what
- `profiles`: All authenticated users can read `id` and `username` to select users for memory sharing. Users can only insert or update their own profile (`id = auth.uid()`).
- `memories`:
  - **SELECT:** Signed-in users can view memories if `user_id = auth.uid()`, OR `visibility = 'public'`, OR `id` exists in `memory_shares` where `shared_with_user_id = auth.uid()`.
  - **INSERT / UPDATE / DELETE:** Signed-in users can only modify memories where `user_id = auth.uid()`.
- `memory_shares`:
  - **SELECT:** Memory creators (`user_id = auth.uid()`) or recipients (`shared_with_user_id = auth.uid()`).
  - **INSERT / DELETE:** Memory creators only.

## Buckets
- Bucket name: `memory-photos`
- Bucket privacy: Private
- File size limit: 5 MB per photo
- Allowed file types: `.png`, `.jpg`, `.jpeg`, `.webp`
- RLS Policy: Users can upload and delete files under their own folder (`user_id/*`). Authenticated users can read photo objects associated with memories they have access to view.

## Screens
1. **Authentication Screen:** Sign up and sign in via email/password or GitHub.
2. **Username Setup Screen:** First-time setup to pick a unique username.
3. **Memory Lane & Shared Feed Screen:** Multi-tab view showing "My Private Memories", "Shared with Me", and "Public Moments".
4. **Create / Edit Memory Modal:** Interface to write/edit entries, upload photos, and set visibility (Private, Everyone, or Select Specific Usernames).
5. **Account & Password Settings Screen:** Change password for email accounts and view user details.

## Code files
- `index.html`: Contains all markup structure and CSS styling, loading `config.js` before `app.js`.
- `app.js`: Houses all application logic, Supabase authentication handlers, database queries, and storage upload logic.
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
- AI memory summarization or auto-tagging (belongs to Build 4).
- Real-time instant messaging / chat threads (belongs to Build 3).
- Password recovery via automated reset emails (limited by Supabase free email quota).

## Next thing I want to add
Set up Supabase sign-in settings, then email + password sign-in.

## Change log
- October 6, 2026: Updated plan to include selective user sharing and public feed visibility. Plan re-confirmed.
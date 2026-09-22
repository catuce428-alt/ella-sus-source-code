/* Local Fitness Finder — Supabase configuration.
   Not used yet — index.html currently runs entirely on the fake data
   array inside it, per the brief ("No database yet. That comes later").

   When it's time to connect the real database:
   1. Run schema.sql in the Supabase SQL editor (Project > SQL Editor).
   2. Include the Supabase JS client and this file in index.html:
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
        <script src="./config.js"></script>
   3. Replace the FAKE DATA block in index.html with calls like:
        const sb = supabase.createClient(FITNESS_CONFIG.SUPABASE_URL, FITNESS_CONFIG.SUPABASE_KEY);
        const { data, error } = await sb.from('fitness_listings').select('*').order('date_time');
      ...and for adding a listing:
        await sb.from('fitness_listings').insert({ name, title, location, date_time, cost, target_age, category });

   Never put a service-role key here — only the public/publishable key,
   same as this one. That's safe to expose in frontend code because Row
   Level Security (set up in schema.sql) is what actually controls access.
*/
window.FITNESS_CONFIG = {
  SUPABASE_URL: "https://sayvdhthkbuwcbzlnmnz.supabase.co",
  SUPABASE_KEY: "sb_publishable_bmZF5fAuoWyvAyKjVAU3Lw_WIkJ5jil"
};

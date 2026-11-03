-- After creating and verifying YOUR account, replace the email and run in SQL Editor.
-- Never expose this operation through a browser or use user_metadata as an admin flag.
insert into public.admins(user_id)
select id from auth.users where email = 'REPLACE_WITH_YOUR_EMAIL'
on conflict do nothing;

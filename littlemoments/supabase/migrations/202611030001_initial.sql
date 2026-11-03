-- Run once in a NEW Supabase project's SQL Editor, or use `supabase db push`.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Memory keeper' check(char_length(display_name) between 1 and 80),
 suspended boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table public.memories (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
 title text not null check(char_length(trim(title)) between 1 and 120),
 body text not null default '' check(char_length(body)<=20000),
 memory_date date not null default current_date,
 mood text not null default 'grateful' check(mood in ('grateful','happy','calm','nostalgic','sad','excited')),
 tags text[] not null default '{}' check(cardinality(tags)<=10 and char_length(array_to_string(tags,','))<=309),
 favorite boolean not null default false, deleted_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.memory_shares (
 memory_id uuid not null references public.memories(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(memory_id,recipient_id)
);
create table public.announcements(id uuid primary key default gen_random_uuid(),body text not null check(char_length(trim(body)) between 1 and 500),created_at timestamptz not null default now());
create table public.admin_audit(id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,target_id uuid,action text not null,created_at timestamptz not null default now());
create index memories_owner_date on public.memories(user_id,memory_date desc);
create index shares_recipient on public.memory_shares(recipient_id);
create function public.active_user() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and not suspended) $$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select public.active_user() and exists(select 1 from public.admins where user_id=auth.uid()) $$;
create function public.owns_memory(mid uuid) returns boolean language sql stable security definer set search_path='' as $$ select public.active_user() and exists(select 1 from public.memories where id=mid and user_id=auth.uid()) $$;
create function public.can_read_memory(mid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.active_user() and exists(select 1 from public.memories m where m.id=mid and (m.user_id=auth.uid() or (m.deleted_at is null and exists(select 1 from public.profiles p where p.id=m.user_id and not p.suspended) and exists(select 1 from public.memory_shares s where s.memory_id=m.id and s.recipient_id=auth.uid()))))
$$;
create function public.file_access(object_name text,write_access boolean) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.memories m where m.id::text=split_part(object_name,'/',2) and m.user_id::text=split_part(object_name,'/',1) and case when write_access then public.owns_memory(m.id) else public.can_read_memory(m.id) end)
$$;
create function public.new_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'display_name',80),''),'Memory keeper'));return new;end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.new_profile();
create function public.touch_memory() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now();return new;end $$;
create trigger memory_updated before update on public.memories for each row execute function public.touch_memory();
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.memories enable row level security;
alter table public.memory_shares enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_audit enable row level security;
revoke all on public.profiles,public.admins,public.memories,public.memory_shares,public.announcements,public.admin_audit from anon,authenticated;
grant select on public.profiles,public.admins,public.admin_audit to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select,insert,update,delete on public.memories,public.memory_shares,public.announcements to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profiles_edit on public.profiles for update to authenticated using(id=auth.uid() and public.active_user()) with check(id=auth.uid() and public.active_user());
create policy admins_read on public.admins for select to authenticated using(user_id=auth.uid() and public.is_admin());
create policy memories_read on public.memories for select to authenticated using(public.can_read_memory(id));
create policy memories_insert on public.memories for insert to authenticated with check(user_id=auth.uid() and public.active_user());
create policy memories_edit on public.memories for update to authenticated using(public.owns_memory(id)) with check(user_id=auth.uid() and public.active_user());
create policy memories_delete on public.memories for delete to authenticated using(public.owns_memory(id) and deleted_at is not null);
create policy shares_read on public.memory_shares for select to authenticated using(public.owns_memory(memory_id) or (recipient_id=auth.uid() and public.can_read_memory(memory_id)));
create policy shares_insert on public.memory_shares for insert to authenticated with check(public.owns_memory(memory_id) and recipient_id<>auth.uid());
create policy shares_delete on public.memory_shares for delete to authenticated using(public.owns_memory(memory_id) or (recipient_id=auth.uid() and public.active_user()));
create policy announcements_read on public.announcements for select to authenticated using(public.active_user());
create policy announcements_insert on public.announcements for insert to authenticated with check(public.is_admin());
create policy announcements_delete on public.announcements for delete to authenticated using(public.is_admin());
create policy audit_read on public.admin_audit for select to authenticated using(public.is_admin());
create function public.admin_set_suspended(target uuid,disabled boolean) returns void language plpgsql security definer set search_path='' as $$ begin
 if not public.is_admin() then raise exception 'Administrator access required';end if;
 if target=auth.uid() or exists(select 1 from public.admins where user_id=target) then raise exception 'Administrators cannot be suspended here';end if;
 update public.profiles set suspended=disabled where id=target;
 if not found then raise exception 'Account not found';end if;
 insert into public.admin_audit(actor_id,target_id,action) values(auth.uid(),target,case when disabled then 'suspend' else 'restore' end);
 end $$;
-- No public grants on role-changing operations. Bootstrap admins only via SQL Editor.
create function public.delete_my_account() returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Sign in first';end if;
 if exists(select 1 from public.admins where user_id=auth.uid()) then raise exception 'Remove your admin role in the SQL Editor before deleting this account';end if;
 if exists(select 1 from storage.objects where bucket_id='memory-files' and split_part(name,'/',1)=auth.uid()::text) then raise exception 'Delete all attachments first, including files in Trash';end if;
 delete from auth.users where id=auth.uid();end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('memory-files','memory-files',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf','audio/mpeg','audio/wav','video/mp4']);
create policy files_read on storage.objects for select to authenticated using(bucket_id='memory-files' and public.file_access(name,false));
create policy files_insert on storage.objects for insert to authenticated with check(bucket_id='memory-files' and public.file_access(name,true));
create policy files_delete on storage.objects for delete to authenticated using(bucket_id='memory-files' and public.file_access(name,true));
revoke execute on function public.active_user(),public.is_admin(),public.owns_memory(uuid),public.can_read_memory(uuid),public.file_access(text,boolean),public.admin_set_suspended(uuid,boolean),public.delete_my_account(),public.new_profile(),public.touch_memory() from public;
grant execute on function public.active_user(),public.is_admin(),public.owns_memory(uuid),public.can_read_memory(uuid),public.file_access(text,boolean),public.admin_set_suspended(uuid,boolean),public.delete_my_account() to authenticated;

-- Refuse direct record deletion while files exist, including API calls outside this UI.
create function public.require_empty_memory() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if exists(select 1 from storage.objects where bucket_id='memory-files' and split_part(name,'/',1)=old.user_id::text and split_part(name,'/',2)=old.id::text) then raise exception 'Delete memory attachments before deleting the record';end if;
 return old;end $$;
create trigger memory_delete_guard before delete on public.memories for each row execute function public.require_empty_memory();
revoke execute on function public.require_empty_memory() from public;

commit;

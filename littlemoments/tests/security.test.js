import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("SQL migration and access-control boundaries in PostgreSQL", async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to authenticated,anon;
 grant select,insert,delete on storage.objects to authenticated;
 grant execute on function auth.uid() to authenticated,anon;`);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202611030001_initial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const a = "00000000-0000-4000-8000-000000000001",
    b = "00000000-0000-4000-8000-000000000002",
    c = "00000000-0000-4000-8000-000000000003",
    m = "10000000-0000-4000-8000-000000000001";
  await db.exec(
    `insert into auth.users(id) values('${a}'),('${b}'),('${c}');insert into public.admins values('${c}');`,
  );
  const as = async (id) => {
    await db.exec(
      `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`,
    );
  };
  const rows = async (sql) => (await db.query(sql)).rows;
  await as(a);
  await db.exec(
    `insert into public.memories(id,title) values('${m}','Private story');insert into storage.objects(bucket_id,name) values('memory-files','${a}/${m}/photo.jpg');`,
  );
  assert.equal(
    (await rows("select * from public.memories")).length,
    1,
    "owner reads own memory",
  );
  await as(b);
  assert.equal(
    (await rows("select * from public.memories")).length,
    0,
    "stranger cannot read",
  );
  assert.equal(
    (await rows("select * from storage.objects")).length,
    0,
    "stranger cannot read file",
  );
  await assert.rejects(
    db.exec(
      `insert into public.memories(title,user_id) values('Spoof','${a}')`,
    ),
    "cannot spoof owner",
  );
  await assert.rejects(
    db.exec(`insert into public.admins values('${b}')`),
    "cannot self-promote",
  );
  await assert.rejects(
    db.exec(`update public.profiles set suspended=false where id='${b}'`),
    "cannot edit protected profile columns",
  );
  await assert.rejects(
    db.exec(`select public.admin_set_suspended('${a}',true)`),
    "non-admin RPC rejected",
  );
  await as(c);
  assert.equal(
    (await rows("select * from public.memories")).length,
    0,
    "admin cannot read private memories",
  );
  assert.equal(
    (await rows("select * from storage.objects")).length,
    0,
    "admin cannot read private files",
  );
  assert.equal(
    (await rows("select * from public.profiles")).length,
    3,
    "admin sees account roster",
  );
  await as(a);
  await db.exec(`insert into public.memory_shares values('${m}','${b}',now())`);
  await as(b);
  assert.equal(
    (await rows("select * from public.memories")).length,
    1,
    "recipient can read shared memory",
  );
  assert.equal(
    (await rows("select * from storage.objects")).length,
    1,
    "recipient can read shared file",
  );
  await db.exec(`update public.memories set title='Hacked' where id='${m}'`);
  assert.equal(
    (await rows("select title from public.memories"))[0].title,
    "Private story",
    "recipient cannot edit",
  );
  await assert.rejects(
    db.exec(
      `insert into storage.objects(bucket_id,name) values('memory-files','${a}/${m}/bad.jpg')`,
    ),
    "recipient cannot upload",
  );
  await as(a);
  await db.exec(`update public.memories set deleted_at=now() where id='${m}'`);
  await assert.rejects(
    db.exec(`delete from public.memories where id='${m}'`),
    "cannot orphan attachments with direct deletion",
  );
  await as(b);
  assert.equal(
    (await rows("select * from public.memories")).length,
    0,
    "trash hidden from recipient",
  );
  assert.equal(
    (await rows("select * from storage.objects")).length,
    0,
    "trashed attachments hidden",
  );
  await as(a);
  await db.exec(
    `update public.memories set deleted_at=null where id='${m}';delete from public.memory_shares where memory_id='${m}'`,
  );
  await as(b);
  assert.equal(
    (await rows("select * from public.memories")).length,
    0,
    "revoked share hidden",
  );
  await as(c);
  await db.exec(`select public.admin_set_suspended('${a}',true)`);
  assert.equal(
    (await rows("select * from public.admin_audit")).length,
    1,
    "admin action audited",
  );
  await as(a);
  assert.equal(
    (await rows("select * from public.memories")).length,
    0,
    "suspended owner blocked",
  );
  await assert.rejects(
    db.exec(`insert into public.memories(title) values('Blocked')`),
  );
  await as(c);
  await db.exec(`select public.admin_set_suspended('${a}',false)`);
  await as(a);
  await assert.rejects(
    db.exec("select public.delete_my_account()"),
    "account deletion blocks orphaned files",
  );
  await db.exec(
    `delete from storage.objects;select public.delete_my_account()`,
  );
  await db.exec("reset role");
  assert.equal(
    (await rows(`select * from auth.users where id='${a}'`)).length,
    0,
    "account deletion succeeds after files removed",
  );
  await db.exec("set role anon");
  await assert.rejects(
    db.exec("select * from public.memories"),
    "anonymous access denied",
  );
  await db.close();
});

import { createClient } from "@supabase/supabase-js";
import { validateFile, uuid } from "./domain";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key && !url.includes("YOUR_PROJECT"));
export const db = configured ? createClient(url, key) : null;
export const callback = () => location.origin + location.pathname;
export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}
export async function listMemories() {
  const all = [];
  for (let offset = 0; ; offset += 500) {
    const page = unwrap(
      await db
        .from("memories")
        .select("*")
        .order("memory_date", { ascending: false })
        .order("id")
        .range(offset, offset + 499),
    );
    all.push(...page);
    if (page.length < 500) return all;
  }
}
export async function saveMemory(memory) {
  return unwrap(await db.from("memories").upsert(memory).select().single());
}
export async function patchMemory(id, patch) {
  return unwrap(
    await db.from("memories").update(patch).eq("id", id).select().single(),
  );
}
export async function listFiles(id) {
  return unwrap(
    await db.storage
      .from("memory-files")
      .list(`${(await getMemory(id)).user_id}/${id}`, { limit: 100 }),
  );
}
async function getMemory(id) {
  return unwrap(await db.from("memories").select("*").eq("id", id).single());
}
export async function uploadFile(memory, file) {
  validateFile(file);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  return unwrap(
    await db.storage
      .from("memory-files")
      .upload(`${memory.user_id}/${memory.id}/${uuid()}--${safe}`, file, {
        upsert: false,
        contentType: file.type,
      }),
  );
}
export async function openFile(path) {
  const blob = unwrap(await db.storage.from("memory-files").download(path));
  return URL.createObjectURL(blob);
}
export async function removeFile(path) {
  unwrap(await db.storage.from("memory-files").remove([path]));
}
export async function purgeMemory(memory) {
  let files;
  do {
    files = unwrap(
      await db.storage
        .from("memory-files")
        .list(`${memory.user_id}/${memory.id}`, { limit: 100 }),
    );
    if (files.length)
      unwrap(
        await db.storage
          .from("memory-files")
          .remove(files.map((f) => `${memory.user_id}/${memory.id}/${f.name}`)),
      );
  } while (files.length === 100);
  unwrap(await db.from("memories").delete().eq("id", memory.id));
}

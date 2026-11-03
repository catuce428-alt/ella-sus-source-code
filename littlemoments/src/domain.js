export const TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
];
export function validateFile(file) {
  if (!TYPES.includes(file.type))
    throw Error("Choose a JPG, PNG, WebP, PDF, MP3, WAV, or MP4 file.");
  if (file.size > 10 * 1024 * 1024)
    throw Error("Files must be 10 MB or smaller.");
  if (!file.size) throw Error("The file is empty.");
}
export function cleanMemory(input) {
  const title = input.title.trim(),
    body = input.body.trim();
  if (!title || title.length > 120)
    throw Error("Add a title between 1 and 120 characters.");
  if (body.length > 20000)
    throw Error("Keep your memory under 20,000 characters.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.memory_date))
    throw Error("Choose a date.");
  const tags = [
    ...new Set(
      input.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (tags.length > 10 || tags.some((t) => t.length > 30))
    throw Error("Use up to 10 tags, each under 31 characters.");
  return {
    title,
    body,
    memory_date: input.memory_date,
    mood: input.mood,
    tags,
  };
}
export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function filterMemories(
  items,
  {
    query = "",
    mood = "",
    favorite = false,
    trash = false,
    shared = false,
    userId = "",
  },
) {
  return items.filter(
    (m) =>
      Boolean(m.deleted_at) === trash &&
      (!favorite || m.favorite) &&
      (!mood || m.mood === mood) &&
      (!shared || m.user_id !== userId) &&
      (!query ||
        [m.title, m.body, ...m.tags]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
}
export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const a = crypto.getRandomValues(new Uint8Array(16));
  a[6] = (a[6] & 15) | 64;
  a[8] = (a[8] & 63) | 128;
  const h = Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

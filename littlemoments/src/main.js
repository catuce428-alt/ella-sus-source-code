import "./style.css";
import {
  createIcons,
  Heart,
  BookOpen,
  Plus,
  Search,
  Star,
  Users,
  Trash2,
  Settings,
  LogOut,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Paperclip,
  Download,
  Calendar,
  ChevronLeft,
  X,
  Check,
  FolderHeart,
  LayoutGrid,
} from "lucide";
import {
  db,
  configured,
  callback,
  unwrap,
  listMemories,
  saveMemory,
  patchMemory,
  listFiles,
  uploadFile,
  openFile,
  removeFile,
  purgeMemory,
} from "./api";
import {
  escapeHtml as e,
  cleanMemory,
  filterMemories,
  validateFile,
  uuid,
} from "./domain";
const icons = {
  Heart,
  BookOpen,
  Plus,
  Search,
  Star,
  Users,
  Trash2,
  Settings,
  LogOut,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  Paperclip,
  Download,
  Calendar,
  ChevronLeft,
  X,
  Check,
  FolderHeart,
  LayoutGrid,
};
const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;
const moodIcons = {
  grateful: "✿",
  happy: "☀",
  calm: "☁",
  nostalgic: "✧",
  sad: "☂",
  excited: "✦",
};
const moods = Object.keys(moodIcons);
const today = () => new Date().toLocaleDateString("en-CA");
let user = null,
  profile = null,
  admin = false,
  memories = [],
  announcements = [],
  demo = false,
  view = "journal",
  query = "",
  mood = "",
  busy = false,
  authMode = "signin",
  message = "",
  loading = true;
let demoFiles = new Map(),
  blobUrls = [];
const app = document.querySelector("#app");
const sample = [
  [
    "An afternoon worth remembering",
    "We took the long way home. No plans, no hurry. Just warm light, good conversation, and a reminder that the smallest moments often stay with us the longest.",
    "grateful",
    "family, everyday",
  ],
  [
    "A little courage, a new beginning",
    "Tried something new today. It wasn’t perfect, but I’m proud of showing up. Here’s to more first steps.",
    "excited",
    "milestones",
  ],
  [
    "The kind of day I needed",
    "An open window, my favorite playlist, and time to breathe. Sometimes a quiet afternoon is everything.",
    "calm",
    "little joys",
  ],
];
function seeds() {
  return sample.map((s, i) => ({
    id: uuid(),
    user_id: "demo",
    title: s[0],
    body: s[1],
    mood: s[2],
    tags: s[3].split(", "),
    memory_date: new Date(Date.now() - i * 86400000 * 4)
      .toISOString()
      .slice(0, 10),
    favorite: i === 0,
    deleted_at: null,
  }));
}
function notify(text) {
  message = text;
  const target = document.querySelector("#notice");
  if (target) {
    target.textContent = text;
    target.hidden = false;
  }
}
async function run(fn) {
  if (busy) return;
  busy = true;
  document
    .querySelectorAll("button[type=submit]")
    .forEach((b) => (b.disabled = true));
  try {
    await fn();
  } catch (err) {
    if (document.querySelector("dialog"))
      dialogError(document.querySelector("dialog"), err);
    else notify(err.message || "Something went wrong. Please try again.");
  } finally {
    busy = false;
    document
      .querySelectorAll("button[type=submit]")
      .forEach((b) => (b.disabled = false));
  }
}
function bind() {
  createIcons({ icons });
  document
    .querySelectorAll("[data-action]")
    .forEach(
      (el) =>
        (el.onclick = () =>
          run(() => action(el.dataset.action, el.dataset.id))),
    );
}
function flash() {
  return `<p id="notice" class="notice" role="status" ${message ? "" : "hidden"}>${e(message)}</p>`;
}
function remember() {
  if (demo)
    sessionStorage.setItem("little-moments-demo", JSON.stringify(memories));
}
function logo() {
  return `<a class="brand" href="#home"><span class="brandmark">${icon("heart")}</span><span>Little Moments<small>A HOME FOR YOUR MEMORIES</small></span></a>`;
}
function footer() {
  return `<footer>Made for the moments that matter.<span><button data-action="privacy">Privacy</button> · <a href="#portfolio">AI Lab Portfolio</a></span></footer>`;
}
function render() {
  if (loading) {
    app.innerHTML = '<main class="loading">Loading your little moments…</main>';
    return;
  }
  if (!user || location.hash === "#portfolio") {
    renderPublic();
    return;
  }
  renderJournal();
}
function renderPublic() {
  const portfolio = location.hash === "#portfolio";
  app.innerHTML = `<header>${logo()}<nav><a href="#portfolio">Project hub</a><button data-action="auth" class="primary small">Sign in ${icon("arrow-right")}</button></nav></header><main class="public">${flash()}${portfolio ? `<section class="hero"><span class="eyebrow">STUDENT SHOWCASE</span><h1>Welcome to my<br><em>AI Project Hub ✨</em></h1><p>Explore the web apps and games created during my Building with AI course.</p></section><section class="project-grid"><article class="panel"><div class="project-art">⚔</div><h2>Medieval Run</h2><p>An endless-runner quest across the kingdom.</p><a class="primary" href="https://catuce428-alt.github.io/ella-sus-source-code/medieval-run/medieval-run.html" target="_blank" rel="noopener">Play game ↗</a></article><article class="panel"><div class="project-art">✦</div><h2>Local Fitness Tracker</h2><p>Log workouts and build your exercise routine.</p><a class="primary" href="https://catuce428-alt.github.io/ella-sus-source-code/local-fitness-finder/index.html" target="_blank" rel="noopener">Open tracker ↗</a></article><article class="panel"><div class="project-art">♡</div><h2>Little Moments</h2><p>Your private journal, with selective sharing.</p><button class="primary" data-action="auth">Start your journal →</button></article></section>` : `<section class="landing"><div><span class="eyebrow">YOUR LIFE, LOVINGLY COLLECTED</span><h1>Big feelings.<br>Little <em>moments.</em></h1><p>A quiet place for your everyday joys, the days that changed you, and everything you want to keep.</p><div class="row"><button class="primary" data-action="signup">Start your journal ${icon("arrow-right")}</button><button class="secondary" data-action="demo">Explore a demo</button></div><div class="trust">${icon("lock")} Private by default <span>·</span> Yours to share</div></div><div class="keepsake"><span class="tape"></span><div class="keepsake-art">✿<span>the little things</span></div><p>A moment for the memory book.</p><small>A LITTLE JOY, SAVED FOREVER ♡</small></div></section><section class="features"><article>${icon("book-open")}<h3>Make it a memory</h3><p>Words, photos, and little details. Capture it your way.</p></article><article>${icon("folder-heart")}<h3>Keep it close</h3><p>Find your favorites with tags, moods, and search.</p></article><article>${icon("users")}<h3>Share with intention</h3><p>Invite someone into a moment. Keep the rest just for you.</p></article></section>`}${footer()}</main>`;
  bind();
  if (location.hash === "#auth") authDialog();
}
function renderJournal() {
  const owned = memories.filter((m) => m.user_id === user.id && !m.deleted_at);
  app.innerHTML = `<div class="shell"><aside>${logo()}<span class="nav-caption">YOUR SPACE</span><nav>${[["journal", "book-open", "All memories"], ["favorites", "star", "Favorites"], ["shared", "users", "Shared with me"], ["trash", "trash-2", "Trash"], ["settings", "settings", "Settings"], ...(admin ? [["admin", "shield", "Admin panel"]] : [])].map(([v, i, t]) => `<button data-action="view" data-id="${v}" class="${v === view ? "active" : ""}">${icon(i)}${t}${v === "journal" ? `<span class="count">${owned.length}</span>` : ""}</button>`).join("")}</nav><div class="sidebar-bottom"><div class="private-note">${icon("lock")}<strong>Your story stays yours.</strong><p>Only you and people you choose can read your memories.</p></div><button data-action="signout">${icon("log-out")}${demo ? "Exit demo" : "Sign out"}</button></div></aside><div class="workspace"><header class="topbar"><span>${demo ? "INTERACTIVE DEMO · CHANGES LAST FOR THIS TAB" : "YOUR PERSONAL MEMORY JOURNAL"}</span><button class="avatar" data-action="view" data-id="settings" aria-label="Account settings">${e((profile?.display_name || "M")[0].toUpperCase())}</button></header><main class="journal-main">${flash()}${announcements.map((a) => `<div class="announcement">${icon("sparkles")}${e(a.body)}</div>`).join("")}<div id="content"></div></main>${footer()}</div></div>`;
  bind();
  if (view === "settings") renderSettings();
  else if (view === "admin") renderAdmin().catch((err) => notify(err.message));
  else renderCards();
}
function renderCards() {
  const titles = {
    journal: [
      "Your everyday, remembered.",
      "A collection of the things that make life yours.",
    ],
    favorites: [
      "The ones you hold close.",
      "Your favorite memories, all in one place.",
    ],
    shared: [
      "A little window into their world.",
      "Memories someone has chosen to share with you.",
    ],
    trash: [
      "A little room to change your mind.",
      "Restore a memory or delete it permanently. Trash is kept until you empty it.",
    ],
  };
  const [title, sub] = titles[view] || titles.journal;
  const base =
    view === "shared"
      ? memories
      : memories.filter((m) => m.user_id === user.id);
  const rows = filterMemories(base, {
    query,
    mood,
    favorite: view === "favorites",
    trash: view === "trash",
    shared: view === "shared",
    userId: user.id,
  });
  document.querySelector("#content").innerHTML =
    `<section class="page-heading"><div><span class="eyebrow">${view === "journal" ? `HELLO, ${e(profile?.display_name || "MEMORY KEEPER")} ♡` : e(view.toUpperCase())}</span><h1>${title}</h1><p>${sub}</p></div><button class="primary" data-action="new">${icon("plus")} New memory</button></section>${view === "journal" ? `<div class="prompt"><div class="prompt-icon">✧</div><div><span class="eyebrow">A LITTLE INSPIRATION</span><h3>What made you smile today?</h3><p>It doesn’t have to be extraordinary to be worth remembering.</p></div><button class="text-button" data-action="prompt">Write about it ${icon("arrow-right")}</button></div>` : ""}<div class="toolbar"><label class="search">${icon("search")}<input id="search" placeholder="Search memories, words, or tags…" value="${e(query)}" aria-label="Search memories"></label><select id="mood-filter" aria-label="Filter by mood"><option value="">Every mood</option>${moods.map((m) => `<option value="${m}" ${m === mood ? "selected" : ""}>${moodIcons[m]} ${m}</option>`).join("")}</select><span>${rows.length} ${rows.length === 1 ? "memory" : "memories"}</span></div><section class="memory-grid">${
      rows.length
        ? rows
            .map(
              (m) =>
                `<article class="memory-card"><button class="card-open" data-action="open" data-id="${m.id}" aria-label="Open ${e(m.title)}"><div class="memory-art ${m.mood}"><span>${moodIcons[m.mood]}</span><small>${e(m.mood)}</small></div><div class="card-body"><time>${formatDate(m.memory_date)}</time><h2>${e(m.title)}</h2><p>${e(m.body || "A little moment, kept safe.")}</p><div class="tags">${m.tags
                  .slice(0, 3)
                  .map((t) => `<span>#${e(t)}</span>`)
                  .join(
                    "",
                  )}</div></div></button><div class="card-footer"><span>${icon(m.user_id === user.id ? "lock" : "users")}${m.user_id === user.id ? "Your memory" : "Shared with you"}</span>${m.user_id === user.id ? `<button class="favorite ${m.favorite ? "selected" : ""}" data-action="favorite" data-id="${m.id}" aria-label="${m.favorite ? "Unfavorite" : "Favorite"} ${e(m.title)}" aria-pressed="${m.favorite}">${icon("heart")}</button>` : ""}</div></article>`,
            )
            .join("")
        : `<div class="empty">${icon("book-open")}<h2>${query || mood ? "No matching moments yet." : "Your story starts here."}</h2><p>${query || mood ? "Try another word or mood." : "Save a small detail today. Your future self will thank you."}</p><button class="secondary" data-action="new">Create a memory</button></div>`
    }</section>`;
  bind();
  document.querySelector("#search").addEventListener("input", (ev) => {
    const pos = ev.target.selectionStart;
    query = ev.target.value;
    renderCards();
    const field = document.querySelector("#search");
    field.focus();
    field.setSelectionRange(pos, pos);
  });
  document.querySelector("#mood-filter").addEventListener("change", (ev) => {
    mood = ev.target.value;
    renderCards();
  });
}
function formatDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function dialog(html) {
  closeDialog();
  const d = document.createElement("dialog");
  d.innerHTML = `<button class="close" aria-label="Close dialog">${icon("x")}</button>${html}`;
  document.body.append(d);
  d.querySelector(".close").onclick = () => closeDialog();
  d.addEventListener("click", (ev) => {
    if (ev.target === d) closeDialog();
  });
  d.addEventListener("close", () => d.remove());
  d.showModal();
  createIcons({ icons });
  return d;
}
function closeDialog() {
  document.querySelectorAll("dialog").forEach((d) => {
    d.close();
    d.remove();
  });
  blobUrls.forEach(URL.revokeObjectURL);
  blobUrls = [];
}
function dialogError(d, error) {
  let p = d.querySelector(".dialog-status");
  if (p) {
    p.textContent = error.message || error;
    p.hidden = false;
  }
}
function formHandler(d, fn) {
  d.querySelector("form").onsubmit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    busy = true;
    const b = d.querySelector("[type=submit]");
    b.disabled = true;
    try {
      await fn(new FormData(ev.target));
    } catch (err) {
      dialogError(d, err);
    } finally {
      busy = false;
      if (b.isConnected) b.disabled = false;
    }
  };
}
function authDialog() {
  if (!configured) {
    dialog(
      `<span class="eyebrow">LET’S GET CONNECTED</span><h2>Your journal is ready for Supabase.</h2><p>Follow README.md in the project folder to add your project URL and publishable key. Sign-in becomes available once those are configured.</p><button class="primary" id="try-demo">Explore the demo</button>`,
    ).querySelector("#try-demo").onclick = () => {
      closeDialog();
      startDemo();
    };
    return;
  }
  const reset = authMode === "reset",
    signup = authMode === "signup",
    recover = authMode === "recover";
  const d = dialog(
    `<span class="eyebrow">LITTLE MOMENTS ♡</span><h2>${recover ? "Choose a new password" : reset ? "A fresh start" : signup ? "Make room for your memories" : "Welcome back"}</h2><p>${reset ? "We’ll send a password reset link to your email." : signup ? "Start collecting the moments that matter." : "Your memories are right where you left them."}</p><form>${signup ? '<label>Your name<input name="name" required maxlength="80" autocomplete="name"></label>' : ""}${!recover ? '<label>Email<input name="email" type="email" required autocomplete="email"></label>' : ""}${!reset ? `<label>Password<input name="password" type="password" required minlength="12" autocomplete="${signup || recover ? "new-password" : "current-password"}"></label>` : ""}<p class="dialog-status" role="status" hidden></p><button type="submit" class="primary">${recover ? "Update password" : reset ? "Send reset link" : signup ? "Create account" : "Sign in"}</button></form>${!recover ? `<div class="auth-links"><button id="switch-auth">${signup || reset ? "Back to sign in" : "Create an account"}</button>${!signup && !reset ? '<button id="reset-auth">Forgot password?</button>' : ""}</div>` : ""}${import.meta.env.VITE_ENABLE_GOOGLE === "true" && !recover && !reset ? '<button class="secondary full" id="google">Continue with Google</button>' : ""}`,
  );
  formHandler(d, async (f) => {
    if (reset) {
      unwrap(
        await db.auth.resetPasswordForEmail(f.get("email"), {
          redirectTo: callback(),
        }),
      );
      dialogError(d, "If an account exists, a reset link will arrive shortly.");
      return;
    }
    if (recover) {
      unwrap(await db.auth.updateUser({ password: f.get("password") }));
      authMode = "signin";
      closeDialog();
      notify("Password updated.");
      render();
      return;
    }
    if (signup) {
      unwrap(
        await db.auth.signUp({
          email: f.get("email"),
          password: f.get("password"),
          options: {
            data: { display_name: f.get("name") },
            emailRedirectTo: callback(),
          },
        }),
      );
      dialogError(d, "Check your email to confirm your account, then sign in.");
    } else {
      unwrap(
        await db.auth.signInWithPassword({
          email: f.get("email"),
          password: f.get("password"),
        }),
      );
      closeDialog();
    }
  });
  d.querySelector("#switch-auth")?.addEventListener("click", () => {
    authMode = signup || reset ? "signin" : "signup";
    authDialog();
  });
  d.querySelector("#reset-auth")?.addEventListener("click", () => {
    authMode = "reset";
    authDialog();
  });
  d.querySelector("#google")?.addEventListener("click", async () => {
    try {
      unwrap(
        await db.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: callback() },
        }),
      );
    } catch (err) {
      dialogError(d, err);
    }
  });
}
function editor(memory = null, prompt = false) {
  const m = memory || {
    title: "",
    body: prompt ? "What made me smile today: " : "",
    memory_date: today(),
    mood: "grateful",
    tags: [],
  };
  const d = dialog(
    `<span class="eyebrow">${memory ? "REVISIT A MOMENT" : "SAVE SOMETHING GOOD"}</span><h2>${memory ? "Edit your memory" : "A little moment, just for you."}</h2><form><label>Give it a title<input name="title" value="${e(m.title)}" maxlength="120" required placeholder="An afternoon worth remembering"></label><div class="form-row"><label>Date<input type="date" name="memory_date" value="${m.memory_date}" required></label><label>How did it feel?<select name="mood">${moods.map((x) => `<option ${x === m.mood ? "selected" : ""} value="${x}">${moodIcons[x]} ${x}</option>`).join("")}</select></label></div><label>Your story<textarea name="body" rows="6" maxlength="20000" placeholder="The details you don’t want to forget…">${e(m.body)}</textarea></label><label>Tags <small>Separate with commas</small><input name="tags" value="${e(m.tags.join(", "))}" placeholder="family, travel, little joys"></label><p class="hint">${icon("lock")} Private until you choose to share. Add attachments after saving.</p><p class="dialog-status" role="status" hidden></p><button class="primary" type="submit">${icon("check")} Save memory</button></form>`,
  );
  formHandler(d, async (f) => {
    const fields = cleanMemory(Object.fromEntries(f));
    const saved = {
      ...m,
      ...fields,
      id: memory?.id || uuid(),
      user_id: user.id,
      favorite: memory?.favorite || false,
      deleted_at: memory?.deleted_at || null,
    };
    if (demo) {
      memories = memory
        ? memories.map((x) => (x.id === saved.id ? saved : x))
        : [saved, ...memories];
      remember();
    } else {
      await saveMemory(saved);
      memories = await listMemories();
    }
    closeDialog();
    render();
    await detail(saved.id);
  });
}
async function detail(id) {
  const m = memories.find((x) => x.id === id);
  if (!m) return;
  const own = m.user_id === user.id;
  const d = dialog(
    `<div class="detail-mood ${m.mood}">${moodIcons[m.mood]}</div><span class="eyebrow">${formatDate(m.memory_date)} · ${e(m.mood)}</span><h2>${e(m.title)}</h2><p class="story">${e(m.body)}</p><div class="tags">${m.tags.map((t) => `<span>#${e(t)}</span>`).join("")}</div><h3>Little keepsakes</h3><p class="hint">Photos, audio, video, or PDFs. Up to 10 MB each. First 100 files shown.</p><div id="files">Loading attachments…</div>${own && !m.deleted_at ? '<label class="upload">＋ Add a keepsake<input id="upload" type="file" accept="image/jpeg,image/png,image/webp,application/pdf,audio/mpeg,audio/wav,video/mp4"></label>' : ""}<p class="dialog-status" role="status" hidden></p><div class="detail-actions">${own ? (m.deleted_at ? '<button id="restore" class="secondary">Restore memory</button><button id="purge" class="danger">Delete permanently</button>' : '<button id="edit" class="secondary">Edit memory</button><button id="share" class="secondary">Share</button><button id="trash" class="text-button">Move to Trash</button>') : '<button id="leave" class="secondary">Remove from shared with me</button>'}</div>`,
  );
  const refresh = async () => {
    const files = demo
      ? (demoFiles.get(id) || []).map((f) => ({ name: f.name }))
      : await listFiles(id);
    if (!d.isConnected) return;
    d.querySelector("#files").innerHTML = files.length
      ? files
          .map(
            (f, i) =>
              `<div class="file-row"><button data-file="${i}">${icon("paperclip")}${e(f.name.split("--").slice(1).join("--") || f.name)}</button>${own ? `<button data-remove="${i}" aria-label="Delete attachment ${e(f.name)}">${icon("trash-2")}</button>` : ""}</div>`,
          )
          .join("")
      : '<p class="empty-files">No attachments yet. A story is enough, too.</p>';
    createIcons({ icons });
    d.querySelectorAll("[data-file]").forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            const name = files[+b.dataset.file].name;
            const url = demo
              ? URL.createObjectURL(
                  demoFiles.get(id).find((f) => f.name === name).file,
                )
              : await openFile(`${m.user_id}/${id}/${name}`);
            blobUrls.push(url);
            let preview = d.querySelector("#attachment-preview");
            if (!preview) {
              preview = document.createElement("div");
              preview.id = "attachment-preview";
              d.querySelector("#files").after(preview);
            }
            preview.replaceChildren();
            const extension = name.split(".").pop().toLowerCase();
            if (
              ["jpg", "jpeg", "png", "webp", "mp3", "wav", "mp4"].includes(
                extension,
              )
            ) {
              const media = document.createElement(
                ["mp3", "wav"].includes(extension)
                  ? "audio"
                  : extension === "mp4"
                    ? "video"
                    : "img",
              );
              media.src = url;
              media.style.cssText =
                "max-width:100%;max-height:320px;border-radius:10px;margin:12px 0";
              if (media.tagName === "IMG") media.alt = name;
              else media.controls = true;
              preview.append(media);
            }
            const a = document.createElement("a");
            a.href = url;
            a.download = name.split("--").slice(1).join("--") || name;
            a.className = "secondary";
            a.textContent = "Download " + a.download;
            preview.append(a);
          } catch (err) {
            dialogError(d, err);
          }
        }),
    );
    d.querySelectorAll("[data-remove]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (!confirm("Permanently delete this attachment?")) return;
          b.disabled = true;
          try {
            const name = files[+b.dataset.remove].name;
            if (demo)
              demoFiles.set(
                id,
                demoFiles.get(id).filter((f) => f.name !== name),
              );
            else await removeFile(`${m.user_id}/${id}/${name}`);
            await refresh();
          } catch (err) {
            dialogError(d, err);
          } finally {
            b.disabled = false;
          }
        }),
    );
  };
  try {
    await refresh();
  } catch (err) {
    dialogError(d, err);
    d.querySelector("#files").textContent =
      "Attachments could not load. Close and reopen to retry.";
  }
  d.querySelector("#upload")?.addEventListener("change", async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    ev.target.disabled = true;
    try {
      validateFile(file);
      if (demo)
        demoFiles.set(id, [
          ...(demoFiles.get(id) || []),
          { name: uuid() + "--" + file.name, file },
        ]);
      else await uploadFile(m, file);
      await refresh();
    } catch (err) {
      dialogError(d, err);
    } finally {
      ev.target.disabled = false;
      ev.target.value = "";
    }
  });
  d.querySelector("#edit")?.addEventListener("click", () => editor(m));
  d.querySelector("#share")?.addEventListener("click", () =>
    run(() => sharing(m)),
  );
  d.querySelector("#trash")?.addEventListener("click", () =>
    run(async () => {
      await patch(id, { deleted_at: new Date().toISOString() });
      closeDialog();
      render();
    }),
  );
  d.querySelector("#restore")?.addEventListener("click", () =>
    run(async () => {
      await patch(id, { deleted_at: null });
      closeDialog();
      render();
    }),
  );
  d.querySelector("#purge")?.addEventListener("click", () =>
    run(async () => {
      if (
        !confirm(
          "Permanently delete this memory and all attachments? This cannot be undone.",
        )
      )
        return;
      if (!demo) await purgeMemory(m);
      memories = memories.filter((x) => x.id !== id);
      demoFiles.delete(id);
      remember();
      closeDialog();
      render();
    }),
  );
  d.querySelector("#leave")?.addEventListener("click", () =>
    run(async () => {
      unwrap(
        await db
          .from("memory_shares")
          .delete()
          .eq("memory_id", id)
          .eq("recipient_id", user.id),
      );
      memories = await listMemories();
      closeDialog();
      render();
    }),
  );
}
async function patch(id, fields) {
  if (!demo) await patchMemory(id, fields);
  memories = memories.map((m) => (m.id === id ? { ...m, ...fields } : m));
  remember();
}
async function sharing(m) {
  if (demo) {
    notify("Sharing requires a connected Supabase project and real accounts.");
    return;
  }
  const shares = unwrap(
    await db.from("memory_shares").select("*").eq("memory_id", m.id),
  );
  const d = dialog(
    `<span class="eyebrow">SHARE WITH INTENTION</span><h2>Let someone into this moment.</h2><p>Ask them for their sharing code from Settings. They need a verified account. They can read this memory and download its attachments, but cannot edit it.</p><form><label>Their sharing code<input name="recipient" required placeholder="Their account UUID" pattern="[0-9a-fA-F-]{36}"></label><p class="dialog-status" role="status" hidden></p><button type="submit" class="primary">Share memory</button></form><h3>People with access</h3>${shares.length ? shares.map((s) => `<div class="file-row"><code>${e(s.recipient_id)}</code><button data-revoke="${s.recipient_id}">Revoke</button></div>`).join("") : "<p>Only you, for now.</p>"}<p class="hint">Revoking prevents future access. It cannot remove files someone has already downloaded. Restoring a trashed memory restores its existing shares.</p>`,
  );
  formHandler(d, async (f) => {
    const recipient = f.get("recipient").trim();
    if (recipient === user.id)
      throw Error("This memory already belongs to you.");
    unwrap(
      await db
        .from("memory_shares")
        .insert({ memory_id: m.id, recipient_id: recipient }),
    );
    await sharing(m);
  });
  d.querySelectorAll("[data-revoke]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          unwrap(
            await db
              .from("memory_shares")
              .delete()
              .eq("memory_id", m.id)
              .eq("recipient_id", b.dataset.revoke),
          );
          await sharing(m);
        } catch (err) {
          dialogError(d, err);
        }
      }),
  );
}
function renderSettings() {
  document.querySelector("#content").innerHTML =
    `<section class="page-heading"><div><span class="eyebrow">MAKE YOURSELF AT HOME</span><h1>Your space, your settings.</h1><p>Manage your profile and take your memories with you.</p></div></section><div class="settings-grid"><section class="panel"><h2>About you</h2><form id="profile-form"><label>Your name<input name="name" value="${e(profile?.display_name)}" maxlength="80" required></label><label>Email<input value="${e(user.email || "Demo account")}" disabled></label><button class="primary" type="submit">Save profile</button></form></section><section class="panel"><h2>Your sharing code</h2><p>Give this code to someone who wants to share a memory with you. It is an identifier, not a password.</p><code class="sharing-code">${e(user.id)}</code><button class="secondary" data-action="copy">Copy code</button></section><section class="panel"><h2>Your memories belong to you.</h2><p>Export all your written memories, tags, dates, and Trash as a JSON file. Download attachments individually from each memory.</p><button class="secondary" data-action="export">${icon("download")} Export journal</button></section><section class="panel"><h2>Account & privacy</h2><p>Memories are access-controlled, not end-to-end encrypted. Your service operator can access database records through Supabase.</p><button class="secondary" data-action="password">Reset password</button><button class="danger" data-action="delete-account">Delete account</button></section></div>`;
  bind();
  document.querySelector("#profile-form").onsubmit = (ev) => {
    ev.preventDefault();
    run(async () => {
      const name = new FormData(ev.target).get("name").trim();
      if (!name) throw Error("Enter your name.");
      if (!demo)
        unwrap(
          await db
            .from("profiles")
            .update({ display_name: name })
            .eq("id", user.id),
        );
      profile.display_name = name;
      notify("Profile saved.");
      render();
    });
  };
}
async function renderAdmin() {
  if (!admin) throw Error("Administrator access required.");
  const profiles = unwrap(
    await db
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
  );
  const audit = unwrap(
    await db
      .from("admin_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
  );
  document.querySelector("#content").innerHTML =
    `<section class="page-heading"><div><span class="eyebrow">ADMINISTRATION</span><h1>Look after the community.</h1><p>Manage accounts and announcements. Private journals remain private.</p></div></section><div class="panel"><h2>Accounts (${profiles.length})</h2><div class="table-wrap"><table><thead><tr><th>Name / ID</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead><tbody>${profiles.map((p) => `<tr><td>${e(p.display_name)}<small>${p.id}</small></td><td>${formatDate(p.created_at.slice(0, 10))}</td><td>${p.suspended ? "Suspended" : "Active"}</td><td>${p.id !== user.id ? `<button data-suspend="${p.id}" data-disabled="${!p.suspended}">${p.suspended ? "Restore access" : "Suspend"}</button>` : "You"}</td></tr>`).join("")}</tbody></table></div></div><section class="panel"><h2>Community notice</h2><form id="announcement-form"><label>Announcement<textarea name="body" required maxlength="500" rows="3"></textarea></label><button class="primary" type="submit">Publish notice</button></form>${announcements.map((a) => `<div class="file-row"><span>${e(a.body)}</span><button data-announcement="${a.id}">Remove</button></div>`).join("")}</section><section class="panel"><h2>Recent account actions</h2>${audit.length ? audit.map((a) => `<p>${e(a.action)} · <code>${a.target_id}</code> · ${new Date(a.created_at).toLocaleString()}</p>`).join("") : "<p>No account actions yet.</p>"}</section>`;
  document.querySelectorAll("[data-suspend]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          if (
            !confirm(
              `${b.dataset.disabled === "true" ? "Suspend" : "Restore"} this account’s access?`,
            )
          )
            return;
          unwrap(
            await db.rpc("admin_set_suspended", {
              target: b.dataset.suspend,
              disabled: b.dataset.disabled === "true",
            }),
          );
          await renderAdmin();
        })),
  );
  document.querySelector("#announcement-form").onsubmit = (ev) => {
    ev.preventDefault();
    const body = new FormData(ev.target).get("body").trim();
    run(async () => {
      unwrap(await db.from("announcements").insert({ body }));
      announcements = unwrap(
        await db
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false }),
      );
      await renderAdmin();
    });
  };
  document.querySelectorAll("[data-announcement]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          unwrap(
            await db
              .from("announcements")
              .delete()
              .eq("id", b.dataset.announcement),
          );
          announcements = announcements.filter(
            (a) => a.id !== b.dataset.announcement,
          );
          await renderAdmin();
        })),
  );
}
function startDemo() {
  demo = true;
  user = { id: "demo", email: "demo@littlemoments.example" };
  profile = { display_name: "Ella" };
  try {
    memories =
      JSON.parse(sessionStorage.getItem("little-moments-demo")) || seeds();
  } catch {
    memories = seeds();
  }
  view = "journal";
  message =
    "Demo only: no account is created. Text stays in this tab; attachments are temporary.";
  location.hash = "journal";
  render();
}
async function action(name, id) {
  message = "";
  if ((name === "auth" || name === "signup") && user) {
    location.hash = "journal";
    render();
    return;
  }
  if (name === "auth" || name === "signup") {
    authMode = name === "signup" ? "signup" : "signin";
    authDialog();
  } else if (name === "demo") startDemo();
  else if (name === "view") {
    view = id;
    query = "";
    mood = "";
    render();
  } else if (name === "new" || name === "prompt")
    editor(null, name === "prompt");
  else if (name === "open") await detail(id);
  else if (name === "favorite") {
    await patch(id, { favorite: !memories.find((m) => m.id === id).favorite });
    renderCards();
  } else if (name === "signout") {
    if (!demo) unwrap(await db.auth.signOut());
    demo = false;
    user = null;
    admin = false;
    profile = null;
    memories = [];
    announcements = [];
    view = "journal";
    location.hash = "home";
    render();
  } else if (name === "copy") {
    await navigator.clipboard.writeText(user.id);
    notify("Sharing code copied.");
  } else if (name === "export") {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            exported_at: new Date().toISOString(),
            memories: memories.filter((m) => m.user_id === user.id),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "little-moments-journal.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else if (name === "password") {
    if (demo)
      throw Error("Password settings are available after connecting Supabase.");
    unwrap(
      await db.auth.resetPasswordForEmail(user.email, {
        redirectTo: callback(),
      }),
    );
    notify("Password reset email sent.");
  } else if (name === "delete-account") {
    if (demo) throw Error("This demo has no real account to delete.");
    if (
      !confirm(
        "Permanently delete your account and all written memories? Download your data first. Attachments must be deleted beforehand.",
      )
    )
      return;
    unwrap(await db.rpc("delete_my_account"));
    await db.auth.signOut();
    user = null;
    render();
  } else if (name === "privacy") {
    dialog(
      '<span class="eyebrow">YOUR PRIVACY</span><h2>Your story stays yours.</h2><p>Written memories and uploaded files are stored in the operator’s Supabase project. Other users can read a memory only when its owner shares it with their account. Administrators can manage access without journal-reading permission in the app.</p><p>This is not end-to-end encryption. The project owner can access its database and storage. No AI service receives journal content. Export your writing in Settings, and delete memories or your account when you choose.</p><p>Shared recipients can keep downloaded copies. The demo stores writing in this tab only. Sign-in uses browser storage to keep your session.</p>',
    );
  }
}
async function loadAccount(session) {
  user = session?.user || null;
  admin = false;
  if (user) {
    profile = unwrap(
      await db.from("profiles").select("*").eq("id", user.id).single(),
    );
    if (profile.suspended) {
      user = null;
      await db.auth.signOut();
      message = "This account is suspended. Contact the app operator.";
    } else {
      admin = unwrap(await db.rpc("is_admin"));
      memories = await listMemories();
      announcements = unwrap(
        await db
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false }),
      );
    }
  }
  loading = false;
  render();
}
window.addEventListener("hashchange", () => render());
async function init() {
  if (!configured) {
    loading = false;
    render();
    return;
  }
  db.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      authMode = "recover";
      setTimeout(async () => {
        try {
          await loadAccount(session);
          authDialog();
        } catch (err) {
          notify(err.message);
        }
      }, 0);
    } else if (event === "SIGNED_IN" || event === "SIGNED_OUT")
      setTimeout(
        () =>
          loadAccount(session).catch((err) => {
            loading = false;
            notify(err.message);
            render();
          }),
        0,
      );
  });
  try {
    await loadAccount(unwrap(await db.auth.getSession()).session);
  } catch (err) {
    loading = false;
    message = err.message;
    user = null;
    render();
  }
}
init();

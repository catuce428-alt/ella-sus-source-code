import test from "node:test";
import assert from "node:assert/strict";
import {
  validateFile,
  cleanMemory,
  escapeHtml,
  filterMemories,
} from "../src/domain.js";
test("uploads reject executable/HTML/SVG content and oversize files", () => {
  for (const type of ["text/html", "image/svg+xml", "application/javascript"])
    assert.throws(() => validateFile({ type, size: 10 }));
  assert.throws(() => validateFile({ type: "image/png", size: 10485761 }));
  assert.doesNotThrow(() => validateFile({ type: "image/png", size: 100 }));
});
test("journal input normalizes tags and validates lengths", () => {
  const input = {
    title: " Test ",
    body: " text ",
    memory_date: "2026-11-03",
    mood: "calm",
    tags: "Home, home, family",
  };
  assert.deepEqual(cleanMemory(input).tags, ["home", "family"]);
  assert.throws(() => cleanMemory({ ...input, title: "" }));
  assert.throws(() => cleanMemory({ ...input, body: "x".repeat(20001) }));
});
test("user content is escaped before HTML interpolation", () =>
  assert.equal(
    escapeHtml('<img src=x onerror="bad()">'),
    "&lt;img src=x onerror=&quot;bad()&quot;&gt;",
  ));
test("search, favorites, trash and shared filters compose", () => {
  const rows = [
    {
      title: "Trip",
      body: "Sea",
      tags: ["summer"],
      favorite: true,
      user_id: "a",
      deleted_at: null,
      mood: "calm",
    },
    {
      title: "Old",
      body: "",
      tags: [],
      favorite: false,
      user_id: "b",
      deleted_at: "now",
      mood: "sad",
    },
  ];
  assert.equal(
    filterMemories(rows, { query: "SUMMER", favorite: true }).length,
    1,
  );
  assert.equal(filterMemories(rows, { trash: true }).length, 1);
  assert.equal(filterMemories(rows, { shared: true, userId: "a" }).length, 0);
});

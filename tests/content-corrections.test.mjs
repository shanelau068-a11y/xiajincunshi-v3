import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const read = (file) =>
  JSON.parse(fs.readFileSync(new URL(file, import.meta.url), "utf8"));
const documents = read("../public/data/documents.json");
const fingerprintFields = (d) => ({
  id: d.id,
  title: d.title,
  file: d.file,
  kind: d.kind,
  parentId: d.parentId,
  partId: d.partId,
  partTitle: d.partTitle,
  order: d.order,
  html: d.html,
  text: d.text,
});
test("All other village-history documents remain exactly as before", () => {
  const baseline = read("./fixtures/book-baseline.json");
  assert.equal(documents.length, baseline.length);
  for (const entry of baseline.filter((item) => item.id !== "d-007")) {
    const d = documents.find((item) => item.id === entry.id);
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(fingerprintFields(d)))
      .digest("hex");
    assert.equal(
      hash,
      entry.sha256,
      `Unexpected village-history change: ${entry.id}`,
    );
  }
});
test("Only the authorized name and generation passage changed in d-007", () => {
  const before = read("./fixtures/d007-before.json");
  const after = documents.find((doc) => doc.id === "d-007");
  const removeApprovedChanges = (value) =>
    value
      .replaceAll("思彤", "语彤")
      .replace(/刘氏桃坑辈序：[^<\n]+/u, "刘氏桃坑辈序：[核对后的字序]");
  assert.equal(
    removeApprovedChanges(after.html),
    removeApprovedChanges(before.html),
  );
  assert.equal(
    removeApprovedChanges(after.text),
    removeApprovedChanges(before.text),
  );
  assert.match(after.text, /雄明与陆佩东育有：子 思博[^\n]*女 语彤/u);
  assert(!after.html.includes("思彤") && !after.text.includes("思彤"));
});
test("Photo transcription has 66 individually numbered characters and both generation systems", () => {
  const g = read("../public/data/generation.json");
  assert.equal(g.count, 66);
  assert.equal(g.rows.length, 66);
  assert.equal(g.rows.map((row) => row.character).join(""), g.sequence);
  for (const [index, row] of g.rows.entries()) {
    assert.equal(row.global, 143 + index);
    assert.equal(row.taokeng, row.global - 124);
  }
  const numbered = new Map(g.rows.map((row) => [row.global, row.character]));
  for (const [number, character] of [
    [143, "日"],
    [160, "启"],
    [161, "鸿"],
    [162, "泽"],
    [163, "承"],
    [166, "立"],
    [193, "懋"],
    [196, "竞"],
    [204, "昭"],
    [206, "奕"],
    [208, "名"],
  ])
    assert.equal(numbered.get(number), character);
  assert.equal(g.rows.at(-1).taokeng, 84);
  assert(
    documents
      .find((d) => d.id === "d-007")
      .text.includes([...g.sequence].join("、")),
  );
});
test("The original generation-board photo is preserved once in the gallery", () => {
  const photos = read("../public/data/photos.json");
  const board = photos.filter(
    (photo) => photo.id === "liushi-generation-board-20261112",
  );
  assert.equal(board.length, 1);
  assert.equal(board[0].category, "族谱资料");
  assert(
    fs.existsSync(new URL(`../public/${board[0].image}`, import.meta.url)),
  );
  assert.equal(read("../public/data/manifest.json").photos, photos.length);
});

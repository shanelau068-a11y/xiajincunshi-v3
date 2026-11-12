import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
const read = (name) =>
  JSON.parse(fs.readFileSync(`public/data/${name}.json`, "utf8"));
const documents = read("documents"),
  catalog = read("catalog"),
  photos = read("photos"),
  people = read("people"),
  timeline = read("timeline"),
  manifest = read("manifest");
const ids = new Set(documents.map((d) => d.id));
assert.equal(ids.size, documents.length, "Duplicate document IDs");
assert.equal(documents.length, manifest.documents);
assert.equal(photos.length, manifest.photos);
assert.equal(people.length, manifest.people);
assert.equal(timeline.length, manifest.timeline);
assert.equal(catalog.length, 11);
for (const d of documents) {
  assert(d.html && d.text && d.title && d.partId, `Empty document ${d.id}`);
  assert(
    !/<(?:script|style|iframe|object|embed)\b|\bon\w+\s*=|javascript\s*:/i.test(
      d.html,
    ),
    `Unsafe HTML in ${d.id}`,
  );
  for (const match of d.html.matchAll(/href=["']#\/read\/([^"'?#]+)/g))
    assert(ids.has(match[1]), `Broken link ${d.id} -> ${match[1]}`);
  if (d.parentId) assert(ids.has(d.parentId), `Missing parent for ${d.id}`);
}
const seen = new Set();
function visit(nodes) {
  for (const node of nodes) {
    assert(ids.has(node.documentId), `Missing catalog target ${node.id}`);
    seen.add(node.documentId);
    visit(node.children || []);
  }
}
visit(catalog);
assert.equal(seen.size, documents.length, "Catalog omits documents");
for (const p of photos) {
  assert(!p.image.startsWith("/"));
  assert(
    fs.existsSync(path.join("public", p.image)),
    `Missing image ${p.image}`,
  );
}
for (const p of [...people, ...timeline])
  assert(ids.has(p.documentId), `Missing source for ${p.id}`);
assert.equal(
  documents.filter((d) => d.kind === "editorial").length,
  1,
  "Editorial appendix must be separated",
);
assert.equal(documents.find((d) => d.kind === "editorial")?.id, "d-110");
console.log(
  `Verified: ${documents.length} documents, ${photos.length} photos, ${people.length} people, ${timeline.length} events; all catalog, internal and source links resolve.`,
);

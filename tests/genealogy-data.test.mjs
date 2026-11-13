import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const genealogy = JSON.parse(
  fs.readFileSync(path.join(root, "public/data/genealogy.json"), "utf8"),
);
const documents = new Map(
  JSON.parse(
    fs.readFileSync(path.join(root, "public/data/documents.json"), "utf8"),
  ).map((d) => [d.id, d]),
);
const byId = new Map(genealogy.people.map((p) => [p.id, p]));
const byName = (name) =>
  genealogy.people.find((p) => p.name === name || p.aliases.includes(name));
const compact = (text) => text.replace(/\s+/g, "");
const parents = (person) =>
  genealogy.relations
    .filter((r) => r.type === "parent" && r.to === person.id)
    .map((r) => byId.get(r.from));
const children = (person) =>
  genealogy.relations
    .filter((r) => r.type === "parent" && r.from === person.id)
    .map((r) => byId.get(r.to));
const names = (persons) => persons.map((p) => p.name).sort();
function ancestors(person, depth) {
  let frontier = [person];
  for (let n = 0; n < depth; n++)
    frontier = [
      ...new Map(frontier.flatMap(parents).map((p) => [p.id, p])).values(),
    ];
  return frontier;
}

test("all genealogy relationships trace to current book excerpts and distinct people", () => {
  assert.equal(byId.size, genealogy.people.length);
  assert.equal(
    new Set(genealogy.relations.map((r) => r.id)).size,
    genealogy.relations.length,
  );
  for (const person of genealogy.people) {
    assert(Array.isArray(person.aliases));
    assert(person.sourceDocIds.length > 0);
    for (const id of person.sourceDocIds) assert(documents.has(id));
    assert(
      !/思彤|花公花妈|嫘祖为元/.test(person.name + person.aliases.join(" ")),
    );
  }
  for (const relation of genealogy.relations) {
    assert(byId.has(relation.from));
    assert(byId.has(relation.to));
    assert.notEqual(relation.from, relation.to);
    assert(relation.quote.length > 4);
    assert(
      compact(documents.get(relation.sourceDocId).text).includes(
        compact(relation.quote),
      ),
      relation.id,
    );
  }
});

test("Xiongming's daughter is Yutong and both parents are correctly attached", () => {
  const xiongming = byName("雄明");
  assert.deepEqual(names(parents(xiongming)), ["刘耀怀", "廖春玲"].sort());
  assert.deepEqual(names(children(xiongming)), ["刘思博", "语彤"].sort());
  assert.deepEqual(names(parents(byName("语彤"))), ["刘雄明", "陆佩东"].sort());
  assert.equal(byName("思彤"), undefined);
  assert.equal(byName("刘语彤"), byName("语彤"));
});

test("Yutong's three ancestor levels preserve the documented branch", () => {
  assert.deepEqual(
    names(ancestors(byName("语彤"), 1)),
    ["刘雄明", "陆佩东"].sort(),
  );
  assert.deepEqual(
    names(ancestors(byName("语彤"), 2)),
    ["刘耀怀", "廖春玲"].sort(),
  );
  assert.deepEqual(
    names(ancestors(byName("语彤"), 3)),
    ["刘永淡", "黄丽香"].sort(),
  );
  assert.deepEqual(
    names(parents(byName("刘永淡"))),
    ["刘喜林", "梁瑞音"].sort(),
  );
});

test("Yongli's children are not incorrectly assigned to Yongdan's spouse", () => {
  assert.equal(children(byName("刘永利")).length, 5);
  assert.deepEqual(names(parents(byName("美娟"))), ["刘永利"]);
  assert.deepEqual(
    names(children(byName("黄丽香"))),
    ["刘耀怀", "刘锐泽", "玉琴", "玉珊", "玉花"].sort(),
  );
});

test("Xiongxuan and Xiongming retain separate spouses and children", () => {
  assert.deepEqual(names(parents(byName("纯语"))), ["刘雄宣", "惠璇"].sort());
  assert.deepEqual(names(parents(byName("刘镒齐"))), ["刘雄宣", "惠璇"].sort());
  assert.equal(byName("纯语").generation, undefined);
  assert.equal(byName("语彤").generation, undefined);
  assert.equal(byName("惠璇").gender, undefined);
  assert.equal(byName("陆佩东").gender, undefined);
});

test("generation order does not fabricate missing parents or maternal lineages", () => {
  assert.deepEqual(parents(byName("刘光勉")), []);
  assert.equal(byName("刘光勉").gender, undefined);
  assert.deepEqual(parents(byName("刘克俊")), []);
  assert.deepEqual(names(parents(byName("刘渍"))), ["刘景"]);
  assert.equal(byName("刘雄明").generation.taokeng, 37);
  assert.equal(byName("刘雄明").generation.global, 161);
  assert.equal(byName("刘思博").generation.taokeng, 38);
  assert.equal(byName("刘思博").generation.global, 162);
});

test("same surname spouses remain separate identities", () => {
  const wives = genealogy.people.filter((p) => p.name === "陈氏");
  assert(wives.length >= 4);
  assert.equal(wives.length, new Set(wives.map((p) => p.id)).size);
  assert.equal(byName("冯发新"), byName("李得新"));
  assert.equal(byName("花公").name, "廖花");
  assert.equal(byName("花妈").name, "冯一娘");
});

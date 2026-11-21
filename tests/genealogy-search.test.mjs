import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { findBiographyPeople, findGenealogyPeople } from "../src/genealogySearch.mjs";

const read = (file) =>
  JSON.parse(fs.readFileSync(new URL(file, import.meta.url), "utf8"));
const genealogy = read("../public/data/genealogy.json");
const biographies = read("../public/data/people.json");

test("surname plus the documented courtesy name finds 刘益承 / 我任", () => {
  const matches = findGenealogyPeople(genealogy.people, "刘我任");
  assert.deepEqual(
    matches.map((person) => person.id),
    ["family-yicheng"],
  );
  assert.deepEqual(
    findGenealogyPeople(genealogy.people, "我任").map((person) => person.id),
    ["family-yicheng"],
  );
  assert.deepEqual(
    genealogy.relations
      .filter((relation) => relation.type === "parent" && relation.from === "family-yicheng")
      .map((relation) => genealogy.people.find((person) => person.id === relation.to)?.name)
      .sort(),
    ["刘铉", "刘麟"],
  );
});

test("biography-only names are discoverable without inventing genealogy links", () => {
  const graphMatches = findGenealogyPeople(genealogy.people, "刘嵩");
  const bioMatches = findBiographyPeople(biographies, "刘嵩");
  assert.equal(graphMatches.length, 0);
  assert(bioMatches.some((person) => person.name === "刘嵩"));
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { matchesTimelinePeriod } from "../src/timelinePeriod.ts";

const timeline = JSON.parse(
  fs.readFileSync(new URL("../public/data/timeline.json", import.meta.url), "utf8"),
);
const before = "1949年以前";
const after = "1949年及以后";

test("entries without an Arabic-numeral year stay in 1949年以前", () => {
  const undated = timeline.filter((event) => !/\d{3,4}/.test(event.year));
  assert.ok(undated.some((event) => event.id === "chronicle-006"));
  for (const event of undated) {
    assert.equal(event.year, "宋庆元年间");
    assert.equal(matchesTimelinePeriod(event.year, before), true);
    assert.equal(matchesTimelinePeriod(event.year, after), false);
    assert.equal(matchesTimelinePeriod(event.year, "全部年代"), true);
  }
});

test("numbered years keep the 1949 boundary and every entry is in one period", () => {
  assert.equal(matchesTimelinePeriod("后梁贞明三年（917）", before), true);
  assert.equal(matchesTimelinePeriod("后梁贞明三年（917）", after), false);
  assert.equal(matchesTimelinePeriod("1949", before), false);
  assert.equal(matchesTimelinePeriod("1949", after), true);
  assert.equal(matchesTimelinePeriod("1952—1954", after), true);
  const earlier = timeline.filter((event) =>
    matchesTimelinePeriod(event.year, before),
  );
  const later = timeline.filter((event) =>
    matchesTimelinePeriod(event.year, after),
  );
  assert.equal(earlier.length + later.length, timeline.length);
  assert.ok(earlier.some((event) => event.id === "chronicle-006"));
  assert.equal(
    later.some((event) => event.id === "chronicle-006"),
    false,
  );
});

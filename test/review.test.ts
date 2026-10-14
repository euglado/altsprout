import assert from "node:assert/strict";
import test from "node:test";
import { copy, language, literal, review } from "../src/review.js";

test("normal description is unchanged apart from literal punctuation", () => {
  const r = review("A red bicycle beside a wall", "en");
  assert.equal(r.words, 6);
  assert.equal(r.characters, 27);
  assert(r.publicText.includes("A red bicycle beside a wall"));
  assert(!r.publicText.includes(copy.en.prompts));
});
test("Turkish segmentation and localized copy", () => {
  const r = review("Kırmızı bisiklet duvara yaslı", "tr");
  assert.equal(r.words, 4);
  assert(r.publicText.startsWith("Görsel açıklaması"));
});
test("counts Unicode code points rather than UTF-16 units", () =>
  assert.equal(review("🌱 a", "en").characters, 3));
for (const value of [
  "",
  " ",
  "\n\t",
  "a\u0000",
  "a\u001b",
  "a\u200b",
  "a\u202e",
  "a\ud800",
  "a\ue000",
  "a\u0085",
  "x".repeat(601),
]) {
  test(`rejects invalid description ${JSON.stringify(value).slice(0, 35)}`, () =>
    assert.throws(() => review(value, "en"), /invalid/));
}
test("allows newlines and tabs but trims outer whitespace", () =>
  assert(
    review("  A bicycle\nby\ta wall  ", "en").publicText.includes(
      "A bicycle\nby\ta wall",
    ),
  ));
test("length limit counts raw input including outer spaces", () =>
  assert.throws(() => review(`${" ".repeat(600)}x`, "en")));
test("one visible punctuation character is accepted without invented words", () =>
  assert.equal(review("!", "en").words, 0));
test("180 is an editing cue threshold only", () => {
  assert.equal(review("a".repeat(180), "en").cues.length, 0);
  assert.deepEqual(review("a".repeat(181), "en").cues, [copy.en.long]);
});
for (const [value, cue] of [
  ["A photo of a tree", copy.en.prefix],
  ["scene.JPG", copy.en.file],
  ["https://example.org", copy.en.link],
  ["@everyone <@123>", copy.en.mention],
] as const) {
  test(`advisory for ${value}`, () =>
    assert(review(value, "en").cues.includes(cue)));
}
test("Turkish generic opening cue", () =>
  assert(review("Bir fotoğraf: bisiklet", "tr").cues.includes(copy.tr.prefix)));
test("literal formatting escapes links, blockquotes, spoilers and code", () => {
  const value =
    "[link](https://example.org) **bold** ||hidden|| `code` > # <@123>";
  const escaped = literal(value);
  for (const marker of ["\\[", "\\]", "\\*", "\\|", "\\`", "\\>", "\\#", "\\<"])
    assert(escaped.includes(marker));
});
test("language falls back safely", () => {
  assert.equal(language("tr"), "tr");
  for (const l of ["de", null, {}, "en-US"]) assert.equal(language(l), "en");
});
for (const lang of ["en", "tr"] as const) {
  test(`max plain text stays within Discord limits ${lang}`, () => {
    const r = review("a".repeat(600), lang);
    assert(r.preview.length <= 2000);
    assert(r.publicText.length < 2000);
  });
  test(`all markdown maximum remains previewable ${lang}`, () => {
    const r = review("*".repeat(600), lang);
    assert(r.preview.length <= 2000);
  });
  test(`all advisory cues with maximal escaping remain previewable ${lang}`, () => {
    const prefix = "A photo @everyone https://x.png ";
    const result = review(prefix + "*".repeat(600 - prefix.length), lang);
    assert.equal(result.cues.length, 5);
    assert(result.preview.length <= 2000);
  });
}

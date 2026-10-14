import assert from "node:assert/strict";
import test from "node:test";
import { type Binding, Store } from "../src/store.js";

const binding: Binding = {
  owner: "u",
  guild: "g",
  channel: "c",
  application: "a",
};
function create(now = 0) {
  const store = new Store(() => now);
  const n = store.add(binding, "en", "description");
  assert(n);
  store.bind(n, "m");
  return { store, n };
}
test("random nonce and single use", () => {
  const { store, n } = create();
  assert.match(n, /^[a-f0-9]{36}$/);
  assert(store.take(n, binding, "m"));
  assert.equal(store.take(n, binding, "m"), null);
});
for (const field of ["owner", "guild", "channel", "application"] as const) {
  test(`binds ${field} and preserves draft after unauthorized attempt`, () => {
    const { store, n } = create();
    assert.equal(store.take(n, { ...binding, [field]: "wrong" }, "m"), null);
    assert(store.take(n, binding, "m"));
  });
}
test("binds preview message", () => {
  const { store, n } = create();
  assert.equal(store.take(n, binding, "other"), null);
  assert(store.take(n, binding, "m"));
});
test("unbound drafts cannot be shared", () => {
  const s = new Store();
  const n = s.add(binding, "en", "x");
  assert(n);
  assert.equal(s.take(n, binding, "m"), null);
});
test("malformed nonce cannot resolve", () => {
  const { store, n } = create();
  assert.equal(store.take(` ${n}`, binding, "m"), null);
});
test("expires at five minutes and pruning clears cooldowns", () => {
  let now = 0;
  const s = new Store(() => now);
  const n = s.add(binding, "en", "x");
  assert(n);
  s.bind(n, "m");
  assert(s.throttle(s.users, "u", 5000));
  now = 300_000;
  assert.equal(s.take(n, binding, "m"), null);
  assert.equal(s.users.size, 0);
  assert.equal(s.drafts.size, 0);
});
test("only newest user/guild draft survives", () => {
  const { store, n } = create();
  const newer = store.add(binding, "tr", "y");
  assert(newer);
  assert(!store.drafts.has(n));
  assert.equal(store.drafts.size, 1);
});
test("draft capacity refuses excess", () => {
  const s = new Store();
  for (let x = 0; x < 100; x++)
    assert(s.add({ ...binding, owner: String(x) }, "en", "x"));
  assert.equal(s.add(binding, "en", "x"), null);
  assert.equal(s.drafts.size, 100);
});
test("cooldown capacity is bounded and TTL releases it", () => {
  let now = 0;
  const s = new Store(() => now);
  for (let x = 0; x < 500; x++) assert(s.throttle(s.users, String(x), 5000));
  assert(!s.throttle(s.users, "overflow", 5000));
  now = 5000;
  assert(s.throttle(s.users, "overflow", 5000));
  assert.equal(s.users.size, 1);
});
test("same-key cooldown cannot be extended by retries", () => {
  let now = 0;
  const s = new Store(() => now);
  assert(s.throttle(s.channels, "c", 60_000));
  now = 59_999;
  assert(!s.throttle(s.channels, "c", 60_000));
  now++;
  assert(s.throttle(s.channels, "c", 60_000));
});
test("existing owner can replace their draft at capacity", () => {
  const s = new Store();
  for (let x = 0; x < 100; x++)
    assert(s.add({ ...binding, owner: String(x) }, "en", "x"));
  const n = s.add({ ...binding, owner: "0" }, "tr", "new");
  assert(n);
  assert.equal(s.drafts.size, 100);
  assert.equal(s.drafts.get(n)?.content, "new");
});

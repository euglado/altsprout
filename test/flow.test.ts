import assert from "node:assert/strict";
import test from "node:test";
import { Flow, type Port } from "../src/flow.js";
import { copy } from "../src/review.js";

function fake(overrides: Partial<Port> = {}) {
  const calls: string[] = [];
  const sends: string[] = [];
  let nonce = "";
  const port: Port = {
    kind: "modal",
    name: "as:write:en",
    binding: { owner: "u", guild: "g", channel: "c", application: "a" },
    bot: "b",
    locale: "en",
    message: null,
    getLanguage: () => null,
    getText: () => "Red bicycle",
    modal: async (l) => {
      calls.push(`modal:${l}`);
    },
    reply: async (t) => {
      calls.push(`reply:${t}`);
    },
    defer: async () => {
      calls.push("defer");
    },
    edit: async (t, buttons) => {
      calls.push(t);
      if (buttons) nonce = buttons.nonce;
      return "m";
    },
    acknowledge: async () => {
      calls.push("ack");
    },
    publisher: async () => async (text) => {
      sends.push(text);
    },
    ...overrides,
  };
  return {
    port,
    calls,
    sends,
    get nonce() {
      return nonce;
    },
  };
}
async function preview(flow = new Flow("g")) {
  const f = fake();
  await flow.handle(f.port);
  assert(f.nonce);
  f.port.kind = "button";
  f.port.name = `as:share:${f.nonce}`;
  f.port.message = { id: "m", author: "b", webhook: "a", ephemeral: true };
  return { f, flow };
}
test("slash command opens chosen language modal privately", async () => {
  const f = fake({
    kind: "command",
    name: "altsprout",
    getLanguage: () => "tr",
  });
  await new Flow("g").handle(f.port);
  assert.deepEqual(f.calls, ["modal:tr"]);
});
test("opening commands is throttled", async () => {
  const flow = new Flow("g");
  const f = fake({ kind: "command", name: "altsprout" });
  await flow.handle(f.port);
  await flow.handle(f.port);
  assert(f.calls[1]?.includes(copy.en.busy));
});
test("unknown command/component ignored", async () => {
  for (const kind of ["command", "modal", "button", "other"] as const) {
    const f = fake({ kind, name: "other" });
    await new Flow("g").handle(f.port);
    assert.deepEqual(f.calls, []);
  }
});
test("wrong guild fails closed before processing content", async () => {
  const f = fake();
  f.port.binding.guild = "other";
  await new Flow("g").handle(f.port);
  assert.equal(f.calls.length, 1);
  assert(f.calls[0]?.includes(copy.en.denied));
});
test("invalid modal input creates no draft", async () => {
  const flow = new Flow("g");
  const f = fake({ getText: () => "" });
  await flow.handle(f.port);
  assert.deepEqual(f.calls, ["defer", copy.en.invalid]);
  assert.equal(flow.store.drafts.size, 0);
});
test("preview failure removes retained content", async () => {
  const flow = new Flow("g");
  const f = fake({
    edit: async () => {
      throw new Error("secret-shaped error");
    },
  });
  await flow.handle(f.port);
  assert.equal(flow.store.drafts.size, 0);
  assert(!f.calls.join().includes("secret-shaped"));
});
test("explicit share publishes only description and consumes draft", async () => {
  const { f, flow } = await preview();
  await flow.handle(f.port);
  assert.equal(f.sends.length, 1);
  assert(f.sends[0]?.includes("Red bicycle"));
  assert(!f.sends[0]?.includes(copy.en.prompts));
  assert.equal(flow.store.drafts.size, 0);
  assert.equal(f.calls.at(-1), copy.en.shared);
});
test("discard publishes nothing and clears stored description", async () => {
  const { f, flow } = await preview();
  f.port.name = `as:discard:${f.nonce}`;
  await flow.handle(f.port);
  assert.equal(f.sends.length, 0);
  assert.equal(flow.store.drafts.size, 0);
  assert.equal(f.calls.at(-1), copy.en.discarded);
});
test("simultaneous replay sends once", async () => {
  const { f, flow } = await preview();
  await Promise.all([
    flow.handle(f.port),
    flow.handle(f.port),
    flow.handle(f.port),
  ]);
  assert.equal(f.sends.length, 1);
});
for (const mutation of [
  "author",
  "webhook",
  "ephemeral",
  "id",
  "owner",
  "channel",
  "application",
] as const) {
  test(`rejects forged ${mutation} binding`, async () => {
    const { f, flow } = await preview();
    assert(f.port.message);
    if (mutation === "ephemeral") f.port.message.ephemeral = false;
    else if (
      mutation === "author" ||
      mutation === "webhook" ||
      mutation === "id"
    )
      f.port.message[mutation] = "wrong";
    else f.port.binding = { ...f.port.binding, [mutation]: "wrong" };
    await flow.handle(f.port);
    assert.equal(f.sends.length, 0);
    assert.equal(flow.store.drafts.size, 1);
  });
}
test("permissions revoked after preview block publication", async () => {
  const { f, flow } = await preview();
  f.port.publisher = async () => null;
  await flow.handle(f.port);
  assert.equal(f.sends.length, 0);
  assert.equal(flow.store.drafts.size, 0);
  assert.equal(f.calls.at(-1), copy.en.denied);
});
test("send failure is sanitized and never automatically retried", async () => {
  const { f, flow } = await preview();
  let attempts = 0;
  f.port.publisher = async () => async () => {
    attempts++;
    throw new Error("token=private user text");
  };
  await flow.handle(f.port);
  await flow.handle(f.port);
  assert.equal(attempts, 1);
  assert(!f.calls.join().includes("token=private"));
  assert(f.calls.includes(copy.en.failed));
});
test("channel cooldown blocks another user", async () => {
  const flow = new Flow("g");
  const first = await preview(flow);
  await flow.handle(first.f.port);
  const second = fake({
    binding: {
      owner: "other-user",
      guild: "g",
      channel: "c",
      application: "a",
    },
  });
  await flow.handle(second.port);
  second.port.kind = "button";
  second.port.name = `as:share:${second.nonce}`;
  second.port.message = { id: "m", author: "b", webhook: "a", ephemeral: true };
  await flow.handle(second.port);
  assert.equal(second.sends.length, 0);
  assert.equal(second.calls.at(-1), copy.en.busy);
});
test("restart invalidates old preview", async () => {
  const { f } = await preview();
  await new Flow("g").handle(f.port);
  assert.equal(f.sends.length, 0);
  assert(f.calls.at(-1)?.includes(copy.en.unavailable));
});
test("five-minute deadline prevents publication", async () => {
  const { f, flow } = await preview();
  const d = flow.store.drafts.get(f.nonce);
  assert(d);
  d.expires = 0;
  await flow.handle(f.port);
  assert.equal(f.sends.length, 0);
});
test("Turkish preview confirmation remains Turkish regardless of click locale", async () => {
  const flow = new Flow("g");
  const f = fake({ name: "as:write:tr" });
  await flow.handle(f.port);
  f.port.kind = "button";
  f.port.name = `as:discard:${f.nonce}`;
  f.port.message = { id: "m", author: "b", webhook: "a", ephemeral: true };
  await flow.handle(f.port);
  assert.equal(f.calls.at(-1), copy.tr.discarded);
});

import assert from "node:assert/strict";
import test from "node:test";
import { ChannelType, type Client, PermissionFlagsBits } from "discord.js";
import {
  command,
  controls,
  modal,
  permitted,
  publisher,
  required,
} from "../src/adapter.js";

test("guild command requests no administrative defaults", () => {
  const c = command().toJSON();
  assert.equal(c.name, "altsprout");
  assert.equal(c.default_member_permissions, String(required));
  assert.equal(c.options?.length, 1);
});
for (const lang of ["en", "tr"] as const)
  test(`modal and buttons are labelled ${lang}`, () => {
    const m = modal(lang).toJSON();
    assert.equal(m.custom_id, `as:write:${lang}`);
    assert(m.title.length <= 45);
    assert.equal(m.components.length, 1);
    const buttons = controls("a".repeat(36), lang)[0]?.toJSON();
    assert(buttons);
    assert.equal(buttons.components.length, 2);
    for (const b of buttons.components)
      assert(
        "custom_id" in b &&
          b.custom_id?.length ===
            45 + (b.custom_id.includes("discard") ? 2 : 0),
      );
  });
for (const type of [ChannelType.GuildText, ChannelType.GuildAnnouncement])
  test(`allows minimal permissions on ${type}`, () =>
    assert(permitted(type, "g", "g", required, required)));
for (const type of [
  ChannelType.DM,
  ChannelType.GuildVoice,
  ChannelType.GuildForum,
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.GuildStageVoice,
  ChannelType.GuildCategory,
])
  test(`unsupported channel ${type} fails closed`, () =>
    assert(!permitted(type, "g", "g", required, required)));
test("missing user or bot permission denies", () => {
  for (const bits of [
    undefined,
    0n,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
  ]) {
    assert(!permitted(ChannelType.GuildText, "g", "g", bits, required));
    assert(!permitted(ChannelType.GuildText, "g", "g", required, bits));
  }
  assert(!permitted(ChannelType.GuildText, "other", "g", required, required));
});
test("administrator still cannot bypass channel type", () => {
  assert(permitted(ChannelType.GuildText, "g", "g", 8n, 8n));
  assert(!permitted(ChannelType.GuildVoice, "g", "g", 8n, 8n));
});
test("publisher refreshes roles, channel, both members and suppresses mentions/embeds", async () => {
  const events: string[] = [];
  let sent: unknown;
  const channel = {
    type: ChannelType.GuildText,
    guildId: "g",
    permissionsFor: () => ({ bitfield: required }),
    send: async (payload: unknown) => {
      sent = payload;
    },
  };
  const guild = {
    roles: {
      fetch: async () => {
        events.push("roles");
      },
    },
    channels: {
      fetch: async (id: string, options: unknown) => {
        assert.equal(id, "c");
        assert.deepEqual(options, { force: true, cache: false });
        events.push("channel");
        return channel;
      },
    },
    members: {
      fetch: async (o: unknown) => {
        assert.deepEqual(o, {
          user: events.length === 2 ? "u" : "b",
          force: true,
          cache: false,
        });
        events.push("member");
        return {};
      },
    },
  };
  const client = {
    user: { id: "b" },
    guilds: {
      fetch: async (id: string) => {
        assert.equal(id, "g");
        return guild;
      },
    },
  } as unknown as Client;
  const send = await publisher(client, "g", "c", "u");
  assert(send);
  await send("@everyone");
  assert.deepEqual(events, ["roles", "channel", "member", "member"]);
  assert.deepEqual(sent, {
    content: "@everyone",
    allowedMentions: { parse: [], repliedUser: false },
    flags: 4,
  });
});

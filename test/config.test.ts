import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { keys, parseEnv, validate } from "../src/config.js";

const valid = {
  DISCORD_TOKEN: "x".repeat(40),
  DISCORD_APPLICATION_ID: "12345678901234567",
  DISCORD_GUILD_ID: "23456789012345678",
};
test("accepts only needed config fields", () =>
  assert.deepEqual(validate(valid), {
    token: valid.DISCORD_TOKEN,
    application: valid.DISCORD_APPLICATION_ID,
    guild: valid.DISCORD_GUILD_ID,
  }));
for (const key of keys)
  test(`missing ${key} fails without secret output`, () => {
    assert.throws(
      () => validate({ ...valid, [key]: "" }),
      (e) => e instanceof Error && !e.message.includes(valid.DISCORD_TOKEN),
    );
  });
test("parser supports CRLF and comments", () =>
  assert.deepEqual(parseEnv("# comment\r\nDISCORD_GUILD_ID=123\r\n"), {
    DISCORD_GUILD_ID: "123",
  }));
for (const input of [
  "PATH=evil",
  "DISCORD_TOKEN=a\nDISCORD_TOKEN=b",
  "export DISCORD_TOKEN=a",
  "not config",
])
  test(`rejects ambiguous config ${input.split("\n")[0]}`, () =>
    assert.throws(() => parseEnv(input)));
for (const token of ["a\nb", "x".repeat(201), "x y"])
  test(`invalid token shape ${token.length}`, () =>
    assert.throws(() => validate({ ...valid, DISCORD_TOKEN: token })));
for (const entry of [
  "dist/src/main.js",
  "dist/src/register.js",
  "scripts/setup.mjs",
]) {
  test(`unconfigured ${entry} fails safely without writes`, () => {
    const tempRoot = realpathSync(os.tmpdir());
    const directory = mkdtempSync(path.join(tempRoot, "altsprout-smoke-"));
    const root = fileURLToPath(new URL("../../", import.meta.url));
    const env = { ...process.env };
    for (const key of keys) delete env[key];
    try {
      const r = spawnSync(process.execPath, [path.join(root, entry)], {
        cwd: directory,
        env,
        encoding: "utf8",
        timeout: 15000,
      });
      assert.equal(r.status, 1, r.stderr);
      assert(!existsSync(path.join(directory, ".env")));
      assert(r.stderr.length > 0);
      assert(!r.stderr.includes("Error:"));
    } finally {
      const resolved = realpathSync(directory);
      assert.equal(path.dirname(resolved), tempRoot);
      assert(path.basename(resolved).startsWith("altsprout-smoke-"));
      rmSync(resolved, { recursive: true });
    }
  });
}

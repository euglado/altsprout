import { readFileSync } from "node:fs";
export const keys = [
  "DISCORD_TOKEN",
  "DISCORD_APPLICATION_ID",
  "DISCORD_GUILD_ID",
] as const;
export function parseEnv(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const m =
      /^(DISCORD_TOKEN|DISCORD_APPLICATION_ID|DISCORD_GUILD_ID)=([^\r\n]*)$/.exec(
        line,
      );
    if (!m?.[1] || m[2] === undefined || Object.hasOwn(result, m[1]))
      throw new Error("Invalid configuration file");
    result[m[1]] = m[2];
  }
  return result;
}
export function validate(env: Record<string, string | undefined>) {
  const token = env.DISCORD_TOKEN ?? "";
  const application = env.DISCORD_APPLICATION_ID ?? "";
  const guild = env.DISCORD_GUILD_ID ?? "";
  if (
    !/^[A-Za-z0-9_.-]{30,200}$/.test(token) ||
    !/^[1-9]\d{16,19}$/.test(application) ||
    !/^[1-9]\d{16,19}$/.test(guild)
  )
    throw new Error("Run npm run setup; keep .env private.");
  return { token, application, guild };
}
export function loadConfig() {
  let file: Record<string, string> = {};
  try {
    file = parseEnv(readFileSync(".env", "utf8"));
  } catch (e) {
    if (!(e && typeof e === "object" && "code" in e && e.code === "ENOENT"))
      throw new Error("Configuration could not be read. Run npm run setup.");
  }
  const env: Record<string, string | undefined> = { ...file };
  for (const key of keys)
    if (process.env[key] !== undefined) env[key] = process.env[key];
  return validate(env);
}

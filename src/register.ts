import { REST, Routes } from "discord.js";
import { command } from "./adapter.js";
import { loadConfig } from "./config.js";

async function register() {
  const c = loadConfig();
  await new REST({ version: "10", retries: 0 })
    .setToken(c.token)
    .post(Routes.applicationGuildCommands(c.application, c.guild), {
      body: command().toJSON(),
    });
  console.log(
    "/altsprout registered for the configured server. Existing differently named commands were preserved.",
  );
}
register().catch(() => {
  console.error(
    "Registration failed. Run npm run setup; verify the application, token, server ID and installation. Do not share secrets.",
  );
  process.exitCode = 1;
});

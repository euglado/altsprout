import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { adapt } from "./adapter.js";
import { loadConfig } from "./config.js";
import { Flow } from "./flow.js";

async function main() {
  const config = loadConfig();
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
    }),
    allowedMentions: { parse: [], repliedUser: false },
    rest: { retries: 0 },
  });
  const flow = new Flow(config.guild);
  const timer = setInterval(() => flow.store.prune(), 30_000);
  timer.unref();
  client.once(Events.ClientReady, (ready) => {
    if (ready.application.id !== config.application) {
      console.error("Application ID and token do not match. Run setup again.");
      client.destroy();
      clearInterval(timer);
      process.exitCode = 1;
      return;
    }
    console.log("AltSprout is ready. Use /altsprout in the configured server.");
  });
  client.on(Events.InteractionCreate, (i) => {
    const port = adapt(i, client, config.guild);
    if (port)
      void flow
        .handle(port)
        .catch(() =>
          console.error("Interaction failed; retry using /altsprout."),
        );
  });
  client.on(Events.Error, () =>
    console.error(
      "Discord connection error. Check connectivity and configuration.",
    ),
  );
  client.rest.on("rateLimited", () =>
    console.error("Discord rate limit reached. Please wait."),
  );
  const shutdown = () => {
    clearInterval(timer);
    flow.store.drafts.clear();
    flow.store.users.clear();
    flow.store.channels.clear();
    client.destroy();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  await client.login(config.token);
}
main().catch(() => {
  console.error(
    "AltSprout could not start. Run npm run setup, check Node 24 and internet access; never paste your token into support requests.",
  );
  process.exitCode = 1;
});

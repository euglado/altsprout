import { existsSync, writeFileSync } from "node:fs";
import { stdin, stdout } from "node:process";

function ask(label, hidden = false) {
  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(label);
    const previous = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    const finish = (error) => {
      stdin.off("data", onData);
      stdin.setRawMode(previous);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(new Error("Cancelled"));
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\u0003") {
          finish(true);
          return;
        }
        if (char === "\r" || char === "\n") {
          finish(false);
          return;
        }
        if (char === "\u007f" || char === "\b") {
          if (value) {
            value = value.slice(0, -1);
            if (!hidden) stdout.write("\b \b");
          }
        } else if (/^[A-Za-z0-9_.-]$/.test(char) && value.length < 200) {
          value += char;
          if (!hidden) stdout.write(char);
        }
      }
    };
    stdin.on("data", onData);
  });
}
async function main() {
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error(
      "Interactive terminal required / Etkileşimli terminal gerekli.",
    );
  if (existsSync(".env"))
    throw new Error(
      ".env already exists; move it privately before reconfiguring / .env zaten var; yeniden kurmadan önce güvenli yere taşı.",
    );
  stdout.write(
    "AltSprout setup / kurulum. Token input is hidden / token görünmez. Ctrl+C cancels.\n",
  );
  const token = await ask("Bot token / Bot tokenı: ", true);
  const application = await ask("Application ID / Uygulama kimliği: ");
  const guild = await ask("Server ID / Sunucu kimliği: ");
  if (
    !/^[A-Za-z0-9_.-]{30,200}$/.test(token) ||
    !/^[1-9]\d{16,19}$/.test(application) ||
    !/^[1-9]\d{16,19}$/.test(guild)
  )
    throw new Error(
      "Invalid input; nothing saved / Geçersiz giriş; kaydedilmedi.",
    );
  writeFileSync(
    ".env",
    `DISCORD_TOKEN=${token}\nDISCORD_APPLICATION_ID=${application}\nDISCORD_GUILD_ID=${guild}\n`,
    { flag: "wx", mode: 0o600 },
  );
  stdout.write(
    "Saved locally to .env. Never share it / .env yerel olarak kaydedildi; paylaşma.\n",
  );
}
main().catch(() => {
  console.error(
    "Setup stopped without replacing configuration. Use an interactive terminal and valid IDs; if .env exists, move it privately first. / Kurulum durdu; yapılandırma değiştirilmedi. Etkileşimli terminal ve geçerli kimlikler kullan; varsa .env dosyasını önce güvenli yere taşı.",
  );
  process.exitCode = 1;
});

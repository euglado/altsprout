import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const mode = process.argv[2];
if (
  !["start", "register"].includes(mode) ||
  Number(process.versions.node.split(".")[0]) !== 24
) {
  console.error("Use Node.js 24 and npm start or npm run register.");
  process.exitCode = 1;
} else {
  const entry = `dist/src/${mode === "start" ? "main" : "register"}.js`;
  if (!existsSync(new URL(`../${entry}`, import.meta.url))) {
    console.error(
      "Run npm ci --ignore-scripts and npm run check first / Önce bağımlılıkları kur ve npm run check çalıştır.",
    );
    process.exitCode = 1;
  } else {
    const child = spawn(process.execPath, [entry], {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });
    child.on("error", () => {
      console.error("Could not launch Node.js.");
      process.exitCode = 1;
    });
    child.on("exit", (code) => {
      process.exitCode = code ?? 1;
    });
    for (const signal of ["SIGINT", "SIGTERM"])
      process.on(signal, () => child.kill(signal));
  }
}

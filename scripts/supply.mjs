import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
assert.equal(lock.lockfileVersion, 3);
const licenses = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "(MIT OR Apache-2.0)",
  "MIT OR Apache-2.0",
]);
let dependencies = 0;
for (const [name, record] of Object.entries(lock.packages)) {
  if (name === "") continue;
  assert(licenses.has(record.license), `Review license: ${name}`);
  assert.equal(
    new URL(record.resolved).origin,
    "https://registry.npmjs.org",
    `Review registry: ${name}`,
  );
  assert(
    /^sha512-[A-Za-z0-9+/=]+$/.test(record.integrity),
    `Missing integrity: ${name}`,
  );
  assert(!record.hasInstallScript, `Review install script: ${name}`);
  dependencies++;
}
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (["node_modules", ".git", "dist", "coverage"].includes(entry.name))
      continue;
    // Private local configuration is never read, even during operator checks.
    if (entry.name.startsWith(".env") && entry.name !== ".env.example")
      continue;
    const file = path.join(directory, entry.name);
    assert(!lstatSync(file).isSymbolicLink(), "Unexpected symlink");
    if (entry.isDirectory()) walk(file);
    else files.push(file);
  }
}
walk(".");
if (existsSync(".git")) {
  const tracked = execFileSync("git", ["ls-files", "--cached", "-z"], {
    encoding: "utf8",
  }).split("\0");
  assert(
    !tracked.some(
      (file) =>
        path.basename(file).startsWith(".env") &&
        path.basename(file) !== ".env.example",
    ),
    "A private configuration file is tracked by Git",
  );
}
const patterns = [
  new RegExp("-----BEGIN " + "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
  new RegExp("gh[pousr]_" + "[A-Za-z0-9]{30,}"),
  new RegExp(
    "(?:mfa\\." +
      "[A-Za-z0-9_-]{40,}|[A-Za-z0-9_-]{23,28}\\.[A-Za-z0-9_-]{6}\\.[A-Za-z0-9_-]{27,})",
  ),
];
let scanned = 0;
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const pattern of patterns)
    assert(!pattern.test(source), `Credential-shaped content: ${file}`);
  scanned++;
}
console.log(
  `${dependencies} dependency license/registry/SHA-512/no-install-script records; ${scanned} source credential-pattern scans passed. This is a limited heuristic, not a security guarantee.`,
);

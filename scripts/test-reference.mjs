#!/usr/bin/env node
/**
 * Runs the self-tests of the reference scripts the skills ship as Markdown:
 * the REST client against its mock server, and the three webhook verifiers
 * against a signed fixture made moments before. The sources live under
 * scripts/reference and are rendered into the skills' references by
 * npm run sync, so what a user copies is what this proves. Python and PHP
 * run when their interpreter is on the PATH; a missing one is reported and
 * skipped, never silently.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const reference = join(root, "scripts", "reference");
const python = process.platform === "win32" ? "python" : "python3";
let failed = false;

function run(label, command, args) {
  console.log(`\n== ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error && result.error.code === "ENOENT") {
    console.log(`${label}: ${command} is not on the PATH, skipped`);
    return;
  }
  if (result.status !== 0) {
    console.error(`${label}: failed (exit ${result.status})`);
    failed = true;
  }
}

run("client self-test", process.execPath, [join(reference, "rest-api", "client.mjs"), "--self-test"]);

const dir = mkdtempSync(join(tmpdir(), "subscriby-fixture-"));
const fixture = join(dir, "fixture.json");
const made = spawnSync(process.execPath, [join(reference, "webhooks", "make-fixture.mjs")], { encoding: "utf8" });
if (made.status !== 0) {
  console.error("make-fixture.mjs failed");
  process.exit(1);
}
writeFileSync(fixture, made.stdout);
run("verify.mjs", process.execPath, [join(reference, "webhooks", "verify.mjs"), fixture]);
run("verify.py", python, ["-I", join(reference, "webhooks", "verify.py"), fixture]);
run("verify.php", "php", [join(reference, "webhooks", "verify.php"), fixture]);
rmSync(dir, { recursive: true, force: true });

process.exit(failed ? 1 : 0);

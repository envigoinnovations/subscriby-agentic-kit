#!/usr/bin/env node
/**
 * Runs the Claude Code CLI with the arguments given, so the npm scripts work on a
 * machine where `claude` is not on the PATH: set CLAUDE_BIN to the binary
 * (the VS Code extension ships one under resources/native-binary/claude.exe).
 * Arguments are passed through untouched, never re-parsed by a shell, so a
 * path with spaces stays one argument.
 */
import { spawnSync } from "node:child_process";

const binary = process.env.CLAUDE_BIN || "claude";
const args = process.argv.slice(2);

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, { stdio: "inherit" });
}

let result = run(binary, args);

if (result.error && result.error.code === "ENOENT" && process.platform === "win32") {
  result = run("cmd.exe", ["/d", "/s", "/c", `"${binary}" ${args.map((arg) => `"${arg.replace(/"/g, '\\"')}"`).join(" ")}`]);
}

if (result.error) {
  console.error(`Could not start ${binary}: ${result.error.message}. Set CLAUDE_BIN to the Claude Code binary.`);
  process.exit(1);
}

process.exit(result.status ?? 1);

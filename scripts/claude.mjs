#!/usr/bin/env node
/**
 * Runs the Claude Code CLI with the arguments given, so the npm scripts work on a
 * machine where `claude` is not on the PATH: set CLAUDE_BIN to the binary
 * (the VS Code extension ships one under resources/native-binary/claude.exe).
 */
import { spawnSync } from "node:child_process";

const binary = process.env.CLAUDE_BIN || "claude";
const result = spawnSync(binary, process.argv.slice(2), { stdio: "inherit", shell: process.platform === "win32" });

if (result.error) {
  console.error(`Could not start ${binary}: ${result.error.message}. Set CLAUDE_BIN to the Claude Code binary.`);
  process.exit(1);
}

process.exit(result.status ?? 1);

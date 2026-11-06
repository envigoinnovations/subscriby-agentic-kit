#!/usr/bin/env node
/**
 * Runs the Claude Code CLI with the arguments given, finding the binary where
 * it lives on the machine, so the npm scripts work whether Claude Code was
 * installed with the native installer, with npm, or only as the VS Code
 * extension (which ships a binary under resources/native-binary and puts
 * nothing on the PATH).
 *
 * Resolution order: CLAUDE_BIN, then `claude` on the PATH, then the VS Code
 * extension (newest version first), then the native installer's and npm's
 * locations. Arguments pass through untouched: the binary is spawned without
 * a shell, and the one case that needs one (npm's claude.cmd on Windows)
 * builds the command line itself with every argument quoted exactly once.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

const windows = process.platform === "win32";
const home = homedir();

/** `claude` on the PATH, honouring PATHEXT on Windows. */
function onPath() {
  const extensions = windows ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";").map((extension) => extension.toLowerCase()) : [""];
  for (const dir of (process.env.PATH || "").split(delimiter).filter(Boolean)) {
    for (const extension of extensions) {
      const candidate = join(dir, `claude${extension}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function versionOf(name) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(name);
  return match ? match.slice(1).map(Number) : [0, 0, 0];
}

function newestFirst(a, b) {
  const [x, y] = [versionOf(a), versionOf(b)];
  for (let index = 0; index < 3; index += 1) {
    if (x[index] !== y[index]) return y[index] - x[index];
  }
  return 0;
}

/** The binary the VS Code extension (or a fork's) ships, newest extension version first. */
function inVsCodeExtension() {
  const roots = [".vscode", ".vscode-insiders", ".cursor", ".windsurf"].map((editor) => join(home, editor, "extensions"));
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const extensions = readdirSync(root)
      .filter((name) => name.startsWith("anthropic.claude-code-"))
      .sort(newestFirst);
    for (const name of extensions) {
      const candidate = join(root, name, "resources", "native-binary", windows ? "claude.exe" : "claude");
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/** Where the native installer and npm put the binary when it is not on the PATH of this shell. */
function inKnownLocations() {
  const candidates = windows
    ? [
        join(home, ".local", "bin", "claude.exe"),
        join(process.env.LOCALAPPDATA || "", "Programs", "claude", "claude.exe"),
        join(process.env.APPDATA || "", "npm", "claude.cmd"),
      ]
    : [join(home, ".local", "bin", "claude"), join(home, ".claude", "local", "claude"), "/usr/local/bin/claude", "/opt/homebrew/bin/claude"];
  return candidates.find((candidate) => candidate && existsSync(candidate)) ?? null;
}

const binary = process.env.CLAUDE_BIN || onPath() || inVsCodeExtension() || inKnownLocations();
const args = process.argv.slice(2);

if (!binary) {
  console.error(
    "Claude Code was not found: not on the PATH, not in the VS Code extension, and not where the native installer or npm put it. " +
      "Install it (https://code.claude.com/docs/en/setup) or set CLAUDE_BIN to the binary.",
  );
  process.exit(1);
}

const quoted = (value) => `"${String(value).replace(/"/g, '\\"')}"`;

const result = /\.(cmd|bat)$/i.test(binary)
  ? spawnSync("cmd.exe", ["/d", "/s", "/c", `"${[binary, ...args].map(quoted).join(" ")}"`], { stdio: "inherit", windowsVerbatimArguments: true })
  : spawnSync(binary, args, { stdio: "inherit" });

if (result.error) {
  console.error(`Could not start ${binary}: ${result.error.message}. Set CLAUDE_BIN to the Claude Code binary.`);
  process.exit(1);
}

process.exit(result.status ?? 1);

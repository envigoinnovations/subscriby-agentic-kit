#!/usr/bin/env node
/**
 * The writing rules of the kit, held by a script so they cannot drift:
 * portable front matter on every skill, trigger-style descriptions within
 * the listing budget, bodies that stay lean, tool names that exist, counts
 * that are generated rather than typed, links that resolve, words that never
 * appear, and a skill behind every path the plugin manifest declares (git
 * carries no empty directory, so a declared path without a committed SKILL.md
 * passes locally and fails the runtime loader and CI).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadCatalogue, readJson } from "./lib/catalogue.mjs";
import { CATEGORIES, PLUGIN, SKILLS, skillEntries } from "./lib/generate.mjs";
import { parseFrontmatter } from "./lib/frontmatter.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = loadCatalogue(join(root, "catalogue"));
const map = readJson(join(root, "scripts", "skill-map.json"));
const allowlist = existsSync(join(root, "scripts", "lint-allowlist.json")) ? readJson(join(root, "scripts", "lint-allowlist.json")) : { identifiers: [] };

const STANDARD_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const COMMAND_KEYS = new Set(["description", "argument-hint", "allowed-tools", "disable-model-invocation", "model", "effort"]);
const AGENT_KEYS = new Set(["name", "description", "tools", "disallowedTools", "model", "color", "maxTurns", "effort", "skills"]);
const BANNED = [
  { pattern: /memberpass/i, why: "the retired brand" },
  { pattern: /most requested feature/i, why: "a launch line the owner refuses" },
  { pattern: /\bTODO\b/, why: "a TODO marker" },
  { pattern: /sbt_(live|test)_\d+_[0-9a-f]{8,}/i, why: "a token-shaped string" },
];
const COUNT_WORDS = /\b\d[\d,]*\s+(tools?|resources?|webhook events?|events?|endpoints?|abilities|error codes?|permissions)\b/;

const toolNames = new Set(catalogue.tools.map((tool) => tool.name));
const toolPrefixes = new Set(catalogue.tools.map((tool) => tool.name.split("_")[0]));
const identifierAllowlist = new Set(allowlist.identifiers ?? []);
const problems = [];

function problem(file, message) {
  problems.push(`${relative(root, file).replace(/\\/g, "/")}: ${message}`);
}

function stripGenerated(body) {
  return body.replace(/<!-- generated:[a-z-]+:start -->[\s\S]*?<!-- generated:[a-z-]+:end -->/g, "");
}

function checkProse(file, body) {
  const text = stripGenerated(body);
  for (const { pattern, why } of BANNED) {
    if (pattern.test(text)) problem(file, `contains ${why}`);
  }
  const countMatch = COUNT_WORDS.exec(text.replace(/```[\s\S]*?```/g, ""));
  if (countMatch) problem(file, `hand-typed count "${countMatch[0]}": counts are generated or absent`);

  for (const match of text.matchAll(/`([a-z]+(?:_[a-z0-9]+)+)`/g)) {
    const identifier = match[1];
    if (toolNames.has(identifier) || identifierAllowlist.has(identifier)) continue;
    if (toolPrefixes.has(identifier.split("_")[0])) {
      problem(file, `names a tool that does not exist: ${identifier} (add it to scripts/lint-allowlist.json if it is a field, not a tool)`);
    }
  }

  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = join(dirname(file), target.split("#")[0]);
    if (!existsSync(path)) problem(file, `link does not resolve: ${target}`);
  }
}

function lintSkill(file, category, name) {
  const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
  if (!data) return problem(file, "has no front matter");

  for (const key of Object.keys(data)) {
    if (!STANDARD_KEYS.has(key)) problem(file, `front matter key "${key}" is not in the portable set (${[...STANDARD_KEYS].join(", ")})`);
  }
  if (data.name !== name) problem(file, `name "${data.name}" must equal the directory name "${name}"`);
  if (typeof data.description !== "string" || data.description.length === 0) problem(file, "needs a description");
  else {
    if (data.description.length > 300) problem(file, `description is ${data.description.length} characters; keep it under 300`);
    if (!/^This skill should be used when/.test(data.description)) problem(file, 'description must open with "This skill should be used when"');
  }
  if (!data.metadata || data.metadata.category !== category) problem(file, `metadata.category must be "${category}"`);
  if (!data.metadata || !data.metadata.catalogue) problem(file, "metadata.catalogue must name the catalogue version the skill was written against");

  const lines = body.split("\n").length;
  if (lines > 500) problem(file, `body is ${lines} lines; keep SKILL.md under 500 and move detail to references/`);
  if (!/references\//.test(body) && existsSync(join(dirname(file), "references"))) problem(file, "has a references/ directory the body never points at");

  checkProse(file, body);

  if (!map[`${category}/${name}`]) problem(file, `has no entry in scripts/skill-map.json`);
}

function lintCommand(file) {
  const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
  if (!data) return problem(file, "has no front matter");
  for (const key of Object.keys(data)) {
    if (!COMMAND_KEYS.has(key)) problem(file, `front matter key "${key}" is not a command key`);
  }
  if (!data.description) problem(file, "needs a description");
  if (data["disable-model-invocation"] !== true) problem(file, "must set disable-model-invocation: true (commands are typed, never auto-run)");
  checkProse(file, body);
}

function lintAgent(file, name) {
  const { data, body } = parseFrontmatter(readFileSync(file, "utf8"));
  if (!data) return problem(file, "has no front matter");
  for (const key of Object.keys(data)) {
    if (!AGENT_KEYS.has(key)) problem(file, `front matter key "${key}" is not an agent key`);
  }
  if (data.name !== name) problem(file, `name "${data.name}" must equal the file name "${name}"`);
  if (!data.description) problem(file, "needs a description");
  if (!data.tools) problem(file, "must declare tools (an allowlist is what keeps it read-only)");
  checkProse(file, body);
}

let files = 0;
for (const category of CATEGORIES) {
  const dir = join(root, SKILLS, category);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const skillDir = join(dir, name);
    if (!statSync(skillDir).isDirectory()) continue;
    const file = join(skillDir, "SKILL.md");
    if (!existsSync(file)) continue;
    files += 1;
    lintSkill(file, category, name);
  }
}

const unwritten = skillEntries(map).filter((entry) => !existsSync(join(root, SKILLS, entry.category, entry.name, "SKILL.md")));
if (unwritten.length) {
  console.warn(`lint: ${unwritten.length} mapped skill(s) have no SKILL.md yet: ${unwritten.map((entry) => entry.key).join(", ")}`);
}

for (const dir of ["commands", "agents"]) {
  const full = join(root, PLUGIN, dir);
  if (!existsSync(full)) continue;
  for (const file of readdirSync(full).filter((f) => f.endsWith(".md"))) {
    files += 1;
    if (dir === "commands") lintCommand(join(full, file));
    else lintAgent(join(full, file), file.replace(/\.md$/, ""));
  }
}

const manifestPath = join(root, PLUGIN, ".claude-plugin", "plugin.json");
files += 1;
for (const declared of readJson(manifestPath).skills ?? []) {
  const dir = join(root, PLUGIN, declared);
  const written = existsSync(dir) && readdirSync(dir).some((name) => existsSync(join(dir, name, "SKILL.md")));
  if (!written) problem(manifestPath, `declares ${declared} under skills, but no SKILL.md is committed there; declare the path in the slice that writes its first skill`);
}

for (const file of ["README.md", "CLAUDE.md", "SECURITY.md", "CHANGELOG.md", `${PLUGIN}/README.md`]) {
  const path = join(root, file);
  if (!existsSync(path)) continue;
  files += 1;
  const text = readFileSync(path, "utf8");
  for (const { pattern, why } of BANNED) if (pattern.test(stripGenerated(text))) problem(path, `contains ${why}`);
}

if (problems.length) {
  console.error(`lint: ${problems.length} problem(s) in ${files} files`);
  for (const line of problems) console.error(`  - ${line}`);
  process.exit(1);
}
console.log(`lint: ${files} files, no problems.`);

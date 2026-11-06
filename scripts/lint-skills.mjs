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

import { loadCatalogue, readJson, TOOL_PREFIX } from "./lib/catalogue.mjs";
import { CATEGORIES, PLUGIN, SKILLS, skillEntries } from "./lib/generate.mjs";
import { parseFrontmatter } from "./lib/frontmatter.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = loadCatalogue(join(root, "catalogue"));
const map = readJson(join(root, "scripts", "skill-map.json"));
const allowlist = existsSync(join(root, "scripts", "lint-allowlist.json")) ? readJson(join(root, "scripts", "lint-allowlist.json")) : { identifiers: [] };

const STANDARD_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const COMMAND_KEYS = new Set(["description", "argument-hint", "allowed-tools", "disable-model-invocation", "model", "effort"]);
const AGENT_KEYS = new Set(["name", "description", "tools", "disallowedTools", "model", "color", "maxTurns", "effort", "skills"]);
const EVAL_PROMPT_KEYS = new Set(["schema_version", "name", "description", "tags", "plugins", "runs", "expected_outcome", "model", "max_turns", "timeout_seconds", "allowed_tools", "append_system_prompt", "env"]);
const GRADER_TYPES = new Set(["regex", "tool_used", "tool_order", "file_exists", "llm", "baseline"]);
const GRADER_KEYS = new Set(["type", "weight", "arm", "pattern", "flags", "match", "target", "tool", "input_match", "min", "max", "before", "after", "path", "exists", "criteria", "focus", "baseline_file"]);
const MOCK_KEYS = new Set(["type", "expect", "error", "abort_when", "tools"]);
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

function skillNamesInMatch(pattern) {
  const group = /\(\?:\[\\w-\]\+:\)\?\(\?:([^)]+)\)"$/.exec(pattern);
  if (group) return group[1].split("|");
  const single = /\(\?:\[\\w-\]\+:\)\?([\w-]+)"$/.exec(pattern);
  return single ? [single[1]] : [];
}

/**
 * The eval suite is hand-written and runs on real model calls, so every rule
 * that can be checked for free is checked here: a case has a prompt phrased as
 * a user would type it and at least one grader on the result; a grader has a
 * known type with the fields that type needs; a tool_used grader names a tool
 * the catalogue has and a mock answers, or a skill that exists; a mock answers
 * a tool the catalogue has.
 */
function lintEvals(skillNames) {
  const evalsDir = join(root, PLUGIN, "evals");
  if (!existsSync(evalsDir)) return;
  const mocksDir = join(evalsDir, "mocks", "subscriby");
  const mocked = new Set();
  if (existsSync(mocksDir)) {
    for (const file of readdirSync(mocksDir).filter((f) => f.endsWith(".md") && !f.startsWith("_"))) {
      const tool = file.replace(/\.md$/, "");
      const path = join(mocksDir, file);
      files += 1;
      mocked.add(tool);
      if (!toolNames.has(tool)) problem(path, `mocks a tool the catalogue does not have: ${tool}`);
      const { data, body } = parseFrontmatter(readFileSync(path, "utf8"));
      if (!data) problem(path, "has no front matter");
      else for (const key of Object.keys(data)) if (!MOCK_KEYS.has(key)) problem(path, `front matter key "${key}" is not a mock field`);
      if (!body.trim()) problem(path, "answers nothing; a fixed mock's body is the tool result");
    }
  }

  let cases = 0;
  for (const name of readdirSync(evalsDir)) {
    const dir = join(evalsDir, name);
    if (!statSync(dir).isDirectory() || name === "mocks" || name === "results") continue;
    const promptFile = join(dir, "prompt.md");
    if (!existsSync(promptFile)) {
      problem(dir, "is not a case: it has no prompt.md");
      continue;
    }
    cases += 1;
    files += 1;
    const { data, body } = parseFrontmatter(readFileSync(promptFile, "utf8"));
    if (!data) problem(promptFile, "has no front matter");
    else for (const key of Object.keys(data)) if (!EVAL_PROMPT_KEYS.has(key)) problem(promptFile, `front matter key "${key}" is not a prompt.md field`);
    if (!body.trim()) problem(promptFile, "has an empty prompt");
    if (/\bskills?\b/i.test(body) || /\/subscriby:/.test(body)) problem(promptFile, "names a skill or a command; a prompt is phrased the way a user would type it");
    checkProse(promptFile, body);

    const gradersDir = join(dir, "graders");
    const graders = existsSync(gradersDir) ? readdirSync(gradersDir).filter((f) => f.endsWith(".md")) : [];
    if (graders.length === 0) problem(dir, "has no graders; a case needs at least one");
    let gradesTheResult = false;
    for (const file of graders) {
      const path = join(gradersDir, file);
      files += 1;
      const grader = parseFrontmatter(readFileSync(path, "utf8"));
      if (!grader.data) {
        problem(path, "has no front matter");
        continue;
      }
      for (const key of Object.keys(grader.data)) if (!GRADER_KEYS.has(key)) problem(path, `front matter key "${key}" is not a grader field`);
      if (!GRADER_TYPES.has(grader.data.type)) problem(path, `type "${grader.data.type}" is not a grader type`);
      if (grader.data.type === "regex" && !grader.data.pattern) problem(path, "a regex grader needs a pattern");
      if (grader.data.type === "llm" && !(/PASS if/.test(grader.body) && /FAIL if/.test(grader.body))) problem(path, "an llm rubric states its PASS if and FAIL if conditions in the body");
      if (grader.data.type === "tool_used") {
        const tool = grader.data.tool;
        if (!tool) problem(path, "a tool_used grader needs a tool");
        else if (tool.startsWith(TOOL_PREFIX)) {
          const short = tool.slice(TOOL_PREFIX.length);
          if (!toolNames.has(short)) problem(path, `grades a tool the catalogue does not have: ${short}`);
          else if (!mocked.has(short)) problem(path, `grades ${short}, which has no mock under evals/mocks/subscriby, so no run could ever call it`);
        } else if (tool === "Skill" && grader.data.input_match) {
          for (const skill of skillNamesInMatch(grader.data.input_match)) if (!skillNames.has(skill)) problem(path, `names a skill that does not exist: ${skill}`);
        }
      }
      if (["regex", "llm", "file_exists", "baseline"].includes(grader.data.type)) gradesTheResult = true;
      checkProse(path, grader.body);
    }
    if (graders.length > 0 && !gradesTheResult) problem(dir, "has no grader on the result (regex, llm, file_exists or baseline)");
  }
  if (cases === 0) console.warn("lint: the eval suite has no cases yet");
}

let files = 0;
const skillNames = new Set();
for (const category of CATEGORIES) {
  const dir = join(root, SKILLS, category);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    const skillDir = join(dir, name);
    if (!statSync(skillDir).isDirectory()) continue;
    const file = join(skillDir, "SKILL.md");
    if (!existsSync(file)) continue;
    files += 1;
    skillNames.add(name);
    lintSkill(file, category, name);
  }
}
lintEvals(skillNames);

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

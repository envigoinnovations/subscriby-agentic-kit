#!/usr/bin/env node
/**
 * The ratchet: every generated file must equal what the committed catalogue
 * produces, and every catalogue item must belong to at least one skill.
 * A new tool, event family, endpoint entity, ability category or error code
 * that nobody placed in scripts/skill-map.json fails here, so a catalogue
 * change can never be absorbed without a skill owning it.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadCatalogue, readJson } from "./lib/catalogue.mjs";
import { coverage, generate } from "./lib/generate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = loadCatalogue(join(root, "catalogue"));
const map = readJson(join(root, "scripts", "skill-map.json"));
const problems = [];

for (const [relative, content] of generate({ root, catalogue, map })) {
  const path = join(root, relative);
  if (!existsSync(path)) {
    problems.push(`missing generated file: ${relative} (run npm run sync)`);
    continue;
  }
  if (readFileSync(path, "utf8").replace(/\r\n/g, "\n") !== content) {
    problems.push(`stale generated file: ${relative} (run npm run sync, never edit it by hand)`);
  }
}

const { unmapped, unknown } = coverage(catalogue, map);
for (const [kind, items] of Object.entries(unmapped)) {
  for (const item of items) problems.push(`${kind}: ${item} belongs to no skill in scripts/skill-map.json`);
}
for (const item of unknown) problems.push(`skill-map.json names something the catalogue does not have: ${item}`);

if (problems.length) {
  console.error(`check: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`check: generated files match the catalogue ${catalogue.version}; every tool, event family, endpoint entity, ability category, error code and resource has a skill.`);

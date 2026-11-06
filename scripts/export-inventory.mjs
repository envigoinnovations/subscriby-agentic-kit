#!/usr/bin/env node
/**
 * Writes kit-inventory.json: what the plugin contains, for the docs' Agentic
 * Kit section to render from (the way the Zapier and n8n repos export their
 * operations). `--to-docs` also copies it into ../SubscribyDocs/scripts/data/.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { kindOf, loadCatalogue, readJson } from "./lib/catalogue.mjs";
import { CATEGORIES, GUARD, listMarkdown, skillEntries, skillsOnDisk } from "./lib/generate.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogue = loadCatalogue(join(root, "catalogue"));
const map = readJson(join(root, "scripts", "skill-map.json"));
const plugin = readJson(join(root, "plugins", "subscriby", ".claude-plugin", "plugin.json"));
const guard = readJson(join(root, GUARD, ".claude-plugin", "plugin.json"));
const marketplace = readJson(join(root, ".claude-plugin", "marketplace.json"));
const entries = new Map(skillEntries(map).map((entry) => [entry.key, entry]));

const skills = skillsOnDisk(root).map((skill) => {
  const entry = entries.get(`${skill.category}/${skill.name}`) ?? {};
  const references = existsSync(join(root, "plugins", "subscriby", "skills", skill.category, skill.name, "references"))
    ? readFileSync(join(root, "plugins", "subscriby", "skills", skill.category, skill.name, "SKILL.md"), "utf8").match(/references\/[a-z0-9-]+\.md/g) ?? []
    : [];
  return {
    category: skill.category,
    name: skill.name,
    description: skill.description,
    tools: entry.tools?.includes("*") ? catalogue.tools.length : (entry.tools ?? []).length,
    event_families: entry.events ?? [],
    endpoint_entities: entry.endpoints ?? [],
    docs: entry.docs ?? [],
    references: [...new Set(references)],
  };
});

const inventory = {
  generated_at: new Date().toISOString(),
  marketplace: marketplace.name,
  plugin: plugin.name,
  version: plugin.version,
  catalogue_version: catalogue.version,
  install: [`/plugin marketplace add envigoinnovations/subscriby-agentic-kit`, `/plugin install ${plugin.name}@${marketplace.name}`],
  categories: CATEGORIES.map((category) => ({ name: category, skills: skills.filter((skill) => skill.category === category).length })),
  skills,
  commands: listMarkdown(root, "commands").map(({ name, data }) => ({
    name: `/${plugin.name}:${name}`,
    argument_hint: data["argument-hint"] ?? "",
    description: data.description ?? "",
  })),
  agents: listMarkdown(root, "agents").map(({ name, data }) => ({ name: `${plugin.name}:${name}`, description: data.description ?? "" })),
  guard: {
    plugin: guard.name,
    version: guard.version,
    install: `/plugin install ${guard.name}@${marketplace.name}`,
  },
  hook: {
    guarded_tools: catalogue.tools.filter((tool) => kindOf(tool) === "destructive").length,
    additive_tools: catalogue.tools.filter((tool) => kindOf(tool) === "additive").length,
    read_tools: catalogue.tools.filter((tool) => kindOf(tool) === "read").length,
  },
  counts: catalogue.stamp?.counts ?? {},
};

const output = join(root, "kit-inventory.json");
writeFileSync(output, JSON.stringify(inventory, null, 2) + "\n");
console.log(`export:inventory: ${skills.length} skills, ${inventory.commands.length} commands, ${inventory.agents.length} agents → kit-inventory.json`);

if (process.argv.includes("--to-docs")) {
  const docs = resolve(root, "..", "SubscribyDocs", "scripts", "data", "kit-inventory.json");
  copyFileSync(output, docs);
  console.log(`copied to ${docs}`);
}

/**
 * The catalogues the kit is generated from: what Subscriby publishes, where it
 * is snapshotted in this repository, and the few derived facts every renderer
 * needs (a tool's kind, an ability's category).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** The prefix Claude Code gives the bundled server's tools: mcp__plugin_<plugin>_<server>__<tool>. */
export const TOOL_PREFIX = "mcp__plugin_subscriby_subscriby__";

export const API_HOST = "https://api.subscriby.net";
export const WWW_HOST = "https://www.subscriby.net";
export const DOCS_HOST = "https://docs.subscriby.net";

/** The JSON catalogues Subscriby exports, served from the API host and copied into Subscriby/public. */
export const CATALOGUE_FILES = [
  "mcp-tools.json",
  "abilities.json",
  "webhook-events.json",
  "api-endpoints.json",
  "error-codes.json",
  "team-permissions.json",
];

/** The Markdown documents the site renders for agents, copied verbatim into the skills that rest on them. */
export const DOCUMENTS = {
  "AGENTS.md": `${WWW_HOST}/AGENTS.md`,
  "auth.md": `${WWW_HOST}/auth.md`,
  "skill-rest-api.md": `${WWW_HOST}/.well-known/agent-skills/subscriby-rest-api/SKILL.md`,
  "skill-mcp.md": `${WWW_HOST}/.well-known/agent-skills/subscriby-mcp/SKILL.md`,
  "skill-webhooks.md": `${WWW_HOST}/.well-known/agent-skills/subscriby-webhooks/SKILL.md`,
};

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Loads the snapshot under `catalogue/` into one object the generator, the
 * checker and the linter share.
 */
export function loadCatalogue(dir) {
  const tools = readJson(join(dir, "mcp-tools.json"));
  const derived = join(dir, "derived");
  const documentsDir = join(dir, "documents");
  const documents = {};

  if (existsSync(documentsDir)) {
    for (const file of readdirSync(documentsDir)) {
      documents[file] = readFileSync(join(documentsDir, file), "utf8");
    }
  }

  const optional = (path) => (existsSync(path) ? readJson(path) : {});

  return {
    version: tools.version,
    tools: tools.tools,
    resources: tools.resources,
    abilities: readJson(join(dir, "abilities.json")).items,
    events: readJson(join(dir, "webhook-events.json")).items,
    endpoints: readJson(join(dir, "api-endpoints.json")).items,
    errors: readJson(join(dir, "error-codes.json")).items,
    permissions: readJson(join(dir, "team-permissions.json")).items,
    webhookExamples: optional(join(derived, "webhook-examples.json")),
    endpointDetails: optional(join(derived, "endpoint-details.json")),
    documents,
    stamp: existsSync(join(dir, "stamp.json")) ? readJson(join(dir, "stamp.json")) : null,
  };
}

/** read: side-effect free; additive: adds something new; destructive: changes or removes what exists. */
export function kindOf(tool) {
  if (tool.read_only) return "read";
  return tool.destructive ? "destructive" : "additive";
}

export function toolMap(catalogue) {
  return new Map(catalogue.tools.map((tool) => [tool.name, tool]));
}

export function abilityCategories(catalogue) {
  return new Map(catalogue.abilities.map((ability) => [ability.value, ability.category]));
}

export function eventFamilies(catalogue) {
  return [...new Set(catalogue.events.map((event) => event.family))];
}

export function endpointEntities(catalogue) {
  return [...new Set(catalogue.endpoints.map((endpoint) => endpoint.entity))];
}

/** The REST path as the OpenAPI document keys it (`/v1/...`), from the route uri (`/api/v1/...`). */
export function openApiPath(uri) {
  return uri.replace(/^\/api/, "");
}

export function counts(catalogue) {
  const kinds = { read: 0, additive: 0, destructive: 0 };
  for (const tool of catalogue.tools) kinds[kindOf(tool)] += 1;

  return {
    tools: catalogue.tools.length,
    read_tools: kinds.read,
    additive_tools: kinds.additive,
    destructive_tools: kinds.destructive,
    resources: catalogue.resources.length,
    abilities: catalogue.abilities.length,
    ability_categories: new Set(catalogue.abilities.map((a) => a.category)).size,
    events: catalogue.events.length,
    event_families: eventFamilies(catalogue).length,
    endpoints: catalogue.endpoints.length,
    endpoint_entities: endpointEntities(catalogue).length,
    error_codes: catalogue.errors.length,
    team_permissions: catalogue.permissions.length,
  };
}

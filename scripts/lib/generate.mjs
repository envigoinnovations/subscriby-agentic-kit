/**
 * Everything the kit generates from the catalogues, as a map of repository
 * path to file content. `sync` writes the map to disk; `check` compares it
 * with what is committed, so a hand edit of a generated file and a stale
 * regeneration fail the same way.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { TOOL_PREFIX, abilityCategories, kindOf, openApiPath, toolMap } from "./catalogue.mjs";
import { parseFrontmatter } from "./frontmatter.mjs";
import { cell, fence, fieldLines, replaceBlock, summary, table, titleCase } from "./render.mjs";

export const PLUGIN = "plugins/subscriby";
export const SKILLS = `${PLUGIN}/skills`;
export const CATEGORIES = ["foundation", "creators", "developers", "connector-sdk"];

const KIND_WORDS = {
  read: "read",
  additive: "additive",
  destructive: "destructive",
};

function header(catalogue, what) {
  return `Generated from the Subscriby catalogue (version ${catalogue.version}) by \`npm run sync\`; \`npm run check\` fails on a hand edit. ${what}`;
}

function expand(selection, all) {
  if (!selection) return [];
  if (selection.includes("*")) return all;
  return selection;
}

/** The skill entries of the map, each with its category, name and the items it owns. */
export function skillEntries(map) {
  return Object.entries(map)
    .filter(([key]) => !key.startsWith("$"))
    .map(([key, entry]) => {
      const [category, name] = key.split("/");
      return { key, category, name, title: titleCase(name), ...entry };
    });
}

function toolsReference(catalogue, entry, tools) {
  const names = expand(entry.tools, catalogue.tools.map((t) => t.name));
  const rows = names.map((name) => tools.get(name)).filter(Boolean);
  if (rows.length === 0) return null;

  const lines = [
    `# Tools: ${entry.title}`,
    "",
    header(catalogue, "Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it."),
    "",
    table(
      ["Tool", "Kind", "Ability", "What it does"],
      rows.map((tool) => [`\`${tool.name}\``, KIND_WORDS[kindOf(tool)], tool.required_ability ? `\`${tool.required_ability}\`` : "none", summary(tool.description)]),
    ),
  ];

  for (const tool of rows) {
    const facts = [KIND_WORDS[kindOf(tool)][0].toUpperCase() + KIND_WORDS[kindOf(tool)].slice(1)];
    if (tool.required_ability) facts.push(`requires \`${tool.required_ability}\``);
    if (tool.idempotent) facts.push("idempotent");
    if (tool.open_world) facts.push("open world");

    lines.push("", `## \`${tool.name}\``, "", facts.join(" · "), "", String(tool.description ?? "").trim());

    const fields = fieldLines(tool.input_schema);
    lines.push("", "**Arguments**", "", fields.length ? fields.join("\n") : "- none");

    if (tool.output_schema && tool.output_schema.properties) {
      lines.push("", "**Answer fields**", "", fieldLines(tool.output_schema).join("\n"));
    }
  }

  return lines.join("\n") + "\n";
}

/** An example header must never carry an environment variable: a plugin that reads one reads the user's machine. */
const sanitise = (text) => text.replace(/\$\{?SUBSCRIBY_TOKEN\}?/g, "<token>");

const eventFamilies = (catalogue) => [...new Set(catalogue.events.map((event) => event.family))];
const endpointEntities = (catalogue) => [...new Set(catalogue.endpoints.map((endpoint) => endpoint.entity))];

/**
 * A skill that owns every event or every endpoint would get one reference too
 * large to read whole or to validate, so it gets one file per family or entity
 * under references/events or references/endpoints, and this index to them.
 */
function splitIndex(catalogue, entry, kind) {
  const isEvents = kind === "events";
  const groups = isEvents ? eventFamilies(catalogue) : endpointEntities(catalogue);
  const count = (group) => (isEvents ? catalogue.events.filter((event) => event.family === group) : catalogue.endpoints.filter((endpoint) => endpoint.entity === group)).length;
  const lines = [
    `# ${isEvents ? "Webhook events" : "REST endpoints"}: ${entry.title}`,
    "",
    header(
      catalogue,
      isEvents
        ? "One file per family under `events/`, each carrying every event of the family with its ability, payload keys, description and an example; this index says where each family is."
        : "One file per entity under `endpoints/`, each carrying every operation of the entity with its method, path, ability, summary, MCP twins, parameters and request body; this index says where each entity is.",
    ),
    "",
    table(
      [isEvents ? "Family" : "Entity", isEvents ? "Events" : "Endpoints", "File"],
      groups.map((group) => [`\`${group}\``, String(count(group)), `[${kind}/${group}.md](${kind}/${group}.md)`]),
    ),
  ];
  return lines.join("\n") + "\n";
}

function eventsReference(catalogue, entry) {
  const families = expand(entry.events, [...new Set(catalogue.events.map((e) => e.family))]);
  const events = catalogue.events.filter((event) => families.includes(event.family));
  if (events.length === 0) return null;

  const lines = [
    `# Webhook events: ${entry.title}`,
    "",
    header(catalogue, "An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`."),
  ];

  for (const family of families) {
    const rows = events.filter((event) => event.family === family);
    if (rows.length === 0) continue;
    lines.push("", `## Family \`${family}\``, "", table(["Event", "Needs ability", "Payload keys"], rows.map((event) => [`\`${event.name}\``, `\`${event.required_ability}\``, event.payload_keys.map((k) => `\`${k}\``).join(", ")])));

    for (const event of rows) {
      const detail = catalogue.webhookExamples[event.name];
      if (!detail) continue;
      lines.push("", `### \`${event.name}\``, "");
      if (detail.summary) lines.push(detail.summary, "");
      if (detail.description && detail.description !== detail.summary) lines.push(detail.description.trim(), "");
      if (detail.example) lines.push(fence("json", JSON.stringify(detail.example, null, 2)));
    }
  }

  return lines.join("\n") + "\n";
}

function endpointsReference(catalogue, entry) {
  const entities = expand(entry.endpoints, [...new Set(catalogue.endpoints.map((e) => e.entity))]);
  const endpoints = catalogue.endpoints.filter((endpoint) => entities.includes(endpoint.entity));
  if (endpoints.length === 0) return null;

  const lines = [
    `# REST endpoints: ${entry.title}`,
    "",
    header(catalogue, "Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP."),
  ];

  for (const entity of entities) {
    const rows = endpoints.filter((endpoint) => endpoint.entity === entity);
    if (rows.length === 0) continue;
    lines.push("", `## \`${entity}\``, "");
    lines.push(
      table(
        ["Method", "Path", "Ability", "Summary", "MCP twins"],
        rows.map((endpoint) => {
          const detail = catalogue.endpointDetails[`${endpoint.method} ${openApiPath(endpoint.uri)}`] ?? {};
          return [endpoint.method, `\`${openApiPath(endpoint.uri)}\``, endpoint.required_ability ? `\`${endpoint.required_ability}\`` : "none", detail.summary ?? "", (detail.mcpTools ?? []).map((t) => `\`${t}\``).join(", ")];
        }),
      ),
    );

    for (const endpoint of rows) {
      const detail = catalogue.endpointDetails[`${endpoint.method} ${openApiPath(endpoint.uri)}`];
      if (!detail) continue;
      lines.push("", `### ${endpoint.method} \`${openApiPath(endpoint.uri)}\``, "");
      if (detail.description) lines.push(detail.description.trim(), "");
      if (detail.parameters?.length) {
        lines.push("**Parameters**", "", ...detail.parameters.map((p) => `- \`${p.name}\` (${p.in}, ${p.type}${p.required ? ", required" : ""})${p.description ? `: ${p.description}` : ""}`), "");
      }
      if (detail.request?.length) {
        lines.push("**Request body**", "", ...detail.request, "");
      }
    }
  }

  return lines.join("\n") + "\n";
}

function errorsReference(catalogue, entry) {
  if (!entry.errors) return null;
  const lines = [
    `# Error codes: ${entry.title}`,
    "",
    header(catalogue, "Every error is `{\"error\": {\"code\", \"message\", \"docs_url\", \"remediation\", \"request_id\"}}`; branch on `code`, a stable string, and quote `request_id` when asking for help."),
    "",
    table(["Code", "HTTP", "Default message", "Remediation", "Docs"], catalogue.errors.map((e) => [`\`${e.code}\``, e.http_status, e.default_message, e.remediation, e.docs_url])),
  ];
  return lines.join("\n") + "\n";
}

function abilitiesReference(catalogue, entry) {
  if (!entry.abilities) return null;
  const categories = expand(entry.abilities, [...new Set(catalogue.abilities.map((a) => a.category))]);
  const lines = [
    `# Abilities: ${entry.title}`,
    "",
    header(catalogue, "An ability is `entity:action`; a token carries an explicit list and is frozen to one team. `enforced` means an endpoint or a tool checks it today; `pending` means it exists for a surface still to come; `no-api-surface` means it opens something in the dashboard or subscribes to events only; `deprecated` cannot be granted to a new token."),
  ];

  for (const category of categories) {
    const rows = catalogue.abilities.filter((a) => a.category === category);
    if (rows.length === 0) continue;
    lines.push("", `## \`${category}\``, "", table(["Ability", "Status", "Note"], rows.map((a) => [`\`${a.value}\``, a.status, a.note ?? ""])));
  }

  return lines.join("\n") + "\n";
}

function permissionsReference(catalogue, entry) {
  if (!entry.permissions) return null;
  const lines = [
    `# Team permissions: ${entry.title}`,
    "",
    header(catalogue, "A role is a set of these permissions; a team member's token can never carry an ability the role does not grant."),
    "",
    table(["Permission", "Entity", "Action", "Label"], catalogue.permissions.map((p) => [`\`${p.value}\``, p.entity, p.action, p.label])),
  ];
  return lines.join("\n") + "\n";
}

function resourcesReference(catalogue, entry) {
  if (!entry.resources) return null;
  const lines = [
    `# MCP resources: ${entry.title}`,
    "",
    header(catalogue, "A resource is a catalogue an agent reads once per session before it reasons about statuses, abilities, error codes, providers, events or connectors; none of them changes between deploys."),
    "",
    table(["URI", "Title", "What it holds"], catalogue.resources.map((r) => [`\`${r.uri}\``, r.title, r.description])),
  ];
  return lines.join("\n") + "\n";
}

/**
 * The reference scripts a skill ships: tested sources under scripts/reference,
 * rendered as one fenced block each, because the plugin carries Markdown and
 * JSON only and a user copies the block into their own repository.
 */
function scriptsReference(root, entry, sources) {
  const languages = { mjs: "js", js: "js", php: "php", py: "python", sh: "sh" };
  const blocks = sources.map((source) => {
    const code = readFileSync(join(root, "scripts", "reference", source), "utf8").replace(/\r\n/g, "\n").trimEnd();
    const file = source.split("/").pop();
    const language = languages[file.split(".").pop()] ?? "";
    return `## ${file}\n\n\`\`\`${language}\n${code}\n\`\`\``;
  });
  return [
    `# Reference scripts: ${entry.title}`,
    "",
    "Copy the file you need into the repository you are working in, keeping its name; each one is tested in the kit's own suite (`npm test` under `scripts/reference`) and rendered here by `npm run sync`, so `npm run check` fails on a hand edit.",
    "",
    ...blocks,
  ].join("\n") + "\n";
}

function hooks(catalogue) {
  const guarded = catalogue.tools.filter((tool) => kindOf(tool) === "destructive").map((tool) => tool.name);

  return JSON.stringify(
    {
      description: "Every Subscriby tool that changes or removes existing data asks before it runs, whatever the server's permission setting. The matcher is generated from the tool catalogue by npm run sync and leaves the server part open, so it holds under any name a host gives the server; the answer is hooks/ask-before-destructive.sh.",
      hooks: {
        PreToolUse: [
          {
            matcher: `^mcp__.*__(${guarded.join("|")})$`,
            hooks: [{ type: "command", command: '"${CLAUDE_PLUGIN_ROOT}"/hooks/ask-before-destructive.sh', timeout: 5 }],
          },
        ],
      },
    },
    null,
    2,
  ) + "\n";
}

/** The saved tools/list for the eval mocks, limited to the tools that have a mock file: a tool without one is never available to a run. */
function mockTools(catalogue, mocked) {
  return JSON.stringify(
    {
      tools: catalogue.tools.filter((tool) => mocked.has(tool.name)).map((tool) => ({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input_schema ?? { type: "object", properties: {} },
        annotations: {
          title: tool.title,
          readOnlyHint: Boolean(tool.read_only),
          destructiveHint: Boolean(tool.destructive),
          idempotentHint: Boolean(tool.idempotent),
          openWorldHint: Boolean(tool.open_world),
        },
      })),
    },
    null,
    2,
  ) + "\n";
}

/** The skills present on disk, by category, with the description each declares. */
export function skillsOnDisk(root) {
  const found = [];
  for (const category of CATEGORIES) {
    const dir = join(root, SKILLS, category);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      const file = join(dir, name, "SKILL.md");
      if (!existsSync(file)) continue;
      const { data } = parseFrontmatter(readFileSync(file, "utf8"));
      found.push({ category, name, description: data?.description ?? "", data });
    }
  }
  return found;
}

export function listMarkdown(root, dir) {
  const full = join(root, PLUGIN, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const { data } = parseFrontmatter(readFileSync(join(full, file), "utf8"));
      return { name: file.replace(/\.md$/, ""), data: data ?? {}, file: join(full, file) };
    });
}

function readmeBlocks(root, catalogue) {
  const readme = join(root, "README.md");
  if (!existsSync(readme)) return null;
  const skills = skillsOnDisk(root);
  const commands = listMarkdown(root, "commands");
  const agents = listMarkdown(root, "agents");
  const guarded = catalogue.tools.filter((tool) => kindOf(tool) === "destructive").length;

  let text = readFileSync(readme, "utf8").replace(/\r\n/g, "\n");
  text = replaceBlock(
    text,
    "counts",
    table(
      ["Component", "Count"],
      [
        ["Skills", skills.length],
        ["Slash commands", commands.length],
        ["Subagents", agents.length],
        ["MCP tools the guard watches", guarded],
        ["MCP tools, resources, events, endpoints behind them", `${catalogue.tools.length} tools, ${catalogue.resources.length} resources, ${catalogue.events.length} events, ${catalogue.endpoints.length} endpoints (catalogue ${catalogue.version})`],
      ],
    ),
  );

  const sections = [];
  for (const category of CATEGORIES) {
    const rows = skills.filter((skill) => skill.category === category);
    if (rows.length === 0) continue;
    sections.push(`#### ${titleCase(category)} (${rows.length})`, "", table(["Skill", "When Claude reaches for it"], rows.map((skill) => [`\`${skill.name}\``, skill.description])), "");
  }
  text = replaceBlock(text, "skills", sections.length ? sections.join("\n") : "The skills by category appear here after the first `npm run sync`.");

  return text;
}

function agentToolLines(root, catalogue) {
  const outputs = new Map();
  const readTools = catalogue.tools.filter((tool) => kindOf(tool) === "read").map((tool) => `${TOOL_PREFIX}${tool.name}`);
  const variants = {
    "read-only": readTools,
    "read-only-and-files": ["Read", "Grep", "Glob", "WebFetch", ...readTools],
  };

  for (const agent of listMarkdown(root, "agents")) {
    const text = readFileSync(agent.file, "utf8").replace(/\r\n/g, "\n");
    const match = /^# generated-tools: ([a-z-]+)\ntools: .*$/m.exec(text);
    if (!match) continue;
    const variant = variants[match[1]];
    if (!variant) throw new Error(`${agent.file}: unknown generated-tools variant "${match[1]}"`);
    const replaced = text.replace(match[0], `# generated-tools: ${match[1]}\ntools: ${variant.join(", ")}`);
    outputs.set(`${PLUGIN}/agents/${agent.name}.md`, replaced);
  }

  return outputs;
}

/**
 * @returns {Map<string, string>} repository-relative path → content
 */
export function generate({ root, catalogue, map }) {
  const outputs = new Map();
  const tools = toolMap(catalogue);

  for (const entry of skillEntries(map)) {
    const base = `${SKILLS}/${entry.category}/${entry.name}/references`;
    const everyEvent = (entry.events ?? []).includes("*");
    const everyEndpoint = (entry.endpoints ?? []).includes("*");
    const parts = {
      "tools.md": toolsReference(catalogue, entry, tools),
      "events.md": everyEvent ? splitIndex(catalogue, entry, "events") : eventsReference(catalogue, entry),
      "endpoints.md": everyEndpoint ? splitIndex(catalogue, entry, "endpoints") : endpointsReference(catalogue, entry),
      "error-codes.md": errorsReference(catalogue, entry),
      "abilities.md": abilitiesReference(catalogue, entry),
      "team-permissions.md": permissionsReference(catalogue, entry),
      "resources.md": resourcesReference(catalogue, entry),
    };
    for (const [file, content] of Object.entries(parts)) {
      if (content) outputs.set(`${base}/${file}`, sanitise(content));
    }
    if (everyEvent) {
      for (const family of eventFamilies(catalogue)) {
        outputs.set(`${base}/events/${family}.md`, sanitise(eventsReference(catalogue, { ...entry, events: [family], title: `${entry.title}, the \`${family}\` family` })));
      }
    }
    if (everyEndpoint) {
      for (const entity of endpointEntities(catalogue)) {
        outputs.set(`${base}/endpoints/${entity}.md`, sanitise(endpointsReference(catalogue, { ...entry, endpoints: [entity], title: `${entry.title}, the \`${entity}\` entity` })));
      }
    }
    for (const [file, sources] of Object.entries(entry.scripts ?? {})) {
      outputs.set(`${base}/${file}`, scriptsReference(root, entry, sources));
    }
    for (const document of entry.documents ?? []) {
      const content = catalogue.documents[document];
      if (!content) throw new Error(`${entry.key}: document "${document}" is not in catalogue/documents`);
      outputs.set(`${base}/${document}`, `<!-- Verbatim copy of ${document} as https://www.subscriby.net serves it; refreshed by npm run sync. -->\n\n${content.replace(/\r\n/g, "\n").trimEnd()}\n`);
    }
  }

  outputs.set(`${PLUGIN}/hooks/hooks.json`, hooks(catalogue));
  const mocksDir = join(root, PLUGIN, "evals", "mocks", "subscriby");
  const mocked = new Set(
    existsSync(mocksDir)
      ? readdirSync(mocksDir)
          .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
          .map((file) => file.replace(/\.md$/, ""))
      : [],
  );
  outputs.set(`${PLUGIN}/evals/mocks/subscriby/_tools.json`, mockTools(catalogue, mocked));

  const readme = readmeBlocks(root, catalogue);
  if (readme) outputs.set("README.md", readme);

  for (const [path, content] of agentToolLines(root, catalogue)) outputs.set(path, content);

  return outputs;
}

/** Which catalogue items the map covers and which it names that do not exist. */
export function coverage(catalogue, map) {
  const entries = skillEntries(map);
  const union = (field, all) => {
    const covered = new Set();
    for (const entry of entries) for (const item of expand(entry[field], all)) covered.add(item);
    return covered;
  };

  const toolNames = catalogue.tools.map((t) => t.name);
  const families = [...new Set(catalogue.events.map((e) => e.family))];
  const entities = [...new Set(catalogue.endpoints.map((e) => e.entity))];
  const categories = [...new Set(catalogue.abilities.map((a) => a.category))];
  const codes = catalogue.errors.map((e) => e.code);
  const resourceUris = catalogue.resources.map((r) => r.uri);

  const unmapped = {
    tools: toolNames.filter((name) => !union("tools", toolNames).has(name)),
    event_families: families.filter((f) => !union("events", families).has(f)),
    endpoint_entities: entities.filter((e) => !union("endpoints", entities).has(e)),
    ability_categories: categories.filter((c) => !union("abilities", categories).has(c)),
    error_codes: codes.filter((c) => !union("errors", codes).has(c)),
    resources: resourceUris.filter((r) => !union("resources", resourceUris).has(r)),
  };

  const unknown = [];
  for (const entry of entries) {
    for (const name of entry.tools ?? []) if (name !== "*" && !toolNames.includes(name)) unknown.push(`${entry.key}: tool ${name}`);
    for (const f of entry.events ?? []) if (f !== "*" && !families.includes(f)) unknown.push(`${entry.key}: event family ${f}`);
    for (const e of entry.endpoints ?? []) if (e !== "*" && !entities.includes(e)) unknown.push(`${entry.key}: endpoint entity ${e}`);
    for (const c of entry.abilities ?? []) if (c !== "*" && !categories.includes(c)) unknown.push(`${entry.key}: ability category ${c}`);
    for (const d of entry.documents ?? []) if (!catalogue.documents[d]) unknown.push(`${entry.key}: document ${d}`);
  }

  return { unmapped, unknown, abilityCategories: abilityCategories(catalogue) };
}

export { cell };

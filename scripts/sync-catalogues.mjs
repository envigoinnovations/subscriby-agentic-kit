#!/usr/bin/env node
/**
 * Pulls the catalogues Subscriby publishes, snapshots them under catalogue/,
 * derives the OpenAPI facts the references quote, and regenerates every
 * generated file of the plugin.
 *
 *   npm run sync                         pull from api.subscriby.net and www.subscriby.net
 *   npm run sync -- --from ../Subscriby/public   copy the local export instead (before a deploy)
 *   npm run sync -- --offline            regenerate from the committed snapshot only
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { API_HOST, CATALOGUE_FILES, DOCUMENTS, counts, loadCatalogue, readJson } from "./lib/catalogue.mjs";
import { generate } from "./lib/generate.mjs";
import { fieldLines } from "./lib/render.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const catalogueDir = join(root, "catalogue");
const args = process.argv.slice(2);
const fromIndex = args.indexOf("--from");
const from = fromIndex === -1 ? null : resolve(root, args[fromIndex + 1]);
const offline = args.includes("--offline");

async function fetchText(url) {
  const response = await fetch(url, { headers: { Accept: "application/json, text/markdown;q=0.9, */*;q=0.1" } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function resolveRef(openapi, schema, depth = 0) {
  if (!schema || typeof schema !== "object" || depth > 6) return schema;
  if (schema.$ref) {
    const name = schema.$ref.replace("#/components/schemas/", "");
    return resolveRef(openapi, openapi.components?.schemas?.[name], depth + 1);
  }
  if (schema.allOf) {
    const merged = { type: "object", properties: {}, required: [] };
    for (const part of schema.allOf) {
      const piece = resolveRef(openapi, part, depth + 1) ?? {};
      Object.assign(merged.properties, piece.properties ?? {});
      merged.required.push(...(piece.required ?? []));
      if (piece.description && !merged.description) merged.description = piece.description;
    }
    return merged;
  }
  return schema;
}

function derive(openapi) {
  const webhookExamples = {};
  for (const [name, entry] of Object.entries(openapi.webhooks ?? {})) {
    const post = entry.post ?? {};
    const content = post.requestBody?.content?.["application/json"] ?? {};
    const example = content.examples?.payload?.value ?? content.example ?? null;
    webhookExamples[name] = { summary: post.summary ?? "", description: post.description ?? "", example };
  }

  const endpointDetails = {};
  for (const [path, methods] of Object.entries(openapi.paths ?? {})) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op || typeof op !== "object" || !op.operationId) continue;
      const body = resolveRef(openapi, op.requestBody?.content?.["application/json"]?.schema);
      const parameters = (op.parameters ?? []).map((p) => {
        const parameter = p.$ref ? resolveRef(openapi, p) : p;
        const schema = resolveRef(openapi, parameter.schema) ?? {};
        return {
          name: parameter.name,
          in: parameter.in,
          required: Boolean(parameter.required),
          type: Array.isArray(schema.type) ? schema.type.join(" or ") : schema.type ?? "string",
          description: String(parameter.description ?? "").replace(/\s+/g, " ").trim(),
        };
      });
      endpointDetails[`${method.toUpperCase()} ${path}`] = {
        operationId: op.operationId,
        summary: op.summary ?? "",
        description: String(op.description ?? "").trim(),
        tags: op.tags ?? [],
        abilities: op["x-required-scopes"] ?? [],
        mcpTools: op["x-mcp-tools"] ?? [],
        parameters,
        request: body ? fieldLines(resolveProperties(openapi, body)) : [],
      };
    }
  }

  return { webhookExamples, endpointDetails };
}

function resolveProperties(openapi, schema) {
  if (!schema?.properties) return schema;
  const properties = {};
  for (const [name, property] of Object.entries(schema.properties)) {
    const resolved = resolveRef(openapi, property) ?? property;
    properties[name] = resolved?.properties ? resolveProperties(openapi, resolved) : resolved;
  }
  return { ...schema, properties };
}

async function pull() {
  mkdirSync(join(catalogueDir, "documents"), { recursive: true });
  mkdirSync(join(catalogueDir, "derived"), { recursive: true });

  let openapiText;
  for (const file of CATALOGUE_FILES) {
    if (from) {
      copyFileSync(join(from, file), join(catalogueDir, file));
    } else {
      write(join(catalogueDir, file), await fetchText(`${API_HOST}/${file}`));
    }
  }
  if (from) {
    openapiText = readFileSync(join(from, "openapi.json"), "utf8");
  } else {
    openapiText = await fetchText(`${API_HOST}/openapi.json`);
  }
  write(join(catalogueDir, "openapi.json"), openapiText);

  for (const [file, url] of Object.entries(DOCUMENTS)) {
    write(join(catalogueDir, "documents", file), await fetchText(url));
  }

  const { webhookExamples, endpointDetails } = derive(JSON.parse(openapiText));
  write(join(catalogueDir, "derived", "webhook-examples.json"), JSON.stringify(webhookExamples, null, 2) + "\n");
  write(join(catalogueDir, "derived", "endpoint-details.json"), JSON.stringify(endpointDetails, null, 2) + "\n");

  const tools = readJson(join(catalogueDir, "mcp-tools.json"));
  const stamp = {
    source: from ? `local export ${from}` : API_HOST,
    pulled_at: new Date().toISOString(),
    catalogue_version: tools.version,
    counts: counts(loadCatalogue(catalogueDir)),
  };
  write(join(catalogueDir, "stamp.json"), JSON.stringify(stamp, null, 2) + "\n");
  return stamp;
}

const stamp = offline ? loadCatalogue(catalogueDir).stamp : await pull();
const catalogue = loadCatalogue(catalogueDir);
const map = readJson(join(root, "scripts", "skill-map.json"));
const outputs = generate({ root, catalogue, map });

let written = 0;
for (const [relative, content] of outputs) {
  const path = join(root, relative);
  const current = existsSync(path) ? readFileSync(path, "utf8").replace(/\r\n/g, "\n") : null;
  if (current !== content) {
    write(path, content);
    written += 1;
  }
}

console.log(`sync: catalogue ${catalogue.version} from ${stamp?.source ?? "snapshot"}; ${outputs.size} generated files, ${written} written.`);
console.log(JSON.stringify(stamp?.counts ?? counts(catalogue)));

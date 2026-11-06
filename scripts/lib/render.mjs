/**
 * Markdown helpers the generator shares: tables, marker blocks, schema field
 * lists and the one-line summaries the tables lead with.
 */

export function cell(value) {
  return String(value ?? "")
    .replace(/\r?\n+/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

export function table(headers, rows) {
  const line = (cells) => `| ${cells.map(cell).join(" | ")} |`;
  return [line(headers), `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map(line)].join("\n");
}

/** Replaces the body between `<!-- generated:<name>:start -->` and its end marker, keeping the markers. */
export function replaceBlock(text, name, body) {
  const start = `<!-- generated:${name}:start -->`;
  const end = `<!-- generated:${name}:end -->`;
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`Missing generated block "${name}"`);
  }
  return `${text.slice(0, from + start.length)}\n\n${body.trim()}\n\n${text.slice(to)}`;
}

/** The first sentence of a description, for a table cell. */
export function summary(text) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  const match = /^(.+?[.!?])(\s|$)/.exec(clean);
  return match ? match[1] : clean;
}

export function titleCase(slug) {
  return slug
    .split("-")
    .map((word) => (word.length <= 3 && ["and", "the", "of", "for", "sdk", "api", "mcp", "n8n"].includes(word) ? word : word[0].toUpperCase() + word.slice(1)))
    .join(" ")
    .replace(/\bSdk\b/g, "SDK")
    .replace(/\bApi\b/g, "API")
    .replace(/\bMcp\b/g, "MCP")
    .replace(/^and /, "And ");
}

function typeOf(schema) {
  if (!schema || typeof schema !== "object") return "any";
  if (schema.enum) return `one of ${schema.enum.map((v) => `\`${v}\``).join(", ")}`;
  const type = Array.isArray(schema.type) ? schema.type.filter((t) => t !== "null").join(" or ") : schema.type;
  if (type === "array") return `array of ${typeOf(schema.items)}`;
  if (!type) {
    if (schema.oneOf || schema.anyOf) return (schema.oneOf || schema.anyOf).map(typeOf).join(" or ");
    if (schema.properties) return "object";
    return "any";
  }
  return type;
}

/**
 * One line per field of an object schema, nested objects one level deep.
 * A description is kept whole: the catalogue writes the rule in it.
 */
export function fieldLines(schema, indent = "") {
  if (!schema || typeof schema !== "object" || !schema.properties) return [];
  const required = new Set(schema.required ?? []);
  const lines = [];

  for (const [name, property] of Object.entries(schema.properties)) {
    const parts = [typeOf(property)];
    if (required.has(name)) parts.push("required");
    const description = String(property?.description ?? "").replace(/\s+/g, " ").trim();
    lines.push(`${indent}- \`${name}\` (${parts.join(", ")})${description ? `: ${description}` : ""}`);

    if (property?.type === "object" && property.properties && indent === "") {
      lines.push(...fieldLines(property, "  "));
    }
    if (property?.type === "array" && property.items?.type === "object" && property.items.properties && indent === "") {
      lines.push(...fieldLines(property.items, "  "));
    }
  }

  return lines;
}

export function fence(language, content) {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}

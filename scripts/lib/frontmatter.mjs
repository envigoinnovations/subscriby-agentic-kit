/**
 * A small YAML-subset reader for the front matter of skills, commands and
 * agents: one scalar per line, quoted or bare, inline lists in brackets,
 * block lists of `- item`, and one level of nested map (`metadata:`). The
 * linter keeps every file inside this subset, so nothing richer is needed.
 */

export function parseFrontmatter(text) {
  const normalised = text.replace(/\r\n/g, "\n");
  if (!normalised.startsWith("---\n")) {
    return { data: null, body: normalised, raw: "" };
  }

  const end = normalised.indexOf("\n---", 4);
  if (end === -1) {
    return { data: null, body: normalised, raw: "" };
  }

  const raw = normalised.slice(4, end);
  const body = normalised.slice(end + 4).replace(/^\n/, "");
  const data = {};
  const lines = raw.split("\n");

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    index += 1;
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      throw new Error(`Front matter line is not "key: value": ${line}`);
    }

    const [, key, rest] = match;

    if (rest === "") {
      if (lines[index] !== undefined && /^\s+-\s/.test(lines[index])) {
        const items = [];
        while (lines[index] !== undefined && /^\s+-\s/.test(lines[index])) {
          items.push(scalar(lines[index].replace(/^\s+-\s/, "")));
          index += 1;
        }
        data[key] = items;
        continue;
      }

      const nested = {};
      while (lines[index] !== undefined && /^\s+[A-Za-z0-9_-]+:/.test(lines[index])) {
        const inner = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[index]);
        nested[inner[1]] = scalar(inner[2]);
        index += 1;
      }
      data[key] = nested;
      continue;
    }

    data[key] = scalar(rest);
  }

  return { data, body, raw };
}

function scalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    return inner === "" ? [] : inner.split(",").map((item) => scalar(item));
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).replace(/\\(["\\])/g, "$1");
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return trimmed;
}

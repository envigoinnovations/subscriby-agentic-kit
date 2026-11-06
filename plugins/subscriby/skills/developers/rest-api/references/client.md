# Reference scripts: Rest api

Copy the file you need into the repository you are working in, keeping its name; each one is tested in the kit's own suite (`npm test` under `scripts/reference`) and rendered here by `npm run sync`, so `npm run check` fails on a hand edit.

## client.mjs

```js
#!/usr/bin/env node
/**
 * A small client for the Subscriby REST API with the contract baked in:
 * bearer auth from a token the caller supplies, a fresh Idempotency-Key on
 * every write that stays the same across that write's retries, a retry on
 * 429 after Retry-After, on 425 and on 5xx with capped backoff and jitter,
 * never on any other 4xx, the error envelope raised as a typed error, and
 * page-based iteration that follows meta.current_page to meta.last_page.
 *
 *   import { createSubscribyClient, SubscribyApiError } from "./client.mjs";
 *   const api = createSubscribyClient({ token: subscribyToken }); // from the application's secret store
 *   const { data: team } = await api.get("teams/current");
 *   for await (const project of api.paginate("projects")) console.log(project.name);
 *
 * Self-test against a local mock server: node client.mjs --self-test
 */
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export class SubscribyApiError extends Error {
  constructor(status, envelope) {
    const error = envelope && typeof envelope === "object" && envelope.error ? envelope.error : {};
    super(error.message ?? `Subscriby API answered HTTP ${status}`);
    this.name = "SubscribyApiError";
    this.status = status;
    this.code = error.code ?? "UNKNOWN";
    this.requestId = error.request_id ?? null;
    this.docsUrl = error.docs_url ?? null;
    this.remediation = error.remediation ?? null;
    this.fields = error.fields ?? null;
    this.context = error.context ?? null;
  }
}

const RETRYABLE_STATUSES = new Set([425, 429]);

export function createSubscribyClient({
  token,
  baseUrl = "https://api.subscriby.net/v1/",
  fetch: fetchImplementation = globalThis.fetch,
  maxAttempts = 4,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
} = {}) {
  if (typeof token !== "string" || !token.startsWith("sbt_")) {
    throw new Error("createSubscribyClient needs a personal access token (sbt_…), read from the environment, never from source.");
  }
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  async function request(method, path, { query, body, idempotencyKey } = {}) {
    const url = new URL(String(path).replace(/^\/+/, ""), base);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    if (method !== "GET") {
      headers["Idempotency-Key"] = idempotencyKey ?? randomUUID();
      if (body !== undefined) headers["Content-Type"] = "application/json";
    }
    const payload = body === undefined ? undefined : JSON.stringify(body);

    for (let attempt = 1; ; attempt += 1) {
      const response = await fetchImplementation(url, { method, headers, body: payload });
      if (response.ok) {
        return response.status === 204 ? null : await response.json();
      }
      const envelope = await response.json().catch(() => null);
      const retryable = RETRYABLE_STATUSES.has(response.status) || response.status >= 500;
      if (!retryable || attempt >= maxAttempts) {
        throw new SubscribyApiError(response.status, envelope);
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      const backoff = Math.min(8000, 250 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoff);
    }
  }

  async function* paginate(path, { query, perPage = 100 } = {}) {
    for (let page = 1; ; page += 1) {
      const result = await request("GET", path, { query: { ...(query ?? {}), per_page: perPage, page } });
      const rows = Array.isArray(result?.data) ? result.data : [];
      yield* rows;
      const meta = result?.meta;
      if (rows.length === 0 || !meta || meta.current_page >= meta.last_page) {
        return;
      }
    }
  }

  return {
    request,
    paginate,
    get: (path, query) => request("GET", path, { query }),
    post: (path, body, options = {}) => request("POST", path, { ...options, body }),
    patch: (path, body, options = {}) => request("PATCH", path, { ...options, body }),
    put: (path, body, options = {}) => request("PUT", path, { ...options, body }),
    delete: (path, options = {}) => request("DELETE", path, options),
  };
}

async function selfTest() {
  const { createServer } = await import("node:http");
  const seen = { current: 0, projectKeys: [], patches: 0 };
  const envelope = (code, extra = {}) => ({
    error: {
      code,
      message: `${code} from the mock`,
      docs_url: `https://docs.subscriby.net/api/v1/errors#${code.toLowerCase().replaceAll("_", "-")}`,
      remediation: "Read the code.",
      request_id: "00-selftest",
      ...extra,
    },
  });
  const server = createServer((incoming, outgoing) => {
    const url = new URL(incoming.url, "http://127.0.0.1");
    const send = (status, body, headers = {}) => {
      outgoing.writeHead(status, { "Content-Type": "application/json", ...headers });
      outgoing.end(JSON.stringify(body));
    };
    if (incoming.headers.authorization !== "Bearer sbt_test_1_selftest") return send(401, envelope("AUTHENTICATION_REQUIRED"));
    if (incoming.method === "GET" && url.pathname === "/v1/teams/current") {
      seen.current += 1;
      return seen.current === 1 ? send(429, envelope("RATE_LIMITED"), { "Retry-After": "1" }) : send(200, { data: { id: "team-1" } });
    }
    if (incoming.method === "GET" && url.pathname === "/v1/projects") {
      const page = Number(url.searchParams.get("page"));
      const pages = { 1: ["a", "b"], 2: ["c"] };
      return send(200, {
        data: (pages[page] ?? []).map((id) => ({ id, per_page: url.searchParams.get("per_page") })),
        links: {},
        meta: { current_page: page, last_page: 2 },
      });
    }
    if (incoming.method === "POST" && url.pathname === "/v1/projects") {
      seen.projectKeys.push(incoming.headers["idempotency-key"]);
      return seen.projectKeys.length === 1 ? send(503, envelope("INTERNAL_SERVER_ERROR")) : send(201, { data: { id: "project-1" } });
    }
    if (incoming.method === "PATCH" && url.pathname === "/v1/projects/project-1") {
      seen.patches += 1;
      return send(422, envelope("VALIDATION_FAILED", { fields: { name: ["The name field is required."] } }));
    }
    return send(404, envelope("RESOURCE_NOT_FOUND"));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const api = createSubscribyClient({
    token: "sbt_test_1_selftest",
    baseUrl: `http://127.0.0.1:${server.address().port}/v1`,
    sleep: async () => {},
  });
  const results = [];
  const check = (name, condition) => results.push(`${condition ? "ok  " : "FAIL"} ${name}`);
  try {
    const team = await api.get("teams/current");
    check("a 429 is retried after Retry-After and the second answer is returned", team.data.id === "team-1" && seen.current === 2);

    const rows = [];
    for await (const row of api.paginate("projects", { perPage: 2 })) rows.push(row);
    check(
      "paginate follows meta.current_page to meta.last_page and sends per_page",
      rows.map((row) => row.id).join(",") === "a,b,c" && rows.every((row) => row.per_page === "2"),
    );

    const created = await api.post("projects", { name: "Studio" });
    check(
      "a 503 is retried with the same Idempotency-Key",
      created.data.id === "project-1" && seen.projectKeys.length === 2 && seen.projectKeys[0] === seen.projectKeys[1] && /^[0-9a-f-]{36}$/.test(seen.projectKeys[0]),
    );

    const validation = await api.patch("projects/project-1", { name: "" }).then(() => null, (error) => error);
    check(
      "a 422 is raised once as SubscribyApiError with fields and never retried",
      validation instanceof SubscribyApiError && validation.code === "VALIDATION_FAILED" && validation.status === 422 && Array.isArray(validation.fields?.name) && seen.patches === 1,
    );

    const missing = await api.get("nope").then(() => null, (error) => error);
    check(
      "a 404 carries code, request id and docs url",
      missing instanceof SubscribyApiError && missing.code === "RESOURCE_NOT_FOUND" && missing.requestId === "00-selftest" && missing.docsUrl.endsWith("#resource-not-found"),
    );
  } finally {
    server.close();
  }
  console.log(results.join("\n"));
  process.exit(results.some((line) => line.startsWith("FAIL")) ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv.includes("--self-test")) {
  await selfTest();
}
```

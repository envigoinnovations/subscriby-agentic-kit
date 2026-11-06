---
name: documentation
description: "This skill should be used when the user asks how something works in Subscriby, where it is documented, or to look something up in the Subscriby docs or API reference, or when an answer needs a fact the kit does not carry. Where the docs and catalogues are and how to read them as Markdown."
license: MIT
compatibility: Needs a way to fetch a web page (Claude Code's WebFetch, which asks once per host, or curl in a shell).
metadata:
  category: foundation
  catalogue: 2026-05-01
---

# Reading the Subscriby documentation

Answer from the kit when a skill carries the fact; fetch the documentation when it does not, when the user asks for the source, or when the answer depends on a figure that changes with releases (prices, limits, the connectors on the roadmap). The documentation is the product's truth and is written to be read by agents: every page has a Markdown twin and the site publishes a machine-readable index.

## Where things are

| Need | Address |
| --- | --- |
| The index of every page with a one-line summary | `https://docs.subscriby.net/llms.txt` |
| Every page's full text in one file (large) | `https://docs.subscriby.net/llms-full.txt` |
| One page as Markdown | the page's address with `.mdx` appended, or the page itself fetched with `Accept: text/markdown` |
| The REST API, endpoint by endpoint, with code samples | `https://docs.subscriby.net/api/v1/reference` |
| Every MCP tool with its ability, arguments and examples | `https://docs.subscriby.net/mcp/v1/tools-reference` |
| Every webhook event with its payload | `https://docs.subscriby.net/webhooks/v1/events` |
| The connector SDK | `https://docs.subscriby.net/sdk/v1` |
| The machine-readable catalogues | `https://api.subscriby.net/mcp-tools.json`, `abilities.json`, `webhook-events.json`, `api-endpoints.json`, `error-codes.json`, `team-permissions.json` |
| The OpenAPI 3.1 document | `https://api.subscriby.net/openapi.json` |
| The briefing for agents and the credential walkthrough | `https://www.subscriby.net/AGENTS.md`, `https://www.subscriby.net/auth.md` |
| The marketing site as Markdown | any page with `.md` appended; the sitemap at `https://www.subscriby.net/sitemap.md` |
| Discovery documents | `https://www.subscriby.net/.well-known/api-catalog`, `.well-known/mcp/server-card.json`, `.well-known/agent-skills/index.json`, `.well-known/ai-catalog.json` |

## How to look something up

1. Fetch `https://docs.subscriby.net/llms.txt` and find the pages whose title or summary matches the question; it is grouped by section (account, addons, api, connectors, copilot, creators, disaster-recovery, integrations, mcp, payments, reference, sdk, subscribers, teams, webhooks).
2. Fetch at most three pages. Prefer the Markdown twin (`<address>.mdx`), which carries the page's source: the components the site renders become plain Markdown, and nothing of the layout comes with it. In a shell, `curl -sS -H "Accept: text/markdown" <address>.mdx` does the same.
3. Answer with the fact and a link to the page it came from. Quote prices, limits and counts exactly as the page states them; they are generated from the running application.
4. When a page and the kit disagree, the page wins, and the disagreement is worth reporting to Subscriby (an issue on the kit's repository or `support@subscriby.net`).

## What to read for which question

- "How do I…" as a creator: the `creators/` section (projects, plans, passes, codes, coupons, members, broadcasts, the inbox, Knowledge, Revenue Recovery, analytics, exports), `addons/` for what an addon unlocks, `payments/` for each gateway.
- "What happens to a member when…": `subscribers/` describes the member's side of every flow, `disaster-recovery/what-members-see` the outage side.
- A tool's exact behaviour: the tool's page under `mcp/v1/tools/<group>/<tool>` (linked from the tools reference), which carries the arguments, the refusals, the events it fires and the REST twin.
- An endpoint's exact shape: its page under `api/v1/reference/<family>/<operation>`, with the request fields, the response fields, every refusal and the playground.
- An event's payload: `webhooks/v1/events/<family>/<event>`.
- Building a connector: `sdk/v1` and its building, manifest, ports, core-api, conformance and tutorial pages.

## Do not

- Do not scrape an HTML page when the Markdown twin exists.
- Do not fetch `llms-full.txt` for one question; it is several megabytes.
- Do not answer a pricing, limit or availability question from memory when a page states it; releases change those figures.
- Do not fetch the dashboard, the portal or any signed-in page: they are for people.

## References

- Documentation: [Agent readiness](https://docs.subscriby.net/api/v1/agent-readiness) (the map of every document an agent can read), the [glossary](https://docs.subscriby.net/reference/glossary), the [OpenAPI document](https://docs.subscriby.net/api/v1/openapi).

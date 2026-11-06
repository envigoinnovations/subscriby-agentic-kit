---
type: llm
---

PASS if the reply points the agent at https://docs.subscriby.net/llms.txt (or llms-full.txt) as the index, says that documentation pages have Markdown twins (a .md suffix or an Accept: text/markdown request), and names at least one catalogue on api.subscriby.net such as openapi.json, abilities.json or webhook-events.json.
FAIL if it tells the agent to scrape HTML pages, invents URLs on other hosts, or does not mention a machine-readable form at all.

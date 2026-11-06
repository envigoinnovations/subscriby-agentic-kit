---
description: Look a question up in the Subscriby documentation and answer from the page's own Markdown, with links.
argument-hint: "<question or topic>"
allowed-tools: WebFetch(domain:docs.subscriby.net), WebFetch(domain:api.subscriby.net), WebFetch(domain:www.subscriby.net)
disable-model-invocation: true
---

Answer the question `$ARGUMENTS` from the Subscriby documentation, the way the `documentation` skill describes.

1. Fetch `https://docs.subscriby.net/llms.txt` and pick the pages whose title or summary matches the question; at most three.
2. Fetch each page's Markdown twin (the address with `.mdx` appended) and read it. If a twin does not answer, fetch the page itself; WebFetch converts it to Markdown.
3. Answer in a few sentences with the facts the pages state, exactly as they state prices, limits and counts, then list the pages used as links.
4. If no page covers the question, say so, name the closest pages, and suggest `support@subscriby.net`.

If `$ARGUMENTS` is empty, ask what to look up and show the documentation's sections (account, addons, api, connectors, copilot, creators, disaster-recovery, integrations, mcp, payments, reference, sdk, subscribers, teams, webhooks).

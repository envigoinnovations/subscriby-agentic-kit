---
type: llm
---

PASS if the reply gives a Cursor mcp.json entry whose URL is exactly https://mcp.subscriby.net (no path and no trailing slash), tells the user to restart or open Cursor's MCP settings and sign in when the entry asks, and offers a personal access token in an Authorization header as the alternative.
FAIL if it gives another URL, a stdio command for the hosted server, or no sign-in step.

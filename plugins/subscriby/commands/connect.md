---
description: Sign Claude in to Subscriby through the bundled MCP server, or walk the personal-access-token route, then prove the connection with the account's details.
argument-hint: "[oauth|token]"
disable-model-invocation: true
---

Connect this session to the user's Subscriby account and prove it. The `authentication` skill carries the detail; follow these steps.

1. Look for the Subscriby tools in the session (they are named `mcp__plugin_subscriby_subscriby__<tool>`). If `get_me` is present, skip to step 3.
2. If the tools are absent and the argument is empty or `oauth`: tell the user to run `/mcp`, pick `subscriby` and choose **Authenticate**; the browser opens Subscriby, they sign in and press **Authorize**; then ask them to run this command again. If the argument is `token`: explain how to mint a personal access token under **Settings → API Tokens** with the least abilities for the job, show the exact `claude mcp add --transport http subscriby-token https://mcp.subscriby.net --header "Authorization: Bearer <token>"` line with the placeholder, say that the bundled `subscriby` server should be disabled from `/mcp` while the token server is in use, and stop; never ask for the token in the conversation.
3. Call `get_me`. Report, in a short card: the creator's name and email, the platform plan and its capabilities in a line, `current_team` with its name, the other teams, the accounts linked on the connectors, and where alerts go.
4. Call `list_projects` with `limit` 10. List the projects by name with their ids. If there are more than ten, say so.
5. Close with one line on what the connection can do (the user's own reach on `current_team`; every destructive tool asks first) and the two next moves: `/subscriby:status` for the state of the account and `/subscriby:launch` for a new project.

Never print a token, a secret or a credential of any kind. If `get_me` refuses with `AUTHENTICATION_REQUIRED`, the sign-in lapsed: send the user back to `/mcp`.

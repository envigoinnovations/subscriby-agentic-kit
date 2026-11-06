---
description: One card on the account's state, read-only. Account, team and plan, open alerts and notifications, the health of every installation, the inbox, Copilot Credits and recent activity.
disable-model-invocation: true
---

Read the state of the user's Subscriby account and present it as one card. Everything here is a read; never call a tool that changes anything, and run independent reads in parallel.

1. `get_me`: the creator, the plan and its capabilities, `current_team`, the alert destinations.
2. `list_projects` (`limit` 10): the projects. For each of the first five projects, in parallel: `list_connector_installations` for the installations and their health, `get_recovery_readiness` for the readiness checklist, and `list_support_conversations` filtered to open conversations with a small limit for the inbox count.
3. `list_notifications` for unread notices (the first page is enough) and `get_copilot_credits` for the balance, the month's free allowance used and left, and the auto top-up setting.
4. `get_activity_log` with a small limit for the last actions on the account.

Present the card in this order, with short lines and no table wider than four columns:

- **Account**: name, plan, team, where alerts go.
- **Projects**: one line per project with the number of installations, their health in a word, the readiness verdict and the open inbox count; flag any installation that is not healthy and any readiness item that is missing, naming the tool or the dashboard step that fixes it.
- **Notifications**: the unread count and the three most recent, one line each.
- **Copilot Credits**: balance, allowance used of the month, auto top-up on or off.
- **Recent activity**: the last five actions, one line each, with who or what did them.

If the account has more than five projects, say which were left out and offer to read them. If a tool refuses with `TOKEN_MISSING_ABILITY`, leave that line out of the card and say which ability the connection lacks. Do not quote figures the tools did not answer.

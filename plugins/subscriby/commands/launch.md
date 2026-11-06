---
description: "A guided launch from an empty project to a live one, following the launch-project skill step by step and confirming every write before it runs."
disable-model-invocation: true
---

Walk the user from nothing to a live Subscriby project, the way the `launch-project` skill describes. Ask for what each step needs, run one write at a time, and confirm each before it runs; stop and say so whenever a step is the user's to do on the dashboard.

1. `get_me` for the account and the team; say which creator plan it is on and what that allows (projects, a second connector, teams).
2. **Project.** Ask for the name, an optional handle, the welcome description and whether the project belongs to a team. Show the `create_project` call, confirm, run it, and keep its `project_id` for every later step.
3. **Connector.** `list_connectors`; offer the `available` and `beta` lanes. Confirm `install_connector`. Then tell the user the connecting step is theirs on the project's Connectors page (paste the bot token, or add the app on the platform's page) and wait until they say it is done; `verify_connector_installation` proves it.
4. **Places and perks.** For each place to sell: `list_connector_spaces` with the kind the connector gates, then `create_resource_from_space`, or `request_resource_link` when the place is not listed, telling the user the bot is waiting for them to pick it. For each hand-delivered perk, `create_resource`. Confirm each.
5. **Payment method.** `list_payment_methods`. If none exists, say that connecting a gateway (or switching Access Codes on) is a dashboard step and wait; then `activate_payment_method` on the method the user wants live. Note test against live.
6. **Plans.** Compose each plan with the user: kind, name, price and currency, the resources, the cycle and trial for a subscription, the schedule for a pass, the slate for a series. Show the `create_plan` call, confirm, run it; then `publish_plan` with `active` true, confirmed separately.
7. **Portal and links.** `get_portal_design`; offer `publish_portal_design` if a draft is waiting. Answer `get_portal_url` and `get_deep_link` so the user has something to share.
8. **Checklist.** Run the go-live checklist read-only (the `launch-auditor` agent, or the reads yourself) and report every gap with its fix.

Rules: never ask for a token or a gateway key; never delete anything; never chain two writes on one confirmation; if a tool refuses, read the error, explain it, and ask before trying anything else.

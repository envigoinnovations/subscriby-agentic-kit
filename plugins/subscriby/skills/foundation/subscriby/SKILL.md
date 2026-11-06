---
name: subscriby
description: "This skill should be used when the user mentions Subscriby, asks what it is or how it works, or asks for anything about a paid community, its members, plans, payments, connectors or integrations and no more specific Subscriby skill matches. The concept model, the ground rules and the routing table."
license: MIT
metadata:
  category: foundation
  catalogue: 2026-05-01
---

# Subscriby

Subscriby runs paid memberships for creators' communities on connected platforms. A creator connects a community platform, publishes plans, and Subscriby runs the subscriber lifecycle: payment through the creator's own gateway, admission to the places a plan grants, renewals, reminders and removal when access ends. Everything the dashboard does is also an MCP tool, a REST operation and, where something changes, a webhook event; this plugin bundles the MCP server, so the tools are at hand once the user has signed in.

Read this skill first. Jump to a task skill once the slice of work is clear; the routing table at the end names them.

## Where the tools come from

The plugin declares the hosted server `https://mcp.subscriby.net` under the name `subscriby`, so in Claude Code its tools read `mcp__plugin_subscriby_subscriby__<tool>`; this kit names them by the short name, such as `list_projects`. If no such tool exists in the session, the server is not authenticated yet: send the user to `/mcp`, where **Authenticate** next to `subscriby` opens a browser sign-in and a consent screen. The `authentication` skill walks that and the token route. On an agent other than Claude Code, the `mcp-clients` skill says how to add the server.

The server also publishes six resources, catalogues worth reading once per session before reasoning about statuses, abilities, error codes, payment providers, webhook events or connectors: `subscriby://enums/subscription-status`, `subscriby://enums/ability`, `subscriby://enums/error-code`, `subscriby://enums/payment-provider`, `subscriby://enums/webhook-event` and `subscriby://connectors/catalog` ([references/resources.md](references/resources.md)).

## The concept model

- **Creator and team.** A creator is the account that runs the business. Every project belongs to a team; a creator has a personal team and may belong to others, and every credential acts on exactly one team at a time, the one `get_me` answers as `current_team`. Out-of-team rows do not exist as far as the tools are concerned: they answer `RESOURCE_NOT_FOUND`, never a permission error. Teams, roles and groups are the `teams-and-roles` skill.
- **Project.** The container for one membership business: its plans, resources, payment methods, members, subscriptions, support inbox, broadcasts and analytics. A creator can run several. Almost every tool takes a `project_id`, so name the project once at the start of a task and keep to it.
- **Connector and installation.** A connector is the adapter for one platform (Telegram and Discord today, more on the roadmap); an installation is a connector set up on one project, usually a bot the creator created on the platform and connected. The project bot is what members talk to; the platform bot is what creators run their business from. Connecting a connector is done in person on the dashboard; the `connectors` skill reads, verifies, configures, diagnoses and uninstalls installations.
- **Resource.** Something a plan unlocks: a place the connector gates (a channel, a group, a server) or a manual perk tracked by hand. A place is linked from the connector's spaces; a resource is never created out of thin air for a platform the project has no installation on.
- **Plan.** A pricing tier with a `kind`: `subscription` (recurring or one-time access), `pass` (a dated window of access) or `pass_series` (a season of dated passes with seats and a presale). A plan names the resources it grants, its price and currency, its billing cycle, its trial rules and its eligibility filters, and sells only once it is published. The `plans-and-passes` skill owns it.
- **Member and subscription.** A member is anyone on the project's members list, from a lead who only opened the bot to a paying customer, a churned one or a banned one; a subscription is one purchase of one plan, moving through the statuses the `subscription-status` resource lists (active, past due, unpaid, paused, cancelled, expired and the trial states among them). A member's access to a place is a grant; a grant waits when the member has not connected the platform the place sits on. The `members` and `subscriptions-and-payments` skills own these.
- **Money.** Two separate ledgers. Members pay the creator through the creator's own payment methods (Stripe, PayPal, Polar, Mollie, Kelviq, Skrill, CoinPayments, Paystack, Razorpay, CeyPay, a connector's native payment, or an access code that grants access without a payment); connecting a gateway is dashboard-only. The creator pays Subscriby for their own plan (Free, Starter or Growth, with one-feature addons) and the per-transaction fee; that billing is dashboard-only too, and `account-and-billing` reads its ledgers.
- **Discounting and codes.** A coupon is one code many members redeem for money off; an access code is one code per person that grants a plan outright. They are different tools and the `coupons-and-access-codes` skill keeps them apart.
- **The rest of the business.** Broadcasts to a segment of members, the support inbox, Knowledge for Subscriby Copilot, Revenue Recovery (grace windows, cancellation offers, win-back sequences), the Referral Program, Smart Links, the portal's design, analytics and the Disaster Recovery Program each have a skill.

## Ground rules

1. **Know who you are first.** Call `get_me` once at the start of a session: it answers the creator, the plan and its capabilities, `current_team`, the linked accounts and where alerts go. Then `list_projects` to find the project the user means.
2. **Reads fan out; writes wait.** Every `list_*` and `get_*` tool is side-effect free and can run in parallel. Every tool the catalogue flags destructive (an update, a cancellation, a deletion, a revocation, a secret rotation, a send to real people) is confirmed with the user before it runs: state the tool, the target and what changes, then wait for a yes. The request that names the intent ("cancel it", "delete that plan", "ban him") is not the confirmation: the confirmation is the yes the user gives after seeing the exact record and what will change, so the destructive tool is never called in the same turn as the lookup. This plugin's hook makes Claude Code prompt on those tools whatever the permission setting; the rule still applies in every other client. An additive tool (a create, an invitation, a reminder, a retry, a test delivery) runs once the user has asked for it.
3. **Read the flag, never a list.** Which tools are destructive is read from the tool's own annotation; a list written here would go stale as tools are added.
4. **Never fabricate a tool, a field or a status.** The tools a session has are the catalogue; the references in each skill carry every argument. A status, an ability, an error code or an event name comes from a resource or a reference, not from memory.
5. **Async means poll.** A tool that answers a `job_id` (`bulk_generate_access_codes`, `request_account_export`, a channel revert) has not finished at call return: poll `get_job_status` until it is `completed` or `failed`, every second for ten seconds, then every five.
6. **Cap every loop.** "Find every member who…" is paged; ask for the first fifty, say that more exist, and go on only when the user wants the rest.
7. **A message reaches a real person.** A support reply or a broadcast lands on a member's phone; confirm the exact wording and, for a broadcast, the audience count from `preview_broadcast_audience` first.
8. **Members' data belongs to the community.** Read what the task needs and nothing more; never forward member data outside the conversation; never paste it into another service.
9. **Secrets stay secret.** A personal access token, a webhook signing secret, a gateway credential: never print one, never store one in a file the user did not ask for. A token leak is handled by revoking it under Settings → API Tokens.
10. **Say what you did.** Every tool call is recorded in the creator's activity log; name the calls behind an answer so the record and the conversation agree.

## Working pattern

- Start: `get_me` → `list_projects` → name the project.
- Answer questions by combining reads: `list_plans` → `list_subscriptions` → tally, with the limits above. The `analytics` skill holds the figure tools and the recipes.
- Change things in one confirmed step at a time: never chain several destructive calls on one yes.
- When a tool refuses with `TOKEN_MISSING_ABILITY`, the credential lacks the ability named in the error; with a personal access token, ask the user to mint one that carries it, never retry. With an OAuth connection the role itself lacks the permission.
- When something is unknown, read the documentation rather than guessing: the `documentation` skill.

## Routing

| The task is about | Skill |
| --- | --- |
| Signing in, tokens, abilities, what the connection may do | `authentication` |
| Reading the documentation, the catalogues, the discovery documents | `documentation` |
| A new project from nothing to live | `launch-project` |
| Connectors, installations, bot health, places | `connectors` |
| Plans, pricing, trials, pass windows, pass series | `plans-and-passes` |
| Members, identities, bans, waiting places, creator tasks, grants | `members` |
| Subscriptions, cancellations, pauses, payments, payment methods | `subscriptions-and-payments` |
| Coupons, access codes | `coupons-and-access-codes` |
| Broadcasts to members | `broadcasts` |
| The support inbox and saved replies | `support-inbox` |
| What the project teaches Subscriby Copilot | `knowledge` |
| Grace windows, cancellation offers, win-back sequences, checkouts | `revenue-recovery` |
| Affiliates, referrals, rewards, payouts | `referral-program` |
| Tracked links and their funnels | `smart-links` |
| The portal page's look, the portal address, bot links | `portal-design` |
| Figures, trends, reports, the activity log | `analytics` |
| Outages, standbys, failover, replacements, undo | `disaster-recovery` |
| Teams, invitations, roles, groups, permissions | `teams-and-roles` |
| The account, notifications, exports, the Partner Program, fees, Copilot Credits, tokens | `account-and-billing` |
| Calling the REST API from code | `rest-api`, `tokens-and-abilities`, `errors-and-retries` |
| Receiving webhooks, choosing events | `webhooks`, `webhook-events` |
| Zapier, n8n, Make, LangChain, Postman, code generation | `zapier`, `n8n`, `openapi-toolkits` |
| An agent of your own, or another MCP client | `custom-agents`, `mcp-clients` |
| Building a connector on the SDK | `connector-sdk` and its five companions |

Slash commands for the daily chores: `/subscriby:connect`, `/subscriby:status`, `/subscriby:doctor`, `/subscriby:launch`, `/subscriby:weekly`, `/subscriby:docs`, `/subscriby:verify-webhook`, `/subscriby:mint-token`. Read-only subagents: `community-analyst`, `integration-reviewer`, `launch-auditor`.

## Do not

- Do not call the dashboard, the portal or the sign-in pages: they are for people, and the tools cover every operation an agent may run.
- Do not create a resource for a platform the project has no installation on, and do not try to connect a gateway or a bot through a tool: both are dashboard steps.
- Do not retry a refused destructive call, a refused code or a 4xx that is not a 429.
- Do not quote figures from memory; every number comes from a tool answer the user can see.
- Do not use the retired name of the product; it is Subscriby everywhere.

## References

- [references/AGENTS.md](references/AGENTS.md): the briefing Subscriby publishes for agents, verbatim.
- [references/resources.md](references/resources.md): the six MCP resources.
- [references/tools.md](references/tools.md): `get_me` and `get_job_status` in full.
- Documentation: [What is Subscriby?](https://docs.subscriby.net/introduction), [How Subscriby works](https://docs.subscriby.net/how-it-works), the [glossary](https://docs.subscriby.net/reference/glossary), the [MCP guide](https://docs.subscriby.net/mcp/v1).

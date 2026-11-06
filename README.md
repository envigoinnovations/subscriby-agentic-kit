# Subscriby Agentic Kit

Teach Claude to run your paid community, integrate Subscriby into whatever you are building, or build a connector on the SDK. The kit is a Claude Code plugin: skills for creators, developers and connector authors, slash commands for the daily chores, read-only subagents for analysis and review, a guard that makes every destructive tool ask first, and the hosted Subscriby MCP server bundled.

[Subscriby](https://www.subscriby.net) runs paid memberships for creators' communities on connected platforms: a creator connects a community platform, publishes plans, and Subscriby runs the subscriber lifecycle through the creator's own payment gateway. Everything the dashboard does is also an MCP tool, a REST operation and, where something changes, a webhook event.

## Install in Claude Code

```
/plugin marketplace add envigoinnovations/subscriby-agentic-kit
/plugin install subscriby@envigo
```

Then run `/mcp` and authenticate the `subscriby` server: Claude Code opens your browser, you sign in to Subscriby and press **Authorize**. The connection acts as you, on the team you were working in, with your own permissions and nothing more. `/subscriby:connect` walks the sign-in and proves it with your account details.

Prefer a narrower grant? Mint a personal access token under **Settings → API Tokens** with only the abilities you want and add it as a second server; the `authentication` skill explains both routes.

## What is inside

<!-- generated:counts:start -->

| Component | Count |
| --- | --- |
| Skills | 20 |
| Slash commands | 6 |
| Subagents | 2 |
| MCP tools the guard watches | 84 |
| MCP tools, resources, events, endpoints behind them | 238 tools, 6 resources, 191 events, 257 endpoints (catalogue 2026-05-01) |

<!-- generated:counts:end -->

### Skills

<!-- generated:skills:start -->

#### Foundation (3)

| Skill | When Claude reaches for it |
| --- | --- |
| `authentication` | This skill should be used when the user asks to connect Claude to Subscriby, sign in, authenticate the server, use or mint a personal access token, pick abilities, fix TOKEN_MISSING_ABILITY, or asks what the connection can and cannot do. |
| `documentation` | This skill should be used when the user asks how something works in Subscriby, where it is documented, or to look something up in the Subscriby docs or API reference, or when an answer needs a fact the kit does not carry. Where the docs and catalogues are and how to read them as Markdown. |
| `subscriby` | This skill should be used when the user mentions Subscriby, asks what it is or how it works, or asks for anything about a paid community, its members, plans, payments, connectors or integrations and no more specific Subscriby skill matches. The concept model, the ground rules and the routing table. |

#### Creators (17)

| Skill | When Claude reaches for it |
| --- | --- |
| `account-and-billing` | This skill should be used when the user asks about their own Subscriby account, notifications and where alerts go, exporting their data, the Partner Program and its commissions or payouts, transaction fees and invoices, Copilot Credits and packs, their creator plan or addons, or their API tokens. |
| `analytics` | This skill should be used when the user asks for figures, trends, revenue, MRR, churn, trial conversion, earnings by period, plan performance, where revenue comes from, subscriber counts, a report, the transaction ledger, or the activity log of a member, a subscription or a project. |
| `broadcasts` | This skill should be used when the user asks to send a message, announcement or reminder to members, a segment, a plan's members, pass holders or people whose access is expiring, to preview who a broadcast reaches, to read a broadcast's history or who it missed, or to retry or resend one. |
| `connectors` | This skill should be used when the user asks about a project's connectors, installations or bots and their health, the Connectors Marketplace, installing, verifying, configuring, diagnosing, disconnecting or uninstalling a connector, the places a connector gates, or Telegram and Discord specifics. |
| `coupons-and-access-codes` | This skill should be used when the user asks to create or manage a coupon or discount code, run a sale, generate access codes for a giveaway, an offline sale, a gift, team access or a migration, revoke a code, check a code that does not work, or asks what the code quota and overage cost are. |
| `disaster-recovery` | This skill should be used when the user asks about a banned bot, place or account, an outage or degraded installation, recovery incidents and operations, standbys, the live mirror, automatic failover, readiness, the roll call, undo, allowances or outage compensation. |
| `knowledge` | This skill should be used when the user asks to teach Subscriby Copilot something about a project, add a question and answer or a guide to Knowledge, decide whether members or only the team may be answered from it, check what the Copilot knows, or read, change or remove a Knowledge entry. |
| `launch-project` | This skill should be used when the user asks to create a new Subscriby project, launch or set up a paid community from nothing, go live, run the go-live checklist, or asks what a project needs before it can sell. From an empty project to a live one, in order, with the writes confirmed one at a time. |
| `members` | This skill should be used when the user asks about a project's members or subscribers, who lapsed or churned, a member's connected accounts, members waiting on a connection, banning, unbanning or kicking someone, the perks still to hand over, or a member's access grants and invite links. |
| `plans-and-passes` | This skill should be used when the user asks to create, price, edit, publish, reorder or delete a plan, set a billing cycle or trial, restrict who can buy, sell a time-limited pass or a pass series, schedule or cancel access windows, remind pass holders, or start a next season. |
| `portal-design` | This skill should be used when the user asks to change how a project's portal page looks or reads, its colours, fonts, layout, wording, blocks, announcement, gallery, footer, pixels, CSS or languages, to publish or discard a portal draft, or for the portal address or a bot deep link. |
| `referral-program` | This skill should be used when the user asks about a project's Referral Program, affiliates, referral codes or links, free membership days or cash commissions for members who bring friends, approving or suspending an affiliate, the reward ledger, or recording a payout to an affiliate. |
| `revenue-recovery` | This skill should be used when the user asks about failed renewals, the grace window, dunning, why members leave, cancellation reasons or offers, win-back or nurture sequences, leads who never bought, stalled checkouts, trials about to end, or the Revenue Recovery figures and settings. |
| `smart-links` | This skill should be used when the user asks to track where members come from, create a tracked link for a bio, a video, a newsletter or a QR code, read a link's clicks, leads, checkouts, paid members and revenue, compare channels, embed plans on a website, or rename, expire or archive a link. |
| `subscriptions-and-payments` | This skill should be used when the user asks about subscriptions and their statuses, cancelling, pausing or reactivating one, a member's payments, transactions, refunds or failed charges, payment methods and gateways, test against live mode, or the currency a member pays in. |
| `support-inbox` | This skill should be used when the user asks about member messages, the support inbox or a conversation, to triage, reply, resolve, reopen, assign or block, to manage saved replies, or to change the inbox settings, including whether Subscriby Copilot may answer members in the inbox or on the portal. |
| `teams-and-roles` | This skill should be used when the user asks about teams, inviting or removing a collaborator, changing someone's role, creating or editing roles and groups, which permissions a teammate holds, or why a team action is refused on their plan. |

<!-- generated:skills:end -->

### Slash commands

| Command | What it does |
| --- | --- |
| `/subscriby:connect [oauth\|token]` | Signs Claude in, or walks the token route, then proves the connection with your account details. |
| `/subscriby:status` | One card: account, team and plan, open alerts, degraded installations, Copilot Credits, recent activity. |
| `/subscriby:doctor [project]` | Installations and their health, the connector doctor, recovery readiness; gaps with the tool that fixes each. |
| `/subscriby:launch` | A guided launch from an empty project to live, confirming every write. |
| `/subscriby:weekly [project]` | The week in figures against the week before. |
| `/subscriby:docs <query>` | Finds the page in the documentation and answers from its Markdown twin. |
| `/subscriby:verify-webhook [language]` | Writes a webhook signature verifier and its test into your repository. |
| `/subscriby:mint-token [purpose]` | Proposes the least set of abilities for a purpose and the steps to mint the token. |

### Subagents

- `subscriby:community-analyst`: figures and trends through the analytics and list tools, never a write.
- `subscriby:integration-reviewer`: audits a webhook handler or API client in your repository against the contract.
- `subscriby:launch-auditor`: the go-live checklist against a project's live state; reports, never fixes.

### Safety

Every Subscriby tool that changes or removes existing data asks for your confirmation before it runs, even when you have auto-approved the server: a hook generated from the tool catalogue forces the prompt. Reads and additive tools run freely. Every call runs within the permissions of the account you signed in with and is recorded in your activity log.

## Other agents

The skills use the standard `SKILL.md` format, so any agent of the open skills ecosystem can install them:

```
npx skills add envigoinnovations/subscriby-agentic-kit
```

Add `--skill <name>` for a single skill. That path installs the skills alone; connect the MCP server in your agent as the `mcp-clients` skill describes. In claude.ai and Cowork, an organisation can sync the marketplace from **Organization settings → Plugins & skills**.

## Local development

```
claude --plugin-dir plugins/subscriby
npm run gate
```

`npm run sync` refreshes every generated file from the catalogues Subscriby publishes; `npm run check` fails when a generated file is stale or a catalogue item has no skill; `npm run lint` holds the writing rules; `npm run validate` runs `claude plugin validate --strict` on the marketplace and the plugin.

## Versions

The kit has its own version line (see [`CHANGELOG.md`](./CHANGELOG.md)); `catalogue/stamp.json` names the Subscriby catalogue each release was generated from. Updates reach you with `/plugin marketplace update envigo`, or automatically once you enable auto-update for the marketplace in `/plugin`.

## Security

See [`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE).

## Support

[support@subscriby.net](mailto:support@subscriby.net), or an issue on this repository.

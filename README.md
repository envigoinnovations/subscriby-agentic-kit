# Subscriby Agentic Kit

Teach Claude to run your paid community, integrate Subscriby into whatever you are building, or build a connector on the SDK. The kit is a Claude Code plugin: skills for creators, developers and connector authors, slash commands for the daily chores, read-only subagents for analysis and review, a guard that makes every destructive tool ask first, and the hosted Subscriby MCP server bundled.

[Subscriby](https://www.subscriby.net) runs paid memberships for creators' communities on connected platforms: a creator connects a community platform, publishes plans, and Subscriby runs the subscriber lifecycle through the creator's own payment gateway. Everything the dashboard does is also an MCP tool, a REST operation and, where something changes, a webhook event.

## Install in Claude Code

```
/plugin marketplace add envigoinnovations/subscriby-agentic-kit
/plugin install subscriby@envigo
```

Then run `/mcp` and authenticate the `subscriby` server: Claude Code opens your browser, you sign in to Subscriby and press **Authorize**. The connection acts as you, on the team you were working in, with your own permissions and nothing more. `/subscriby:connect` walks the sign-in and proves it with your account details.

Prefer a narrower grant? Mint a personal access token under **Settings → API Tokens** with only the abilities you want and add it as a second server; the `connect` skill explains both routes.

## What is inside

<!-- generated:counts:start -->

| Component | Count |
| --- | --- |
| Skills | 0 |
| Slash commands | 0 |
| Subagents | 0 |
| MCP tools the guard watches | 84 |
| MCP tools, resources, events, endpoints behind them | 238 tools, 6 resources, 191 events, 257 endpoints (catalogue 2026-05-01) |

<!-- generated:counts:end -->

### Skills

<!-- generated:skills:start -->

The skills by category appear here after the first `npm run sync`.

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

# Changelog

All notable changes to the Subscriby Agentic Kit are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the kit adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html): a removed or renamed skill, command or agent is a major, a new one or a widened one a minor, a wording or reference refresh a patch. The catalogue stamp in `catalogue/stamp.json` records which Subscriby catalogue every release was generated from.

## [Unreleased]

### Changed

- The hub's confirmation rule and the subscriptions skill say that a request naming the intent ("cancel it") is not the confirmation: the destructive tool is called only after the user has seen the exact record and what will change and said yes, never in the same turn as the lookup. A second eval run had Claude attempt `cancel_subscription` on a direct instruction before explaining; the hook stopped the call, and the wording now keeps the attempt from happening.

## [1.0.0] - 2026-11-06

The first release, generated from the Subscriby catalogue of 2026-05-01 (`catalogue/stamp.json`). About 4,300 tokens of skill descriptions join every session; a skill's body is loaded only when it fires.

### Added

- The `envigo` marketplace and the `subscriby` plugin, with the hosted MCP server bundled over OAuth 2.1 and the directory listing fields.
- Foundation skills: `subscriby` (the hub: the concept model, the ten ground rules, the routing table), `authentication` (the three roads to a credential and what each refusal means), `documentation` (where the docs, the Markdown twins, the catalogues and the discovery documents are).
- Seventeen creator skills, one per part of running a community: `launch-project`, `connectors`, `plans-and-passes`, `members`, `subscriptions-and-payments`, `coupons-and-access-codes`, `broadcasts`, `support-inbox`, `knowledge`, `revenue-recovery`, `referral-program`, `smart-links`, `portal-design`, `analytics`, `disaster-recovery`, `teams-and-roles`, `account-and-billing`.
- Ten developer skills: `rest-api` (with a dependency-free Node client and its self-test), `tokens-and-abilities`, `errors-and-retries`, `webhooks` (with reference verifiers in Node, PHP and Python and a signed-fixture generator), `webhook-events`, `zapier`, `n8n`, `openapi-toolkits`, `custom-agents`, `mcp-clients`.
- Six connector skills: `connector-sdk`, `connector-manifest`, `connector-ports`, `connector-data-rules`, `connector-testing`, `connector-publishing`.
- Eight slash commands: `/subscriby:connect`, `/subscriby:status`, `/subscriby:docs`, `/subscriby:launch`, `/subscriby:doctor`, `/subscriby:weekly`, `/subscriby:verify-webhook`, `/subscriby:mint-token`.
- Three read-only subagents on generated tool allowlists: `launch-auditor`, `community-analyst`, `integration-reviewer`.
- A `PreToolUse` hook that makes every tool the catalogue flags destructive ask before it runs, whatever the session's permission settings.
- An eval suite of sixteen cases with nineteen mocked tools, graded on the answer and on the steps, run with `npm run eval` on the owner's go.
- The generator that keeps the kit following code: `npm run sync` snapshots the catalogues and regenerates every reference, the hook, the agents' allowlists, the mocked tool list and the README blocks; `npm run check` fails on a stale generated file or a catalogue item no skill owns; `npm run lint` holds the writing rules and the eval suite's shape; `npm run export:inventory -- --to-docs` feeds the documentation's Agentic Kit section.
- CI: validation on every push and a tagged release that must match the plugin's version.

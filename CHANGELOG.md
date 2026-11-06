# Changelog

All notable changes to the Subscriby Agentic Kit are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the kit adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html): a removed or renamed skill, command or agent is a major, a new one or a widened one a minor, a wording or reference refresh a patch. The catalogue stamp in `catalogue/stamp.json` records which Subscriby catalogue every release was generated from.

## [Unreleased]

### Added

- The `subscriby-guard` plugin, a companion in the same marketplace (`/plugin install subscriby-guard@envigo`): the `PreToolUse` hook that makes every tool the catalogue flags destructive ask before it runs, whatever the session's permission settings, with its generated matcher and its shell answer. It carries the kit's version, and lint holds the two equal.

### Changed

- The directory's third reading refused, from a publisher it has not verified, every hook of type command, every `allowed-tools` grant beyond Read, Grep, Glob and LS, and every file outside Markdown, text, JSON, YAML and images; a prompt hook can allow or deny but never ask, so the guard could not become one. The hook and its shell file moved out of the listed plugin into `subscriby-guard`, `/subscriby:docs` declares no grant and lets Claude Code ask once per host, and lint now refuses each of the three in `plugins/subscriby`. Without the guard, Claude Code's own permission prompt covers every tool unless the server is auto-approved, and the hub rule still has the skills confirm every destructive change in conversation before the tool is called.
- The directory's second reading: a skill that owns every endpoint or every event now gets one reference file per entity or family under `references/endpoints/` and `references/events/` with an index, so no file is too large for the validator or for Claude to read whole; the display name is "Subscriby Agentic Kit", distinct from the Subscriby connector's listing; the client's self-test builds its fake token at run time and its error message no longer speaks of the environment; the REST skill's header example carries a placeholder.
- The plugin directory's validation read: the generated endpoint references no longer carry an environment variable in their example bearer headers, and the snippets that teach a user's application to read its token or webhook secret name the application's own secret store instead of a literal environment read, so nothing in the plugin reads like a credential taken from the user's machine. The mocked tools list for the evals carries only the tools that have a mock. The hook's answer lives in `hooks/ask-before-destructive.sh` (now inside the guard plugin) and its matcher leaves the server part open, so it holds under any name a host gives the server. Every description is a double-quoted scalar, which the lint now requires. The documentation skill declares no `allowed-tools`; Claude Code asks once per host instead. The reference scripts (the REST client, the fixture generator and the three verifiers) ship inside the skills as Markdown, rendered by `npm run sync` from `scripts/reference`, where `npm test` runs their self-tests in CI.

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

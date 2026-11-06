# SubscribyKit — the Subscriby Agentic Kit

This repository is a Claude Code plugin marketplace (`envigo`) with one plugin (`subscriby`) under `plugins/subscriby/`. Users install it with `/plugin marketplace add envigoinnovations/subscriby-agentic-kit` and `/plugin install subscriby@envigo`. The plugin teaches Claude how to run a paid community through the Subscriby MCP server, how to integrate the REST API and webhooks into any application, and how to build a connector on the SDK. The Subscriby application lives in `../Subscriby`; this repo holds no runtime code of its own.

## Foundational Context

- **Audiences**: creators (operations through the MCP tools), developers (REST, tokens, webhooks, automations, custom agents), connector authors (the SDK). Each has a category folder under `plugins/subscriby/skills/`; `foundation/` holds the hub, the connection guide and the docs guide every audience shares.
- **The kit follows code.** Every tool name, ability, webhook event, endpoint, error code and count in the kit comes from the catalogues Subscriby publishes (`https://api.subscriby.net/*.json`) through `npm run sync`, never from memory. A change to a contract in `../Subscriby` is reflected here in the same session: run the sync, place any new catalogue item in `scripts/skill-map.json`, update the skill whose domain changed, bump the version once per Subscriby deploy.
- **Generated versus hand-written.** `references/tools.md`, `references/events.md` and `references/endpoints.md` inside a skill, `hooks/hooks.json`, the agents' `tools:` lists, `evals/mocks/subscriby/_tools.json`, the blocks between `<!-- generated:…:start -->` markers and the catalogue copies under `catalogue/` are written by `scripts/sync-catalogues.mjs`; never edit them by hand. `SKILL.md` bodies, commands, agent prompts, eval prompts and graders are written by hand.
- **Portability.** Every `skills/**/SKILL.md` uses only the standard frontmatter (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`) so the skills install into claude.ai, Cowork, organisation sync and the open skills ecosystem (`npx skills add envigoinnovations/subscriby-agentic-kit`). Claude Code-only behaviour lives in `commands/`, `agents/` and `hooks/`.

## Commands

- `npm run sync [-- --from ../Subscriby/public]`: pull the catalogues (or copy the local export before a deploy), snapshot them under `catalogue/`, regenerate everything generated.
- `npm run check`: regenerate in memory and fail on any difference from the committed files; fail when a tool, ability category, event family, endpoint entity or error code has no skill in `scripts/skill-map.json`.
- `npm run lint`: the frontmatter, style, tool-name and link rules over `plugins/subscriby/**`.
- `npm run validate`: `claude plugin validate --strict` on the marketplace and on the plugin. `scripts/claude.mjs` finds Claude Code on the PATH, in the VS Code extension or where the native installer or npm put it; `CLAUDE_BIN` names a binary explicitly.
- `npm run gate`: lint, check, validate. Green before any unit of work is called done.
- `npm run export:inventory`: writes `kit-inventory.json`, the file `../SubscribyDocs/scripts/data/` reads to fill the generated blocks of the docs' Agentic Kit section.
- `npm run eval`: `claude plugin eval` with a cost ceiling; run once per release, never in CI by default.

## Writing a skill

- The directory name is the skill name, kebab-case; the `description` is third person with the phrases a user would type ("This skill should be used when the user asks to …"), at most 300 characters, because every description loads into every session.
- The body is imperative, at most 500 lines: when to use it, the concept model, the procedure, the traps, the confirmation points where a destructive tool appears, what not to do, and links to `references/` and to the docs page it rests on.
- A tool is named only if it exists in the catalogue (lint checks every backticked `snake_case` identifier that starts like a tool); a count is generated or absent; a secret is always a placeholder; the retired brand name never appears; connectors are named where the skill is about a connector, otherwise "connector", "place" and "connected account".
- One source per topic: a rule lives in the hub or in the one skill that owns it, never both. A sentence that contradicts a published skill at `https://www.subscriby.net/.well-known/agent-skills/`, `AGENTS.md` or a docs page is a bug in one of them; flag it rather than paper over it.
- House terms: "ID" in capitals; "Starter Plan", "Growth Plan", "Free Plan"; "Subscriby Credit" and "Copilot Credits" capitalised.

## Cross-Project Rules (IMPORTANT)

- A new or renamed MCP tool, REST endpoint, webhook event, ability or error code in `../Subscriby` must land in `scripts/skill-map.json` (and in the skill whose domain it belongs to) in the same session, or `npm run check` fails.
- The docs' Agentic Kit section under `../SubscribyDocs/content/integrations/agentic-kit/` is filled from `kit-inventory.json`; a new skill, command or agent is followed by `npm run export:inventory -- --to-docs` and `npm run build` there.
- Do not run MCP traffic from this repository; a skill is proven in a Claude Code session with the plugin loaded (`claude --plugin-dir plugins/subscriby`) and in the eval suite.
- Do not commit anything matching `sbt_`, `*.pem`, `.env` or a Claude Code OAuth token.

## Releasing

1. `npm run sync` against the deployed catalogues, read the diff, place every new item, update the skills whose domains changed.
2. `npm run gate`, then `npm run eval` with the owner's go.
3. Move the `[Unreleased]` entries under a new version in `CHANGELOG.md`, bump `plugins/subscriby/.claude-plugin/plugin.json#version` (users receive a new copy only when it changes), commit.
4. Tag `vX.Y.Z` matching the plugin version; `release.yml` refuses a mismatch and publishes the GitHub release from the changelog section.

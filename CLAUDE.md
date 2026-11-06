# SubscribyKit — the Subscriby Agentic Kit

This repository is a Claude Code plugin marketplace (`envigo`) with two plugins under `plugins/`: `subscriby`, the kit, and `subscriby-guard`, the hook that makes every destructive tool ask first. Users install them with `/plugin marketplace add envigoinnovations/subscriby-agentic-kit`, then `/plugin install subscriby@envigo` and `/plugin install subscriby-guard@envigo`. The kit teaches Claude how to run a paid community through the Subscriby MCP server, how to integrate the REST API and webhooks into any application, and how to build a connector on the SDK. The Subscriby application lives in `../Subscriby`; this repo holds no runtime code of its own.

## Foundational Context

- **Audiences**: creators (operations through the MCP tools), developers (REST, tokens, webhooks, automations, custom agents), connector authors (the SDK). Each has a category folder under `plugins/subscriby/skills/`; `foundation/` holds the hub, the connection guide and the docs guide every audience shares.
- **The kit follows code.** Every tool name, ability, webhook event, endpoint, error code and count in the kit comes from the catalogues Subscriby publishes (`https://api.subscriby.net/*.json`) through `npm run sync`, never from memory. A change to a contract in `../Subscriby` is reflected here in the same session: run the sync, place any new catalogue item in `scripts/skill-map.json`, update the skill whose domain changed, bump the version once per Subscriby deploy.
- **Generated versus hand-written.** `references/tools.md`, `references/events.md` and `references/endpoints.md` inside a skill, the guard's `hooks/hooks.json`, the agents' `tools:` lists, `evals/mocks/subscriby/_tools.json`, the blocks between `<!-- generated:…:start -->` markers and the catalogue copies under `catalogue/` are written by `scripts/sync-catalogues.mjs`; never edit them by hand. `SKILL.md` bodies, commands, agent prompts, eval prompts and graders are written by hand.
- **Portability.** Every `skills/**/SKILL.md` uses only the standard frontmatter (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`) so the skills install into claude.ai, Cowork, organisation sync and the open skills ecosystem (`npx skills add envigoinnovations/subscriby-agentic-kit`). Claude Code-only behaviour lives in `commands/`, `agents/` and the guard plugin.
- **The listed plugin stays within the directory's policy.** Anthropic's plugin directory lists `subscriby` only while it carries no command hook, no `allowed-tools` grant beyond Read, Grep, Glob and LS, and no file outside Markdown, text, JSON, YAML and images (the licence, the readme and `.gitignore` aside); `npm run lint` refuses each. A command hook goes in `plugins/subscriby-guard` (a prompt hook can allow or deny but never ask, so the guard cannot be one), a script goes in `scripts/` and is rendered into a skill as Markdown by the sync, and a command that needs WebFetch declares no grant and lets Claude Code ask once per host. The guard carries the kit's version; lint holds the two equal.

## Commands

- `npm run sync [-- --from ../Subscriby/public]`: pull the catalogues (or copy the local export before a deploy), snapshot them under `catalogue/`, regenerate everything generated.
- `npm run check`: regenerate in memory and fail on any difference from the committed files; fail when a tool, ability category, event family, endpoint entity or error code has no skill in `scripts/skill-map.json`.
- `npm run lint`: the frontmatter, style, tool-name and link rules over `plugins/subscriby/**`, the eval suite's shape, the directory's policy over the listed plugin and the two plugins' version parity.
- `npm run validate`: `claude plugin validate --strict` on the marketplace and on both plugins. `scripts/claude.mjs` finds Claude Code on the PATH, in the VS Code extension or where the native installer or npm put it; `CLAUDE_BIN` names a binary explicitly.
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
- Do not run MCP traffic from this repository; a skill is proven in a Claude Code session with the plugins loaded (`claude --plugin-dir plugins/subscriby --plugin-dir plugins/subscriby-guard`) and in the eval suite.
- Do not commit anything matching `sbt_`, `*.pem`, `.env` or a Claude Code OAuth token.

## Releasing

1. `npm run sync` against the deployed catalogues, read the diff, place every new item, update the skills whose domains changed.
2. `npm run gate`, then `npm run eval` with the owner's go.
3. Move the `[Unreleased]` entries under a new version in `CHANGELOG.md`, bump `plugins/subscriby/.claude-plugin/plugin.json#version` and the guard's to the same number (users receive a new copy only when it changes; lint holds the two equal), commit.
4. Tag `vX.Y.Z` matching the plugin version; `release.yml` refuses a mismatch and publishes the GitHub release from the changelog section.

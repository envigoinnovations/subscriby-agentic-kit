# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a Vulnerability

Email [support@subscriby.net](mailto:support@subscriby.net).

Please include:

- The affected file (a skill, command, agent, hook or script) or the surface it drives
- Reproduction steps
- Impact assessment
- Your contact details for follow-up

Encrypt with PGP if the report contains sensitive data; request the public key in your initial message.

## Disclosure Timeline

- Acknowledgement: within 3 business days
- Triage and severity rating: within 7 business days
- Fix target: 90 days from acknowledgement (CVSS-dependent)
- Coordinated public disclosure after the fix is shipped

## Scope

In scope:

- The contents of this repository: the plugin's skills, commands, agents, hook, eval suite and the scripts that generate them
- The marketplace manifest and the plugin manifest

Out of scope:

- The Subscriby application, its REST API, the MCP server at `https://mcp.subscriby.net` and the webhooks it sends; report those to [support@subscriby.net](mailto:support@subscriby.net) per the main application's security policy.
- Claude Code itself and third-party agents that load the skills.

## What the kit never holds

The kit carries no credentials. The bundled MCP server signs the user in through OAuth inside Claude Code; a personal access token is never written into this repository, a skill, a hook or an eval case. A report that finds a token-shaped string anywhere in the kit is a security report.

## Safe Harbor

Good-faith research that respects user privacy and follows this policy will not be subject to legal action. Do not access data that does not belong to you, do not degrade service for other users, and stop the moment you have proof of impact.

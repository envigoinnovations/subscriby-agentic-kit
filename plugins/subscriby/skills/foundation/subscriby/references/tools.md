# Tools: Subscriby

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_job_status` | read | none | Polls a long-running MCP job by id and returns its current `status` (`queued`, `running`, `completed`, `failed`) plus the final `result` or `error` once the worker finishes. |
| `get_me` | read | `account:read` | Describes the creator this token belongs to: id, name, email, locale, platform plan and its capabilities, the team the token is scoped to (`current_team`, the id the other tools act in) and every team they belong to, the accounts linked on the connectors, and where their alerts go (`alert_destinations`, with `alert_destinations_default` true when no destination was written and every class reaches the primary connected account). |

## `get_job_status`

Read

Polls a long-running MCP job by id and returns its current `status` (`queued`, `running`, `completed`, `failed`) plus the final `result` or `error` once the worker finishes. Always pair with any tool that returns a `job_id` (`bulk_generate_access_codes`, `request_account_export`, and `revert_recovery_operation` for a channel revert); poll until `status=completed`, or in the Copilot watch the step, which follows the job live. Visibility is locked to jobs the authenticated user originally kicked off — foreign job ids return `RESOURCE_NOT_FOUND` to prevent existence leaks.

**Arguments**

- `job_id` (string, required): UUID of the async job to poll.

## `get_me`

Read · requires `account:read`

Describes the creator this token belongs to: id, name, email, locale, platform plan and its capabilities, the team the token is scoped to (`current_team`, the id the other tools act in) and every team they belong to, the accounts linked on the connectors, and where their alerts go (`alert_destinations`, with `alert_destinations_default` true when no destination was written and every class reaches the primary connected account). Call it first to learn who you are acting as. Takes no input.

**Arguments**

- none

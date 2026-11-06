# Tools: Members

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_subscribers` | read | `project-user:view-any` | Lists project members (subscribers) with optional filters: `project_id`, `status` (`lead`, `trialing`, `customer`, `churned`, `banned`), `access` (`waiting`: members whose live purchase includes a place waiting for an account they have not connected, the ones `remind_member_to_connect` nudges), and `search` (case-insensitive partial match across name, email and billing email). |
| `get_subscriber` | read | `project-user:view` | Fetches one project member (subscriber) by UUID. |
| `find_member_by_identity` | read | `project-user:view-any` | Finds one project member by the account they connected on a connector: `project_id`, the `connector` key (as `list_connectors` lists them) and the platform's own `external_id` for the account (as `list_member_identities` shows it). |
| `list_member_identities` | read | `project-user:view` | Lists the connector accounts a project member has connected: the platform (`connector`), the account's `external_id`, `display_name` and `username`, how the link was proven (`source`: `bot`, `portal`, `handshake`, `adopted` or `backfill`) and which one the project reaches first (`preferred`). |
| `unlink_member_identity` | destructive | `project-user:update` | Disconnects one of a project member's connector accounts: it no longer signs them in to the portal and the project's bot no longer knows them by it. |
| `remind_member_to_connect` | additive | `project-subscription:update` | Reminds ONE member that a place of their purchase still waits for an account they have not connected (a place on one platform bought through the bot of another, say), by mail and in their chat, with the door that connects it. |
| `nudge_pending_readmissions` | additive | `project-recovery:update` | Sends one reminder, with a fresh link, to every member a channel recovery re-admitted who has not joined the new chat yet, and records the nudge on the operation. |
| `ban_member` | destructive | `project-user:update` | Bans a project member — flips status to `Banned` and triggers the connector removal pipeline so the subscriber loses access on every linked resource immediately. |
| `unban_member` | destructive | `project-user:update` | Lifts a ban on a project member — status rolls to `Churned`, and downstream payment pipelines promote the member back to `Customer` on the next successful payment. |
| `kick_member` | destructive | `project-user:update` | Removes a project member without banning them — status rolls to `Churned`, connector resource removal fires through the bot pipeline, and the member can re-subscribe later. |
| `list_creator_tasks` | read | `project-subscription:view` | Lists the hand-arranged perks a creator still has to hand over in one project — one task per subscriber and manual resource, with the grant it fulfils, the purchase, the member, the resource title, the instructions and when it is due. |
| `complete_creator_task` | destructive | `project-subscription:update` | Marks a hand-arranged perk as handed over: the task is recorded done by the token's user, the access ledger row moves from `pending` to `granted`, and `creator_task.completed` then `member.resource_added` are raised for the grant. |
| `list_subscription_grants` | read | `project-subscription:view` | Lists the access grants a subscription holds: one row per resource (and per pass window) with the connector that gave access, the mode (`bearer_link` invite link, `membership`, `role`, `creator_task`), the state (`pending_identity`, `pending`, `held`, `granted`, `revoked`, `failed`), the connector's reference (the invite link, on a connector that grants by link) and, for a failure, `failure_kind` and `failure_detail`. |
| `reissue_subscription_grants` | destructive | `project-subscription:update` | Revokes the access grants a member holds on a subscription — every resource, or only `resource_id` — and has fresh ones issued by the same job that grants at purchase; the bot sends the member the new links. |

## `list_subscribers`

Read · requires `project-user:view-any`

Lists project members (subscribers) with optional filters: `project_id`, `status` (`lead`, `trialing`, `customer`, `churned`, `banned`), `access` (`waiting`: members whose live purchase includes a place waiting for an account they have not connected, the ones `remind_member_to_connect` nudges), and `search` (case-insensitive partial match across name, email and billing email). Paginates with `limit` (1..100) and `page`. Returns both `email` (member-chosen, verified, their portal sign-in credential) and `billing_email` (whatever they gave a payment provider, never verified — identification only, not a contact channel). PII WARNING: both are returned verbatim — scrub before forwarding to any third-party LLM, log sink, or analytics surface.

**Arguments**

- `project_id` (string): Optional project UUID to narrow the result.
- `status` (one of `lead`, `trialing`, `customer`, `churned`, `banned`): Member status filter. One of: lead, trialing, customer, churned, banned
- `access` (one of `waiting`): `waiting` keeps the members whose live purchase includes a place waiting for an account they have not connected; omit for everyone.
- `search` (string): Case-insensitive partial match against name + email.
- `limit` (integer): Maximum members to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_subscriber`

Read · requires `project-user:view`

Fetches one project member (subscriber) by UUID. Same row shape as `list_subscribers`, including both `email` (member-chosen, verified) and `billing_email` (whatever they gave a payment provider). PII WARNING: both are returned verbatim — scrub before forwarding to any third-party LLM, log sink, or analytics surface. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `member_id` (string, required): UUID of the project member to fetch.

## `find_member_by_identity`

Read · requires `project-user:view-any`

Finds one project member by the account they connected on a connector: `project_id`, the `connector` key (as `list_connectors` lists them) and the platform's own `external_id` for the account (as `list_member_identities` shows it). Answers the same row as `get_subscriber`, with `identities` loaded. PII WARNING: `email` and `billing_email` are returned verbatim — scrub before forwarding to any third-party LLM, log sink, or analytics surface. An unknown project, a connector the project does not run, or an account no member of the project linked is `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the member belongs to.
- `connector` (string, required): Connector key the account lives on, as `list_connectors` lists them.
- `external_id` (string, required): The platform's own id for the account, as `list_member_identities` shows it.

## `list_member_identities`

Read · requires `project-user:view`

Lists the connector accounts a project member has connected: the platform (`connector`), the account's `external_id`, `display_name` and `username`, how the link was proven (`source`: `bot`, `portal`, `handshake`, `adopted` or `backfill`) and which one the project reaches first (`preferred`). Members connect accounts themselves, from the portal or by talking to the project's bot; there is no tool to connect one for them. PII WARNING: external ids and names are returned verbatim — scrub before forwarding to any third-party LLM, log sink, or analytics surface.

**Arguments**

- `member_id` (string, required): UUID of the project member whose connected accounts to list.

## `unlink_member_identity`

Destructive · requires `project-user:update`

Disconnects one of a project member's connector accounts: it no longer signs them in to the portal and the project's bot no longer knows them by it. Refused when it is the member's last way to sign in (no verified email, linked Google account or other connected account remains). Pass the link `id` from `list_member_identities`, not the account's external id. Emits `member.identity_unlinked`. Not idempotent: a second call answers `RESOURCE_NOT_FOUND`.

**Arguments**

- `member_id` (string, required): UUID of the project member.
- `identity_id` (string, required): The link `id` from `list_member_identities` to disconnect.

## `remind_member_to_connect`

Additive · requires `project-subscription:update` · idempotent

Reminds ONE member that a place of their purchase still waits for an account they have not connected (a place on one platform bought through the bot of another, say), by mail and in their chat, with the door that connects it. Requires `subscription_id`; find candidates with `list_subscribers` and `access: waiting`. Answers `reminded` true when the message went out and false when nothing was sent: no place waits, the member was reminded within the last day or stopped the follow-ups, or the purchase ended.

**Arguments**

- `subscription_id` (string, required): UUID of the purchase whose place waits for an account.

## `nudge_pending_readmissions`

Additive · requires `project-recovery:update`

Sends one reminder, with a fresh link, to every member a channel recovery re-admitted who has not joined the new chat yet, and records the nudge on the operation. Read `get_recovery_roll_call` first: `can_nudge` says whether anyone is still outside and the cooldown has passed. Nobody waiting, a nudge too soon, a recovery of another kind or not the creator's own is `VALIDATION_FAILED` with the reason. Every reminder reaches a real person, so do not loop it. Returns how many reminders were queued.

**Arguments**

- `operation_id` (string, required): UUID of the completed channel recovery whose stragglers to remind.

## `ban_member`

Destructive · requires `project-user:update` · idempotent · open world

Bans a project member — flips status to `Banned` and triggers the connector removal pipeline so the subscriber loses access on every linked resource immediately. DESTRUCTIVE: you MUST confirm the target `member_id` with a human before calling; banning is socially visible and breaks an active relationship. Idempotent — re-calling on an already-banned member is a no-op. Emits `member.banned`. Use `unban_member` to reverse.

**Arguments**

- `member_id` (string, required): UUID of the project member to ban.
- `reason` (string): Optional human-readable reason that lands in the member.banned event payload.

## `unban_member`

Destructive · requires `project-user:update` · idempotent · open world

Lifts a ban on a project member — status rolls to `Churned`, and downstream payment pipelines promote the member back to `Customer` on the next successful payment. Idempotent — re-calling on an already-unbanned member is a no-op. Emits `member.unbanned`. Use after `ban_member` to reverse a ban that was applied by mistake or expired.

**Arguments**

- `member_id` (string, required): UUID of the banned project member to unban.

## `kick_member`

Destructive · requires `project-user:update` · idempotent · open world

Removes a project member without banning them — status rolls to `Churned`, connector resource removal fires through the bot pipeline, and the member can re-subscribe later. DESTRUCTIVE: you MUST confirm the target `member_id` with a human before calling; the kick is socially visible and revokes connector access immediately. Emits `member.kicked`. Use `ban_member` instead when re-entry must be blocked.

**Arguments**

- `member_id` (string, required): UUID of the project member to kick.
- `reason` (string): Optional human-readable reason that lands in the member.kicked event payload.

## `list_creator_tasks`

Read · requires `project-subscription:view`

Lists the hand-arranged perks a creator still has to hand over in one project — one task per subscriber and manual resource, with the grant it fulfils, the purchase, the member, the resource title, the instructions and when it is due. A manual resource is a perk no connector can give (a file, a call, a seat somewhere no bot manages), so the purchase's grant waits as a task until the creator marks it done with `complete_creator_task`. `status` is `open` by default (not yet done, purchase still standing), `completed`, or `all`; pages oldest first so the longest-waiting member is at the top, with `limit` (1..100, default 25) and `page`. Answers "who is still waiting for something I hand over myself?". An unknown or out-of-scope `project_id` surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose tasks to list.
- `status` (one of `open`, `completed`, `all`): Which tasks: `open` (default: not yet done, purchase still standing), `completed`, or `all`.
- `limit` (integer): Tasks per page (1..100, default 25).
- `page` (integer): 1-indexed page number.

## `complete_creator_task`

Destructive · requires `project-subscription:update`

Marks a hand-arranged perk as handed over: the task is recorded done by the token's user, the access ledger row moves from `pending` to `granted`, and `creator_task.completed` then `member.resource_added` are raised for the grant. Use it after the creator confirms they handed the perk over — never to tidy the list, because it says the member received something. Read the task back with `list_creator_tasks` first. A task already done, or one whose purchase has ended so there is nothing left to grant, is `VALIDATION_FAILED`; an unknown or out-of-scope `task_id` is `RESOURCE_NOT_FOUND`.

**Arguments**

- `task_id` (string, required): UUID of the task to complete, from `list_creator_tasks` or the `creator_task.opened` event.

## `list_subscription_grants`

Read · requires `project-subscription:view`

Lists the access grants a subscription holds: one row per resource (and per pass window) with the connector that gave access, the mode (`bearer_link` invite link, `membership`, `role`, `creator_task`), the state (`pending_identity`, `pending`, `held`, `granted`, `revoked`, `failed`), the connector's reference (the invite link, on a connector that grants by link) and, for a failure, `failure_kind` and `failure_detail`. Answers "does this member actually have access?" — read it instead of inferring access from the payment status. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription whose grants to list.

## `reissue_subscription_grants`

Destructive · requires `project-subscription:update`

Revokes the access grants a member holds on a subscription — every resource, or only `resource_id` — and has fresh ones issued by the same job that grants at purchase; the bot sends the member the new links. The members page's "Refresh invite links" for agents: use it when a link expired or leaked, or after a chat's admins cleared a ban. Answers `reissued` (grants withdrawn) and `status: reissue_queued`; read the fresh grants back with `list_subscription_grants`. Raises `member.resource_reissued` per grant and `member.resource_added` per fresh one. THIS KILLS LIVE LINKS AND MESSAGES A REAL PERSON: read the subscription back first and never loop it. A subscription that is not active is `VALIDATION_FAILED`; unknown, foreign or out-of-scope ids, or a `resource_id` the plan does not grant, surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `subscription_id` (string, required): UUID of the subscription whose grants to reissue.
- `resource_id` (string): UUID of one resource of the plan to reissue alone; omit to reissue every resource the subscription grants.

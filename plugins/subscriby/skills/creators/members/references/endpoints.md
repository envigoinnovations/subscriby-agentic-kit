# REST endpoints: Members

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `members`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/members` | `project-user:view-any` | List a project's members | `find_member_by_identity`, `list_subscribers` |
| GET | `/v1/projects/{project}/members/{member}` | `project-user:view` | Get a member | `get_subscriber` |
| POST | `/v1/projects/{project}/members/{member}/ban` | `project-user:update` | Ban a member | `ban_member` |
| GET | `/v1/projects/{project}/members/{member}/identities` | `project-user:view` | List a member's connected accounts | `list_member_identities` |
| DELETE | `/v1/projects/{project}/members/{member}/identities/{link}` | `project-user:update` | Disconnect a member's account | `unlink_member_identity` |
| POST | `/v1/projects/{project}/members/{member}/kick` | `project-user:update` | Kick a member | `kick_member` |
| POST | `/v1/projects/{project}/members/{member}/unban` | `project-user:update` | Unban a member | `unban_member` |

### GET `/v1/projects/{project}/members`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/members?status=customer" \
  -H "Authorization: Bearer <token>"
```

Newest first, paged with `page` and `per_page` (default 25; `limit` is accepted as an alias). `status` narrows to one lifecycle state. `identity` looks one member up by the account they connected, `connector:external_id`, for a workflow that starts from a platform event and needs the member behind an account id; the page then holds that one member with their `identities` embedded, or no rows. `access=waiting` keeps the members whose live purchase includes a place waiting for an account they have not connected (a Discord role bought through Telegram, say), the ones the [connection reminder](https://docs.subscriby.net/api/v1/reference/subscriptions) nudges.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): Narrow the page to one lifecycle state: `lead`, `trialing`, `customer`, `churned` or `banned`. Any other value is refused rather than answered with an empty page, so a typo in an automation is noticed.
- `access` (query, string or null): Narrow the page to the members whose live purchase includes a place waiting for an account they have not connected (a place on one platform bought through the bot of another, say): `waiting`. Any other value is refused.
- `identity` (query, string or null): Find the member who connected a given account: the connector key and the platform's own id for the account joined by a colon, `connector:123456789`. The page then holds that one member with their `identities` embedded, or no rows when nobody in the project connected that account. A value with no connector before the colon is refused.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### GET `/v1/projects/{project}/members/{member}`

One member with their connected accounts embedded as `identities`.

`email` and `billing_email` are present only when the calling token carries `project-user:view`, which this route requires; a roster-only token (`project-user:view-any`) never sees them on the list, where the keys are absent, not null. The two are not interchangeable:

| Field           | Where it comes from                                                                                       | Safe to contact?             |
| --------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `email`         | The member chose it themselves and verified it. It is their portal sign-in credential.                    | Yes                          |
| `billing_email` | Whatever address they gave a payment provider at checkout. Never verified, never used for authentication. | Treat as identification only |

Members join through a bot and are never asked for an email, so for most of them `email` is `null` and `billing_email` is the only address on record, which is what makes it useful for matching a refund request to a subscription.

`billing_email` is populated automatically from the payment provider on every new payment (Stripe, PayPal, Paystack, Razorpay and Skrill). Members who last paid before that capture existed may have `null` until their next payment, and members who joined by redeeming an access code never had a payment at all, so they have no billing address to record.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.


### POST `/v1/projects/{project}/members/{member}/ban`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/members/$MEMBER_ID/ban \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Repeated spam in the research channel."}'
```

Moves a `lead`, `customer`, `trialing` or `churned` member to `banned`, removes their access on every connector and emits `member.banned` with the optional `reason`. Answers `200` with the member; a member already banned is answered unchanged and emits nothing.

Connector-side eviction (kicks from the gated spaces, revoked invite links) runs asynchronously on the connector pipeline after the flip. The call returns as soon as Subscriby's state has been updated and the webhook event has been fired; the platform actions complete in the background.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `reason` (string): Why the member is banned; carried on the `member.banned` event and shown in the dashboard, never sent to the member.


### GET `/v1/projects/{project}/members/{member}/identities`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/members/$MEMBER_ID/identities \
  -H "Authorization: Bearer <token>"
```

The member's connected accounts, preferred first. Never paginated. A member can connect one account per platform the project is on, from the portal's **Account & Recovery** screen or by talking to the project's bot; the member read embeds the same rows as `identities`. Connecting has no endpoint: it is a two-sided proof the member completes on the connector.

- `id` is the link, which is what the disconnect endpoint takes; `external_id` is the platform's own id for the account.
- `source` says how the link was proven: `handshake` (connected from the portal and confirmed by the bot, or a portal sign-in), `adopted` (taken over from another of the creator's projects), `portal`, `bot` (the bot met the account first) or `backfill` (migrated from before connectors).
- `preferred` marks the account the project reaches first; a member's first account is, and the member can move it on the portal.
- `notify` marks a further account the member switched the project's notices on for, from the portal. The preferred account always hears them, so it reads `false` there too; a grant notice stays on the connector of the grant and a support reply on the connector the member wrote from, whatever the switches say.

**Parameters**

- `project` (path, string, required): The project, resolved by the binder.
- `member` (path, string, required): The member, resolved within the project.


### DELETE `/v1/projects/{project}/members/{member}/identities/{link}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/members/$MEMBER_ID/identities/$LINK_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Disconnects an account on the creator's behalf, the counterpart of the member's own Disconnect on the portal: it no longer signs the member in and the bot no longer knows them by it. Answers an empty `204` and emits `member.identity_unlinked`.

**Parameters**

- `project` (path, string, required): The project, resolved by the binder.
- `member` (path, string, required): The member, resolved within the project.
- `link` (path, string, required): The member's link, resolved within the member.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/members/{member}/kick`

Moves the member to `churned`, removes them from every resource and emits `member.kicked` with the optional `reason`. Unlike a ban, a kicked member may come back by subscribing again. Answers `200` with the member; a `banned` member is answered unchanged, since a ban already says more. As with a ban, the connector-side eviction completes in the background after the call returns.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `reason` (string): Why the member is removed; carried on the `member.kicked` event and shown in the dashboard, never sent to the member.


### POST `/v1/projects/{project}/members/{member}/unban`

Moves a `banned` member to `churned` and emits `member.unbanned`. Access is not restored: the member subscribes again from the portal or the bot. Answers `200` with the member; a member who is not banned is answered unchanged and emits nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `member` (path, string, required): The member, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


## `creator-tasks`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/creator-tasks` | `project-subscription:view` | List a project's creator tasks | `list_creator_tasks` |
| POST | `/v1/projects/{project}/creator-tasks/{task}/complete` | `project-subscription:update` | Complete a creator task | `complete_creator_task` |

### GET `/v1/projects/{project}/creator-tasks`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/creator-tasks?status=open" \
  -H "Authorization: Bearer <token>"
```

`status` is `open` (the default: tasks not yet done whose grant still stands), `completed`, or `all`. Paged like every list but **oldest first** by default, so the longest-waiting member is at the top.

- `grant_id` is the access ledger row the task belongs to; read it with the [subscription's grants](https://docs.subscriby.net/api/v1/reference/subscriptions/list-a-subscriptions-grants), where its `mode` is `creator_task`.
- `instructions` is the sentence the dashboard shows the creator, in the creator's locale.
- `due_at` is null for continuous access and the window's start for a dated pass.
- `completed_at` and `completed_by_user_id` are set once the task is done.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): The tab: `open` (the default) lists tasks not yet done whose grant still stands, `completed` the ones marked done, `all` both.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `asc`.


### POST `/v1/projects/{project}/creator-tasks/{task}/complete`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/creator-tasks/$TASK_ID/complete \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Marks the task done by the token's user, moves the grant to `granted`, and raises `creator_task.completed` followed by `member.resource_added` for the same grant. Answers `200` with the completed task.

> **Nobody messages the member for you.** A manual perk is yours to hand over. Completing the task records that you did and tells your integrations; it does not send the member anything.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `task` (path, string, required): The task, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


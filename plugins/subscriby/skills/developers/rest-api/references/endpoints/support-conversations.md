# REST endpoints: Rest api, the `support-conversations` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `support-conversations`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/support/conversations` | `support-conversation:view-any` | List support conversations | `list_support_conversations` |
| GET | `/v1/support/conversations/{conversation}` | `support-conversation:view` | Get a support conversation | `get_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/assign` | `support-conversation:update` | Assign a support conversation | `assign_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/block` | `support-conversation:update` | Block a support contact | `block_support_contact` |
| GET | `/v1/support/conversations/{conversation}/messages` | `support-conversation:view` | List a conversation's messages |  |
| POST | `/v1/support/conversations/{conversation}/messages` | `support-conversation:update` | Reply to a member | `reply_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/reopen` | `support-conversation:update` | Reopen a support conversation | `reopen_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/resolve` | `support-conversation:update` | Resolve a support conversation | `resolve_support_conversation` |
| POST | `/v1/support/conversations/{conversation}/unblock` | `support-conversation:update` | Unblock a support contact | `unblock_support_contact` |

### GET `/v1/support/conversations`

```bash
curl "https://api.subscriby.net/v1/support/conversations?status=open" \
  -H "Authorization: Bearer <token>"
```

The queue across every project the token can reach, newest activity first, 25 per page. `project_id`, `status` and `assigned_to` narrow it.

**Parameters**

- `project_id` (query, string): Narrow the queue to a single project.
- `status` (query, string): Narrow to one status: `open`, `pending`, `snoozed` or `resolved`. An unknown value is refused.
- `assigned_to` (query, string): Narrow to the conversations assigned to one team member, by user id.
- `page` (query, integer): The page to return, 1-indexed.
- `per_page` (query, integer): Rows per page, 1 to 100.
- `limit` (query, integer): An alias of `per_page`, kept for older integrations.


### GET `/v1/support/conversations/{conversation}`

One thread.

`member_name` is the member's display name, or "Unknown member" when they have not shared one. It is included so a picker built on this endpoint has something human to show; the Zapier and n8n conversation dropdowns both rely on it. Anyone who can reach the bot can open a conversation, including someone who has never paid, so `subscriber_id` may resolve to a member whose status is `lead`.

`channel` is the key of the connector the member wrote through. A member who writes through two connectors has two conversations, and each reply goes back on the connector its conversation came in on.

`status` is one of `open`, `pending`, `snoozed`, `resolved`. `first_response_at` is stamped **once**, on the first human reply ever in the thread: it is an SLA measure of how long the member waited for a person, not of the most recent reply, and a reopen does not reset it.

`blocked: true` means inbound messages from that member are being dropped. The thread is history only, and a blocked member cannot reopen it by writing again.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.


### POST `/v1/support/conversations/{conversation}/assign`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/assign \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"assigned_to_user_id": "'"$TEAM_USER_ID"'"}'
```

Hands the thread to a team member. `assigned_to_user_id` must be **present**: omitting the key is refused, and sending `null` is how you clear an assignment. Answers `200` with the thread.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `assigned_to_user_id` (string, required): The team member to hand the thread to, by user id. The key must be **present**: omitting it is refused, while sending null clears the assignment.


### POST `/v1/support/conversations/{conversation}/block`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/block \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Silences the member behind the thread: their messages to this project's bot are dropped without any notice to them, and the thread cannot reopen on inbound. Their paid access is untouched, because a block is an inbox decision and not a moderation one; use the [Members](https://docs.subscriby.net/api/v1/reference/members) endpoints to ban or kick. Idempotent and answers `200` with the thread; blocking an already-blocked contact changes nothing and emits nothing, and when the block actually flips `support.conversation.blocked` fires once.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/support/conversations/{conversation}/messages`

The thread's messages **oldest first**, 50 per page. `internal: true` notes are withheld unless the token also carries `support-conversation:update`: reading a private remark about a member takes the same permission as writing one.

`direction` is `inbound` (from the member) or `outbound` (from your team). `author_kind` is `contact`, `creator` or `system`; `author_user_id` names the team member on an outbound reply and is `null` for inbound and system messages.

`source` is the surface the message came through: `connector_chat` for a member writing to the connector's installation, `dashboard`, `api` or `mcp` for a reply from your team, and `connector_relay_dm` or `connector_relay_group` for a reply your team typed on the platform itself (into the relay's ping, or inside the thread the relay opened in a group). Messages recorded before the connector SDK carry the same three meanings under the Telegram connector's older words, `telegram_bot`, `telegram_relay_dm` and `telegram_relay_group`.

`delivery_status` on an outbound message is `pending` → `sent`, or `failed` / `unreachable`. **`unreachable` means the member has blocked the bot**: the reply is stored but will never arrive, and retrying will not help. `failure_reason` carries the detail.

`body` is `null` for media sent without a caption. A captioned photo puts the caption in `body` and does not create a second message. A member editing an earlier message updates the stored message in place and stamps `edited_at`; no new message is created and no event fires. Inbound messages are rate-limited per member: excess messages are dropped silently rather than queued, so a flooding member produces no burst of events.

Each entry of `attachments` carries the file's `kind`, `mime`, `file_name`, `size`, `width`, `height`, `duration` and `url`.

> **File ids are never returned.** A platform file id plus the bot token is enough to download the file straight from the platform, so it is treated as a credential. `url` is populated only after the file has been fetched at least once; it is `null` until then.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `page` (query, integer): The page to return, 1-indexed.
- `per_page` (query, integer): Messages per page, 1 to 100.
- `limit` (query, integer): An alias of `per_page`, kept for older integrations.


### POST `/v1/support/conversations/{conversation}/messages`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/messages \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"body": "Sorry about that. Here is a fresh invite link, valid for 24 hours."}'
```

Answers `201` with the created message. `delivery_status` is `pending`: the reply has been recorded and queued, not yet delivered. Poll the message back or subscribe to `support.message.sent` rather than treating `201` as proof of receipt.

**Text only.** Sending media as a reply is a dashboard-inbox feature; this API accepts a `body` of up to 4000 characters, the message ceiling on the connectors.

Send `{"body": "...", "internal": true}` to record a private note for your team instead. Private notes are never delivered to the member and raise no webhook event.

Add `reply_to_message_id` to quote an earlier message, the way a chat client shows a threaded reply. It must name a message in **this** conversation; quoting across threads is refused, because it would put one member's words in front of another.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `body` (string, required): The reply text, up to 4,000 characters, the message ceiling on the connectors. Text only; media replies are a dashboard feature.
- `internal` (boolean): True records a private note for the team instead of a reply: never delivered to the member and raising no event. Defaults to false.
- `reply_to_message_id` (string): An earlier message of **this** conversation to quote, the way a chat client shows a threaded reply. A message from another thread is refused.


### POST `/v1/support/conversations/{conversation}/reopen`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/reopen \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Puts the conversation back to `open` and emits `support.conversation.reopened`, whatever its previous status was. A member writing back does the same thing on its own, so this is for the creator who changes their mind, or owes a follow-up before the member speaks again. Answers `200` with the thread.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/support/conversations/{conversation}/resolve`

```bash
curl -X POST https://api.subscriby.net/v1/support/conversations/$CONVERSATION_ID/resolve \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Resolving is not closing: the thread and its history are kept, and the member's next message reopens it automatically, raising `support.conversation.reopened`. Answers `200` with the thread.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/support/conversations/{conversation}/unblock`

Reverses a block. Idempotent and answers `200` with the thread; `support.conversation.unblocked` fires once when the block actually flips.

**Parameters**

- `conversation` (path, string, required): The thread, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


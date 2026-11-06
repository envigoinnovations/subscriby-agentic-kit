# Webhook events: Webhook Events, the `support` family

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `support`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `support.conversation.opened` | `support-conversation:view` | `channel`, `conversation_id`, `project_id`, `subscriber_id` |
| `support.conversation.assigned` | `support-conversation:view` | `assigned_to_user_id`, `conversation_id`, `project_id`, `subscriber_id` |
| `support.conversation.resolved` | `support-conversation:view` | `conversation_id`, `project_id`, `subscriber_id` |
| `support.conversation.reopened` | `support-conversation:view` | `conversation_id`, `project_id`, `subscriber_id` |
| `support.conversation.blocked` | `support-conversation:view` | `conversation_id`, `project_id`, `subscriber_id` |
| `support.conversation.unblocked` | `support-conversation:view` | `conversation_id`, `project_id`, `subscriber_id` |
| `support.message.received` | `support-conversation:view` | `conversation_id`, `has_attachments`, `message_id`, `project_id`, `subscriber_id`, `type` |
| `support.message.sent` | `support-conversation:view` | `conversation_id`, `message_id`, `project_id`, `subscriber_id`, `type` |
| `support.canned_reply.created` | `support-conversation:view` | `canned_reply`, `project_id` |
| `support.canned_reply.updated` | `support-conversation:view` | `canned_reply`, `changes`, `project_id` |
| `support.canned_reply.deleted` | `support-conversation:view` | `canned_reply`, `project_id` |
| `support.settings.updated` | `support-conversation:view` | `changes`, `project_id`, `settings` |

### `support.conversation.opened`

A member starts their first support conversation on a channel.

### When this fires

A member sends your project bot a message it does not recognise as a command, an access code, or an answer the bot was waiting for, and they have no conversation on that channel yet. Subscriby creates the conversation and emits this event, immediately followed by `support.message.received` for the message itself.

The message can be text, a photo, a document, a voice note or any other supported media. A bare photo with no caption opens a conversation just as text does.

It does **not** fire when:

- The member already has a conversation on that channel, even a resolved one. A resolved thread reopens and raises `support.conversation.reopened` instead.
- The message was a recognised bot command, or an answer the bot was waiting for during a guided setup step.
- The member is blocked, or has tripped the inbound rate limit.
- Support is switched off for the project.

> This fires **once per member, per channel, ever**. It is a "new contact" signal, not a "new question" signal. For every question a member asks, listen to `support.message.received`.

### Caveats

- The payload carries no message body and no member name. Fetch them with [the conversation messages endpoint](https://docs.subscriby.net/api/v1/reference/support-inbox).
- The member may be a **lead** rather than a subscriber. Anyone who can reach the bot can open a conversation, including someone who has never paid: `data.subscriber_id` resolves to a project user whose status may be `lead`.
- Opening a conversation is not the same as the creator being notified. Notification is throttled to one bot DM per conversation per five minutes, so a burst of messages produces one ping but many events.

### Related events

- `support.message.received`: fires alongside this event, for the message itself.
- `support.conversation.reopened`: the returning-member counterpart.

```json
{
  "id": "evt_01HX...",
  "type": "support.conversation.opened",
  "created_at": "2026-08-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "channel": "telegram"
  }
}
```

### `support.conversation.assigned`

A support conversation is handed to a team member, or its assignment cleared.

### When this fires

A conversation's assignee changes: it is handed to a team member from the dashboard inbox, the REST API, Zapier, or n8n, or an existing assignment is cleared.

> Clearing an assignment fires this same event with `data.assigned_to_user_id: null`. There is no separate "unassigned" event; branch on the null.

### Caveats

- `assigned_to_user_id` is a **team member's** user id, an account with dashboard access, not the member's `subscriber_id`. The two are different namespaces.
- Assignment is advisory. It does not restrict who may reply; anyone on the team with `support-conversation:update` still can.
- Re-assigning to the same person fires the event again. Deduplicate on `id` if you are posting notifications.

### Related events

- `support.conversation.resolved`: the usual next step once the assignee has answered.
- `support.message.received`: what typically prompts an assignment.

```json
{
  "id": "evt_01HX...",
  "type": "support.conversation.assigned",
  "created_at": "2026-08-20T10:09:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "assigned_to_user_id": "4b7c9d21-3e58-4f16-8a02-6d9e5c1b7f34"
  }
}
```

### `support.conversation.resolved`

A support conversation is marked resolved and leaves the open queue.

### When this fires

A conversation is marked resolved from the dashboard inbox, the REST API, Zapier, n8n, or the [`resolve_support_conversation`](https://docs.subscriby.net/mcp/v1/tools/support/resolve-support-conversation) MCP tool.

> Resolving is not closing. The thread and its full history are kept, and it reopens by itself the moment the member writes again, which raises `support.conversation.reopened`.

### Caveats

- Resolving does not notify the member. If you want them to know the matter is closed, send a reply before resolving.
- The event fires even if the conversation was already resolved. Deduplicate on `id`.
- A resolved conversation still counts toward the member's history and still appears under the **Resolved** tab in the inbox; it is filtered out of the open queue, not deleted.

### Related events

- `support.conversation.reopened`: what happens when the member writes back.
- `support.message.sent`: the reply that usually precedes resolving.

```json
{
  "id": "evt_01HX...",
  "type": "support.conversation.resolved",
  "created_at": "2026-08-20T10:12:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `support.conversation.reopened`

A resolved support conversation becomes active again.

### When this fires

A conversation that was `resolved` goes back to `open`. Two paths:

1. **The member writes again.** Their inbound message reopens the thread automatically, raising this event alongside `support.message.received`. This is the usual cause.
2. **A creator reopens it explicitly**: from the dashboard inbox, with `POST /v1/support/conversations/{id}/reopen`, with the `reopen_support_conversation` MCP tool, or through the Reopen Support Conversation action in Zapier and n8n.

It does **not** fire when:

- The member writes into a thread that is already `open`, `pending` or `snoozed`. Only a resolved thread reopens on inbound. A creator reopening a thread by hand fires the event whatever the thread's previous status was, including `open`.
- The member is **blocked**. A blocked contact's message is dropped and cannot push their thread back into the queue.
- The member edited an older message rather than sending a new one.

> The common path here is **not** a creator reopening a thread by hand; it is a member writing back after you resolved it. If you page an on-call rota on anything in this family, this is the event that catches the "we thought this was done" case.

### Caveats

- On the member-writes-back path this event and `support.message.received` fire for the same action. If you post to a channel on both, you will post twice; pick one as the trigger and enrich from the API.
- The payload does not say which path caused the reopen. Compare the newest message's `direction` over the API if it matters: `inbound` means the member came back, `outbound` or no new message means a creator reopened it by hand.
- `first_response_at` is **not** reset by a reopen. It is stamped once, for the first human reply ever in that thread, so SLA reporting across a reopen needs message timestamps rather than that field.

### Related events

- `support.conversation.resolved`: the state this event reverses.
- `support.message.received`: fires alongside on the member-writes-back path.

```json
{
  "id": "evt_01HX...",
  "type": "support.conversation.reopened",
  "created_at": "2026-08-20T14:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `support.conversation.blocked`

A creator silences a member's support messages.

### When this fires

A creator blocks the member behind a support conversation:

- **Dashboard**: **Block member** in the thread's header menu in the support inbox.
- **REST**: `POST /v1/support/conversations/{conversation}/block`.
- **MCP**: the `block_support_contact` tool.

It does **not** fire when:

- The conversation is already blocked. Blocking twice writes nothing the second time and emits nothing; the call is idempotent.
- A member is banned from the project. That is `member.banned`, a different mechanism that removes access rather than silencing a thread.
- The member's message is dropped because of rate limiting. Flood protection is automatic and raises no event.

> A block lives on the **conversation**, not the member. It silences their support traffic only: the member keeps their subscription, their access and every other interaction with the bot, and they are given no indication that anything changed.

### Caveats

- Blocking does not resolve the thread. Its `status` is whatever it was (`open`, `pending`, `snoozed` or `resolved`) and stays that way until someone changes it. If you keep a queue in sync, treat a blocked thread as one that will receive no new inbound messages, not as a closed one.
- From this moment the member's messages are dropped at ingestion. No `support.message.received` fires for them, and a blocked member's message cannot reopen a resolved thread, so no `support.conversation.reopened` fires either.
- The block is scoped to this thread. There is one conversation per member per channel, so a member who also writes in over another channel has a separate thread with its own block state.
- The member's history is untouched. Every message they sent before the block stays readable over the API and in the dashboard.

### Related events

- `support.conversation.unblocked`: the block is lifted.
- `support.message.received`: what stops arriving for this member while the block is in place.
- `member.banned`: removing a member's access, which is not what a block does.

```json
{
  "id": "evt_01HX...",
  "type": "support.conversation.blocked",
  "created_at": "2026-09-06T09:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `support.conversation.unblocked`

A creator lets a silenced member's support messages through again.

### When this fires

A creator lifts the block on a support conversation:

- **Dashboard**: **Unblock member** in the thread's header menu in the support inbox.
- **REST**: `POST /v1/support/conversations/{conversation}/unblock`.
- **MCP**: the `unblock_support_contact` tool.

It does **not** fire when:

- The conversation was not blocked. Unblocking an unblocked thread writes nothing and emits nothing; the call is idempotent.
- A banned member is unbanned. That is `member.unbanned`; a ban and a support block are independent, and lifting one does not touch the other.

> Unblocking restores the flow of new messages. It does not replay anything the member sent while blocked; those messages were dropped at ingestion and are gone.

### Caveats

- The thread's `status` is unchanged by an unblock, exactly as it was by the block. A thread that was `resolved` when blocked is still `resolved` now; the member's next message will reopen it and raise `support.conversation.reopened` as usual.
- Nothing is replayed. If the member wrote in while blocked, those messages produced no `support.message.received` and never will.
- The payload does not say how long the block lasted. Pair this event's `created_at` with the matching `support.conversation.blocked` by `conversation_id` if you report on it.

### Related events

- `support.conversation.blocked`: the state this event reverses.
- `support.conversation.reopened`: what the member's next message may now trigger.

```json
{
  "id": "evt_01HX...",
  "type": "support.conversation.unblocked",
  "created_at": "2026-09-06T11:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `support.message.received`

A member sends a message into a support conversation.

### When this fires

Every time a member sends an inbound message that lands in the support inbox, including the very first one, which also raises `support.conversation.opened`.

This is the workhorse of the family. If you are routing member questions into a helpdesk, an ops channel or an on-call rota, this is the event to subscribe to.

It does **not** fire when:

- The text was a recognised bot command, or an answer the bot was waiting for mid-setup.
- The member is blocked. Their messages are dropped without a trace in the inbox.
- The member has tripped the inbound rate limit. Excess messages are dropped silently rather than queued.
- The member **edited** an earlier message. The stored message is updated in place and no new event fires.

> The message body is **not** in the payload. Webhook deliveries are logged and retried, and member text does not belong in a delivery log. Fetch it with [the conversation messages endpoint](https://docs.subscriby.net/api/v1/reference/support-inbox).

### Caveats

- **No body, no name, no file ids.** Everything human-readable is behind the API on purpose. Platform file ids are effectively credentials for downloading the file and are never sent in a webhook.
- An **album** (several photos sent together) arrives as one event per part, each with its own `message_id`. They share a `media_group_id` visible through the API, not in the payload.
- A captioned photo has `type: "photo"`, and the caption is the message body; it is not a separate text message.
- A caption that starts with `/` is parsed as a bot command upstream and never reaches the inbox.

### Related events

- `support.conversation.opened`: fires alongside on the member's first message.
- `support.message.sent`: your side of the exchange.
- `support.conversation.reopened`: fires alongside when the message revives a resolved thread.

```json
{
  "id": "evt_01HX...",
  "type": "support.message.received",
  "created_at": "2026-08-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "message_id": "6c18f7a3-2e95-4d60-b47a-c093e5182b7f",
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "type": "text",
    "has_attachments": false
  }
}
```

### `support.message.sent`

A reply to a member is recorded and queued for delivery.

### When this fires

A creator or team member replies to a member, from any surface: the dashboard inbox, the relay DM on the connector, the REST API, or the [`reply_support_conversation`](https://docs.subscriby.net/mcp/v1/tools/support/reply-support-conversation) MCP tool.

It does **not** fire when:

- The reply was recorded as an **internal note**. Notes are private remarks for your team, are never delivered to the member, and raise no event.
- An automated acknowledgement goes out. The project's auto-reply is a system message, not a creator reply.

> This fires when the reply is **recorded and queued**, not when the member receives it. Delivery happens on a queue and can still fail; a member who has blocked the bot is unreachable. Read `delivery_status` from the support API for the outcome.

### Caveats

- The payload does not say **who** replied. Read `author_user_id` from [the conversation messages endpoint](https://docs.subscriby.net/api/v1/reference/support-inbox) if you need to attribute it to a specific team member.
- The member sees the reply prefixed with the project's support name, so it reads as coming from a person rather than from the bot. That prefix is added at delivery and is not part of the stored body.
- Pairing this with `support.message.received` gives you first-response time. The conversation's own `first_response_at` is stamped only once, on the first human reply, which is the more reliable SLA measure.

### Related events

- `support.message.received`: the member's side.
- `support.conversation.resolved`: usually the next step after a reply.

```json
{
  "id": "evt_01HX...",
  "type": "support.message.sent",
  "created_at": "2026-08-20T10:07:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "message_id": "6c18f7a3-2e95-4d60-b47a-c093e5182b7f",
    "conversation_id": "9e042b6f-5d81-4c37-a920-7b3e18cf6d45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "type": "text"
  }
}
```

### `support.canned_reply.created`

A saved reply is added to a project's support inbox.

### When this fires

A creator saves a new reusable reply on a project:

- **Dashboard**: **Saved Replies → Add Reply** from the support inbox.
- **REST**: `POST /v1/projects/{project}/support/canned-replies`.
- **MCP**: the `create_canned_reply` tool.

It does **not** fire when:

- A saved reply is inserted into a conversation. Using a snippet is just composing a message; the reply that goes out raises `support.message.sent` like any other.
- The save is rejected. A duplicate `shortcut` on the same project, or a body outside its limits, fails validation and writes nothing.

> The dashboard calls these **Saved Replies**; the event keeps the `canned_reply` name. The snapshot carries the snippet's title, shortcut and position but **never its body**. Fetch that with [the canned reply endpoint](https://docs.subscriby.net/api/v1/reference/support-inbox) if you mirror the picker somewhere else.

### Caveats

- The `body` is the one thing a consumer usually wants and the one thing not sent. This matches the family rule that no `support.*` payload carries message text; read it over the API.
- `shortcut` is unique per project, so it doubles as a stable handle for the snippet in a mirror, but it is optional and editable, so key on `id`.
- `sort_order` is not a dense sequence. Several snippets can share a value; the dashboard orders ties by creation.

### Related events

- `support.canned_reply.updated`: the snippet is reworded, given a new shortcut or moved.
- `support.canned_reply.deleted`: the snippet is removed from the picker.

```json
{
  "id": "evt_01HX...",
  "type": "support.canned_reply.created",
  "created_at": "2026-09-06T09:40:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "canned_reply": {
      "id": "c2f8e6a1-7d34-4b9e-a05c-3e1f9b7d2a68",
      "title": "Opening hours",
      "shortcut": "hours",
      "sort_order": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

### `support.canned_reply.updated`

A saved reply's title, body, shortcut or position changes.

### When this fires

A creator edits an existing saved reply and at least one of `title`, `body`, `shortcut` or `sort_order` is different afterwards:

- **Dashboard**: **Saved Replies → edit → Update Reply** from the support inbox.
- **REST**: `PATCH /v1/projects/{project}/support/canned-replies/{reply}`. Fields you omit keep their stored value.
- **MCP**: the `update_canned_reply` tool.

It does **not** fire when:

- Nothing changed. The action compares before and after and skips the event when the two match.
- The snippet is inserted into a conversation. Using a saved reply is composing a message, and the message raises `support.message.sent`.
- The edit is rejected (a `shortcut` already used by another snippet on the project, or a body outside its 2–4000 character limits): nothing is written.

> One save is one event, and `changes` lists only the fields that actually differ. A save that changes nothing (the dashboard's **Update Reply** with no edits, or a `PATCH` that re-sends the stored values) emits nothing.

### Caveats

- The snapshot never carries the body, but `changes.body` does when the body is what changed: `from` and `to` hold the full old and new text. This is the creator's own template text, not a member's message, so the family's rule that member text never enters a delivery log still holds. If you would rather not receive it, it only appears on edits to the body itself.
- `changes` can report `body`, which the snapshot omits, and the snapshot carries `id`, which `changes` never does. Use both halves: `canned_reply` for the current state, `changes` for what to diff.
- Reordering snippets in the dashboard can raise one event per snippet whose `sort_order` moved. Expect a burst with `changes: { sort_order: … }` and nothing else.

### Related events

- `support.canned_reply.created`: the snippet's first appearance.
- `support.canned_reply.deleted`: its removal.

```json
{
  "id": "evt_01HX...",
  "type": "support.canned_reply.updated",
  "created_at": "2026-09-06T09:45:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "canned_reply": {
      "id": "c2f8e6a1-7d34-4b9e-a05c-3e1f9b7d2a68",
      "title": "Opening hours",
      "shortcut": "open",
      "sort_order": 1
    },
    "changes": {
      "shortcut": {
        "from": "hours",
        "to": "open"
      }
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

### `support.canned_reply.deleted`

A saved reply is removed from a project's support inbox.

### When this fires

A creator removes a saved reply from a project:

- **Dashboard**: the delete action on a snippet under **Saved Replies** in the support inbox.
- **REST**: `DELETE /v1/projects/{project}/support/canned-replies/{reply}`.
- **MCP**: the `delete_canned_reply` tool.

It does **not** fire when:

- The snippet was already gone. A second delete writes nothing and emits nothing.
- A message composed from the snippet is deleted or edited in a conversation. The saved reply is a template; what was sent is a separate message with its own lifecycle.
- The project itself is deleted. Its snippets go with it under `project.deleted` without a per-snippet event.

> This is the final event for the given `canned_reply.id`. The snapshot is taken just before the row goes, so the payload still names what disappeared even though the canned reply endpoint now returns `404`.

### Caveats

- The body is gone with the row and was never in any event, so a mirror that wants to keep the text must have fetched it while the snippet existed.
- The freed `shortcut` can be reused by a new snippet straight away. Key a mirror on `id`, not on the shortcut.
- Remaining snippets are not renumbered. Their `sort_order` values are unchanged and no `updated` events follow a delete.

### Related events

- `support.canned_reply.created`: the snippet's first appearance.
- `support.canned_reply.updated`: edits between creation and this event.

```json
{
  "id": "evt_01HX...",
  "type": "support.canned_reply.deleted",
  "created_at": "2026-09-06T09:50:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "canned_reply": {
      "id": "c2f8e6a1-7d34-4b9e-a05c-3e1f9b7d2a68",
      "title": "Opening hours",
      "shortcut": "open",
      "sort_order": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

### `support.settings.updated`

A project's support inbox settings change.

### When this fires

A creator saves the project's support settings and at least one of the five visible settings is different afterwards:

- **Dashboard**: **Support Settings → Save** from the support inbox.
- **REST**: `PATCH /v1/projects/{project}/support/settings`. Fields you omit keep their stored value.
- **MCP**: the `update_support_settings` tool.

It does **not** fire when:

- Nothing changed. Saving the form untouched, or a `PATCH` that re-sends the stored values, writes nothing and emits nothing. Blank strings normalise to `null` before the comparison, so clearing an already-empty `agent_name` is not a change.
- The bot links or unlinks the relay chat. That handshake changes the relay chat id, which is not one of the five settings this event covers.
- A member's message is auto-acknowledged. Sending the `auto_reply` text is a message, not a settings change, and raises nothing in this family.

> The relay chat id (the chat or forum group the bot forwards member messages to) is **never** in this payload. It is an identifier the bot's linking handshake writes, not a setting a creator types, and no surface can change it through this path.

### Caveats

- Subscribing needs `support-conversation:view`, but **making** the change needs the project update permission (`project:update` on a token), because the settings are columns on the project rather than on the inbox. A token that can read support threads can hear about settings changes it could not have made.
- `settings` is always the full post-save state, even when only one key changed. You can overwrite a cached copy wholesale and use `changes` purely for "what to announce".
- `auto_reply` is creator-authored template text and does appear in both `settings` and `changes`; it is the message members receive, not a message a member sent, so the family's rule about member text is intact.
- Switching `relay_mode` to `forum_group` does not by itself link a group. The project bot links a group when the creator adds it to a supergroup with Topics enabled as an administrator, and confirms by DM; until that happens, notifications have nowhere to go and member messages reach only the dashboard inbox.

### Related events

- `support.conversation.opened`: the traffic these settings govern.
- `project.updated`: other project-level edits, which never include the support columns.

```json
{
  "id": "evt_01HX...",
  "type": "support.settings.updated",
  "created_at": "2026-09-06T10:02:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "settings": {
      "enabled": true,
      "relay_mode": "owner_dm",
      "agent_name": "Team Research Premium",
      "auto_reply": null,
      "notify_email": false
    },
    "changes": {
      "relay_mode": {
        "from": "none",
        "to": "owner_dm"
      },
      "agent_name": {
        "from": null,
        "to": "Team Research Premium"
      }
    }
  }
}
```

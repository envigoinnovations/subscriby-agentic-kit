# Tools: Support Inbox

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_support_conversations` | read | `support-conversation:view-any` | Lists member support conversations, newest activity first. |
| `get_support_conversation` | read | `support-conversation:view` | Reads one support conversation with its message history and the member context a reply needs: subscription status, current plan, member-since date and how many messages they have sent. |
| `reply_support_conversation` | additive | `support-conversation:update` | Sends a reply to a member in a support conversation. |
| `resolve_support_conversation` | destructive | `support-conversation:update` | Marks a support conversation resolved, clearing it from the open queue and emitting support.conversation.resolved. |
| `reopen_support_conversation` | destructive | `support-conversation:update` | Puts a resolved support thread back in the open queue so it shows in the creator's triage list again. |
| `assign_support_conversation` | destructive | `support-conversation:update` | Hands a support thread to one team member, or takes it back off everyone. |
| `block_support_contact` | destructive | `support-conversation:update` | Drops every further support message from the member behind a thread; they get no indication they were blocked and cannot reopen the thread by writing again. |
| `unblock_support_contact` | destructive | `support-conversation:update` | Lets the member behind a support thread write in again after `block_support_contact`. |
| `list_canned_replies` | read | `support-canned-reply:view-any` | Lists a project's saved support replies in the order the creator arranged them. |
| `get_canned_reply` | read | `support-canned-reply:view-any` | Fetches one saved support reply by UUID. |
| `create_canned_reply` | additive | `support-canned-reply:create` | Saves a reusable support reply on a project. |
| `update_canned_reply` | destructive | `support-canned-reply:update` | Changes one or more fields of a saved support reply; anything you omit keeps its stored value. |
| `delete_canned_reply` | destructive | `support-canned-reply:delete` | Removes a saved support reply from a project's picker. |
| `get_support_settings` | read | `project:view` | Reads a project's support inbox settings: whether member support is `enabled`, the `relay_mode` (`owner_dm` forwards each thread to the creator on their connector, `forum_group` opens each thread as a topic in the linked group, `none` keeps it in the dashboard inbox only), the `agent_name` shown to members, the `auto_reply` sent on a new thread, whether `notify_email` is on, and the two Copilot switches: `copilot_answers` (the Copilot answers members in the inbox and the project bot) and `copilot_portal` (and in a chat on the portal page). |
| `update_support_settings` | destructive | `project:update` | Changes a project's support inbox settings; anything you omit keeps its stored value. |

## `list_support_conversations`

Read · requires `support-conversation:view-any`

Lists member support conversations, newest activity first. Filters: `project_id`, `status` (`open`, `pending`, `snoozed`, `resolved`), `assigned_to` (user UUID), and `unread_only`. Paginates with `limit` (1..100) and `page`. Each row carries the member name and the last message time so a triage pass needs no follow-up calls. PII WARNING: member names are returned verbatim — scrub before forwarding anywhere outside this conversation. Use get_support_conversation for the message history.

**Arguments**

- `project_id` (string): Optional project UUID to narrow the result.
- `status` (one of `open`, `pending`, `snoozed`, `resolved`): Conversation status filter. One of: open, pending, snoozed, resolved
- `assigned_to` (string): Only conversations assigned to this team-member user UUID.
- `unread_only` (boolean): Only conversations with messages the creator has not opened.
- `limit` (integer): Maximum conversations to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_support_conversation`

Read · requires `support-conversation:view`

Reads one support conversation with its message history and the member context a reply needs: subscription status, current plan, member-since date and how many messages they have sent. Requires `conversation_id`. `message_limit` caps the history (default 50, max 200, newest last). Internal notes are excluded unless `include_internal` is true, which also requires the support-conversation:update ability — they are private remarks about the member. Attachments are described without their platform file ids, which are credentials. PII WARNING: names, emails and message bodies are returned verbatim.

**Arguments**

- `conversation_id` (string, required): UUID of the support conversation to read.
- `message_limit` (integer): How many of the most recent messages to return (1..200, default 50). Returned oldest-first.
- `include_internal` (boolean): Include creator-only internal notes. Requires the support-conversation:update ability.

## `reply_support_conversation`

Additive · requires `support-conversation:update`

Sends a reply to a member in a support conversation. THIS MESSAGE REACHES A REAL PERSON on their connector — confirm the wording with the creator before calling, and never invent facts about their subscription, refunds or access. Requires `conversation_id` and `body` (max 4000 characters). Set `internal` to true to record a private note for the creator instead, which is never delivered to the member. The reply is prefixed with the project support name so the member sees a human, not the bot. Delivery is queued: a success here means recorded and queued, not yet received.

**Arguments**

- `conversation_id` (string, required): UUID of the support conversation to reply in.
- `body` (string, required): The reply text, max 4000 characters. Reaches the member verbatim.
- `internal` (boolean): Record a creator-only note instead of sending to the member.
- `reply_to_message_id` (string): Optional. UUID of a message in this same conversation to quote above the reply, the way a chat client shows a threaded reply.

## `resolve_support_conversation`

Destructive · requires `support-conversation:update`

Marks a support conversation resolved, clearing it from the open queue and emitting support.conversation.resolved. Requires `conversation_id`. Not destructive: the thread and its history are kept, and it reopens by itself the moment the member writes again. Resolve only what has actually been answered — a resolved thread stops showing in the creator triage list.

**Arguments**

- `conversation_id` (string, required): UUID of the support conversation to resolve.

## `reopen_support_conversation`

Destructive · requires `support-conversation:update` · idempotent

Puts a resolved support thread back in the open queue so it shows in the creator's triage list again. Requires `conversation_id`. The reverse of `resolve_support_conversation`; a member writing again reopens the thread by itself, so call this only when the creator wants to follow up first. Idempotent — an already-open thread is a no-op. Emits `support.conversation.reopened`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `conversation_id` (string, required): UUID of the support conversation to reopen.

## `assign_support_conversation`

Destructive · requires `support-conversation:update` · idempotent

Hands a support thread to one team member, or takes it back off everyone. Requires `conversation_id`; `assignee_user_id` is the UUID of the project owner or a member of the project's team, or null to unassign. Any other user is refused with `VALIDATION_FAILED`. Idempotent — assigning the same person again is a no-op. Emits `support.conversation.assigned`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `conversation_id` (string, required): UUID of the support conversation to assign.
- `assignee_user_id` (string): UUID of the project owner or a team member to hand the thread to. Omit or pass null to unassign.

## `block_support_contact`

Destructive · requires `support-conversation:update` · idempotent

Drops every further support message from the member behind a thread; they get no indication they were blocked and cannot reopen the thread by writing again. Requires `conversation_id`. DESTRUCTIVE: you MUST confirm the target `conversation_id` with a human before calling — this silences a real person. Their subscription and access are untouched; to remove access call `kick_member` or `ban_member`. Reverse it with `unblock_support_contact`. Emits `support.conversation.blocked` when the block is placed. Idempotent — an already-blocked member is a no-op and emits nothing. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `conversation_id` (string, required): UUID of the support conversation whose member to block.

## `unblock_support_contact`

Destructive · requires `support-conversation:update` · idempotent

Lets the member behind a support thread write in again after `block_support_contact`. Requires `conversation_id`. Messages dropped while blocked are gone; only new ones arrive. Emits `support.conversation.unblocked` when the block is lifted. Idempotent — a member who is not blocked is a no-op and emits nothing. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `conversation_id` (string, required): UUID of the support conversation whose member to unblock.

## `list_canned_replies`

Read · requires `support-canned-reply:view-any`

Lists a project's saved support replies in the order the creator arranged them. Requires `project_id`. Each row carries the `shortcut` a creator types in the thread composer to pull the snippet in and its `sort_order`. Use before `reply_support_conversation` to answer with the creator's own wording. Unknown, foreign or out-of-scope project ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose saved replies to list.

## `get_canned_reply`

Read · requires `support-canned-reply:view-any`

Fetches one saved support reply by UUID. Requires `project_id` and `canned_reply_id`. Same row shape as `list_canned_replies`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the snippet belongs to.
- `canned_reply_id` (string, required): UUID of the saved reply to fetch.

## `create_canned_reply`

Additive · requires `support-canned-reply:create` · open world

Saves a reusable support reply on a project. Requires `project_id`, `title` (2..80 chars) and `body` (2..4000 chars); optional `shortcut` (letters, numbers, dashes and underscores, up to 30, unique within the project — the slash-command a creator types to pull the snippet in) and `sort_order` (0..999, the position in the picker). Emits `support.canned_reply.created`. Refused with `VALIDATION_FAILED` per field. Unknown, foreign or out-of-scope project ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the snippet belongs to.
- `title` (string, required): Short label shown in the picker, 2 to 80 characters.
- `body` (string, required): The reply text, 2 to 4000 characters.
- `shortcut` (string): Slash-command a creator types to insert the snippet: letters, numbers, dashes and underscores, up to 30 characters, unique within the project.
- `sort_order` (integer): Position in the picker, 0 to 999. Defaults to 0.

## `update_canned_reply`

Destructive · requires `support-canned-reply:update` · idempotent · open world

Changes one or more fields of a saved support reply; anything you omit keeps its stored value. Requires `project_id` and `canned_reply_id`. Optional: `title` (2..80 chars), `body` (2..4000 chars), `shortcut` (letters, numbers, dashes and underscores, up to 30, unique within the project; null clears it) and `sort_order` (0..999). Emits `support.canned_reply.updated` with the changed fields. Refused with `VALIDATION_FAILED` per field. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the snippet belongs to.
- `canned_reply_id` (string, required): UUID of the saved reply to change.
- `title` (string): New label, 2 to 80 characters.
- `body` (string): New reply text, 2 to 4000 characters.
- `shortcut` (string): New slash-command, unique within the project. Pass null to clear it.
- `sort_order` (integer): New position in the picker, 0 to 999.

## `delete_canned_reply`

Destructive · requires `support-canned-reply:delete` · idempotent

Removes a saved support reply from a project's picker. Requires `project_id` and `canned_reply_id`. DESTRUCTIVE: you MUST confirm the target `canned_reply_id` with a human before calling. Replies already sent with the snippet are untouched. Emits `support.canned_reply.deleted`. Idempotent — an already-deleted id surfaces as `RESOURCE_NOT_FOUND`, exactly as an unknown or out-of-scope id does.

**Arguments**

- `project_id` (string, required): UUID of the project the snippet belongs to.
- `canned_reply_id` (string, required): UUID of the saved reply to remove.

## `get_support_settings`

Read · requires `project:view`

Reads a project's support inbox settings: whether member support is `enabled`, the `relay_mode` (`owner_dm` forwards each thread to the creator on their connector, `forum_group` opens each thread as a topic in the linked group, `none` keeps it in the dashboard inbox only), the `agent_name` shown to members, the `auto_reply` sent on a new thread, whether `notify_email` is on, and the two Copilot switches: `copilot_answers` (the Copilot answers members in the inbox and the project bot) and `copilot_portal` (and in a chat on the portal page). Requires `project_id`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose support settings to read.

## `update_support_settings`

Destructive · requires `project:update` · idempotent · open world

Changes a project's support inbox settings; anything you omit keeps its stored value. Requires `project_id`. Optional: `enabled`, `relay_mode` (`owner_dm`, `forum_group` or `none`; other values are refused; `forum_group` starts relaying once the project bot has been added to a Topics-enabled group as an administrator), `agent_name` (up to 60 chars, null to clear), `auto_reply` (up to 1000 chars, null to clear), `notify_email`, `copilot_answers` (Subscriby Copilot answers members' own-subscription questions and what the Knowledge covers in the inbox and the project bot, marked as automated) and `copilot_portal` (the same Copilot in a chat on the portal page). Emits `support.settings.updated` with the changed fields. Refused with `VALIDATION_FAILED` per field. Turning support off stops new member threads reaching the inbox; existing threads are kept. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose support settings to change.
- `enabled` (boolean): Whether members can open support threads with the bot.
- `relay_mode` (string): Where new threads go besides the dashboard inbox: "owner_dm" forwards them to the creator on their connector, "forum_group" opens each thread as a topic in the group the project bot administers, "none" keeps them in the inbox only.
- `agent_name` (string): The name members see on replies, up to 60 characters. Pass null to use the project name.
- `auto_reply` (string): The message sent automatically when a member opens a thread, up to 1000 characters. Pass null for none.
- `notify_email` (boolean): Whether the creator is emailed about new threads.
- `copilot_answers` (boolean): Whether Subscriby Copilot answers members' own-subscription questions and what the project's Knowledge covers in the inbox and the project bot, marked as automated.
- `copilot_portal` (boolean): Whether a signed-in member finds the Copilot in a chat on the portal page.

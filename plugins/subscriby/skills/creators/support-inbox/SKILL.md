---
name: support-inbox
description: "This skill should be used when the user asks about member messages, the support inbox or a conversation, to triage, reply, resolve, reopen, assign or block, to manage saved replies, or to change the inbox settings, including whether Subscriby Copilot may answer members in the inbox or on the portal."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# The support inbox

Anything a member sends the project's bot that is not a command, an access code or an answer the bot was waiting for lands in the support inbox: text, photos, voice notes, documents. There is one conversation per member per channel, a chat thread rather than a ticket: resolving clears it from the open queue, and the thread reopens by itself when the member writes again. The inbox is on by default on any project with a connected bot.

A reply reaches a real person in their chat, prefixed with the project's display name. Confirm the exact wording with the user before `reply_support_conversation`, and never assert anything about the member's subscription that a tool did not answer.

## Triage

- `list_support_conversations` pages conversations across projects or for one `project_id`, with `status` (`open`, `pending`: waiting on the member, `snoozed`, `resolved`), `assigned_to`, `unread_only`. Newest activity first.
- `get_support_conversation` reads one thread (`message_limit`, `include_internal` for the team's notes), with the member's standing: status, plan, member since, how many times they wrote.
- The member behind a thread is the `members` skill's `get_subscriber`; a billing question is answered from the `subscriptions-and-payments` reads, never from memory.

## Answering

- `reply_support_conversation` with `body` sends the reply (optionally `reply_to_message_id`); with `internal` true it records a note that is never delivered to the member, raises no webhook and is readable only by a credential that can write to conversations.
- `resolve_support_conversation` clears a thread; `reopen_support_conversation` brings it back; `assign_support_conversation` hands it to a teammate (`assignee_user_id`; advisory, anyone may still reply; empty clears the assignment).
- `block_support_contact` drops a member's future messages silently (history kept, no indication to them); `unblock_support_contact` releases them. Both are destructive: confirm.
- A reply can fail: **unreachable** means the member blocked the bot and a retry cannot help; **failed** is retried by Subscriby before it is marked so.

Saved replies for the questions answered constantly: `list_canned_replies`, `get_canned_reply`, `create_canned_reply` (`title`, `body`, `shortcut`, `sort_order`), `update_canned_reply`, `delete_canned_reply`. Read one and adapt it rather than retyping the same answer.

## Settings

`get_support_settings` and `update_support_settings` carry the inbox's switches per project:

- `enabled`: the inbox itself; off sends unrecognised messages back to the bot's "I can't understand" reply.
- `relay_mode`: how the creator is told, a direct message from the platform bot (one per conversation per five minutes), a group with topics (one topic per member, anyone in the group answers), or the dashboard only.
- `agent_name`: the display name on replies (up to 60 characters; defaults to the project name).
- `auto_reply`: an automatic acknowledgement (up to 1,000 characters), sent at most once an hour per conversation; empty for none.
- `notify_email`: an email beside the bot's message.
- `copilot_answers`: lets Subscriby Copilot answer a member's question about their own subscription, or one the project's Knowledge marked for members covers, at once and marked as automated; anything else waits for a person.
- `copilot_portal`: lets a signed-in member ask the Copilot on the portal page from their own subscription and the members' Knowledge.

Changing a Copilot switch is a product decision with a cost per answer; state what it does before confirming it. In the dashboard the ✨ button drafts a suggested reply from the thread, the member's standing, the saved replies and Knowledge for $0.05 of Copilot Credits; that draft is the creator's to send, and no tool sends a draft on its own.

## Do not

- Do not reply with a guess about a refund, a renewal date or a failed payment: read the subscription first.
- Do not resolve a thread the member is still waiting on an answer to.
- Do not block on a single angry message; blocking is silent and permanent until undone.
- Do not forward a member's message or attachment anywhere outside the conversation.

## References

- [references/tools.md](references/tools.md): the fifteen tools with their arguments.
- [references/events.md](references/events.md): the `support.*` events (bodies are never in a payload; fetch them over the API).
- [references/endpoints.md](references/endpoints.md): the REST twins for conversations, saved replies and settings.
- [references/abilities.md](references/abilities.md): the `support` abilities.
- Documentation: [Support inbox](https://docs.subscriby.net/creators/support-inbox), [Copilot in your inbox](https://docs.subscriby.net/copilot/in-your-inbox), [contacting support, the member's side](https://docs.subscriby.net/subscribers/contacting-support).

---
name: broadcasts
description: "This skill should be used when the user asks to send a message, announcement or reminder to members, a segment, a plan's members, pass holders or people whose access is expiring, to preview who a broadcast reaches, to read a broadcast's history or who it missed, or to retry or resend one."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Broadcasts

A broadcast is one message sent from the project's bot to a segment of its members, queued and delivered in the background, paced inside the platform's limits. It reaches a member only if they have a chat with the project's currently connected bot; a member who bought on the portal and never opened the bot is neither counted nor attempted. The recipient count is the result of the exact query the send runs, so the people counted and the people messaged are the same set.

Every broadcast reaches real people. The order is always: read the audiences, preview the count, confirm the exact wording and the count with the user, send once.

## Audiences

`list_broadcast_audiences` answers every segment the project accepts with its value, label, meaning, whether it needs a pass window, whether it can be narrowed to a plan, whether it reads the expiring horizon, and a recipient estimate. The segments:

- **Member segments**, on the person's status: all users, customers only, trialing users, leads, churned users.
- **Subscription segments**, on the purchase: expiring soon (within a horizon of 7, 14 or 30 days; an auto-renewing member is never expiring, only one who turned renewal off or holds a plan that does not renew), cancelled but still inside their period, paused subscriptions, trialing without a card, waiting on a connection.
- **Pass segments** (need the Passes capability): all active pass holders, all active pass holders not in queue, active pass holders of one window, active pass holders of one window not in queue. "Active" means the pass can still deliver access; "not in queue" means the holder has not tapped their invite link yet. Every-window and single-window are different sends: a "doors open in an hour" message goes to one window, never to next week's holders.
- **Narrow to a plan** (`plan_id`) composes with a segment: customers of Gold, churned from Gold (a retired plan stays selectable on purpose). Not offered for leads or the pass segments.

## Sending

1. `preview_broadcast_audience` with `audience` and, where the segment needs it, `pass_window_id`, `plan_id` or `expiring_within_days` sizes the send without sending; omit `audience` to list every segment with its count. A zero count means there is nothing to send.
2. Show the user the message text and the count, and wait for a yes. A segment that silently resolves to every member is the one mistake a broadcast cannot take back.
3. `broadcast_message` with the same arguments and `message` (up to 4,096 characters). It answers the broadcast row with its id; delivery continues in the background.

On Telegram the message arrives in each member's chat with the bot. On Discord it is posted once in the announcement channel mentioning the plans' roles, or sent as direct messages, as the installation's settings say. For nudging pass holders about their invite link specifically, `remind_pass_window_queue` and `remind_pass_holder` in `plans-and-passes` carry the link; a broadcast is for anything else.

## History and retries

- `list_broadcasts` pages the project's broadcasts newest first (`filter` `sending`, `completed` or `failed`; `status` for one exact status), each with who sent it and from where, the audience, the tallies and `progress.line`, the sentence the creator reads.
- `get_broadcast` reads one with its failures by kind and the first fifty members it could not reach, each with the connector's reason.
- `retry_broadcast` sends a finished broadcast again to the members it could not reach and nobody else, as a new broadcast under the old one; refused while the parent is still sending, when it missed nobody, or when none of the missed can be reached now. Confirm it like a send.

`broadcast.queued` fires when the send begins (with `recipient_estimate`) and `broadcast.completed` with the tallies; the message body is never in a payload. The creator is told once when it finishes.

## Do not

- Do not send without the preview count in front of the user, and never guess a segment value: read `list_broadcast_audiences`.
- Do not pick the every-window segment for a message about one date.
- Do not repeat a send to the same audience to "make sure"; read the history and retry the missed instead.
- Do not put a member's personal data in a broadcast.

## References

- [references/tools.md](references/tools.md): the six tools with their arguments.
- [references/events.md](references/events.md): `broadcast.queued` and `broadcast.completed`.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/broadcasts`.
- [references/abilities.md](references/abilities.md): `broadcast:send` and `broadcast:read`.
- Documentation: [Broadcasts](https://docs.subscriby.net/creators/broadcasts).

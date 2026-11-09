# REST endpoints: REST API, the `support-settings` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `support-settings`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/support/settings` | `project:view` | Get a project's support settings | `get_support_settings` |
| PATCH | `/v1/projects/{project}/support/settings` | `project:update` | Update a project's support settings | `update_support_settings` |

### GET `/v1/projects/{project}/support/settings`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/support/settings \
  -H "Authorization: Bearer <token>"
```

| Field          | Type           | Notes                                                                                                                                          |
| -------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`      | boolean        | Whether a member's unrecognised message to the bot opens a conversation. Off stops **new** threads reaching the inbox; existing ones are kept. |
| `relay_mode`   | string         | `owner_dm`: the platform bot messages the project owner with an inline Reply button. `forum_group`: each conversation is mirrored into its own topic of a group the bot administers. `none`: the dashboard inbox is the only surface. |
| `agent_name`   | string or null | The name outbound replies are prefixed with so they read as coming from a person. `null` falls back to the project's default.                  |
| `auto_reply`   | string or null | Sent to a member on their first message in a thread. `null` sends nothing.                                                                     |
| `notify_email` | boolean        | Whether the creator is emailed about new support activity.                                                                                     |
| `copilot_answers` | boolean | Whether Subscriby Copilot answers members' own-subscription questions and what the project's Knowledge covers in the inbox and the project bot, marked as automated; everything else still waits for a person. |
| `copilot_portal` | boolean | Whether a signed-in member finds the same Copilot in a chat on the project's portal page. |

The keys drop the `support_` prefix the columns carry: on this endpoint everything is about support.

> **The relay chat id is never exposed.** The chat the `owner_dm` relay posts to, and the group `forum_group` mirrors into, are identifiers the bot handshake writes, not settings. They do not appear here and cannot be set from here.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PATCH `/v1/projects/{project}/support/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/support/settings \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "relay_mode": "owner_dm",
    "auto_reply": "Thanks, a person will reply within a day."
  }'
```

Answers `200` with the complete settings after the change. **Every field is optional and an omitted one keeps its stored value**, so the request above changes the relay and the auto-reply and leaves `enabled`, `agent_name` and `notify_email` alone. `support.settings.updated` fires only when at least one value actually changed, with the full settings and a `changes` map; a `PATCH` that resends the current values changes nothing and raises nothing.

> **`forum_group` needs a group the bot can post into.** `forum_group` mirrors each member conversation into its own topic of a group with topics enabled. Switching the mode here does not link a group: the creator adds the project bot to such a group as an administrator (with permission to manage topics), the bot records the group itself and confirms by direct message. Until that happens, new member messages reach only the dashboard inbox. The group's id is never exposed by this endpoint.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `enabled` (boolean): Whether a member's unrecognised message to the bot opens a conversation.
- `relay_mode` (one of `owner_dm`, `forum_group`, `none`): `owner_dm`, `forum_group` or `none`. Switching to `forum_group` does not link a group: the creator adds the project bot to a group with topics enabled as an administrator, the bot records the group itself and confirms; until then new member messages reach only the dashboard inbox.
- `agent_name` (string): The name outbound replies are prefixed with, up to 60 characters; null or an empty string clears it. Whitespace is trimmed.
- `auto_reply` (string): The acknowledgement sent on a member's first message in a thread, up to 1,000 characters, well under the platform limit because it is sent with an identity header; null clears it.
- `notify_email` (boolean): Whether the creator is emailed about new support activity.
- `copilot_answers` (boolean): Whether Subscriby Copilot answers members' own-subscription questions and what the project's Knowledge covers in the inbox and the project bot, marked as automated; everything else still waits for a person.
- `copilot_portal` (boolean): Whether a signed-in member finds the same Copilot in a chat on the project's portal page.


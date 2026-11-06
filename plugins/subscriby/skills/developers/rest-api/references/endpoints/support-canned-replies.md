# REST endpoints: Rest api, the `support-canned-replies` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `support-canned-replies`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/support/canned-replies` | `support-canned-reply:view-any` | List a project's saved replies | `list_canned_replies` |
| POST | `/v1/projects/{project}/support/canned-replies` | `support-canned-reply:create` | Create a saved reply | `create_canned_reply` |
| DELETE | `/v1/projects/{project}/support/canned-replies/{reply}` | `support-canned-reply:delete` | Delete a saved reply | `delete_canned_reply` |
| GET | `/v1/projects/{project}/support/canned-replies/{reply}` | `support-canned-reply:view-any` | Get a saved reply | `get_canned_reply` |
| PATCH | `/v1/projects/{project}/support/canned-replies/{reply}` | `support-canned-reply:update` | Update a saved reply | `update_canned_reply` |

### GET `/v1/projects/{project}/support/canned-replies`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies \
  -H "Authorization: Bearer <token>"
```

Every snippet on the project in the creator's order (`sort_order` ascending). The set is small by design, so the list is not paginated.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### POST `/v1/projects/{project}/support/canned-replies`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Opening hours",
    "body": "We answer between 9 and 5, Monday to Friday.",
    "shortcut": "hours"
  }'
```

Answers `201` with the snippet and emits `support.canned_reply.created`.

> **A duplicate shortcut is a 422, not a second snippet.** Shortcuts are unique per project. Sending a shortcut another saved reply on the same project already uses is refused on `shortcut`. Two different projects may both have `hours`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string, required): The label shown in the picker, 2 to 80 characters; never sent to the member.
- `body` (string, required): The text sent to the member, 2 to 4,000 characters, the message ceiling the reply has to fit once it is sent.
- `shortcut` (string): Up to 30 letters, numbers, dashes and underscores, unique within the project (two projects may both have `hours`). Omit it, or send null or an empty string, for none. The character set means a shortcut can never be confused with a bot command or need escaping when echoed back.
- `sort_order` (integer): The position in the picker, 0 to 999. Defaults to 0.


### DELETE `/v1/projects/{project}/support/canned-replies/{reply}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies/$REPLY_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Returns `204 No Content`. The snippet leaves the picker; messages sent with it stay in their threads. Emits `support.canned_reply.deleted`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reply` (path, string, required): The snippet, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/support/canned-replies/{reply}`

One snippet. There is no `support-canned-reply:view`: a snippet is only ever read as part of the picker, so this route gates on `view-any` too. A reply is resolved **within the project**: another project's reply id is a `404 RESOURCE_NOT_FOUND`.

`shortcut` is `null` when the creator never set one; the snippet is then picked from the list rather than typed.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reply` (path, string, required): The snippet, resolved within the project.


### PATCH `/v1/projects/{project}/support/canned-replies/{reply}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/support/canned-replies/$REPLY_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"title": "Support hours"}'
```

Accepts the same fields as create, all optional. **An omitted field keeps its stored value**, so a snippet can be renamed without resending its body. Send `"shortcut": null` to clear the shortcut. The uniqueness check ignores the snippet being edited, so resending its own shortcut is fine.

Answers `200` with the updated snippet. Replies already sent with the old wording are untouched: a saved reply is copied into a message when it is used, not referenced. Emits `support.canned_reply.updated` only when something actually changed, with a `changes` map.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `reply` (path, string, required): The snippet, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string): The label shown in the picker, 2 to 80 characters.
- `body` (string): The text sent to the member, 2 to 4,000 characters. Replies already sent with the old wording are untouched: a saved reply is copied into a message when it is used, not referenced.
- `shortcut` (string): Up to 30 letters, numbers, dashes and underscores, unique within the project. Send null to clear it. The uniqueness check ignores the snippet being edited, so resending its own shortcut is fine.
- `sort_order` (integer): The position in the picker, 0 to 999.


# REST endpoints: Smart Links

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `links`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/links` | `project-link:view-any` | List a project's links | `list_links` |
| POST | `/v1/projects/{project}/links` | `project-link:create` | Create a link | `create_link` |
| GET | `/v1/projects/{project}/links/funnel` | `project-link:view-any` | The project's funnel | `get_link_funnel` |
| DELETE | `/v1/projects/{project}/links/{smartLink}` | `project-link:delete` | Archive a link | `archive_link` |
| GET | `/v1/projects/{project}/links/{smartLink}` | `project-link:view` | Get a link | `get_link` |
| PATCH | `/v1/projects/{project}/links/{smartLink}` | `project-link:update` | Change a link | `update_link` |
| GET | `/v1/projects/{project}/links/{smartLink}/funnel` | `project-link:view` | One link's funnel | `get_link_funnel` |

### GET `/v1/projects/{project}/links`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/links?archived=false&per_page=25&page=1" \
  -H "Authorization: Bearer sbt_..."
```

Pages the project's links, newest first, live and archived alike unless `archived` says otherwise; `search` finds links whose name or slug contains the text. Every row carries the three addresses in `urls`.

> `archived=false` keeps expired links too: they are still the creator's and still carry their figures. Read `state` on each row, which is `live`, `expired` or `archived`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `archived` (query, string): Keep only archived links (`true`) or only links still in use (`false`), expired ones included. Omit for every link.
- `search` (query, string): Find links whose name or slug contains this text, case-insensitively.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/links`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/links \
  -H "Authorization: Bearer sbt_..." \
  -H "Idempotency-Key: 6b1f0d2e-9c3a-4e8b-b2d1-7a9c5e3f1d04" \
  -H "Content-Type: application/json" \
  -d '{"name":"YouTube description","slug":"youtube","destination":"plan","plan_id":"0c9d8e7f-6a5b-4c3d-8e2f-1a2b3c4d5e6f"}'
```

Answers `201` with the new link, its code minted and its three addresses built. `destination` is `portal` (the portal home), `plan` (the checkout of one plan, which needs `plan_id`) or `bot` (the project's bot; the portal home when no bot is connected). `expires_at`, in the future, stops the link counting after that moment.

The slug is lowercased before it is stored and checked, so `Promo` when `promo` exists is `422 VALIDATION_FAILED`, not a second link; `go`, `embed`, `portal`, `bot`, `direct`, `new` and `edit` are reserved. Emits `link.created`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string, required): A creator-facing label, 2 to 120 characters, never shown to visitors; such as `YouTube description`.
- `slug` (string, required): The address segment after `/go/`: 2 to 32 letters, digits and hyphens, lowercased before it is stored and checked. Unique within the project; `go`, `embed`, `portal`, `bot`, `direct`, `new` and `edit` are reserved. Such as `youtube`.
- `destination` (one of `portal`, `plan`, `bot`, required): Where a Smart Link sends the person who follows it. The destination decides the redirect and the bot payload: the portal's plan list, the checkout of one plan, or a conversation with the project's bot. The click and the attribution are recorded the same way whichever it is, so a creator can move a link between destinations without losing its figures.
- `plan_id` (string): The plan a `plan` destination opens; one of this project's plans. Refused as meaningless on the other destinations.
- `expires_at` (string): When the link stops counting and crediting, ISO 8601, in the future. Omit for never; the address keeps landing on the portal home after it.


### GET `/v1/projects/{project}/links/funnel`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/links/funnel \
  -H "Authorization: Bearer sbt_..."
```

Every link, live and archived, each with its lifetime `clicks`, `leads` (the members it brought), `checkouts` (those who started a purchase, in any state), `paid` (those who made a successful payment), `conversion_rate` (paid per hundred clicks) and `revenue` (everything those members ever paid, per currency and restated in US dollars); the `direct` row for the members no link brought; and `totals`, which equal the project's own figures, so the rows add up.

> The figures are lifetime by design and count removed members and ended purchases, so two channels compare on everything each ever brought. The dashboard's date window never narrows them.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### DELETE `/v1/projects/{project}/links/{smartLink}`

Answers `204`. The address keeps landing on the portal home, so a flyer or a bio that carries it never shows anyone an error; the figures stay on the funnel; the link cannot be put back in use. Emits `link.archived` the first time; a second `DELETE` changes nothing and answers `204` again.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/links/{smartLink}`

One link with its plan's name loaded. A link of another project is `404 RESOURCE_NOT_FOUND`.

### Three fields that are easy to misread

**`urls.bot` is null without a bot.** The deep link exists only while the project runs a bot that hands out start links; the web address and the embed page are always there.

**`code` never changes, `slug` may.** Share `urls.web` where the slug is fine to change later; print `urls.bot` or a QR of `urls.web` and rely on the code, which survives every rename because the slug's redirect runs through the portal, where the code takes over.

**`clicks.total` is one per visitor address per hour.** A creator reading their own page a dozen times adds one, and no analytics cookie is set on a stranger.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/links/{smartLink}`

Any subset of the create shape; omitted fields keep their stored value. Renaming `slug` moves the web address and nothing else. `expires_at: null` clears an expiry. A `plan_id` is dropped when the destination stops being a plan. Emits `link.updated` with the fields that moved.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `name` (string): A new label, 2 to 120 characters.
- `slug` (string): A new address segment, 2 to 32 letters, digits and hyphens, lowercased before the uniqueness check against the project's other links; the old address stops answering.
- `destination` (one of `portal`, `plan`, `bot`): Where a Smart Link sends the person who follows it. The destination decides the redirect and the bot payload: the portal's plan list, the checkout of one plan, or a conversation with the project's bot. The click and the attribution are recorded the same way whichever it is, so a creator can move a link between destinations without losing its figures.
- `plan_id` (string): The plan a `plan` destination opens; one of this project's plans. Ignored when the destination is not, or stops being, a plan.
- `expires_at` (string): When the link stops counting, ISO 8601 and in the future, or null to run until archived.


### GET `/v1/projects/{project}/links/{smartLink}/funnel`

The same row for one link, under `data`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `smartLink` (path, string, required): The link, resolved within the project by the route binder.


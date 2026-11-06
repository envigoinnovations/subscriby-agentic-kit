# REST endpoints: Rest api, the `resources` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `resources`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/resources` | `project-resource:view-any` | List a project's resources | `list_resources` |
| POST | `/v1/projects/{project}/resources` | `project-resource:create` | Create a manual perk | `create_resource` |
| POST | `/v1/projects/{project}/resources/from-space` | `project-resource:create` | Sell a place picked from the connector's list | `create_resource_from_space` |
| POST | `/v1/projects/{project}/resources/link-requests` | `project-resource:create` | Request a place link | `request_resource_link` |
| DELETE | `/v1/projects/{project}/resources/{resource}` | `project-resource:delete` | Delete a resource | `delete_resource` |
| GET | `/v1/projects/{project}/resources/{resource}` | `project-resource:view` | Get a resource | `get_resource` |
| PATCH | `/v1/projects/{project}/resources/{resource}` | `project-resource:update` | Update a resource | `update_resource` |
| POST | `/v1/projects/{project}/resources/{resource}/activate` | `project-resource:update` | Activate a resource | `activate_resource` |
| POST | `/v1/projects/{project}/resources/{resource}/deactivate` | `project-resource:update` | Deactivate a resource | `deactivate_resource` |
| POST | `/v1/projects/{project}/resources/{resource}/unlink` | `project-resource:update` | Unlink a resource's place | `unlink_resource` |

### GET `/v1/projects/{project}/resources`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/resources?kind=telegram:channel" \
  -H "Authorization: Bearer <token>"
```

Newest first, paged with `page` and `per_page`, sortable with `sort_by` (`created_at`, `kind`, `title`, `active`) and `sort_direction`. `kind` narrows to one kind, `connector` to every resource one connector gates.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `kind` (query, string or null): One kind of resource, spelled as the objects spell it: `manual`, or a connector's `connector:kind` as the connector directory lists each connector's `resource_kinds`. Any other shape is refused rather than answered with an empty page.
- `connector` (query, string or null): Every resource one connector gates, by the connector's key as the connector directory lists it.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/resources`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Onboarding PDF",
    "description": "https://example.com/onboarding.pdf"
  }'
```

Answers `201` with the new resource, `kind: "manual"`, and emits `project.resource.created`. The payload names no kind: a manual perk is the only resource this endpoint creates, and a place a connector gates is asked for with the link-request endpoint. A resource is what a plan unlocks, and nothing is sold before a connector can deliver it, so a project running no connected connector is refused, a manual perk included: install a connector on the project and connect it first.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string, required): The perk's name on plan cards, 5 to 255 characters.
- `description` (string): What the perk is, up to 1,000 characters. HTML is filtered to a safe subset before storage.
- `active` (boolean): Whether plans grant it right away. Defaults to true.


### POST `/v1/projects/{project}/resources/from-space`

A connector whose installation can list the places it administers lets a client pick one outright: the installation's spaces endpoint of the Connectors API lists them, and this endpoint sells one. The installation is asked again before the row persists, so a resource is never bound to a place the installation does not administer, which is the same proof the link request gets from the platform's own picker. The resource is created and bound to the place, and `project.resource.linked` fires as it does when a creator picks on the platform. A place the project already sells answers its existing resource with `200`.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/from-space \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "kind": "example:role", "external_id": "1183455190821797899", "title": "Gold members role", "description": "<p>The Gold role and everything it unlocks.</p>" }'
```

Answers `201 Created` with the resource. The dashboard's **Link Place** button on the resource editor and the `create_resource_from_space` tool run the same action; a connector that cannot list its places takes the link request above instead.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (string, required): The kind of place, spelled `connector:kind` as the connector directory lists each connector's `resource_kinds`, on a connector that lists its places.
- `external_id` (string, required): The platform's id for the place, as the installation's spaces endpoint lists it under `external_id`.
- `title` (string, required): The resource title members read, 5 to 255 characters.
- `description` (string): What members get, up to 1000 characters of well-formed HTML, shown as a perk beside the title.


### POST `/v1/projects/{project}/resources/link-requests`

A place cannot be created from the API: only the connector can prove it administers the place. This endpoint asks the creator, through the connector, to pick the place; the connector messages them with a picker and the resource appears the moment they choose, announced by `project.resource.linked`. Nothing is created by the call itself.

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/link-requests \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "kind": "telegram:channel" }'
```

Answers `202 Accepted` once the creator has been asked. The dashboard's **Send Request** button on the resource editor and the `request_resource_link` tool run the same action.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (string, required): A connector's kind of place spelled `connector:kind`, as the connector directory lists each connector's `resource_kinds`. `manual` and a bare kind word are refused.


### DELETE `/v1/projects/{project}/resources/{resource}`

Deletes the row. Plans that linked it stop granting it. Returns `204 No Content` and emits `project.resource.deleted`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/resources/{resource}`

One resource with its place, when it has one.

| Field         | Type           | Notes                                                                                                                                                                                                                       |
| ------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`        | string         | `manual` for a perk the creator hands over by hand, otherwise `connector:kind` as the [connector directory](https://docs.subscriby.net/api/v1/reference/connectors) lists each connector's `resource_kinds` (`telegram:channel`, `telegram:group`, `telegram:supergroup`). |
| `connector`   | string or null | The connector key the place is on; `null` for a manual perk.                                                                                                                                                                |
| `space`       | object or null | The place the resource is bound to: its `id`, the platform's own `external_id` and its `title` as the connector last read it. `null` for a manual perk and for a place-kind resource that was unlinked.                     |
| `title`       | string         | The resource's name on plan cards; for a linked place, the place's title at link time.                                                                                                                                      |
| `description` | string or null | Up to 1,000 characters of well-formed HTML, shown as a perk beside the title.                                                                                                                                               |
| `active`      | boolean        | Whether plans grant it right now. An inactive resource keeps its link and its plans, but new members do not receive it.                                                                                                     |

A manual perk reads `{ "kind": "manual", "connector": null, "space": null, … }`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/resources/{resource}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Members lounge (VIP)" }'
```

Partial by design: only the fields present in the body change, so a title-only update leaves the description exactly as stored, filtered HTML included, and logs no description edit. `kind` and `space` are not writable here: a resource keeps its kind for life, and its place moves only through the connector.

Answers `200` with the resource. When at least one field actually changed, `project.resource.updated` fires once with a `changes` map of `{field: {from, to}}`; a body that restates the stored values writes nothing and emits nothing.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string): The resource's name on plan cards, 5 to 255 characters.
- `description` (string): What the resource is, up to 1,000 characters, the same HTML filter as create; null clears it.
- `active` (boolean): Whether plans grant it; the activate and deactivate endpoints flip the same switch.


### POST `/v1/projects/{project}/resources/{resource}/activate`

The switch on the dashboard's resource row, on. A plan grants only its active resources, so the resource returns to what new members receive. Idempotent and answers `200` with the resource; only a flip emits `project.resource.updated`, with `changes.active`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/deactivate`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/deactivate \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The switch on the dashboard's resource row, off. An inactive resource stays in the project and keeps its place, but a plan grants only its active resources, so it drops out of what new members receive until it is switched back on. Idempotent and answers `200` with the resource; only a flip emits `project.resource.updated`, with `changes.active`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/unlink`

Detaches the place from a resource, so `space` reads `null` and the row becomes a placeholder. The resource stays in the project's list and keeps its `kind`, but no longer grants access through the connector. Re-linking goes through the connector again. Answers `200` with the resource and emits `project.resource.unlinked`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


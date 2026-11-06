# Webhook events: Launch Project

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `project`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `project.created` | `project:view` | `project` |
| `project.updated` | `project:view` | `changes`, `project` |
| `project.archived` | `project:view` | `project` |
| `project.restored` | `project:view` | `project` |
| `project.deleted` | `project:view` | `project` |
| `project.design_published` | `project:view` | `project`, `published_at`, `sections` |
| `project.resource.created` | `project-resource:view` | `resource` |
| `project.resource.linked` | `project-resource:view` | `connector`, `kind`, `project_id`, `resource_id`, `space_id`, `title` |
| `project.resource.unlinked` | `project-resource:view` | `resource` |
| `project.resource.deleted` | `project-resource:view` | `resource` |
| `project.resource.updated` | `project-resource:view` | `changes`, `resource` |
| `project.resource.status_changed` | `project-resource:view` | `project_id`, `reason`, `resource_id`, `status` |
| `project.payment_method.updated` | `project-payment-method:view` | `changes`, `payment_method` |
| `project.payment_method.deleted` | `project-payment-method:view` | `payment_method` |

### `project.created`

A creator registers a new project.

### When this fires

A creator registers a new project. The event lands the moment the new project becomes available for further configuration.

The project `description` is **not** included in the snapshot. Fetch it with [the project endpoint](https://docs.subscriby.net/api/v1/reference/projects) if you need it.

### Caveats

- Use the `SB-Event-Id` header to dedupe deliveries; it carries the same ULID as `id`, without the `evt_` prefix.
- `project.created` fires only for projects created through the REST API or MCP; projects created in the dashboard emit no `project.created`, so it is not guaranteed to be the first event you see for a `project_id`. Subsequent events on the same project may interleave.
- Archived/restored states are a separate event pair: listen for `project.archived` and `project.restored` rather than relying on `data.project.active` flipping inside `project.updated`.

### Related events

- `project.updated`: fires on subsequent mutable-field changes.
- `project.archived`: paired with `project.restored` for soft-disable transitions.

```json
{
  "id": "evt_01HX...",
  "type": "project.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project": {
      "id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
      "name": "Research Premium",
      "handle": "research-premium",
      "active": true,
      "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86"
    }
  }
}
```

### `project.updated`

Any mutable project field changes.

### When this fires

Any mutable field on a project changes: display name, handle, description, terms, privacy text, or other dashboard-editable settings. State-flag transitions (archive, restore) emit dedicated events instead.

### Caveats

- The `changes` block contains only the fields that mutated; unchanged fields are not included.
- `changes` can report fields the `project` snapshot does not carry: `description`, `terms`, `privacy`, `metrics`, `banner_url`, and `photo_url`. Read the new value from `changes[field].to`, or fetch the project from [the project endpoint](https://docs.subscriby.net/api/v1/reference/projects).
- `POST /v1/projects/{project}/archive` and `/restore` emit the dedicated `project.archived` / `project.restored` events, but a plain `PATCH` that sets `active` reports the flip in `changes.active` on `project.updated` instead. Handle both.
- Connecting or disconnecting an installation does not trigger `project.updated`; it emits `connector.connected` / `connector.disconnected`.

### Related events

- `project.created`: predecessor for any `project.updated` event.
- `project.archived`, `project.restored`: dedicated state-transition events.

```json
{
  "id": "evt_01HX...",
  "type": "project.updated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project": {
      "id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
      "name": "Research Premium",
      "handle": "research-premium",
      "active": true,
      "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86"
    },
    "changes": {
      "description": {
        "from": "Weekly research drops.",
        "to": "Daily research drops and monthly AMAs."
      }
    }
  }
}
```

### `project.archived`

Creator archives the project; access is suspended.

### When this fires

A project is archived through `POST /v1/projects/{project}/archive` or the MCP `archive_project` tool. Archiving from the dashboard does not emit this event. The only state change is the project's `active` flag flipping to `false`; existing subscriptions and the public landing page are untouched.

### Caveats

- Archive is reversible; pair with `project.restored` for the inverse transition.
- Subscribers retain their existing access until their `ends_at` ticks over. Expect `subscription.expired` events to follow as those subscriptions wind down.
- Hard-delete fires `project.deleted` instead and is final.

### Related events

- `project.restored`: paired transition.
- `project.deleted`: terminal state, replaces archive when the row is hard-deleted.

```json
{
  "id": "evt_01HX...",
  "type": "project.archived",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project": {
      "id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
      "name": "Research Premium",
      "handle": "research-premium",
      "active": false,
      "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86"
    }
  }
}
```

### `project.restored`

An archived project is re-activated.

### When this fires

A previously archived project is restored. The public landing page becomes reachable again, the `active` flag returns to `true`, and new subscriptions can be created.

### Caveats

- Existing churned subscribers do not auto-re-activate. They must redeem a new subscription, which triggers `subscription.created`.
- Connector installations persist across archive / restore. No `connector.*` events fire on restore.

### Related events

- `project.archived`: paired transition.
- `subscription.created`: emits when subscribers rejoin.

```json
{
  "id": "evt_01HX...",
  "type": "project.restored",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project": {
      "id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
      "name": "Research Premium",
      "handle": "research-premium",
      "active": true,
      "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86"
    }
  }
}
```

### `project.deleted`

Project hard-deleted. Final event from that project.

### When this fires

A project is hard-deleted by the creator. The project row and dependent data are removed; this is the final event you will receive for that `project_id`.

> This is the final event you will receive for the given `project_id`. Stop emitting requests against this project after delivery.

### Caveats

- After this event, the project's API endpoints will respond `404`. Treat the row as gone.
- Dependent rows (plans, subscriptions, resources) cascade but do **not** fan out their own `*.deleted` events. Handle the project-level cleanup once.
- Webhook subscriptions targeting only this project should be torn down on your side; the platform stops emitting events for it.

### Related events

- `project.archived`: typical predecessor.
- `project.created`: first event in the lifecycle.

```json
{
  "id": "evt_01HX...",
  "type": "project.deleted",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project": {
      "id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
      "name": "Research Premium",
      "handle": "research-premium",
      "active": true,
      "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86"
    }
  }
}
```

### `project.design_published`

A drafted portal design was published.

### When this fires

A creator published the portal design's draft on the designer or the platform bot, or an integration did over `POST /v1/projects/{project}/portal-design/publish` or `publish_portal_design`. The portal, the plan embed and the social card paint with the new design on their next render. A draft saved and never published fires nothing.

The design itself does not travel. Read it with [the portal design endpoint](https://docs.subscriby.net/api/v1/reference/portal-design) when the keys matter.

### Caveats

- A publish from the dashboard and one from the API look the same; nothing in the payload says which surface published.
- `sections` compares documents, so a key put back to its earlier value in the same draft leaves its section out.

### Related events

- `project.updated`: the project's own fields, never the design.

```json
{
  "id": "evt_01HX...",
  "type": "project.design_published",
  "created_at": "2026-10-26T16:40:08Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project": {
      "id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
      "name": "Research Premium",
      "handle": "research-premium",
      "active": true,
      "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86"
    },
    "published_at": "2026-10-26T16:40:08+00:00",
    "sections": [
      "colours",
      "typography"
    ]
  }
}
```

### `project.resource.created`

A manual perk is registered under a project.

### When this fires

A creator registers a manual perk on the project, from the dashboard's resource editor, `POST /v1/projects/{project}/resources` or the `create_resource` tool. A place a connector gates never arrives here: the connector links it and announces `project.resource.linked` instead.

The resource `description` is **not** included in the payload. Fetch it with [the resource endpoint](https://docs.subscriby.net/api/v1/reference/resources) if you need it.

### Caveats

- `project.resource.linked` is not a follow-up to this event; it creates its own resource row and carries a different `resource_id`.
- A manual perk is bound to no place and is not linkable; it appears once on creation and once on deletion.

### Related events

- `project.resource.linked`: a place a connector gates becomes a resource.
- `project.resource.deleted`: terminal state for a resource.

```json
{
  "id": "evt_01HX...",
  "type": "project.resource.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "resource": {
      "id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
      "title": "Welcome packet",
      "kind": "manual",
      "connector": null,
      "space": null,
      "active": true
    }
  }
}
```

### `project.resource.linked`

A place a creator picked on a connector becomes a resource of a project.

### When this fires

A creator links a place from a connector: a channel, group or supergroup from the bot's picker, or any connector's own picker answering a [link request](https://docs.subscriby.net/api/v1/reference/resources). The connector writes the resource row and this event announces it. This **creates** the resource row; no `project.resource.created` precedes it.

### Caveats

- Re-linking a place after an unlink creates a **new** resource row. The `project.resource.linked` you receive carries a different `resource_id` than the earlier `project.resource.unlinked`, and the unlinked row remains behind with `space: null`.
- Linking the same place to the same project twice announces nothing the second time: the connector's write is idempotent and answers the existing resource.
- A manual perk cannot be linked; it has no underlying place, so its `kind` is `manual` and it arrives through `project.resource.created`.

### Related events

- `project.resource.unlinked`: paired transition.
- `project.resource.created`: the separate REST / MCP path for manual perks; not a predecessor of this event.

```json
{
  "id": "evt_01HX...",
  "type": "project.resource.linked",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "connector": "telegram",
    "kind": "telegram:channel",
    "space_id": "3c1f7a58-2b6e-4d90-8f41-6a2e9c5d7b10",
    "title": "Research Premium Lounge"
  }
}
```

### `project.resource.unlinked`

Resource disconnected from a project.

### When this fires

A previously linked place is unbound from the resource by the creator, through the REST API or MCP.

### Caveats

- The resource row is preserved; only the place binding is removed. To delete it entirely, see `project.resource.deleted`.
- Active subscribers may receive `member.resource_removed` as access is revoked.

### Related events

- `project.resource.linked`: paired transition.
- `project.resource.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "project.resource.unlinked",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "resource": {
      "id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
      "title": "Sunday Slate Channel",
      "kind": "telegram:channel",
      "connector": "telegram",
      "space": null,
      "active": true
    }
  }
}
```

### `project.resource.deleted`

Resource soft-deleted from a project.

### When this fires

A resource is soft-deleted by the creator through the REST API or MCP. Existing subscriber access to the underlying place is not revoked by this action and no `member.resource_removed` events follow from it.

> This is the final event you will receive for the given `resource_id`. The row is retained with `deleted_at` stamped and disappears from the API.

### Caveats

- After this event, API endpoints scoped to the resource respond `404`.

### Related events

- `project.resource.unlinked`: typical predecessor.

```json
{
  "id": "evt_01HX...",
  "type": "project.resource.deleted",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "resource": {
      "id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
      "title": "Sunday Slate Channel",
      "kind": "telegram:channel",
      "connector": "telegram",
      "space": {
        "id": "3c1f7a58-2b6e-4d90-8f41-6a2e9c5d7b10",
        "external_id": "-1001234567890",
        "title": "Sunday Slate Channel"
      },
      "active": true
    }
  }
}
```

### `project.resource.updated`

A resource's title, description or on/off switch changes, or a recovery moves it onto another place.

### When this fires

A creator changes one of the three editable fields on a resource (`title`, `description` or `active`) and at least one of them is actually different afterwards. Every surface that can make that change raises it:

- **Dashboard**: the resource editor on the project's Resources page, and the on/off switch on each resource row.
- **REST**: `PATCH /v1/projects/{project}/resources/{resource}` for title and description edits, and `POST /v1/projects/{project}/resources/{resource}/activate` / `deactivate` for the switch.
- **MCP**: the `update_resource`, `activate_resource` and `deactivate_resource` tools.

It **also** fires when the place behind a resource is **swapped**: a [Disaster Recovery](https://docs.subscriby.net/connectors/telegram/replacing-channels-and-groups) replacement, an automatic failover to a standby, **Swap & Grant Resource** from the resources list, or the undo of any of those. That event carries `changes.space_id` with the previous and the new space, `changes.kind` when the platform upgraded the place in the same move (a group that became a supergroup), and `resource.space` already reads the new place.

It does **not** fire when:

- Nothing changed. A `PATCH` that re-sends the stored values, or an `activate` call on a resource that is already active, writes nothing and emits nothing.
- The place is linked for the first time or removed. That is the connector's link (`project.resource.linked`) or an unlink (`project.resource.unlinked`).
- The resource is deleted. That is `project.resource.deleted`, and no `updated` event precedes it.

> There are no `project.resource.activated` / `deactivated` events. Switching a resource on or off arrives here, as `changes.active`, alongside title and description edits. One save is one event, and it lists only what changed.

### Caveats

- The `description` is not in the `resource` snapshot, matching every other `project.resource.*` event, but when the description is what changed, `changes.description.to` carries the new text in full. Read it from there rather than following up with a request to the resource endpoint.
- Switching a resource off does not touch the plans that sell it. The connector stops granting that one place while the plans keep selling everything else, so a `changes.active` flip to `false` is "this perk is paused", not "this plan changed". No `plan.updated` follows.
- An `activate` / `deactivate` call and a `PATCH` that sets `active` produce the same event with the same `changes.active` shape. The payload does not say which route was used.
- A swap that also switches an inactive resource back on carries `changes.active` beside `changes.space_id`, because the swap reactivates what it repairs.
- `changes` contains only the fields that mutated. A `PATCH` carrying all three fields where only one differs reports one key.

### Related events

- `project.resource.created`: the manual perk this event later edits.
- `project.resource.linked` / `project.resource.unlinked`: the place bound for the first time or removed, which this event never reports.
- `project.resource.deleted`: terminal state for a resource.
- `project.resource.status_changed`: the health transition that usually precedes a recovery swap.
- `recovery.resource_replaced` / `recovery.resource_failed_over`: the recovery ledger's own word for the same swap.

```json
{
  "id": "evt_01HX...",
  "type": "project.resource.updated",
  "created_at": "2026-09-06T09:14:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "resource": {
      "id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
      "title": "Members lounge (VIP)",
      "kind": "telegram:supergroup",
      "connector": "telegram",
      "space": {
        "id": "3c1f7a58-2b6e-4d90-8f41-6a2e9c5d7b10",
        "external_id": "-1001234567890",
        "title": "Members lounge"
      },
      "active": true
    },
    "changes": {
      "title": {
        "from": "Members lounge",
        "to": "Members lounge (VIP)"
      }
    }
  }
}
```

### `project.resource.status_changed`

A channel or group enters or exits a degraded state: banned, deleted, or the bot lost its rights.

### When this fires

A channel or group linked to a project transitions into or out of a degraded state. The degraded reasons are:

| `reason`                | What the platform told us                                                             | Recovery                                                    |
| ----------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `chat_not_found`        | The chat no longer exists: deleted, or banned by the platform.                        | Replace the chat (a channel recovery).                      |
| `bot_removed`           | Our bot was removed from the chat, so it can no longer admit or remove members.       | Re-add the bot as an administrator, or replace the chat.    |
| `bot_not_administrator` | The bot is still in the chat but lost its administrator role.                         | Promote it again with the invite and restrict rights.       |
| `bot_missing_rights`    | The bot is an administrator without the *invite users* or *restrict members* right.   | Grant both rights again.                                    |
| `connector_api_error`   | The platform refused the probe for a reason we could not classify.                    | Re-check; replace the chat if it persists.                  |

The `healthy` event carries `reason: null` and fires when a probe finds the resource answering again, or when a recovery re-points it at a new chat.

A `chat_not_found` or `bot_removed` transition also opens a **recovery incident** on the creator's [Disaster Recovery](https://docs.subscriby.net/disaster-recovery) page, alerts them by email and on their connected account, and, on Growth, with automatic failover switched on, swaps the resource for its standby without anyone signed in.

It does **not** fire when:

- A probe finds the same state as last time. Only transitions are announced.
- A probe cannot reach the platform at all. A transport failure keeps the previous state.
- The resource is a manual perk. Only channels and groups are probed.

> Fires on a **transition**, not on a schedule. Subscriby probes every linked channel and group hourly, every five minutes while a pass window is open or imminent, and immediately when real work fails (an invite link cannot be minted, a join request cannot be approved). You get one event when the resource breaks and one when it recovers, never an event per probe.

### Related events

- `connector.status_changed`: the same idea for the project's installation.
- `project.resource.updated`: fires with `changes.space_id` when a recovery re-points the resource at a replacement place.

```json
{
  "id": "evt_01HX...",
  "type": "project.resource.status_changed",
  "created_at": "2026-09-07T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "status": "degraded",
    "reason": "chat_not_found"
  }
}
```

### `project.payment_method.updated`

A payment gateway's credentials, link state or on/off switch changes.

### When this fires

A payment method on the project changes and at least one of `active`, `linked` or a key inside its stored `config` is different afterwards. The surfaces that raise it:

- **Dashboard**: the payment method editor on the project's Payment Methods page (credentials and switches), and the on/off toggle on each gateway row.
- **Bot**: the main bot's payment-method wizard, when a creator walks through connecting a gateway that the project already has in that mode. The wizard re-saves the row through the same path as the dashboard.
- **REST**: `POST /v1/projects/{project}/payment-methods/{method}/activate` and `/deactivate`. There is no `PATCH` for payment methods, so credentials cannot be rotated over REST.
- **MCP**: the `activate_payment_method` and `deactivate_payment_method` tools.

It does **not** fire when:

- Nothing changed. Activating a gateway that is already on, or re-saving identical credentials, writes nothing and emits nothing.
- A Stripe method is switched on before its Connect account is attached. The call is refused, the row is untouched and there is no event.
- Stripe Connect onboarding completes or is disconnected. Those flows write the row directly and raise no event, even though they change `linked` and `active`.
- A gateway is first set up. There is no `project.payment_method.created` event; the first thing you hear about a new gateway is its first update or its deletion.
- The gateway is removed. That is `project.payment_method.deleted`.

> This payload never carries a credential. When gateway keys are rotated, `changes.config.keys` names **which** keys changed (`["clientId"]`, `["secret"]`) and nothing else. Neither the old nor the new value is sent, and the `payment_method` snapshot has no `config` at all.

### Caveats

- `linked` can appear in `changes` but is not in the snapshot. Read the new value from `changes.linked.to`, or from [the payment method endpoint](https://docs.subscriby.net/api/v1/reference/payment-methods), which does carry `linked`.
- `mode` never appears in `changes`. A row's mode is fixed (live and test are separate rows), so switching a gateway from test to live is a different method with a different `id`, not an update to this one.
- Every update re-queues a sync of the project's plans to that gateway, so a `plan.sync_completed` per active plan usually follows within a minute. Rotated credentials may point at a different gateway account whose catalogue has never seen the plans.
- `config.keys` are the gateway's own field names as Subscriby stores them (`clientId`, `secret`, `publicKey`, …), not a normalised list. Stored config is merged on save, so a key is reported when its value changed or was added; keys are never removed through an update.
- Switching a gateway off does not affect subscriptions already sold through it; they keep renewing. It only stops new buyers being offered that gateway.

### Related events

- `project.payment_method.deleted`: the gateway is removed from the project.
- `plan.sync_completed`: the catalogue re-push that follows each update.

```json
{
  "id": "evt_01HX...",
  "type": "project.payment_method.updated",
  "created_at": "2026-09-06T09:20:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "payment_method": {
      "id": "a15d70c8-3e46-4b92-b70f-58c9d2140e63",
      "provider": "paypal",
      "mode": "live",
      "active": true
    },
    "changes": {
      "config": {
        "keys": [
          "clientId"
        ]
      }
    }
  }
}
```

### `project.payment_method.deleted`

A payment gateway is removed from a project.

### When this fires

A creator removes a payment method from the project:

- **Dashboard**: the remove action on the project's Payment Methods page.
- **Bot**: the main bot's payment-method menu, "disconnect" on a connected gateway.
- **REST**: `DELETE /v1/projects/{project}/payment-methods/{method}`.
- **MCP**: the `delete_payment_method` tool.

It does **not** fire when:

- A gateway is switched off. That is `project.payment_method.updated` with `changes.active`, and the row stays.
- A Stripe method is disconnected from its Connect account. The row is kept (unlinked and inactive) and that flow raises no event at all.
- The row was already gone. Deleting twice writes nothing the second time and emits nothing.

> The row is soft-deleted, not destroyed. Subscriptions sold through the gateway keep pointing at it for refunds and history, and if the creator sets the same gateway up again in the same mode, the **same row is revived**. Expect this `id` to come back to life, and remember there is no `project.payment_method.created` event to tell you when it does.

### Caveats

- `active: true` here means the creator removed a gateway that was live for new purchases. If you mirror the project's checkout options anywhere, this is the event to react to; a deactivation would have arrived as `updated` first.
- Existing subscriptions are untouched. Their renewals, refunds and history keep referencing this gateway even though the row no longer appears in the project's payment methods list.
- `linked` is not in the snapshot, and nothing about the gateway's credentials or connected account is ever sent.

### Related events

- `project.payment_method.updated`: every change to the gateway before this one, including switching it off.
- `project.deleted`: a project going away takes its gateways with it without a per-gateway event.

```json
{
  "id": "evt_01HX...",
  "type": "project.payment_method.deleted",
  "created_at": "2026-09-06T09:25:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "payment_method": {
      "id": "a15d70c8-3e46-4b92-b70f-58c9d2140e63",
      "provider": "paypal",
      "mode": "live",
      "active": true
    }
  }
}
```

# Webhook events: Webhook Events

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

## Family `plan`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `plan.created` | `project-subscription-plan:view` | `duplicated_from_plan_id`, `kind`, `plan`, `plan_id`, `plan_name` |
| `plan.updated` | `project-subscription-plan:view` | `changes`, `plan` |
| `plan.activated` | `project-subscription-plan:view` | `plan` |
| `plan.deactivated` | `project-subscription-plan:view` | `plan`, `plan_id`, `plan_name`, `reason`, `successor_plan_id`, `window_count` |
| `plan.sold_out` | `project-subscription-plan:view` | `plan`, `plan_id`, `plan_name`, `reason`, `sales_cap`, `sales_cap_sold` |
| `plan.order_changed` | `project-subscription-plan:view` | `plan_ids`, `project_id` |
| `plan.deleted` | `project-subscription-plan:view` | `plan` |
| `plan.sync_completed` | `project-subscription-plan:view` | `plan_id`, `providers`, `synced_at` |

### `plan.created`

A plan is first created on a project.

### When this fires

A plan is created through the REST API (`POST /v1/projects/{project}/plans`) or the `create_plan` MCP tool, or a finished pass season is duplicated into its next season. Plans created from the creator dashboard or the bot do not emit this event. The plan is immediately eligible for purchase if it was created in the active state.

> **The two shapes are disjoint.** The API and MCP path sends `data.plan` and nothing else; the season-duplication path sends the four flat keys and no `data.plan` object. Branch on whether `data.plan` or `data.plan_id` is present before reading any other field.

`billing_cycle` is only the unit. The multiplier lives in `billing_cycle_count` on the plan record and is **not** included in this payload: a "3 month" plan sends `billing_cycle: "month"` with no indication of the `3`. Nor is `trial_days`. Fetch the plan with `GET /v1/projects/{project}/plans/{plan}` when you need the full cadence or trial configuration.

### Caveats

- A `plan.created` event does not imply the plan has been synced to a payment-provider catalog. Listen for `plan.sync_completed` for that.
- Trial is configured at create time. A later trial-only edit is only applied, and only then fires `plan.updated`, when the PATCH also carries a `kind` key; without it the trial fields are dropped and no event is emitted.

### Related events

- `plan.updated`: subsequent edits.
- `plan.sync_completed`: provider catalog sync.

```json
{
  "id": "evt_01HX...",
  "type": "plan.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
      "billing_cycle": "month",
      "active": true
    }
  }
}
```

### `plan.updated`

Any mutable plan field changes.

### When this fires

A plan is edited through the REST API (`PATCH /v1/projects/{project}/plans/{plan}`): pricing, name, currency, billing cadence, eligibility filters. Edits made in the creator dashboard do not emit this event, and trial fields are only written (and only then reported) when the payload also carries `kind`. An `active` flag sent on a PATCH is reported here as an ordinary `changes.active` entry. The dedicated `plan.activated` and `plan.deactivated` events come only from the publish and unpublish endpoints.

### Caveats

- Existing subscriptions priced on the old terms are not retroactively re-priced. New checkouts use the new price; renewals follow the billing rules.
- An `active` flag sent on a PATCH is reported here as an ordinary `changes.active` entry. The dedicated `plan.activated` and `plan.deactivated` events come only from the publish and unpublish endpoints.

### Related events

- `plan.activated`, `plan.deactivated`: dedicated active-flag events.
- `plan.sync_completed`: fires after price changes propagate to the provider catalog.

```json
{
  "id": "evt_01HX...",
  "type": "plan.updated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
      "billing_cycle": "month",
      "active": true
    },
    "changes": {
      "price": {
        "from": "25.0000",
        "to": "29.00"
      }
    }
  }
}
```

### `plan.activated`

Inactive plan flipped active.

### When this fires

An inactive plan is flipped to active through the REST API (`POST /v1/projects/{project}/plans/{plan}/publish`) or the `publish_plan` MCP tool, and becomes purchasable on the project landing page. Toggling a plan on from the creator dashboard does not emit this event.

### Caveats

- Publishing a plan that is already active is a no-op: nothing is written and no event is emitted.
- Activation does not retroactively touch existing subscriptions on the plan; only checkout availability changes.
- Frequent flipping is permitted but produces noisy timelines; use `plan.updated` for non-state edits.

### Related events

- `plan.deactivated`: paired transition.
- `plan.created`: predecessor.

```json
{
  "id": "evt_01HX...",
  "type": "plan.activated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "active": true
    }
  }
}
```

### `plan.deactivated`

Active plan flipped inactive.

### When this fires

A plan is taken off sale through the REST API (`POST /v1/projects/{project}/plans/{plan}/unpublish`) or the `publish_plan` MCP tool; automatically when a pass series runs its last date; or when the free-plan entitlement sweep disables an unentitled zero-priced plan. The plan remains visible to existing subscribers and stays in the catalog, but new checkouts cannot select it. Deactivating from the creator dashboard does not emit this event.

> **The two shapes are disjoint.** The publish-state path sends `data.plan` and nothing else; an automatically retired series sends the five flat keys and no `data.plan` object. Branch on whether `data.plan` or `data.plan_id` is present before reading any other field.

### Caveats

- Existing subscriptions on the plan are unaffected and continue to renew until cancelled or expired.
- For permanent removal use `plan.deleted`.

### Related events

- `plan.activated`: paired transition.
- `plan.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "plan.deactivated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "active": false
    }
  }
}
```

### `plan.sold_out`

A plan hit its sales cap, or a pass series filled its last seat, and Subscriby paused it automatically.

### When this fires

A plan carrying a **sales cap** records its last allowed successful purchase, or a `pass_series` plan with a **seat cap** seats its last holder. Subscriby switches the plan off on the spot, records the reason, and fires this event once. The plan disappears from the portal and the bot until the creator switches it back on; existing subscribers are untouched.

A `plan.deactivated` event fires alongside it, carrying the same `reason`, so automations that only watch availability still see the change. Subscribe to this event when you care specifically about "sold out": a waitlist, a restock reminder, a celebratory post.

> Switching the plan back on from the dashboard, the API (publish) or the `publish_plan` tool clears the reason and, for a sales cap, restarts the counter at zero, so the same cap sells another batch. Raising or clearing the cap while the plan is on sale also restarts the counter. A seat-capped series keeps its seats taken; raise the seat cap before publishing it again.

### Related events

- `plan.deactivated`: fires at the same moment with the same `reason`.
- `plan.activated`: the creator switching the plan back on.
- `pass_series.seats_exhausted`: the season-level view of a filled seat cap.

```json
{
  "id": "evt_01HX...",
  "type": "plan.sold_out",
  "created_at": "2026-09-08T14:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Founding Members",
      "price": "49.00",
      "active": false
    },
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Founding Members",
    "reason": "sales_cap_reached",
    "sales_cap": 10,
    "sales_cap_sold": 10
  }
}
```

### `plan.order_changed`

The creator arranged the order plans appear in on the portal and in the bot, or reset it.

### When this fires

A creator drags plans into a new order in the dashboard's **Arrange Storefront Order** dialog and saves, calls `POST /v1/projects/{project}/plans/order`, or runs the `reorder_plans` MCP tool. Resetting to the built-in order fires it too. The event carries the resulting order of every plan currently on sale, so a mirror of the storefront can re-sort itself without a second read.

> The built-in order is passes first, then seasons, then subscriptions, each group cheapest first. Plans created after an arrangement join the end in that order until the creator arranges again, so `plan_ids` on this event may be shorter than the plan list read a week later.

### Related events

- `plan.created`: a new plan joins the end of the storefront.
- `plan.activated`, `plan.deactivated`: a plan entering or leaving the storefront.

```json
{
  "id": "evt_01HX...",
  "type": "plan.order_changed",
  "created_at": "2026-09-08T14:10:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "plan_ids": [
      "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "b1a7c3d5-2e48-4f60-9a1b-7c5d3e820f94",
      "a9d2e4f6-1b3c-4d5e-8f70-2c4e6a8b0d1f"
    ]
  }
}
```

### `plan.deleted`

Plan soft-deleted (removed from the catalog).

> This is the final event you will receive for the given plan id.

### When this fires

The plan is removed from the project. It is soft-deleted: the row is retained with `deleted_at` set, so subscription rows that reference it are untouched and continue to honor their existing term. Only deletions made through the REST API (`DELETE /v1/projects/{project}/plans/{plan}`) emit this event; deleting a plan from the creator dashboard does not.

### Caveats

- Reads of the plan after this event return `404`. Existing subscriptions continue to reference the plan id internally.
- Deleting a plan makes no call to the payment providers. Catalog entries previously created by the plan sync (Stripe prices, PayPal plans, and so on) remain active at the provider and must be archived there manually.

### Related events

- `plan.deactivated`: typical predecessor.
- `plan.created`: first event in the lifecycle.

```json
{
  "id": "evt_01HX...",
  "type": "plan.deleted",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan": {
      "id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
      "name": "Premium Monthly",
      "price": "29.00",
      "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
      "billing_cycle": "month",
      "active": true
    }
  }
}
```

### `plan.sync_completed`

Plan synced to the payment-provider catalog (Stripe, PayPal, CoinPayments or Razorpay).

### When this fires

The plan finishes syncing to one or more external payment-provider catalogs (Stripe, PayPal, CoinPayments, Razorpay). Fires once per active plan per sync run: a run over a project with twelve active plans emits twelve events. A plan whose providers all failed emits nothing, and inactive plans are never synced.

### Caveats

- Partial failures retry on a follow-up run rather than emitting a separate event per provider; `providers` lists only the providers that succeeded for that plan.
- Errors during sync surface in the dashboard, not as webhook events.

### Related events

- `plan.created`: predecessor that typically triggers the first sync.
- `plan.updated`: re-sync trigger when pricing or cadence changes.

```json
{
  "id": "evt_01HX...",
  "type": "plan.sync_completed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "providers": [
      "stripe",
      "paypal"
    ],
    "synced_at": "2026-05-18T10:04:58Z"
  }
}
```

## Family `pass`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `pass.window_scheduled` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `source`, `starts_at`, `timezone`, `window_id` |
| `pass.window_opened` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `starts_at`, `subscribers_affected`, `window_id` |
| `pass.window_closed` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `starts_at`, `subscribers_affected`, `window_id` |
| `pass.window_cancelled` | `project-subscription-plan:view` | `ends_at`, `legs_dropped`, `plan_id`, `rebound`, `refund_due`, `series_holders`, `starts_at`, `subscribers_affected`, `window_id` |
| `pass.holder_queued` | `project-subscription:view` | `ends_at`, `plan_id`, `plan_kind`, `source_plan_id`, `starts_at`, `subscriber_id`, `subscription_id`, `window_id` |
| `pass.holder_moved` | `project-subscription:view` | `from_ends_at`, `from_starts_at`, `from_window_id`, `move_id`, `plan_id`, `reason`, `subscriber_id`, `subscription_id`, `to_ends_at`, `to_starts_at`, `to_window_id`, `was_queued` |
| `pass.holder_missed` | `project-subscription:view` | `ends_at`, `join_requested`, `plan_id`, `starts_at`, `subscriber_id`, `subscription_id`, `window_id` |
| `pass.holder_stranded` | `project-subscription:view` | `amount_paid`, `currency`, `from_ends_at`, `from_starts_at`, `from_window_id`, `payment_id`, `plan_id`, `refund_due`, `subscriber_id`, `subscription_id` |

### `pass.window_scheduled`

A new access window came into existence on a time-limited pass plan.

### When this fires

A dated access window was created on a pass plan: either generated from the plan's recurrence, or placed by hand from **Manage Access Windows** or [the pass windows endpoint](https://docs.subscriby.net/api/v1/reference/pass-windows).

This is the event that lets you mirror a schedule outward without polling for it. Every other `pass.*` event describes something happening *to* a window that already exists; this one is the window arriving.

> **Why this matters more once a series is involved.** A [Pass Series](https://docs.subscriby.net/creators/pass-series) can be set to absorb new windows automatically as they are scheduled, and its holders are granted them at no charge. Without this event an integration has no way to learn a season grew except by re-reading the plan: the difference between a synced calendar and a stale one.

### Caveats

- **Editing a schedule regenerates windows in bulk.** Saving a pass plan rebuilds its unsold future windows, so a single edit can emit this many times in quick succession. Batch on your side rather than treating each as an isolated announcement.
- Regeneration never touches a window somebody bought, a window a series points at, or one a creator pinned, so those are not deleted and re-created, and do not re-emit.
- `source: manual` windows are never rebuilt by a schedule edit. They fire this once, when placed.
- Timestamps are UTC. `timezone` is on the payload precisely so you do not have to look the plan up to render them correctly.

### Related events

- `pass.window_opened`: the same window reaching its start time.
- `pass.window_cancelled`: a window being withdrawn.
- `pass_series.leg_added`: a rule absorbing a newly-scheduled window into a live season.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_scheduled",
  "created_at": "2026-09-01T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "timezone": "America/New_York",
    "source": "generated"
  }
}
```

### `pass.window_opened`

A time-limited pass access window opened and its holders were admitted.

### When this fires

A scheduled access window on a time-limited pass plan reached its start time. Everyone holding that window has been admitted to the plan's resources on the connector.

Windows are processed every minute, so this fires within roughly 60 seconds of the advertised start time rather than exactly on it.

> This describes the window, not an individual subscriber. For per-member grants, subscribe to `member.resource_added`, which fires once per subscriber per resource.

### Caveats

- Timestamps are UTC. A pass schedule is authored in the creator's timezone, so rendering these without converting will show the wrong local time to buyers.
- `subscribers_affected` counts holders who were eligible **at open time**, not at purchase time. Cancelled and paused passes are excluded, so this can be lower than the number sold.
- Anyone who buys **after** this fires is outside the count entirely; a plan whose sales cutoff is anchored to the window end keeps selling while the window runs. Those admissions arrive as `member.resource_added`, not as a second `pass.window_opened`.
- A window whose worker was down for its entire span is closed without ever opening. In that case this event never fires and only `pass.window_closed` is emitted.

### Related events

- `pass.window_closed`: paired transition.
- `member.resource_added`: per-subscriber grant.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_opened",
  "created_at": "2026-09-20T13:00:04Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "subscribers_affected": 47
  }
}
```

### `pass.window_closed`

A time-limited pass access window ended and its holders were removed.

### When this fires

A scheduled access window reached its end time. Everyone who held it has been removed from the plan's resources on the connector. For a single-window pass that also ends the purchase: one purchase buys one window, so there is no next window to roll into. For a Pass Series holder only this date's access is stripped; the subscription ends only when the window that closed was the last date they held.

This also fires for a window that never opened because the worker was unavailable for its entire span. Such a window is closed rather than opened late, so nobody is admitted to a window that has already finished.

### Caveats

- Timestamps are UTC; convert to the plan's schedule timezone before showing them.
- A subscription that this close *ends* also emits `subscription.expired`, and `member.churned` when it was the subscriber's last active subscription. A series holder mid-slate emits neither, only `pass_series.leg_completed`. De-duplicate if you consume several of these.
- A cancelled window does not emit this event. It emits `pass.window_cancelled` instead, with per-holder detail in `pass.holder_moved` and `pass.holder_stranded`.

### Related events

- `pass.window_opened`: paired transition.
- `member.resource_removed`: per-subscriber revocation.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_closed",
  "created_at": "2026-09-21T03:00:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "subscribers_affected": 47
  }
}
```

### `pass.window_cancelled`

A creator cancelled a time-limited pass access window, and its holders were resettled.

### When this fires

A creator cancelled a scheduled access window from **Manage Access Windows** or [the cancel endpoint](https://docs.subscriby.net/api/v1/reference/pass-windows): a postponed match, a called-off session. This is never automatic: regeneration, slot edits and plan changes all leave sold windows alone, so cancelling is always a deliberate act.

By the time this fires every holder has already been resettled. A single-date holder was either moved to the next available window on the same plan, or, when nothing suitable was left, had their pass ended and was told what they paid. A season-ticket holder was moved the same way or lost the one date, as the creator chose (`series_holders`), and was told what the date was worth. The tallies are in the payload, and the per-holder detail arrives as `pass.holder_moved` and `pass.holder_stranded` for ordinary passes, or `pass_series.leg_substituted` and `pass_series.leg_dropped` for season-ticket holders.

> Cancelling cannot be undone. The window keeps its start time permanently, so the same instant can never be re-created on that plan: schedule regeneration skips it and adding it by hand is refused.

### Caveats

- Timestamps are UTC; convert to the plan's schedule timezone before showing them.
- **The counts exclude holders who were paused, past due, or had already cancelled their own pass.** Those are left bound to the cancelled window and are not resettled or messaged, so reconciling refunds from the tallies alone will miss them.
- `refund_due` and `legs_dropped` are counts, not lists. Consume `pass.holder_stranded` and `pass_series.leg_dropped` for the identities and amounts, or read `meta.refunds` on the cancel endpoint's response. The creator sees the same list in the dashboard's settlement dialog and in a notice to their inbox and email.
- No refund is issued by Subscriby. Every holder owed a decision is told the amount and that the decision is the creator's.
- Cancelling a window that is already **Open** evicts its holders immediately: anyone already admitted is removed from the connector's resources and their invite links stop working within seconds. They are not charged again and receive fresh links automatically ahead of their replacement window.
- A cancelled window never emits `pass.window_closed`.

### Related events

- `pass.holder_moved`: one per resettled single-date holder.
- `pass.holder_stranded`: one per single-date holder owed a refund.
- `pass_series.leg_substituted`: one per season-ticket holder moved.
- `pass_series.leg_dropped`: one per season-ticket holder who lost the date, with the pro-rata figure.

```json
{
  "id": "evt_01HX...",
  "type": "pass.window_cancelled",
  "created_at": "2026-09-18T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-20T19:00:00+00:00",
    "rebound": 38,
    "refund_due": 3,
    "legs_dropped": 4,
    "series_holders": "drop",
    "subscribers_affected": 45
  }
}
```

### `pass.holder_queued`

A pass holder tapped their invite link and their join request is now held.

### When this fires

A holder tapped their invite link for a dated window that has not opened yet. The platform holds the join request, and Subscriby records that they are queued: they will be admitted automatically the moment the window opens, whether or not they are at their phone.

This is the moment a buyer stops being a risk, and it is the one thing about a pass that a creator can still act on beforehand.

> **Bought is not the same as queued.** A purchase and a queued request are different events with different follow-up. Someone who bought but never tapped is relying on noticing a message on the day; someone queued needs nothing at all. Everything in the product that nudges a pass holder (the reminder ladder, the creator's roll call, the manual **Send Reminders** button) targets the first group and skips the second.

### Caveats

- **This fires per join request, not per purchase.** A season-ticket holder queues separately for each of their dates, so one series purchase produces at least one of these per date they tap, often spread over weeks, because the link for the next date is sent in the message that ends the previous one. A plan with more than one gated resource produces one per resource they tap, all carrying the same `window_id`.
- It does **not** fire when someone taps a link for a window that is already open. That is an immediate admission, not a queued request, and arrives as `member.resource_added`.
- A holder who never taps produces no event at all. Absence is the signal; see `pass.holder_missed` for the other end of that.
- Re-queuing does re-emit. The handler re-stamps the queue time and fires this event again on every join request it receives, so treat `subscription_id` + `window_id` as the idempotency key on your side.

### Related events

- `pass.holder_missed`: a holder whose window closed without them joining.
- `pass.window_opened`: the moment held requests are approved.
- `member.resource_added`: the per-resource grant that follows.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_queued",
  "created_at": "2026-09-17T18:42:10Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_kind": "pass",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "source_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00"
  }
}
```

### `pass.holder_moved`

A pass holder was moved from a cancelled access window to the next available one on the same plan.

### When this fires

One holder of a cancelled access window was moved onto another date. Fires once per resettled holder of an ordinary pass, alongside the single `pass.window_cancelled` for the window itself. A season-ticket holder's move emits `pass_series.leg_substituted` instead; the two are mutually exclusive.

The replacement is the soonest window on the **same plan** that is still on sale, has not started yet, and that this customer does not already hold a pass for. If the schedule has nothing future left, a window already in progress is used rather than stranding them. Every window on a plan sells for the same price, which is what makes the move an even swap rather than a substitution.

They are not charged again. If the cancelled window had not opened yet, their existing invite links stay valid for the replacement date; if they had already been admitted to a live window, that access and those links are revoked immediately and fresh links are sent when the replacement window opens.

### Caveats

- Timestamps are UTC; convert to the plan's schedule timezone before showing them.
- `was_queued` is the field worth branching on. A queued holder keeps their place and is admitted automatically on the new date; an unqueued one still has to tap their link, and is sent it again as a button.
- Nobody is moved onto a date they already hold. A customer with passes for two consecutive windows skips to the one after.
- The move is written quietly, so no `subscription.*` event accompanies it. This event is the only signal.
- Holders who were paused, past due, or had cancelled their own pass are not moved and emit nothing at all.

### Related events

- `pass.window_cancelled`: the window-level event, fired once.
- `pass.holder_stranded`: the other outcome, when no window was available.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_moved",
  "created_at": "2026-09-18T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-09-20T13:00:00+00:00",
    "from_ends_at": "2026-09-20T19:00:00+00:00",
    "to_window_id": "9a41f0be-27d5-4c18-b3ea-70d5c8194ef2",
    "to_starts_at": "2026-09-27T13:00:00+00:00",
    "to_ends_at": "2026-09-27T19:00:00+00:00",
    "was_queued": true
  }
}
```

### `pass.holder_missed`

A window closed and one holder never turned up for it.

### When this fires

An access window closed and a specific holder was recorded as **Missed**: they paid, the window ran, and they never joined.

`pass.window_closed` already reports an aggregate `subscribers_affected`, which is the wrong half for outreach. Who did not turn up is the useful question, the answer is already computed and stored per holder, and this is that answer.

> **Missed is a claim about the customer, so it is made carefully.** A holder is only marked Missed when they were never admitted. If they bought so late that the window was effectively over before their payment cleared, the pass is settled as ended rather than missed and **this event does not fire**; Subscriby will not tell you a paying customer no-showed when the timing was ours. One exception runs the other way: when a window never opened at all because of a worker outage, its ungranted holders *are* recorded as Missed and this event fires for each of them, so treat a burst of these for a single window as an outage signal rather than as no-shows.

### Caveats

- `join_requested` is the field worth branching on. A holder who never queued probably never saw the message; that is a reachability problem. A holder who queued and still did not appear made a choice, and chasing them the same way reads as nagging.
- **On a series this fires per date.** Missing one date of a season affects nothing else: the rest of the slate runs as booked, so treat a single occurrence as a data point rather than a churn signal. `pass_series.completed` carries the final tally, which is the figure that actually means something.
- It fires alongside `pass.window_closed` for the same window. Both are correct (one is per holder, one is the aggregate) so an endpoint subscribed to both receives one of each.

### Related events

- `pass.holder_queued`: the engagement this is the absence of.
- `pass.window_closed`: the aggregate for the same window.
- `pass_series.leg_completed`: the same close, seen as progress through a season.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_missed",
  "created_at": "2026-09-21T03:00:07Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "starts_at": "2026-09-20T13:00:00+00:00",
    "ends_at": "2026-09-21T03:00:00+00:00",
    "join_requested": false
  }
}
```

### `pass.holder_stranded`

A pass holder's window was cancelled with no replacement available, so their pass ended and a refund is owed.

### When this fires

One holder of a cancelled access window could not be moved anywhere, so their pass was ended. Fires once per stranded holder of an ordinary pass, alongside the single `pass.window_cancelled` for the window itself. A season-ticket holder never reaches this state: cancelling one leg of a season emits `pass_series.leg_dropped` instead and leaves the rest of the slate intact.

They have paid for a date that is not happening and received nothing. Subscriby tells them so and asks them to contact the creator; **it does not issue a refund**.

> **This is the durable record of who is owed money.** The creator's dashboard shows the refund count once, in a toast that survives a single page load, and the ended subscriptions are afterwards indistinguishable from ordinary expiries. This event carries the identity, the amount and the gateway reference, so consuming it is the only reliable way to reconcile refunds automatically.

### Why a replacement can be missing

- The plan has no later window scheduled at all.
- The only later windows are already inside the plan's [sales cutoff](https://docs.subscriby.net/creators/time-limited-passes#use-the-sales-cutoff-to-control-this), so they are closed to sales and cannot take new holders; a later date can be visible on the calendar and still not qualify.
- The customer already holds a pass for every remaining window.
- The plan's repeating schedule has passed its recurrence end date, so no later window qualifies even if the calendar still shows dates.

### Caveats

- The subscription also emits `subscription.expired`, and `member.churned` when it was their last active subscription. De-duplicate if you consume several.
- No `subscription.refunded` follows unless the creator actually issues the refund in their payment provider, at which point the gateway's webhook records it.
- Holders who were paused, past due, or had already cancelled their own pass are **not** included, even though they may also have paid. Reconcile those separately.
- `amount_paid` is what the subscription recorded at purchase; it does not account for any partial refund already issued.

### Related events

- `pass.window_cancelled`: the window-level event, fired once.
- `pass.holder_moved`: the other outcome, when a replacement existed.
- `subscription.expired`: also fires for this subscription.

```json
{
  "id": "evt_01HX...",
  "type": "pass.holder_stranded",
  "created_at": "2026-09-18T09:14:22Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-09-20T13:00:00+00:00",
    "from_ends_at": "2026-09-20T19:00:00+00:00",
    "refund_due": true,
    "amount_paid": "15.000",
    "currency": "GBP",
    "payment_id": "pi_3U9Jan4m40lWsKma0f3ntmnl"
  }
}
```

## Family `pass_series`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `pass_series.purchased` | `project-subscription:view` | `ends_at`, `passes_already_held`, `passes_granted`, `passes_total`, `plan_id`, `plan_name`, `seat_cap`, `seats_remaining`, `starts_at`, `subscriber_id`, `subscription_id` |
| `pass_series.leg_added` | `project-subscription-plan:view` | `ends_at`, `plan_id`, `plan_name`, `source_plan_id`, `starts_at`, `timezone`, `window_count`, `window_id` |
| `pass_series.leg_completed` | `project-subscription:view` | `granted`, `joined`, `passes_attended`, `passes_missed`, `passes_remaining`, `passes_total`, `plan_id`, `source_plan_id`, `subscriber_id`, `subscription_id`, `window_id` |
| `pass_series.leg_substituted` | `project-subscription:view` | `from_ends_at`, `from_starts_at`, `from_window_id`, `move_id`, `plan_id`, `reason`, `subscriber_id`, `subscription_id`, `to_ends_at`, `to_starts_at`, `to_window_id`, `was_queued` |
| `pass_series.leg_dropped` | `project-subscription:view` | `amount_paid`, `currency`, `from_ends_at`, `from_starts_at`, `from_window_id`, `passes_remaining`, `plan_id`, `refund_per_holder`, `series_ended`, `subscriber_id`, `subscription_id` |
| `pass_series.seats_exhausted` | `project-subscription-plan:view` | `last_subscription_id`, `plan_id`, `plan_name`, `seat_cap`, `seats_taken` |
| `pass_series.completed` | `project-subscription:view` | `passes_attended`, `passes_missed`, `passes_total`, `plan_id`, `plan_name`, `subscriber_id`, `subscription_id`, `successor_plan_id` |
| `pass_series.presale_opened` | `project-subscription-plan:view` | `closes_at`, `eligible_holders`, `plan_id`, `plan_name`, `presale_hours`, `successor_plan_id` |

### `pass_series.purchased`

Someone bought a season ticket and their whole slate was issued.

### When this fires

A [Pass Series](https://docs.subscriby.net/creators/pass-series) was bought, or comped with an access code, and every date on the slate has been written into the buyer's ledger. They hold all of them from this moment; there is nothing further to claim.

> **This fires in addition to `subscription.activated`.** A series **is** a subscription row, so a purchase emits both. An endpoint subscribed to the two receives **two deliveries for one purchase** and must de-duplicate on `subscription_id`. That is not a quirk to work around: `subscription.activated` is what you want for revenue, and this is what you want for the slate. They answer different questions about the same event.

### Caveats

- **`passes_granted + passes_already_held = passes_total`.** Buying a date you already own is allowed on purpose; it is de-duplicated at grant time rather than refused, and the buyer is told so on their timeline. A non-zero `passes_already_held` is normal, not an error.
- `passes_total` counts what this buyer received, which on a mid-season purchase is **fewer than the slate holds**: dates that have already run are never issued. Read the plan if you need the full slate length.
- The span is the **series'**, not this buyer's. `starts_at` and `ends_at` are the plan's cached slate span, so on a mid-season purchase `starts_at` can precede every date the buyer actually holds. Only the `passes_*` counts are buyer-scoped.
- A series absorbing new dates later does not re-emit this. That is `pass_series.leg_added`.

### Related events

- `subscription.activated`: the same purchase as revenue. De-duplicate on `subscription_id`.
- `pass_series.leg_completed`: one date of this slate finishing.
- `pass_series.completed`: the final date finishing.
- `pass_series.seats_exhausted`: when a purchase takes the last seat.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.purchased",
  "created_at": "2026-09-01T11:03:44Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "passes_total": 10,
    "passes_granted": 9,
    "passes_already_held": 1,
    "starts_at": "2026-09-20T13:00:00Z",
    "ends_at": "2026-11-29T22:00:00Z",
    "seat_cap": 50,
    "seats_remaining": 13
  }
}
```

### `pass_series.leg_added`

An automatic rule absorbed a newly-scheduled window into a live series.

### When this fires

A [Pass Series](https://docs.subscriby.net/creators/pass-series) with **Automatic Passes Selection** matched a newly-scheduled window on one of its source plans, added it to the slate, and granted it to everyone currently holding the series, at no extra charge.

This is the event that makes an external calendar or CRM worth wiring up. A season composed with rules is not fixed at the point it sold: it grows, and holders are given what it grows by. Without this you would have to re-read the plan to notice.

> **Holders are messaged too.** Every current holder receives a message on the connector naming the new date, and it appears on their timetable and in their calendar feed. Nothing is asked of them; their invite link arrives before it opens, as usual.

### Caveats

- **This fires once per window.** One absorption run can take in several at a time, which arrives as several events rather than one carrying a list.
- **Absorption respects Prevent Overlapping Passes.** With the toggle on, a window that clashes with something already on the slate is refused rather than absorbed (the series will not hand holders two things at the same time) so a matching window can exist and never produce this event.
- A rule of type `next_n` stops once it has taken its count and **never tops itself back up**. A window becoming free later does not make it reach for another.
- A series is capped at 120 dates. A rule that would take the slate past the cap stops there.
- Holders who cancelled are not granted the new date.
- Manually handpicked dates never produce this event. Handpicking is a fixed list by design; only rules keep working after the save.
- A date the creator has excluded stays excluded. Unticking a rule-added pass records a permanent exclusion, and the rule will not put it back.

### Related events

- `pass.window_scheduled`: the window coming into existence, which is what a rule reacts to.
- `pass_series.leg_substituted`: a date being swapped rather than added.
- `pass_series.leg_dropped`: a date leaving a season.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_added",
  "created_at": "2026-10-04T07:15:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "source_plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "starts_at": "2026-11-08T18:00:00Z",
    "ends_at": "2026-11-08T21:00:00Z",
    "timezone": "America/New_York",
    "window_count": 12
  }
}
```

### `pass_series.leg_completed`

One date of a holder's season finished, with their running attendance.

### When this fires

One window on a season ticket closed for one holder. It fires per holder per date, so a ten-date season sold to forty people emits four hundred of these across its run.

It is the progress event. Where `pass.holder_missed` answers "did they turn up", this answers "where are they in the season", which is what an integration syncing a timetable or scoring engagement actually needs.

### Caveats

- **`granted` and `joined` are tracked separately on purpose.** Granted means Subscriby admitted them; joined means they actually appeared. A date can be granted and not joined (a held request approved into a channel the person never opened) and that distinction is the difference between a delivery problem and a disengaged customer.
- `passes_attended + passes_missed` will not equal `passes_total` mid-season. The remainder is dates still ahead, plus any marked as already covered because the holder owned them individually before buying the series.
- When `passes_remaining` reaches `0`, `pass_series.completed` fires for the same holder in the same pass. Both are emitted; de-duplicate if you only want one.
- Two holders of the same series reach the same date at different points in their own season if one bought mid-way; the counts are per purchase, never per plan.

### Related events

- `pass_series.completed`: the final date of a holder's season.
- `pass.holder_missed`: the same close, when they did not turn up.
- `pass.window_closed`: the window-level aggregate.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_completed",
  "created_at": "2026-10-25T21:00:06Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "source_plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "granted": true,
    "joined": true,
    "passes_total": 10,
    "passes_attended": 4,
    "passes_missed": 1,
    "passes_remaining": 5
  }
}
```

### `pass_series.leg_substituted`

A cancelled date in a season was replaced, and one holder was moved to the replacement.

### When this fires

A creator cancelled a window that a season ticket points at, a replacement was available, and one holder was moved onto it. Their season carries on at the same length.

Fires **once per holder**, not once per cancellation. Each holder is resettled individually because the outcomes differ: someone already holding the replacement date skips past it to the next one they do not have, and someone with no replacement available is dropped instead.

### Caveats

- **`was_queued` is the field worth branching on.** A holder who was queued stays queued for the new date and is told there is nothing to do. One who was not usually gets their invite link attached, except a holder who had already been admitted to the cancelled window: they also report `was_queued: false`, but their access is revoked and they are told a fresh link arrives when the new window opens, so no link is attached. `was_queued: false` therefore covers two different situations; if you need to tell them apart, check whether the holder currently has access. If you send your own message alongside ours, match that split or you will ask half your audience to do something they have already done.
- The holder is **never** moved onto a date they already hold. The next one they do not have is chosen instead, so `to_window_id` can be further out than the immediate next window.
- Three groups are skipped entirely and produce no event: holders who are **paused**, **past due**, or who **cancelled their own series**. They still paid for a date that is not happening. Check subscriptions on that plan before reaching for a refund list.
- `plan_id` is the **source** plan. To identify the series, read `subscription_id`.

### Related events

- `pass.holder_moved`: the same resettlement on an ordinary single-window pass rather than a series.
- `pass_series.leg_dropped`: what happens when no replacement exists.
- `pass.window_cancelled`: fires once, last, carrying both tallies.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_substituted",
  "created_at": "2026-10-18T16:40:12Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-10-25T18:00:00Z",
    "from_ends_at": "2026-10-25T21:00:00Z",
    "to_window_id": "7c0b93af-4d61-42e8-95d3-18ba6e07c254",
    "to_starts_at": "2026-11-01T18:00:00Z",
    "to_ends_at": "2026-11-01T21:00:00Z",
    "was_queued": true
  }
}
```

### `pass_series.leg_dropped`

A cancelled date left a holder's season with no replacement, carrying the pro-rata figure.

### When this fires

A creator cancelled a window that a season ticket points at, **no replacement was available**, and that date simply left one holder's season. The rest of their slate is untouched.

This is the event that carries money information, and it is the one worth wiring up: it is the only durable record of who is owed what.

> **`refund_per_holder` is a figure, not an action.** Subscriby works out what the date was worth as a share of what the holder paid, and reports it. It does **not** move any money. Nothing is charged or refunded automatically, and nothing in the dashboard marks the subscription as owing. A Zap that reads this as "already refunded" will double-refund. A Zap that reads it as "this is what you owe" is correct.

### Caveats

- **The figure is per holder, not per cancellation.** Two people can be owed different amounts for the same cancelled date: a mid-season buyer paid the same price for fewer dates, so each of theirs is worth more. Sum the events; do not multiply one by a headcount.
- `series_ended: true` is worth handling separately. That holder's season is over, and an upsell to "the next date" is exactly wrong for someone who has just been told there is not one.
- The same three groups skipped by substitution are skipped here too: **paused**, **past due**, and holders who cancelled their own series. They produce no event and are absent from any total you compute from these.
- Refunds are issued from your payment provider's dashboard. See [Refunds](https://docs.subscriby.net/creators/managing-subscriptions#refunds).

### Related events

- `pass.holder_stranded`: the equivalent on an ordinary single-window pass, where the whole purchase ends rather than one date of it.
- `pass_series.leg_substituted`: what happens when a replacement exists.
- `pass.window_cancelled`: fires once, last, carrying both tallies.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.leg_dropped",
  "created_at": "2026-10-18T16:40:12Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "9a4c1b58-2e37-4d80-b6f1-0c7e35a92b41",
    "from_window_id": "3d5a8c72-b016-4e94-8fa7-61c209d4e738",
    "from_starts_at": "2026-11-29T18:00:00Z",
    "from_ends_at": "2026-11-29T21:00:00Z",
    "passes_remaining": 3,
    "refund_per_holder": "9.90",
    "currency": "USD",
    "amount_paid": "99.00",
    "series_ended": false
  }
}
```

### `pass_series.seats_exhausted`

A capped season ticket sold its last seat.

### When this fires

A purchase took the last seat on a series with a **Seat Limit**. The season is now sold out: its portal card reads **Sold out**, but a checkout already in flight is not blocked; the seat cap is only claimed once the payment lands, so a late buyer can pay, be given nothing, and be told to ask the organiser for a refund. Treat this event as the cue to stop promoting the season yourself.

Fires at the transition, once. An endpoint told this on every subsequent read would be told a fact rather than an event.

### Caveats

- **Sold out is not permanent.** A seat is released when a holder cancels or is refunded, and the series goes back on sale, at which point a later purchase can exhaust it again and emit this a second time. Treat it as a state change, not a terminal state.
- Only holders who actually hold the series consume a seat. A checkout that was started and abandoned, or a payment that never cleared, does not.
- A series with no **Seat Limit** never emits this at all.
- Raising the cap does not emit anything. If you are tracking availability, read `seats_remaining` on the plan rather than inferring it from this event alone.

### Related events

- `pass_series.purchased`: every purchase, each carrying `seats_remaining`.
- `plan.deactivated`: the series coming off sale for good once its dates have run.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.seats_exhausted",
  "created_at": "2026-09-12T14:22:51Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "seat_cap": 50,
    "seats_taken": 50,
    "last_subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4"
  }
}
```

### `pass_series.completed`

A holder reached the last date of their season, with the final attendance tallies.

### When this fires

The last date on one holder's season ticket closed. Their season is over.

Fires **per holder**, not per series, because "finished" is a fact about a purchase: two people holding the same season reach its end on different dates when one of them bought in late.

> **This is the renewal signal.** The tallies are the half worth acting on. A completion with two of ten attended is a churn signal; the same completion with ten of ten is a renewal one. If the creator linked a next season, the holders-only presale opens around the same moment; see `pass_series.presale_opened`.

### Caveats

- The subscription is expired at this point, which is normal and not a failure. A dated purchase ends when its dates run out.
- `passes_total` is **this holder's** slate, not the plan's. A mid-season buyer received fewer dates for the same price and their totals reflect that.
- `passes_attended + passes_missed` can be less than `passes_total` when some dates were already covered by passes the holder owned individually; those were not issued twice.
- `successor_plan_id` being present does **not** mean the holder has been invited yet. The presale opens when the series retires, which is a separate event.
- The plan itself is deactivated automatically once its last date has run for everybody. That arrives as `plan.deactivated` with `reason: series_exhausted`.

### Related events

- `pass_series.leg_completed`: each date along the way, including this one.
- `pass_series.presale_opened`: the invitation to the next season.
- `plan.deactivated`: the series taking itself off sale.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.completed",
  "created_at": "2026-11-29T21:00:06Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "passes_total": 10,
    "passes_attended": 8,
    "passes_missed": 2,
    "successor_plan_id": "b3e70d21-5f94-4a6c-8127-cd4a91e6f508"
  }
}
```

### `pass_series.presale_opened`

A finished season's holders were given first refusal on the next one.

### When this fires

A season ticket ran its last date, the creator had linked a **Next Series**, and the holders-only window on that successor opened. Every eligible holder has been messaged with a link straight to it.

For the length of the window, nobody who did not hold the finished season can buy the successor; the portal and the bot both turn them away and say when it goes on general sale.

> **Who is invited is worked out now, not at checkout.** Nothing is stamped onto a purchase when someone pays. Eligibility is resolved at the moment the presale opens, which is what lets a creator link a successor **months after** the season sold out and still reach everyone who bought it.

### Caveats

- **Fires once per season, ever.** The window's opening is stamped, so a repeated sweep does not re-invite anybody. If you need to reach these people again, do it from your own side.
- `eligible_holders` counts everyone who bought the finished season and did **not** cancel it, whether or not their subscription has expired; by this point most have, which is the normal case and not a disqualification. Someone who cancelled partway through is excluded: they said they did not want the season.
- It counts holders resolved for invitation, not messages the platform accepted. A holder who has blocked the bot is included here and did not receive anything.
- Nothing closes the window explicitly. It lapses at `closes_at` and the successor sells to everyone from then on, with no further event.
- A successor with no `presale_hours` set produces no presale and no event.

### Related events

- `pass_series.completed`: each holder reaching the end of the finished season.
- `plan.deactivated`: the finished season coming off sale, with `reason: series_exhausted`.
- `pass_series.purchased`: a holder taking up the offer.

```json
{
  "id": "evt_01HX...",
  "type": "pass_series.presale_opened",
  "created_at": "2026-11-29T21:00:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Autumn Season Ticket",
    "successor_plan_id": "b3e70d21-5f94-4a6c-8127-cd4a91e6f508",
    "eligible_holders": 38,
    "presale_hours": 48,
    "closes_at": "2026-12-01T21:00:11Z"
  }
}
```

## Family `coupon`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `coupon.created` | `project-coupon:view` | `coupon` |
| `coupon.updated` | `project-coupon:view` | `changes`, `coupon` |
| `coupon.activated` | `project-coupon:view` | `coupon` |
| `coupon.deactivated` | `project-coupon:view` | `coupon` |
| `coupon.deleted` | `project-coupon:view` | `coupon` |
| `coupon.redeemed` | `project-coupon:view` | `code`, `coupon_id`, `currency_id`, `discount_amount`, `final_amount`, `max_redemptions`, `original_amount`, `plan_id`, `redemptions_count`, `subscriber_id`, `subscription_id` |
| `coupon.exhausted` | `project-coupon:view` | `code`, `coupon_id`, `max_redemptions`, `redemptions_count` |

### `coupon.created`

A new coupon code was authored in a project.

### When this fires

A creator authored a new coupon code over the REST API or via the `create_coupon` MCP tool. Coupons authored in the dashboard or through the bot do not currently emit this event; those surfaces write through the service layer directly.

It fires on **authoring**, not on availability. A coupon created with a future `starts_at` fires this immediately and only becomes redeemable later, so do not read this as "a discount is now live": check `starts_at` and `active`.

> There is no separate event for a coupon becoming redeemable when its `starts_at` passes. Schedule against `starts_at` from this payload if you need that moment.

### Caveats

- **The snapshot carries no redemption counts and no plan restriction.** Counts move independently of the coupon row, and the plan list is a separate relation. Read both from [the coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) if you need them.
- **A coupon can be created already switched off.** `active: false` here is legitimate, not a race: a creator can author a code ahead of a campaign and switch it on later, which emits `coupon.activated`.
- **`code` is uppercase regardless of what was typed.** A creator entering `blackfriday` gets `BLACKFRIDAY`. Compare case-sensitively against the uppercase form.
- Timestamps inside `data.coupon` are ISO 8601 **with offset** (`+00:00`), unlike the envelope's `created_at`, which uses `Z`. Both are UTC.

### Related events

- `coupon.updated`: the same snapshot after a change, plus a list of what moved.
- `coupon.activated` / `coupon.deactivated`: availability flips.
- `coupon.redeemed`: a subscriber actually used it.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.created",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    }
  }
}
```

### `coupon.updated`

A coupon's terms changed, with a field-by-field list of what moved.

### When this fires

A creator changed a coupon's terms: its code, name, discount, caps, minimum, or window. Fires once per update through the REST API.

The dedicated activate and deactivate endpoints emit `coupon.activated` / `coupon.deactivated` rather than this event. An update that includes `active` is still an update, and emits `coupon.updated` with `active` in its `changes`, so handle `active` appearing in `changes` as well as subscribing to the flip events.

> **Editing terms is dashboard and API only.** The bot can create, inspect, switch off and delete a coupon, but not edit its terms; a multi-field edit is a form, not a chat. Dashboard edits do not currently emit this event (the dashboard writes through the service layer directly), so this event originates from the REST API.

`changes` only contains keys whose value differs. A save that changed nothing sends `"changes": {}`; the event still fires, because the creator did press save.

### Caveats

- **`changes` compares the snapshot, not the database columns.** It covers exactly the keys in `data.coupon`, so a change to the coupon's **plan restriction** does not appear; that lives in a separate relation the snapshot deliberately omits. Re-read [the coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) if you track which plans a code covers.
- **`from` and `to` keep their original types.** A decimal field gives you decimal strings, an integer field integers, a nullable field `null`. Don't assume both sides are strings.
- **Changing the code does not migrate past redemptions.** Redemptions already recorded stay attached to the coupon by id, so a renamed code keeps its history, but any subscriber who wrote the old string down now has a dead code.
- **A change is not retroactive.** Subscribers who already redeemed keep the terms they paid under; a reduced discount only affects checkouts from here on.

### Related events

- `coupon.created`: the same snapshot shape, on authoring.
- `coupon.activated` / `coupon.deactivated`: the on/off flip this event deliberately excludes.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.updated",
  "created_at": "2026-11-24T16:41:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "30.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 1000,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    },
    "changes": {
      "discount_value": {
        "from": "25.0000",
        "to": "30.0000"
      },
      "max_redemptions": {
        "from": 500,
        "to": 1000
      }
    }
  }
}
```

### `coupon.activated`

A coupon was switched on and is being offered at checkout again.

### When this fires

A creator switched a coupon **on** through the activate endpoint. Flipping the switch in the dashboard or through the bot does not currently emit this event; those surfaces write through the service layer directly.

This is the availability flip, kept out of `coupon.updated` on purpose: an automation that cares whether a discount is live wants one event to subscribe to, not a diff of the `active` key on every save.

> **Switched on is not the same as redeemable.** `active: true` is one of four conditions. A coupon still will not apply if it is outside its `starts_at` / `expires_at` window, if every use is already spoken for, or if the buyer has hit their own per-subscriber cap. Check the window and the caps in the payload before announcing a live sale.

### Caveats

- **This is not scheduled.** It fires when a person flips the switch. A coupon whose `starts_at` simply arrived does **not** emit this; nothing changed on the row. If you need the moment a code becomes redeemable, schedule against `starts_at`.
- **Re-activating a switched-off coupon does not reset its counts.** Redemptions taken before it was switched off still count against `max_redemptions`, so a code that was exhausted before is still exhausted after.
- **Idempotent flips still emit.** Activating an already-active coupon over the API emits this again. De-dup on the event `id`.

### Related events

- `coupon.deactivated`: the paired transition.
- `coupon.updated`: a terms change, which deliberately excludes this flip.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.activated",
  "created_at": "2026-11-27T00:00:31Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    }
  }
}
```

### `coupon.deactivated`

A coupon was switched off and stops being offered at checkout.

### When this fires

A creator switched a coupon **off** through the deactivate endpoint. Switching a code off in the dashboard or through the bot does not currently emit this event; those surfaces write through the service layer directly.

This is the safe way to retire a code, and the one Subscriby points creators at when a delete is refused. Switching off stops the code being offered immediately without touching the redemptions already recorded against it.

> **A checkout already in flight still completes.** Switching off blocks **new** redemptions. A subscriber who already applied the code and is sitting on a payment page still gets their discount; the hold was taken before the switch. Expect a `coupon.redeemed` to arrive shortly *after* this event, and do not treat that as an error.

### Caveats

- **Expiry does not emit this.** A coupon that runs past its `expires_at` stops applying but its `active` flag never changes, so no event fires. If you need the expiry moment, schedule against `expires_at`.
- **Exhaustion does not emit this either.** A coupon that runs out of uses emits `coupon.exhausted` and stays `active: true`. The two are distinct states: one is a decision, the other an outcome.
- **Nothing is refunded or revoked.** Subscribers who already redeemed keep what they paid, and their subscriptions are untouched.

### Related events

- `coupon.activated`: the paired transition.
- `coupon.exhausted`: ran out of uses rather than being switched off.
- `coupon.deleted`: the destructive alternative, which stops the code resolving.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.deactivated",
  "created_at": "2026-12-01T08:02:19Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": false
    }
  }
}
```

### `coupon.deleted`

A coupon was removed, carrying its final snapshot.

### When this fires

A creator deleted a coupon through the delete endpoint. Deletions from the dashboard or the bot do not currently emit this event; those surfaces write through the service layer directly.

The payload is a snapshot taken **before** the delete, so this is your last chance to record what the code was. Read it and store what you need; the code stops resolving at checkout the moment the delete goes through.

> **The code stops working, the history stays.** The coupon row is soft-deleted and its redemption records are left in place; attribution in your own reporting is not lost. What goes is the code itself: it stops resolving at checkout immediately. To retire a code while keeping it visible to creators, use `coupon.deactivated` instead.

### Caveats

- **A delete can be refused.** If any subscriber holds a live reservation (a checkout in flight with this discount already quoted to a payment provider) Subscriby refuses the delete and asks the creator to switch the code off instead. No event fires in that case, because nothing happened.
- **The coupon is soft-deleted, not erased.** [The coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) currently still resolves it, because the lookup runs unscoped, so do not use a 404 to detect deletion; treat this event as the authoritative signal and store what you need from this payload.
- **No counts.** As with every lifecycle event, the snapshot omits redemption counts. If you need a final tally, keep a running total from `coupon.redeemed` rather than trying to read one at delete time.

### Related events

- `coupon.deactivated`: the non-destructive way to retire a code.
- `coupon.created`: the same snapshot shape, at the other end of the life.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.deleted",
  "created_at": "2026-12-04T11:22:47Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "code": "BLACKFRIDAY",
      "name": "Black Friday 2026",
      "discount_type": "percentage",
      "discount_value": "25.0000",
      "currency_id": null,
      "duration": "once",
      "max_redemptions": 500,
      "max_redemptions_per_user": 1,
      "minimum_amount": null,
      "starts_at": "2026-11-27T00:00:00+00:00",
      "expires_at": "2026-12-01T00:00:00+00:00",
      "active": true
    }
  }
}
```

### `coupon.redeemed`

A subscriber's discounted payment settled and the redemption was recorded.

### When this fires

A payment that carried a coupon **settled**. The reservation taken at checkout has been converted into a recorded redemption, and the money has actually moved.

This is the money event in the family. It is the only `coupon.*` event that carries amounts, and the only one that tells you the code was really used rather than merely offered.

> **It fires on settlement, not on apply.** A subscriber typing a code into checkout does not emit anything. If they abandon the payment, the hold expires and no event ever fires, which is exactly why a `coupon.redeemed` can be trusted as revenue and a "code applied" signal could not.

### This is the amount your reporting should use

`final_amount` is what the payment provider charged and what Subscriby's own transaction fee is calculated from. If you mirror revenue into a spreadsheet or a warehouse, use `final_amount`: not the plan's list price, and not `original_amount`.

Fires alongside `payment.succeeded` and `subscription.activated` for the same purchase. All three describe one checkout from three angles; only this one knows a discount was involved.

### Caveats

- **Only the first payment is discounted.** Coupons are first-payment-only today, so a renewal on the same subscription charges list price and emits no coupon event. Do not carry `discount_amount` forward into MRR.
- **`redemptions_count` is read fresh, so it can jump.** Under concurrent checkouts two events may report counts that are not consecutive. Treat it as a gauge, not a sequence number, and never derive ordering from it.
- **Amounts are decimal strings in the coupon redemption's currency**, which is the plan's currency, not necessarily your dashboard's display currency. Convert before summing across plans.
- **A redemption can arrive after the code was switched off**, because a checkout already in flight is allowed to complete. This is expected, not a leak.
- **Percentage and fixed discounts are both rounded to the currency's precision** before charging, so `discount_amount` is the rounded figure that actually moved, not a raw percentage of `original_amount`.

### Related events

- `coupon.exhausted`: emitted immediately after this one when the redemption takes the last use.
- `payment.succeeded`: the payment itself.
- `subscription.activated`: the subscription it bought.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.redeemed",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon_id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
    "code": "BLACKFRIDAY",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "original_amount": "40.0000",
    "discount_amount": "10.0000",
    "final_amount": "30.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "redemptions_count": 137,
    "max_redemptions": 500
  }
}
```

### `coupon.exhausted`

The last remaining use of a capped coupon was taken.

### When this fires

A settled redemption took the **last remaining use** of a capped coupon. Fires immediately after the `coupon.redeemed` that consumed it, in the same emission.

Use it to close a campaign automatically: pull the code out of a landing page, stop an ad, post "sold out", or notify the creator that the cap they set has been reached.

> **Only capped coupons can fire this.** A coupon with `max_redemptions: null` is unlimited and never emits this event.

### Exhaustion counts live reservations, so it can un-exhaust

This is the one behaviour that surprises people. The quota is enforced against settled redemptions **plus reservations whose hold has not expired**, so a coupon can report exhausted while the last few uses are still only held by checkouts in progress.

If one of those checkouts is abandoned, the hold expires and its use returns to the pool. The coupon becomes redeemable again, and **no event fires for that**, because nothing changed on the coupon row.

That design is deliberate: it means an abandoned checkout never permanently burns a use, and no sweeper job is needed to reclaim one. The consequence for you is that `coupon.exhausted` is a strong signal but not a permanent state. If your automation does something hard to undo (pausing an ad spend, emailing a list) verify the current state with [the coupon endpoint](https://docs.subscriby.net/api/v1/reference/coupons) first, and read `redemptions.remaining` rather than comparing counts yourself.

> **`redemptions_count` can exceed `max_redemptions`.** The counter is bumped when a checkout takes a hold, not when it settles, and is only decremented when a hold is explicitly released. Lapsed holds the stale-reservation sweep has not yet reclaimed still sit in it, so on this event `redemptions_count` is equal to or greater than `max_redemptions`, never below it. Read `redemptions.remaining` from the API if you need the reservation-aware figure.

### Caveats

- **It can fire more than once for the same coupon.** Exhausted → a hold expires → redeemable → exhausted again is a legitimate sequence. De-dup on the event `id`, not on the coupon id.
- **A creator raising `max_redemptions` does not emit a matching "un-exhausted" event.** That is a `coupon.updated` with `max_redemptions` in its `changes`.
- **Expiry is a different thing entirely.** A coupon that runs past `expires_at` stops applying without ever being exhausted, and emits nothing.

### Related events

- `coupon.redeemed`: the redemption that consumed the last use; always precedes this.
- `coupon.updated`: where a raised cap shows up.
- `coupon.deactivated`: switched off by decision rather than run out by use.

```json
{
  "id": "evt_01HX...",
  "type": "coupon.exhausted",
  "created_at": "2026-11-30T21:15:08Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "coupon_id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
    "code": "BLACKFRIDAY",
    "max_redemptions": 500,
    "redemptions_count": 500
  }
}
```

## Family `referral`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `referral.program_updated` | `project-referral:view` | `changes`, `program` |
| `referral.affiliate_joined` | `project-referral:view` | `affiliate`, `status`, `subscriber_id` |
| `referral.affiliate_approved` | `project-referral:view` | `affiliate`, `status`, `subscriber_id` |
| `referral.affiliate_suspended` | `project-referral:view` | `affiliate`, `status`, `subscriber_id` |
| `referral.captured` | `project-referral:view` | `affiliate_id`, `connector`, `expires_at`, `referral_id`, `source`, `subscriber_id` |
| `referral.converted` | `project-referral:view` | `affiliate_id`, `commission_ends_at`, `referral_id`, `subscriber_id`, `subscription_id` |
| `referral.reward_earned` | `project-referral:view` | `affiliate_id`, `amount`, `beneficiary`, `currency_id`, `days`, `hold_until`, `kind`, `payment_id`, `referral_id`, `reward_id`, `status` |
| `referral.reward_approved` | `project-referral:view` | `affiliate_id`, `amount`, `beneficiary`, `currency_id`, `days`, `hold_until`, `kind`, `payment_id`, `referral_id`, `reward_id`, `status` |
| `referral.reward_reversed` | `project-referral:view` | `affiliate_id`, `amount`, `clawback_reward_id`, `currency_id`, `reason`, `referral_id`, `reward_id` |
| `referral.payout_recorded` | `project-referral:view` | `affiliate_id`, `amount`, `currency_id`, `payout_id`, `reference`, `rewards_paid` |

### `referral.program_updated`

A project's Referral Program settings were written, with a field-by-field list of what moved.

### When this fires

A creator saved the programme's settings or switched it on or off, from whichever surface they used. A project holds one programme, so the first save creates it and every later save updates it: the first save reports every field in `changes`, and a switch reports only `active`.

> **A paused programme attributes and rewards nothing.** `active: false` stops links attributing and payments earning at once; the ledger and the payouts stay readable. A programme whose owner's plan no longer includes the Referral Program behaves the same way without any event, because nothing on the row changed.

### Caveats

- **An edit never changes what was already earned.** Every reward row copies the figures it was priced with, so a lowered rate or a longer hold applies to payments from here on, not to the ledger.
- **`plan_ids` is reported, unlike the coupon snapshot.** It is part of the programme's shape and changes to it appear in `changes`.
- **Deleting a programme emits nothing.** The ledger beneath it stays, and a delete is refused while affiliates are still owed commissions; the creator records their payouts or switches the programme off instead.

### Related events

- `referral.affiliate_joined`: the first thing that happens once a programme is live.

```json
{
  "id": "evt_01HX...",
  "type": "referral.program_updated",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "program": {
      "id": "4b9d3e08-a1f6-4275-9c83-7e01d6a2f594",
      "active": true,
      "customers_only": false,
      "approval_required": false,
      "reward_kind": "cash",
      "reward_days": null,
      "commission_type": "percentage",
      "commission_value": "20.0000",
      "commission_currency_id": null,
      "commission_period_months": 12,
      "hold_days": 14,
      "minimum_payout": null,
      "friend_reward_kind": "free_days",
      "friend_reward_days": 7,
      "friend_coupon_id": null,
      "payout_details_label": "PayPal email",
      "plan_ids": []
    },
    "changes": {
      "commission_value": {
        "from": "15.0000",
        "to": "20.0000"
      },
      "hold_days": {
        "from": 30,
        "to": 14
      }
    }
  }
}
```

### `referral.affiliate_joined`

A member joined the Referral Program and was handed a code.

### When this fires

A member asked to join from the portal or a connector's bot, or the creator enrolled them by hand. `status` says where they stand: `approved` means their code attributes from this moment, `pending` means the programme requires approval and the creator has been told. A member the creator enrols is approved whatever the programme's switches say.

> **A code is minted, never chosen.** Seven characters from an alphabet without `0`, `O`, `1` or `I`, unique within the project. The member shares it through the portal link and the deep link of every connector the project runs.

### Caveats

- **A member joins once.** A second attempt is refused and emits nothing.
- **A customers-only programme refuses a lead.** A member with no live membership is refused and emits nothing; nothing in this family announces a refusal.

### Related events

- `referral.affiliate_approved`: the creator lets a pending affiliate in.
- `referral.captured`: their first friend arrives.

```json
{
  "id": "evt_01HX...",
  "type": "referral.affiliate_joined",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "affiliate": {
      "id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
      "code": "K7PMQ2X",
      "status": "pending",
      "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "days_balance": 0,
      "joined_at": "2026-11-20T09:14:02+00:00",
      "approved_at": null
    },
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "status": "pending"
  }
}
```

### `referral.affiliate_approved`

A pending or suspended affiliate was approved and their code attributes from now on.

### When this fires

The creator approved an affiliate. Approving one already approved changes nothing and emits nothing.

The member is told, with their link and code, when the programme is live.

### Caveats

- **Re-approving a suspended affiliate restores their earning, not the past.** Payments that settled while they were suspended earned nothing and are not revisited.

### Related events

- `referral.affiliate_suspended`: the paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "referral.affiliate_approved",
  "created_at": "2026-11-21T10:02:40Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "affiliate": {
      "id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
      "code": "K7PMQ2X",
      "status": "approved",
      "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "days_balance": 0,
      "joined_at": "2026-11-20T09:14:02+00:00",
      "approved_at": "2026-11-21T10:02:40+00:00"
    },
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "status": "approved"
  }
}
```

### `referral.affiliate_suspended`

An affiliate was suspended: their code stops attributing and their referrals stop earning.

### When this fires

The creator suspended an affiliate. Suspending one already suspended changes nothing and emits nothing.

> **Suspension is about the future.** What the affiliate already earned stays on their balance and can still be paid out; nothing is clawed back.

### Caveats

- **Touches already captured stay captured.** A friend who arrived through the code before the suspension keeps their referral row, but a payment of theirs earns nothing while the affiliate is suspended.

### Related events

- `referral.affiliate_approved`: the way back.

```json
{
  "id": "evt_01HX...",
  "type": "referral.affiliate_suspended",
  "created_at": "2026-12-02T15:30:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "affiliate": {
      "id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
      "code": "K7PMQ2X",
      "status": "suspended",
      "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "days_balance": 0,
      "joined_at": "2026-11-20T09:14:02+00:00",
      "approved_at": "2026-11-21T10:02:40+00:00"
    },
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "status": "suspended"
  }
}
```

### `referral.captured`

A member arrived through an affiliate's link or typed their code, and the touch was recorded.

### When this fires

A member opened the portal or a connector's deep link carrying an affiliate's code, or typed the code at checkout, and every capture rule passed: the programme is live, the code belongs to an approved affiliate of this project, the member is not the affiliate, holds no referral row yet, and has never settled a payment on the project.

> **First touch wins.** A member carries one referral for life on a project. A second code, from anyone, is refused and emits nothing. The touch lasts the attribution window (thirty days by default); a first payment inside it converts the touch, and a touch that sees none expires quietly.

### Caveats

- **A refused capture emits nothing**, whatever the reason: a self-referral, a suspended code, a paused programme, a member who already paid.
- **Expiry emits nothing either.** A touch past `expires_at` is closed by a nightly sweep and announced nowhere; schedule against `expires_at` if you need the moment.

### Related events

- `referral.converted`: the first payment inside the window.

```json
{
  "id": "evt_01HX...",
  "type": "referral.captured",
  "created_at": "2026-11-22T18:45:09Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "subscriber_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "source": "connector_link",
    "connector": "telegram",
    "expires_at": "2026-12-22T18:45:09+00:00"
  }
}
```

### `referral.converted`

A referred member's first payment settled, locking the referral and fixing how long it earns.

### When this fires

The ledger recorded the first settled payment of a member who holds a touch inside its window, on a plan the programme covers, and the affiliate is approved. Fires once per referral, immediately before the `referral.reward_earned` events the same payment produces.

> **The commission period is fixed here, from the programme as it stands.** A later edit to the programme never shortens or lengthens what this affiliate was promised on this member.

### Caveats

- **A payment on a plan outside the programme's `plan_ids` converts nothing.** The touch stays open until its window closes.
- **A $0 settlement converts.** A first purchase fully covered by a coupon is a settled payment; a percentage of nothing earns nothing, but days and a fixed amount are earned as usual.

### Related events

- `referral.reward_earned`: what the conversion earned each side.

```json
{
  "id": "evt_01HX...",
  "type": "referral.converted",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "subscriber_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscription_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "commission_ends_at": "2027-11-28T14:07:52+00:00"
  }
}
```

### `referral.reward_earned`

A settled payment earned a referrer, or the referred friend, days or money.

### When this fires

The ledger recorded a settled payment that a live referral earns on: the conversion earns the referrer their days or their first commission and the friend their welcome days; every later payment inside the period earns a percentage referrer another commission. One event per reward row, so a conversion on a programme with a friend reward emits two.

> **Days land at once, money waits.** A days row is `applied` when the member holds an ordinary live membership (the days are banked on it) and `pending` when they hold nothing live, in which case they wait on the affiliate's balance for their next purchase. A money row is `pending` behind the programme's hold with `hold_until` set, or `approved` at once when the hold is zero.

### Caveats

- **A redelivered payment earns nothing twice.** The ledger records a payment once, and a payment that already earned a row writes no second one.
- **A friend's days need a purchase that can carry them.** A pass or a season cannot be moved, so a friend who converts on one receives no days row at all rather than one that never applies.
- **Days are never reversed.** A refund unwinds money rows only; days already banked stay banked.

### Related events

- `referral.reward_approved`: the hold passes.
- `referral.reward_reversed`: a refund takes it back.
- `payment.succeeded`: the payment itself, from the gateway's side.

```json
{
  "id": "evt_01HX...",
  "type": "referral.reward_earned",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "beneficiary": "referrer",
    "kind": "cash",
    "days": null,
    "amount": "10.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "status": "pending",
    "hold_until": "2026-12-12T14:07:52+00:00",
    "payment_id": "b81c6e0f-27a9-4d3b-93a7-c4e82f164d5b"
  }
}
```

### `referral.reward_approved`

A held commission's refund window passed and it is now payable by the creator.

### When this fires

The hourly sweep found a money row past its `hold_until` and marked it payable. Fires once per row; a row approved at once because the programme has no hold emits `referral.reward_earned` with `status: approved` and never this event.

### Caveats

- **Payable is not paid.** The creator pays the affiliate outside Subscriby and records it; until then the row counts toward the affiliate's balance and nothing else moves.
- **The sweep runs hourly**, so a row becomes payable up to an hour after `hold_until`.

### Related events

- `referral.payout_recorded`: the creator pays it.

```json
{
  "id": "evt_01HX...",
  "type": "referral.reward_approved",
  "created_at": "2026-12-12T15:00:03Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "beneficiary": "referrer",
    "kind": "cash",
    "days": null,
    "amount": "10.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "status": "approved",
    "hold_until": "2026-12-12T14:07:52+00:00",
    "payment_id": "b81c6e0f-27a9-4d3b-93a7-c4e82f164d5b"
  }
}
```

### `referral.reward_reversed`

A full refund reversed a commission, or clawed back one the creator had already paid.

### When this fires

A payment that had earned a commission was fully refunded or charged back, which Subscriby learns from the same gateway event that emits `payment.refunded`. A row never paid out is reversed in place; a row already paid is answered with a clawback, a second row carrying the negative amount, so the affiliate's balance drops and the creator's next payout nets it off.

> **A partial refund changes nothing.** The creator kept most of the money, and the rule an affiliate can be told is the simple one: only a full refund takes a commission back. Days are never taken back.

### Caveats

- **A redelivered refund writes no second clawback.** The second delivery finds the rows reversed and the clawback written, and touches nothing.
- **A refund that names its payment touches that payment's commission only.** One that names none unwinds every live commission on the subscription, which is what a refund of "the last charge" means.

### Related events

- `payment.refunded`: the refund this followed.
- `referral.payout_recorded`: where a clawback is netted off.

```json
{
  "id": "evt_01HX...",
  "type": "referral.reward_reversed",
  "created_at": "2026-12-05T09:20:44Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "amount": "10.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "reason": "refund",
    "clawback_reward_id": "1a5d9e34-b628-4915-8c07-8f27a0d463be"
  }
}
```

### `referral.payout_recorded`

The creator recorded that they paid an affiliate.

### When this fires

The creator recorded a payout against an affiliate, in one currency, from whichever surface they used. The amount is checked against what the affiliate is owed in that currency, then the oldest payable commissions are marked paid while the amount lasts; `rewards_paid` says how many it covered.

> **Subscriby moved no money.** The payout is the creator's own statement that money left, however they agreed to pay the affiliate.

### Caveats

- **A payout above the balance is refused** and emits nothing, as is one of nothing.
- **A clawback is paid too.** A negative row is covered in its turn, which is how a refund after a payout nets off against the next one.

### Related events

- `referral.reward_approved`: what becomes payable.
- `referral.reward_reversed`: what gets netted off.

```json
{
  "id": "evt_01HX...",
  "type": "referral.payout_recorded",
  "created_at": "2026-12-15T11:40:27Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "payout_id": "63be4915-8c07-4d3b-1a5d-9e34b6288f27",
    "affiliate_id": "0d1e6a2f-5c83-4b9d-9c21-7e01d6a2f594",
    "amount": "25.0000",
    "currency_id": "8f27a0d4-63be-4915-8c07-1a5d9e34b628",
    "reference": "PAYPAL-7G2K1",
    "rewards_paid": 3
  }
}
```

## Family `partner`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `partner.referral_signed_up` | `account:read` | `expires_at`, `referral_id`, `referred_name`, `source` |
| `partner.referral_converted` | `account:read` | `commission_ends_at`, `commission_percent`, `plan`, `referral_id` |
| `partner.reward_earned` | `account:read` | `amount`, `base_amount`, `currency`, `hold_until`, `invoice_id`, `referral_id`, `reward_id`, `status` |
| `partner.reward_approved` | `account:read` | `amount`, `base_amount`, `currency`, `hold_until`, `invoice_id`, `referral_id`, `reward_id`, `status` |
| `partner.reward_credited` | `account:read` | `amount`, `balance_transaction_id`, `currency`, `referral_id`, `reward_id` |
| `partner.reward_reversed` | `account:read` | `amount`, `clawback_reward_id`, `currency`, `reason`, `referral_id`, `reward_id` |
| `partner.payout_recorded` | `account:read` | `amount`, `currency`, `method`, `payout_id`, `reference`, `rewards_paid` |
| `partner.application_approved` | `account:read` | `code`, `commission_percent`, `joined_at`, `partner_id`, `proof_due_at` |
| `partner.application_rejected` | `account:read` | `partner_id`, `reapply_at`, `reason` |
| `partner.rate_changed` | `account:read` | `commission_percent`, `commitment_points`, `partner_id`, `paying_referrals`, `previous_percent`, `reason`, `volume_points` |

### `partner.referral_signed_up`

A new creator account arrived through the partner's link, typed the partner's code at sign-up or came in through the platform bot's deep link, and the referral was recorded.

### When this fires

Someone registered a new creator account with the partner's cookie on their browser (set by the partner link for 60 days), typed the partner's code on the sign-up page with no cookie present, or started the platform bot through the partner's deep link, and every capture rule passed: the partner is active, the account is new, it is not the partner's own, and it holds no referral yet.

> **First touch wins.** An account carries one partner referral for life. The cookie beats a typed code, a second code from anyone is refused, and the referral stays open for 180 days: a first paid Starter or Growth invoice inside that window converts it, and one that sees none expires quietly.

### Caveats

- **A refused capture emits nothing**, whatever the reason: a self-referral, a suspended partner, an unknown code, an account that already carries a referral.
- **A held sign-up still emits this event.** A sign-up that looks like the partner themselves (their own network, an alias of their email, or one link bringing too many sign-ups in a day) is recorded and held for review from the start; it emits `partner.referral_signed_up` like any other, converts and earns silently, and the hold shows nowhere in this family until it is decided.
- **Expiry emits nothing either.** A referral past `expires_at` is closed by a nightly sweep and announced nowhere; schedule against `expires_at` if you need the moment.
- **The friend's discount is not in this event.** The referred creator's 20% off their first three months rides on their own account and shows on their invoices; the partner's commission is taken from the discounted total.

### Related events

- `partner.referral_converted`: the first paid invoice inside the window.

```json
{
  "id": "evt_01HX...",
  "type": "partner.referral_signed_up",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "referred_name": "Ada Lovelace",
    "source": "link",
    "expires_at": "2027-05-19T09:14:02+00:00"
  }
}
```

### `partner.referral_converted`

The referred creator's first paid Starter or Growth invoice settled, locking the referral and fixing what it earns.

### When this fires

Stripe reported a platform invoice of the referred creator paid for more than $0 on a Starter or Growth subscription while the referral was open, and the partner was active. Fires once per referral, immediately before the `partner.reward_earned` the same invoice produces.

> **The $0 trial invoice converts nothing, and neither does the Free Plan.** A card on trial is invoiced $0 and a creator on Free is invoiced only fees; the referral waits for the first paid plan invoice inside its window.

### Caveats

- **A referral held for review converts quietly.** When the card that paid the converting invoice matches the partner's own, or when the sign-up was held from the start, the referral is held under review and this event waits: it fires when Subscriby clears the referral, and the commissions written meanwhile are first heard of as `partner.reward_approved`. A rejected review emits `partner.reward_reversed` for each of them instead.
- **A later move to Free does not end the period.** The creator's fee invoices keep earning until `commission_ends_at`.

### Related events

- `partner.reward_earned`: what the converting invoice earned.

```json
{
  "id": "evt_01HX...",
  "type": "partner.referral_converted",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "plan": "starter",
    "commission_percent": "30.00",
    "commission_ends_at": "2027-11-28T14:07:52+00:00"
  }
}
```

### `partner.reward_earned`

A paid platform invoice of a referred creator earned the partner a commission.

### When this fires

Stripe reported an invoice of a converted referral paid, inside the commission period: the converting invoice itself, every renewal after it, an addon invoice, and the fee invoices of a creator who later moved to Free. One event per invoice. The commission is priced from the invoice's total before tax and after any discount, so the referred creator's 20% off their first three months lowers the first three commissions: a Starter month earns `"9.3600"` on a `"31.2000"` base, then `"11.7000"` on `"39.0000"`.

> **Money waits.** A commission is born `pending` behind a 30-day hold, so a refund inside the window can take it back; `hold_until` says when it becomes payable.

### Caveats

- **A redelivered invoice earns nothing twice.** A second `invoice.paid` for the same invoice finds its row and writes no other.
- **A suspended partner earns nothing**, and the invoice is not revisited when they are reinstated.
- **A referral under review earns silently.** Its rows are written but not announced until the review is decided.

### Related events

- `partner.reward_approved`: the hold passes.
- `partner.reward_reversed`: a refund takes it back.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_earned",
  "created_at": "2026-11-28T14:07:52Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "invoice_id": "in_1QmX8s2eZvKYlo2CkA9v4z1B",
    "base_amount": "31.2000",
    "amount": "9.3600",
    "currency": "USD",
    "status": "pending",
    "hold_until": "2026-12-28T14:07:52+00:00"
  }
}
```

### `partner.reward_approved`

A held commission's hold passed and it is now payable.

### When this fires

The hourly sweep found a commission past its `hold_until` on a referral that is not under review, and marked it payable. Fires once per row.

### Caveats

- **Payable is not paid.** A partner on Subscriby Credit is credited in the same run, which `partner.reward_credited` announces; a partner paid in cash waits for the monthly run, which pays balances from $50 and announces `partner.payout_recorded`.
- **The sweep runs hourly**, so a row becomes payable up to an hour after `hold_until`.
- **A referral still under review approves nothing.** Its rows wait, past their hold, until Subscriby decides the review.

### Related events

- `partner.reward_credited`: settled as Subscriby Credit.
- `partner.payout_recorded`: settled in cash.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_approved",
  "created_at": "2026-12-28T15:00:03Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "invoice_id": "in_1QmX8s2eZvKYlo2CkA9v4z1B",
    "base_amount": "31.2000",
    "amount": "9.3600",
    "currency": "USD",
    "status": "approved",
    "hold_until": "2026-12-28T14:07:52+00:00"
  }
}
```

### `partner.reward_credited`

A payable commission was applied to the partner's Subscriby balance.

### When this fires

The hourly sweep, after approving what it could, applied a partner's whole payable balance to their Stripe customer balance in one transaction, for a partner who chose to be paid in Subscriby Credit. One event per ledger row the transaction covered, each carrying the same `balance_transaction_id`. Stripe draws a negative customer balance down on the partner's next invoice automatically, plan, addons and fees alike, so a partner on the Free Plan spends it on fees.

> **The credit rail opens separately.** Subscriby Credit is offered to partners once the balance has been verified live; until then a partner chooses a cash rail and this event never fires.

### Caveats

- **Nothing is credited while the balance is zero or negative.** Clawbacks are netted first; a partner who owes more than they are owed is credited nothing until commissions outgrow it.
- **A credit is final.** A refund after a credit writes a clawback against the next run; the balance already applied is not taken back from Stripe.

### Related events

- `partner.reward_approved`: what became payable.
- `partner.reward_reversed`: a clawback after a credit.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_credited",
  "created_at": "2026-12-28T15:00:04Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "amount": "9.3600",
    "currency": "USD",
    "balance_transaction_id": "cbtxn_1QmX8s2eZvKYlo2CkA9v4z1B"
  }
}
```

### `partner.reward_reversed`

A full refund, a dispute or a rejected review reversed a commission, or clawed back one already settled.

### When this fires

The platform charge that earned a commission was refunded in full (`reason: refund`) or disputed (`reason: dispute`), or Subscriby rejected a referral it had held for review (`reason: rejected`). A row never settled is reversed in place; a row already credited or paid is answered with a clawback, a second row carrying the negative amount, so the partner's balance drops and the next credit or payout nets it off. One event per commission touched.

> **A partial refund changes nothing.** Subscriby kept most of the money, and the rule a partner can be told is the simple one: only a full refund or a dispute takes a commission back.

### Caveats

- **A redelivered refund writes no second clawback.** The second delivery finds the rows reversed and the clawback written, and touches nothing.
- **A dispute reverses on the day it opens**, because the money is withheld from then; a dispute later won is not revisited.
- **A rejected review reverses every commission the referral earned**, and the referral earns nothing further.

### Related events

- `partner.reward_credited`: where a clawback is netted off on the credit rail.
- `partner.payout_recorded`: where a clawback is netted off in cash.

```json
{
  "id": "evt_01HX...",
  "type": "partner.reward_reversed",
  "created_at": "2026-12-05T09:20:44Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "reward_id": "e83d0b16-c5a4-4c39-97f2-5b7e2d401a86",
    "referral_id": "9c1a7b3f-5d80-4e6a-8b45-2a91c4e76f38",
    "amount": "9.3600",
    "currency": "USD",
    "reason": "refund",
    "clawback_reward_id": "1a5d9e34-b628-4915-8c07-8f27a0d463be"
  }
}
```

### `partner.payout_recorded`

Subscriby recorded a cash payout to the partner.

### When this fires

Subscriby paid a partner who chose a cash rail and recorded it: payouts run monthly for balances of $50 or more, by PayPal, Wise, Remitly or USDT, to the details the partner saved, less the rail's own transfer fee. The amount is checked against what the partner is owed, then the oldest payable rows are marked paid while the amount lasts; `rewards_paid` says how many it covered, clawbacks included.

### Caveats

- **The payout details never travel.** Where the money went, a PayPal email, a wallet address or the bank account a Wise or Remitly transfer was made to, is stored encrypted on the partner's account and appears in no event.
- **A payout above the balance is refused** and emits nothing, as is one to a partner who chose Subscriby Credit.

### Related events

- `partner.reward_approved`: what becomes payable.
- `partner.reward_reversed`: what gets netted off.

```json
{
  "id": "evt_01HX...",
  "type": "partner.payout_recorded",
  "created_at": "2027-01-05T11:40:27Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "payout_id": "63be4915-8c07-4d3b-1a5d-9e34b6288f27",
    "amount": "58.5000",
    "currency": "USD",
    "method": "paypal",
    "reference": "PAYPAL-7G2K1",
    "rewards_paid": 5
  }
}
```

### `partner.application_approved`

Subscriby approved the creator's application to the Partner Program: their code is minted, their starting rate is set and their link attributes from this moment.

### When this fires

The owner approved the application on the console. Fires once per approval; a creator whose application was turned down and who applied again gets it on the later approval.

> **Nothing fires when the application is filed.** The creator filed it themselves and the page says it is under review; this event is the first thing an integration hears.

### Caveats

- **The rate here is the floor.** Each commitment the owner verifies and each volume tier reached raises it; listen to `partner.rate_changed` for the moves.
- **The application's answers never travel.** Who the partner is, where their audience lives and what they committed to stay on the account.

### Related events

- `partner.rate_changed`: every later move of the rate.
- `partner.referral_signed_up`: the first creator the link brings.

```json
{
  "id": "evt_01HX...",
  "type": "partner.application_approved",
  "created_at": "2026-11-18T10:02:41Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "partner_id": "2f6c1d0e-9a3b-4c5d-8e7f-6a5b4c3d2e1f",
    "code": "K7PQ2MX",
    "commission_percent": "5.00",
    "joined_at": "2026-11-18T10:02:41+00:00",
    "proof_due_at": "2027-01-17T10:02:41+00:00"
  }
}
```

### `partner.application_rejected`

Subscriby turned the creator's application down, with the reason they were given and the day they may apply again.

### When this fires

The owner rejected the application on the console with a reason. Fires once per rejection; nothing else changes on the account, and a fresh application after the cooling period starts from the creator's answers again.

### Caveats

- **An application inside the cooling period is refused on the page** and emits nothing.

### Related events

- `partner.application_approved`: the other verdict.

```json
{
  "id": "evt_01HX...",
  "type": "partner.application_rejected",
  "created_at": "2026-11-18T10:02:41Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "partner_id": "2f6c1d0e-9a3b-4c5d-8e7f-6a5b4c3d2e1f",
    "reason": "Your audience is outside the communities we serve today.",
    "reapply_at": "2027-02-16T10:02:41+00:00"
  }
}
```

### `partner.rate_changed`

The partner's commission rate moved, and the reason: a commitment was verified or lapsed, or their paying referrals reached a volume tier.

### When this fires

Every time the stored rate changes: the owner verified a commitment (`commitment_verified`), the owner or the nightly sweep lapsed one (`commitment_lapsed`), or a conversion carried the partner across a volume tier (`volume_tier`), whether it converted on its own or the owner cleared it from review. A verification that lands on the cap moves nothing and emits nothing.

> **Every move reaches every referral still earning**, written onto each one's `commission_percent`. A drop, which only a withdrawn commitment causes, also recalculates the commissions not yet credited or paid out. The `partner.referral_converted` that crosses a tier carries the rate before the raise, and this event follows it at once.

> **The paying count the tiers read is every referral that converted**, for life: a creator who later cancels, or whose commission months end, still counts, and a refund reverses the commission without un-counting them; only a referral the owner refuses on review is left out. So a volume tier, once reached, is kept.

### Caveats

- **The sum can pass the cap on paper.** `commitment_points` and `volume_points` are the raw points; `commission_percent` is what is paid.
- **A raise never re-prices a reward already written**: it changes what the next invoice of each earning referral pays. A drop re-prices every pending or approved commission at the lower rate, lowering only; a reward written at a rate below the new one keeps its amount, and nothing credited or paid out is touched.

### Related events

- `partner.referral_converted`: the rate copied onto one referral.
- `partner.reward_earned`: what an invoice pays at that rate.

```json
{
  "id": "evt_01HX...",
  "type": "partner.rate_changed",
  "created_at": "2026-12-03T16:40:12Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "partner_id": "2f6c1d0e-9a3b-4c5d-8e7f-6a5b4c3d2e1f",
    "previous_percent": "5.00",
    "commission_percent": "15.00",
    "reason": "commitment_verified",
    "commitment_points": 10,
    "volume_points": 0,
    "paying_referrals": 3
  }
}
```

## Family `copilot_credit`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `copilot_credit.purchased` | `account:read` | `balance_cents`, `bonus_cents`, `currency`, `pack`, `paid_cents`, `purchase_id` |
| `copilot_credit.granted` | `account:read` | `balance_cents`, `cents`, `expires_at`, `grant_id`, `kind` |
| `copilot_credit.low` | `account:read` | `balance_cents`, `threshold_cents` |
| `copilot_credit.refunded` | `account:read` | `balance_cents`, `bonus_voided_cents`, `pack`, `purchase_id`, `refunded_cents` |

### `copilot_credit.purchased`

A pack of Copilot Credits was paid for and credited.

### When this fires

Stripe reported the payment for a pack: a Checkout session the creator completed, or an off-session charge the auto top-up made when the balance fell under their threshold. The paid amount becomes a grant that never lapses and the pack's bonus, when it carries one, a free grant beside it. One event per pack, however many Stripe events describe the payment.

> **The bonus is free credit.** `bonus_cents` is granted by Subscriby, never charged by Stripe, and a refund of the pack takes it back.

### Caveats

- **Tax is not in `paid_cents`.** Stripe may have collected tax on top; the ledger is credited with the pack's price.
- **A short payment credits nothing.** A payment under the pack's price is left pending and never announced.

### Related events

- `copilot_credit.refunded`: the pack's money going back.
- `copilot_credit.low`: what the auto top-up answers.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.purchased",
  "created_at": "2026-11-02T09:14:31Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "purchase_id": "0b1f7a2e-3c4d-4e5f-8a9b-1c2d3e4f5a6b",
    "pack": "regular",
    "paid_cents": 2500,
    "bonus_cents": 250,
    "currency": "USD",
    "balance_cents": 3250
  }
}
```

### `copilot_credit.granted`

Free Copilot Credits were granted to the creator.

### When this fires

A new account received its welcome credit at registration, or Subscriby granted a promotion or goodwill by hand. The paid part and the bonus of a pack are not announced here; they are the purchase.

### Caveats

- **A lapsed grant is not announced.** The welcome credit's remainder simply stops counting at `expires_at`.

### Related events

- `copilot_credit.purchased`: the paid way in.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.granted",
  "created_at": "2026-11-02T09:14:31Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "grant_id": "7c8d9e0f-1a2b-4c3d-9e4f-5a6b7c8d9e0f",
    "kind": "signup",
    "cents": 500,
    "expires_at": "2027-01-31T09:14:31Z",
    "balance_cents": 500
  }
}
```

### `copilot_credit.low`

The creator's Copilot Credits fell under the low-balance threshold.

### When this fires

A unit of Copilot usage was drawn from the credit and left the balance under the threshold, and the creator had not been told in the last day. The same moment sends the creator a notice and, when their auto top-up is on, queues the charge for their pack.

### Caveats

- **Once a day at most.** A balance that stays low fires again only after a day; a purchase or a grant resets the clock.
- **The free allowance does not count.** Units the plan includes draw nothing and never fire this.

### Related events

- `copilot_credit.purchased`: the top-up that follows.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.low",
  "created_at": "2026-11-02T09:14:31Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "balance_cents": 420,
    "threshold_cents": 500
  }
}
```

### `copilot_credit.refunded`

Stripe refunded the charge for a pack and the credit was taken back.

### When this fires

A refund, partial or full, landed on the charge that paid for a pack. The refunded amount comes off the paid grant, past zero when the creator had already spent it; a refund that reaches the full price also takes the pack's bonus back. Stripe reports the refunded total cumulatively, so one event fires per refund with the running figure.

### Caveats

- **A negative balance closes the Copilot.** Nothing is invoiced for it; the next pack or grant covers it first.

### Related events

- `copilot_credit.purchased`: the pack that was refunded.

```json
{
  "id": "evt_01HX...",
  "type": "copilot_credit.refunded",
  "created_at": "2026-11-05T16:02:10Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "purchase_id": "0b1f7a2e-3c4d-4e5f-8a9b-1c2d3e4f5a6b",
    "pack": "regular",
    "refunded_cents": 2500,
    "bonus_voided_cents": 250,
    "balance_cents": -180
  }
}
```

## Family `knowledge`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `knowledge.created` | `project-knowledge:view` | `entry`, `project_id` |
| `knowledge.updated` | `project-knowledge:view` | `changes`, `entry`, `project_id`, `text_changed` |
| `knowledge.deleted` | `project-knowledge:view` | `entry`, `project_id` |

### `knowledge.created`

An entry was taught to the Copilot.

### When this fires

A creator saved a question with its answer or a document on the Knowledge page, or an integration created one over the API or through `create_knowledge_entry`. The passages are in the index by the time the event fires, so a member can already be answered from a `members` entry.

### Caveats

- **A failed read still fires.** A document whose text could not be read is saved with `status: failed` and announced; the dashboard shows why, and the Copilot is handed nothing from it.

### Related events

- `knowledge.updated`: the entry's words or audience changing.
- `knowledge.deleted`: the entry taken back.

```json
{
  "id": "evt_01HX...",
  "type": "knowledge.created",
  "created_at": "2026-10-19T16:02:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "entry": {
      "id": "3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d",
      "kind": "question",
      "audience": "members",
      "status": "ready",
      "title": "When does my membership renew?",
      "chunk_count": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

### `knowledge.updated`

An entry's title, audience or text changed.

### When this fires

A save moved the title, the audience or the words, from the dashboard, the API or `update_knowledge_entry`. A save that changed nothing fires nothing.

### Caveats

- **An audience change is the member boundary moving.** `members` to `team` means the Copilot stops answering members from the entry at once; the other way round, it starts.

### Related events

- `knowledge.created`: the entry's first save.

```json
{
  "id": "evt_01HX...",
  "type": "knowledge.updated",
  "created_at": "2026-10-19T16:40:08Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "changes": {
      "audience": {
        "from": "members",
        "to": "team"
      }
    },
    "entry": {
      "id": "3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d",
      "kind": "question",
      "audience": "team",
      "status": "ready",
      "title": "When does my membership renew?",
      "chunk_count": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "text_changed": false
  }
}
```

### `knowledge.deleted`

An entry was taken back.

### When this fires

A creator removed the entry on the Knowledge page, or an integration did over the API or through `delete_knowledge_entry`. The passages and the file are gone by the time the event fires.

### Caveats

- **Nothing is recoverable.** Deleting is not archiving: the words are gone with the passages. An integration that wants history keeps its own copy from `knowledge.created` and the API.

### Related events

- `knowledge.created`: how it began.

```json
{
  "id": "evt_01HX...",
  "type": "knowledge.deleted",
  "created_at": "2026-10-19T17:12:45Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "entry": {
      "id": "3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d",
      "kind": "question",
      "audience": "team",
      "status": "ready",
      "title": "When does my membership renew?",
      "chunk_count": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

## Family `link`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `link.created` | `project-link:view` | `link` |
| `link.updated` | `project-link:view` | `changes`, `link` |
| `link.archived` | `project-link:view` | `link` |

### `link.created`

A new Smart Link was authored in a project.

### When this fires

A creator authored a new Smart Link on the dashboard, over the REST API or via the `create_link` MCP tool. The link answers at `url` from this moment: a click counts, the visit waits in the visitor's browser for up to thirty days, and the member who signs in inside that window is attributed to the link.

It fires on **authoring**, not on the first click. A link created with an `expires_at` fires this immediately and stops counting when that instant passes; there is no separate event for the expiry.

### Related events

- `link.updated`: the link's fields changed.
- `link.archived`: the link was put out of use.

```json
{
  "id": "evt_01HX...",
  "type": "link.created",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "link": {
      "id": "7c2e5a90-3f41-4b8d-9e62-1a0d4c8b7f35",
      "name": "YouTube description",
      "slug": "youtube",
      "code": "K7PMQ2X",
      "destination": "plan",
      "plan_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "url": "https://my.subscriby.net/jane/go/youtube",
      "expires_at": null,
      "archived_at": null,
      "clicks_total": 0
    }
  }
}
```

### `link.updated`

A Smart Link's name, address, destination or expiry changed.

### When this fires

A creator edited the link on the dashboard, over the REST API or via the `update_link` MCP tool, and at least one field of the snapshot moved. A save that changed nothing fires nothing.

### Caveats

- **A rename does not break what was shared.** The old `url` answers nothing after a rename, but the code in a printed QR or a bot deep link still attributes, because the cookie and the bot payload carry the code, never the slug.

### Related events

- `link.created`: the link was authored.
- `link.archived`: the link was put out of use.

```json
{
  "id": "evt_01HX...",
  "type": "link.updated",
  "created_at": "2026-11-21T10:02:40Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "link": {
      "id": "7c2e5a90-3f41-4b8d-9e62-1a0d4c8b7f35",
      "name": "YouTube description",
      "slug": "youtube",
      "code": "K7PMQ2X",
      "destination": "plan",
      "plan_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "url": "https://my.subscriby.net/jane/go/youtube",
      "expires_at": null,
      "archived_at": null,
      "clicks_total": 48
    },
    "changes": {
      "slug": {
        "from": "yt",
        "to": "youtube"
      },
      "url": {
        "from": "https://my.subscriby.net/jane/go/yt",
        "to": "https://my.subscriby.net/jane/go/youtube"
      }
    }
  }
}
```

### `link.archived`

A Smart Link was put out of use.

### When this fires

A creator archived the link on the dashboard, over the REST API (`DELETE`) or via the `archive_link` MCP tool. Archiving is the only removal a link has: its row, the members it brought and the money they paid all stay, so the funnel keeps adding up. From this moment its address lands on the portal home without counting, and a visit still waiting in a browser is attributed to it when that visitor signs in. Archiving a link already archived fires nothing.

### Related events

- `link.created`: the link was authored.
- `link.updated`: the link's fields changed.

```json
{
  "id": "evt_01HX...",
  "type": "link.archived",
  "created_at": "2026-12-01T08:30:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "link": {
      "id": "7c2e5a90-3f41-4b8d-9e62-1a0d4c8b7f35",
      "name": "YouTube description",
      "slug": "youtube",
      "code": "K7PMQ2X",
      "destination": "plan",
      "plan_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "url": "https://my.subscriby.net/jane/go/youtube",
      "expires_at": null,
      "archived_at": "2026-12-01T08:30:11+00:00",
      "clicks_total": 1204
    }
  }
}
```

## Family `subscription`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `subscription.created` | `project-subscription:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.activated` | `project-subscription:view` | `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.trial_started` | `project-subscription:view` | `access_code`, `plan_id`, `project_id`, `provider`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.trial_converting` | `project-subscription:view` | `plan_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.trial_expired` | `project-subscription:view` | `ends_at`, `plan_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `subscription.renewed` | `project-subscription:view` | `amount`, `currency`, `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.reactivated` | `project-subscription:view` | `ends_at`, `plan_id`, `subscriber_id`, `subscription_id` |
| `subscription.paused` | `project-subscription:view` | `paused_at`, `plan_id`, `subscriber_id`, `subscription_id` |
| `subscription.unpaused` | `project-subscription:view` | `plan_id`, `resumed_at`, `subscriber_id`, `subscription_id` |
| `subscription.past_due` | `project-subscription:view` | `external_payment_id`, `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.unpaid` | `project-subscription:view` | `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `subscription.cancelled` | `project-subscription:view` | `paypal_event`, `plan_id`, `provider`, `reason`, `subscriber_id`, `subscription_id` |
| `subscription.expired` | `project-subscription:view` | `ends_at`, `plan_id`, `subscriber_id`, `subscription_id` |
| `subscription.refunded` | `project-subscription:view` | `amount`, `external_payment_id`, `full_refund`, `plan_id`, `reason`, `subscriber_id`, `subscription_id` |
| `subscription.upgraded` | `project-subscription:view` | `from_plan_id`, `proration_amount`, `subscriber_id`, `subscription_id`, `to_plan_id` |
| `subscription.downgraded` | `project-subscription:view` | `from_plan_id`, `proration_amount`, `subscriber_id`, `subscription_id`, `to_plan_id` |
| `subscription.payment_recovered` | `project-subscription:view` | `access_restored`, `payment_id`, `plan_id`, `provider`, `recovered_at`, `subscriber_id`, `subscription_id` |
| `subscription.access_suspended` | `project-subscription:view` | `grace_days`, `grace_ends_at`, `payment_failed_at`, `plan_id`, `subscriber_id`, `subscription_id`, `suspended_at` |
| `subscription.access_restored` | `project-subscription:view` | `plan_id`, `restored_at`, `subscriber_id`, `subscription_id`, `suspended_at` |
| `subscription.cancellation_feedback` | `project-subscription:view` | `cancellation_id`, `feedback`, `offer_shown`, `plan_id`, `reason`, `subscriber_id`, `subscription_id`, `surface` |
| `subscription.offer_taken` | `project-subscription:view` | `cancellation_id`, `coupon_code`, `offer`, `plan_id`, `resumes_at`, `subscriber_id`, `subscription_id` |

### `subscription.created`

New subscription created via access-code redemption or cardless trial.

### When this fires

Exactly two paths emit this event:

- **Access-code redemption**: a subscriber redeems a code against a plan.
- **Cardless trial start**: a subscriber begins a trial that took no payment method.

Both are zero-payment acquisitions. Every paid acquisition (every payment provider, both recurring subscriptions and one-time passes) emits `subscription.activated` instead, and never emits `subscription.created`.

> This event does **not** fire for paid checkouts. A card, wallet, or crypto purchase emits `subscription.activated` instead. If you are building access control for a paying audience, subscribe to both.

The `data` keys differ by path. Absent keys are **omitted entirely**, not sent as `null`.

> `access_code` carries the complete code. It is already consumed and cannot be redeemed again, but treat it as you would any other customer identifier and avoid logging it into systems you do not control.

### Caveats

- Do not treat this as the universal "a subscription exists" signal. For paid projects it never fires. The reliable pattern is to subscribe to both `subscription.created` and `subscription.activated` and de-duplicate on `data.subscription_id`.
- The access-code path also emits `access_code.redeemed` and either `member.joined` or `member.trial_joined` for the same subscription.
- The cardless-trial path also emits `subscription.trial_started` and `member.trial_joined`.
- The `POST /v1/webhook-endpoints/{endpoint}/test` endpoint sends a synthetic `subscription.created` payload regardless of your project's payment configuration. A successful test does not prove this event will fire in production.

### Related events

- `subscription.activated`: the paid-checkout equivalent.
- `access_code.redeemed`: fires alongside on the access-code path.
- `subscription.trial_started`: fires alongside on the cardless-trial path.


### `subscription.activated`

A paid subscription is acquired. Fires once, at first activation.

### When this fires

On the **first successful payment** for a subscription, across every payment provider: Stripe, PayPal, Paystack, Razorpay, Skrill, CeyPay, and CoinPayments. It covers both recurring subscriptions and one-time (non-recurring) passes.

It fires **once per subscription**, at acquisition. It is not a general "became active" signal:

| Transition                              | Event actually emitted       |
| --------------------------------------- | ---------------------------- |
| First paid checkout                     | `subscription.activated`     |
| Recurring renewal charge                | `subscription.renewed`       |
| Paused → resumed                        | `subscription.unpaused`      |
| Cancelled → reinstated before `ends_at` | `subscription.reactivated`   |
| Past-due → collected                    | `subscription.renewed`       |
| Trial → paying                          | `member.converted`           |
| Access code / cardless trial            | `subscription.created`       |

A Stripe subscription that begins in a trial still emits `subscription.activated` at acquisition, because the provider creates the subscription at that moment. The later trial-to-paid transition emits `member.converted` only.

> This is the paid-acquisition event. If you only subscribe to one subscription event for a paying audience, subscribe to this one, not `subscription.created`, which never fires for paid checkouts.

`data.provider` is never `access_code` on this event; code redemptions emit `subscription.created` instead.

### Caveats

- **Once per subscription.** Stripe and PayPal de-duplicate with a persistent guard key; the remaining providers emit only on the non-renewal branch of their payment handler. Renewals never re-emit it.
- To capture _every_ acquisition path (paid, comped code, and cardless trial) subscribe to both `subscription.activated` and `subscription.created`, then de-duplicate on `data.subscription_id`.
- Paid acquisitions do **not** emit `member.joined`. That event is access-code-only. Use `subscription.activated` as the paid-audience join signal.
- `payment.succeeded` fires for the same charge and carries the amount, currency, and external payment id, which this event does not.
- The `POST /v1/webhook-endpoints/{endpoint}/test` endpoint sends a synthetic `subscription.created` payload, never `subscription.activated`. Testing an endpoint does not exercise this event.

### Related events

- `subscription.created`: the zero-payment acquisition equivalent.
- `payment.succeeded`: the charge behind this activation.
- `subscription.renewed`: every subsequent cycle.
- `member.converted`: trial-to-paying transition.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.activated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe"
  }
}
```

### `subscription.trial_started`

Trial-enabled plan starts free window.

### When this fires

A subscriber starts a trial on a trial-enabled plan. Three paths emit it: a cardless trial, an access-code redemption against a trial plan, or a **Stripe** checkout that begins in a trial window.

Trial checkouts through the other providers (PayPal, Paystack, Razorpay, Skrill, CeyPay, CoinPayments) do not currently emit this event; only Stripe reports the trialing status transition back to Subscriby.

> Pairs with `member.trial_joined`: both fire together when a subscriber starts a trial on the cardless-trial and access-code paths.

The `data` keys differ by path. Absent keys are **omitted entirely**, not sent as `null`.

### Caveats

- On the cardless-trial and access-code paths this is paired with `subscription.created` and `member.trial_joined` for the same `subscription_id`. On the Stripe path it is paired with `subscription.activated` instead, and no `member.*` join event fires.
- Plans with `trial_days = 0` skip this event entirely.

### Related events

- `subscription.trial_converting`: fires 24h before `trial_ends_at`.
- `subscription.trial_expired`: fires if no conversion occurs.


### `subscription.trial_converting`

Trial about to convert. Fires 24h before `trial_ends_at`.

### When this fires

Fires 24 hours before `trial_ends_at` to give consumers a window to send conversion-reminder messaging. Emitted once per trial, by the hourly trial-conversion notifier.

> Fires exactly once per trial, 24 hours before `trial_ends_at`.

### Caveats

- Idempotency is enforced server-side: each trial receives this event at most once.
- If `trial_ends_at` is moved closer than 24h after the trial has already started, the notice may not fire.

### Related events

- `subscription.trial_started`: predecessor.
- `subscription.activated`, `member.converted`: fire on successful conversion.
- `subscription.trial_expired`: alternative path if conversion fails.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.trial_converting",
  "created_at": "2026-05-24T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "trial_ends_at": "2026-05-25T10:05:00Z"
  }
}
```

### `subscription.trial_expired`

Trial ended without conversion.

### When this fires

A trial ends without conversion. Emitted alongside `subscription.expired` for the same subscription.

### Caveats

- Successful conversions fire `subscription.activated` and `member.converted` instead.
- Expect `subscription.expired` and `member.churned` to follow for the same subscriber.

### Related events

- `subscription.trial_started`: predecessor.
- `subscription.expired`: fires alongside.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.trial_expired",
  "created_at": "2026-05-25T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "trial_ends_at": "2026-05-25T10:05:00Z",
    "ends_at": "2026-05-25T10:05:00Z"
  }
}
```

### `subscription.renewed`

Recurring billing successfully charged the subscriber.

### When this fires

Recurring billing successfully charges the subscriber and the subscription is renewed for another period.

### Caveats

- A `subscription.renewed` is always paired with a `payment.succeeded` for the same charge.
- Currency may differ from the plan's nominal currency for providers that auto-convert at the gateway.

### Related events

- `payment.succeeded`: paired payment event.
- `subscription.past_due`, `subscription.unpaid`: failure paths.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.renewed",
  "created_at": "2026-06-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe",
    "amount": "29.00",
    "currency": "USD"
  }
}
```

### `subscription.reactivated`

Cancelled subscription re-activated before `ends_at`.

### When this fires

A previously cancelled subscription is reactivated before its `ends_at`. The subscription returns to the active state and the next billing cycle resumes.

### Caveats

- Reactivation is only possible while `ends_at` is in the future. After expiration, a new subscription must be created instead.
- Pairs with a renewed provider subscription for paid plans; the next charge will follow normal cadence.

### Related events

- `subscription.cancelled`: predecessor.
- `subscription.expired`: alternative path if reactivation does not occur.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.reactivated",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "ends_at": "2026-06-18T10:05:00Z"
  }
}
```

### `subscription.paused`

A member's access was suspended. Billing is unaffected and continues on schedule.

### When this fires

A creator suspended a member's **access**. `payment_status` becomes `paused`, `paused_at` is stamped, and the member is removed from every linked resource.

> **This is an access pause, not a billing pause.** The member's payment provider keeps charging them on schedule. Subscriby does not pause collection, suspend the PayPal agreement, or otherwise hold the charge. If you need billing to stop, cancel instead.
>
> The split is deliberate: Subscriby settles through seven providers and only some can hold a recurring charge at all, so a pause meaning "stop billing" would work on some providers and silently not on others. Access is something Subscriby controls directly, so it behaves identically everywhere.

Before 1 September 2026 this event fired without anything happening: no provider was called _and_ no access was removed. If you built on the old behaviour, note that a paused member now genuinely loses access.

### Caveats

- Pausing does not change `ends_at`, and does not stop the clock. The member is still being billed, so a long pause costs them money for access they do not have. Tell them, or cancel instead.
- Access removal is queued, one call per linked resource, so it completes shortly after this event rather than atomically with it.
- Pausing does not detach resources, so no `member.resource_removed` events follow. Revocation happens only on expiry or cancellation.

### Related events

- `subscription.unpaused`: paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.paused",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "paused_at": "2026-05-18T10:05:00Z"
  }
}
```

### `subscription.unpaused`

Paused subscription resumes; resource invite links re-issued.

### When this fires

A suspended member has their access restored, with **fresh** invite links: an invite link revoked on pause cannot be un-revoked.

Billing is not mentioned here because it never stopped: pausing suspends access only, so there is nothing on the provider side to resume.

### Caveats

- Expect `member.resource_added` entries as resources are re-attached. `subscription.activated` does **not** follow an unpause; it fires only once, at first paid acquisition.
- Renewal cadence resumes from the original `ends_at` boundary, not the unpause moment.

### Related events

- `subscription.paused`: paired transition.
- `member.resource_added`: re-grant signal.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.unpaused",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resumed_at": "2026-05-22T10:05:00Z"
  }
}
```

### `subscription.past_due`

Billing fails but grace period is active.

### When this fires

A scheduled charge fails but the subscription remains within its grace window. The platform will continue to attempt collection.

Coverage is partial: only **Stripe** and **Razorpay** report the past-due transition back to Subscriby. Failed renewals on PayPal, Paystack, Skrill, CeyPay, and CoinPayments emit `payment.failed` without a matching `subscription.past_due`, so treat `payment.failed` as the reliable cross-provider signal.

### Caveats

- Pairs with a `payment.failed` event for the underlying charge.
- If retries succeed, `subscription.renewed` follows. If grace expires, `subscription.unpaid` fires instead.

### Related events

- `payment.failed`: paired payment event.
- `subscription.unpaid`: grace-window terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.past_due",
  "created_at": "2026-06-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "razorpay",
    "external_payment_id": "pay_NxYz.."
  }
}
```

### `subscription.unpaid`

Billing permanently failed; grace expired.

### When this fires

A subscription's grace period ends without successful collection. The provider has given up retrying. Resource access is typically revoked shortly after.

This event is emitted for **Stripe only**; it depends on the provider reporting an `unpaid` subscription status. On every other provider, an abandoned subscription surfaces as `subscription.expired` once `ends_at` passes, with no preceding `subscription.unpaid`.

### Caveats

- After this event, the subscription is non-recoverable on its current terms; the subscriber must restart with a new subscription.
- Expect `subscription.expired` and `member.churned` to follow.

### Related events

- `subscription.past_due`: predecessor inside the grace window.
- `subscription.expired`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.unpaid",
  "created_at": "2026-07-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe"
  }
}
```

### `subscription.cancelled`

Cancellation recorded; access continues until `ends_at`.

### When this fires

Cancellation is recorded by the subscriber, by the creator, or by the payment provider (a gateway-side cancellation, or a terminal payment failure on CeyPay, CoinPayments or Skrill). If the paid period still has time left, the subscription stays active and the subscriber keeps access until `ends_at`, after which `subscription.expired` fires. If no paid period remains, `ends_at` is set to the cancellation moment and resource access is revoked straight away.

### Caveats

- Cancellation is reversible until `ends_at`; see `subscription.reactivated`.
- A renewal does not occur after cancellation; `subscription.renewed` will not fire.

### Related events

- `subscription.expired`: fires when the period ends.
- `subscription.reactivated`: reverse path.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.cancelled",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe"
  }
}
```

### `subscription.expired`

`ends_at` reached; access revoked.

### When this fires

The subscription's `ends_at` has passed. Resource access is revoked and the subscription transitions to its terminal state.

### Caveats

- Pairs with `member.churned` when this is the subscriber's last active subscription.
- Resource access is revoked as part of expiry; expect `member.resource_removed` events for each granted resource.

### Related events

- `subscription.cancelled`, `subscription.unpaid`, `subscription.trial_expired`: predecessors.
- `member.churned`: paired member-level event.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.expired",
  "created_at": "2026-06-18T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "ends_at": "2026-06-18T10:05:00Z"
  }
}
```

### `subscription.refunded`

Refund recorded against a subscription.

### When this fires

A **full** subscription-level refund settles. The subscription is always expired as a result: resource access is revoked and `subscription.expired` (plus `member.churned` when this was the subscriber's last active subscription) follows for the same subscription.

> Fires only for a **settled** refund. A refund a provider has queued but not yet paid out raises nothing; access is never revoked for money that has not actually moved.

### Caveats

- Emitted by Stripe, PayPal, Paystack, Razorpay and Skrill. CoinPayments and CeyPay expose no refund notification, so a refund taken there is invisible to this event.
- A **partial** refund raises `payment.refunded` only. This event means the whole charge came back, and access is revoked with it.
- Skrill reports a chargeback rather than a merchant refund, and only if the creator's Skrill account is configured to post one.
- Subscriby expires the subscription itself on a full refund; it does not wait for the provider's own cancellation to arrive.
- For per-payment refunds (no subscription mutation), see `payment.refunded`.

### Related events

- `payment.refunded`: payment-level analogue.
- `subscription.cancelled`: often paired in practice.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.refunded",
  "created_at": "2026-05-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "amount": "29.00",
    "full_refund": true,
    "external_payment_id": "pi_3Nxy..",
    "reason": "requested_by_customer"
  }
}
```

### `subscription.upgraded`

Subscriber moved to a higher-priced plan.

### When this fires

A subscriber is switched to a higher-priced plan on the same project. The plan assignment, currency, and stored price on the Subscriby subscription record are updated, and this event reports the move.

The switch does not itself perform a provider-side pro-ration or issue a charge. Any billing adjustment is whatever the provider does on the next cycle.

### Caveats

- Direction is decided by comparing the two plan prices, normalised to USD, at switch time. Only a strictly higher new price emits `subscription.upgraded`; an **equal-price switch emits `subscription.downgraded`**, which is worth guarding for if you offer same-price plan swaps.
- Trial windows do not carry across switches; if the destination plan has a trial it does not start.

### Related events

- `subscription.downgraded`: opposite direction.
- `payment.succeeded`: the next successful charge on the new plan.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.upgraded",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "to_plan_id": "e07b4a29-51c6-4d83-9f10-2b8ac635d174",
    "proration_amount": null
  }
}
```

### `subscription.downgraded`

Subscriber moved to a lower-priced plan.

### When this fires

A subscriber is switched to a lower-priced plan on the same project. The plan assignment, currency, and stored price on the Subscriby subscription record are updated, and this event reports the move.

The switch does not itself perform a provider-side pro-ration or issue a credit. Any billing adjustment is whatever the provider does on the next cycle.

### Caveats

- No credit or refund is issued by this action. If you owe subscribers a mid-cycle credit on downgrade, apply it yourself through the provider.
- Direction is decided by comparing the two plan prices, normalised to USD. Anything that is not strictly more expensive lands here, so a **switch between two equally-priced plans emits this event**, not `subscription.upgraded`.
- Resource access tied to the higher tier may be revoked on the next renewal cycle.

### Related events

- `subscription.upgraded`: opposite direction.
- `member.resource_removed`: emitted when premium-tier resources are detached.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.downgraded",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_plan_id": "e07b4a29-51c6-4d83-9f10-2b8ac635d174",
    "to_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "proration_amount": null
  }
}
```

### `subscription.payment_recovered`

A failed renewal was settled, and the grace clock on the subscription closed.

### When this fires

A renewal that had failed is paid: the rail's next charge settles, or the rail reports the subscription active again before the money reaches the ledger. Either closes the clock Revenue Recovery opened at the failure, converts every notice sent during the window and stamps `recovered_at`. When the window had already closed and access had been paused, the member's invite links are reissued and they are welcomed back, which `subscription.access_restored` reports separately.

Only a renewal of a membership that has paid before opens a clock, so this never fires for a first purchase or for a one-time rail. A charge that settles on a subscription with no open clock fires `subscription.renewed` alone.

### Related events

- `subscription.access_suspended`: the pause this may be undoing.
- `subscription.access_restored`: the reissued links, when `access_restored` is `true`.
- `payment.succeeded`: the charge behind it.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.payment_recovered",
  "created_at": "2026-10-14T10:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "provider": "stripe",
    "payment_id": "f8e1c3a5-2d7b-4e96-b0c4-9a5d3f7e1b28",
    "access_restored": true,
    "recovered_at": "2026-10-14T10:00:00+00:00"
  }
}
```

### `subscription.access_suspended`

A failed renewal's grace window closed unpaid, and the member's access was paused.

### When this fires

The grace window the project gives a failed renewal (0 to 30 days, set per project; a new project starts at 0, which pauses at the failure itself) ran out with no settled charge. The member is removed from the project's resources and told that their access is paused and how to pay, the subscription stays `past_due` so the rail's own retries can still settle it, and the next settled charge brings them back. A window of zero days pauses at the failure itself.

A membership that never paid is revoked at the failure without a window, as it always was, and fires `subscription.expired` instead.

### Caveats

- The subscription's status does not change on this event: it was already `past_due`, and stays so until a charge settles or the rail gives up (`subscription.unpaid`).
- A creator's own pause (`subscription.paused`) is a different thing and never collides with this: a subscription the creator paused is left out of the grace sweep.

### Related events

- `subscription.past_due`: the failure that opened the window.
- `subscription.payment_recovered`: the charge that ends it.
- `subscription.access_restored`: the member let back in.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.access_suspended",
  "created_at": "2026-10-19T10:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "payment_failed_at": "2026-10-12T10:00:00+00:00",
    "grace_days": 7,
    "grace_ends_at": "2026-10-19T10:00:00+00:00",
    "suspended_at": "2026-10-19T10:30:00+00:00"
  }
}
```

### `subscription.access_restored`

A member whose access was paused for non-payment was let back in.

### When this fires

A charge settled, or the rail reported the subscription active, for a member whose access had been paused at the close of a grace window. Their bearer links are revoked and reissued, they are welcomed back, and the clock is cleared. It fires beside `subscription.payment_recovered`, which carries the payment; this one carries the pause it undid.

### Related events

- `subscription.access_suspended`: the pause.
- `subscription.payment_recovered`: the charge, raised beside this.
- `member.resource_added`: the resources the member rejoins.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.access_restored",
  "created_at": "2026-10-21T08:15:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "suspended_at": "2026-10-19T10:30:00+00:00",
    "restored_at": "2026-10-21T08:15:00+00:00"
  }
}
```

### `subscription.cancellation_feedback`

A cancelling member said why they are leaving.

### When this fires

A member reached the cancellation screen, on the portal or in a connector chat, and answered the question the project asks on the way out: a reason from the fixed list and, if they wrote one, a sentence of their own. It fires the moment the reason is recorded, before the member sees the offer or confirms, so a member who then takes the offer and stays still appears here. The creator is alerted at the same time. A project that switched the question off asks nothing and fires nothing; its offers are still counted, through `subscription.offer_taken` and the cancellation records.

### Related events

- `subscription.offer_taken`: the member took the offer instead of cancelling.
- `subscription.cancelled`: the member went on and cancelled.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.cancellation_feedback",
  "created_at": "2026-10-22T09:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "cancellation_id": "9d2c6b71-3e48-4f0a-a5d7-1b8e4c9f2a36",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "reason": "too_expensive",
    "feedback": "Money is tight this quarter.",
    "offer_shown": "pause",
    "surface": "portal"
  }
}
```

### `subscription.offer_taken`

A cancelling member took the offer the cancellation screen made.

### When this fires

A member on the cancellation screen accepted the one offer the project makes for their rail: a pause for one billing cycle where the rail can hold the charge (Stripe, PayPal), a discount on the renewals where the rail can carry a coupon (Stripe), or a coupon to come back with everywhere else. A pause holds the charge at the gateway and pauses access, and the hourly sweep lets the member back in when `resumes_at` passes; a discount is minted once at the gateway and applied to the subscription; a return coupon is handed to the member on the screen and in a chat message, and the cancellation goes on. The offer is re-derived when the member accepts, so a stale screen cannot claim an offer the project no longer makes.

### Caveats

- A pause taken here keeps the subscription: it reads as `paused` until `resumes_at`, and no `subscription.cancelled` follows. A return coupon does not: the cancellation goes on and `subscription.cancelled` fires as usual.
- A member sees one offer per cancellation. Declining it fires nothing; the shown offer is still counted on the cancellation record.

### Related events

- `subscription.cancellation_feedback`: the reason recorded just before.
- `subscription.paused` / `subscription.unpaused`: the pause's two ends.
- `coupon.redeemed`: a return coupon used at checkout.

```json
{
  "id": "evt_01HX...",
  "type": "subscription.offer_taken",
  "created_at": "2026-10-22T09:31:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "cancellation_id": "9d2c6b71-3e48-4f0a-a5d7-1b8e4c9f2a36",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "offer": "pause",
    "coupon_code": null,
    "resumes_at": "2026-11-22T09:31:00+00:00"
  }
}
```

## Family `sequence`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `sequence.created` | `project-sequence:view` | `sequence` |
| `sequence.updated` | `project-sequence:view` | `sequence` |
| `sequence.deleted` | `project-sequence:view` | `sequence` |
| `sequence.enrolled` | `project-sequence:view` | `enrollment_id`, `next_due_at`, `plan_id`, `sequence_id`, `subscriber_id`, `subscription_id`, `trigger` |
| `sequence.step_sent` | `project-sequence:view` | `coupon_code`, `enrollment_id`, `position`, `sent_at`, `sequence_id`, `step_id`, `subscriber_id` |
| `sequence.converted` | `project-sequence:view` | `converted_at`, `enrollment_id`, `payment_id`, `sequence_id`, `subscriber_id` |
| `sequence.exited` | `project-sequence:view` | `enrollment_id`, `exited_at`, `reason`, `sequence_id`, `subscriber_id` |

### `sequence.created`

A recovery sequence was built in a project.

### When this fires

A creator built a sequence on the Revenue Recovery page: a name, a trigger and whether it runs. It fires on **authoring**, with no steps yet; the steps arrive one by one as `sequence.updated`. Nobody is enrolled by this event: enrolment waits for the trigger to fire for a member, and a sequence with no steps enrols nobody even then.

### Related events

- `sequence.updated`: the steps arrive, and every later change.
- `sequence.enrolled`: the first member enters it.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.created",
  "created_at": "2026-10-22T09:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "sequence": {
      "id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
      "name": "Win-back after churn",
      "trigger": "churned",
      "active": true,
      "steps": [],
      "created_at": "2026-10-22T09:30:00+00:00",
      "updated_at": "2026-10-22T09:30:00+00:00",
      "deleted_at": null
    }
  }
}
```

### `sequence.updated`

A recovery sequence changed.

### When this fires

A creator renamed the sequence, moved it to another trigger, switched it on or off, or added, rewrote or removed a step on the Revenue Recovery page. Every save fires it, so a consumer always holds the snapshot after the latest write. Switching a sequence off also lets every member part-way through it go, each as `sequence.exited` with the reason `disabled`, and enrols nobody new until it runs again.

### Caveats

- **Positions move, enrolments do not.** A member who was due the removed step receives the step that took its place, and a member past the last remaining step completes on the next sweep. Read the steps by id if you track one.
- A sequence may hold up to 8 steps. The ninth is refused on the dashboard and fires nothing.

### Related events

- `sequence.created`: the sequence was built.
- `sequence.exited`: the members let go when the sequence was switched off.
- `sequence.deleted`: the sequence was deleted.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.updated",
  "created_at": "2026-10-22T09:45:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "sequence": {
      "id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
      "name": "Win-back after churn",
      "trigger": "churned",
      "active": true,
      "steps": [
        {
          "id": "6b1f3d58-9c2a-4e7d-a0f4-2d8c7b5e1a93",
          "position": 1,
          "delay_days": 3,
          "coupon_id": null
        },
        {
          "id": "9d4e2a07-1b6c-4f58-8e3a-5c7f0d2b9e41",
          "position": 2,
          "delay_days": 7,
          "coupon_id": "c2d8e4f1-7a3b-4c9d-b5e6-1f0a9d8c7b65"
        }
      ],
      "created_at": "2026-10-22T09:30:00+00:00",
      "updated_at": "2026-10-22T09:45:00+00:00",
      "deleted_at": null
    }
  }
}
```

### `sequence.deleted`

A recovery sequence was deleted.

### When this fires

A creator deleted the sequence on the Revenue Recovery page. Every member part-way through it is let go first, each as `sequence.exited` with the reason `deleted`, and only then does this fire with the final snapshot. The row is kept out of sight with its history: the messages already sent stay in the project's activity ledger and still count as converted when the member pays again.

### Related events

- `sequence.exited`: the members let go, with the reason `deleted`, just before this.
- `sequence.updated`: the sequence's earlier changes.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.deleted",
  "created_at": "2026-11-02T14:10:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "sequence": {
      "id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
      "name": "Win-back after churn",
      "trigger": "churned",
      "active": true,
      "steps": [
        {
          "id": "6b1f3d58-9c2a-4e7d-a0f4-2d8c7b5e1a93",
          "position": 1,
          "delay_days": 3,
          "coupon_id": null
        },
        {
          "id": "9d4e2a07-1b6c-4f58-8e3a-5c7f0d2b9e41",
          "position": 2,
          "delay_days": 7,
          "coupon_id": "c2d8e4f1-7a3b-4c9d-b5e6-1f0a9d8c7b65"
        }
      ],
      "created_at": "2026-10-22T09:30:00+00:00",
      "updated_at": "2026-11-02T14:10:00+00:00",
      "deleted_at": "2026-11-02T14:10:00+00:00"
    }
  }
}
```

### `sequence.enrolled`

A member entered a recovery sequence.

### When this fires

The sequence's trigger fired for a member of the project and nothing stood in the way. For `churned` that is `member.churned`: the member's last live membership ended, through its end date, a cancellation that ran out or the close of a failed-payment grace window. For `lead` it is `member.lead_created`; for `stalled_checkout` the hourly sweep's `checkout.stalled`; for `trial_ending` the hourly trial sweep, once a trial without a card is within the project's lead time of its end. The member is enrolled into every running sequence on that trigger, once each, provided the sequence has at least one step, the member holds nothing the trigger counts as a conversion (any live membership, or for `trial_ending` a paid one), they have not asked the project's sequences to stop, they are not already part-way through that sequence, and the project owner's plan includes sequences. `next_due_at` is the moment of the trigger plus the first step's delay; the step goes out on the first hourly sweep after it.

### Caveats

- A member who buys again before the first step is due never receives it: the sweep finds them holding a live membership and ends the passage as `sequence.converted` instead.
- A sequence switched off between the trigger and the first step lets the member go as `sequence.exited` with the reason `disabled`.

### Related events

- `member.churned`: the churn trigger.
- `sequence.step_sent`: the steps that follow.
- `sequence.converted`: how a passage ends well.
- `sequence.exited`: how a passage ends otherwise.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.enrolled",
  "created_at": "2026-10-25T08:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
    "trigger": "churned",
    "next_due_at": "2026-10-28T08:00:00+00:00"
  }
}
```

### `sequence.step_sent`

One step of a recovery sequence reached a member.

### When this fires

The hourly sweep found the step due and the member's connected account took the message: the creator's text with the placeholders filled for this member, the way back to the project as a button, and the step's coupon code in the text where the creator placed it. The message goes out as an announcement, so the member's channel choices and opt-outs apply. A platform that refuses for the moment (a rate limit, a passing fault, a misconfigured installation) fires nothing and the step stays due for the next hour; one that refuses for good, or a member with no account to reach, fires nothing and ends the passage as `sequence.exited` with the reason `opted_out`. After the last step the passage completes quietly: no event marks completion.

### Related events

- `sequence.enrolled`: the passage this step belongs to.
- `sequence.converted`: the member paid again after reading it.
- `coupon.redeemed`: the step's coupon used at checkout.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.step_sent",
  "created_at": "2026-10-28T08:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "step_id": "6b1f3d58-9c2a-4e7d-a0f4-2d8c7b5e1a93",
    "position": 1,
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "coupon_code": null,
    "sent_at": "2026-10-28T08:05:00+00:00"
  }
}
```

### `sequence.converted`

A member in a recovery sequence paid again.

### When this fires

A charge settled for the member in the project while they were part-way through one or more sequences, or the sweep found them holding a live membership again before a charge reached the ledger. Every open passage of theirs in the project ends as won back: the steps they received since enrolling are counted as converted by that payment, the creator is alerted, and this fires once per passage. The win is credited to the sequence whether or not the member used the coupon a step carried.

### Related events

- `payment.succeeded`: the charge behind it.
- `subscription.activated`: the membership the member bought back.
- `sequence.exited`: every other way a passage ends.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.converted",
  "created_at": "2026-11-01T17:20:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "payment_id": "f8e1c3a5-2d7b-4e96-b0c4-9a5d3f7e1b28",
    "converted_at": "2026-11-01T17:20:00+00:00"
  }
}
```

### `sequence.exited`

A member left a recovery sequence before its last step.

### When this fires

A passage ended for a reason other than the member paying again: the creator switched the sequence off (`disabled`) or deleted it (`deleted`), or the member could not be reached on any connected account and the platform refused for good (`opted_out`). It fires once per passage. A passage that ran through every step completes without an event, and one that ended because the member paid again fires `sequence.converted` instead.

### Related events

- `sequence.updated`: the switch-off behind a `disabled` exit.
- `sequence.deleted`: the deletion behind a `deleted` exit.
- `sequence.converted`: the one ending that is not an exit.

```json
{
  "id": "evt_01HX...",
  "type": "sequence.exited",
  "created_at": "2026-11-02T14:10:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "sequence_id": "3e9a7c21-5d84-4f06-b2c1-8a7e5d4f9b02",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "reason": "disabled",
    "exited_at": "2026-11-02T14:10:00+00:00"
  }
}
```

## Family `payment`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `payment.succeeded` | `project-subscription:view` | `amount`, `billing_reason`, `currency`, `external_payment_id`, `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `payment.failed` | `project-subscription:view` | `amount`, `currency`, `external_payment_id`, `plan_id`, `provider`, `reason`, `subscriber_id`, `subscription_id` |
| `payment.pending` | `project-subscription:view` | `order_id`, `plan_id`, `provider`, `session_id`, `subscriber_id` |
| `payment.refunded` | `project-subscription:view` | `amount`, `external_payment_id`, `full_refund`, `plan_id`, `reason`, `subscriber_id`, `subscription_id` |

### `payment.succeeded`

A provider confirms a successful charge.

### When this fires

A payment provider confirms a successful charge against a subscriber. Fires for both initial checkouts and recurring renewals.

### Caveats

- For first-time paid checkouts, `subscription.activated` is the matching subscription-level event, not `subscription.created`, which never fires for paid purchases.
- Renewals pair `payment.succeeded` with `subscription.renewed`.
- Card numbers, PAN, and CVV are never included in payloads.

### Related events

- `subscription.activated` (first payment), `subscription.renewed` (renewals): paired subscription events.
- `payment.failed`: alternative outcome.

```json
{
  "id": "evt_01HX...",
  "type": "payment.succeeded",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe",
    "external_payment_id": "pi_3Nxy..",
    "amount": "29.00",
    "currency": "USD",
    "billing_reason": "subscription_create"
  }
}
```

### `payment.failed`

A provider rejects a charge.

### When this fires

A payment provider rejects a charge: invalid card, insufficient funds, gateway risk, expired source. Emitted by Stripe, CeyPay, CoinPayments, Paystack, Razorpay and Skrill. PayPal does not emit `payment.failed`; a failed PayPal charge surfaces only through the subscription-level events.

### Caveats

- The paired subscription event differs by provider: Razorpay emits `subscription.past_due` alongside; CeyPay, CoinPayments and Skrill instead cancel the subscription and emit `subscription.cancelled`; Paystack emits nothing alongside; for Stripe, `subscription.past_due` arrives separately when Stripe next syncs the subscription's status. Do not assume a subscription event accompanies every `payment.failed`.
- A single billing cycle can produce multiple `payment.failed` events as the provider retries.

### Related events

- `payment.succeeded`: alternative outcome.
- `subscription.past_due`: paired subscription event for recurring failures.

```json
{
  "id": "evt_01HX...",
  "type": "payment.failed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe",
    "external_payment_id": "pi_3Nxy..",
    "reason": "Your card was declined.",
    "amount": "29.00",
    "currency": "USD"
  }
}
```

### `payment.pending`

A payment is initiated, awaiting provider confirmation.

### When this fires

A subscriber initiates checkout and is redirected to the provider, but the charge is not yet confirmed (bank transfer, crypto settlement, hosted-checkout sessions).

PayPal carries **neither** `session_id` nor `order_id`: a PayPal `payment.pending` gives you only `provider`, `plan_id`, and `subscriber_id`, so it cannot be correlated to a specific checkout attempt. Absent keys are omitted entirely rather than sent as `null`; the one exception is Stripe's `session_id`, which is always present on the Stripe path but may be `null`.

### Caveats

- A pending payment is not yet a subscription. `subscription_id` is intentionally absent.
- The same checkout may emit one `payment.pending` followed by either `payment.succeeded` or `payment.failed`. Correlate on `session_id` or `order_id` where the provider supplies one; for PayPal, fall back to `subscriber_id` plus `plan_id`.
- Subscribers who close the provider page without completing will not produce a final outcome event; pending sessions can hang indefinitely.

### Related events

- `payment.succeeded`, `payment.failed`: terminal outcomes.
- `subscription.activated`: fires alongside the `payment.succeeded` that completes a first checkout.

```json
{
  "id": "evt_01HX...",
  "type": "payment.pending",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "provider": "stripe",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "session_id": "cs_test_.."
  }
}
```

### `payment.refunded`

A specific charge is refunded, fully or partially.

### When this fires

A per-payment refund settles. Pairs with `subscription.refunded` when the refund covers the entire subscription.

> **Settled refunds only.** A refund a provider has queued but not yet paid out raises nothing; access is never revoked for money that has not actually moved.

### Caveats

- Emitted by Stripe, PayPal, Paystack, Razorpay and Skrill. CoinPayments and CeyPay expose no refund notification.
- Raised for partial refunds as well as full ones. Read `full_refund` to tell them apart; a partial refund leaves the subscription and its access untouched.
- Stripe reports a running total across refunds; the `amount` here is **this** refund, not the cumulative figure.
- Distinct from `subscription.refunded`, which represents the subscription's reaction. A refund may emit only `payment.refunded` if the subscription itself is unaffected.
- Partial refunds are represented by `amount` being less than the original charge.

### Related events

- `payment.succeeded`: predecessor.
- `subscription.refunded`: subscription-level analogue.

```json
{
  "id": "evt_01HX...",
  "type": "payment.refunded",
  "created_at": "2026-05-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "external_payment_id": "pi_3Nxy..",
    "amount": "29.00",
    "full_refund": true
  }
}
```

## Family `checkout`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `checkout.stalled` | `project-subscription:view` | `checkout_id`, `enrollment_id`, `plan_id`, `provider`, `stalled_at`, `started_at`, `subscriber_id`, `surface` |
| `checkout.recovered` | `project-subscription:view` | `checkout_id`, `enrollment_id`, `payment_id`, `plan_id`, `provider`, `recovered_at`, `stalled_at`, `subscriber_id`, `subscription_id`, `surface` |

### `checkout.stalled`

A checkout stayed open past the project's window.

### When this fires

The hourly sweep found a checkout started more than the project's window ago (`checkout_stall_hours`, 1 hour by default) with no charge settled for the member and no live membership held, and had not counted a stall for that member in the last day. The row is stamped, the event goes out, and the member enters every running sequence on the `stalled_checkout` trigger with the plan they were buying, so the step's button reopens that plan; `enrollment_id` names the first passage opened, or is `null` when the project runs no such sequence.

### Caveats

- A member who starts a checkout three times inside a day stalls once; the two later rows are stamped without an event.
- A stall says nothing about why. Stripe's session may have expired, the member may have changed their mind, or the gateway may have refused the card; the ledger only knows no charge settled.

### Related events

- `payment.pending`: the start of the checkout.
- `sequence.enrolled`: the passage the stall opened.
- `checkout.recovered`: how it ends well.

```json
{
  "id": "evt_01HX...",
  "type": "checkout.stalled",
  "created_at": "2026-10-20T11:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "checkout_id": "c7e1a9d4-2b63-4f58-9a07-5d8e3c1b6f24",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "provider": "stripe",
    "surface": "bot",
    "started_at": "2026-10-20T09:52:00+00:00",
    "stalled_at": "2026-10-20T11:00:00+00:00",
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03"
  }
}
```

### `checkout.recovered`

A charge settled for a member whose checkout had stalled.

### When this fires

The payment ledger recorded a successful charge for the member, through any door and on any rail, while one of their checkouts stood stalled. Every open checkout of the member closes on that charge; the event fires for each one that had stalled, with the charge and the membership it became, and the passage that was running when they came back. The passage itself ends as `sequence.converted` through the same charge.

### Caveats

- The charge need not be for the stalled plan: a member who stalled on the monthly plan and bought the annual one is recovered all the same.
- A member who holds a live membership before the window passes never stalls, so never recovers; their checkouts close without an event.

### Related events

- `checkout.stalled`: the stall this recovers.
- `payment.succeeded`: the charge.
- `sequence.converted`: the passage ending as a win on the same charge.

```json
{
  "id": "evt_01HX...",
  "type": "checkout.recovered",
  "created_at": "2026-10-21T08:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "checkout_id": "c7e1a9d4-2b63-4f58-9a07-5d8e3c1b6f24",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "provider": "stripe",
    "surface": "bot",
    "payment_id": "9f2c7b1e-4d83-4a56-b0e9-7c5d2a8f3b61",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "enrollment_id": "a4c7e912-3b5d-4f80-9e16-7d2a8c5b4f03",
    "stalled_at": "2026-10-20T11:00:00+00:00",
    "recovered_at": "2026-10-21T08:30:00+00:00"
  }
}
```

## Family `member`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `member.lead_created` | `project-user:view` | `created_at`, `project_id`, `smart_link_id`, `source`, `subscriber_id` |
| `member.joined` | `project-user:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id` |
| `member.trial_joined` | `project-user:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id`, `trial_ends_at` |
| `member.converted` | `project-user:view` | `plan_id`, `provider`, `subscriber_id`, `subscription_id` |
| `member.churned` | `project-user:view` | `ends_at`, `last_plan_id`, `plan_id`, `subscriber_id`, `subscription_id` |
| `member.removed` | `project-user:view` | `reason`, `subscriber` |
| `member.banned` | `project-user:view` | `reason`, `subscriber` |
| `member.unbanned` | `project-user:view` | `subscriber` |
| `member.kicked` | `project-user:view` | `reason`, `subscriber` |
| `member.resource_added` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.resource_pending` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.resource_reissued` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.access_extended` | `project-user:view` | `applies_at`, `banked_seconds`, `connector`, `ends_at`, `extended_seconds`, `outage_id`, `project_id`, `subscriber_id`, `subscription_id` |
| `member.resource_removed` | `project-user:view` | `connector`, `grant_id`, `mode`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id` |
| `member.identity_linked` | `project-user:view` | `connector`, `display_name`, `external_id`, `identity_id`, `preferred`, `source`, `subscriber_id` |
| `member.identity_unlinked` | `project-user:view` | `connector`, `external_id`, `identity_id`, `subscriber_id` |

### `member.lead_created`

A member row was created as a lead.

### When this fires

Somebody the project had never seen opened its bot, arrived through a Smart Link or a referral link, signed in to its portal or wrote to its support, and a member row was created for them with the status `lead`. It fires once per row, whichever door they came through, the moment the row is written; it never fires for a connected account adopted from a sibling project or linked by a backfill, because nobody just walked in. The lead sequences of Lead nurture enrol the member on the same event.

### Caveats

- The payload carries no name and no connected account. Resolve the member with [the member endpoint](https://docs.subscriby.net/api/v1/reference/members) using `data.subscriber_id`.
- A lead who buys later raises `subscription.activated` (a paid checkout) or `subscription.created` (an access code or a cardless trial) with the same `subscriber_id`; a lead who leaves without buying raises nothing more.

### Related events

- `sequence.enrolled`: the lead sequences the arrival enrols the member in, with `trigger` `lead`.
- `subscription.activated`: the paid-checkout join signal.

```json
{
  "id": "evt_01HX...",
  "type": "member.lead_created",
  "created_at": "2026-10-20T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "source": "bot",
    "smart_link_id": "a0c3e8d1-5f27-4b9e-8c64-3d1f2a7b6e95",
    "created_at": "2026-10-20T10:05:00+00:00"
  }
}
```

### `member.joined`

A subscriber joins by redeeming an access code against a paid plan.

### When this fires

A subscriber redeems an access code against a plan with no trial window, gaining access to the project.

That is the only path that emits this event. A card, wallet, or crypto checkout emits `subscription.activated` and `payment.succeeded`, but no `member.*` join event at all. If the redeemed plan carries a trial, `member.trial_joined` fires instead of this event.

> This event is **access-code-only**. Paid checkouts do not emit it. For a paying audience, use `subscription.activated` as the join signal.

### Caveats

- The payload does not carry the subscriber's connected accounts. Resolve them with [the member endpoint](https://docs.subscriby.net/api/v1/reference/members) using `data.subscriber_id`, which embeds `identities`, one row per connected account with the connector key and the platform's own id.
- Resource-level grants emit separate `member.resource_added` events as the dispatcher processes each invite.
- This event always accompanies `subscription.created` and `access_code.redeemed` for the same subscription.

### Related events

- `subscription.activated`: the paid-checkout join signal.
- `subscription.created`: fires alongside on this path.
- `member.trial_joined`: trial counterpart.

```json
{
  "id": "evt_01HX...",
  "type": "member.joined",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "access_code": "SLATE-SUNDAY-4F2A9"
  }
}
```

### `member.trial_joined`

A subscriber joins on a trial via cardless trial or access-code redemption.

### When this fires

Two paths emit this event:

- **Cardless trial start**: a subscriber begins a trial that took no payment method.
- **Access-code redemption on a trial plan**: the redeemed plan sets `trial_ends_at`, so this fires in place of `member.joined`.

A Stripe checkout that begins with a trial window emits `subscription.activated` and `subscription.trial_started`, but no `member.*` join event. Like `member.joined`, this event covers zero-payment acquisition only.

The `data` keys differ by path. Absent keys are **omitted entirely**, not sent as `null`.

### Caveats

- A trial-joined member emits `member.converted` if the trial converts to paid, or rolls into `member.churned` once the trial expires without converting.
- `member.converted` is currently emitted for **Stripe only**. Trials taken through other providers will not produce a conversion event.
- `subscription.created` and `subscription.trial_started` fire alongside this event on both paths.

### Related events

- `subscription.trial_started`: fires alongside.
- `member.converted`: fires on successful trial conversion (Stripe only).
- `member.joined`: non-trial counterpart.


### `member.converted`

A trial converts to a paying subscription.

### When this fires

A trial subscription successfully converts to a paying subscription: the subscription reaches `active` while the subscriber was previously in `trialing` status. Fires exactly once per conversion.

This event is currently emitted for **Stripe only**. Trials taken through PayPal, Paystack, Razorpay, Skrill, CeyPay, or CoinPayments do not produce a conversion event; detect those by watching `payment.succeeded` against a subscription you know began in trial.

### Caveats

- Pairs with `payment.succeeded` for the converting charge. `subscription.activated` does **not** fire at conversion; it already fired when the trialing subscription was first created.
- A subscriber who churns and starts a new trial later does not re-emit `member.converted` for the prior trial; each trial-conversion is its own bounded event.

### Related events

- `member.trial_joined`: predecessor.
- `subscription.activated`: fired earlier, when the trialing subscription was created; it does not repeat at conversion.

```json
{
  "id": "evt_01HX...",
  "type": "member.converted",
  "created_at": "2026-05-25T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "provider": "stripe"
  }
}
```

### `member.churned`

A subscriber's last active subscription lapsed.

### When this fires

A subscriber's last subscription is expired (by the five-minute expiry sweep, by a refund that ends access, or by a cancelled pass window) and no other subscription of theirs is still active. A cancellation or a failed payment does not churn the member on its own; churn follows only once the subscription is actually expired.

### Caveats

- A subscriber with multiple overlapping subscriptions does not churn until the last one ends.
- `member.churned` does not delete the subscriber row; if they re-subscribe later, a paid checkout emits `subscription.activated` and an access-code redemption emits `member.joined`.

### Related events

- `subscription.expired`: typical predecessor.
- `member.joined`: only if they return via an access code.

```json
{
  "id": "evt_01HX...",
  "type": "member.churned",
  "created_at": "2026-06-18T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "last_plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "ends_at": "2026-06-18T10:05:00Z"
  }
}
```

### `member.removed`

A subscriber is soft-deleted manually.

### When this fires

A creator manually removes a subscriber from the project. The subscriber is soft-deleted, their access is revoked, and any active subscription is cancelled.

### Caveats

- Distinct from a ban: removed subscribers can rejoin, banned subscribers cannot. See `member.banned`.
- Distinct from a kick, which moves the subscriber to churned without soft-deleting the row. See `member.kicked`.

### Related events

- `member.banned`, `member.kicked`: alternative discipline events.
- `subscription.cancelled`: fires alongside if there was an active subscription.

```json
{
  "id": "evt_01HX...",
  "type": "member.removed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "customer"
    },
    "reason": "creator_manual"
  }
}
```

### `member.banned`

A creator bans a subscriber.

### When this fires

A creator bans a subscriber. Their access is revoked, the connector removes them from all linked resources, and they cannot re-join the project until the ban is lifted.

### Caveats

- Bans persist across subscription cycles until explicitly lifted via `member.unbanned`.
- Active subscriptions are cancelled in the same flow; expect `subscription.cancelled`.

### Related events

- `member.unbanned`: paired transition.
- `member.kicked`: softer discipline.

```json
{
  "id": "evt_01HX...",
  "type": "member.banned",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "banned"
    },
    "reason": "spam"
  }
}
```

### `member.unbanned`

A ban is lifted; the subscriber returns to churned status.

### When this fires

A creator lifts a previously applied ban. The subscriber returns to a churned state: they can re-subscribe, but they do not automatically regain access to past subscriptions.

### Caveats

- Unbanning does not restore prior subscriptions; the subscriber must purchase a new one to regain access.
- A subsequent purchase fires `subscription.activated`; only an access-code redemption fires `member.joined`.

### Related events

- `member.banned`: paired transition.
- `subscription.activated`: fires if the subscriber repurchases.

```json
{
  "id": "evt_01HX...",
  "type": "member.unbanned",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "churned"
    }
  }
}
```

### `member.kicked`

A subscriber is kicked from the project without a ban.

### When this fires

A creator kicks a subscriber without banning them. The member's status moves to churned, every active subscription is cancelled, and the connector evicts them from every resource they held. The only difference from a ban is that a kick can be reversed by re-subscribing, whereas a ban blocks re-entry until it is lifted.

### Caveats

- A kick evicts the member from every resource their subscriptions granted; expect one `member.resource_removed` per resource.
- Every active subscription is cancelled in the same flow; expect `subscription.cancelled` for each.

### Related events

- `member.banned`: escalation path.
- `member.resource_removed`: paired resource event.

```json
{
  "id": "evt_01HX...",
  "type": "member.kicked",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber": {
      "id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "status": "churned"
    },
    "reason": "off_topic"
  }
}
```

### `member.resource_added`

A subscriber gains access to a specific resource.

### When this fires

Subscriby asks the resource's connector to give a subscriber access to one of the resources their subscription grants (on a connector that grants by link, a join-request invite link named after them) and writes the grant to the access ledger. Each resource grant emits its own event. The event marks the grant, not the subscriber's arrival: they may not have opened the link yet; the ledger row named by `grant_id` moves from `pending` to `granted` when they do. A manual perk arrives here too, once the creator completes its task (`creator_task.completed` precedes it).

### Caveats

- Ordering against the join event is not guaranteed: the dispatcher is queued before `member.joined` is emitted on the access-code path, and paid joins emit no `member.*` join event at all. Treat resource events as independent.
- A manual perk emits this event only when its creator task is completed, never at purchase; until then the member's grant is `pending` and `creator_task.opened` is what fired.

### Related events

- `member.resource_removed`: paired transition.
- `member.resource_pending`: the earlier event for the same `grant_id` when the place waited for an account the member had not connected; this one follows the moment they connect it, so a workflow pairs the two on `grant_id`.
- `member.joined`, `member.trial_joined`: typical predecessors.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_added",
  "created_at": "2026-05-18T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.resource_pending`

A subscriber is entitled to a resource but has no account on its connector yet, so access waits for them to connect one.

### When this fires

A purchase entitles a subscriber to a resource on a connector where the subscriber has no connected account: a member who bought on the portal with only an email, or a plan that spans a connector the member has not linked. Nothing can be issued, so the access ledger records a grant in state `pending_identity` and this event says so. The moment the member connects an account on that connector (from the portal, by signing in through the connector, or by adopting an account from a sibling project), the grant is issued and `member.resource_added` follows with the same `grant_id`.

### Caveats

- One event per resource the purchase entitles the member to on that connector; a plan with three channels raises three, all waiting on the same account.
- The member sees the waiting place on the receipt, the membership page and the access screen of the bot they did connect, each with the door that connects the account, and a day after the purchase (or a day before the pass window it belongs to opens) they are reminded once, by mail and in that chat, with the door. A creator presses **Remind to connect** in the member's flyout; an integration sends the same nudge with `POST /v1/subscriptions/{subscription}/remind-connection`, lists everyone waiting with `GET /v1/projects/{project}/members?access=waiting`, and a broadcast reaches them as the `waiting_on_connection` audience. None of these raise an event; the next event for the grant is `member.resource_added`.
- A subscription that ends before the account is connected leaves the grant `pending_identity` in the ledger; no `member.resource_removed` is raised for access that was never given.

### Related events

- `member.resource_added`: raised for the same `grant_id` once the account is connected and access is issued.
- `member.identity_linked`: the act that releases the pending grants.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_pending",
  "created_at": "2026-09-12T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.resource_reissued`

A subscriber's access to a resource is being reissued: the old grant is revoked and a fresh one follows.

### When this fires

A creator (over the API, an MCP agent, or the members page) asks for a subscriber's access to be reissued: the grant the subscriber held on a resource is revoked (on a connector that grants by link, the personal invite link dies) and the dispatcher that grants at purchase runs again to issue a fresh one. Each resource emits its own event, and `member.resource_added` follows for the new grant. The member's own **Refresh invite links** in the bot does the same and raises the same event.

### Caveats

- Revoking the old grant is best effort: a link the platform no longer knows is treated as already gone, and the reissue goes ahead regardless.
- The member is messaged the fresh links by the bot when it can reach them, so do not follow this event with a nudge of your own.

### Related events

- `member.resource_added`: the fresh grant, moments later.
- `member.resource_removed`: access taken away without a replacement.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_reissued",
  "created_at": "2026-09-12T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.access_extended`

Outage Compensation banked the length of a connector outage on a member's purchase: one event per member, saying when they feel the extra time.

### When this fires

A [connector outage](https://docs.subscriby.net/disaster-recovery/connector-outages) that lasted an hour or more ended because the connector recovered or was replaced, and the project's **Outage Compensation** setting is on. Every purchase that grants access right now and unlocks a place on that connector has the outage's length banked, and this event fires once for each of them.

`applies_at` says when the member feels it:

- `now`: a one-time or lifetime-style purchase with a fixed end. `ends_at` has already moved later by `extended_seconds`.
- `membership_end`: a recurring plan. No gateway lets a renewal move by a few hours, so the time is banked instead: the member's access always runs `banked_seconds` past the period they last paid for, and they receive the time when the membership ends, whether they cancel, lapse or a renewal fails. Their renewal date and charges do not change.

`banked_seconds` is the purchase's running total across every outage it lived through; `extended_seconds` is what this outage added. The member is told in the chat their connector binds to them and by email; the same fact shows on their portal card and in the bot.

### Caveats

- Passes and series are never extended: a dated window cannot move, so no event fires for them.
- Perk-only plans are not affected by an outage and receive nothing.
- A project that switched **Outage Compensation** off, an outage shorter than an hour, or one that ended with an uninstall, fires no `member.access_extended` at all; `connector.outage_compensated` still fires with `members_extended: 0`.

### Related events

- `connector.outage_compensated`: the one-line settlement summary that follows these.
- `connector.outage_closed`: the outage this compensates.

```json
{
  "id": "evt_01HX...",
  "type": "member.access_extended",
  "created_at": "2026-09-13T13:21:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "applies_at": "membership_end",
    "banked_seconds": 11700,
    "connector": "telegram",
    "ends_at": "2026-10-13T13:20:00Z",
    "extended_seconds": 11700,
    "outage_id": "9c1e4d2a-7b3f-4e8a-a2d1-5f6b7c8d9e0f",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4"
  }
}
```

### `member.resource_removed`

A subscriber loses access to a specific resource.

### When this fires

A subscriber is evicted from a specific resource: after a subscription expires or is cancelled, after a ban, kick or removal, or when a pass window closes or is cancelled. Each resource revocation emits its own event. Nothing is emitted when another still-active subscription of theirs grants the same resource: the invite link is revoked but the member stays in.

### Caveats

- Multiple revocations for the same subscriber typically arrive in close succession when a subscription expires; use `SB-Event-Id` for dedupe.
- A manual perk emits this event only when its grant is revoked on the ledger; a place a connector gates emits it once the connector has been asked to remove the member.

### Related events

- `member.resource_added`: paired transition.
- `subscription.expired`, `subscription.cancelled`, `member.kicked`: typical triggers.

```json
{
  "id": "evt_01HX...",
  "type": "member.resource_removed",
  "created_at": "2026-06-18T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "telegram:channel",
    "connector": "telegram",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "mode": "bearer_link"
  }
}
```

### `member.identity_linked`

A subscriber connects a platform account to their membership.

### When this fires

A member of the project gains a connected account on a connector: the platform account that signs them in to the portal and that the project's bot knows them by. Three doors raise it: the member completes **Connect …** from the portal's Account & Recovery screen and the project's bot confirms the account; the member signs in to the portal through a connector the project had not seen them on before; or the member taps **Use the same account** to adopt an account they already use in another of the creator's projects. Each connected account emits its own event. Nothing is emitted when an account the member already holds is confirmed again.

### Caveats

- `identity_id` is the account row, not the link: the same value appears in `member.identity_unlinked` and in the `identities` of [the member endpoint](https://docs.subscriby.net/api/v1/reference/members). The link's own `id` (what the disconnect endpoint takes) is only in the REST payloads.
- Accounts the bot creates on first contact are mirrored into the identity tables without raising this event; it is reserved for acts the member takes.

### Related events

- `member.identity_unlinked`: paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "member.identity_linked",
  "created_at": "2026-09-12T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "identity_id": "0c2d8a7e-4b1f-4d3e-9a6b-2f5e8c1d7a90",
    "connector": "telegram",
    "external_id": "123456789",
    "display_name": "Ada Lovelace",
    "source": "handshake",
    "preferred": true
  }
}
```

### `member.identity_unlinked`

A subscriber's connected platform account is disconnected from their membership.

### When this fires

A connected account is removed from a member: by the member on the portal's Account & Recovery screen (**Disconnect**), or by the creator over [the disconnect endpoint](https://docs.subscriby.net/api/v1/reference/members) or the `unlink_member_identity` MCP tool. The account stops signing the member in to the portal and the project's bot stops knowing them by it. Nothing is emitted when the removal is refused because the account was the member's last way to sign in.

### Caveats

- The member keeps their subscriptions and grants; only the way they sign in and are reached changes. A member with no connected account left is reached by email.
- The event does not say who asked. Read the activity log for the actor when it matters.

### Related events

- `member.identity_linked`: paired transition.

```json
{
  "id": "evt_01HX...",
  "type": "member.identity_unlinked",
  "created_at": "2026-09-12T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "identity_id": "0c2d8a7e-4b1f-4d3e-9a6b-2f5e8c1d7a90",
    "connector": "telegram",
    "external_id": "123456789"
  }
}
```

## Family `creator_task`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `creator_task.opened` | `project-subscription:view` | `due_at`, `grant_id`, `instructions`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id`, `task_id` |
| `creator_task.completed` | `project-subscription:view` | `completed_at`, `completed_by_user_id`, `grant_id`, `resource_id`, `resource_kind`, `subscriber_id`, `subscription_id`, `task_id` |

### `creator_task.opened`

A purchase entitles a subscriber to a manual perk, so the creator has something to do by hand.

### When this fires

A subscription becomes active (or a pass window opens) on a plan that includes a **manual** resource: a perk no connector can give, which the creator hands over themselves. The access ledger records a `creator_task` grant in state `pending` and opens a task naming the member and the perk; this event carries that task. One event per manual resource the purchase entitles the member to. Nothing is sent to the member by a bot for a manual perk; the portal shows the perk as arranged by the organiser.

### Caveats

- A task is opened once per purchase, resource and window; a retry of the granting job does not open a second one.
- A purchase that ends before the task is done revokes the grant; the task then drops out of the open list without a `creator_task.completed`.

### Related events

- `creator_task.completed`: the task is done and the grant issued.
- `member.resource_added`: raised for the same `grant_id` on completion.

```json
{
  "id": "evt_01HX...",
  "type": "creator_task.opened",
  "created_at": "2026-09-12T10:05:30Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "task_id": "9e4b2c71-3d58-4a6f-b0e2-7c1d5f8a9b34",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "manual",
    "instructions": "Give Ada Lovelace access to Welcome packet.",
    "due_at": null
  }
}
```

### `creator_task.completed`

The creator marked a manual perk as handed over; the grant is issued.

### When this fires

The creator (or a teammate, an integration or an agent on their behalf) marks a creator task done: on the members page, through [the complete endpoint](https://docs.subscriby.net/api/v1/reference/creator-tasks) or the MCP tool [`complete_creator_task`](https://docs.subscriby.net/mcp/v1/tools/creator-task/complete-creator-task). The access ledger row moves from `pending` to `granted`, this event says who did it, and `member.resource_added` follows for the same `grant_id` with mode `creator_task`.

### Caveats

- Completing a task is not idempotent over the API: a second call for a completed task answers `422 VALIDATION_FAILED`.
- The member is not messaged by a bot on completion; tell them yourself, or let the portal show the perk as delivered.

### Related events

- `creator_task.opened`: the task being done.
- `member.resource_added`: raised for the same grant on completion.

```json
{
  "id": "evt_01HX...",
  "type": "creator_task.completed",
  "created_at": "2026-09-12T10:35:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "task_id": "9e4b2c71-3d58-4a6f-b0e2-7c1d5f8a9b34",
    "grant_id": "7d1c3e9a-2b64-4f0e-9a58-3c6b1d8e2f47",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_kind": "manual",
    "completed_at": "2026-09-12T10:35:00Z",
    "completed_by_user_id": "0a7d3c1e-5b28-4f96-a3e1-6d9c2b8f4e10"
  }
}
```

## Family `connector`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `connector.installed` | `project-connector:view` | `connector`, `installation_id`, `project_id`, `state` |
| `connector.connected` | `project-connector:view` | `connector`, `display_name`, `handle`, `installation_id`, `project_id` |
| `connector.disconnected` | `project-connector:view` | `connector`, `installation_id`, `project_id` |
| `connector.status_changed` | `project-connector:view` | `connector`, `installation_id`, `previous_state`, `project_id`, `reason`, `state` |
| `connector.settings_updated` | `project-connector:view` | `changed_fields`, `connector`, `installation_id`, `project_id` |
| `connector.uninstalled` | `project-connector:view` | `connector`, `grants_revoked`, `installation_id`, `plans_unpublished`, `project_id`, `resources_detached`, `subscriptions_cancelled` |
| `connector.doctor_completed` | `project-connector:view` | `connector`, `critical`, `findings`, `healthy`, `installation_id`, `project_id`, `ran_at`, `warnings` |
| `connector.outage_opened` | `project-connector:view` | `connector`, `installation_id`, `outage_id`, `project_id`, `reason`, `started_at` |
| `connector.outage_closed` | `project-connector:view` | `connector`, `duration_seconds`, `ended_at`, `ended_by`, `installation_id`, `outage_id`, `project_id`, `started_at` |
| `connector.outage_compensated` | `project-connector:view` | `connector`, `extended_seconds`, `grants_replayed`, `members_extended`, `outage_id`, `project_id` |

### `connector.installed`

A connector was installed on a project: a pending installation with no credentials yet.

### When this fires

A creator (or a token) installs a connector on a project: from the Connectors tab, through [the install endpoint](https://docs.subscriby.net/api/v1/reference/connectors) or the [`install_connector`](https://docs.subscriby.net/mcp/v1/tools/connectors/install-connector) tool. Installing says "this project runs this connector" and opens the row the Connectors tab shows as **pending**; connecting, which hands the connector the creator's credentials, is a separate act and fires `connector.connected`. Installing a connector that is already installed changes nothing and fires nothing; bringing an uninstalled connector back fires this again, the row pending once more with its settings kept.

### Caveats

- A second distinct connector on a project needs the owner's `multi_connector` capability (Growth); the install is refused `CONNECTOR_TIER_REQUIRED` and nothing fires.
- The first connector's bot flow connects in one step from the dashboard, so an existing project sees `connector.connected` without a preceding `connector.installed`.

### Related events

- `connector.connected`: the credentials handed over.
- `connector.disconnected`: the reverse.

```json
{
  "id": "evt_01HX...",
  "type": "connector.installed",
  "created_at": "2026-09-12T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "discord",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "state": "pending"
  }
}
```

### `connector.connected`

The creator connected an installation with their credentials; the connector can act for the project now.

### When this fires

A creator completes a connector's connect flow on the dashboard: the connector checks the credentials, registers with its platform and the installation turns `connected`. For the first connector this is the **Connect Bot** modal, the platform bot's connectivity conversation and a Disaster Recovery bot replacement.

### Caveats

- Credentials are never in the payload. Read the installation back with [the installation endpoint](https://docs.subscriby.net/api/v1/reference/connectors).
- Reconnecting with new credentials fires this again for the same `installation_id`.

### Related events

- `connector.installed`: the pending row that preceded it, when the connector installs in two steps.
- `connector.status_changed`: the installation's health afterwards.

```json
{
  "id": "evt_01HX...",
  "type": "connector.connected",
  "created_at": "2026-09-12T10:06:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "display_name": "Research Bot",
    "handle": "research_bot"
  }
}
```

### `connector.disconnected`

An installation was disconnected: the connector withdrew it, the credentials were wiped, the row stays.

### When this fires

A creator disconnects an installation, from the Connectors tab, through [the disconnect endpoint](https://docs.subscriby.net/api/v1/reference/connectors) or the [`disconnect_connector`](https://docs.subscriby.net/mcp/v1/tools/connectors/disconnect-connector) tool. The connector withdraws the installation on its platform, the credentials are wiped and the installation turns `disconnected`; grants, resources, plans and identities are untouched and members keep the access they hold. Disconnecting an installation already disconnected fires nothing.

### Caveats

- Disconnecting is not uninstalling: nothing is revoked and no plan is touched. Uninstalling, with its impact preview, is a separate act and fires `connector.uninstalled`.

### Related events

- `connector.connected`: the reverse.
- `connector.status_changed`: a platform-side revocation, as opposed to the creator's own disconnect.

```json
{
  "id": "evt_01HX...",
  "type": "connector.disconnected",
  "created_at": "2026-09-12T11:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

### `connector.status_changed`

A probe or a verify moved an installation's state: connected, degraded or revoked.

### When this fires

The hourly health probe, or a **Verify** run by the creator ([the verify endpoint](https://docs.subscriby.net/api/v1/reference/connectors), [`verify_connector_installation`](https://docs.subscriby.net/mcp/v1/tools/connectors/verify-connector-installation)), recorded a state other than the one the installation had. A probe that finds nothing changed fires nothing.

### Caveats

- `reason` is a stable code in the connector's vocabulary; the sentence for it is `state_detail` on the installation, read from the API.
- A Disaster Recovery incident opens beside a `degraded` state that warrants a replacement; see `recovery.incident_opened`.

### Related events

- `connector.connected`: a fresh connection that clears a degraded state.
- `connector.disconnected`: the creator withdrew it on purpose.

```json
{
  "id": "evt_01HX...",
  "type": "connector.status_changed",
  "created_at": "2026-09-12T06:00:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "previous_state": "connected",
    "state": "degraded",
    "reason": "connector_api_unauthorized"
  }
}
```

### `connector.settings_updated`

A declared setting of an installation changed: which fields, never their values.

### When this fires

A creator changes an installation's settings, on the dashboard, through [the settings endpoint](https://docs.subscriby.net/api/v1/reference/connectors) or the [`update_connector_installation_settings`](https://docs.subscriby.net/mcp/v1/tools/connectors/update-connector-installation-settings) tool, and at least one declared field took a new value. A write that changes nothing fires nothing.

### Caveats

- Values are never in the payload, and the installation endpoints never serialise settings either, because a settings field may be a secret. A consumer that needs the value asks the creator.

### Related events

- `connector.connected`: the installation the settings belong to.

```json
{
  "id": "evt_01HX...",
  "type": "connector.settings_updated",
  "created_at": "2026-09-12T10:20:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "discord",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "changed_fields": [
      "greeting"
    ]
  }
}
```

### `connector.uninstalled`

A connector was uninstalled from a project: its grants revoked, its resources detached, the installation row kept, with the counts of what that touched.

### When this fires

A creator uninstalls a connector from a project, from the Connectors tab, through [the uninstall endpoint](https://docs.subscriby.net/api/v1/reference/connectors) or the [`uninstall_connector`](https://docs.subscriby.net/mcp/v1/tools/connectors/uninstall-connector) tool, after the impact preview. Uninstalling is distinct from disconnecting and never a deletion: every live grant on the connector's resources is revoked (`member.resource_removed` fires per grant), the resources are deactivated as detached with their external ids kept, the installation row stays with `uninstalled_at`, identities are never removed and no money moves by itself. The two opt-ins act on the plans left with nothing to grant: taking them off sale fires `plan.deactivated` per plan, cancelling their recurring subscriptions at period end fires `subscription.cancelled` per subscription.

### Caveats

- Members are told by email that their recurring subscription will not renew; nothing is taken from them before the end of the paid period.
- Installing the connector again brings the same installation back as pending with its settings kept; the detached resources stay inactive until the creator relinks them.

### Related events

- `connector.disconnected`: the reversible act this is not.
- `connector.installed`: the reinstall.

```json
{
  "id": "evt_01HX...",
  "type": "connector.uninstalled",
  "created_at": "2026-09-12T11:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "discord",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "grants_revoked": 41,
    "resources_detached": 2,
    "plans_unpublished": 1,
    "subscriptions_cancelled": 17
  }
}
```

### `connector.doctor_completed`

The connector doctor ran on an installation and found something different from the previous run.

### When this fires

The creator pressed **Run Doctor** on the Connectors tab or the connector's page, an integration called [the doctor endpoint](https://docs.subscriby.net/api/v1/reference/connectors) or [`run_connector_doctor`](https://docs.subscriby.net/mcp/v1/tools/connectors/run-connector-doctor), or the platform's scheduled sweep ran, and the report differs from the one kept on the installation: a finding appeared, disappeared or changed severity or state. A run that finds exactly what the last one found fires nothing, so a nightly sweep is quiet until something moves. The installation's own verification inside the run still fires `connector.status_changed` when the state moved.

### Caveats

- The first run on an installation fires this event, because there is no earlier report to match; a repeat with the same findings does not.
- A resource the connector has no place it can ask about (no space row, no legacy chat) is a `warning` finding, never left out.
- Sentences are rendered in the creator's language at the time of the run; the `state` words are stable.

### Related events

- `connector.status_changed`: the installation's own verdict, fired by the verification inside the run when the state moved.

```json
{
  "id": "evt_01HX...",
  "type": "connector.doctor_completed",
  "created_at": "2026-09-12T10:07:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "ran_at": "2026-09-12T10:07:00+00:00",
    "healthy": false,
    "critical": 1,
    "warnings": 0,
    "findings": [
      {
        "key": "installation",
        "kind": "installation",
        "severity": "ok",
        "subject": "Research Bot",
        "state": "connected",
        "message": "The connector still answers for this installation.",
        "creator_actionable": false,
        "fix_url": null,
        "resource_id": null
      },
      {
        "key": "resource:b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
        "kind": "resource",
        "severity": "critical",
        "subject": "Premium Channel",
        "state": "not_member",
        "message": "The bot was removed from this channel.",
        "creator_actionable": true,
        "fix_url": "https://app.subscriby.net/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/resources",
        "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6"
      }
    ]
  }
}
```

### `connector.outage_opened`

A platform refused a project's live installation (token revoked or regenerated, bot deleted) and the connector entered an outage.

### When this fires

The hourly health probe recorded a platform-caused refusal of a project's **live** installation: the platform says the credentials are revoked or regenerated, or that the bot or app no longer exists. Rate limits, unclassified errors, standby installations and a creator's own **Disconnect** never open an outage. A probe that repeats the same verdict does not fire this again; one outage stays open until `connector.outage_closed`.

While the outage is open, every plan that unlocks a place on that connector is off sale on the portal, in the bot, through access codes and trials and through the REST checkout, and the installation object reads `sales_paused: true` with an `outage` block. See [Connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages) for what members and creators see.

### Caveats

- `connector.status_changed` fires beside this event with `state: degraded`; this event is the narrower signal that sales froze.
- A Disaster Recovery incident opens too when the refusal warrants a replacement; see `recovery.incident_opened`.

### Related events

- `connector.outage_closed`: the outage ended.
- `connector.status_changed`: the state transition behind it.

```json
{
  "id": "evt_01HX...",
  "type": "connector.outage_opened",
  "created_at": "2026-09-13T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "outage_id": "9c1e4d2a-7b3f-4e8a-a2d1-5f6b7c8d9e0f",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "reason": "connector_api_unauthorized",
    "started_at": "2026-09-13T10:05:00Z"
  }
}
```

### `connector.outage_closed`

A connector outage ended: the installation answered again, another one took its place, or the creator uninstalled the connector.

### When this fires

An open outage on a project's installation ended. `ended_by` says how: `recovered` when the probe found the installation healthy again or the creator reconnected it, `replaced` when another installation took over (a standby bot failed over, or the creator relinked a new bot), `uninstalled` when the creator removed the connector while the outage ran. Plans that were off sale return to sale at once.

The settlement follows from the queue and announces itself as `connector.outage_compensated`: invites that never reached a member during the outage are re-sent, and, when the outage lasted an hour or more, ended as `recovered` or `replaced`, and the project's **Outage Compensation** setting is on, every member whose paid access overlapped it has the outage's length banked on their purchase, one `member.access_extended` each. How the banked time reaches a member is described in [Connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages).

### Caveats

- An `uninstalled` end compensates nobody: the uninstall's own preview and opt-ins settle what members get.
- Outages shorter than an hour end with this event too, but earn no compensation.

### Related events

- `connector.outage_opened`: the outage began.
- `connector.outage_compensated`: the settlement that follows this event.
- `connector.connected`: a fresh connection that ends a `recovered` outage.
- `connector.uninstalled`: the uninstall behind an `uninstalled` end.

```json
{
  "id": "evt_01HX...",
  "type": "connector.outage_closed",
  "created_at": "2026-09-13T13:20:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "duration_seconds": 11700,
    "ended_at": "2026-09-13T13:20:00Z",
    "ended_by": "recovered",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "outage_id": "9c1e4d2a-7b3f-4e8a-a2d1-5f6b7c8d9e0f",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "started_at": "2026-09-13T10:05:00Z"
  }
}
```

### `connector.outage_compensated`

A closed connector outage settled: how many members had time banked, how much each received, and how many invites lost during the outage were re-sent.

### When this fires

Once per outage, shortly after `connector.outage_closed`. The settlement runs from the queue: it first re-sends any invite that never reached a member while the connector was refusing the installation (`grants_replayed`), then, when the outage lasted an hour or more, ended as `recovered` or `replaced`, and the project's **Outage Compensation** setting is on, banks the outage's length on every live purchase that unlocks a place on that connector (`members_extended`, one `member.access_extended` each). The creator receives the same summary by email, on their connected account and in the notification centre; it is also the **Compensation** column of the Recovery History page.

### Caveats

- Fires with `members_extended: 0` when the outage was shorter than an hour, ended with an uninstall, or the project switched Outage Compensation off; the creator is not emailed in that case.
- Money never moves: no charge, refund or renewal date changes. Recurring members receive the time at the end of their membership.

### Related events

- `member.access_extended`: one per compensated member.
- `connector.outage_closed`: the outage this settles.

```json
{
  "id": "evt_01HX...",
  "type": "connector.outage_compensated",
  "created_at": "2026-09-13T13:21:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "extended_seconds": 11700,
    "grants_replayed": 2,
    "members_extended": 18,
    "outage_id": "9c1e4d2a-7b3f-4e8a-a2d1-5f6b7c8d9e0f",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

## Family `recovery`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `recovery.incident_opened` | `project-recovery:view` | `connector`, `detected_at`, `incident_id`, `kind`, `project_id`, `reason`, `resource_id` |
| `recovery.incident_resolved` | `project-recovery:view` | `connector`, `incident_id`, `kind`, `project_id`, `resolved_at`, `resolved_by_operation_id`, `resource_id` |
| `recovery.operation_started` | `project-recovery:view` | `automatic`, `connector`, `kind`, `on_demand`, `operation_id`, `project_id`, `started_at` |
| `recovery.operation_completed` | `project-recovery:view` | `automatic`, `completed_at`, `connector`, `kind`, `on_demand`, `operation_id`, `project_id`, `revert_window_ends_at`, `started_at` |
| `recovery.operation_failed` | `project-recovery:view` | `automatic`, `connector`, `failure_reason`, `kind`, `on_demand`, `operation_id`, `project_id`, `started_at` |
| `recovery.operation_reverted` | `project-recovery:view` | `connector`, `kind`, `operation_id`, `project_id`, `resource_id`, `reverted_at` |
| `recovery.standby_registered` | `project-recovery:view` | `connector`, `mirror`, `project_id`, `resource_id`, `standby` |
| `recovery.standby_removed` | `project-recovery:view` | `connector`, `project_id`, `reason`, `resource_id`, `standby` |
| `recovery.installation_failed_over` | `project-recovery:view` | `connector`, `installation_id`, `members_emailed`, `operation_id`, `project_id`, `replaced_at` |
| `recovery.resource_failed_over` | `project-recovery:view` | `connector`, `operation_id`, `project_id`, `replaced_at`, `resource_id`, `resource_title` |
| `recovery.resource_replaced` | `project-recovery:view` | `connector`, `on_demand`, `operation_id`, `project_id`, `replaced_at`, `resource_id`, `resource_title` |
| `recovery.identity_relinked` | `project-recovery:view` | `completed_at`, `connector`, `display_name`, `from_backup`, `identity_id`, `operation_id`, `started_at` |
| `recovery.readiness_changed` | `project-recovery:view` | `changed`, `complete`, `completed`, `items`, `total` |

### `recovery.incident_opened`

A health probe found the creator's sign-in account unreachable, a project's bot refused by the platform, or a channel or group gone or no longer administered.

### When this fires

The hourly probes check every bot, every channel and group a project sells, and the creator's own sign-in account. When one comes back banned, deleted, or stripped of the rights the bot needs, an **incident** opens in the recovery ledger and this event fires, once. A probe that finds the same broken thing on its next run reopens nothing and fires nothing; the incident stays open until it resolves. Undoing an account relink also opens an account incident (`reason: relink_disputed`) so support reviews the dispute.

### Caveats

- One event per incident. The ledger opens one incident per subject and keeps it open, so a subject that stays broken for a week fires this once, not hourly.
- A restriction the platform reports as "still reachable" opens nothing: only a verdict that warrants a replacement counts. See [How detection works](https://docs.subscriby.net/disaster-recovery/how-detection-works).

### Related events

- `recovery.incident_resolved`: the same incident healing or being fixed.
- `project.resource.status_changed`: the health verdict that precedes a resources incident.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.incident_opened",
  "created_at": "2026-09-12T03:19:04Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "incident_id": "6f1e9b27-4c3a-4d58-9e02-b7a1c5d38f64",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "reason": "chat_not_found",
    "detected_at": "2026-09-12T03:19:04Z"
  }
}
```

### `recovery.incident_resolved`

An open incident closed: a later probe found the thing healthy again, or a recovery replaced it.

### When this fires

An incident resolves in one of two ways: a later probe finds the account, bot or channel healthy again (the creator gave the bot its rights back, the platform lifted a restriction), or a recovery replaced the broken thing, in which case `resolved_by_operation_id` names it. Either way the incident row is marked resolved and this event fires once.

### Caveats

- A bot relink resolves every open bot incident the project had, whichever bot row each named: expect one event per incident.
- Resolution says the ledger no longer sees a problem; it does not say members have been re-admitted. Follow `recovery.operation_completed` and the roll call for that.

### Related events

- `recovery.incident_opened`: how the incident began.
- `recovery.operation_completed`: the recovery `resolved_by_operation_id` names.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.incident_resolved",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "incident_id": "6f1e9b27-4c3a-4d58-9e02-b7a1c5d38f64",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resolved_at": "2026-09-12T03:19:42Z",
    "resolved_by_operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21"
  }
}
```

### `recovery.operation_started`

A recovery began: run by the creator, by the platform on their behalf, or on demand for a healthy resource.

### When this fires

The moment a recovery is opened in the ledger: an account relink or a switch to the backup account, a bot replacement, or a channel swap. The row exists from this moment because it is the quota ledger too: the allowance is spent here, and given back only if the recovery fails before changing anything.

A channel recovery absorbs every swap made inside its grace period into one operation, so a second channel swapped an hour after the first fires no second start; it fires `recovery.resource_replaced` under the same `operation_id`.

### Caveats

- Once per operation. Swaps absorbed into a running channel recovery fire no second start.
- A recovery refused before the ledger row is written (quota spent, not the owner, plan lacks the feature) fires nothing.

### Related events

- `recovery.operation_completed`, `recovery.operation_failed`: how it ends.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_started",
  "created_at": "2026-09-12T03:19:10Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "automatic": true,
    "on_demand": false,
    "started_at": "2026-09-12T03:19:10Z"
  }
}
```

### `recovery.operation_completed`

A recovery finished and its changes stand; when it can be undone, the window is open from now.

### When this fires

When the recovery's changes are in place: the creator signs in with the new account, the project's bot answers under the new token, the resource points at its replacement and re-admission has been queued. For a channel recovery this fires once, when the first swap completes; later swaps absorbed into the same operation fire `recovery.resource_replaced` only.

### Caveats

- Completion means the changes stand, not that every member is back in. Read the roll call at [the roll call endpoint](https://docs.subscriby.net/api/v1/reference/disaster-recovery) for that.
- The creator also receives the recovery report by email a few minutes later, once the first re-admissions have landed.

### Related events

- `recovery.operation_reverted`: the creator undid it inside the window.
- `recovery.resource_failed_over`, `recovery.resource_replaced`, `recovery.identity_relinked`: what the recovery did.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_completed",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "automatic": true,
    "on_demand": false,
    "started_at": "2026-09-12T03:19:10Z",
    "completed_at": "2026-09-12T03:19:42Z",
    "revert_window_ends_at": "2026-09-13T03:19:42Z"
  }
}
```

### `recovery.operation_failed`

A recovery failed before changing anything; the allowance it spent is given back.

### When this fires

The recovery was opened in the ledger and then could not be carried out: the connector refused the new bot's credentials, the replacement chat could not be bound, the new account could not be linked. Nothing changed, so the operation is marked failed and its use of the rolling allowance is given back. The creator sees the refusal on the page that ran it; this event tells your systems.

### Caveats

- A swap that fails while a channel recovery is already absorbing swaps leaves that recovery standing: failing it would erase a swap that did happen. Only a recovery that failed on its first swap fires this.

### Related events

- `recovery.operation_started`: how it began.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_failed",
  "created_at": "2026-09-12T09:41:07Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "c2e8f1a9-6d47-4b3e-9f05-1a8d7c2e4b60",
    "kind": "bot",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "automatic": false,
    "on_demand": false,
    "started_at": "2026-09-12T09:41:05Z",
    "failure_reason": "The platform refused the token."
  }
}
```

### `recovery.operation_reverted`

The creator undid a recovery inside its window: a swapped channel put back, or the previous sign-in account restored.

### When this fires

Inside the undo window the creator can put a swapped resource back onto its old chat, or move their sign-in back to the previous account. A channel recovery is undone one swap at a time, so this fires once per resource put back, with `resource_id`; the operation itself is marked reverted when its last standing swap is undone. An account relink is undone whole, in one event with `resource_id: null`, and opens an account incident (`relink_disputed`) so support reviews it.

### Caveats

- Undoing a swap re-admits every active member into the old chat again; expect a second round of `member.resource_*` events for the same members.
- The undo window is 24 hours from completion by default; an attempt after it is refused and fires nothing.

### Related events

- `recovery.operation_completed`: the recovery being undone.
- `recovery.incident_opened`: the disputed-relink incident an account undo opens.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.operation_reverted",
  "created_at": "2026-09-12T21:50:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "kind": "resources",
    "connector": "telegram",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "reverted_at": "2026-09-12T21:50:00Z"
  }
}
```

### `recovery.standby_registered`

A spare bot is kept ready for a project, or a spare channel or group is kept ready for one resource.

### When this fires

Active Disaster Prevention keeps two kinds of standby: a **standby bot** per project (a second token, stored without a webhook and probed like any bot) and a **standby chat** per resource (a spare channel or group the bot already administers, optionally mirrored). Registering either fires this event. Registering a new standby bot where one already existed also fires `recovery.standby_removed` with `reason: replaced` for the old one.

### Caveats

- The standby's own identifiers on the platform (the bot's token, the chat's id) are never in the payload.
- Turning the mirror on or off later fires nothing; read the standby's state from the Prevention page.

### Related events

- `recovery.standby_removed`: the standby removed, replaced or used.
- `recovery.resource_failed_over`: the standby chat doing its job.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.standby_registered",
  "created_at": "2026-09-01T14:22:09Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "standby": "resource",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "connector": "telegram",
    "mirror": true
  }
}
```

### `recovery.standby_removed`

A standby is no longer kept: the creator removed it, registered another in its place, or a recovery consumed it.

### When this fires

A standby bot or standby chat leaves the reserve. `reason` says why: `removed` when the creator took it away, `replaced` when a new standby bot took the slot, `used` when a recovery consumed it (a bot relink from the standby, a one-click Swap & Grant onto the standby chat, or an automatic failover).

### Caveats

- A standby consumed by a recovery fires this beside the recovery's own events (`recovery.resource_failed_over` or `recovery.resource_replaced`, or the bot recovery's `recovery.operation_completed`); use `reason: used` to tell it from a deliberate removal.
- The readiness checklist counts standbys, so a `removed` or `used` standby lowers the score until a new one is registered.

### Related events

- `recovery.standby_registered`: the standby being kept.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.standby_removed",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "standby": "resource",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "connector": "telegram",
    "reason": "used"
  }
}
```

### `recovery.installation_failed_over`

Automatic failover switched a project onto its standby bot without the creator, because the platform refused the live one: the bot-side twin of `recovery.resource_failed_over`.

### When this fires

A probe finds the platform refusing a project's live installation outright (the token revoked or regenerated, the bot deleted), the project has **Automatic Failover** switched on, a standby bot is registered and its last probe found it healthy, and the Project Bot allowance permits: the platform writes the standby's credentials into the project's installation, resolves the incident, closes the [connector outage](https://docs.subscriby.net/disaster-recovery/connector-outages) as `replaced`, and emails every member reachable by email their new link on the creator's behalf, at the per-email fee accepted when the switch was armed. This event fires the moment the switch completes; it sits under a recovery whose `recovery.operation_started` carries `automatic: true`, and the Project Bot allowance is spent exactly as by a manual relink.

> The switch cannot be undone from the dashboard: the refused bot is gone as far as the platform is concerned. The standby slot is empty afterwards, so the creator is asked to register a new standby bot.

### Caveats

- Fires only for a platform-caused refusal. A rate limit or a passing API error marks the installation degraded but never triggers a failover.
- When a condition fails (plan lapsed, no healthy standby, allowance spent, or the switch refused), nothing fires here; the creator receives *Automatic failover did not run for <project>'s bot* by email and on their connected account, and the incident stays open.

### Related events

- `recovery.resource_failed_over`: the channel-side twin.
- `recovery.operation_started` / `recovery.operation_completed`: the recovery around the switch.
- `connector.outage_closed`: the outage this switch ends as `replaced`.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.installation_failed_over",
  "created_at": "2026-09-14T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "connector": "telegram",
    "installation_id": "3b8f0c6e-2d41-4a97-9e5f-1c7d6b2a8e40",
    "members_emailed": 214,
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "replaced_at": "2026-09-14T03:19:41Z"
  }
}
```

### `recovery.resource_failed_over`

Automatic failover swapped a banned channel or group for its standby without the creator: the failover you sleep through.

### When this fires

A probe finds a channel gone or the bot removed from it, the project has **Automatic Failover** switched on, a healthy standby is linked, and the allowance permits: the platform points the resource at its standby, revokes the old links and queues every active member's re-admission, all without the creator. This event fires the moment the resource points at the standby; it sits under a recovery whose `recovery.operation_started` carries `automatic: true`.

> **Members the bot cannot reach.** A failover emails the members the bot can no longer message, at a per-email fee the creator accepted when switching failover on. The roll call's `emailed` counter says how many.

### Caveats

- The standby that was consumed fires `recovery.standby_removed` with `reason: used` beside this event.
- `project.resource.updated` also fires for the same resource with `changes.space_id`, as it does for any swap.

### Related events

- `recovery.resource_replaced`: the same swap made by the creator.
- `recovery.operation_reverted`: the creator put the old chat back.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.resource_failed_over",
  "created_at": "2026-09-12T03:19:42Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "9a4d2e71-5b38-4c6f-8e12-3d7c9b0a5f21",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_title": "Lounge",
    "connector": "telegram",
    "replaced_at": "2026-09-12T03:19:41Z"
  }
}
```

### `recovery.resource_replaced`

The creator pointed a resource at a replacement channel or group: in a recovery after a ban, or on demand for a healthy resource.

### When this fires

The creator swaps a resource onto another chat: a replacement channel after a ban, the standby in one click, or a healthy resource moved to a new supergroup on demand (**Swap & Grant**, which spends no allowance). The resource is re-pointed, the old links revoked and every active member's re-admission queued. One event per resource swapped, each under the `operation_id` of the recovery absorbing it.

### Caveats

- A swap onto the standby chat also fires `recovery.standby_removed` with `reason: used`.
- `project.resource.updated` fires for the same resource with `changes.space_id`, as it does for any swap.

### Related events

- `recovery.resource_failed_over`: the same swap made by the platform.
- `recovery.operation_reverted`: the swap put back inside the window.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.resource_replaced",
  "created_at": "2026-06-20T18:04:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "operation_id": "d4b7a2c9-1e58-4f36-8a0d-6c2e9b7f1a45",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6",
    "resource_title": "Members",
    "connector": "telegram",
    "replaced_at": "2026-06-20T18:04:11Z",
    "on_demand": true
  }
}
```

### `recovery.identity_relinked`

The creator's sign-in account moved to another account on the connector: a newly detected one, or the backup switched in.

### When this fires

After a ban on the creator's own account, recovery moves their Subscriby identity to another account on the connector: one they prove control of through a handshake, or the backup account they registered ahead of time (`from_backup: true`). Sign-in and alerts follow the new account at once; the previous one becomes the backup when a backup was switched in. This is an account-level event: `project_id` is null and it reaches the endpoints of the team the creator owns.

### Caveats

- The platform's own account identifiers (numeric ids, usernames) are deliberately absent; `identity_id` is the neutral id the rest of the API uses.
- Every browser session of the creator is signed out by the relink. The undo, inside 24 hours, fires `recovery.operation_reverted` and opens a `relink_disputed` incident.

### Related events

- `recovery.operation_completed`: the same recovery, as an operation.
- `recovery.operation_reverted`: the relink undone.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.identity_relinked",
  "created_at": "2026-08-01T11:12:30Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "operation_id": "e7c3d9a1-2f64-4b08-9d5e-4a1b8c6f2d73",
    "connector": "telegram",
    "identity_id": "3c9e1f7a-8b25-4d60-a1f4-7e2c5b9d0a18",
    "display_name": "Ada (new)",
    "from_backup": false,
    "started_at": "2026-08-01T11:12:29Z",
    "completed_at": "2026-08-01T11:12:30Z"
  }
}
```

### `recovery.readiness_changed`

A line of the Disaster Recovery readiness checklist changed state, and here is the whole checklist as it stands now.

### When this fires

The readiness checklist is what a creator has in place before anything happens: a second factor on the account, a backup sign-in account, and, per connector, the standbys, mirrors and automatic failover the platform can verify. Subscriby records the checklist's state after every event that could move a line (a standby registered or removed, a resource failed over or replaced, an account relinked, a connector installed, connected, disconnected or uninstalled) and once a night for the things that fire no event (a second factor, a passkey, a plan change). When the state differs from the last one recorded, this event fires with the checklist as it stands. Recording the same state twice fires nothing. Readiness is the creator's, not one project's, so the envelope `project_id` is null.

### Caveats

- The first checklist ever recorded for a creator fires nothing: there is no earlier state to differ from.
- Reminders (a copy of the content elsewhere, a second human administrator) never appear here; they cannot be verified.
- The labels, descriptions and fix links of each line are not in the payload; read them from [the readiness endpoint](https://docs.subscriby.net/api/v1/reference/disaster-recovery).

### Related events

- `recovery.standby_registered`: one of the changes that leads here.
- `recovery.standby_removed`: another.

```json
{
  "id": "evt_01HX...",
  "type": "recovery.readiness_changed",
  "created_at": "2026-09-01T14:22:09Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "completed": 4,
    "total": 6,
    "complete": false,
    "items": [
      {
        "key": "second_factor",
        "connector": null,
        "done": true,
        "locked": false
      },
      {
        "key": "backup_identity",
        "connector": null,
        "done": true,
        "locked": false
      },
      {
        "key": "standby_installation",
        "connector": "telegram",
        "done": true,
        "locked": false
      },
      {
        "key": "standby_spaces",
        "connector": "telegram",
        "done": false,
        "locked": false
      },
      {
        "key": "auto_failover",
        "connector": "telegram",
        "done": true,
        "locked": false
      },
      {
        "key": "live_mirror",
        "connector": "telegram",
        "done": false,
        "locked": false
      }
    ],
    "changed": [
      "telegram:standby_spaces",
      "telegram:live_mirror"
    ]
  }
}
```

## Family `broadcast`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `broadcast.queued` | `broadcast:send` | `audience`, `broadcast_id`, `expiring_within_days`, `parent_id`, `pass_window_id`, `plan_id`, `project_id`, `recipient_estimate` |
| `broadcast.completed` | `broadcast:send` | `audience`, `broadcast_id`, `expiring_within_days`, `failed`, `parent_id`, `pass_window_id`, `plan_id`, `project_id`, `sent` |

### `broadcast.queued`

A broadcast started sending, carrying the audience it resolved to and how many members it will reach.

### When this fires

A broadcast began sending. The audience has been resolved to a concrete set of recipients and the first message is on its way.

This fires for broadcasts started **anywhere**: the dashboard, the bot, the REST API, a Zap or an n8n workflow. The event is emitted by the sending job itself rather than by each entry point, so every route announces a broadcast identically.

> **This is the start, not the outcome.** Delivery runs at roughly 28 messages a second to stay inside the platform's rate limit, so a large broadcast is still sending long after this arrives. Subscribe to `broadcast.completed` for the tallies.

### Caveats

- `recipient_estimate` is the count **at the moment sending began**. Someone who joins mid-send is not included, and someone who blocks the bot mid-send is still counted here but will appear in `failed` on completion.
- A member is only a recipient if they have a linked chat **on that project's bot**. A member with no chat, or one attached to a different bot, is silently excluded, which is why the estimate can be far lower than the project's member count.
- The message body is **not** in the payload. Broadcasts are not persisted, and a body can be up to 4096 characters of arbitrary creator content; repeating it on every subscribed endpoint would leak it to integrations that only need to know a send happened.
- If the audience resolves to zero recipients this still fires, immediately followed by `broadcast.completed` with `sent: 0`.

### Related events

- `broadcast.completed`: the outcome, with sent and failed tallies.
- [Broadcasts](https://docs.subscriby.net/api/v1/reference/broadcasts): send one programmatically.

```json
{
  "id": "evt_01HX...",
  "type": "broadcast.queued",
  "created_at": "2026-09-01T10:30:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "broadcast_id": "0192f4a6-3c1e-7d2b-9a8f-4e5d6c7b8a90",
    "parent_id": null,
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "audience": "customer",
    "pass_window_id": null,
    "plan_id": null,
    "expiring_within_days": null,
    "recipient_estimate": 128
  }
}
```

### `broadcast.completed`

A broadcast finished sending, carrying the delivered and failed tallies.

### When this fires

Every recipient in a broadcast has been attempted and the send is over. The payload carries what actually happened.

> `sent` means **the platform accepted the message**, not that a human read it. There is no read receipt, and a delivered message sitting in a muted chat counts as sent.

### Reading the failure count

A steady trickle of failures is normal and not actionable: the overwhelming majority are members who blocked the bot or deleted their account on the platform. Those are permanent; the sender detects them and stops retrying that recipient rather than burning attempts.

What *is* worth alerting on is a sudden change in the ratio. `failed` climbing from ~2% to ~40% between two broadcasts usually means the bot's credentials were revoked or the bot was removed from the project's resources, not that forty percent of an audience left at once.

`sent + failed` can be lower than the `recipient_estimate` reported by `broadcast.queued`: a recipient with no chat row is skipped without counting as either.

### Caveats

- Fires once per broadcast, at the end. A broadcast the platform rate-limits heavily can take minutes to finish; there is no progress event in between.
- If the sending job is released and retried after a long rate-limit, the tallies count the **completed run** only.
- A broadcast aborted before sending (no connected bot, an unknown audience, an empty body after sanitisation, or an audience the plan no longer includes) emits neither this nor `broadcast.queued`. Nothing was sent, so nothing is announced. The REST API refuses those cases up front with a `422` rather than accepting a send that will never leave.

### Related events

- `broadcast.queued`: the start, with the recipient estimate.

```json
{
  "id": "evt_01HX...",
  "type": "broadcast.completed",
  "created_at": "2026-09-01T10:31:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "broadcast_id": "0192f4a6-3c1e-7d2b-9a8f-4e5d6c7b8a90",
    "parent_id": null,
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "audience": "customer",
    "pass_window_id": null,
    "plan_id": null,
    "expiring_within_days": null,
    "sent": 126,
    "failed": 2
  }
}
```

## Family `access_code`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `access_code.generated` | `project-access-code:view` | `count`, `expires_at`, `plan_id`, `plan_name` |
| `access_code.redeemed` | `project-access-code:view` | `access_code`, `plan_id`, `project_id`, `subscriber_id`, `subscription_id` |
| `access_code.expired` | `project-access-code:view` | `expired_at`, `plan_id`, `subscription_id` |

### `access_code.generated`

A bulk-generate job completes.

### When this fires

A bulk-generation run for access codes completes. The batch is materialized in the database and is now redeemable. Batch-level only: this fires once per generation job, not per code. A 10,000-code batch produces one event.

### Caveats

- Codes themselves are never delivered through this event. The batch is delivered to the creator's chat on the connector as a CSV document or as one message per code, depending on the export type chosen at generation; to fetch them programmatically use [the access codes list](https://docs.subscriby.net/api/v1/reference/access-codes).
- There is no batch identifier in the payload. Correlate a run by `plan_id` plus `created_at`, or list codes via the access codes endpoint.
- Per-code redemption fires `access_code.redeemed`; per-code expiry fires `access_code.expired`.

### Related events

- `access_code.redeemed`: fires per code on redemption.
- `access_code.expired`: fires per code on expiry.

```json
{
  "id": "evt_01HX...",
  "type": "access_code.generated",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "plan_name": "Premium Monthly",
    "count": 250,
    "expires_at": "2026-08-18T00:00:00Z"
  }
}
```

### `access_code.redeemed`

A code is successfully redeemed by a subscriber.

### When this fires

A subscriber successfully redeems an access code. The placeholder subscription row created with that code at generation time is claimed for the subscriber and activated (or put into trial) on the associated plan.

### Caveats

- `access_code` is the complete code, not a masked fragment. It is already consumed and cannot be redeemed again, but treat it as a customer identifier and avoid forwarding it to systems you do not control.
- Pairs with `subscription.created` and either `member.joined` or `member.trial_joined`, depending on whether the redeemed plan carries a trial.

### Related events

- `access_code.generated`: predecessor (batch-level).
- `access_code.expired`: alternative outcome.

```json
{
  "id": "evt_01HX...",
  "type": "access_code.redeemed",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscriber_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "access_code": "9c1a7b3f-5d80-4e62-a4f1-0b83d2e6c517"
  }
}
```

### `access_code.expired`

A code passes its expiry without redemption.

### When this fires

An access code passes its expiry without being redeemed. The placeholder subscription row holding it is hard-deleted immediately after this event is emitted.

The code string itself is **not** included on this event; only `access_code.redeemed` carries `access_code`. The placeholder row referenced by `subscription_id` is hard-deleted immediately after this event is emitted, so it will not resolve through the API.

### Caveats

- Expiry is detected by a sweep that runs every five minutes, so `created_at` trails `expired_at` by up to five minutes plus queue latency.
- Large batches may produce a sustained burst of `access_code.expired` events when the batch hits its expiry. Plan capacity accordingly.
- Codes that were already redeemed do not produce this event regardless of the batch's `expires_at`.

### Related events

- `access_code.redeemed`: alternative outcome.
- `access_code.generated`: predecessor (batch-level).

```json
{
  "id": "evt_01HX...",
  "type": "access_code.expired",
  "created_at": "2026-08-18T00:04:12Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "expired_at": "2026-08-18T00:00:00Z"
  }
}
```

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

## Family `team`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `team.created` | `team:view` | `name`, `owner_id`, `team_id` |
| `team.updated` | `team:view` | `name`, `owner_id`, `team_id` |
| `team.deleted` | `team:view` | `name`, `team_id` |
| `team.member.invited` | `team:view` | `email`, `role_code`, `role_id`, `team_id` |
| `team.member.joined` | `team:view` | `team_id`, `user_id` |
| `team.member.removed` | `team:view` | `team_id`, `user_id` |
| `team.member.role_changed` | `team:view` | `role_id`, `team_id`, `user_id` |

### `team.created`

A team is created, including the personal team created alongside a new account.

### When this fires

A team is created, including the personal team created alongside a new account. Creating additional teams requires Growth tier or higher.

> **Not currently delivered.** Endpoints are scoped to a team, and an endpoint cannot exist for a team before that team does, so this event is not currently delivered to any subscriber. Poll [the teams list](https://docs.subscriby.net/api/v1/reference/teams) if you need to observe team creation.

### Caveats

- Creating an additional team requires the Growth tier or above. The personal team created at registration is not gated, so the event is emitted on every tier; it is the subsequent, explicit team creations that Free and Starter cannot reach.
- The personal team created with the account emits this too. Nothing in the payload distinguishes it from an explicitly created team.

### Related events

- `team.deleted`: terminal state.
- `team.member.invited`: typical follow-up.

```json
{
  "id": "evt_01HX...",
  "type": "team.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "name": "Research Team",
    "owner_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.updated`

A team is renamed.

### When this fires

A team's name changes. That is the whole of it today: `name` is the only mutable field on a team. Ownership does not transfer, and the tier a team sits on is a property of the owner's billing rather than of the team, so neither shows up here.

> **Fires however the rename happened.** The team model dispatches this from its own event map, not from any one code path. A rename through [the REST endpoint](https://docs.subscriby.net/api/v1/reference/teams), through the `update_team` MCP tool, or from a console fix that went near either, all emit it identically. The dashboard has no rename control today, so the API and MCP are the only routes.

### Caveats

- **No before value.** The payload carries the name the team has now, not the one it had. If your mirror needs the old name, keep it from the previous event or read it before applying.
- **A team has no code.** Unlike roles and groups, teams are addressed only by `team_id`, so a rename never breaks a reference.
- Renaming has no effect on membership, roles, groups, projects or billing.

### Related events

- `team.created`: predecessor.
- `team.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "team.updated",
  "created_at": "2026-08-31T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "name": "Northwind Studios",
    "owner_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.deleted`

A team is deleted; its projects are detached, not deleted.

### When this fires

A team is deleted. Projects that were scoped to it are detached: their `team_id` becomes null and they keep running under the owner's personal scope. Nothing about them is deleted and no `project.*` event fires.

> **Not delivered to the deleted team's endpoints.** An endpoint is scoped to a team, and deleting the team removes its endpoints in the same operation, so this event is not currently delivered to endpoints belonging to the deleted team.

### Caveats

- A team that still has collaborators cannot be deleted: the membership table's foreign key restricts it. Every `team.member.removed` for the team therefore precedes `team.deleted`, never follows it.
- The only team that cannot be deleted is your last one; an owner with more than one team may delete whichever they like, including the team created with the account. Nothing in the payload distinguishes them.

### Related events

- `team.created`: first event in the lifecycle.

```json
{
  "id": "evt_01HX...",
  "type": "team.deleted",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "name": "Research Team"
  }
}
```

### `team.member.invited`

An invitation is issued to a new collaborator.

### When this fires

A team owner or manager invites a collaborator by email. The collaborator becomes a member only once they accept and `team.member.joined` fires. The invitee has not yet accepted at this point.

### Caveats

- An invitation can be revoked without producing a follow-up event in this family. Invitations do not expire: a pending one stands until it is accepted or withdrawn.
- The collaborator does not have access until they accept; expect `team.member.joined`.

### Related events

- `team.member.joined`: fires on acceptance.
- `team.member.removed`: fires only if the collaborator accepts and is later removed. Withdrawing the invitation itself emits nothing.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.invited",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "email": "collaborator@example.com",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "role_code": "manager"
  }
}
```

### `team.member.joined`

An invited collaborator accepts and joins.

### When this fires

An invited collaborator accepts and joins the team.

### Caveats

- The collaborator's role was determined at invitation time; see the matching `team.member.invited` event for the role.
- A user can belong to multiple teams; this event is scoped per (team, user).

### Related events

- `team.member.invited`: predecessor.
- `team.member.role_changed`: typical follow-up over time.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.joined",
  "created_at": "2026-05-18T10:30:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "user_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.member.removed`

A collaborator is removed from a team by its owner.

### When this fires

A team owner removes a collaborator. There is no self-service leave, so this event always represents an action taken by the owner.

### Caveats

- Removal detaches the team membership row and nothing else. Roles are team-scoped, so there is no per-project assignment to revoke, and group memberships are left in place: re-adding the same user restores their old group memberships.

### Related events

- `team.member.invited`: predecessor in the lifecycle.
- `team.member.joined`: predecessor.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.removed",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "user_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80"
  }
}
```

### `team.member.role_changed`

A collaborator's role within a team changes.

### When this fires

A collaborator's role within the team changes: promoted, demoted, or moved between custom roles. Nothing in Subscriby fired this before the team member role endpoint existed; that endpoint and the `update_team_member_role` MCP tool are what make it fire.

### Caveats

- For ability detail behind a role id, listen for `role.updated` or pull the role definition from the API.
- This event covers the team-level role on the membership pivot only. Groups carry permissions rather than roles, so a change to group membership emits `group.members_synced` instead and never this event.

### Related events

- `team.member.joined`: predecessor in the lifecycle.
- `role.updated`: emits when the role definition itself changes.

```json
{
  "id": "evt_01HX...",
  "type": "team.member.role_changed",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "user_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "role_id": null
  }
}
```

## Family `role`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `role.created` | `role:view` | `code`, `name`, `role_id`, `team_id` |
| `role.updated` | `role:view` | `code`, `name`, `role_id`, `team_id` |
| `role.deleted` | `role:view` | `code`, `role_id`, `team_id` |

### `role.created`

A new role is created within a team.

### When this fires

Any member of the team (or a token carrying `role:create`) creates a new role. It also fires three times when a team is first seeded, once for each default role.

### Caveats

- The full ability list is not embedded in this event; fetch the role from the API for complete detail.
- The three default roles a new team is seeded with (`admin`, `manager`, `viewer`) emit this event too, one per role, at the moment the team is created.

### Related events

- `role.updated`: subsequent edits.
- `role.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "role.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "code": "plan-editor",
    "name": "Plan Editor"
  }
}
```

### `role.updated`

A role's name or abilities change.

### When this fires

A role's name, description, or permission set is saved, including the default `admin`, `manager` and `viewer` roles. The event is emitted on every save, even one that changes nothing, so treat it as "the role was written" rather than "the role changed".

### Caveats

- This event fires on both name changes and ability-set changes; fetch the role from the API to determine what actually changed.
- Collaborators currently holding the role pick up the new abilities immediately on next request.

### Related events

- `role.created`: predecessor.
- `team.member.role_changed`: fires when a collaborator's role assignment changes (different surface).

```json
{
  "id": "evt_01HX...",
  "type": "role.updated",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "code": "plan-editor",
    "name": "Plan Editor"
  }
}
```

### `role.deleted`

A role is deleted. Only roles no collaborator currently holds can be deleted.

### When this fires

A role that no collaborator currently holds is deleted. A role still assigned to someone cannot be deleted at all; the database refuses it.

### Caveats

- Deleting is restricted to the role's creator, unless the caller owns the team: a team owner can delete any role in their team, including the default `admin`, `manager` and `viewer` roles. The dashboard hides the action for roles you did not create; the API and MCP surfaces do not.

### Related events

- `role.created`: first event in the lifecycle.
- `team.member.role_changed`: emits for explicit role re-assignments.

```json
{
  "id": "evt_01HX...",
  "type": "role.deleted",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "role_id": "d05e1a83-7c46-4f29-b613-8ae407c9d251",
    "code": "plan-editor"
  }
}
```

## Family `group`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `group.created` | `group:view` | `code`, `group_id`, `name`, `team_id` |
| `group.updated` | `group:view` | `code`, `group_id`, `name`, `team_id` |
| `group.members_synced` | `group:view` | `added_ids`, `code`, `group_id`, `member_count`, `member_ids`, `name`, `removed_ids`, `team_id` |
| `group.deleted` | `group:view` | `code`, `group_id`, `team_id` |

### `group.created`

A new team group is created.

### When this fires

A team owner or manager creates a new group. Groups bundle collaborators behind a shared permission set: several people in a team can be in the same group, and someone can be in more than one.

### Caveats

- Neither the permission set nor the member list is embedded in this event; read [the group endpoint](https://docs.subscriby.net/api/v1/reference/groups) for the group's current permissions, and expect `group.members_synced` when people are put into it.
- Changing who is in the group emits `group.members_synced`, not this event; `team.member.role_changed` covers a member's team role and is unrelated to groups.

### Related events

- `group.updated`: subsequent edits.
- `group.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "group.created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "code": "core-community",
    "name": "Core Community"
  }
}
```

### `group.updated`

A group is renamed or its permission set replaced.

### When this fires

A group is renamed, or the permissions attached to it are replaced. Who is *in* the group is a separate event, `group.members_synced`, because the two changes have different consequences. A rename is cosmetic; changing the permission set silently re-scopes everyone already in the group.

### Caveats

- **The permission set is not in the payload**, so this event tells you a group changed without telling you into what. Read [the group endpoint](https://docs.subscriby.net/api/v1/reference/groups) for the current permissions.
- **Permissions replace, they do not merge.** An update that sends `permissions` sets them to exactly that list, so everyone in the group can gain and lose access in the same event.
- `code` is immutable, so a rename never breaks a reference held elsewhere.
- Membership is untouched here. See `group.members_synced`.

### Related events

- `group.members_synced`: who is in the group changed.
- `group.created`: predecessor.
- `group.deleted`: terminal state.

```json
{
  "id": "evt_01HX...",
  "type": "group.updated",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "code": "core-community",
    "name": "Core Community"
  }
}
```

### `group.members_synced`

The set of people in a group changed, with the deltas.

### When this fires

The membership of a group is replaced and the result differs from what was there before, via [the group members endpoint](https://docs.subscriby.net/api/v1/reference/groups) or the dashboard's group editor.

A group carries permissions, so who is in it decides who can do what. Until this event existed, renaming a group announced itself with `group.updated` while changing who it granted access to announced nothing at all; an integration mirroring access control could see the label change and miss the membership.

> **A no-op sync is silent.** Syncing the same set that is already there emits nothing. This event means the membership actually moved, so receiving one always implies at least one id in `added_ids` or `removed_ids`.

### Why the deltas are in the payload

An access-control mirror needs to know who *lost* the group, and diffing two snapshots on the far side is work it should not have to do: it requires having stored the previous state, and gets the answer wrong the first time it sees a group. `added_ids` and `removed_ids` are computed where the truth is, from the membership read immediately before the write and the list written immediately after it.

`member_ids` is still there for consumers that would rather replace their copy than apply a patch. Both are consistent with each other.

### Caveats

- **This is a replace, not an add.** Anyone absent from the request is removed. An empty list empties the group.
- **Permissions are not in the payload.** What the group grants is a property of the group, not of this event; read it from [the group endpoint](https://docs.subscriby.net/api/v1/reference/groups) if your mirror needs the effective permission set.
- **Users, not projects.** A group clusters collaborators. It is not a way to bundle projects.
- Removal from a group does not remove anyone from the team.

### Related events

- `group.updated`: the group was renamed or re-permissioned.
- `group.created`: predecessor.
- `group.deleted`: terminal state; everyone loses what it granted at once.

```json
{
  "id": "evt_01HX...",
  "type": "group.members_synced",
  "created_at": "2026-08-31T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "code": "core-community",
    "name": "Core Community",
    "member_ids": [
      "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "6f9b2e37-c184-4a05-8d72-30e16bc9f458"
    ],
    "added_ids": [
      "6f9b2e37-c184-4a05-8d72-30e16bc9f458"
    ],
    "removed_ids": [
      "d05e1a83-7c46-4f29-b613-8ae407c9d251"
    ],
    "member_count": 2
  }
}
```

### `group.deleted`

A group is deleted; its members lose the permissions it granted.

### When this fires

A group is deleted. Its permission and ability attachments are detached and its membership rows are removed; the people in it stay in the team but lose whatever the group granted. This is the final event you will receive for the given `group_id`.

### Caveats

- No per-collaborator event fires: the members' group rows cascade away with the group, and `group.members_synced` is emitted only by an explicit membership sync.
- Members of the group are not removed from the team; only the group and the access it granted go away.

### Related events

- `group.created`: first event in the lifecycle.

```json
{
  "id": "evt_01HX...",
  "type": "group.deleted",
  "created_at": "2026-05-22T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "team_id": "a83f0d51-4c92-4b7e-8615-2fd9e70a3c86",
    "group_id": "1f68d92a-04c5-4e83-97b1-3d6a05e2f847",
    "code": "core-community"
  }
}
```

## Family `billing`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `billing.invoice_created` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id` |
| `billing.invoice_paid` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id` |
| `billing.invoice_overdue` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id` |
| `billing.payment_failed` | `billing:read` | `amount`, `attempt_count`, `creator_id`, `currency`, `hosted_invoice_url`, `invoice_id`, `reason` |
| `billing.trial_ending` | `billing:read` | `amount`, `amount_estimated`, `creator_id`, `currency`, `hours_remaining`, `plan_id`, `subscription_id`, `trial_ends_at` |
| `billing.grace_period_warning` | `billing:read` | `creator_id`, `days_until_lockdown`, `past_due_since` |
| `billing.account_locked` | `billing:read` | `creator_id`, `locked_at`, `past_due_since` |
| `billing.tier_upgraded` | `billing:read` | `creator_id`, `effective_at`, `from_tier`, `to_tier` |
| `billing.tier_downgraded` | `billing:read` | `creator_id`, `effective_at`, `from_tier`, `to_tier` |
| `billing.tier_cancelled` | `billing:read` | `canceled_at`, `creator_id`, `effective_at`, `plan_id`, `status`, `subscription_id` |

### `billing.invoice_created`

A new invoice is generated for the creator's Subscriby tier.

### When this fires

A new invoice is generated for the creator's Subscriby tier subscription. These events describe the creator's relationship with Subscriby itself, not their subscribers.

### Caveats

- This event is creator-side only. Subscriber invoices, if any, are not represented in `billing.*`.
- Pairs with `billing.invoice_paid` on success and `billing.payment_failed` when the first attempt fails.

### Related events

- `billing.invoice_paid`: successful collection.
- `billing.payment_failed`: failed collection attempt.

```json
{
  "id": "evt_01HX...",
  "type": "billing.invoice_created",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 0
  }
}
```

### `billing.invoice_paid`

An invoice is paid in full.

### When this fires

The creator's tier invoice is paid in full and the account is marked current.

### Caveats

- Expect two deliveries per payment. Subscriby maps both Stripe `invoice.paid` and `invoice.payment_succeeded` onto this event. De-duplicate on `data.invoice_id`.
- Recovery is not driven by this event. `past_due_since`, `locked_at` and the warning stamps are cleared when Stripe reports the subscription back at `active`/`trialing` on `customer.subscription.updated`, which emits no `billing.*` event of its own, so a consumer tracking lock state should treat this event as a hint, not the unlock signal.
- A creator's lockdown never suspends their subscribers' billing (only new signups are blocked), so there is nothing to resume here.

### Related events

- `billing.invoice_created`: predecessor.
- `billing.payment_failed`: alternative outcome.

```json
{
  "id": "evt_01HX...",
  "type": "billing.invoice_paid",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 1
  }
}
```

### `billing.invoice_overdue`

A creator invoice is marked overdue.

### When this fires

The creator's invoice is marked uncollectible by the payment provider. Coverage is partial: providers do not always send this signal for every overdue scenario.

> **Deferred coverage.** Wired only to Stripe's `invoice.marked_uncollectible` signal. Stripe does not send that for every overdue scenario, so gaps are possible. Pair this event with `billing.payment_failed` and `billing.grace_period_warning` to cover overdue states reliably.

### Caveats

- Deferred in practice: coverage depends on Stripe sending `invoice.marked_uncollectible`. For full coverage of overdue states, listen for `billing.payment_failed` and `billing.grace_period_warning`.
- The billing overdue policy drives lockdowns on its own daily cadence; see `billing.account_locked`.

### Related events

- `billing.payment_failed`: typical earlier signal.
- `billing.grace_period_warning`, `billing.account_locked`: downstream signals.

```json
{
  "id": "evt_01HX...",
  "type": "billing.invoice_overdue",
  "created_at": "2026-04-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 3
  }
}
```

### `billing.payment_failed`

A recurring charge against the creator's payment method fails.

### When this fires

A scheduled charge against the creator's payment method fails. The platform will continue to retry inside the grace window.

### Caveats

- Multiple `billing.payment_failed` events can fire for the same `invoice_id` as Stripe retries.
- Repeated failures escalate through the grace window; see `billing.grace_period_warning` and `billing.account_locked` for that progression.

### Related events

- `billing.invoice_paid`: successful resolution.
- `billing.account_locked`: terminal state if recovery doesn't happen.

```json
{
  "id": "evt_01HX...",
  "type": "billing.payment_failed",
  "created_at": "2026-04-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "invoice_id": "in_1Nxy..",
    "amount": "49.00",
    "currency": "USD",
    "hosted_invoice_url": "https://invoice.stripe.com/..",
    "attempt_count": 2,
    "reason": "Your card was declined."
  }
}
```

### `billing.trial_ending`

The creator's platform trial is about to convert and take its first payment.

### When this fires

The creator's own Subscriby trial crosses a reminder milestone on its way to converting. The trial collects a card at checkout and converts by itself, so this is the only advance notice a consumer gets before the first charge appears.

Milestones are configured per deployment and fire largest-first. The default ladder is **72 hours** then **24 hours** before `trial_ends_at`, so a standard 7-day trial produces exactly two events. A milestone wider than the trial itself is skipped rather than fired at signup, so a trial shorter than 72 hours emits only the 24-hour event. Fires once per milestone, not once per trial; read `hours_remaining` to tell the two apart.

Subscriby emails the creator alongside every emission, and mirrors it to their connected account when one is linked.

### Reading `amount` correctly

When `amount_estimated` is `false`, the figure comes from the upcoming Stripe invoice and already includes tax, any discount, and the transaction fees the creator's own sales metered during the trial. It is what will actually be taken.

When `amount_estimated` is `true`, Stripe could not be reached and the figure is the plan's current price including any promotion in force. Treat it as indicative: do not reconcile against it, and do not surface it as a confirmed charge.

A creator carrying a credit grant or account balance will legitimately see `"0.00"`; the trial still converts, the invoice is simply covered.

### Caveats

- **Not once per trial.** The default ladder emits twice. De-duplicate on `subscription_id` + `hours_remaining` if your consumer must act only once.
- A trial the creator cancels before it converts stops emitting: no further milestones fire and no charge is raised.
- The milestone ladder is deployment configuration, so do not hard-code `72` and `24`. Read `hours_remaining`.
- `hours_remaining` is the milestone that fired, not the exact time left. The sweep runs hourly, so the true remaining time is somewhere within an hour below the value.

### Related events

- `billing.invoice_created`: the invoice this warning was about, once the trial actually converts.
- `billing.payment_failed`: fires instead if the card on file is declined at conversion.
- `subscription.trial_converting`: the subscriber-tier equivalent, for a creator's own members.

```json
{
  "id": "evt_01HX...",
  "type": "billing.trial_ending",
  "created_at": "2026-08-23T09:00:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "plan_id": "c4e82f16-93a7-4d5b-b81c-6e0f27a94d3b",
    "subscription_id": "5b7e2d40-1a86-4c39-97f2-e83d0b16c5a4",
    "trial_ends_at": "2026-08-26T09:00:00Z",
    "hours_remaining": 72,
    "amount": "19.00",
    "currency": "USD",
    "amount_estimated": false
  }
}
```

### `billing.grace_period_warning`

The creator is approaching automatic lockdown for an unpaid invoice.

### When this fires

The creator's account reaches the warning milestone on its overdue clock. That milestone depends on the plan's base price: **day 3** for a creator on a zero-base-price (Free) plan, whose lockdown lands on day 7, and **day 23** for a paid plan, whose lockdown lands on day 30. Fires once per past-due cycle.

Read `days_until_lockdown` from the payload rather than assuming a fixed offset; it carries the actual remaining days for that creator's tier.

### Caveats

- Each past-due cycle produces at most one `billing.grace_period_warning`. If the account recovers and re-enters past_due later, a new cycle and a new warning may issue.
- After lockdown the clock keeps running: a deletion warning at 53 days locked and account deletion at 60 days locked on paid/trial thresholds (3 and 7 days on Free). Neither stage emits a `billing.*` webhook; they surface as notifications only.

### Related events

- `billing.payment_failed`: the chain of failed collections leading here.
- `billing.account_locked`: fires when the lockdown day arrives: 7 days after this event on a paid tier, 4 on Free or an unconverted trial.

```json
{
  "id": "evt_01HX...",
  "type": "billing.grace_period_warning",
  "created_at": "2026-05-11T08:00:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "past_due_since": "2026-04-18T00:00:00Z",
    "days_until_lockdown": 7
  }
}
```

### `billing.account_locked`

The account hits its past-due lockdown.

### When this fires

The creator's account reaches its tier's past-due lockdown: day 30 on a paid tier, day 7 on Free or an unconverted trial. New signups on the project's portal pages are blocked and the dashboard surfaces a lockdown banner.

### Caveats

- Lockdown is reversible: a successful payment fires `billing.invoice_paid` and the lockdown is cleared automatically. There is no dedicated "account_unlocked" event.
- Existing subscribers retain access to project resources during lockdown; only new signups are blocked.

### Related events

- `billing.grace_period_warning`: the warning that precedes it, 7 days earlier on a paid tier and 4 on Free or an unconverted trial.
- `billing.invoice_paid`: automatic unlock signal.

```json
{
  "id": "evt_01HX...",
  "type": "billing.account_locked",
  "created_at": "2026-05-18T00:00:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "past_due_since": "2026-04-18T00:00:00Z",
    "locked_at": "2026-05-18T00:00:00Z"
  }
}
```

### `billing.tier_upgraded`

The creator upgrades to a higher Subscriby tier.

### When this fires

The creator switches their Subscriby subscription to a higher-priced tier. Pro-ration is applied through the payment provider, except when the creator is still inside their platform trial, where the switch is not prorated because nothing has been paid yet.

### Caveats

- Tier changes can unlock features (e.g. Teams on Growth+); event consumers should refresh tier caches on receipt.
- Pro-ration charges fire `billing.invoice_created` separately for the proration line (not on an upgrade taken during the platform trial).

### Related events

- `billing.tier_downgraded`: opposite direction.
- `billing.invoice_created`: proration invoice.

```json
{
  "id": "evt_01HX...",
  "type": "billing.tier_upgraded",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_tier": "308eb3da-1eb6-11f0-b4f2-d8bbc173f8c3",
    "to_tier": "882b72bb-1eb6-11f0-b4f2-d8bbc173f8c3",
    "effective_at": "2026-05-18T10:05:00Z"
  }
}
```

### `billing.tier_downgraded`

The creator downgrades to a lower Subscriby tier.

### When this fires

The creator switches their Subscriby subscription to a lower tier. The change lands at the end of the period they have already paid for, not at `effective_at`: the current phase runs to its existing end date and the lower tier begins after it.

### Caveats

- `effective_at` is stamped at emission time and is never in the future, even when the provider defers the billing change to the next renewal boundary. Do not use it to schedule feature revocation.
- Tier-locked features (Teams, custom roles, etc.) may become read-only or hidden once the current paid period ends, never at `effective_at`.

### Related events

- `billing.tier_upgraded`: opposite direction.
- `billing.tier_cancelled`: terminal downgrade path.

```json
{
  "id": "evt_01HX...",
  "type": "billing.tier_downgraded",
  "created_at": "2026-05-18T10:05:00Z",
  "api_version": "2026-05-01",
  "project_id": null,
  "data": {
    "creator_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
    "from_tier": "882b72bb-1eb6-11f0-b4f2-d8bbc173f8c3",
    "to_tier": "308eb3da-1eb6-11f0-b4f2-d8bbc173f8c3",
    "effective_at": "2026-05-18T10:05:00Z"
  }
}
```

### `billing.tier_cancelled`

The creator cancels their Subscriby subscription.

### When this fires

The creator cancels their Subscriby tier subscription. The account remains usable until the current period ends.

This event has **two distinct payload shapes** depending on which side initiated the cancellation. Branch on the presence of `effective_at` versus `subscription_id`.

### Caveats

- **Expect this event twice for a single cancellation.** The dashboard shape fires when the creator cancels; the provider shape fires later, when the period actually ends and the provider deletes the subscription. De-duplicate on `data.creator_id` if you only want to act once.
- Cancellation does not refund the active period; there is a no-refunds policy on creator tier billing.
- The account does not auto-lock at `effective_at` unless past_due conditions also apply; it gracefully drops to the Free tier feature set.

### Related events

- `billing.tier_downgraded`: alternative path that retains paid features.
- `billing.invoice_paid`: last paid invoice before cancellation.


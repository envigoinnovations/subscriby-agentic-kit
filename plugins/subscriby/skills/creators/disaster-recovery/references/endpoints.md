# REST endpoints: Disaster Recovery

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `recovery`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/recovery/members/export` | `project-recovery:view-any` | Export a project's member list |  |
| GET | `/v1/projects/{project}/recovery/settings` | `project-recovery:view` | Get a project's recovery settings | `get_recovery_settings` |
| PATCH | `/v1/projects/{project}/recovery/settings` | `project-recovery:update` | Update a project's recovery settings | `update_recovery_settings` |
| DELETE | `/v1/projects/{project}/recovery/standby-installation` | `project-recovery:delete` | Remove a project's standby installation | `remove_standby_installation` |
| DELETE | `/v1/projects/{project}/resources/{resource}/replacement/request` | `project-recovery:delete` | Withdraw a replacement request | `withdraw_resource_replacement_request` |
| POST | `/v1/projects/{project}/resources/{resource}/replacement/request` | `project-recovery:create` | Request a replacement for a resource | `request_resource_replacement` |
| DELETE | `/v1/projects/{project}/resources/{resource}/standby` | `project-recovery:delete` | Remove a resource's standby | `remove_resource_standby` |
| GET | `/v1/projects/{project}/resources/{resource}/standby` | `project-recovery:view` | Get a resource's standby | `get_resource_standby` |
| PATCH | `/v1/projects/{project}/resources/{resource}/standby` | `project-recovery:update` | Switch a standby's live mirror | `set_resource_standby_mirror` |
| DELETE | `/v1/projects/{project}/resources/{resource}/standby/request` | `project-recovery:delete` | Withdraw a standby request | `withdraw_resource_standby_request` |
| POST | `/v1/projects/{project}/resources/{resource}/standby/request` | `project-recovery:create` | Request a standby for a resource | `request_resource_standby` |
| POST | `/v1/projects/{project}/resources/{resource}/standby/use` | `project-recovery:create` | Use a resource's standby now | `use_resource_standby` |
| GET | `/v1/recovery/allowances` | `project-recovery:view-any` | Get the recovery allowances | `get_recovery_allowances` |
| GET | `/v1/recovery/incidents` | `project-recovery:view-any` | List incidents | `list_recovery_incidents` |
| GET | `/v1/recovery/incidents/{incident}` | `project-recovery:view` | Get an incident | `get_recovery_incident` |
| GET | `/v1/recovery/operations` | `project-recovery:view-any` | List recovery operations | `list_recovery_operations` |
| GET | `/v1/recovery/operations/{operation}` | `project-recovery:view` | Get a recovery operation | `get_recovery_operation` |
| POST | `/v1/recovery/operations/{operation}/notify-members` | `project-recovery:update` | Tell members about a bot replacement | `notify_members_of_recovery` |
| POST | `/v1/recovery/operations/{operation}/nudge` | `project-recovery:update` | Remind a recovery's stragglers | `nudge_pending_readmissions` |
| POST | `/v1/recovery/operations/{operation}/revert` | `project-recovery:update` | Undo a recovery | `revert_recovery_operation` |
| GET | `/v1/recovery/operations/{operation}/roll-call` | `project-recovery:view` | Get a recovery's roll call | `get_recovery_roll_call` |
| GET | `/v1/recovery/readiness` | `project-recovery:view-any` | Get the readiness checklist | `get_recovery_readiness` |

### GET `/v1/projects/{project}/recovery/members/export`

```bash
curl -L https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/members/export \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" -o members.csv
```

The member list a creator keeps before replacing a bot, as a CSV download (`text/csv`, one member per row: name, email, connector id, active plans, when access ends, resources, whether the bot can still reach them). REST only; there is no MCP tool for a file.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### GET `/v1/projects/{project}/recovery/settings`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

- `auto_failover_enabled` says whether the platform may swap a banned channel for its standby on its own; `auto_failover_email_consented_at` when the creator accepted the per-email fee a failover may charge for the members the bot cannot reach.
- `email_delivery` says how members are told after a channel swap the creator ran: `self` (the creator tells them) or `platform` (Subscriby emails them at the fee).
- `standby_installation_registered` says whether a spare bot is kept; its credentials never appear.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PATCH `/v1/projects/{project}/recovery/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/settings \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"auto_failover": true, "accepts_email_fee": true, "email_delivery": "platform"}'
```

Every field is optional and omitted ones keep their value. Switching `auto_failover` on needs `accepts_email_fee: true` in the same call and the Growth Plan. Answers `200` with the settings as they now stand.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `auto_failover` (boolean): Whether the platform may swap a banned channel for its standby on its own. Switching it on needs `accepts_email_fee: true` in the same call and the Growth Plan.
- `accepts_email_fee` (boolean): Consent to the per-email fee a failover may charge for the members the bot cannot reach; consent is not implied by the switch.
- `email_delivery` (one of `platform`, `self`): How a project reaches the members its bot cannot message after a swap. A replaced channel re-admits every live member through the project bot, but a member who never started the bot, or whose bot was banned in the same incident, cannot be reached that way. The creator decides once per project whether the platform emails those members on their behalf, at a per-email fee added to the transaction fees, or whether they download the list and write themselves. The default is the free one, so nobody is charged for a choice they did not make.


### DELETE `/v1/projects/{project}/recovery/standby-installation`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/$PROJECT_ID/recovery/standby-installation \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Stops keeping the spare bot registered for the project and withdraws it from the connector; the live installation, members and access stay as they are. Answers `204`. Registering one is not offered to tokens, because it takes a credential; the dashboard's Prevention page does that. Raises `recovery.standby_removed` with `standby: installation`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}/resources/{resource}/replacement/request`

Takes the open replacement request back. Answers `204`, also when nothing was open.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/replacement/request`

Asks the creator, on the connector, to pick the chat that replaces the resource's: the same conversation a standby request starts, ending in a swap instead of a spare. For a degraded resource the swap will spend the channel recovery allowance or join the recovery already absorbing swaps; for a healthy one it is on demand and free. Answers `202` once the request is sent.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}/resources/{resource}/standby`

Stops keeping the standby; the chat itself is untouched. Answers `204` and raises `recovery.standby_removed`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/resources/{resource}/standby`

```bash
curl https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The standby's own identifier on the platform is deliberately absent, as every connector identifier is on the API.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.


### PATCH `/v1/projects/{project}/resources/{resource}/standby`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"mirror": true}'
```

Switches the live mirror on or off: when on, every post made in the channel is copied into the standby as it is made. Only a channel can be mirrored, and switching on needs the Growth Plan. Answers `200` with the standby.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `mirror` (boolean, required): Whether every post made in the channel is copied into the standby as it is made. Only a channel can be mirrored, and switching on needs the Growth Plan.


### DELETE `/v1/projects/{project}/resources/{resource}/standby/request`

Takes the open standby request back. A creator holds one request of each kind at a time, whichever resource it was for, so the resource in the path only keys the route. Answers `204`, also when nothing was open.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/standby/request`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby/request \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Asks the creator, on the connector, to pick the chat that becomes the resource's standby (Growth Plan). Answers `202` once the request is sent; the standby appears, announced by `recovery.standby_registered`, the moment they choose.

Linking a standby or a replacement is a conversation with the creator on the connector: the bot messages them with a picker, and the link or the swap happens the moment they choose. The API cannot name the chat directly, because that would take a platform identifier, so it starts the conversation and takes it back. A creator holds one request of each kind at a time, whichever resource it was for.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/resources/{resource}/standby/use`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/resources/$RESOURCE_ID/standby/use \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Swaps the resource onto its standby right now: the resource points at the standby chat, the old invite links are revoked, every active member is re-admitted, and the standby is consumed. Answers `200` with the recovery operation the swap ran under (`on_demand: true` when the resource was healthy with no open incident, spending no allowance). Undo is offered for 24 hours through the revert endpoint. Raises `recovery.resource_replaced` and `recovery.standby_removed` with `reason: used`, beside the operation's `recovery.operation_started` and `recovery.operation_completed`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `resource` (path, string, required): The resource, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/recovery/allowances`

```bash
curl https://api.subscriby.net/v1/recovery/allowances \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One row per kind, plus the window they are counted in.

- `self_service_remaining` is what the rolling window still allows on its own; `grant_remaining` is what support has released on top and not yet spent. `remaining` is their sum and `allowed` whether a recovery of that kind would start right now.
- `uses_grant` is true when the next recovery would spend a support grant rather than the self-service allowance.
- `next_self_service_at` is when the self-service allowance returns, `null` while it is available. `last_used_at` is when the kind was last recovered inside the window.

See [Allowances and support review](https://docs.subscriby.net/disaster-recovery/allowances-and-support-review) for the rule and what support audits before releasing a grant.


### GET `/v1/recovery/incidents`

```bash
curl "https://api.subscriby.net/v1/recovery/incidents?status=open" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

An incident is one problem a probe detected and has not yet seen fixed: the creator's sign-in account unreachable (`kind: account`), a project's bot refused by the platform (`bot`), or a channel or group the project sells gone or no longer administered (`resources`). It resolves itself when a later probe finds the thing healthy, or is resolved by the recovery that replaced it, which `resolved_by_operation_id` then names.

`status` is `open` (the default: what still needs attention), `resolved`, or `all`. Paginated like every list, newest first by `detected_at`; `sort_by` also accepts `kind`, `status` and `resolved_at`.

**Parameters**

- `status` (query, string): The tab: `open` (the default, what still needs attention), `resolved`, or `all`.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `detected_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### GET `/v1/recovery/incidents/{incident}`

```bash
curl https://api.subscriby.net/v1/recovery/incidents/$INCIDENT_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One incident.

- `reason` is the connector's own code for what it saw; `reason_label` and `reason_explanation` are that code in the connector's words, the same sentence the alert email carried. Both are `null` when the probe recorded no reason, which is the case for account incidents.
- `resource_id` and `resource_title` are set on `resources` incidents only; `project_id` is `null` on an account incident.

**Parameters**

- `incident` (path, string, required): The incident, resolved within the ledger by the route binder.


### GET `/v1/recovery/operations`

```bash
curl "https://api.subscriby.net/v1/recovery/operations?kind=resources&status=completed" \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

An operation is one recovery: run by the creator, by the platform on their behalf (`automatic: true`, the failover you sleep through), or on demand (`on_demand: true`, a Swap & Grant of a healthy resource, which spends no allowance). The row exists from the moment the recovery starts, because it is the quota ledger and the audit trail at once.

Both filters are optional: `kind` is `account`, `bot` or `resources`; `status` is `started`, `completed`, `failed` or `reverted`. Newest first by `started_at`; `sort_by` also accepts `kind`, `status` and `completed_at`.

**Parameters**

- `kind` (query, string): Narrow to one kind: `account`, `bot` or `resources`. An unknown value is refused.
- `status` (query, string): Narrow to one status: `started`, `completed`, `failed` or `reverted`. An unknown value is refused.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `started_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### GET `/v1/recovery/operations/{operation}`

```bash
curl https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

One operation, with its undo state.

- `status` is `started` while the recovery runs, then `completed`, `failed` (with `failure_reason`) or `reverted`.
- `revertible` says whether the creator may still undo it **right now**: it is completed, of a kind that can be undone (an account relink or a channel swap, never a bot replacement), and inside the undo window that `revert_window_ends_at` closes. A client should show the undo exactly when this is `true`.
- `grant_id` names the support grant that paid for the recovery when the self-service allowance was already spent; `null` otherwise.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.


### POST `/v1/recovery/operations/{operation}/notify-members`

```bash
curl -X POST https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/notify-members \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

After a **bot replacement**, emails every member the project can reach by email that its bot changed, with the new bot's link and the portal, at the per-email fee added to the creator's transaction fees. Sent once per recovery: a second call answers with the count already sent and sends nothing. Answers `200` with the count.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/recovery/operations/{operation}/nudge`

```bash
curl -X POST https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/nudge \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)"
```

Sends one reminder, with a fresh link, to every member a channel recovery re-admitted who has not joined the new chat yet, and records the nudge on the operation. Read the roll call first: `can_nudge` says whether anyone is still outside and the cooldown has passed. Answers `200` with the count queued.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/recovery/operations/{operation}/revert`

```bash
curl -X POST https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/revert \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"resource_id": "b73c5f21-9d80-4a6e-8215-4f70ce13a9d6"}'
```

Inside the undo window (`revert_window_ends_at` on the operation) a completed recovery can be undone. A **channel recovery** is undone one swap at a time: `resource_id` names the resource to put back on its old chat, and every active member is re-admitted there again; the operation reads `reverted` once its last standing swap is undone. An **account relink** is undone whole and takes no `resource_id`: sign-in moves back to the previous account, every browser session is signed out, and a `relink_disputed` incident opens for support. A **bot replacement** cannot be undone.

Answers `200` with the operation, its `revertible` now `false`. Raises `recovery.operation_reverted`; a channel undo also moves the resource's place (`project.resource.updated` with `changes.space_id`) and an account undo opens the dispute incident (`recovery.incident_opened`).

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `resource_id` (string): For a channel recovery, the resource to put back on its old chat; every active member is re-admitted there again. Omit it for an account relink.


### GET `/v1/recovery/operations/{operation}/roll-call`

```bash
curl https://api.subscriby.net/v1/recovery/operations/$OPERATION_ID/roll-call \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

Where the re-admission after a channel recovery stands, read live.

- `total` is how many members the swap set out to re-admit; `regranted` how many hold a fresh link into the new chat; `failed` how many could not be given one.
- `unreachable` is how many the bot could not message, and `emailed` how many of those were told by email instead (at the per-email fee, when the project opted in).
- `joined` is stamped the moment the platform approves a member's join request, so `pending` (`regranted − joined`) is who is still outside.
- `settled` means the queue has handled everyone, so the counters will not move on their own. `can_nudge` is true when somebody is still outside and the reminder cooldown has passed; `cooling_down` and `nudge_available_at` explain a `false`.

A recovery of a kind that re-admits nobody (an account relink, a bot replacement) answers the same shape with every counter at zero rather than an error.

**Parameters**

- `operation` (path, string, required): The operation, resolved within the ledger by the route binder.


### GET `/v1/recovery/readiness`

```bash
curl https://api.subscriby.net/v1/recovery/readiness \
  -H "Authorization: Bearer $SUBSCRIBY_TOKEN"
```

The whole checklist the **Readiness** page shows, with its totals.

- `done` is three-valued: `true` or `false` when the platform can verify the line, `null` when it can only remind (`reminder: true`). Reminders never count toward `total`.
- `locked` says the plan lacks the prevention feature the line needs, so a client shows the upgrade rather than the fix; `prevention` at the top says whether the plan bundles those features at all.
- `url` is where the line is fixed, or `null` for a reminder. `detail` is the state in words, such as "2 of 3 projects".
- `connector` names the connector a line belongs to (`connector_name` is its display name); both are `null` for the account's own lines.

The lines are the ones the dashboard lists, in the same order. The account's come first: `second_factor` and `backup_identity`. Then each installed connector's own lines, worded by that connector and keyed within it; Telegram's are `standby_installation`, `standby_spaces`, `auto_failover` and `live_mirror`, one line per key however many projects run it (the detail counts the projects when they differ). Last the two reminders, `off_platform_copy` and `second_admin`. A creator with no connector installed gets the account lines and the reminders alone. Every change to a verifiable line's state raises `recovery.readiness_changed`.


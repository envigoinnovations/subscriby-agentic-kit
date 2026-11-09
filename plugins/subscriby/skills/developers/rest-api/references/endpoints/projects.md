# REST endpoints: REST API, the `projects` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `projects`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects` | `project:view-any` | List projects | `list_projects` |
| POST | `/v1/projects` | `project:create` | Create a project | `create_project` |
| DELETE | `/v1/projects/{project}` | `project:delete` | Delete a project | `delete_project` |
| GET | `/v1/projects/{project}` | `project:view` | Get a project | `get_project` |
| PATCH | `/v1/projects/{project}` | `project:update` | Update a project | `update_project` |
| POST | `/v1/projects/{project}/archive` | `project:update` | Archive a project | `archive_project` |
| GET | `/v1/projects/{project}/connectors` | `project-connector:view-any` | List a project's installations | `list_connector_installations` |
| DELETE | `/v1/projects/{project}/connectors/{key}` | `project-connector:delete` | Uninstall a connector | `uninstall_connector` |
| POST | `/v1/projects/{project}/connectors/{key}` | `project-connector:create` | Install a connector | `install_connector` |
| DELETE | `/v1/projects/{project}/connectors/{key}/installation` | `project-connector:delete` | Disconnect an installation | `disconnect_connector` |
| GET | `/v1/projects/{project}/connectors/{key}/installation` | `project-connector:view` | Get a project's installation of a connector | `get_connector_installation` |
| GET | `/v1/projects/{project}/connectors/{key}/installation/actions` | `project-connector:view` | List what an installation can do for the creator | `list_connector_installation_actions` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/actions/{actionKey}` | `project-connector:update` | Have an installation do one of the things it offers | `run_connector_installation_action` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/doctor` | `project-connector:update` | Run the connector doctor | `run_connector_doctor` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/restore-access` | `project-connector:update` | Restore access after a reinstall | `restore_connector_access` |
| PATCH | `/v1/projects/{project}/connectors/{key}/installation/settings` | `project-connector:update` | Change an installation's settings | `update_connector_installation_settings` |
| GET | `/v1/projects/{project}/connectors/{key}/installation/spaces` | `project-connector:view` | List the places an installation could gate | `list_connector_spaces` |
| POST | `/v1/projects/{project}/connectors/{key}/installation/verify` | `project-connector:update` | Verify an installation | `verify_connector_installation` |
| GET | `/v1/projects/{project}/connectors/{key}/uninstall-preview` | `project-connector:view` | Preview an uninstall | `get_connector_uninstall_preview` |
| POST | `/v1/projects/{project}/restore` | `project:update` | Restore a project | `restore_project` |

### GET `/v1/projects`

```bash
curl https://api.subscriby.net/v1/projects \
  -H "Authorization: Bearer <token>"
```

Every project visible to the token, newest first, paged with `page` and `per_page` (default 25). A token minted with `scope:project:<uuid>` entries lists only those projects.

**Parameters**

- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.


### POST `/v1/projects`

```bash
curl -X POST https://api.subscriby.net/v1/projects \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Research Premium",
    "description": "Weekly deep-dive research notes.",
    "handle": "research-premium"
  }'
```

Banner and photo are optional image uploads. Send `multipart/form-data` when you want the API to accept the raw image:

```bash
curl -X POST https://api.subscriby.net/v1/projects \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -F "name=Research Premium" \
  -F "description=Weekly deep-dive research notes." \
  -F "banner=@./banner.jpg" \
  -F "photo=@./avatar.jpg"
```

Answers `201` with the project and emits `project.created`. Creating a project enforces the creator's tier project limit; exceeding it is `403 TEAM_TIER_REQUIRED` with a `required_capability` hint in `error.context`.

### Validation rules

Enforced on both create and update (every field is optional on update):

- `name`: required on create. String, 5–255 characters.
- `description`: optional. String, max 1,000 characters. HTML is filtered to a safe subset before storage.
- `terms`, `privacy`: optional. URLs, max 255 characters each.
- `banner`, `photo`: optional. Image uploads, max **5 MB** each, sent as `multipart/form-data`.
- `handle`: optional, on every tier. Lowercase alpha-dash ASCII, 5–255 characters, unique across every project's current and former handles. Omitted, a random handle is assigned; it can be changed later, and every former handle keeps redirecting to the current one.
- `active`: optional boolean.
- `storefront_arrangement`: optional, `manual` or `live`. `live` is refused with `TEAM_TIER_REQUIRED` when the project owner's plan or addons do not include time-limited passes; `manual` is always accepted.
- `outage_compensations`: optional boolean, `true` on every new project. **Outage Compensation**: when a platform refuses the project's connector for an hour or more and later answers again, every member whose paid access overlapped the gap gets the lost time added to the end of their access automatically, so nobody pays for days they could not use. Set it to `false` when the creator would rather settle outages themselves, for example with refunds or coupons. See [Connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages).
- `team_id`: optional UUID; must be a team the token's owner belongs to. Defaults to the token's scoped team.

> **Artwork is processed after the request.** The response body returns the project's metadata only, not the hosted image URLs. Image processing (resize, re-encode, upload to storage) runs on the server after a successful create or update; clients that need the hosted URL should fetch the project once upload is complete.

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}`

Deletes the project and everything under it. Returns `204 No Content` and emits `project.deleted`. Prefer archiving when you want to pause intake without losing history.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}`

One project. A project outside the token's team or its project scope is `404 RESOURCE_NOT_FOUND`.

`outage_compensations` is the project's **Outage Compensation** switch, `terms` and `privacy` the URLs members are asked to accept, and `banner_url` / `photo_url` the hosted artwork (null until uploaded). `storefront_arrangement` says how the portal, the embed and the bot order the plans on offer: `manual` is the order pinned through [Arrange the storefront order](https://docs.subscriby.net/api/v1/reference/plans/arrange-the-storefront-order), with passes, seasons and then subscriptions, cheapest first, behind anything unpinned; `live` puts the passes and seasons whose access is on now first, the one ending soonest at the top, then those opening soonest, then everything else in the pinned order, so a creator selling dated passes never has to re-arrange. `live` needs the owner's time-limited passes capability (Growth, or the Passes Addon on any plan): setting it without one is refused with `TEAM_TIER_REQUIRED`, and when the capability lapses the storefronts fall back to the pinned order at once while the stored value is reset to `manual` with a `project.updated` event. A project has no platform field: it installs [connectors](https://docs.subscriby.net/api/v1/reference/connectors), and the project's connectors list names them. Clients that read a `type` on projects before 5.0 must switch to the connectors list; the field is gone.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### PATCH `/v1/projects/{project}`

Every field is optional; only the fields present in the body change, under the same validation rules as create. Sending a new `handle` moves the portal URL at once, and every address the project answered on before keeps redirecting to the current one; a blank handle switches the portal page off. Answers `200` with the project and emits `project.updated`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/archive`

Switches the project off: `active` becomes `false`, the portal stops selling, and every plan, member and payment method is kept. Archive and restore are RPC-style actions separate from the update: they preserve the project's data while flipping `active`, so prefer them over delete when you want to pause intake without losing history. Answers `200` with the project and emits `project.archived`. Gated on `project:update`, not `project:delete`, because it flips one column of the project.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/connectors`

Every installation the project holds, live and standby, oldest first.

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors \
  -H "Authorization: Bearer <token>"
```

`role` is `live` for the one that acts and `standby` for the spare the Disaster Recovery Program keeps; `state` is `pending`, `connected`, `degraded` (the health probe found something wrong, `state_reason` and `state_detail` say what, `creator_actionable` whether the creator can fix it), `revoked` (the platform withdrew it) or `disconnected` (the creator did); `operational` is the one-word answer to "can it act right now?". `external_id`, `display_name`, `handle` and `avatar_url` are the platform's own account for the installation. Credentials and settings are never serialised.

`sales_paused` and `outage` describe a connector outage: the platform refused this live installation outright (token revoked or regenerated, bot deleted). While `sales_paused` is `true`, `outage` carries the outage's `id`, the connector's `reason` code and `started_at`, and every plan that unlocks a place on this connector is refused at checkout with `422 VALIDATION_FAILED`; both go back to `false` and `null` when the installation answers again, is replaced or is uninstalled. [Connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages) describes what members see and how they are compensated; [`connector.outage_opened`](https://docs.subscriby.net/webhooks/v1/events/connector/connector-outage-opened) and [`connector.outage_closed`](https://docs.subscriby.net/webhooks/v1/events/connector/connector-outage-closed) announce both ends.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


### DELETE `/v1/projects/{project}/connectors/{key}`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"unpublish_emptied_plans": true, "cancel_recurring_subscriptions": false}'
```

In order: the connector puts every member outside while its credentials still work, the rows are retired in one transaction (grants revoked, resources detached, the installation kept with `uninstalled_at`), the connector withdraws the installation, and the two opt-ins run. `unpublish_emptied_plans` (default `true`) takes the emptied plans off sale, firing `plan.deactivated` per plan; `cancel_recurring_subscriptions` (default `true`) cancels their live recurring subscriptions at the end of the paid period, firing `subscription.cancelled` per subscription and emailing each member that their subscription will not renew. One-time and lifetime purchases are never cancelled; a refund stays the creator's call. Identities are never removed. `connector.uninstalled` fires with the counts. Installing the connector again brings the same installation back as pending with its settings kept.

The two opt-ins travel in the JSON body or as query parameters; on by default, they only need sending to switch one off.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `unpublish_emptied_plans` (query, boolean): Take the plans the uninstall leaves with nothing to grant off sale, firing `plan.deactivated` per plan. Defaults to true; send `false` to leave them on sale.
- `cancel_recurring_subscriptions` (query, boolean): Cancel the live recurring subscriptions on those plans at the end of their paid period, firing `subscription.cancelled` per subscription and emailing each member. Defaults to true; one-time and lifetime purchases are never cancelled.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/connectors/{key}`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Installing and connecting are two acts. Installing says "this project runs this connector" and opens a **pending** installation with no credentials (`201` with the installation; `200` with the existing one when it was already installed, nothing changed). Connecting, which hands the connector the creator's credentials, stays on the dashboard, where the connector's declared `install_fields` are rendered and the platform is asked to describe the installation before anything is bound; a REST client cannot prove a credential is its own to bind. An uninstalled connector installed again comes back as pending with its settings kept.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### DELETE `/v1/projects/{project}/connectors/{key}/installation`

```bash
curl -X DELETE https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The connector withdraws the installation on its platform, the credentials are wiped and the installation turns `disconnected`; the row stays and can be connected again from the dashboard. Grants, resources, plans and identities are untouched, and members keep the access they hold. Answers `204`; an installation already disconnected is left alone. Disconnecting is not uninstalling: uninstalling, with its impact preview over the plans it would empty, is the separate act below.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/connectors/{key}/installation`

The project's installation of that connector in the live role, in whatever state, in the shape the installations list describes.

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation \
  -H "Authorization: Bearer <token>"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.


### GET `/v1/projects/{project}/connectors/{key}/installation/actions`

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/actions \
  -H "Authorization: Bearer <token>"
```

A connector declares the things its installation can set up on its platform as data, so every surface offers them the same way: each action carries its `key`, the `label` a button says, a `description` of what will happen, the `fields` the creator fills in first (the same shape as the connector's `install_fields`) and the `confirm` question a client asks before running, with `needs_confirmation` saying whether to ask. The list is empty for a connector that offers none, while the connector is paused, and while the installation cannot act. Run one with the endpoint below.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.


### POST `/v1/projects/{project}/connectors/{key}/installation/actions/{actionKey}`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/actions/setup_members_area \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "fields": { "category_name": "Inner Circle" } }'
```

Runs one action the actions endpoint listed, on the platform. `fields` is an object keyed by the names the action declares; each answer is checked against the field's rules before the connector acts, and a name the action never declared is refused. The answer says what happened in the creator's words: `done` true with a `message` and whatever the connector reports in `details`, or `done` false with the reason and, when the platform refused, the classified `failure`. This changes the platform itself (it may create channels, roles or categories), so an action whose `confirm` is set is run only once the creator has agreed. The dashboard's row menu, the `run_connector_installation_action` tool and the automation surfaces run the same action.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `actionKey` (path, string, required): The action key from the route, as the actions endpoint lists it.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `fields` (array of string): The answers as an object keyed by the field names the action lists under `fields`; a name the action never declared is refused, and each declared rule runs.


### POST `/v1/projects/{project}/connectors/{key}/installation/doctor`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/doctor \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The **Run Doctor** button of the dashboard. The installation is verified exactly as the verify endpoint does it, then the connector is asked about every resource the installation gates, and the answer is one report: a finding for the installation, then one per resource, each with a `severity` (`ok`, `warning`, `critical`), the connector's own `state` word, a sentence in the creator's language, whether the creator can fix it (`creator_actionable`) and where (`fix_url`). A resource the connector has no place for is a `warning`, never silence. `healthy` is `true` when every finding is `ok`.

The report is kept on the installation (`doctor_ran_at` and `doctor_healthy` on the installation object) and `connector.doctor_completed` fires only when the findings differ from the previous run's.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### POST `/v1/projects/{project}/connectors/{key}/installation/restore-access`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/restore-access \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

The **Restore Access** item of the dashboard's Connectors tab, offered while an uninstall has left the project detached places on the connector. Once the connector is installed and connected again, every detached place is asked about through the connector; the ones it still controls are made active and healthy again, and every live purchase of a plan that grants them is handed fresh access: only the grants the purchase lacks are issued, which are exactly the ones the uninstall took away, and `member.resource_added` fires per grant. A place the connector no longer controls stays detached for the doctor to explain. Plans the uninstall took off sale stay off sale until you publish them again.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### PATCH `/v1/projects/{project}/connectors/{key}/installation/settings`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/settings \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"settings": {"greeting": "Welcome aboard"}, "capabilities": {"broadcasts": false}}'
```

`settings` is an object keyed by the field names the connector declares in its `settings_fields` (read them from the card). Every declared rule runs; a key the connector never declared is `422 VALIDATION_FAILED` naming it; fields left out keep their value.

`capabilities` is an object keyed by capability to `true` or `false`: the project's switches for what the connector may do on this installation. A project keeps a connector for access alone by switching off `messaging`, `broadcasts`, `support_relay`, `native_payments` or any `recovery_*` facet; every core surface asks the switch before it invokes the connector, so a switched-off broadcast is refused before it is queued and a switched-off health check is skipped. A capability the connector does not declare, or one that cannot be switched off (`access_control`, `early_admission_hold`, `management_surface`, `portal_login`, `creator_registration`), is `422 VALIDATION_FAILED` naming it; switches left out keep their value. At least one of `settings` and `capabilities` is required.

Answers `200` with the installation, which never carries the settings themselves because a settings field may be a secret, but does carry `capabilities`: every capability the connector declares, each with `enabled` and `toggleable`. `connector.settings_updated` fires naming the fields and the switches (`capabilities.<key>`) that changed, only when something did.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `settings` (array of string): An object keyed by the field names the connector declares in its `settings_fields` (read them from the connector's card). Every declared rule runs; a key the connector never declared is `422 VALIDATION_FAILED` naming it.
- `capabilities` (array of boolean): An object keyed by capability to `true` or `false`: the project's switches for what the connector may do on this installation. A capability the connector does not declare, or one that cannot be switched off (`access_control`, `early_admission_hold`, `management_surface`, `portal_login`, `creator_registration`), is `422 VALIDATION_FAILED` naming it.


### GET `/v1/projects/{project}/connectors/{key}/installation/spaces`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/spaces?kind=role" \
  -H "Authorization: Bearer <token>"
```

A connector whose installation can list the places it administers (a server's roles and channels) lets a creator pick one instead of answering a picker on the platform; its directory card declares `space_browsing`. This is that list, read from the platform on every call: a place made a moment ago is on it, a deleted one is not. `kind` is one of the connector's `resource_kinds`, as a bare word (`role`) or spelled `connector:kind` (`example:role`). Pass a place's `external_id` to the from-space endpoint of the Resources API to sell it. A connector that cannot list its places answers `422 VALIDATION_FAILED`; the link request is its door.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `kind` (query, string, required): The kind of place to list: one of the connector's `resource_kinds` as the connector directory spells them, either the bare kind word (`role`) or spelled `connector:kind` with this connector's key (`discord:role`).


### POST `/v1/projects/{project}/connectors/{key}/installation/verify`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/installation/verify \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

A fresh probe rather than the hourly one: the connector is asked whether the installation still answers and the verdict is recorded, so `state` becomes `connected`, `degraded` (with `state_reason`, `state_detail` and `creator_actionable`) or `revoked`, and `health_checked_at` is stamped. Answers `200` with the installation. A `pending` installation has nothing to verify and is returned as it is. `connector.status_changed` fires only when the state moved.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/connectors/{key}/uninstall-preview`

Uninstall deletes nothing and touches no money by itself, and it is always previewed first:

```bash
curl https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/connectors/example/uninstall-preview \
  -H "Authorization: Bearer <token>"
```

- `resources` are the connector's on the project (manual perks are never among them); they will be deactivated and marked `detached`, their external ids kept.
- `live_grants` are the pending, held and granted grants on those resources; each is revoked with reason `connector_uninstalled` and fires `member.resource_removed`.
- `emptied_plans` are the plans that would keep no active grantable resource; `recurring_subscriptions` and `one_time_subscriptions` are the live purchases on them, `affected_subscription_ids` names them.
- `upcoming_windows`, `open_support_threads` and `member_identities` are informational: pass windows are never cancelled for you (cancel them from the pass window endpoints, which handle refunds), support threads lose their reach, and member accounts are never removed.
- `options` are the two opt-ins with their defaults, exactly the names the `DELETE` takes.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `key` (path, string, required): The connector key from the route.


### POST `/v1/projects/{project}/restore`

Switches an archived project back on. Answers `200` with the project and emits `project.restored`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


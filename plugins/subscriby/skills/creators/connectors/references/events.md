# Webhook events: Connectors

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

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

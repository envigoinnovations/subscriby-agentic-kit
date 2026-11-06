# Tools: Disaster Recovery

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `get_recovery_readiness` | read | `project-recovery:view-any` | Reads the Disaster Recovery readiness checklist for the creator this token acts for: every line (the account lines first: a second factor and a backup sign-in account; then each installed connector's own lines, named by `connector`, such as a standby installation, a standby for every gated space, automatic failover and a live mirror; then the reminders: a copy of the content kept elsewhere and a second human administrator) with `done` true, false, or null when the platform can only remind, `locked` when the plan lacks the prevention feature, the state in words (`detail`) and where the fix lives (`url`), plus the totals the dashboard card shows (`completed` of `total`, `complete`, and `prevention` for whether the plan bundles the prevention features). |
| `get_recovery_settings` | read | `project-recovery:view` | Reads one project's Disaster Recovery settings: whether automatic failover is switched on (`auto_failover_enabled`) and when the per-email fee it may charge was accepted, how members are told after a channel swap the creator ran (`email_delivery`: `self` means the creator tells them, `platform` means Subscriby emails them at the per-email fee), and whether a standby installation is kept for the project (`standby_installation_registered`). |
| `update_recovery_settings` | additive | `project-recovery:update` | Changes one project's Disaster Recovery settings; fields left out keep their value. |
| `get_recovery_allowances` | read | `project-recovery:view-any` | Reads how many self-service Disaster Recoveries of each kind (`account`, `bot`, `resources`) the creator this token acts for may still run inside the rolling window, how many uses support has released on top (`grant_remaining`), whether a recovery of that kind would be allowed right now (`allowed`), whether the next one would spend a support grant (`uses_grant`), when the kind was last recovered and when the self-service allowance returns. |
| `get_recovery_roll_call` | read | `project-recovery:view` | Reads where the re-admission after one Disaster Recovery operation stands: how many members the swap set out to re-admit (`total`), how many hold a fresh link into the new space (`regranted`), how many could not be given one (`failed`), how many the installation could not message (`unreachable`) and were told by email instead (`emailed`), how many have joined through their new link (`joined`), who is still outside (`pending`), how many reminders went out (`nudged`), whether the queue has handled everyone (`settled`), and whether the creator may remind the stragglers right now (`can_nudge`, with `nudge_available_at` while the cooldown runs). |
| `list_recovery_incidents` | read | `project-recovery:view-any` | What is wrong right now with a connector, a bot or app, or a place it gates, as the health probes found it. |
| `get_recovery_incident` | read | `project-recovery:view-any` | Fetches one Disaster Recovery incident by UUID: what the probes found, the installation or resource it concerns, when it was detected and whether it has closed. |
| `list_recovery_operations` | read | `project-recovery:view-any` | Lists the Disaster Recovery operations of the creator this token acts for: every recovery ever run, by the creator, by the platform (`automatic`) or on demand, with its kind (`account`, `bot`, `resources`), its state (`started`, `completed`, `failed`, `reverted`), the connector and project, when it started and finished, the failure reason when it failed, and its undo state: `revertible` for whether it can still be undone right now and `revert_window_ends_at` for when that closes. |
| `get_recovery_operation` | read | `project-recovery:view` | Fetches one Disaster Recovery operation by UUID: its kind, status, what it moved or replaced, the readmission tallies and when it ran. |
| `revert_recovery_operation` | destructive | `project-recovery:update` | Undoes a completed Disaster Recovery inside its window (24 hours from completion by default). |
| `notify_members_of_recovery` | destructive | `project-recovery:update` | Emails every member the project can reach by email that its bot changed after a bot replacement, with the new bot's link and the portal, at the per-email fee added to the creator's transaction fees. |
| `get_resource_standby` | read | `project-recovery:view` | Reads the standby kept for one resource: whether it is healthy (`health_status`, with the connector's reason code when degraded), whether every post is mirrored into it (`mirror_enabled`), when it was last probed and last written to, and when it was linked. |
| `request_resource_standby` | additive | `project-recovery:create` | Asks the creator, through the connector, to pick the chat that becomes the standby for one resource: the bot messages them with a picker, and the standby is linked the moment they choose. |
| `withdraw_resource_standby_request` | additive | `project-recovery:delete` | Takes back the standby request the creator has open on the connector, so the picker the bot sent stops waiting for an answer. |
| `remove_resource_standby` | destructive | `project-recovery:delete` | Stops keeping a standby for one resource: the standby row is forgotten and mirroring into it stops. |
| `set_resource_standby_mirror` | additive | `project-recovery:update` | Switches the live mirror into one resource's standby on or off: when on, every post made in the channel is copied into the standby as it is made, so a failover lands members in a channel that already holds the content. |
| `use_resource_standby` | destructive | `project-recovery:create` | Swaps one resource onto its standby right now, in one click: the resource points at the standby chat, the old invite links are revoked, every active member is re-admitted into the standby, and the standby is consumed. |
| `remove_standby_installation` | destructive | `project-recovery:delete` | Stops keeping the standby installation (the spare bot) registered for one project and withdraws it from the connector, so the next bot replacement will need a fresh credential pasted on the dashboard. |
| `request_resource_replacement` | additive | `project-recovery:create` | Asks the creator, through the connector, to pick the chat that replaces one resource's: the bot messages them with a picker, and the swap runs the moment they choose — old links revoked, every active member re-admitted, a recovery operation recorded. |
| `withdraw_resource_replacement_request` | additive | `project-recovery:delete` | Takes back the replacement request the creator has open on the connector, so the picker the bot sent stops waiting for an answer. |
| `restore_connector_access` | additive | `project-connector:update` | Brings a project's detached places on a reinstalled connector back: asks the connector about every resource the uninstall detached, reactivates the ones it still controls, and hands every live purchase of a plan granting them fresh access (`member.resource_added` per grant issued). |

## `get_recovery_readiness`

Read · requires `project-recovery:view-any`

Reads the Disaster Recovery readiness checklist for the creator this token acts for: every line (the account lines first: a second factor and a backup sign-in account; then each installed connector's own lines, named by `connector`, such as a standby installation, a standby for every gated space, automatic failover and a live mirror; then the reminders: a copy of the content kept elsewhere and a second human administrator) with `done` true, false, or null when the platform can only remind, `locked` when the plan lacks the prevention feature, the state in words (`detail`) and where the fix lives (`url`), plus the totals the dashboard card shows (`completed` of `total`, `complete`, and `prevention` for whether the plan bundles the prevention features). Answers "how ready is this account for the next ban?". Takes no input.

**Arguments**

- none

## `get_recovery_settings`

Read · requires `project-recovery:view`

Reads one project's Disaster Recovery settings: whether automatic failover is switched on (`auto_failover_enabled`) and when the per-email fee it may charge was accepted, how members are told after a channel swap the creator ran (`email_delivery`: `self` means the creator tells them, `platform` means Subscriby emails them at the per-email fee), and whether a standby installation is kept for the project (`standby_installation_registered`). An unknown or out-of-scope `project_id` surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose recovery settings to read.

## `update_recovery_settings`

Additive · requires `project-recovery:update` · idempotent

Changes one project's Disaster Recovery settings; fields left out keep their value. `auto_failover` switches automatic failover on or off — switching it on needs `accepts_email_fee: true` in the same call, because a failover may email the members the bot cannot reach at a per-email fee the creator must agree to, and the Growth Plan. `email_delivery` says how members are told after a channel swap the creator ran: `self` (the creator tells them) or `platform` (Subscriby emails them at the per-email fee). Only the project owner may change these; a refusal is `VALIDATION_FAILED` with the reason. Returns the settings as they now stand.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `auto_failover` (boolean): Switch automatic failover on (true) or off (false). Omit to leave it.
- `accepts_email_fee` (boolean): Required true when switching failover on: the creator accepts the per-email fee a failover may charge.
- `email_delivery` (one of `platform`, `self`): How members are told after a swap the creator ran: `self` or `platform`. Omit to leave it.

## `get_recovery_allowances`

Read · requires `project-recovery:view-any`

Reads how many self-service Disaster Recoveries of each kind (`account`, `bot`, `resources`) the creator this token acts for may still run inside the rolling window, how many uses support has released on top (`grant_remaining`), whether a recovery of that kind would be allowed right now (`allowed`), whether the next one would spend a support grant (`uses_grant`), when the kind was last recovered and when the self-service allowance returns. `meta` carries `window_days` and `self_service_uses`. Answers "can I still run a recovery, or do I need support?". Takes no input.

**Arguments**

- none

## `get_recovery_roll_call`

Read · requires `project-recovery:view`

Reads where the re-admission after one Disaster Recovery operation stands: how many members the swap set out to re-admit (`total`), how many hold a fresh link into the new space (`regranted`), how many could not be given one (`failed`), how many the installation could not message (`unreachable`) and were told by email instead (`emailed`), how many have joined through their new link (`joined`), who is still outside (`pending`), how many reminders went out (`nudged`), whether the queue has handled everyone (`settled`), and whether the creator may remind the stragglers right now (`can_nudge`, with `nudge_available_at` while the cooldown runs). A recovery of a kind that re-admits nobody answers all zeros. An unknown or another creator's `operation_id` surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `operation_id` (string, required): UUID of the recovery operation, from `list_recovery_operations`.

## `list_recovery_incidents`

Read · requires `project-recovery:view-any`

What is wrong right now with a connector, a bot or app, or a place it gates, as the health probes found it. Lists the Disaster Recovery incidents of the creator this token acts for: every problem the health probes detected with the creator's sign-in account (`kind` account), a project's installation (`bot`) or a space it sells (`resources`), with the connector, the project and resource it names, the reason as the connector's code and in words (`reason_label`, `reason_explanation`), when it was detected and, once healed or fixed, when and by which operation it was resolved. `status` is `open` by default (what still needs attention), `resolved`, or `all`; pages newest first with `limit` (1..100, default 25) and `page`. Answers "is anything of mine banned or broken right now?".

**Arguments**

- `status` (one of `open`, `resolved`, `all`): Which incidents: `open` (default: still needing attention), `resolved`, or `all`.
- `limit` (integer): Incidents per page (1..100, default 25).
- `page` (integer): 1-indexed page number.

## `get_recovery_incident`

Read · requires `project-recovery:view-any`

Fetches one Disaster Recovery incident by UUID: what the probes found, the installation or resource it concerns, when it was detected and whether it has closed. Same row shape as `list_recovery_incidents`. Unknown ids and another creator's incidents surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `incident_id` (string, required): UUID of the incident to fetch, from `list_recovery_incidents`.

## `list_recovery_operations`

Read · requires `project-recovery:view-any`

Lists the Disaster Recovery operations of the creator this token acts for: every recovery ever run, by the creator, by the platform (`automatic`) or on demand, with its kind (`account`, `bot`, `resources`), its state (`started`, `completed`, `failed`, `reverted`), the connector and project, when it started and finished, the failure reason when it failed, and its undo state: `revertible` for whether it can still be undone right now and `revert_window_ends_at` for when that closes. Optional `kind` and `status` narrow the list; pages newest first with `limit` (1..100, default 25) and `page`. Answers "what has recovery done for me, and can I still undo it?".

**Arguments**

- `kind` (one of `account`, `bot`, `resources`): Only recoveries of this kind: `account`, `bot` or `resources`. Omit for every kind.
- `status` (one of `started`, `completed`, `failed`, `reverted`): Only operations in this state: `started`, `completed`, `failed` or `reverted`. Omit for every state.
- `limit` (integer): Operations per page (1..100, default 25).
- `page` (integer): 1-indexed page number.

## `get_recovery_operation`

Read · requires `project-recovery:view`

Fetches one Disaster Recovery operation by UUID: its kind, status, what it moved or replaced, the readmission tallies and when it ran. Same row shape as `list_recovery_operations`. Read it before `revert_recovery_operation` or `nudge_pending_readmissions` to see the current state rather than assuming it; `get_recovery_roll_call` lists the members it readmitted. Unknown ids and another creator's operations surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `operation_id` (string, required): UUID of the operation to fetch, from `list_recovery_operations`.

## `revert_recovery_operation`

Destructive · requires `project-recovery:update`

Undoes a completed Disaster Recovery inside its window (24 hours from completion by default). A channel recovery is undone one swap at a time: name the `resource_id` to put back on its old chat, and every active member is re-admitted there again. An account relink is undone whole, moving sign-in back to the previous account, signing the creator out everywhere and opening a disputed-relink incident for support; name no `resource_id`. A bot replacement cannot be undone. Only the creator who ran the recovery may undo it; a closed window, a swap already put back or a teammate is `VALIDATION_FAILED` with the reason. Returns the operation with its undo state updated; a channel revert also returns a `job_id`, because the members are re-admitted in the background: follow it with `get_job_status`, or in the Copilot the step counts them as they go.

**Arguments**

- `operation_id` (string, required): UUID of the completed recovery to undo, from `list_recovery_operations`.
- `resource_id` (string): For a channel recovery: UUID of the resource to put back on its old chat. Omit for an account relink.

## `notify_members_of_recovery`

Destructive · requires `project-recovery:update`

Emails every member the project can reach by email that its bot changed after a bot replacement, with the new bot's link and the portal, at the per-email fee added to the creator's transaction fees. Sent once per recovery: a second call answers with the count already sent and sends nothing. Use it after a bot replacement when members must be told; it spends money and reaches real people, so confirm with the creator first. A recovery that belongs to no project, or a teammate, is `VALIDATION_FAILED`. Returns how many members were `notified`, now or earlier.

**Arguments**

- `operation_id` (string, required): UUID of the bot recovery whose project members to email.

## `get_resource_standby`

Read · requires `project-recovery:view`

Reads the standby kept for one resource: whether it is healthy (`health_status`, with the connector's reason code when degraded), whether every post is mirrored into it (`mirror_enabled`), when it was last probed and last written to, and when it was linked. A resource that keeps no standby, like an unknown or out-of-scope `resource_id`, surfaces as `RESOURCE_NOT_FOUND`.

**Arguments**

- `resource_id` (string, required): UUID of the resource whose standby to read.

## `request_resource_standby`

Additive · requires `project-recovery:create`

Asks the creator, through the connector, to pick the chat that becomes the standby for one resource: the bot messages them with a picker, and the standby is linked the moment they choose. Nothing is linked by this call itself. Needs the Growth Plan and the project owner; a resource that is a perk rather than a place, or a creator the bot cannot reach, is `VALIDATION_FAILED` with the reason. Withdraw an unanswered request with `withdraw_resource_standby_request`.

**Arguments**

- `resource_id` (string, required): UUID of the resource that should get a standby.

## `withdraw_resource_standby_request`

Additive · requires `project-recovery:delete` · idempotent

Takes back the standby request the creator has open on the connector, so the picker the bot sent stops waiting for an answer. A creator holds one such request at a time, so there is nothing to name; when none is open the call changes nothing and still succeeds. Only the account holder may do this. Takes no input.

**Arguments**

- none

## `remove_resource_standby`

Destructive · requires `project-recovery:delete`

Stops keeping a standby for one resource: the standby row is forgotten and mirroring into it stops. The chat itself is untouched on the connector, and the resource keeps pointing at its live chat. Automatic failover can no longer swap this resource until a new standby is linked. Only the project owner may do this; a refusal is `VALIDATION_FAILED`. A resource with no standby succeeds with nothing to remove.

**Arguments**

- `resource_id` (string, required): UUID of the resource whose standby to remove.

## `set_resource_standby_mirror`

Additive · requires `project-recovery:update` · idempotent

Switches the live mirror into one resource's standby on or off: when on, every post made in the channel is copied into the standby as it is made, so a failover lands members in a channel that already holds the content. Only a channel can be mirrored (a group cannot), the resource must keep a standby, switching on needs the Growth Plan, and only the project owner may do it; a refusal is `VALIDATION_FAILED` with the reason. Returns the standby as it now stands.

**Arguments**

- `resource_id` (string, required): UUID of the resource whose standby to mirror into.
- `mirror` (boolean, required): True to copy every post into the standby as it is made, false to stop.

## `use_resource_standby`

Destructive · requires `project-recovery:create`

Swaps one resource onto its standby right now, in one click: the resource points at the standby chat, the old invite links are revoked, every active member is re-admitted into the standby, and the standby is consumed. A recovery operation records it; when the resource is healthy and has no open incident the swap is on demand and spends no allowance, otherwise it spends (or joins) the channel recovery allowance. Undo is offered for 24 hours through `revert_recovery_operation`. Only the project owner may do this; no healthy standby, a spent quota or a teammate is `VALIDATION_FAILED`.

**Arguments**

- `resource_id` (string, required): UUID of the resource to swap onto its standby.

## `remove_standby_installation`

Destructive · requires `project-recovery:delete`

Stops keeping the standby installation (the spare bot) registered for one project and withdraws it from the connector, so the next bot replacement will need a fresh credential pasted on the dashboard. Nothing else changes: the live installation, members and access stay as they are. Only the project owner may do this; a refusal is `VALIDATION_FAILED`. Registering a standby is not offered to tokens, because it takes a credential.

**Arguments**

- `project_id` (string, required): UUID of the project whose standby installation to remove.

## `request_resource_replacement`

Additive · requires `project-recovery:create`

Asks the creator, through the connector, to pick the chat that replaces one resource's: the bot messages them with a picker, and the swap runs the moment they choose — old links revoked, every active member re-admitted, a recovery operation recorded. Nothing is swapped by this call itself. For a degraded resource the swap will spend the channel recovery allowance (or join the recovery already absorbing swaps); for a healthy one it is on demand and free. A resource that is a perk rather than a place, a creator the bot cannot reach, or a spent quota with no recovery to join is `VALIDATION_FAILED` with the reason. Withdraw an unanswered request with `withdraw_resource_replacement_request`.

**Arguments**

- `resource_id` (string, required): UUID of the resource whose chat should be replaced.

## `withdraw_resource_replacement_request`

Additive · requires `project-recovery:delete` · idempotent

Takes back the replacement request the creator has open on the connector, so the picker the bot sent stops waiting for an answer. A creator holds one such request at a time, so there is nothing to name; when none is open the call changes nothing and still succeeds. Only the account holder may do this. Takes no input.

**Arguments**

- none

## `restore_connector_access`

Additive · requires `project-connector:update` · idempotent

Brings a project's detached places on a reinstalled connector back: asks the connector about every resource the uninstall detached, reactivates the ones it still controls, and hands every live purchase of a plan granting them fresh access (`member.resource_added` per grant issued). Places the connector no longer controls stay detached for `run_connector_doctor` to explain; plans taken off sale stay off sale. Refused with `CONNECTOR_NOT_CONNECTED` until the installation is connected again. Runs the same action as `POST /v1/projects/{project}/connectors/{key}/installation/restore-access`.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.

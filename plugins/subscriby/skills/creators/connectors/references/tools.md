# Tools: Connectors

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_connectors` | read | `project-connector:view-any` | Lists the Connectors Marketplace: every connector Subscriby knows, lane by lane. |
| `get_connector` | read | `project-connector:view-any` | Reads one Connectors Marketplace card by its `connector` key (such as the value `list_connectors` returned): the lane (`status`), `installable`, `official`, the badges, the category, tagline, overview and links, and for a connector that exists as a package the whole manifest with its `resource_kinds`, `capabilities`, `messaging` limits, `pacing`, `management_commands` and `missing_commands`, `recovery` facets and the declarative `install_fields` and `settings_fields`. |
| `list_connector_installations` | read | `project-connector:view-any` | The health of the connectors on a project: the connection state of each bot or app and whether it can act right now. |
| `get_connector_installation` | read | `project-connector:view` | The health and connection state of one connector on a project: the bot or app, its state and whether it can act right now. |
| `install_connector` | additive | `project-connector:create` | Installs a connector on a project: opens a pending installation with no credentials yet, so the project is marked as running the connector and the creator connects it from the dashboard (connecting needs a credential typed by a person, so no tool does it). |
| `verify_connector_installation` | additive | `project-connector:update` | A fresh health probe of the connection a connector holds on a project. |
| `update_connector_installation_settings` | additive | `project-connector:update` | Changes a project's connector installation settings and capability switches. |
| `run_connector_doctor` | additive | `project-connector:update` | The health check for a connector on a project: what is wrong with the connection and with each place it gates, with the fix for each. |
| `list_connector_installation_actions` | read | `project-connector:view` | Lists what a project's installation of a connector can do for its creator right now, beyond gating: each action with its `key`, the `label` a button would say, a `description` of what will happen, the `fields` the creator fills in first (the same shape as the connector directory's install fields: `name`, `type`, `label`, `help`, `required`, `rules`, `options`) and the "confirm" question to put to the creator before running, when the action needs one (`needs_confirmation`). |
| `run_connector_installation_action` | destructive | `project-connector:update` | Runs one action a project's installation of a connector offers, on the platform: `action` is a `key` from `list_connector_installation_actions` and `fields` an object keyed by the names that action declares, each answer checked against the field's rules (`VALIDATION_FAILED` names the field). |
| `list_connector_spaces` | read | `project-connector:view` | Lists the places of one kind a project's installation of a connector could gate, as the platform lists them right now: the platform's `external_id`, the `kind`, the `title`, the `parent_external_id` on a platform that nests places, and whatever the connector keeps in `meta`. |
| `create_resource_from_space` | additive | `project-resource:create` | Sells a place picked from the list a connector offers: creates the resource for it and binds it to the place, the way the connector's own link flow does. |
| `get_connector_uninstall_preview` | read | `project-connector:view` | Shows what uninstalling a connector from a project would touch, changing nothing: the connector's `resources` (deactivated as detached, external ids kept), the `live_grants` on them (revoked, members put outside), the `emptied_plans` left with nothing to grant, the `recurring_subscriptions` on those plans the creator may have cancelled at period end and the `one_time_subscriptions` that are never cancelled, `affected_subscription_ids`, the `upcoming_windows` of emptied pass plans, `open_support_threads` on the connector and `member_identities` that lose their reach. |
| `uninstall_connector` | destructive | `project-connector:delete` | Uninstalls a connector from a project. |
| `disconnect_connector` | destructive | `project-connector:delete` | Disconnects a project's installation of one connector: the connector withdraws it on its platform, the credentials are wiped and the installation turns `disconnected`; members keep the access they hold, grants, resources, plans and identities are untouched, and the creator can connect it again from the dashboard. |
| `get_connector_analytics` | read | `dashboard:read` | Returns members, access and revenue per connector for the authenticated creator — one row per connector their projects run or ever granted access on, with the live installations, the members holding a linked account (and how many linked one in the window), the live and pending grants, the grants issued and revoked in the window, the gross revenue in USD with its transaction count and its share of the scope's total. |

## `list_connectors`

Read · requires `project-connector:view-any`

Lists the Connectors Marketplace: every connector Subscriby knows, lane by lane. Each card carries `status` (`available`, `beta`, `paused` during an incident, `in_development` when built but not yet offered, `coming_soon` for a roadmap entry with no package yet), `installable`, `official`, its `badges` (official or community, new, trending), the category, tagline and overview, the publisher's links and, for a connector that exists as a package, the whole manifest: `install_mode`, `scopes`, the `resource_kinds` it gates (with the grant mode and whether early admission can be held), `capabilities`, `messaging` limits, `pacing`, the `management_commands` its in-chat surface renders and the `missing_commands` it does not, `relay_modes`, the `recovery` facets, and the declarative `install_fields` and `settings_fields` a client renders as the connect form. `status` narrows to one lane. Read this before proposing a connector for a project; the same document is the `subscriby://connectors/catalog` resource.

**Arguments**

- `status` (one of `available`, `beta`, `paused`, `in_development`, `coming_soon`): Narrow to one lane: `available`, `beta`, `paused`, `in_development` or `coming_soon`. Omit for every lane.

## `get_connector`

Read · requires `project-connector:view-any`

Reads one Connectors Marketplace card by its `connector` key (such as the value `list_connectors` returned): the lane (`status`), `installable`, `official`, the badges, the category, tagline, overview and links, and for a connector that exists as a package the whole manifest with its `resource_kinds`, `capabilities`, `messaging` limits, `pacing`, `management_commands` and `missing_commands`, `recovery` facets and the declarative `install_fields` and `settings_fields`. A key nobody knows is `RESOURCE_NOT_FOUND`. Use it to answer "what can this connector do?" or "what does connecting it ask the creator for?".

**Arguments**

- `connector` (string, required): The connector key, as `list_connectors` returns it.

## `list_connector_installations`

Read · requires `project-connector:view-any`

The health of the connectors on a project: the connection state of each bot or app and whether it can act right now. Lists every connector installation a project holds, oldest first: the `connector` key, the `scope` (`project`, or `platform` for a shared presence Subscriby runs), the `role` (`live` or `standby`), the `state` (`pending`, `connected`, `degraded`, `revoked`, `disconnected`) with its `state_reason` and `state_detail`, whether the creator can fix it (`creator_actionable`), whether it can act right now (`operational`), the platform's own `external_id`, `display_name`, `handle` and `avatar_url`, and when it was connected, verified, revoked, disconnected or uninstalled. Credentials and settings never appear. Answers "which connectors does this project run, and are they healthy?".

**Arguments**

- `project_id` (string, required): UUID of the project whose installations to list.

## `get_connector_installation`

Read · requires `project-connector:view`

The health and connection state of one connector on a project: the bot or app, its state and whether it can act right now. Reads a project's live installation of one connector by `project_id` and `connector` key: the `state` (`pending`, `connected`, `degraded`, `revoked`, `disconnected`) with its reason and detail, whether the creator can fix it (`creator_actionable`), whether it can act right now (`operational`), the platform's own `external_id`, `display_name`, `handle` and `avatar_url`, and the timestamps of its life. `RESOURCE_NOT_FOUND` with `reason` `unknown_connector` when the key names no connector, `CONNECTOR_NOT_INSTALLED` when the project has no installation of it.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.

## `install_connector`

Additive · requires `project-connector:create`

Installs a connector on a project: opens a pending installation with no credentials yet, so the project is marked as running the connector and the creator connects it from the dashboard (connecting needs a credential typed by a person, so no tool does it). Installing a connector that is already installed changes nothing and returns the existing installation. Refuses `CONNECTOR_UNAVAILABLE` for a connector creators may not install today (read `list_connectors`; only `installable` cards qualify) and `CONNECTOR_TIER_REQUIRED` for a second distinct connector on a project whose owner lacks the `multi_connector` capability (Growth). Raises `connector.installed` when a row is opened. Returns the installation as `get_connector_installation` renders it.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it; only an `installable` card can be installed.

## `verify_connector_installation`

Additive · requires `project-connector:update` · idempotent

A fresh health probe of the connection a connector holds on a project. Asks the connector whether a project's installation still answers and records the verdict on it: `state` becomes `connected`, `degraded` (with `state_reason`, `state_detail` and `creator_actionable`) or `revoked`, and `health_checked_at` is stamped. A `pending` installation has nothing to verify and is returned as it is. Raises `connector.status_changed` only when the state moved. Answers "is this connector still working for the project?" with a fresh probe rather than the hourly one; `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.

## `update_connector_installation_settings`

Additive · requires `project-connector:update` · idempotent

Changes a project's connector installation settings and capability switches. `settings` is an object keyed by the field names the connector declares in its `settings_fields` (read them with `get_connector`); every declared rule runs, a key the connector never declared is `VALIDATION_FAILED`, and fields left out keep their value. `capabilities` is an object keyed by capability (`messaging`, `broadcasts`, `support_relay`, `native_payments`, `recovery_*`) to true or false; a capability the connector does not declare, or one that cannot be switched off (`access_control`, `management_surface`, `portal_login`, `creator_registration`, `early_admission_hold`), is `VALIDATION_FAILED`. At least one of the two is required. Raises `connector.settings_updated` naming the fields and switches that changed (never a value), only when something did.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.
- `settings` (object): The fields to change, keyed by the names the connector declares in `settings_fields`; fields left out keep their value. Optional when `capabilities` is given.
- `capabilities` (object): Capability switches to change, keyed by capability value (`messaging`, `broadcasts`, `support_relay`, `native_payments`, `recovery_*`) to true or false; switches left out keep their value. Optional when `settings` is given.

## `run_connector_doctor`

Additive · requires `project-connector:update` · idempotent

The health check for a connector on a project: what is wrong with the connection and with each place it gates, with the fix for each. Runs the connector doctor on a project's installation of a connector: verifies the installation (recording its state exactly as `verify_connector_installation` does) and asks the connector about every resource it gates, answering one report with a finding per check — the installation first, then each resource — each with a `severity` (`ok`, `warning`, `critical`), the connector's own `state` word and sentence, whether the creator can fix it and where. `healthy` is true when every finding passed. The report is kept on the installation and raises `connector.doctor_completed` only when the findings differ from the previous run's. Answers "is this connector fully working for the project, and if not, where exactly does it hurt?"; `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.

## `list_connector_installation_actions`

Read · requires `project-connector:view`

Lists what a project's installation of a connector can do for its creator right now, beyond gating: each action with its `key`, the `label` a button would say, a `description` of what will happen, the `fields` the creator fills in first (the same shape as the connector directory's install fields: `name`, `type`, `label`, `help`, `required`, `rules`, `options`) and the "confirm" question to put to the creator before running, when the action needs one (`needs_confirmation`). Empty for a connector that offers none, while the connector is paused, and while the installation cannot act. Run one with `run_connector_installation_action`. Answers "what can Subscriby set up on this server for me?"; `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.

## `run_connector_installation_action`

Destructive · requires `project-connector:update`

Runs one action a project's installation of a connector offers, on the platform: `action` is a `key` from `list_connector_installation_actions` and `fields` an object keyed by the names that action declares, each answer checked against the field's rules (`VALIDATION_FAILED` names the field). The answer says what happened in the creator's words: `done` true with a `message` and whatever the connector reports in `details`, or `done` false with the reason and, when the platform refused, the classified `failure`. This changes the platform itself (it may create channels, roles or categories), so when the action lists a "confirm" question, put it to the creator and run only on their yes. `RESOURCE_NOT_FOUND` when the installation offers no action by that key, `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector, `CONNECTOR_NOT_CONNECTED` when it cannot act right now.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.
- `action` (string, required): The action key, as `list_connector_installation_actions` lists it.
- `fields` (object): The creator's answers, keyed by the field names the action declares; omit for an action that asks nothing.

## `list_connector_spaces`

Read · requires `project-connector:view`

Lists the places of one kind a project's installation of a connector could gate, as the platform lists them right now: the platform's `external_id`, the `kind`, the `title`, the `parent_external_id` on a platform that nests places, and whatever the connector keeps in `meta`. Only a connector that lists its places answers (its directory card declares `space_browsing`); `kind` is one of the connector's `resource_kinds`, as a bare word or spelled `connector:kind`. The list is read from the platform on every call, so a place made a moment ago is on it and a deleted one is not. Pass an `external_id` from here to `create_resource_from_space` to sell the place. Answers "which roles or channels could this project sell?"; `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector, `CONNECTOR_NOT_CONNECTED` when it cannot act right now, `VALIDATION_FAILED` when the connector lists no places or the kind is not one it gates.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it; the connector must list its places.
- `kind` (string, required): The kind of place to list: one of the connector's `resource_kinds`, as a bare word (`role`) or spelled `connector:kind` (`discord:role`).

## `create_resource_from_space`

Additive · requires `project-resource:create` · open world

Sells a place picked from the list a connector offers: creates the resource for it and binds it to the place, the way the connector's own link flow does. `kind` is spelled `connector:kind` on a connector whose directory card declares `space_browsing`, and `external_id` is a place `list_connector_spaces` listed for that kind; the installation is asked again and a place it does not list is `RESOURCE_NOT_FOUND`, so a resource is never bound to a place the installation does not administer. A place the project already sells answers its existing resource. `title` must be 5..255 chars. Emits `project.resource.linked`. A connector that cannot list its places, such as one whose link starts on the platform, takes `request_resource_link` instead; a manual perk takes `create_resource`.

**Arguments**

- `project_id` (string, required): UUID of the project the place will belong to.
- `kind` (string, required): The kind of place, spelled `connector:kind`: a connector's key, a colon, and one of the `resource_kinds` that `list_connectors` lists for it.
- `external_id` (string, required): The platform's id for the place, as `list_connector_spaces` lists it under `external_id`.
- `title` (string, required): Resource title (5..255 chars), what members read.
- `description` (string): Optional resource description. Max 1000 chars, HTML is filtered.

## `get_connector_uninstall_preview`

Read · requires `project-connector:view`

Shows what uninstalling a connector from a project would touch, changing nothing: the connector's `resources` (deactivated as detached, external ids kept), the `live_grants` on them (revoked, members put outside), the `emptied_plans` left with nothing to grant, the `recurring_subscriptions` on those plans the creator may have cancelled at period end and the `one_time_subscriptions` that are never cancelled, `affected_subscription_ids`, the `upcoming_windows` of emptied pass plans, `open_support_threads` on the connector and `member_identities` that lose their reach. `options` are the two opt-ins with their defaults. Read this and confirm with the creator before calling `uninstall_connector`. `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.

## `uninstall_connector`

Destructive · requires `project-connector:delete`

Uninstalls a connector from a project. Distinct from disconnecting and never a deletion: every live grant on the connector's resources is revoked (members are put outside, `member.resource_removed` per grant), its resources are deactivated as detached with their external ids kept, the installation row stays with `uninstalled_at`, identities are never removed, and no money moves by itself. Two opt-ins, both on by default, act on the plans left with nothing to grant: "unpublish_emptied_plans" takes them off sale, "cancel_recurring_subscriptions" cancels their live recurring subscriptions at the end of the paid period and emails each member. One-time and lifetime purchases are never cancelled. Raises `connector.uninstalled` with the counts. Always read `get_connector_uninstall_preview` and confirm with the creator first. `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.
- `unpublish_emptied_plans` (boolean): Take the plans left with nothing to grant off sale. Default true.
- `cancel_recurring_subscriptions` (boolean): Cancel the live recurring subscriptions on those plans at the end of their paid period and email each member. Default true. One-time purchases are never cancelled.

## `disconnect_connector`

Destructive · requires `project-connector:delete`

Disconnects a project's installation of one connector: the connector withdraws it on its platform, the credentials are wiped and the installation turns `disconnected`; members keep the access they hold, grants, resources, plans and identities are untouched, and the creator can connect it again from the dashboard. Raises `connector.disconnected`. An installation already disconnected is left alone. `CONNECTOR_NOT_INSTALLED` when the project has no installation of the connector.

**Arguments**

- `project_id` (string, required): UUID of the project.
- `connector` (string, required): The connector key, as `list_connectors` returns it.

## `get_connector_analytics`

Read · requires `dashboard:read`

Returns members, access and revenue per connector for the authenticated creator — one row per connector their projects run or ever granted access on, with the live installations, the members holding a linked account (and how many linked one in the window), the live and pending grants, the grants issued and revoked in the window, the gross revenue in USD with its transaction count and its share of the scope's total. A purchase that grants access on two connectors counts toward both (`attribution` says so). Accepts an optional `project_id`, a `period` preset (`7d`, `14d`, `30d`, `60d`, `90d`, `mtd`, `qtd`, `ytd`, `1y`, `all`) or explicit `from`/`to` ISO dates. Answers "which connector earns, and which one do members actually use?".

**Arguments**

- `project_id` (string): Optional project UUID to scope the figures. Leave blank for all projects in the current team.
- `period` (string): Period preset — 7d, 14d, 30d, 60d, 90d, mtd, qtd, ytd, 1y, all. Defaults to 30d.
- `from` (string): Explicit start date (ISO YYYY-MM-DD). Overrides period when paired with "to".
- `to` (string): Explicit end date (ISO YYYY-MM-DD). Overrides period when paired with "from".

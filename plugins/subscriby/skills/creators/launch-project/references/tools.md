# Tools: Launch Project

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `create_project` | additive | `project:create` | Creates a project owned by the authenticated creator's current team. |
| `get_project` | read | `project:view` | Fetches a single project by UUID, including counts of `plans`, `resources`, `subscribers`, and `payment_methods`. |
| `update_project` | destructive | `project:update` | Applies a partial update to an existing project — only fields you pass are touched, omitted fields keep their current value. |
| `list_projects` | read | `project:view-any` | Lists every project the token's frozen team can access, ordered by `created_at` descending. |
| `archive_project` | destructive | `project:update` | Archives a project — flips `active` to false so checkout, portal, and bot flows stop accepting new subscribers. |
| `restore_project` | destructive | `project:update` | Restores an archived project — flips `active` back to true so checkout, portal and bot flows accept new subscribers again. |
| `delete_project` | destructive | `project:delete` | Permanently deletes a project by UUID. |
| `list_connectors` | read | `project-connector:view-any` | Lists the Connectors Marketplace: every connector Subscriby knows, lane by lane. |
| `get_connector` | read | `project-connector:view-any` | Reads one Connectors Marketplace card by its `connector` key (such as the value `list_connectors` returned): the lane (`status`), `installable`, `official`, the badges, the category, tagline, overview and links, and for a connector that exists as a package the whole manifest with its `resource_kinds`, `capabilities`, `messaging` limits, `pacing`, `management_commands` and `missing_commands`, `recovery` facets and the declarative `install_fields` and `settings_fields`. |
| `install_connector` | additive | `project-connector:create` | Installs a connector on a project: opens a pending installation with no credentials yet, so the project is marked as running the connector and the creator connects it from the dashboard (connecting needs a credential typed by a person, so no tool does it). |
| `verify_connector_installation` | additive | `project-connector:update` | A fresh health probe of the connection a connector holds on a project. |
| `list_connector_spaces` | read | `project-connector:view` | Lists the places of one kind a project's installation of a connector could gate, as the platform lists them right now: the platform's `external_id`, the `kind`, the `title`, the `parent_external_id` on a platform that nests places, and whatever the connector keeps in `meta`. |
| `create_resource_from_space` | additive | `project-resource:create` | Sells a place picked from the list a connector offers: creates the resource for it and binds it to the place, the way the connector's own link flow does. |
| `request_resource_link` | additive | `project-resource:create` | Asks the creator, through the connector, to pick the place a new resource of a project will be: a kind of place the connector gates, spelled `connector:kind` as `list_connectors` lists each connector's `resource_kinds`. |
| `create_resource` | additive | `project-resource:create` | Creates a manual project resource (PDF link, token, URL placeholder, anything that is not a place a connector gates); its `kind` is `manual` and its `connector` and `space` are null. |
| `list_resources` | read | `project-resource:view-any` | Lists resources attached to one project (the places a connector gates, plus manual perks) ordered by `created_at` descending. |
| `get_resource` | read | `project-resource:view` | Fetches a single project resource (a channel, group or server a connector gates, or a manual entry) by UUID. |
| `update_resource` | destructive | `project-resource:update` | Retitles, describes or switches a project resource; anything you omit keeps its stored value. |
| `activate_resource` | destructive | `project-resource:update` | Switches a project resource on so the plans that link it grant it again. |
| `deactivate_resource` | destructive | `project-resource:update` | Switches a project resource off without touching the plans that sell it; switch it back on with `activate_resource`. |
| `unlink_resource` | destructive | `project-resource:update` | Clears the connector place (`space`) from a resource, reverting it to an unlinked placeholder the creator can relink later through the connector with `request_resource_link`. |
| `delete_resource` | destructive | `project-resource:delete` | Hard-deletes a project resource by UUID — the row is removed from the database with no soft-delete fallback. |
| `list_payment_methods` | read | `project-payment-method:view-any` | Lists configured payment methods for one project. |
| `activate_payment_method` | destructive | `project-payment-method:update` | Offers a configured payment method to buyers again and re-queues the plan sync for its gateway. |
| `create_plan` | additive | `project-subscription-plan:create` | Creates a subscription plan on a project. |
| `publish_plan` | destructive | `project-subscription-plan:update` | Flips a plan's `active` flag. |
| `get_portal_design` | read | `project:view` | Reads a project's portal design: `published`, the document members see, and `draft`, the one being edited or null, each with every key of the fourteen sections (colours, typography, shape, layout, wording, blocks, button and footer, announcement bar, media, sections, behaviour, visibility and code, language) in the stored shape `update_portal_design` takes back, plus `has_draft`, `draft_updated_at`, `published_at` and a preview_url that shows the draft for ten minutes, null until the project has a handle. |
| `publish_portal_design` | destructive | `project:update` | Makes a project's drafted portal design the one members see; the portal, the embed and the social card paint with it on their next render, and `project.design_published` is emitted naming the sections that changed. |
| `get_portal_url` | read | `distribution:read` | Builds the subscriber-portal URL for a project: `{frontend_url}/{handle}`. |
| `get_deep_link` | read | `distribution:read` | Builds a shareable deep link into a project's bot on its connector, carrying a `start` payload. |
| `get_recovery_readiness` | read | `project-recovery:view-any` | Reads the Disaster Recovery readiness checklist for the creator this token acts for: every line (the account lines first: a second factor and a backup sign-in account; then each installed connector's own lines, named by `connector`, such as a standby installation, a standby for every gated space, automatic failover and a live mirror; then the reminders: a copy of the content kept elsewhere and a second human administrator) with `done` true, false, or null when the platform can only remind, `locked` when the plan lacks the prevention feature, the state in words (`detail`) and where the fix lives (`url`), plus the totals the dashboard card shows (`completed` of `total`, `complete`, and `prevention` for whether the plan bundles the prevention features). |
| `list_webhook_endpoints` | read | `webhook-endpoint:view-any` | Lists outbound webhook endpoints registered for the token's team. |

## `create_project`

Additive · requires `project:create` · open world

Creates a project owned by the authenticated creator's current team. Enforces creator-tier project limits — exhausted tiers return `TEAM_TIER_REQUIRED`. A project has no platform of its own: install connectors on it afterwards with `install_connector`. `handle` (URL-friendly slug used to build the subscriber portal URL) may be chosen on every tier and is generated when omitted; it can be changed later, and every former handle keeps redirecting to the current one. Emits `project.created`.

**Arguments**

- `name` (string, required): Project name (min 5, max 255 characters).
- `description` (string): Optional description. Max 1000 chars, HTML is filtered.
- `handle` (string): Optional URL-friendly handle, on every tier. Alpha-dash lowercase, 5-255 chars, unique across every project's current and former handles; omitted, a random one is assigned.
- `terms` (string): Optional URL to the terms page. Max 255 chars.
- `privacy` (string): Optional URL to the privacy page. Max 255 chars.
- `active` (boolean): Defaults to true. Set false to create in draft state.
- `hide_branding` (boolean): Take the "Powered by Subscriby" mark off the portal page, its social card and the bot. Defaults to false on every plan; true needs a Starter or Growth tier (TEAM_TIER_REQUIRED otherwise).
- `team_id` (string): Optional UUID of the owning team. Defaults to the token's scoped team.

## `get_project`

Read · requires `project:view`

Fetches a single project by UUID, including counts of `plans`, `resources`, `subscribers`, and `payment_methods`. TenantScope enforces that the project belongs to the caller's team — unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND` (no existence leaks). Pair with `list_projects` to discover the right id first.

**Arguments**

- `project_id` (string, required): UUID of the project to fetch.

## `update_project`

Destructive · requires `project:update` · idempotent · open world

Applies a partial update to an existing project — only fields you pass are touched, omitted fields keep their current value. Updating `handle` moves the portal URL (see `get_portal_url`); every address the project answered on before keeps redirecting to the current one, and a blank handle switches the portal page off. Idempotent — re-calling with the same payload converges to the same state. Emits `project.updated` with a `changes` map.

**Arguments**

- `project_id` (string, required): UUID of the project to update.
- `name` (string): New project name (min 5, max 255 chars).
- `description` (string): New description. Max 1000 chars, HTML is filtered.
- `handle` (string): New URL-friendly handle, on every tier. Alpha-dash lowercase, 5-255 chars, unique across every project's current and former handles; the old address keeps redirecting.
- `terms` (string): URL to the terms page. Max 255 chars.
- `privacy` (string): URL to the privacy page. Max 255 chars.
- `storefront_arrangement` (one of `manual`, `live`): How the portal, the embed and the bot order the plans on offer: "manual" is the order pinned through `reorder_plans` with passes, seasons and then subscriptions behind it; "live" puts the passes and seasons whose access is on now first, the one ending soonest at the top, then those opening soonest, then the pinned order. "live" needs the project owner's time-limited passes capability (Growth, or the Passes Addon) and is refused with `TEAM_TIER_REQUIRED` without it; "manual" is always accepted.
- `active` (boolean): Flip to false to archive, true to restore.
- `outage_compensations` (boolean): Whether members whose paid access overlapped a connector outage of an hour or more have it extended by the outage length when the connector answers again. Defaults to true on every project.
- `hide_branding` (boolean): Take the "Powered by Subscriby" mark off the portal page, its social card and the bot (true) or put it back (false). Off by default on every plan; true needs a Starter or Growth tier (TEAM_TIER_REQUIRED otherwise), and a project whose owner lost the tier keeps the switch and shows the mark until the plan returns.
- `team_id` (string): UUID of the owning team.

## `list_projects`

Read · requires `project:view-any`

Lists every project the token's frozen team can access, ordered by `created_at` descending. Paginates with `limit` (1..100, default 25) and `page` (default 1). The starting point for most flows — use to discover project ids before calling any other tool that takes a `project_id`.

**Arguments**

- `limit` (integer): Maximum projects to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `archive_project`

Destructive · requires `project:update` · idempotent · open world

Archives a project — flips `active` to false so checkout, portal, and bot flows stop accepting new subscribers. Existing subscriptions and payments are untouched. DESTRUCTIVE: you MUST confirm the target `project_id` with a human before calling. Idempotent — re-calling on an already-archived project is a no-op. Emits `project.archived` to every subscribed webhook endpoint.

**Arguments**

- `project_id` (string, required): UUID of the project to archive.

## `restore_project`

Destructive · requires `project:update` · idempotent · open world

Restores an archived project — flips `active` back to true so checkout, portal and bot flows accept new subscribers again. Requires `project_id`. The reverse of `archive_project`; it cannot bring back a project removed with `delete_project`, which is permanent. Idempotent — re-calling on a project that is already active is a no-op and emits nothing. Emits `project.restored` to every subscribed webhook endpoint when the flag actually changes. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the archived project to restore.

## `delete_project`

Destructive · requires `project:delete` · idempotent · open world

Permanently deletes a project by UUID. There is no soft-delete and no undo: the row is removed, and its plans, subscribers, subscriptions, resources, coupons, payment methods and support threads go with it through database cascades. Requires `project_id`. DESTRUCTIVE: you MUST confirm the target `project_id` with a human before calling. To stop sales while keeping the history, call `archive_project` instead. Emits `project.deleted` BEFORE the row disappears so webhook listeners receive the final snapshot. Idempotent — re-calling on an already-deleted id returns `RESOURCE_NOT_FOUND`, exactly as an unknown or out-of-scope id does.

**Arguments**

- `project_id` (string, required): UUID of the project to delete permanently.

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

## `request_resource_link`

Additive · requires `project-resource:create`

Asks the creator, through the connector, to pick the place a new resource of a project will be: a kind of place the connector gates, spelled `connector:kind` as `list_connectors` lists each connector's `resource_kinds`. The connector messages them with a picker and the resource appears the moment they choose; nothing is created by this call itself. A project running no connected connector is `CONNECTOR_NOT_INSTALLED`; a creator with no account linked on the connector is `IDENTITY_NOT_LINKED`; a kind no connected connector gates, or a linked account nothing can message right now, is `VALIDATION_FAILED` with the reason. A manual perk is created with `create_resource` instead.

**Arguments**

- `project_id` (string, required): UUID of the project the linked place will belong to.
- `kind` (string, required): The kind of place to ask for, spelled `connector:kind`: a connector's key, a colon, and one of the `resource_kinds` that `list_connectors` lists for it.

## `create_resource`

Additive · requires `project-resource:create` · open world

Creates a manual project resource (PDF link, token, URL placeholder, anything that is not a place a connector gates); its `kind` is `manual` and its `connector` and `space` are null. HARD RULE: gated places (a connector's channels, groups or servers) CANNOT be created here — they are linked through the connector with `request_resource_link`, which asks the creator to pick the place inside the platform client so the connector first proves it administers it before the row persists. `title` must be 5..255 chars. Defaults: `active=true`. Emits `project.resource.created`.

**Arguments**

- `project_id` (string, required): UUID of the parent project.
- `title` (string, required): Resource title (5..255 chars).
- `description` (string): Optional resource description. Max 1000 chars, HTML is filtered.
- `active` (boolean): Defaults to true. Set false to create in inactive state.

## `list_resources`

Read · requires `project-resource:view-any`

Lists resources attached to one project (the places a connector gates, plus manual perks) ordered by `created_at` descending. Paginates with `limit` (1..100, default 25) and `page`; narrows with `kind` (`manual`, or a connector's kind spelled `connector:kind` as `list_connectors` lists each connector's `resource_kinds`) and `connector` (a connector key). Each row carries `kind`, `connector` (null for a manual perk) and `space` (`{id, external_id, title}` when linked, `null` for a perk or an unlinked placeholder). Use to discover resource ids before calling `get_resource`, `unlink_resource`, or `delete_resource`.

**Arguments**

- `project_id` (string, required): UUID of the parent project.
- `limit` (integer): Maximum resources to return per page (1..100).
- `page` (integer): 1-indexed page number.
- `kind` (string): Only resources of one kind: `manual`, or a connector's kind spelled `connector:kind` as `list_connectors` lists each connector's `resource_kinds`.
- `connector` (string): Only the resources one connector gates, by the key `list_connectors` lists it under.

## `get_resource`

Read · requires `project-resource:view`

Fetches a single project resource (a channel, group or server a connector gates, or a manual entry) by UUID. TenantScope enforces that the parent project belongs to the caller's team — unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND`. Pair with `list_resources` to discover the right id first.

**Arguments**

- `resource_id` (string, required): UUID of the project resource to fetch.

## `update_resource`

Destructive · requires `project-resource:update` · idempotent · open world

Retitles, describes or switches a project resource; anything you omit keeps its stored value. Requires `resource_id`. Optional: `title` (5..255 chars), `description` (up to 1000 chars of well-formed HTML, or null to clear) and `active`. The resource `type` and its connector place (`chat_id`) are fixed and silently ignored here — a place is linked through the connector with `request_resource_link` and unlinked with `unlink_resource`. Emits `project.resource.updated` with the changed fields. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `resource_id` (string, required): UUID of the resource to change.
- `title` (string): New title, 5 to 255 characters.
- `description` (string): New description, up to 1000 characters of well-formed HTML. Pass null or an empty string to clear it.
- `active` (boolean): true offers the resource on the plans that link it, false switches it off without touching those plans.

## `activate_resource`

Destructive · requires `project-resource:update` · idempotent

Switches a project resource on so the plans that link it grant it again. Requires `resource_id`. Idempotent — re-calling on a resource that is already on is a no-op and emits nothing. Emits `project.resource.updated` when the switch flips. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `resource_id` (string, required): UUID of the resource to switch on.

## `deactivate_resource`

Destructive · requires `project-resource:update` · idempotent

Switches a project resource off without touching the plans that sell it; switch it back on with `activate_resource`. Requires `resource_id`. Idempotent — re-calling on a resource that is already off is a no-op and emits nothing. Emits `project.resource.updated` when the switch flips. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `resource_id` (string, required): UUID of the resource to switch off.

## `unlink_resource`

Destructive · requires `project-resource:update` · idempotent · open world

Clears the connector place (`space`) from a resource, reverting it to an unlinked placeholder the creator can relink later through the connector with `request_resource_link`. DESTRUCTIVE: you MUST confirm the target `resource_id` with a human before calling — every plan that links this resource stops granting access through the connector on the next sync. Idempotent — re-calling on an already-unlinked resource is a no-op. Emits `project.resource.unlinked`.

**Arguments**

- `resource_id` (string, required): UUID of the resource to unlink.

## `delete_resource`

Destructive · requires `project-resource:delete` · idempotent · open world

Hard-deletes a project resource by UUID — the row is removed from the database with no soft-delete fallback. DESTRUCTIVE: you MUST confirm the target `resource_id` with a human before calling; every plan that links this resource loses the link and existing subscribers may lose access on the next sync. Emits `project.resource.deleted` BEFORE the row disappears so webhook listeners receive the final snapshot. Idempotent — re-calling on an already-deleted id returns `RESOURCE_NOT_FOUND`.

**Arguments**

- `resource_id` (string, required): UUID of the resource to delete.

## `list_payment_methods`

Read · requires `project-payment-method:view-any`

Lists configured payment methods for one project. Provider secrets, webhook signing secrets, and Stripe Connect account ids are always stripped — only `id`, `provider`, `connector`, `mode`, `active`, and `created_at` are surfaced. `provider` is a gateway code or a `connector:provider` key for a currency a connector brings, and `connector` names that connector or is null. Set `active_only=true` to omit deactivated methods. Safe to call when deciding whether a plan can charge against a given provider.

**Arguments**

- `project_id` (string, required): UUID of the project whose payment methods to list.
- `active_only` (boolean): When true, omits deactivated payment methods.

## `activate_payment_method`

Destructive · requires `project-payment-method:update` · idempotent

Offers a configured payment method to buyers again and re-queues the plan sync for its gateway. Requires `project_id` and `payment_method_id`. Idempotent — re-calling on a method that is already on is a no-op. A Stripe method whose Connect onboarding never finished is refused with `VALIDATION_FAILED`: it can only be completed from the dashboard. Emits `project.payment_method.updated` when the switch flips. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the method belongs to.
- `payment_method_id` (string, required): UUID of the payment method to switch on.

## `create_plan`

Additive · requires `project-subscription-plan:create` · open world

Creates a subscription plan on a project. Every plan has a `kind`, and the kind decides which ONE nested object you must send with it: `subscription` takes `billing`, `pass` takes `pass`, `pass_series` takes `pass_series`. Sending a block that does not match the kind is rejected. `currency_id` must be supported by an active payment method on the project. The user-type restriction flags inside `eligibility` (`newcomers_only`, `customers_only`, `churned_only`) are mutually exclusive. Defaults: `kind=subscription`, `active=true`. Emits `plan.created`. KIND subscription: access begins at payment and renews on a cycle; `resources` is required; `billing.billing_cycle=lifetime` requires `billing_cycle_count=1`. KIND pass: sells ONE scheduled access window per purchase; `resources` is required; supply `pass.timezone`, `pass.recurrence` and `pass.slots`, where each slot carries its own `duration_minutes` so one plan can mix a 3-hour and a 14-hour window. KIND pass_series: sells a curated slate of OTHER pass plans' windows for one payment — a season ticket; it owns no windows of its own, so `pass_series.window_ids` must name windows that already exist (use the `list_pass_windows` tool to find them) and `resources` is OPTIONAL, meaning a lounge open for the whole span rather than the thing being sold. Passes and series both require Time-Limited Passes, bundled with Growth or available as the Passes Addon; on any other tier the call is rejected.

**Arguments**

- `project_id` (string, required): UUID of the parent project.
- `kind` (string, required): subscription (access starts at payment and renews on a cycle), pass (one dated access window per purchase), or pass_series (a season ticket over many of your pass plans' windows). Defaults to subscription. Decides which nested block below is required.
- `name` (string, required): Plan name (min 5, max 255 chars, unique per project).
- `currency_id` (string, required): UUID of the currency. Must be supported by an active payment method on the project.
- `price` (number, required): What one purchase costs, as a decimal. On a pass this buys one window; on a pass_series it buys the whole slate, once. At least the $1.00 USD equivalent — payment providers reject smaller amounts. 0 publishes a free plan and requires the Starter or Growth tier.
- `resources` (array of any): UUIDs of project_resources this plan grants access to. Required on kind subscription and kind pass. OPTIONAL on kind pass_series, where it means a lounge the holder keeps for the whole span — each pass in a series already grants its own plan's resources.
- `description` (string): Optional plan description. Max 1000 chars, HTML is filtered.
- `active` (boolean): Defaults to true. Set false to create in draft state.
- `sales_cap` (integer): Optional. Pause the plan automatically after this many successful purchases (1-100000); the creator publishes it again for another batch. Omit or null for no limit.
- `eligibility` (object): Audience restrictions: {newcomers_only?: bool, customers_only?: bool, churned_only?: bool, single_use?: bool, access_codes_only?: bool}. The first three are mutually exclusive.
- `billing` (object): REQUIRED when kind=subscription, refused otherwise. {billing_cycle: days|weeks|months|years|lifetime, billing_cycle_count: int 1-99, recurring?: bool, disabled_renewal?: bool, trial_days?: int 0-365, trial_cardless?: bool, trial_type?: string}. lifetime requires billing_cycle_count=1. recurring must be false for crypto / platform currencies.
- `pass` (object): REQUIRED when kind=pass, refused otherwise. {timezone: IANA zone e.g. America/New_York, schedule_mode?: repeating|fixed, recurrence?: daily|weekly|monthly, recurrence_ends_at?: ISO-8601, sales_cutoff_minutes?: int, sales_cutoff_anchor?: before_start|before_end, slots?: array, windows?: array}. Slot times are local wall-clock in `timezone` and survive daylight saving. Each slot is {weekday?: 0-6 with 0=Sunday, day_of_month?: 1-31, start_time: "HH:MM", duration_minutes: int} — each carries its own duration, so a plan can mix lengths, and a day_of_month of 29-31 skips months that lack the day. `windows` places explicit dates for schedule_mode=fixed: {starts_at: "YYYY-MM-DD HH:MM", duration_minutes: int}. sales_cutoff_anchor before_start (default) stops sales that many minutes before a window opens; before_end keeps it on sale while it runs, requires at least 1, and must be under the shortest slot duration_minutes.
- `pass_series` (object): REQUIRED when kind=pass_series, refused otherwise. {window_ids: array of pass-window UUIDs, prevent_overlaps?: bool, sales_cutoff_minutes?: int, sales_cutoff_anchor?: before_start|before_first_end|before_last_start|before_end, seat_cap?: int, successor_plan_id?: UUID, presale_hours?: int 1-8760, blackout_window_ids?: array, rules?: array}. A series points at windows that ALREADY EXIST on your pass plans — it never creates any — so get their UUIDs from the `list_pass_windows` tool first. Needs at least two windows, or a rule that will find them. `rules` grows the slate automatically and keeps doing so after holders have bought, granting new matches to them at no charge: each rule is {source_plan_id: UUID of a pass plan, kind: date_range|next_n, from_at?: ISO-8601, to_at?: ISO-8601, take?: int}, where date_range takes every window starting in the period and next_n takes the next `take` windows and then stops. sales_cutoff_anchor before_start closes sales before the FIRST window opens; before_first_end keeps the season on sale into that opening window and closes a set number of minutes (at least 5) before it ends, so a latecomer can still join on the night; before_last_start keeps it on sale until the LAST window opens, so a buyer always gets at least one whole date; before_end keeps the season on sale right through, closing before the LAST window ends. All three sell at full price for whatever remains, and windows that already ran are never issued.

## `publish_plan`

Destructive · requires `project-subscription-plan:update` · idempotent · open world

Flips a plan's `active` flag. Pass `active=true` to publish (the plan starts accepting checkouts), `active=false` to unpublish (existing subscriptions keep running, but no new checkouts can start). Defaults to `true`. Idempotent — re-calling on a plan already in the target state is a no-op. Emits `plan.activated` or `plan.deactivated`. Plans priced at `0` can only be sold on the Starter and Growth tiers, so publishing one on the Free tier is refused with `TEAM_TIER_REQUIRED` and the plan must be given a price first. Unpublishing is always allowed.

**Arguments**

- `plan_id` (string, required): UUID of the plan to flip.
- `active` (boolean): Target state — true publishes, false unpublishes. Defaults to true.

## `get_portal_design`

Read · requires `project:view`

Reads a project's portal design: `published`, the document members see, and `draft`, the one being edited or null, each with every key of the fourteen sections (colours, typography, shape, layout, wording, blocks, button and footer, announcement bar, media, sections, behaviour, visibility and code, language) in the stored shape `update_portal_design` takes back, plus `has_draft`, `draft_updated_at`, `published_at` and a preview_url that shows the draft for ten minutes, null until the project has a handle. Requires `project_id`. Unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose portal design to read.

## `publish_portal_design`

Destructive · requires `project:update`

Makes a project's drafted portal design the one members see; the portal, the embed and the social card paint with it on their next render, and `project.design_published` is emitted naming the sections that changed. Requires `project_id`. Refused with `VALIDATION_FAILED` when nothing is drafted. Unknown or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose drafted portal design to publish.

## `get_portal_url`

Read · requires `distribution:read`

Builds the subscriber-portal URL for a project: `{frontend_url}/{handle}`. Always reflects the current handle — updating the handle via `update_project` invalidates previously distributed portal URLs. Returns `{ project_id, handle, portal_url }`.

**Arguments**

- `project_id` (string, required): UUID of the project whose portal URL to return.

## `get_deep_link`

Read · requires `distribution:read`

Builds a shareable deep link into a project's bot on its connector, carrying a `start` payload. Pass `plan_id` (UUID) to pre-select that plan, or `access_code` (UUID) to hand out a one-time redemption link — the bot acts on the raw UUID. `custom` (1–64 chars of A–Za–z0–9_-) is an arbitrary passthrough for external click tracking; the bot itself opens the project home for it. Without any of those, the link opens the bot on the project home flow. Returns `VALIDATION_FAILED` with `reason=no_bot_attached` if the project has no bot connected.

**Arguments**

- `project_id` (string, required): UUID of the project whose bot URL to embed in the deep-link.
- `plan_id` (string): Optional plan UUID. When set, the payload is that UUID verbatim and the bot opens the plan checkout.
- `access_code` (string): Optional access-code UUID. When set, payload is the UUID verbatim for one-tap redemption.
- `custom` (string): Optional caller-supplied payload. Useful for campaign / referral tracking.

## `get_recovery_readiness`

Read · requires `project-recovery:view-any`

Reads the Disaster Recovery readiness checklist for the creator this token acts for: every line (the account lines first: a second factor and a backup sign-in account; then each installed connector's own lines, named by `connector`, such as a standby installation, a standby for every gated space, automatic failover and a live mirror; then the reminders: a copy of the content kept elsewhere and a second human administrator) with `done` true, false, or null when the platform can only remind, `locked` when the plan lacks the prevention feature, the state in words (`detail`) and where the fix lives (`url`), plus the totals the dashboard card shows (`completed` of `total`, `complete`, and `prevention` for whether the plan bundles the prevention features). Answers "how ready is this account for the next ban?". Takes no input.

**Arguments**

- none

## `list_webhook_endpoints`

Read · requires `webhook-endpoint:view-any`

Lists outbound webhook endpoints registered for the token's team. Optionally scoped by `project_id`, or trimmed by `active_only` to hide endpoints with `is_active=false` or `disabled_at` set. Webhook signing secrets are NEVER returned; only `url`, the `events` allow-list, `failure_count`, `consecutive_failures`, and `last_success_at` / `last_failure_at` timestamps. Cross-reference allowed `events` against `subscriby://enums/webhook-event` to confirm coverage.

**Arguments**

- `project_id` (string): Optional project UUID. Omit to list team-wide endpoints and all project-scoped endpoints within the team.
- `active_only` (boolean): When true, hides endpoints with is_active=false or disabled_at set.

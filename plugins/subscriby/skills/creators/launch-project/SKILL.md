---
name: launch-project
description: This skill should be used when the user asks to create a new Subscriby project, launch or set up a paid community from nothing, go live, run the go-live checklist, or asks what a project needs before it can sell. From an empty project to a live one, in order, with the writes confirmed one at a time.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Launching a project

A project is the container for one membership business. Four things turn an empty one into a working membership, in this order: a connector installed and connected, the places it gates linked as resources, a payment method, and a plan. The portal and the share links come after, and the go-live checklist closes it. Everything below runs through the tools, except the two steps a person must take on the dashboard: typing a connector's credential and connecting a payment gateway.

Name the project once at the start and keep every call on its `project_id`. Confirm each write with the user before it runs; never chain several on one yes.

## 1. Create the project

`create_project` takes `name` (5 to 255 characters, a brand name: short and distinctive), and optionally `description` (up to 1,000 characters, the bot's welcome message, HTML allowed and sanitised), `handle` (the portal address `my.subscriby.net/<handle>`: 5 to 255 lowercase letters, digits, dashes and underscores, unique across Subscriby including former handles; leave it out for no portal page yet), `terms` and `privacy` (the creator's own documents; without them the bot and the portal link Subscriby's), `active` (default on; off keeps the bot silent), `hide_branding` (Starter Plan and above) and `team_id` (Growth Plan, when the project belongs to a team).

Project limits by creator plan: Free Plan 3 projects, Starter Plan 10 (12 on an annual plan), Growth Plan 20 (25 annual). A refused create names the limit; the fix is an upgrade on the dashboard.

Later changes go through `update_project` (the same fields plus `storefront_arrangement`, `manual` or `live`, and `outage_compensations`). `archive_project` and `restore_project` pause and resume a project without losing anything; `delete_project` is permanent and removes plans, codes and subscription records, so it is never the answer to "take a break" (an inactive project is).

## 2. Install and connect a connector

A project is not tied to a platform until a connector is installed on it.

1. `list_connectors` shows the catalogue by lane: `available`, `beta` (Experimental), `paused`, `in_development`, `coming_soon`. Only the first two can be installed. `get_connector` carries what one can gate and what connecting needs.
2. `install_connector` with the connector's key opens a pending installation on the project. The second connector on a project needs the Growth Plan (`multi_connector`).
3. Connecting is a person's step: the creator opens the project's Connectors page, presses **Connect** on the pending row and either pastes the credential the connector asks for (a Telegram bot token from @BotFather) or finishes on the platform's own page (Discord adds Subscriby's verified app to the server; there is no token). Say exactly that and wait.
4. `verify_connector_installation` probes it; the state should read connected. The `connectors` skill reads health, settings and the doctor.

## 3. Link the places and add the perks

A resource is what a plan unlocks: a place the connector gates or a manual perk delivered by hand. A gated place is never created out of thin air; it is linked through the connector, which checks its rights first.

- `list_connector_spaces` with the `kind` the connector gates (channels, groups and supergroups on Telegram; roles, channels and the server on Discord) lists the places the installation can see; `create_resource_from_space` links one by its `external_id` with a `title`.
- When the place is not in the list (a private place the picker does not surface), `request_resource_link` with the `kind` sends the request to the project's bot, where the creator picks the place inside the platform and grants the rights: on Telegram the bot must be an administrator with **Invite Users via Link** and **Ban Users**; on Discord the app's role must sit above every role sold.
- `create_resource` makes a manual perk (a `title`, a `description` the member sees as the deliverable, `active`).
- `list_resources`, `get_resource`, `update_resource`, `activate_resource` and `deactivate_resource` manage them; `unlink_resource` detaches a place and `delete_resource` is permanent and breaks every plan that still grants it, so deactivate instead for anything that had members.

## 4. Enable a payment method

Connecting a gateway (Stripe through Connect, PayPal, Polar, Mollie, Kelviq, Skrill, CoinPayments, Paystack, Razorpay, CeyPay) is dashboard-only, because a credential is typed by a person; so is switching on Access Codes as a method. The tools read and switch what exists: `list_payment_methods` (`active_only`) and `activate_payment_method`. A method in test mode takes no real money; one live method is what going live means, and a provider can exist once live and once test per project. Providers with their own catalogue (Stripe, PayPal, Polar, Kelviq, CoinPayments, Razorpay) receive the plans automatically when a plan is published; `sync_payment_method_plans` re-pushes every plan after a provider was connected late.

## 5. Build the plans

`create_plan` with `kind` `subscription` (recurring or one-time access), `pass` (one dated window) or `pass_series` (a season of windows), `name` (unique in the project), `currency_id` (one an active method supports), `price` (at least the one-dollar equivalent; 0 publishes a free plan on Starter and Growth), `resources` (at least one, except on a series, whose dates grant through their own plans), and the kind's own block: `billing` for a subscription (cycle, count, recurring, trial), `pass` for the schedule, `pass_series` for the slate. A plan is created switched off; `publish_plan` with `active` true puts it on sale. The `plans-and-passes` skill owns every field and the traps.

## 6. The portal and the links

- `get_portal_design` reads the published document and the draft; `publish_portal_design` makes the draft live. The `portal-design` skill owns the keys.
- `get_portal_url` answers the portal address; `get_deep_link` a start link into the project's bot, optionally for one `plan_id`, an `access_code` or a `custom` payload. These are what the creator posts.

## 7. The go-live checklist

Before the creator announces, read the project's state and check each line; the `launch-auditor` agent does this read-only and reports gaps with the fix:

- Account: an active creator plan; two-factor or a passkey (dashboard).
- Project: active; name, description, handle set; terms and privacy linked or the defaults accepted.
- Connector: installed, connected and healthy; the bot an administrator of every place with the right to invite by link (the one most often missing).
- Resources: every place linked and active; the hand-delivered perks as manual resources.
- Plans: at least one published and linked to its resources; prices, cycles and trials as intended; storefront order; plans synced to catalogue providers.
- Payments: at least one active live method; a test purchase made and the test method retired or kept apart.
- Sharing: the portal renders with every active plan; the bot link and deep links ready.
- Support: the inbox on if member questions should land in Subscriby (`support-inbox`).
- Recovery: the readiness tiles green (`get_recovery_readiness`; the `disaster-recovery` skill).

## Do not

- Do not create a resource for a platform the project has no installation on, and never promise a place the connector has not confirmed.
- Do not delete a project, a resource or a plan to "clean up"; deactivate, archive or unpublish.
- Do not type or ask for a bot token or a gateway key; send the creator to the dashboard step.
- Do not publish a plan before its resources are linked and a live payment method exists, unless the creator is deliberately staging it.

## References

- [references/tools.md](references/tools.md): every tool above with its arguments.
- [references/events.md](references/events.md): the `project.*` events a launch fires.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects` and `/v1/projects/{project}/resources`.
- [references/abilities.md](references/abilities.md): the `projects` abilities.
- Documentation: [Creating a project](https://docs.subscriby.net/creators/projects), [Resources](https://docs.subscriby.net/creators/resources), [Payment methods](https://docs.subscriby.net/creators/methods), [Go-live checklist](https://docs.subscriby.net/creators/go-live-checklist), [Quickstart](https://docs.subscriby.net/quickstart).

---
name: connectors
description: This skill should be used when the user asks about a project's connectors, installations or bots and their health, the Connectors Marketplace, installing, verifying, configuring, diagnosing, disconnecting or uninstalling a connector, the places a connector gates, or Telegram and Discord specifics.
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Connectors and installations

A connector is the package that speaks to one platform: it admits and removes members from the places the project gates, carries messages, verifies who a member is and, where the platform has one, takes its native payment. An installation is one connector set up on one project. A project can run several (the second needs the Growth Plan), a plan can grant places on more than one, and one purchase grants access on all of them.

## The catalogue

`list_connectors` (filter by `status`: `available`, `beta`, `paused`, `in_development`, `coming_soon`) and `get_connector` render the same catalogue as the marketplace and the resource `subscriby://connectors/catalog`: lane, badges (Official, Community, New, Trending), category, what it gates, what it can do, what connecting needs, and the plan a reserved connector requires. Today Telegram is available and Discord is in public beta (Experimental); the roadmap lists what is on the way. A `coming_soon` card cannot be installed, whatever the user hopes.

## An installation's state

`list_connector_installations` and `get_connector_installation` answer each installation with its state:

- `pending`: installed, not connected; the credential or the platform sign-in is still to do.
- `connected`: live and probed healthy.
- `degraded`: the last probe found something wrong (the reason is in the row); **Sales Paused** beside it means the platform refused the installation outright (a revoked or regenerated token, a deleted bot), every plan unlocking a place on it is off sale, and members are compensated when it answers again.
- `revoked`: the platform withdrew it. `disconnected`: the creator did.
- A connector Subscriby **paused** during an incident sends and probes nothing; installations, plans and members are untouched.

A health probe runs hourly; `verify_connector_installation` runs one now and updates the state at once. `run_connector_doctor` runs the connector's own diagnosis of the installation and its places and answers what it found and what to do.

## Install, connect, configure

1. `install_connector` opens a pending installation. The second connector on a project is refused below the Growth Plan.
2. Connecting is a person's step on the project's Connectors page: paste the credential (a Telegram bot token) or finish on the platform (Discord's authorisation page). The same **Reconnect** entry replaces a credential or moves the project onto a different bot later. Never ask for the token in the conversation.
3. `verify_connector_installation` confirms it.
4. `update_connector_installation_settings` changes the connector's `settings` and switches its `capabilities` on that installation: messages, broadcasts, the support inbox, built-in payments and the recovery facets can be switched off per project; access control and account recovery are always on. A switched-off capability is honoured everywhere at once: a broadcast is refused before it is queued, a probe is skipped, a reply is not relayed; switching built-in payments off hides the connector's currency from pricing and checkout without touching sales already made.
5. `list_connector_installation_actions` lists what the installation can set up on its platform (a members area in one click on Discord, say); `run_connector_installation_action` with the action's `fields` runs one, and it is destructive, so confirm it.

## Places

`list_connector_spaces` with the `kind` the connector gates lists the places the installation can see; `create_resource_from_space` links one as a resource; `request_resource_link` sends a pick-the-place request to the bot when the list does not surface a private place. The `launch-project` skill carries the rights each platform needs. The resource's own health shows on the resources list; a lost place is the `disaster-recovery` skill's job (`restore_connector_access` brings back what an uninstall detached once the connector is installed again).

## Disconnect against uninstall

- `disconnect_connector`: the connector withdraws the installation and its credentials are wiped; members keep their access; grants, resources, plans and identities are untouched; connect again at any time.
- `uninstall_connector`: removes the connector from the project. Always read `get_connector_uninstall_preview` first and show the user the impact: how many resources will be detached (deactivated, their platform ids kept), how many members lose access (every live grant on those resources is revoked), which plans are left with nothing to grant and how many purchases sit on them. Then confirm the two switches: `unpublish_emptied_plans` (take the emptied plans off sale) and `cancel_recurring_subscriptions` (stop their renewals at period end and email each member; one-time and lifetime purchases are never cancelled and a refund stays the creator's call). Nothing is deleted: the installation stays on record, member accounts stay, and installing again brings it back as pending.

## Telegram

The creator's own bot, created with @BotFather and connected with its token, runs the membership: members are admitted to private channels, groups and supergroups (up to 200,000 members) with a personal single-use invite link the moment they pay and removed when access ends. The bot must be an administrator of every gated place with **Invite Users via Link** and **Ban Users** (**Post Messages** on channels to post there). Telegram Stars is the native payment, live only and one-time. The platform bot carries the creator toolkit as a menu; `/check` and `/ban` are the admin commands in the project bot. A linked creator account on Telegram is what the resource request flow picks places with.

## Discord

Subscriby's one verified app serves every creator: it is added to the server from the dashboard, no token exists, and its role must sit above every role sold in Server Settings → Roles. It sells roles, private channels (text, voice, stage and forum, each gated through a role the app makes) and the whole server; a member who connected Discord is added by the app itself with the role, otherwise a single-use invite valid a week is minted. Broadcasts post once in the announcement channel mentioning the plans' roles or go as direct messages; pass windows become server events; `/subscriby` serves members and `/subscriby-admin` the creator. No native payment: members pay through the creator's gateways on the portal. Public beta: expect changes between releases.

## Do not

- Do not uninstall without the preview in front of the user, and never pass the two switches on a guess.
- Do not promise a connector from the `coming_soon` lane, a second connector below Growth, or a capability the installation switched off.
- Do not read a `degraded` state as broken: read the reason, run the doctor, and name the dashboard step (reconnect, re-add the bot as administrator, fix the role order) that clears it.

## References

- [references/tools.md](references/tools.md): the sixteen tools with their arguments.
- [references/events.md](references/events.md): the `connector.*` events (installed, connected, disconnected, status changed, settings updated, uninstalled, doctor completed, outage opened, closed and compensated).
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/connectors` and the project's installations.
- [references/abilities.md](references/abilities.md): the `project-resources` abilities, `project-connector:*` among them.
- Documentation: [Connectors](https://docs.subscriby.net/connectors), [the marketplace](https://docs.subscriby.net/connectors/marketplace), [a project's connectors](https://docs.subscriby.net/creators/connectors), [Telegram](https://docs.subscriby.net/connectors/telegram), [Discord](https://docs.subscriby.net/connectors/discord), [connector outages](https://docs.subscriby.net/disaster-recovery/connector-outages).

---
name: connector-manifest
description: This skill should be used when the user is writing or fixing a connector.json manifest for a Subscriby connector, asks about one of its blocks or the eighteen capabilities, the JSON Schema, a loader error naming a dotted path, or what the registry refuses at boot.
license: MIT
metadata:
  category: connector-sdk
  catalogue: 2026-05-01
---

# connector.json

`connector.json` sits at the root of the package and is the only place a connector describes itself: nothing about its identity, capabilities, limits or listing lives in PHP. The `Connector` class only binds ports, and the registry checks that what the class binds agrees with what the file declares. The SDK reads the file at boot, collects every problem before it stops (each named by its dotted path, `listing.tagline`, `install.fields[1].type`), refuses unknown keys at every level, and hands the typed `Subscriby\Connector\Data\ConnectorManifest` to every surface. Point the editor at the JSON Schema (draft 2020-12) with `"$schema": "https://docs.subscriby.net/sdk/connector.schema.json"`; the SDK validates the structural rules itself, and a few limits only the schema states (the eighty-character tagline), so keep editor validation on. The kit's `manifest.file_is_the_source` rule compares the file on disk with the registered manifest, so a manifest assembled in PHP or edited after registration fails.

| Block | Required | Declares |
| --- | :---: | --- |
| identity (`key`, `name`, `version`, `sdk`, `vendor`) | yes | What the connector is |
| `install` | yes | How a creator connects: mode, scopes, the install and settings forms as fields |
| `resource_kinds` | | Each kind of place the connector can gate and how access is granted |
| `capabilities` | | What the connector can do; each one binds a port |
| `messaging` | yes | The platform's message limits |
| `pacing` | yes | How fast the platform lets an installation send |
| `management_commands` | | Which of the core's admin commands the in-chat surface renders |
| `relay_modes` | | The support relay modes offered |
| `recovery` | | Which Disaster Recovery facets are real |
| `listing` | yes | What the marketplace shows, the words the marketing site borrows, the portal's button |

Every human-readable string is written in English and doubles as a translation key resolved through the package's `lang/<locale>.json` (labels, help, steps, option labels, kind labels, the portal button, the tagline and overview, the `seo` copy); `:app` stands for the product name everywhere and the core fills it. Two manifests to read beside this skill: the SDK's fake connector (the fewest capabilities that pass the kit) and Telegram's (every capability the SDK has).

## Identity

- `key`: `^[a-z][a-z0-9_-]*$`, unique on the application, chosen once and never changed. It prefixes the tables (`<key>_`), names the config file (`connector-<key>.php`), the view namespace (`connector-<key>::`), a stored resource kind (`<key>:<kind>`), a native provider (`<key>:<provider>`), the send limiter (`connector:<key>`), the inbound middleware (`connector.inbound:<key>`), Subscriby's availability switches and the public page (`/connectors/<key>`).
- `name`: the display name as the platform is spelt ("Telegram"); it fills the marketing site's `:platform` token when the connector is available.
- `version`: the package's own semantic version (`^\d+\.\d+\.\d+`), bumped with every release; nothing to do with the SDK's.
- `sdk`: the constraint on `subscriby/connector-sdk` the package was built against, checked at boot against `Sdk::VERSION` (currently `1.1.0`). The SDK evaluates a small subset of Composer's syntax itself: `^1.0` (below 1.0 a caret stops at the next minor), `~1.2` and `~1.2.3`, `>=`, `>`, `<=`, `<`, a bare `1.2` (`1.2.*`), an exact `1.2.3`, and `a || b`. Write `^1.0` unless the package needs a later minor, then name it.
- `vendor`: who publishes it, as shown under **Made by**. It never makes a connector **Official**: that badge, availability and the lane are Subscriby's configuration, and a package whose vendor reads "Subscriby" is still **Community** with `native_payments` refused.

## `install`

- `mode`, one of three. `paste_credential`: the creator creates something on the platform (a bot, an app, a key) and pastes its secret; `InstallationLifecycle::begin()` answers a complete draft and `complete()` runs at once. `oauth`: the creator signs in on the platform and authorises Subscriby; `begin()` answers a draft with a `continueUrl` built on the request's `returnUrl`, the core parks the draft and sends the creator there, and when the platform brings them back calls `complete()` with the draft's `returned` query (`code`, `state`), which the connector exchanges for the token it puts in the summary's `meta`. `shared_platform`: Subscriby runs one installation for everyone and a project only links to it; `platformInstallation()` must answer.
- `scopes`, one or both of `project` (an installation a project owns) and `platform` (an installation Subscriby owns on the platform and every creator shares; the connector must answer `platformInstallation()` with it, and the core hands it to `startLink()`, to `RegistersCreators::signupEntry()` and to the recovery facets that need it). Telegram declares both.
- `fields` and `settings_fields`: the install form and the Configuration tab, in display order. Declaring them here binds no `SettingsSchema`: the core wires the SDK's `ManifestSettingsSchema` over the file, translated through the language files. Bind your own schema only when the fields depend on the installation (a list of the server's channels), and then declare none here.

A field: `name` (`^[a-z][a-z0-9_]*$`, unique in its form; read back from `InstallationRequest::$fields` or, for a secret, from the `CredentialBag`), `type`, `label` (a translation key), `help`, `required` (default false), `rules` (Laravel validation strings; a regex written as in PHP with JSON-escaped backslashes), `options` (a select's stored value to label), `steps` (numbered, with `:app` and `:button` replaced by every renderer), `links` (text to turn into a link in the label, help or steps; `https://` and `mailto:` only). The six types: `text`, `secret` (masked; stored in the installation's `CredentialBag`, encrypted, never shown again), `select`, `toggle`, `instructions` (no input: a walkthrough with steps and links) and `link` (a button whose target only a PHP-bound schema can fill per installation).

How the values flow: the core validates every field's rules and refuses the form with Laravel's messages; it puts every submitted install field, secret or not, into the `CredentialBag`, builds an `InstallationRequest` (scope, the acting creator, the project, the fields, the existing installation on a reconnect) and calls `begin()`; for a complete draft it calls `complete()` with that bag and stores it encrypted on the installation row it records from the summary, merged with the summary's `meta` (a webhook secret the connector minted); every port then receives the merged bag. Settings fields are read through `SettingsSchema::settingsFields($installation)` with current values and written through `PATCH …/installation/settings` or the Configuration tab. The kit's `settings.install_fields` expects a `paste_credential` connector to declare an input and a `secret`.

## `resource_kinds`

A resource is the core's decision to sell access to a space, a place the installation administers. A connector that gates nothing leaves the list out; one with `access_control` lists at least one kind. Each kind: `kind` (`^[a-z][a-z0-9_-]*$`, stored as `<key>:<kind>`), `label` (what creators see), `portal_label` (what members see), `icon` (a Heroicons outline name), `grant_mode`, `supports_early_admission_hold` (default false; needs the `early_admission_hold` capability), `mirrorable` (default false; needs `recovery_mirror`), `upgrades_from` (another kind of the same connector that a place of this kind can be an in-place upgrade of, for recovery swaps and standbys), `plan_kinds` (the shapes a place can be sold under: `one_time`, `recurring`, `pass`, `pass_series`; every shape when omitted; never empty; `pass_series` needs `pass`; early admission needs `pass`).

| `grant_mode` | The grant is | Reference stored | The member sees |
| --- | --- | --- | --- |
| `bearer_link` | A personal single-use link the connector mints; whoever presents it is let in (Telegram's invite link that creates a join request the bot approves) | The link, unique per connector | The link in the confirmation and on the portal card |
| `membership` | The installation adds the account to the place directly | The connector's handle, or null | "You now have access", and the `grant_action` slot if filled |
| `role` | The installation gives the account a role that unlocks the place | `guild:role:user`, repeatable across grants | The role on the platform |
| `creator_task` | Nothing the platform can do: the core opens a creator task and tells the member their organiser will act | Null until the task is completed | "Your organiser will add you" |

Early admission: when a pass's window has not opened, the core calls `grant()` with `opensAt`; a kind that supports the hold pre-issues the grant, answers `held: true` and lets the member wait at the door until `admit()`; a kind without it is granted when the window opens. Telegram's kinds are all `bearer_link` with early admission and all four plan shapes, only a channel is `mirrorable`, and a supergroup `upgrades_from` a group because Telegram converts one into the other in place.

## `capabilities`

Declaring a capability obliges the class to bind its port, and binding a port obliges the manifest to declare a capability that needs it; the registry checks both directions at boot.

| Capability | Binds | Group | Switchable per installation |
| --- | --- | --- | :---: |
| `messaging` | `Messenger` | messaging | yes |
| `broadcasts` (needs `messaging`) | `Messenger` | messaging | yes |
| `announcements` (needs `broadcasts`) | `Announcer` | messaging | yes |
| `support_relay` | `SupportRelay` | messaging | yes |
| `access_control` | `AccessController` | access | no |
| `early_admission_hold` | `AccessController` | access | no |
| `space_browsing` (needs `access_control`) | `SpaceBrowser` | access | no |
| `installation_actions` | `InstallationActions` | access | no |
| `portal_login` | `PortalLoginMethod` | access | no |
| `creator_registration` | `RegistersCreators` | access | no |
| `management_surface` | `ManagementSurface` | access | no |
| `copilot` | `CopilotSurface` | access | no |
| `native_payments` (official only) | `ProvidesPaymentMethods` | payments | yes |
| `recovery_probes`, `recovery_standby_installations`, `recovery_resource_standby`, `recovery_mirror`, `recovery_identity_relink` | `RecoverySupport` | recovery | yes |

Two capabilities binding the same port add an obligation on the same class, never a second class: a `Messenger` under `broadcasts` tolerates bulk sends, an `AccessController` under `early_admission_hold` implements `admit()`, a `RecoverySupport` under `recovery_mirror` implements `mirror()`. The core reads a per-installation switch before it invokes the port, so a switched-off port is never called and a connector never reads the switch. `SpaceCatalog` is the one port bound freely with no capability; without it the core offers no "Link a resource" for the connector. The registry refuses at boot, with `InvalidManifest` naming the connector: a declared capability without its port, a capability-bound port without its capability, and `native_payments` on a connector not configured as official. Capabilities are promises: the kit checks that the port is bound, review checks that it works on the platform.

## `messaging` and `pacing`

`messaging` is required even without the `messaging` capability, because it describes the platform: `max_length` (the core splits a longer body at paragraph, line and word boundaries, keeps the tags balanced and calls `send()` once per part with the buttons on the last), `buttons_per_row` and `max_buttons` (enforced by `Message::assertWithin()`), `callback_data_bytes` (`MessageAction::assertWithin()` throws on the developer's machine when a callback would be truncated), `supports_underline` and `supports_spoiler` (published; the renderer decides what becomes of the tag), `supports_files` (the core refuses `sendFile()` itself when false and never calls the port). State the platform's documented limits, never the connector's preference: the core writes the copy, and truncating it in a renderer loses meaning in ten languages. The fake's block (280 characters, two buttons a row, four buttons, 32-byte callbacks, no files) is what keeps the core honest.

`pacing` is required: `min_interval_microseconds` (the gap between any two sends from one installation; the broadcast pipeline spaces by it), `burst` (sends accepted back to back before the interval is honoured) and `per_recipient_interval_microseconds` (the gap between two sends to the same person; the access-code delivery job sleeps it between codes). The registry registers a Laravel rate limiter `connector:<key>` sized at the lower of `burst` and one second over the interval, never below one a second; Telegram's 35,000 microseconds and burst of 30 give 28 a second, the fake's one. A connector that runs its own loop reads `ConnectorManifest::$pacing`; one that only implements `send()` reads nothing, because the core paces the calls. Pacing is not retry: when the platform still answers with a rate limit, classify it `RateLimited` with the platform's retry-after.

## `management_commands`, `relay_modes`, `recovery`

- `management_commands` (meaningful with `management_surface`): the subset of the core's command catalogue the in-chat surface renders; `ManagementSurface::commands()` must return exactly the same set. The catalogue: `project_create`, `project_settings`, `project_delete`, `portal_design`, `installation_connect`, `manage_connectors`, `resource_link`, `resource_manage`, `plan_create`, `plan_manage`, `payment_method_setup`, `coupon_create`, `referral_program_manage`, `partner_program`, `copilot`, `access_codes_generate`, `broadcast`, `support_reply`, `support_relay_setup`, `creator_tasks`, `recovery_status`, `recovery_relink`, `recovery_standby`, `recovery_replace_resource`, `account_recovery_email`, `set_alert_destination`, and `donate` as a connector extra outside the coverage. The marketplace shows the coverage against the full catalogue; a connector may render only what its platform's conversation supports, as long as every declared command has a real path through `handle()`.
- `relay_modes` (meaningful with `support_relay`): `owner_dm` (every support message relayed to the creator's own account as a private message, the reply carried back) and `forum_group` (one thread per member in a group the creator linked; teammates reply in the thread); `SupportRelay::relayModes()` must match. **Dashboard Only** is the core's own option. The `support_relay_options` slot explains each mode on the platform.
- `recovery`: five flags, each default false: `probes`, `standby_installations`, `resource_standby`, `mirror` (needs `mirrorable` kinds), `identity_relink`. A `recovery_*` capability binds the port and puts the facet on the matrix; the flag tells the core at call time whether it may invoke it; declare both for every facet the platform has, and throw `UnsupportedByConnector::facet()` from the methods of the facets it lacks. Any bound `RecoverySupport` answers `vocabulary()` and `readinessChecks()`.

## `listing`

Required: everything the connector says to people who have not installed it. `category` (`messaging`, `community`, `payments`, `productivity`); `tagline` (one line, at most 80 characters); `overview` (Markdown for the Overview tab; the capability matrix, the kinds and the command coverage under it are generated, so do not repeat them); `screenshots`; `links` (`documentation`: your guide for creators; `support`: a `mailto:` is fine; `privacy` and `terms`: the platform's policies, which the legal pages link for members; `homepage`); `added_at` (`YYYY-MM-DD`, the first publication date, drives the **New** chip for sixty days); `changelog_url`; `sign_in_required` (default true; a paste-a-token connector says false); `marketing`; `portal_cta`; `brand_color`; `seo`.

- `marketing` lends the public site its words, since the site never spells a platform: `audience` ("Telegram communities"), `place` ("channel"), `places` ("channels, groups and supergroups"), `installation` ("bot"), `identity` ("Telegram account"), all five required inside the block, and `native_payment` ("Telegram Stars") when there is one. A sentence built on a word the block lacks is dropped rather than rendered half-empty. Lower case except proper nouns, as the words would read mid-sentence. Leave the block out and the site says nothing about the connector.
- `portal_cta`: `label` (a translation key) and an optional `icon` for the button the member portal shows; the address is `startLink()` with no payload. Omit it when the platform has nothing a member opens.
- `brand_color`: `#RRGGBB`; the portal paints the open and sign-in buttons in it and picks the text colour from its luminance.
- `seo`: `title` (at most 70 characters), `description` (at most 160), `h1`, `h1_sub`, `sections` (heading and body), `faq` (q and a); it turns `/connectors/<key>` into a search landing page that may lead with the platform's name, the only page on the marketing site allowed to. Strings may carry `:app`, `:gateways`, `:webhook_events`, `:api_resources` and `:mcp_tools`, filled at render time.

What the registry stamps, and a package cannot claim: **Official**, the lane (**Available Now**, **Experimental**, **Paused**, **Under Development**, **Coming Soon**), **New**, **Trending**, **Installed on**, **Made by**.

## What refuses a file

The loader, at boot: a missing required key, a wrong type, a value outside its enum, an unknown key, a string outside its pattern, a select without options, a link that is not `https://` or `mailto:`, a `plan_kinds` list that breaks its three rules, an `upgrades_from` naming an undeclared kind, a command outside the catalogue, a non-boolean recovery flag, a `marketing` block missing a required word, a `seo` title or description over its limit. The registry, after it: capabilities and ports that disagree, `native_payments` on a community package, an SDK constraint the application does not satisfy. The kit, after both: `manifest.key_matches`, `manifest.sdk_constraint`, `manifest.listing_links`, `manifest.resource_kinds`, `manifest.file_is_the_source`, `settings.install_fields`, `settings.settings_fields`, `access.declares_kinds`, `management.commands_match_manifest`, `relay.modes_match_manifest`, `recovery.vocabulary_and_readiness`.

## Do not

- Do not put a count or the product name in a string; use the tokens.
- Do not declare a capability the platform cannot perform; passing the kit is not doing.
- Do not declare install fields in the file and bind a `SettingsSchema` too; the registry refuses both at once.
- Do not use `http://` or a relative URL in any link.

## References

- Documentation: [connector.json](https://docs.subscriby.net/sdk/v1/manifest), [identity](https://docs.subscriby.net/sdk/v1/manifest/identity), [install](https://docs.subscriby.net/sdk/v1/manifest/install), [resource kinds](https://docs.subscriby.net/sdk/v1/manifest/resource-kinds), [capabilities](https://docs.subscriby.net/sdk/v1/manifest/capabilities), [messaging](https://docs.subscriby.net/sdk/v1/manifest/messaging), [pacing](https://docs.subscriby.net/sdk/v1/manifest/pacing), [management commands](https://docs.subscriby.net/sdk/v1/manifest/management-commands), [relay modes](https://docs.subscriby.net/sdk/v1/manifest/relay-modes), [recovery](https://docs.subscriby.net/sdk/v1/manifest/recovery), [listing](https://docs.subscriby.net/sdk/v1/manifest/listing); the schema at `https://docs.subscriby.net/sdk/connector.schema.json`.
- Related skills: `connector-sdk`, `connector-ports`, `connector-publishing`.

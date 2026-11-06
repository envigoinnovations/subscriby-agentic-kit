# REST endpoints: Connectors

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `connectors`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/connectors` | `project-connector:view-any` | List the connector directory | `list_connectors` |
| GET | `/v1/connectors/{key}` | `project-connector:view-any` | Get one connector | `get_connector` |

### GET `/v1/connectors`

Every connector Subscriby knows, lane by lane, installable connectors first, each with its badges and, for a registered one, its whole manifest and the connect form. `?status=` narrows to one lane.

```bash
curl https://api.subscriby.net/v1/connectors \
  -H "Authorization: Bearer <token>"
```

Cards come lane by lane, installable connectors first; within a lane the most installed connector comes first (`installations`, the number of projects running it today, uninstalled rows excluded) and the name breaks ties. The public and in-app directories offer the same order plus Newest (`added_at`) and Name, and filter on `official`, `installable` and `category`; a client sorts and filters on the same fields.

### Lanes and badges

| `status`         | `status_label`    | Meaning                                                                                        |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `available`      | Available Now     | A package is present and configuration offers it; `installable` is `true`.                     |
| `beta`           | Experimental      | Available, and flagged so; a badge on the card, never a gate. `installable` is `true`.         |
| `paused`         | Paused            | Switched off during an incident. Nothing new is installed and sends queue until it is back.    |
| `in_development` | Under Development | A package exists but configuration does not offer it yet (built, on staging, dark).            |
| `coming_soon`    | Coming Soon       | A roadmap entry with no package behind it: the card, the category and an `eta` sentence only.  |

`badges` are facts the platform stamps, never a package's own claim: `official` or `community` (who publishes it), `new` while the listing was added within the last sixty days, `trending` for the connector(s) creators installed most in the last thirty days. A `coming_soon` card carries none.

**Parameters**

- `status` (query, string): Narrow the directory to one lane: `available`, `beta`, `paused`, `in_development` or `coming_soon`. Omit for every lane. An unknown lane is `422 VALIDATION_FAILED` naming the accepted values.


### GET `/v1/connectors/{key}`

One card by key, registered or on the roadmap, in the shape the directory lists.

```bash
curl https://api.subscriby.net/v1/connectors/example \
  -H "Authorization: Bearer <token>"
```

### The manifest

Every key from `install_mode` onward describes what a registered connector can do; a roadmap card has them `null` or empty.

- `install_mode`: `paste_credential` (the creator pastes a token the platform issued), `oauth` (the creator authorises an app), `shared_platform` (Subscriby runs one shared presence; nothing to connect).
- `scopes`: `project` for an installation a creator sets up on a project; `platform` for a presence Subscriby itself runs on the connector.
- `resource_kinds`: the kinds of place the connector gates, with the creator-facing `label`, the `portal_label` members see, an `icon` slug, the `grant_mode` (`bearer_link`: a single-use link; `membership`: the connector admits the member itself; `role`: a role is granted; `creator_task`: the creator hands access over by hand), whether a grant can be held ahead of a pass window (`supports_early_admission_hold`), the kind of the same connector a place of this kind can be an in-place upgrade of (`upgrades_from`, or `null`), and the shapes of plan a place of the kind can be sold under (`plan_kinds`: `one_time`, `recurring`, `pass`, `pass_series`, in that order). A resource's `kind` on the [Resources endpoints](https://docs.subscriby.net/api/v1/reference/resources) is `<key>:<kind>`, and the same spelling is what a link request takes. Labels are translated into the token holder's language.
- `capabilities`: the port families the connector implements: `messaging`, `broadcasts`, `access_control`, `early_admission_hold`, `support_relay`, `native_payments`, `portal_login`, `creator_registration`, `management_surface`, `copilot`, `recovery_probes`, `recovery_standby_installations`, `recovery_resource_standby`, `recovery_mirror`, `recovery_identity_relink`.
- `messaging` and `pacing`: the limits every message and every bulk send is checked against.
- `management_commands` and `missing_commands`: which core commands the connector's in-chat surface renders and which it does not; the docs' capability matrix and the Connectors tab show the gaps from these.
- `recovery`: which Disaster Recovery facets the connector implements.
- `portal_cta`: the button the member portal shows to open the connector (`label`, translated, and `icon`), or `null` when the connector has nowhere to open; the portal addresses it through the installation's start link.
- `brand_color`: the platform's brand colour (`#RRGGBB`) for the buttons that open or sign in with the connector, or `null` when the connector declares none.
- `install_fields` and `settings_fields`: the declarative forms. Each field carries `type` (`text`, `secret`, `select`, `toggle`, `instructions`, `link`), a translated `label` and `help`, `required`, the validation `rules`, `options` for a select, a default `value`, the numbered walkthrough `steps` (with `:app` and `:button` placeholders for the app's name and the submit button's label) and `links` naming the text a renderer turns into a link. Render them in order and you have the connect form the dashboard shows.

**Parameters**

- `key` (path, string, required): The connector key from the route.


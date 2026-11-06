# REST endpoints: Rest api, the `distribution` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `distribution`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/distribution/deep-link` | `distribution:read` | Build a deep link | `get_deep_link` |
| GET | `/v1/projects/{project}/distribution/portal-url` | `distribution:read` | Get the portal URL | `get_portal_url` |

### GET `/v1/projects/{project}/distribution/deep-link`

Builds a start link against the project's connected installation. The payload depends on which query parameter you pass (at most one; an access code wins over a plan, and a plan over a custom parameter):

| Query parameter | Resulting payload           | Acted on by the bot?                                         |
| --------------- | --------------------------- | ------------------------------------------------------------ |
| `access_code`   | the code verbatim           | Yes: redeemed on open.                                       |
| `plan_id`       | the plan's bare UUID        | Yes: opens that plan's checkout flow.                        |
| `custom`        | the caller-supplied string  | No, see below.                                               |
| *(none)*        | `project_<uuid>`            | No: falls through to the project home, which is the intent.  |

> **Only a bare UUID is acted on.** The bot acts on a start payload only when it is a bare UUID: it is matched against the project's plans first, then tried as an access code. `custom` payloads and the default `project_<uuid>` do not match that shape, so the bot ignores them and opens its home screen. `custom` is therefore a passthrough for **your own** tracking: the platform delivers it and you can read it off the update in a webhook consumer, but Subscriby neither stores it nor attaches it to the member.

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/distribution/deep-link?plan_id=$PLAN_ID" \
  -H "Authorization: Bearer <token>"
```

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `plan_id` (query, string or null): A plan of this project; the link then opens that plan's checkout. Answers 404 for a plan outside the project. Ignored when `access_code` is also sent.
- `access_code` (query, string or null): An access code, carried verbatim and redeemed when the link is opened. Wins over `plan_id` and `custom`.
- `custom` (query, string or null): Your own tracking string, 1 to 64 characters of letters, digits, underscore or hyphen. Delivered by the platform but not acted on or stored by Subscriby. Used only when neither `access_code` nor `plan_id` is sent.


### GET `/v1/projects/{project}/distribution/portal-url`

The portal URL always uses the project's current `handle`. If you change the handle the portal URL updates in lock-step; any old link answers 404 on the portal host.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.


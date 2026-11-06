# Webhook events: Smart Links

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `link`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `link.created` | `project-link:view` | `link` |
| `link.updated` | `project-link:view` | `changes`, `link` |
| `link.archived` | `project-link:view` | `link` |

### `link.created`

A new Smart Link was authored in a project.

### When this fires

A creator authored a new Smart Link on the dashboard, over the REST API or via the `create_link` MCP tool. The link answers at `url` from this moment: a click counts, the visit waits in the visitor's browser for up to thirty days, and the member who signs in inside that window is attributed to the link.

It fires on **authoring**, not on the first click. A link created with an `expires_at` fires this immediately and stops counting when that instant passes; there is no separate event for the expiry.

### Related events

- `link.updated`: the link's fields changed.
- `link.archived`: the link was put out of use.

```json
{
  "id": "evt_01HX...",
  "type": "link.created",
  "created_at": "2026-11-20T09:14:02Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "link": {
      "id": "7c2e5a90-3f41-4b8d-9e62-1a0d4c8b7f35",
      "name": "YouTube description",
      "slug": "youtube",
      "code": "K7PMQ2X",
      "destination": "plan",
      "plan_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "url": "https://my.subscriby.net/jane/go/youtube",
      "expires_at": null,
      "archived_at": null,
      "clicks_total": 0
    }
  }
}
```

### `link.updated`

A Smart Link's name, address, destination or expiry changed.

### When this fires

A creator edited the link on the dashboard, over the REST API or via the `update_link` MCP tool, and at least one field of the snapshot moved. A save that changed nothing fires nothing.

### Caveats

- **A rename does not break what was shared.** The old `url` answers nothing after a rename, but the code in a printed QR or a bot deep link still attributes, because the cookie and the bot payload carry the code, never the slug.

### Related events

- `link.created`: the link was authored.
- `link.archived`: the link was put out of use.

```json
{
  "id": "evt_01HX...",
  "type": "link.updated",
  "created_at": "2026-11-21T10:02:40Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "link": {
      "id": "7c2e5a90-3f41-4b8d-9e62-1a0d4c8b7f35",
      "name": "YouTube description",
      "slug": "youtube",
      "code": "K7PMQ2X",
      "destination": "plan",
      "plan_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "url": "https://my.subscriby.net/jane/go/youtube",
      "expires_at": null,
      "archived_at": null,
      "clicks_total": 48
    },
    "changes": {
      "slug": {
        "from": "yt",
        "to": "youtube"
      },
      "url": {
        "from": "https://my.subscriby.net/jane/go/yt",
        "to": "https://my.subscriby.net/jane/go/youtube"
      }
    }
  }
}
```

### `link.archived`

A Smart Link was put out of use.

### When this fires

A creator archived the link on the dashboard, over the REST API (`DELETE`) or via the `archive_link` MCP tool. Archiving is the only removal a link has: its row, the members it brought and the money they paid all stay, so the funnel keeps adding up. From this moment its address lands on the portal home without counting, and a visit still waiting in a browser is attributed to it when that visitor signs in. Archiving a link already archived fires nothing.

### Related events

- `link.created`: the link was authored.
- `link.updated`: the link's fields changed.

```json
{
  "id": "evt_01HX...",
  "type": "link.archived",
  "created_at": "2026-12-01T08:30:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "link": {
      "id": "7c2e5a90-3f41-4b8d-9e62-1a0d4c8b7f35",
      "name": "YouTube description",
      "slug": "youtube",
      "code": "K7PMQ2X",
      "destination": "plan",
      "plan_id": "2a91c4e7-6f38-4b52-8e0d-9c1a7b3f5d80",
      "url": "https://my.subscriby.net/jane/go/youtube",
      "expires_at": null,
      "archived_at": "2026-12-01T08:30:11+00:00",
      "clicks_total": 1204
    }
  }
}
```

# REST endpoints: REST API, the `webhook-events` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `webhook-events`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/webhook-events` | `webhook-delivery:view-any` | Poll recent webhook events |  |

### GET `/v1/webhook-events`

```bash
curl "https://api.subscriby.net/v1/webhook-events?type=subscription.created&limit=3" \
  -H "Authorization: Bearer <token>"
```

The most recent deliveries of one event type, newest first, as the envelopes the endpoints received. `limit` defaults to 3 and is capped at 10; `project_id` restricts to deliveries whose endpoint is scoped to that project.

`api_version` is the payload-envelope stamp the dispatcher wrote at delivery time; see [versioning](https://docs.subscriby.net/api/v1/versioning-and-deprecation). Results are ordered by `created_at` descending. Only deliveries against endpoints owned by the token's team are returned; other tenants' events are never surfaced.

`data` is empty when no endpoint in your team is subscribed to the requested event type yet, or when no delivery has fired for that type since the relevant endpoint was created. Zapier, Make, and n8n all fall back to the trigger's static sample in that case, so builders can still author a Zap end-to-end before the first live event flows.

**Parameters**

- `type` (query, string, required): The event name to sample, such as `subscription.created`; must be a case from the outbound webhook event catalog. An unknown name is refused.
- `limit` (query, integer): How many recent deliveries to return, 1 to 10.
- `project_id` (query, string): Restrict to deliveries whose endpoint is confined to this project.


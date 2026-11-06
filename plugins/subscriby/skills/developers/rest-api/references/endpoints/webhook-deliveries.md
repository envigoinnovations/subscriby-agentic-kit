# REST endpoints: Rest api, the `webhook-deliveries` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `webhook-deliveries`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/webhook-deliveries` | `webhook-delivery:view-any` | List webhook deliveries | `list_webhook_deliveries` |
| POST | `/v1/webhook-deliveries/retry-dead` | `webhook-delivery:retry` | Retry every recent dead delivery | `retry_dead_webhook_deliveries` |
| GET | `/v1/webhook-deliveries/{delivery}` | `webhook-delivery:view-any` | Get a webhook delivery | `get_webhook_delivery` |
| POST | `/v1/webhook-deliveries/{delivery}/retry` | `webhook-delivery:retry` | Retry a webhook delivery | `retry_webhook_delivery` |

### GET `/v1/webhook-deliveries`

```bash
curl "https://api.subscriby.net/v1/webhook-deliveries?status=dead" \
  -H "Authorization: Bearer <token>"
```

The team's deliveries across every endpoint, **newest first**, 25 per page (`per_page` 1 to 100; `limit` is accepted as an alias).

**Parameters**

- `status` (query, string): One of the log's tabs: `all` (the default), `pending`, `delivered`, `failed` or `dead`. A tab rather than a raw status, so an omitted value lists every row instead of quietly matching nothing. Anything else is refused.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 15.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/webhook-deliveries/retry-dead`

Once the consumer is fixed, replay everything the team dead-lettered since an instant in one call.

```bash
curl -X POST https://api.subscriby.net/v1/webhook-deliveries/retry-dead \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"since": "2026-09-05T22:00:00Z"}'
```

`retried` is how many rows were reset and queued. Only `dead` rows are touched: a `failed` row is still on its ladder and will be posted again on its own. The replay is capped at 500 rows per call so one request after a long outage cannot flood the queue or the target; call it again if the count comes back at the ceiling.

Each replayed row posts its event again, so confirm the consumer is healthy first; see [replaying bulk dead deliveries](https://docs.subscriby.net/webhooks/v1/retries-and-delivery#replaying-bulk-dead-deliveries).

**Parameters**

- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `since` (string): ISO 8601, not in the future. Only rows dead-lettered **at or after** this instant are replayed. Omit it for the last 24 hours.


### GET `/v1/webhook-deliveries/{delivery}`

```bash
curl https://api.subscriby.net/v1/webhook-deliveries/$DELIVERY_ID \
  -H "Authorization: Bearer <token>"
```

One delivery. Another team's delivery is a `404 RESOURCE_NOT_FOUND`, never a `403`.

| Field              | Type            | Notes                                                                                                                                      |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `event`            | string          | The event name, as in the [catalog](https://docs.subscriby.net/api/v1/reference/webhook-events).                                              |
| `event_id`         | string          | The 26-character ULID the envelope's `id` carries without its `evt_` prefix; also the `SB-Event-Id` header your handler received.          |
| `status`           | string          | `pending`, `delivered`, `failed` or `dead`. See below.                                                                                     |
| `attempts`         | integer         | Posts made so far. Reset to `0` by a retry.                                                                                                |
| `response_status`  | integer or null | The HTTP status your endpoint returned on the last attempt; `null` before the first post or after a transport failure.                     |
| `response_excerpt` | string or null  | The start of the response body, or the transport error.                                                                                    |
| `payload`          | object          | The full [event envelope](https://docs.subscriby.net/webhooks/v1/events) that was, or would have been, posted, so a consumer can be debugged against it exactly. |
| `next_attempt_at`  | string or null  | When the worker will post a `failed` row again.                                                                                            |
| `delivered_at`     | string or null  | Stamped on the first 2xx.                                                                                                                  |
| `dead_lettered_at` | string or null  | Stamped when the ladder ran out.                                                                                                           |

There is no `updated_at`: a delivery only moves forward through its statuses, and the three timestamps say when each transition happened.

A row is born `pending`, becomes `failed` after a non-2xx or transport error while retries remain, `delivered` on the first 2xx, and `dead` once the ladder is exhausted or the endpoint vanished. `delivered` and `dead` are final until a retry resets the row to `pending`.

> **`payload` discloses nothing new.** The envelope is what your own endpoint already received, or would have had it answered. Reading it needs `webhook-delivery:view-any`, and the tenant scope reaches a delivery only through an endpoint of the token's team.

**Parameters**

- `delivery` (path, string, required): The delivery, resolved by the route binder.


### POST `/v1/webhook-deliveries/{delivery}/retry`

```bash
curl -X POST https://api.subscriby.net/v1/webhook-deliveries/$DELIVERY_ID/retry \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Answers `200` with the row **pending again**: `attempts` back to `0`, `response_status`, `response_excerpt` and `dead_lettered_at` cleared, and the worker queued. The delivery log then shows the replay's own outcome rather than the original failure's. A retry re-posts the **original** event to its endpoint; nothing new is raised about the replay itself.

> **Only `failed` and `dead` rows can be retried.** Resetting a delivered row would post the event to your server a second time. The dashboard hides its retry button behind the same rule, but a row can be delivered between a render and a click, and the API has no button at all.

**Parameters**

- `delivery` (path, string, required): The delivery, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


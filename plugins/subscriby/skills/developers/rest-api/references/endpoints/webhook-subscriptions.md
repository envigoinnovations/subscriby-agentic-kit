# REST endpoints: REST API, the `webhook-subscriptions` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `webhook-subscriptions`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/webhook-subscriptions` | `webhook-endpoint:view-any` |  |  |
| POST | `/v1/webhook-subscriptions` | `webhook-endpoint:create` |  |  |
| DELETE | `/v1/webhook-subscriptions/{endpoint}` | `webhook-endpoint:delete` |  |  |

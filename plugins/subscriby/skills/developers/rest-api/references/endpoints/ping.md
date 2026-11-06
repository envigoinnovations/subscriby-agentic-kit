# REST endpoints: Rest api, the `ping` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `ping`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/ping` | none | Check the API is up |  |

### GET `/v1/ping`

```bash
curl https://api.subscriby.net/v1/ping
```

Answers `200` with `data.status` of `ok`, the API version and the current server time in ISO 8601. No `Authorization` header is read and no rate limit applies, so a monitor may call it on a schedule.


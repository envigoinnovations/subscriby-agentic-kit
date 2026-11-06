# REST endpoints: Rest api, the `activity` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `activity`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/activity` | `activity:read` | Read a subject's activity | `get_activity_log` |

### GET `/v1/activity`

The newest entries recorded against one subject, `limit` at a time (50 by default, 200 at most), newest first. Name the subject by alias and id:

```bash
curl "https://api.subscriby.net/v1/activity?subject_type=project&subject_id=$PROJECT_ID&limit=20" \
  -H "Authorization: Bearer <token>"
```

There is no paging beyond `limit`: the endpoint is a recent-history read, not an export. The subject is resolved through its own tenant-scoped query before activity is read, so passing the id of a project (or subscription, plan, member) that belongs to another team returns `404 RESOURCE_NOT_FOUND` rather than an empty list; existence never leaks across tenants.

- `subject_type` and `causer_type` use short morph aliases (`project`, `project-subscription`, `project-subscription-plan`, `project-user`, `project-resource`, `user`, …) rather than internal class names. Treat them as opaque strings. The `subject_type` **query parameter** accepts only the aliases listed on the endpoint; a class name is `422 VALIDATION_FAILED`.
- `actor_kind` distinguishes the surface the change came through: `human` (dashboard click), `api_token` (REST), `mcp` (MCP tool), `zapier`, `webhook`, `system` (scheduled job). Filter on it client-side when you need "everything the agent did yesterday" separately from dashboard clicks.
- `properties` keys matching `token`, `secret`, `password`, `api_key` or `api_secret` (case-insensitive) are stripped at any depth before the response leaves the server, so LLM context windows never see credentials that were logged alongside a write.

**Parameters**

- `subject_type` (query, string, required): The kind of subject, as a short alias: `project`, `subscription` (or `project-subscription`), `member` (or `project-user`), `plan` (or `project-subscription-plan`), `access-code`, `coupon` or `project-resource`. A class name is refused.
- `subject_id` (query, string, required): The subject's id.
- `limit` (query, integer): How many of the newest entries to return, 1 to 200; defaults to 50. A value above 200 is refused rather than clamped.


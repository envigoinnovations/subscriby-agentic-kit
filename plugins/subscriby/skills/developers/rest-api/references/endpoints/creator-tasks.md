# REST endpoints: REST API, the `creator-tasks` entity

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `creator-tasks`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/creator-tasks` | `project-subscription:view` | List a project's creator tasks | `list_creator_tasks` |
| POST | `/v1/projects/{project}/creator-tasks/{task}/complete` | `project-subscription:update` | Complete a creator task | `complete_creator_task` |

### GET `/v1/projects/{project}/creator-tasks`

```bash
curl "https://api.subscriby.net/v1/projects/$PROJECT_ID/creator-tasks?status=open" \
  -H "Authorization: Bearer <token>"
```

`status` is `open` (the default: tasks not yet done whose grant still stands), `completed`, or `all`. Paged like every list but **oldest first** by default, so the longest-waiting member is at the top.

- `grant_id` is the access ledger row the task belongs to; read it with the [subscription's grants](https://docs.subscriby.net/api/v1/reference/subscriptions/list-a-subscriptions-grants), where its `mode` is `creator_task`.
- `instructions` is the sentence the dashboard shows the creator, in the creator's locale.
- `due_at` is null for continuous access and the window's start for a dated pass.
- `completed_at` and `completed_by_user_id` are set once the task is done.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `status` (query, string): The tab: `open` (the default) lists tasks not yet done whose grant still stands, `completed` the ones marked done, `all` both.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `asc`.


### POST `/v1/projects/{project}/creator-tasks/{task}/complete`

```bash
curl -X POST https://api.subscriby.net/v1/projects/$PROJECT_ID/creator-tasks/$TASK_ID/complete \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)"
```

Marks the task done by the token's user, moves the grant to `granted`, and raises `creator_task.completed` followed by `member.resource_added` for the same grant. Answers `200` with the completed task.

> **Nobody messages the member for you.** A manual perk is yours to hand over. Completing the task records that you did and tells your integrations; it does not send the member anything.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `task` (path, string, required): The task, resolved within the project by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


# REST endpoints: Knowledge

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Base URL `https://api.subscriby.net`; every request carries `Authorization: Bearer <token>`; every POST, PATCH, PUT and DELETE carries an `Idempotency-Key`. The MCP twins column names the tool that runs the same action over MCP.

## `knowledge`

| Method | Path | Ability | Summary | MCP twins |
| --- | --- | --- | --- | --- |
| GET | `/v1/projects/{project}/knowledge` | `project-knowledge:view-any` | List a project's Knowledge | `list_knowledge_entries` |
| POST | `/v1/projects/{project}/knowledge` | `project-knowledge:create` | Create a Knowledge entry | `create_knowledge_entry` |
| DELETE | `/v1/projects/{project}/knowledge/{entry}` | `project-knowledge:delete` | Delete a Knowledge entry | `delete_knowledge_entry` |
| GET | `/v1/projects/{project}/knowledge/{entry}` | `project-knowledge:view` | Get a Knowledge entry | `get_knowledge_entry` |
| PATCH | `/v1/projects/{project}/knowledge/{entry}` | `project-knowledge:update` | Update a Knowledge entry | `update_knowledge_entry` |

### GET `/v1/projects/{project}/knowledge`

```bash
curl "https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/knowledge?per_page=50" \
  -H "Authorization: Bearer <token>"
```

Pages the entries, newest first. Each row names the entry's `kind`, its `audience`, its `status` with a label beside each, its title and how many passages it became; `body` is `null` on every row. Sort with `sort_by` (`created_at` by default, or `updated_at`, `title`) and `sort_direction`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `page` (query, integer): The 1-based page to return. A page past the last answers an empty `data` array with `meta.total` still filled, so a loop can stop without guessing.
- `per_page` (query, integer): Rows per page, 1 to 100. A higher value clamps to the cap silently. Defaults to 25.
- `sort_by` (query, string): The column to order by. Defaults to `created_at`; a column the endpoint does not offer falls back to the default rather than failing.
- `sort_direction` (query, string): `asc` or `desc`. Defaults to `desc`.
- `limit` (query, integer): Legacy alias of `per_page`, kept for clients that predate it. `per_page` wins when both are sent.


### POST `/v1/projects/{project}/knowledge`

```bash
curl -X POST https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/knowledge \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "document",
    "title": "House rules",
    "body": "# House rules\n\nClasses start on the hour. Arrive five minutes early…",
    "audience": "members"
  }'
```

Answers `201` with the entry, its `body` included, already cut into passages and in the index: a member can be answered from it the moment this returns. `kind` is fixed once the entry exists; a guide that should have been a question is a new entry. `audience` defaults to `members`, because most of what a creator writes down is written for members; `team` keeps it to the creator's own surfaces.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `kind` (one of `question`, `document`, required): The two shapes a Knowledge entry takes: a question with its answer, or an uploaded document. A question is written on the Knowledge page and is one passage; a document is a file whose text is cut into passages when it is uploaded. Both cases are declared from the first migration because `knowledge_entries.kind` is an enum whose check constraint cannot be widened once it exists.
- `title` (string, required): The question, or the document's name, 2 to 160 characters; written at the head of every passage so one read on its own still says where it came from.
- `body` (string, required): The answer, or the document's text, 2 to 50,000 characters. The Copilot quotes from here and never invents a fact; a Markdown document keeps its headings.
- `audience` (one of `team`, `members`): Who Subscriby Copilot may be answering when it reads a Knowledge entry. Every entry serves the creator's own surfaces, the operator and the inbox suggester. Only an entry marked for members serves the member-facing answerer, in the project bot and on the portal, so a creator's private notes never reach a member by construction: the member search filters on this value and nothing else can widen it. Both cases are declared from the first migration because the column is an enum whose check constraint cannot be widened once it exists.


### DELETE `/v1/projects/{project}/knowledge/{entry}`

Answers `204`. The entry, its passages and its file go in one step, so the Copilot stops answering from it at once. A second `DELETE` of the same id is `404 RESOURCE_NOT_FOUND`; a token whose owner's role may not remove Knowledge is `403 TOKEN_MISSING_ABILITY`.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `entry` (path, string, required): The entry, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.


### GET `/v1/projects/{project}/knowledge/{entry}`

The entry with its `body`: the answer, or the document's text as it was read out of the file or sent in, headings included for a Markdown document. `status` is `ready` once the passages are in the index, `indexing` while they are cut, `failed` when the text could not be read, in which case `failure` says why.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `entry` (path, string, required): The entry, resolved within the project.


### PATCH `/v1/projects/{project}/knowledge/{entry}`

```bash
curl -X PATCH https://api.subscriby.net/v1/projects/7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13/knowledge/3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{ "audience": "team" }'
```

Answers `200` with the complete entry after the change. **Every field is optional and an omitted one keeps its stored value**, so the request above changes who may be answered from the entry and nothing else. New words in `title` or `body` are cut into passages again in the same step, and the old passages go with them, so the Copilot never reads a mix of old and new; a new `audience` alone retags the passages without rewriting them.

**Parameters**

- `project` (path, string, required): The project, resolved by the route binder.
- `entry` (path, string, required): The entry, resolved within the project.
- `Idempotency-Key` (header, string, required): A key unique to this operation, such as a fresh UUID. The same key replays the original 2xx response for 24 hours (with `Idempotent-Replay: true`), so a retry after a timeout never repeats the write; the same key with a different body is refused with 409.

**Request body**

- `title` (string): The question, or the document's name, 2 to 160 characters.
- `body` (string): The answer, or the document's text, 2 to 50,000 characters; new words are cut into passages again in the same step.
- `audience` (one of `team`, `members`): Who Subscriby Copilot may be answering when it reads a Knowledge entry. Every entry serves the creator's own surfaces, the operator and the inbox suggester. Only an entry marked for members serves the member-facing answerer, in the project bot and on the portal, so a creator's private notes never reach a member by construction: the member search filters on this value and nothing else can widen it. Both cases are declared from the first migration because the column is an enum whose check constraint cannot be widened once it exists.


# Webhook events: Knowledge

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. An endpoint subscribes to an event only when the token that registers it holds the ability beside the event. Every delivery is the envelope `{id, type, created_at, api_version, project_id, data}` with the payload keys below under `data`; retries carry the same `id`.

## Family `knowledge`

| Event | Needs ability | Payload keys |
| --- | --- | --- |
| `knowledge.created` | `project-knowledge:view` | `entry`, `project_id` |
| `knowledge.updated` | `project-knowledge:view` | `changes`, `entry`, `project_id`, `text_changed` |
| `knowledge.deleted` | `project-knowledge:view` | `entry`, `project_id` |

### `knowledge.created`

An entry was taught to the Copilot.

### When this fires

A creator saved a question with its answer or a document on the Knowledge page, or an integration created one over the API or through `create_knowledge_entry`. The passages are in the index by the time the event fires, so a member can already be answered from a `members` entry.

### Caveats

- **A failed read still fires.** A document whose text could not be read is saved with `status: failed` and announced; the dashboard shows why, and the Copilot is handed nothing from it.

### Related events

- `knowledge.updated`: the entry's words or audience changing.
- `knowledge.deleted`: the entry taken back.

```json
{
  "id": "evt_01HX...",
  "type": "knowledge.created",
  "created_at": "2026-10-19T16:02:11Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "entry": {
      "id": "3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d",
      "kind": "question",
      "audience": "members",
      "status": "ready",
      "title": "When does my membership renew?",
      "chunk_count": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

### `knowledge.updated`

An entry's title, audience or text changed.

### When this fires

A save moved the title, the audience or the words, from the dashboard, the API or `update_knowledge_entry`. A save that changed nothing fires nothing.

### Caveats

- **An audience change is the member boundary moving.** `members` to `team` means the Copilot stops answering members from the entry at once; the other way round, it starts.

### Related events

- `knowledge.created`: the entry's first save.

```json
{
  "id": "evt_01HX...",
  "type": "knowledge.updated",
  "created_at": "2026-10-19T16:40:08Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "changes": {
      "audience": {
        "from": "members",
        "to": "team"
      }
    },
    "entry": {
      "id": "3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d",
      "kind": "question",
      "audience": "team",
      "status": "ready",
      "title": "When does my membership renew?",
      "chunk_count": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
    "text_changed": false
  }
}
```

### `knowledge.deleted`

An entry was taken back.

### When this fires

A creator removed the entry on the Knowledge page, or an integration did over the API or through `delete_knowledge_entry`. The passages and the file are gone by the time the event fires.

### Caveats

- **Nothing is recoverable.** Deleting is not archiving: the words are gone with the passages. An integration that wants history keeps its own copy from `knowledge.created` and the API.

### Related events

- `knowledge.created`: how it began.

```json
{
  "id": "evt_01HX...",
  "type": "knowledge.deleted",
  "created_at": "2026-10-19T17:12:45Z",
  "api_version": "2026-05-01",
  "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13",
  "data": {
    "entry": {
      "id": "3b7e4d2a-9c1f-4a6b-8d5e-2f7c9a1b3e4d",
      "kind": "question",
      "audience": "team",
      "status": "ready",
      "title": "When does my membership renew?",
      "chunk_count": 1
    },
    "project_id": "7f3d1c92-8b45-4e6a-9d21-5c8e0a4b6f13"
  }
}
```

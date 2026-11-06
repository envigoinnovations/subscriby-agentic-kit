# Tools: Knowledge

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_knowledge_entries` | read | `project-knowledge:view-any` | Lists what a project has taught Subscriby Copilot, newest first: every Knowledge entry with its "kind" ("question" or "document"), its "audience" ("members" may be answered from it, "team" serves the creator's own surfaces alone), its "status" ("ready", "indexing" or "failed"), its title and how many passages it became. |
| `get_knowledge_entry` | read | `project-knowledge:view` | Reads one Knowledge entry of a project with its text: the question and its answer, or the document's name and its words, plus "kind", "audience", "status", how many passages it became and when it was last indexed. |
| `create_knowledge_entry` | additive | `project-knowledge:create` | Teaches Subscriby Copilot something about a project: a question with its answer, or a document sent as text, cut into passages and indexed the moment it is saved. |
| `update_knowledge_entry` | destructive | `project-knowledge:update` | Changes a Knowledge entry; anything you omit keeps its stored value and the kind never changes. |
| `delete_knowledge_entry` | destructive | `project-knowledge:delete` | Removes a Knowledge entry from a project with its passages and its file, so the Copilot stops answering from it at once. |

## `list_knowledge_entries`

Read · requires `project-knowledge:view-any`

Lists what a project has taught Subscriby Copilot, newest first: every Knowledge entry with its "kind" ("question" or "document"), its "audience" ("members" may be answered from it, "team" serves the creator's own surfaces alone), its "status" ("ready", "indexing" or "failed"), its title and how many passages it became. The rows carry no text; `get_knowledge_entry` does. Requires `project_id`; optional `limit` (1..100) and `page`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose Knowledge to list.
- `limit` (integer): Maximum rows to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_knowledge_entry`

Read · requires `project-knowledge:view`

Reads one Knowledge entry of a project with its text: the question and its answer, or the document's name and its words, plus "kind", "audience", "status", how many passages it became and when it was last indexed. Requires `project_id` and `knowledge_entry_id`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the entry belongs to.
- `knowledge_entry_id` (string, required): UUID of the entry, from `list_knowledge_entries`.

## `create_knowledge_entry`

Additive · requires `project-knowledge:create` · open world

Teaches Subscriby Copilot something about a project: a question with its answer, or a document sent as text, cut into passages and indexed the moment it is saved. Requires `project_id`, `kind` ("question" or "document"), `title` (the question or the document's name, 2..160 chars) and `body` (the answer or the document's text, 2..50000 chars; a Markdown document keeps its headings); optional `audience` ("members", the default, lets members be answered from it in the inbox, the bot and the portal; "team" keeps it to the creator's own surfaces). A project holds at most 200 entries. Emits `knowledge.created`. Refused with `VALIDATION_FAILED` per field. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project to teach.
- `kind` (one of `question`, `document`, required): "question" for a question with its answer, "document" for a plain-text or Markdown guide sent as text.
- `title` (string, required): The question, worded the way a member asks it, or the document's name; 2 to 160 characters.
- `body` (string, required): The answer, or the document's text; 2 to 50000 characters, facts only.
- `audience` (one of `team`, `members`): "members" (the default) lets members be answered from the entry; "team" keeps it to the creator's own surfaces.

## `update_knowledge_entry`

Destructive · requires `project-knowledge:update` · idempotent

Changes a Knowledge entry; anything you omit keeps its stored value and the kind never changes. Requires `project_id` and `knowledge_entry_id`. Optional: `title` (2..160 chars), `body` (2..50000 chars; new words are cut into passages again in the same step) and `audience` ("members" or "team"; a change retags the passages without rewriting them). Emits `knowledge.updated` with the changed fields when something moved. Refused with `VALIDATION_FAILED` per field. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the entry belongs to.
- `knowledge_entry_id` (string, required): UUID of the entry to change, from `list_knowledge_entries`.
- `title` (string): The question, or the document's name; 2 to 160 characters.
- `body` (string): The answer, or the document's text; 2 to 50000 characters. New words are cut into passages again.
- `audience` (one of `team`, `members`): "members" lets members be answered from the entry; "team" keeps it to the creator's own surfaces.

## `delete_knowledge_entry`

Destructive · requires `project-knowledge:delete` · idempotent

Removes a Knowledge entry from a project with its passages and its file, so the Copilot stops answering from it at once. Requires `project_id` and `knowledge_entry_id`. DESTRUCTIVE: you MUST confirm the target `knowledge_entry_id` with the creator before calling; read it back with `get_knowledge_entry` first. Emits `knowledge.deleted`. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the entry belongs to.
- `knowledge_entry_id` (string, required): UUID of the entry to remove, from `list_knowledge_entries`.

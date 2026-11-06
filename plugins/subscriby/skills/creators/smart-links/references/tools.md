# Tools: Smart Links

Generated from the Subscriby catalogue (version 2026-05-01) by `npm run sync`; `npm run check` fails on a hand edit. Kinds: a read is side-effect free and safe to fan out; an additive tool adds something new and runs without a confirmation; a destructive tool changes or removes existing data and asks first. A tool refuses with `TOKEN_MISSING_ABILITY` when the credential lacks the ability named beside it.

| Tool | Kind | Ability | What it does |
| --- | --- | --- | --- |
| `list_links` | read | `project-link:view-any` | Lists a project's Smart Links, newest first, each with its slug, its stable code, where it sends people, its three addresses (`urls.web`, `urls.bot`, `urls.embed`), its `state` (`live`, `expired` or `archived`) and its lifetime clicks. |
| `get_link` | read | `project-link:view` | Fetches one Smart Link by `project_id` and `link_id`: its name, slug, stable code, destination, the three addresses to share (`urls.web`, `urls.bot`, `urls.embed`), its state and its lifetime clicks. |
| `get_link_funnel` | read | `project-link:view-any` | Reads the Smart Links funnel. |
| `create_link` | additive | `project-link:create` | Creates a Smart Link on a project: a tracked address for one channel (a video description, a bio, a flyer's QR). |
| `update_link` | additive | `project-link:update` | Changes a Smart Link; only the arguments present move, the rest keep their stored value. |
| `archive_link` | destructive | `project-link:delete` | Archives a Smart Link so it stops counting clicks and crediting members. |

## `list_links`

Read · requires `project-link:view-any`

Lists a project's Smart Links, newest first, each with its slug, its stable code, where it sends people, its three addresses (`urls.web`, `urls.bot`, `urls.embed`), its `state` (`live`, `expired` or `archived`) and its lifetime clicks. Requires `project_id`. Optional `archived` (true for archived links only, false for links still in use, expired ones included) and `search` (name or slug contains). Paginates with `limit` (1..100, default 25) and `page`. A Smart Link is a tracked address a creator hands out per channel; every member who signs in within the attribution window of clicking it is credited to it, which `get_link_funnel` reads. Use to find a link id before `get_link`, `update_link` or `archive_link`.

**Arguments**

- `project_id` (string, required): UUID of the project whose links to list.
- `archived` (boolean): Optional: true for archived links only, false for links still in use (expired ones included). Omit for every link.
- `search` (string): Optional: keep links whose name or slug contains this text.
- `limit` (integer): Maximum links to return per page (1..100).
- `page` (integer): 1-indexed page number.

## `get_link`

Read · requires `project-link:view`

Fetches one Smart Link by `project_id` and `link_id`: its name, slug, stable code, destination, the three addresses to share (`urls.web`, `urls.bot`, `urls.embed`), its state and its lifetime clicks. Same row as `list_links`; `get_link_funnel` has the members and the revenue behind it. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project the link belongs to.
- `link_id` (string, required): UUID of the Smart Link to fetch.

## `get_link_funnel`

Read · requires `project-link:view-any`

Reads the Smart Links funnel. With `project_id` alone: every link of the project, live and archived, each with its lifetime clicks, the members it brought (`leads`), those who started a purchase (`checkouts`), those who paid (`paid`), `conversion_rate` (paid per hundred clicks) and `revenue` (everything those members ever paid, per currency and restated in US dollars), plus the `direct` row for the members no link brought and `totals` that equal the project's own figures, so the rows add up. With `link_id` as well: that one link's row. The figures are lifetime by design and count removed members and ended purchases, so two channels compare on everything each ever brought. Needs `project-link:view-any` either way. Unknown, foreign or out-of-scope ids surface as `RESOURCE_NOT_FOUND`.

**Arguments**

- `project_id` (string, required): UUID of the project whose funnel to read.
- `link_id` (string): Optional UUID of one Smart Link; omit for every link with the Direct row and the totals.

## `create_link`

Additive · requires `project-link:create` · open world

Creates a Smart Link on a project: a tracked address for one channel (a video description, a bio, a flyer's QR). Requires `project_id`, `name` (a creator-facing label, 2..120 characters), `slug` (the address segment after `/go/`: 2..32 letters, digits and hyphens, lowercased and unique within the project; `go`, `embed`, `portal`, `bot`, `direct`, `new` and `edit` are reserved) and `destination` (`portal` for the portal home, `plan` for one plan's checkout with `plan_id`, or `bot` for the project's bot). Optional `expires_at` (ISO 8601, in the future) stops the link counting after that moment; omit for never. The answer carries the stable seven-character code and the three addresses to share. Emits `link.created`. Refused with `VALIDATION_FAILED` for a reserved or taken slug or a plan of another project. Smart Links are on every plan, so there is no tier refusal.

**Arguments**

- `project_id` (string, required): UUID of the project the link belongs to.
- `name` (string, required): A creator-facing label, 2 to 120 characters, e.g. "YouTube description".
- `slug` (string, required): The address segment after /go/: 2 to 32 letters, digits and hyphens, e.g. "youtube". Lowercased and unique within the project.
- `destination` (string, required): Where the link sends people: "portal" (the portal home), "plan" (one plan's checkout; send plan_id) or "bot" (the project's bot).
- `plan_id` (string): UUID of the plan a "plan" destination opens. Ignored on the other destinations.
- `expires_at` (string): ISO 8601 instant after which the link stops counting and crediting. Omit for never.

## `update_link`

Additive · requires `project-link:update` · idempotent

Changes a Smart Link; only the arguments present move, the rest keep their stored value. Requires `project_id` and `link_id`. Optional `name` (2..120 characters), `slug` (2..32 letters, digits and hyphens, lowercased, unique within the project; the old address stops answering), `destination` (`portal`, `plan` with `plan_id`, or `bot`), `plan_id` and `expires_at` (ISO 8601 in the future, or an empty string to run until archived). The code never changes, so the bot link, the QR and the attribution cookie keep working after a rename. Emits `link.updated` with the fields that moved. Refused with `VALIDATION_FAILED` for a reserved or taken slug or a plan of another project; an archived link can still be renamed.

**Arguments**

- `project_id` (string, required): UUID of the project the link belongs to.
- `link_id` (string, required): UUID of the Smart Link to change.
- `name` (string): A new creator-facing label, 2 to 120 characters.
- `slug` (string): A new address segment, 2 to 32 letters, digits and hyphens; the old address stops answering.
- `destination` (string): "portal", "plan" (send plan_id unless one is stored) or "bot".
- `plan_id` (string): UUID of the plan a "plan" destination opens.
- `expires_at` (string): ISO 8601 instant after which the link stops counting, or an empty string to run until archived.

## `archive_link`

Destructive · requires `project-link:delete` · idempotent

Archives a Smart Link so it stops counting clicks and crediting members. Requires `project_id` and `link_id`. The address keeps landing on the portal home, so a flyer or a bio that carries it never shows anyone an error, and the members, purchases and revenue the link brought keep their figures in `get_link_funnel`. DESTRUCTIVE in the sense that it cannot be undone: an archived link is never put back in use; make a new one instead. Emits `link.archived` the first time; calling it again on an archived link changes nothing and answers the same row.

**Arguments**

- `project_id` (string, required): UUID of the project the link belongs to.
- `link_id` (string, required): UUID of the Smart Link to archive.

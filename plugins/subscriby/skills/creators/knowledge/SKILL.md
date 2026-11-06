---
name: knowledge
description: "This skill should be used when the user asks to teach Subscriby Copilot something about a project, add a question and answer or a guide to Knowledge, decide whether members or only the team may be answered from it, check what the Copilot knows, or read, change or remove a Knowledge entry."
license: MIT
metadata:
  category: creators
  catalogue: 2026-05-01
---

# Knowledge

Knowledge is what a project teaches Subscriby Copilot beyond what Subscriby already knows: that Thursday classes start at seven, that a pause lasts three months, where the studio is. An entry is a question with its answer, worded the way a member would ask it, or a document (a guide, the house rules, a timetable) sent as text. Each is cut into passages of about 1,200 characters, headed by its title, and the five passages that match a question best are handed to the Copilot as data to answer from. It is on every plan, Free included, and adding to it costs nothing; what costs is an answer.

## The audience boundary

Every entry carries an `audience`: `members` (the default; serves the member answers in the inbox, the bot and the portal chat, and the team) or `team` (the suggested reply in the inbox and the team's own surfaces only; a member is never answered from it). The filter is applied inside the search, so a member's message cannot talk its way past it; a member is answered by an agent with no tools, handed their own standing, the saved replies, the portal address and the members' passages, and nothing else. Use `team` for what helps a reply without being the reply: the refund policy applied case by case, a supplier's number, who to escalate to.

## Tools

- `list_knowledge_entries` pages a project's entries without their text (kind, audience, state, title, passage count); `get_knowledge_entry` is the one read that carries the words.
- `create_knowledge_entry` with `kind` `question` or `document`, `title` (up to 160 characters; for a question, the question itself), `body` (the answer, or the document's text, up to 50,000 characters; a document arrives as text here, the dashboard also takes a `.txt`, `.md` or `.markdown` file up to 2 MB; a PDF is refused everywhere for now) and `audience`. It is indexed before it answers. At most 200 entries a project.
- `update_knowledge_entry` changes the title, the text or the audience; new words are cut into passages again at once and the old ones go in the same step.
- `delete_knowledge_entry` takes an entry back with its passages (destructive; confirm).

Write answers as plain facts the way the creator would say them: the Copilot quotes from here and never invents a date or an amount. Word a question as people ask it; the search matches on the question's words too.

Where it is read today: the suggested reply in the inbox (every entry), the member answers in the inbox, the bot and the portal chat (members' entries, when the switches in `support-inbox` are on). A member never sees the page, the files or the team's entries.

## Do not

- Do not mark an internal note `members`.
- Do not paste member data, credentials or anything a member must not read into an entry.
- Do not promise a PDF upload or an answer in the dashboard panel; both are not there yet.

## References

- [references/tools.md](references/tools.md): the five tools with their arguments.
- [references/events.md](references/events.md): `knowledge.created`, `knowledge.updated` and `knowledge.deleted`, which never carry the text.
- [references/endpoints.md](references/endpoints.md): the REST twins under `/v1/projects/{project}/knowledge`.
- Documentation: [Knowledge](https://docs.subscriby.net/creators/knowledge), [what the Copilot can do](https://docs.subscriby.net/copilot/what-it-can-do), [turns and credits](https://docs.subscriby.net/copilot/turns-and-credits).

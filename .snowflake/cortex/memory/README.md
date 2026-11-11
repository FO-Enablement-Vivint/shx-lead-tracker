# Memory Conventions

## Key Principle

> If it can be derived from the canonical docs (`AGENTS.md`, `README.md`,
> `MIGRATION.md`, `VERIFICATION.md`, `CONTEXT.md`, `DESIGN.md`,
> `docs/KNOWLEDGE_MAP.md`) or the codebase itself, it does NOT belong in
> memory. Memory stores only ephemeral state — what session we are on, what is
> active, and what gotchas are not obvious from reading the code.

## Structure

- `shx-lead-tracker.md` (max 80 lines) — the ONLY memory file.
- `config.json` — paths, quality gate, canonical docs for the project-context-kit skills.
- `semantic-registry.json` — drift-checker registry (banned synonyms, code references, value agreement).

## Rules

1. One file. Budget above. If it grows, you are storing too much.
2. Ownership of everything else: see `docs/KNOWLEDGE_MAP.md`.
3. Memory owns: session state, active work, non-obvious in-flight gotchas.
4. History lives in git log. Do not maintain a changelog file here.
5. Run `/wrap-up` (from the `project-context-kit` plugin) at session end
   to keep this file current and committed.

## Cross-Machine Sync

Clone the repo. `wrap-up` commits and pushes this file every session end.
On a fresh machine, `session-start` reads it to bootstrap local context.

## A note on the local runtime cache

`session-start` mirrors this file into a per-machine cache at
`$HOME/.snowflake/cortex/project-context-kit/cache/<sanitized-repo-path>.md`
— a path exclusive to `project-context-kit`, separate from anything the
built-in Cortex Code memory tool manages. **Don't hand-author that cache
path directly.** It gets silently overwritten by the next `session-start`,
and anything written there instead of here will eventually be lost or
conflict with this file. Always write project state to *this* file
(`.snowflake/cortex/memory/shx-lead-tracker.md`); run `doctor` if you suspect
the two have already diverged.

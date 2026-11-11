# Knowledge Map

Where does new knowledge go? Check this table before creating a new doc or
adding to the wrong one.

| Concern | Canonical source | Discipline |
|---|---|---|
| Commands, conventions, architecture pointers, gotchas | `AGENTS.md` | static — updated on pattern promotion |
| App overview, access model, deploy/env setup, Airtable layer | `README.md` | static — update when behavior changes |
| Migration history (Zite to standalone, Vite to Next.js), auth seam | `MIGRATION.md` | static — historical record |
| Post-migration verification checklist | `VERIFICATION.md` | static — check items off as verified |
| Domain terms, glossary, naming decisions | `CONTEXT.md` | active — see `domain-vocabulary` |
| Visual/interaction rules, design tokens, design decisions | `DESIGN.md` | active — see `design-soul` |
| Ephemeral session state, active work, non-obvious gotchas | `.snowflake/cortex/memory/shx-lead-tracker.md` | active — see `wrap-up`/`session-start` |
| In-flight plans | `.snowflake/cortex/plans/*.plan.md` | active — scanned by `wrap-up` |

One concept, one home. "Active" disciplines are touched inline, the moment
something changes — never batched. If two docs describe the same thing,
fix the duplication rather than adding a third copy.

# shx-lead-tracker — project memory

## Session State
- **Session:** 2026-11-11 (s1, wrap) · `main` · repo cloned, project-context-kit bootstrapped, local env working (dev server + Magistrate sign-in verified by Ashley), `CONTEXT.md` and `DESIGN.md` filled in from the code. No app code changed.

## Gotchas
- **Possible authz gap (unfixed):** `getLeads` (and likely `getClosedLeads`, `getLeadStats`) trust a client-supplied `assignedPro` id; only a Manager is *supposed* to pass another Pro's id ("View as"), but nothing server-side stops a signed-in Pro from doing it. `requireRosterUser` gates who may call, not whose data they ask for. Confirm intent, then add an ownership check.
- `.env` (git-ignored) holds all local secrets; `preinstall` sources it as shell, so values containing `&` must stay single-quoted. Local `.env` writes to the **live** Airtable base.
- Vercel env vars for this project are all Sensitive/hidden: `vercel env pull` returns only `VERCEL_OIDC_TOKEN`. Get secrets from the owner, not Vercel. `NPM_AUTH_TOKEN` is shared across Magistrate apps; Magistrate client ID/secret/session key are per-app.
- `AGENTS.md`'s Next.js block is rewritten by `next dev`; project sections live below its END marker only.
- The semantic-registry checker greps the whole repo on word boundaries, so don't add `bannedSynonyms` for "rep" or "user" — existing code names (`getReps`, `RepsContext`) would fail the gate.
- Pushing `main` triggers a Vercel deploy of `shx-lead-tracker.vercel.app`. `.snowflake/`, `docs/`, `CONTEXT.md`, `DESIGN.md` and `AGENTS.md` don't affect the build, but keep the build gate green before pushing.

## Next Session
- Decide on and fix the `assignedPro` ownership check (see Gotchas); add it to `AGENTS.md` conventions once settled.
- Fix doc drift in `README.md` (says 31 endpoints, registry has 34; lists nonexistent `server/lib/session.ts`) and `VERIFICATION.md`/`MIGRATION.md` (still say there is no auth).
- Clean up `CONTEXT.md`/`DESIGN.md` "known" lists as items get fixed (`proId` ambiguity, stale `'CLOSED | Sold'` literal, `--header-muted` mismatch, dead CSS).

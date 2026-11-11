# shx-lead-tracker — project memory

## Session State
- **Session:** 2026-11-11 (s3) · `main` · offline trace of Pro saves (stubbed Airtable, real endpoint code, exact UI payloads) found and fixed: Pro edit of an activity credited to another rep (403), co-assigned-lead subset check, `updateSelfGenActivity` ownership, `logAuditEvent` identity from session. Deleted `getLeadStats`. Gate green. **Still not exercised in a real browser as a Pro.**

## Gotchas
- `authz:check` and anything paging NIS Leads is slow (Airtable throttled to 5 req/s; each call takes seconds, the full script ~3 min). Run it in the background and poll a file; a foreground run looks hung and gets cancelled.
- `.env` (git-ignored) holds all local secrets; `preinstall` sources it as shell, so values containing `&` must stay single-quoted. Local `.env` writes to the **live** Airtable base. It still carries an unused `APP_USER_EMAIL`.
- Vercel env vars for this project are all Sensitive/hidden: `vercel env pull` returns only `VERCEL_OIDC_TOKEN`. Get secrets from the owner, not Vercel. `NPM_AUTH_TOKEN` is shared across Magistrate apps; Magistrate client ID/secret/session key are per-app.
- `AGENTS.md`'s Next.js block is rewritten by `next dev`; project sections live below its END marker only.
- The semantic-registry checker greps the whole repo on word boundaries, so don't add `bannedSynonyms` for "rep" or "user" — existing code names (`getReps`, `RepsContext`) would fail the gate.
- `neverStage` includes `.env.*`, which also matches the tracked, secret-free `.env.example`; stage it deliberately, never by glob.
- Pushing `main` triggers a Vercel deploy of `shx-lead-tracker.vercel.app`. `.snowflake/`, `docs/`, `CONTEXT.md`, `DESIGN.md` and `AGENTS.md` don't affect the build, but keep the build gate green before pushing.

## Next Session
- After the deploy, smoke-test as a **Pro** in a private window (Magistrate has no logout): change a status, add a note, log an activity, edit an activity credited to another rep; confirm Manager can still reassign.
- Remaining low-priority: `logAuditEvent` does not check the caller can access `leadId` (id only lands in free text); `VERIFICATION.md` §5 still names a `getLeadCount` endpoint that does not exist.
- Clean up `CONTEXT.md`/`DESIGN.md` "known" lists as items get fixed (`proId` ambiguity, stale `'CLOSED | Sold'` literal, `--header-muted` mismatch, dead CSS).

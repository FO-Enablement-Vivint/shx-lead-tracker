# shx-lead-tracker — project memory

## Session State
- **Session:** 2026-11-11 (s2, wrap) · `main` · closed the per-endpoint ownership gap (`server/lib/access.ts`, 8 endpoints, `npm run authz:check`), fixed doc drift in README/MIGRATION/VERIFICATION/`.env.example`, recorded the decision in `CONTEXT.md` + `AGENTS.md`. Gate green (typecheck, build, registry). **Not yet exercised in the browser as a Pro.**

## Gotchas
- `authz:check` and anything paging NIS Leads is slow (Airtable throttled to 5 req/s; each call takes seconds, the full script ~3 min). Run it in the background and poll a file; a foreground run looks hung and gets cancelled. `getLeadStats` paginates the whole table, so its allow-path is skipped in the script.
- `.env` (git-ignored) holds all local secrets; `preinstall` sources it as shell, so values containing `&` must stay single-quoted. Local `.env` writes to the **live** Airtable base. It still carries an unused `APP_USER_EMAIL`.
- Vercel env vars for this project are all Sensitive/hidden: `vercel env pull` returns only `VERCEL_OIDC_TOKEN`. Get secrets from the owner, not Vercel. `NPM_AUTH_TOKEN` is shared across Magistrate apps; Magistrate client ID/secret/session key are per-app.
- `AGENTS.md`'s Next.js block is rewritten by `next dev`; project sections live below its END marker only.
- The semantic-registry checker greps the whole repo on word boundaries, so don't add `bannedSynonyms` for "rep" or "user" — existing code names (`getReps`, `RepsContext`) would fail the gate.
- `neverStage` includes `.env.*`, which also matches the tracked, secret-free `.env.example`; stage it deliberately, never by glob.
- Pushing `main` triggers a Vercel deploy of `shx-lead-tracker.vercel.app`. `.snowflake/`, `docs/`, `CONTEXT.md`, `DESIGN.md` and `AGENTS.md` don't affect the build, but keep the build gate green before pushing.

## Next Session
- Smoke-test as a **Pro** in the browser (private window; Magistrate has no logout): change a status, add a note, log an activity on an own lead; confirm Manager can still reassign. The `updateLead` Pro path drops manager-only fields server-side and was only verified through helpers, not the UI.
- Audit the remaining endpoints that take an id or email from the client and were not reviewed: `updateSelfGenActivity`, `logAuditEvent`, `getRunningTotals`, `getCompensation`.
- Decide whether to delete `getLeadStats`: no caller in `src/`, and `VERIFICATION.md` says it exceeds any Vercel timeout.
- Clean up `CONTEXT.md`/`DESIGN.md` "known" lists as items get fixed (`proId` ambiguity, stale `'CLOSED | Sold'` literal, `--header-muted` mismatch, dead CSS). None were touched this session.

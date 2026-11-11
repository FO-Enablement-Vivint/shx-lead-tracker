# shx-lead-tracker — project memory

## Session State
- **Session:** 2026-11-11 (s3) · `main` · offline trace of Pro saves (stubbed Airtable, real endpoint code, exact UI payloads) found and fixed: Pro edit of an activity credited to another rep (403), co-assigned-lead subset check, `updateSelfGenActivity` ownership, `logAuditEvent` identity from session. Deleted `getLeadStats`. Gate green. **Still not exercised in a real browser as a Pro.** Part 2: role helpers in `server/lib/roles.ts`, `getReps` `proId`->`repId`, `--danger` tokens, `next/font`, `.dark` deleted.

## Gotchas
- `authz:check` and anything paging NIS Leads is slow (Airtable throttled to 5 req/s; each call takes seconds, the full script ~3 min). Run it in the background and poll a file; a foreground run looks hung and gets cancelled.
- `.env` (git-ignored) holds all local secrets; `preinstall` sources it as shell, so values containing `&` must stay single-quoted. Local `.env` writes to the **live** Airtable base. It still carries an unused `APP_USER_EMAIL`.
- Vercel env vars for this project are all Sensitive/hidden: `vercel env pull` returns only `VERCEL_OIDC_TOKEN`. Get secrets from the owner, not Vercel. `NPM_AUTH_TOKEN` is shared across Magistrate apps; Magistrate client ID/secret/session key are per-app.
- `AGENTS.md`'s Next.js block is rewritten by `next dev`; project sections live below its END marker only.
- The semantic-registry checker greps the whole repo on word boundaries, so don't add `bannedSynonyms` for "rep" or "user" — existing code names (`getReps`, `RepsContext`) would fail the gate.
- `neverStage` includes `.env.*`, which also matches the tracked, secret-free `.env.example`; stage it deliberately, never by glob.
- Pushing `main` triggers a Vercel deploy of `shx-lead-tracker.vercel.app`. `.snowflake/`, `docs/`, `CONTEXT.md`, `DESIGN.md` and `AGENTS.md` don't affect the build, but keep the build gate green before pushing.

## Next Session
- Smoke-test in a real browser after the next deploy. As a **Pro** (private window; Magistrate has no logout): change a status, add a note, log an activity, edit an activity credited to another rep. As a **Manager**: reassign a lead, use "View as" a Pro (picker lists Pros, not you; a viewed-as Pro's own activities are now editable), open Admin/Team/Unassigned and check the red buttons (Reclaim, Offboard, Revert) and the font still look right.
- The s3 part 2 refactor (roles module, `repId`, `--danger`, `next/font`, `.dark` removed, `--header-muted` 62%) is committed locally and **not pushed**; push only after the browser smoke-test above.

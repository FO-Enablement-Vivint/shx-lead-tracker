# shx-lead-tracker — project memory

## Session State
- **Session:** 2026-11-11 (s1, start) · `main` · repo cloned from FO-Enablement-Vivint/shx-lead-tracker, project-context-kit bootstrapped, local env set up. No feature work yet.

## Gotchas
- `.env` (git-ignored) holds all local secrets; `preinstall` sources it as shell, so values containing `&` must stay single-quoted.
- Vercel env vars for this project are all Sensitive/hidden — `vercel env pull` returns only `VERCEL_OIDC_TOKEN`. Get secrets from the owner, not Vercel.
- `AGENTS.md`'s Next.js block is rewritten by `next dev`; add project sections below its END marker only.

## Next Session
- Run `npm run dev` and confirm Magistrate sign-in + roster gate work locally (`APP_USER_EMAIL` must be an active SHX Team row).
- Populate `CONTEXT.md` (Pro, Self-Gen, Reclaim, Revert Pro, Offboard, Roster, Manager/Pro roles) and `DESIGN.md` (Pro theme vs scoped `.manage` dark theme).

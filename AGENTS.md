# AI Agent Instructions

## Source of truth

- Read this file first, then `docs/ARCHITECTURE.md` before changing application behavior, database schema, authorization, or deployment configuration.
- `README.md` is the operator quick start. Other `GHI-CHU-*`, `GHI_CHU_*`, and branch guides are handoff notes, not authoritative architecture. Verify their claims against the code and migrations.
- For runtime behavior, current code is authoritative. For database history, inspect every migration in order. If code, docs, and database assumptions disagree, report the mismatch and do not silently choose one.
- The local working tree may contain unfinished or unapplied work. Run `git status --short` first and preserve changes you did not make.

## Project conventions

- Stack: Next.js App Router, TypeScript, React, Supabase Auth/Postgres, deployed through Vercel.
- Server Components and Server Actions use `lib/supabase/server.ts`. Client Components use `lib/supabase/browser.ts`.
- `lib/supabase/admin.ts` uses the Supabase service-role key. Keep it server-only; prefer the signed-in user's client when RLS supports the operation.
- `lib/auth.ts` is the shared current-user/role helper. Do not treat a hidden navigation link as authorization. Enforce admin access in the server action or route and in database policies where appropriate.
- Keep product changes in the owning `app/<area>` route and reuse existing Supabase clients and conventions.

## Database and migrations

- Add a new, uniquely numbered migration under `supabase/migrations/`; inspect the full directory first. Never renumber or rewrite a migration that may already have run on a shared database. Fix deployed schemas with a forward migration.
- Migrations must account for table privileges and RLS separately. A `GRANT` does not replace an RLS policy; an RLS policy does not grant SQL privileges.
- Review policies for every new table, view, and write path. Treat `DROP ... CASCADE`, broad grants, triggers, and default privileges as high-impact changes; explain their scope and avoid them unless required.
- A migration file in Git does not prove it ran. Track local, staging, and production application status separately; only report a database change as applied when the operator confirms it or an authoritative check verifies it.
- Never put `.env.local`, Supabase keys, passwords, tokens, or customer data in Git, logs, docs, or tool output. The service-role key must never reach browser code.

## Verification and shipping

- Run the narrowest relevant check, then `npm run build` for application changes when practical.
- For database-backed behavior, test the actual operation and reload/read it back. A successful build does not validate a migration or RLS policy.
- Before committing, inspect `git diff` and `git status`; stage explicit paths only. Do not include unrelated or unfinished files.
- Commit or push only when the user explicitly asks. Do not claim production is updated until the Vercel deployment is verified.
- Next.js is pinned in `package.json`; review current security advisories before changing the version, and use a patched version compatible with this app.

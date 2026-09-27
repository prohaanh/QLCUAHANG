-# QLCuaHang
+# QLCuaHang
+
+Ứng dụng quản lý cửa hàng sửa chữa phần cứng: khách hàng, sản phẩm, dịch vụ, tồn kho, người dùng và đơn hàng.
+
+## Canonical project docs
+
+- [`AGENTS.md`](AGENTS.md): instructions for AI coding agents, security boundaries, migration and verification rules.
+- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): route map, auth/RLS design, data domains, migration inventory, known gaps, and observed deployment status.
+- `GHI-CHU-*`, `GHI_CHU_*`, and branch-specific guides are handoff notes. Verify them against current code and migrations before treating them as current state.
+
+## Stack
+
+- Next.js App Router, React, TypeScript
+- Supabase Auth and Postgres with Row Level Security
+- Vercel deployment
+
+## Local development
+
+Requirements: Node.js and npm.
+
+```powershell
+npm ci
+Copy-Item .env.example .env.local
+npm run dev
+```
+
+Fill these variables in `.env.local` before starting the app:
+
+| Variable | Use |
+| --- | --- |
+| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
+| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/server session client |
+| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations; never expose or commit |
+
+Open `http://localhost:3000`. Never paste real keys into source code, docs, chat, or Git. `.env.local` is private and must remain untracked.
+
+## Main routes
+
+| Route | Purpose |
+| --- | --- |
+| `/` | Dashboard |
+| `/login` | Sign in |
+| `/admin/users` | Admin user management |
+| `/admin/products` | Product, service, category, and stock management |
+| `/customers` | Customer list |
+| `/customers/new` | Add a customer |
+| `/customers/[id]` | Customer details, tier, orders, licenses, and follow state |
+
+See `docs/ARCHITECTURE.md` for access rules and implementation status. A route or hidden link is not proof that server-side authorization is correct.
+
+## Database setup
+
+For a brand-new database, start with `supabase/schema.sql`, then review and apply the numbered migrations in order. For an existing database, do not rerun the baseline schema blindly; inspect which migrations have already been applied and run only the missing forward changes.
+
+Migrations are manual SQL. A migration file in Git does not mean it ran on Supabase. Confirm execution against the intended project before deploying code that depends on it. The current migration inventory and known execution status are in `docs/ARCHITECTURE.md`.
+
+## Verification
+
+```powershell
+npm run build
+```
+
+For database-backed changes, also test the authenticated operation and reload/read the affected data. A successful build does not verify database privileges, RLS, triggers, or live migration status.
+
+## Deployment
+
+Configure the three environment variables in Vercel using the intended Supabase project. Pushes to the connected GitHub branch may trigger a deployment. Verify the Vercel build and live behavior before considering a change deployed. Apply required database migrations separately before enabling dependent routes.
+
+## Security notes
+
+- Authorization must be enforced in server actions/routes and by appropriate database privileges and RLS policies; navigation visibility is not a security boundary.
+- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Use only in server-only code when required.
+- `005_grant_authenticated_full.sql` grants broad SQL privileges to the `authenticated` role. RLS must remain enabled and correct; review this scope before adding tables or changing policies.
+- The project currently pins Next.js in `package.json`. Review current security advisories and use a patched compatible release before production shipping.

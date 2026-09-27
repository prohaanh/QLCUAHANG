# System Architecture

> Snapshot reviewed 2026-09-27. This describes the local tree, not a claim that every local change is deployed.

## Purpose and stack

QLCuaHang is an internal shop-management web app for customers, products, services, stock, users, orders, and software licenses.

- Next.js 14 App Router, React 18, TypeScript
- Supabase Auth, Postgres, Row Level Security, and `@supabase/ssr`
- Vercel deployment
- Package scripts: `npm run dev`, `npm run build`, `npm start`

## Runtime map

| Route | Responsibility | Access intent |
| --- | --- | --- |
| `/` | Dashboard counts and expiring licenses | Authenticated |
| `/login`, `/logout` | Sign-in and sign-out | Public login; logout clears session |
| `/admin/users` | User roles, active state, job-function assignments | Admin |
| `/customers` | Customer list and tier badges | Authenticated |
| `/customers/new` | Create a customer | Authenticated |
| `/customers/[id]` | Customer details, tier/spend, orders, licenses, follow state | Authenticated |
| `/admin/products` | Product/service catalog, categories, stock entry | Admin intent; local implementation needs the guard review below |

Authentication routing is in `middleware.ts`. It redirects unauthenticated requests to `/login`, but it does not by itself authorize admin operations.

## Authentication and authorization

- `lib/supabase/browser.ts`: browser client using the public URL and anon key.
- `lib/supabase/server.ts`: cookie-backed server client using the public URL and anon key.
- `lib/supabase/admin.ts`: server-only service-role client. Never import it into client code.
- `lib/auth.ts`: resolves the Supabase Auth user and reads `public.users`; it first matches `users.id`, then attempts the legacy `auth_user_id` link. Missing profile/role currently falls back to `nhan_vien`.
- Database RLS policies are defined in the migrations. UI visibility is not an access-control boundary; protect server actions and database writes independently.

### Authorization gap to verify

The local `app/admin/products/actions.ts` currently resolves an admin profile using only `users.auth_user_id`, while `lib/auth.ts` supports `users.id` as the primary relationship. The product page also loads without an explicit admin guard. Before treating this route as admin-only in production, verify the actual profile key and enforce the admin check server-side. The product server actions do check for admin, but their Supabase write errors are not consistently checked.

## Data domains

- `users`: application profile linked to Supabase Auth; roles are `admin` and `nhan_vien`.
- `customers`: contact and identity fields, notes, and active/follow state.
- `customer_tiers`: spend thresholds and discounts. `customer_tier_view` calculates 12-month paid-order spend and current tier.
- `products`, `services`, `product_categories`: catalog and shared categorization.
- `inventory_movements`: stock ledger. Database triggers update `products.stock_qty`, prevent negative stock, and deduct stock for paid or fulfilled orders.
- `orders`, `order_items`: order headers and line items. `fulfillment_status` distinguishes in-stock goods, backorders, and delivered goods.
- `licenses`, `license_status`: license records and computed expiry status.
- `job_functions`, `user_job_functions`: staff work-function assignments.

The initial `supabase/schema.sql` predates authentication and later features. Do not treat it as the complete current schema; migrations are the incremental change history.

## Migration inventory and observed status

Migration numbering must remain unique. Inspect this list before adding another migration.

| Migration | Purpose | Status known from this workspace |
| --- | --- | --- |
| `supabase/schema.sql` | Initial business tables and temporary policies | Historical baseline; may not match live schema by itself |
| `002_dang_nhap_phan_quyen.sql` | Auth linkage, trigger, initial role policies | Present; earlier operator notes say applied |
| `003_chuc_nang_va_khoa_tai_khoan.sql` | Job functions, active users, related RLS | Present; earlier operator notes say applied |
| `004_grant_users_select.sql` | `SELECT` privilege on `users` | Committed; operator later applied broader `005` |
| `005_grant_authenticated_full.sql` | Broad table/sequence grants and default privileges | Operator confirmed success; broad privileges still rely on RLS for row authorization and should be reviewed before expanding further |
| `006_normalize_user_job_function_column.sql` | Rename legacy `function_id` to `job_function_id` when needed; reload PostgREST schema | Operator confirmed success |
| `007_hang_khach_hang.sql` | Default customer tiers and `customer_tier_view` | Operator confirmed success before customer feature push |
| `008_nhom_va_ton_kho.sql` | Product categories, order fulfillment state, inventory ledger and triggers | Operator confirmed successful application to Supabase on 2026-09-27 |
| `009_xoa_nhom_set_null.sql` | Set category references to null when a category is deleted | Operator confirmed successful application to Supabase on 2026-09-27 |

Never infer live database state from filenames or code. Confirm with the operator or query the intended Supabase project.

## Current implementation and deployment boundary

Commit and deployment state changes over time. Inspect `git status`, local history, and `origin/main` before describing local work as pushed. Verify the Vercel deployment separately before describing code as live. The operator confirmed migrations `008` and `009` ran successfully on Supabase on 2026-09-27; this does not by itself confirm that the matching application commit is deployed.

The local admin layout contains a `Quản lý sản phẩm` link to `/admin/products`. A matching link does not prove the route's database migrations or authorization are ready in production.

## Known limitations and follow-ups

- Product authorization uses a legacy profile-link assumption; reconcile it with `lib/auth.ts` and the live schema.
- `inventory_movements` currently has an all-operations RLS policy for every authenticated user. The admin-only product server action is not sufficient protection against direct Supabase API writes; review and tighten the policy before treating stock changes as admin-only.
- Product server actions should surface Supabase errors for create/update operations instead of silently revalidating.
- Product and stock routes depend on migrations `008` and `009`; verify both ran in the target database before enabling the feature there.
- The stock ledger relies on database triggers. Test paid orders, backorders, delivery, and negative-stock rejection against a non-production database before release.
- `005_grant_authenticated_full.sql` grants broad SQL privileges to `authenticated`, including defaults for future tables. RLS is still required and should be audited for every table.
- `package.json` pins Next.js `14.2.15`; review and upgrade to a patched compatible release before production shipping.
- Legacy root-level files such as `route.ts`, `auth.ts`, and duplicate Supabase clients may not be active routes. Trace imports/callers before extending them; avoid adding another parallel implementation.

## Change and deploy workflow

1. Read `AGENTS.md`, this document, and the owning route/action/migration before editing.
2. Check `git status --short`; preserve user changes.
3. For a database change, add a forward migration with the next unused number, review RLS and SQL grants, and record the required manual apply step.
4. Run the relevant type/build check. For data behavior, perform an authenticated operation and read the result back.
5. Commit/push only when requested. Vercel may deploy from GitHub, but verify the actual deployment before calling it live.

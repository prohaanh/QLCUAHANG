# System Architecture

> Snapshot reviewed 2026-10-01. This describes the local tree, not a claim that every local change is deployed.

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
| `/admin/products` | Product/service catalog, categories, stock entry | Page and Server Actions use the shared `getCurrentUser()` admin check; inventory RLS still allows authenticated direct writes |
| `/admin/products/[id]/history` | Read inventory movements for one product | Authenticated |
| `/admin/products/scan` | Barcode lookup and quick product/stock entry | Admin intent; client-side Supabase writes |
| `/orders` | Recent orders and create-order entry point | Authenticated |
| `/orders/[id]` | Order items, payment state, and fulfillment state | Authenticated |
| `/customers/scan` | Parse CCCD QR and find/create a customer | Authenticated; client-side Supabase writes |

Authentication routing is in `middleware.ts`. It redirects unauthenticated requests to `/login`, but it does not by itself authorize admin operations.

## Authentication and authorization

- `lib/supabase/browser.ts`: browser client using the public URL and anon key.
- `lib/supabase/server.ts`: cookie-backed server client using the public URL and anon key.
- `lib/supabase/admin.ts`: server-only service-role client. Never import it into client code.
- `lib/auth.ts`: resolves the Supabase Auth user and reads `public.users`; it first matches `users.id`, then attempts the legacy `auth_user_id` link. Missing profile/role currently falls back to `nhan_vien`.
- Database RLS policies are defined in the migrations. UI visibility is not an access-control boundary; protect server actions and database writes independently.

### Authorization gap to verify

The product page and Server Actions use the shared `getCurrentUser()` admin guard. However, `inventory_movements` RLS permits all authenticated users to write directly, so the Server Action guard does not prevent direct API writes. Tightening that policy remains a security follow-up.

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
| `010_order_totals_and_terminal_states.sql` | Recalculate order totals from lines; enforce terminal payment/cancel states and lock paid order lines | Operator confirmed successful application to Supabase on 2026-10-01 |

Never infer live database state from filenames or code. Confirm with the operator or query the intended Supabase project.

## Current implementation and deployment boundary

Commit and deployment state changes over time. Inspect `git status`, local history, and `origin/main` before describing local work as pushed. Verify the Vercel deployment separately before describing code as live. The operator confirmed migrations `008` and `009` ran successfully on Supabase on 2026-09-27; this does not by itself confirm that the matching application commit is deployed.

The local admin layout contains a `Quản lý sản phẩm` link to `/admin/products`. A matching link does not prove the route's database migrations or authorization are ready in production.

## Known limitations and follow-ups

- Product pages and Server Actions use the shared `getCurrentUser()` admin check. Direct database authorization still depends on RLS.
- `inventory_movements` currently has an all-operations RLS policy for every authenticated user. The admin-only product server action is not sufficient protection against direct Supabase API writes; review and tighten the policy before treating stock changes as admin-only.
- Demo records created on Supabase 2026-10-01: service `DEMO-20261001-DICH-VU-001` (10,000) and product `DEMO-20261001-PRODUCT-001` (5,000, opening stock 5). Initial stock history was read back.
- Product and stock routes depend on migrations `008` and `009`; the operator confirmed both ran on Supabase on 2026-09-27. Verify the target project when deploying to another environment.
- The stock ledger relies on database triggers. Test paid orders, backorders, delivery, and negative-stock rejection against a non-production database before release.
- Demo order `41fe289b-8358-49f0-85aa-1f3b90a7715c`: product 3 × 5,000 plus service 2 × 10,000; stored total read back at 35,000. Removing/re-adding the service changed stored total 35,000 → 15,000 → 35,000.
- Paying that demo order reduced product stock 5 → 2 and created one `inventory_movements` row `xuat -3`. A preorder demo order for quantity 4 with stock 2 was cancelled; stock remained 2 with no new movement. Rapid double-click payment on another demo order created one `xuat -1`, reducing stock 2 → 1.
- Earlier orders dated 2026-09-28 are still present and have not been classified or cleaned up. Do not modify them without operator review.
- Local order code uses database prices for products/services, manual license-line price snapshots, integer quantities, and terminal paid/cancelled states. Migration `010` was operator-confirmed applied; the license snapshot and direct API rejection paths remain untested.
- Local scanner checks on 2026-09-28: both scan routes compiled and rendered; synthetic barcode/CCCD input reached the expected form without saving. Existing customer code uses `name` and `phone`; `cccd` lookup succeeded. Camera permission, a real CCCD QR, and database writes remain unverified.
- `updateItemFulfillment` comments imply stock is deducted on delivery only after payment, but `auto_deduct_stock_on_fulfilled()` in migration `008` does not check the parent order status. Reconcile the intended behavior and trigger before testing fulfillment writes.
- `005_grant_authenticated_full.sql` grants broad SQL privileges to `authenticated`, including defaults for future tables. RLS is still required and should be audited for every table.
- `package.json` pins Next.js `14.2.15`; review and upgrade to a patched compatible release before production shipping.
- Legacy root-level files such as `route.ts`, `auth.ts`, and duplicate Supabase clients may not be active routes. Trace imports/callers before extending them; avoid adding another parallel implementation.

## Change and deploy workflow

1. Read `AGENTS.md`, this document, and the owning route/action/migration before editing.
2. Check `git status --short`; preserve user changes.
3. For a database change, add a forward migration with the next unused number, review RLS and SQL grants, and record the required manual apply step.
4. Run the relevant type/build check. For data behavior, perform an authenticated operation and read the result back.
5. Commit/push only when requested. Vercel may deploy from GitHub, but verify the actual deployment before calling it live.

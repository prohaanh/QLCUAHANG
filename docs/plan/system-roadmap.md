# QLCuaHang System Roadmap

This is the shared execution index for the nine requested workstreams. Implement in order, keep unverified database work visible, and do not label a step `Verified` until its acceptance tests pass in an appropriate test environment. Update this index after each step; update `docs/index.md` only when the documentation map changes.

## Status key

- `In progress`: implementation is underway.
- `Blocked`: waiting for an explicit product/security decision or external prerequisite.
- `Pending`: not started.
- `Verified`: acceptance checks pass in an appropriate test environment.

## Master progress index

| # | Workstream | Status | Completion evidence |
| --- | --- | --- | --- |
| 1 | [Products, services, and quick entry](#1-products-services-and-quick-entry) | In progress | Demo product/service created; initial stock read back through history. Build/type checks pass. Edit/category/RLS acceptance remains. |
| 2 | [Multi-line orders and one-time payment](#2-multi-line-orders-editing-and-one-time-payment) | In progress | Demo order mixed product/service total read-back, open-order edit, payment stock movement, preorder cancel, and double-click payment verified; migration 010 applied. API-level guard and license-price cases remain. |
| 3 | [Tier discounts and history](#3-tier-discounts-upgrade-notices-and-tier-history) | Pending | Tier lookup exists; order discount, upgrade notice and tier history remain unimplemented. |
| 4 | [Preorders and deposits](#4-preorders-and-deposits) | Pending | Requires explicit deposit, refund and stock-recognition rules before schema work. |
| 5 | [Per-order payment QR](#5-per-order-payment-qr) | Pending | Requires payment-provider, confirmation, expiry and reconciliation decisions. |
| 6 | [Barcode/QR scanning and warranty lookup](#6-barcodeqr-scanning-for-products-and-warranty-lookup) | Pending | Synthetic scanner paths work locally; camera, real scans, warranty lookup and writes remain unverified. |
| 7 | [Software licenses and expiry reminders](#7-software-licensesaccounts-and-expiry-reminders) | Pending | License records/status exist; reminder schedule, channels and secret-access controls remain open. |
| 8 | [Staff quick requests](#8-staff-quick-requests-zalotelegramin-app) | Pending | Existing schema is not a complete request/approval/notification workflow. |
| 9 | [Backup, reconciliation, offline, and PWA](#9-backup-reconciliation-offline-mode-and-pwa) | Pending | Restore, reconciliation, offline conflict handling and PWA acceptance are not verified. |

## 1. Products, services, and quick entry

**Status:** In progress

**Scope:** Product and service catalog CRUD, categories, fast manual/barcode entry, stock intake through the inventory ledger, validation, and visible operation errors.

**Dependencies:** Migrations `008` and `009` (operator-confirmed applied); scanner pages exist locally and are separately tracked in the current handoff.

**Current implementation:** Product create/edit and stock intake exist. Service create/edit, category assignment, shared admin authorization, and visible action errors for product/service/category forms were implemented locally. A basic barcode quick-entry route also exists under step 6.

**Acceptance:** Admin can create/edit a product and service; category assignment works; new stock enters through `inventory_movements`; invalid input and Supabase errors are visible; customer-facing staff permissions match the agreed role policy; build passes; create/edit and read-back verified against a test database.

**Demo verification (2026-10-01):** Created `DEMO-20261001-PRODUCT-001` through barcode quick entry at 5,000 with opening quantity 5; history read-back confirmed `Nhập kho +5`. Created `DEMO-20261001-DICH-VU-001` at 10,000 and read it back on the catalog page. These tests used the Supabase project the operator designated for demo data.

**Remaining verification:** Product/service edit, category assignment, and validation/error cases still need test coverage. The `inventory_movements` policy permits writes by all authenticated users; the accepted risk is not considered security-complete.

## 2. Multi-line orders, editing, and one-time payment

**Status:** In progress

**Scope:** One order can contain products, services, and licenses; open orders can be edited; a single payment transition settles the order and its lines consistently.

**Dependencies:** Step 1 catalog, order schema, stock triggers.

**Current behavior added locally:** Create an order for an active customer or walk-in; add product/service/license lines; choose integer quantity; product/service prices are re-read server-side; license price is entered manually and stored as an order-line snapshot; edit/remove lines only while open; paid and cancelled statuses are terminal; duplicate payment requests are idempotent; migration 010 maintains `orders.total` and enforces lifecycle rules.

**Policy for this step:** Cancellation is available only before payment. Paid orders cannot be reopened or cancelled from this workflow. Refunds are not implemented and require a separate auditable workflow.

**Acceptance:** Mixed-line order can be created; open lines can be added/removed; line quantity and server catalog prices are correct; total matches line sum; repeated/concurrent payment requests cause one state transition and one stock deduction; paid/cancelled orders reject edits; stock ledger read-back matches expected amounts.

**Demo verification (2026-10-01):** On demo order `41fe289b-8358-49f0-85aa-1f3b90a7715c`, added 3 products at 5,000 and 2 services at 10,000; stored total read back as 35,000. Removing/re-adding the service moved the stored total 35,000 → 15,000 → 35,000. Payment changed product stock 5 → 2 and added one `xuat -3` history row. A second demo order with quantity 4 against stock 2 became `dat_truoc`; cancelling it left stock/history unchanged. A rapid double-click payment on a third order resulted in one `xuat -1` movement and stock 2 → 1. The operator designated this Supabase project for demo testing.

**Remaining verification:** Migration `010_order_totals_and_terminal_states.sql` was confirmed applied by the operator on 2026-10-01. Still test license price snapshots and direct/API attempts to reopen a paid/cancelled order or edit paid line details. Earlier dev-server POSTs from 2026-09-28 are separate existing records and have not been classified; do not delete or alter them without review.

## 3. Tier discounts, upgrade notices, and tier history

**Status:** Pending

**Scope:** Apply the eligible tier discount to an order, notify when a customer reaches a higher tier, and preserve an auditable tier-change history.

**Dependencies:** Customer tiers, order totals and payment lifecycle from steps 2 and 4.

**Acceptance:** Discount basis and rounding are explicit; tier evaluation is deterministic; notifications do not duplicate on retries; history records old/new tier, effective time, source transaction, and actor/system source.

## 4. Preorders and deposits

**Status:** Pending

**Scope:** Distinguish preorder items, deposits, remaining balance, fulfillment, and final settlement.

**Dependencies:** Order/payment model from step 2 and inventory triggers from step 1.

**Decision required before schema implementation:** Whether deposits are order-level or line-level; whether multiple deposits/refunds are allowed; when revenue and stock are recognized.

**Acceptance:** Deposit and balance are auditable; partial payment does not falsely mark an order fully paid; stock changes only at the agreed business event; failure/retry paths are idempotent.

## 5. Per-order payment QR

**Status:** Pending

**Scope:** Generate a payment QR tied to an order and reconcile payment confirmation safely.

**Dependencies:** Stable order balance and payment state from steps 2 and 4.

**Decision required:** Payment provider/bank format, webhook or manual confirmation source, expiration, under/overpayment handling, and signature verification.

**Acceptance:** QR encodes a unique order reference and exact due amount; untrusted client callbacks cannot mark orders paid; duplicate callbacks are idempotent; reconciliation is auditable.

## 6. Barcode/QR scanning for products and warranty lookup

**Status:** Pending

**Scope:** Product creation/lookup by barcode, warranty lookup, and CCCD QR customer creation where authorized.

**Current local evidence:** Scanner routes and synthetic-input checks are recorded in `GHI_CHU_CAC_BUOC.md`; camera and database writes remain unverified against a test environment.

**Acceptance:** Camera permission/HTTPS behavior tested on target devices; hardware scanner input works; duplicate barcode/CCCD behavior is clear; warranty lookup uses the stored sale/order date and warranty policy; no real customer data is logged.

## 7. Software licenses/accounts and expiry reminders

**Status:** Pending

**Scope:** Manage license/account records, customer/order association, expiry status, and scheduled reminders.

**Dependencies:** Customer/order identity and an agreed notification channel/schedule.

**Decision required:** Reminder intervals, timezone, delivery channels, retry/acknowledgement, and treatment of secret license keys.

**Acceptance:** Secrets are never exposed in broad list queries or logs; expiry calculation is timezone-defined; reminders are deduplicated and observable; access is role-restricted.

## 8. Staff quick requests (Zalo/Telegram/in-app)

**Status:** Pending

**Scope:** Staff can submit requests for missing catalog/customer data; admins review and approve/reject; notifications reach agreed channels.

**Dependencies:** User roles, catalog, notification configuration.

**Decision required:** Which channel is authoritative, bot credentials/ownership, retention, and approval behavior when a notification fails.

**Acceptance:** Request state transitions are auditable; unauthorized users cannot approve; webhook tokens stay server-side; retries do not duplicate requests/messages.

## 9. Backup, reconciliation, offline mode, and PWA

**Status:** Pending

**Scope:** Recoverable backups, business reconciliation, offline-safe workflows, and installable PWA behavior.

**Dependencies:** Stable order/payment/inventory ledger and defined source of truth from steps 1-8.

**Decision required:** Recovery objectives, backup owner/retention, offline conflict policy, queued-write semantics, and supported devices.

**Acceptance:** Restore drill is demonstrated; sales/payment/stock reconciliation reports agree with ledgers; offline writes have unique IDs and conflict handling; sensitive data is not cached indiscriminately; PWA install/update behavior is tested.

## Execution record

| Step | Evidence | Remaining work |
| --- | --- | --- |
| 1 | Demo product/service created; initial stock movement read back. TypeScript/build pass. | Exercise edit/category/error paths; review broad `inventory_movements` RLS write policy. |
| 2 | Mixed product/service total, open-order edit, payment stock movement, preorder cancellation, and rapid double-click behavior verified on demo records; migration 010 applied; build passes. | Verify license price snapshot and direct API rejection of paid/cancelled mutations. Classify old 2026-09-28 demo/test orders before any cleanup. |

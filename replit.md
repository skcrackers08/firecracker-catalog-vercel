# S K Crackers

## Overview

S K Crackers is an e-commerce web application specializing in selling firecrackers and sparklers online, primarily targeting the Indian market. The project aims to provide a comprehensive online storefront for festive products with features such as product catalog browsing, detailed product pages, an in-memory shopping cart, a persistent and shareable wishlist, and a streamlined checkout process.

Key capabilities include:
- A wide range of festive products like sparklers, chakkars, flower pots, and rockets.
- Detailed product information including images and videos.
- Customer accounts with registration, login, phone OTP verification, and order history.
- An administrative panel for product management (CRUD operations).
- Partner functionalities including wallet management, transaction history, and referral tracking.

The business vision is to offer a convenient and engaging platform for customers to purchase festive items, enhancing their celebration experience. The project emphasizes user experience, robust backend functionality, and a scalable architecture.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Monorepo Layout

The project uses a TypeScript monorepo structure, separating `client/` (React SPA), `server/` (Express backend), and `shared/` (common types and schemas). This setup ensures type safety and consistency across the frontend and backend by sharing schemas and API contracts.

### Frontend Architecture

- **Framework & Build:** React 18 with Vite.
- **Routing:** `wouter` for lightweight client-side routing.
- **State Management:** TanStack Query (React Query v5) for server state; React Context for UI and cart state. Wishlist state is persisted in `localStorage`.
- **UI/UX:**
    - **Components:** `shadcn/ui` (built on Radix UI and Tailwind CSS), augmented with custom festive-themed components.
    - **Animations:** Framer Motion for page transitions, gestures, and scroll effects. `react-confetti` for post-purchase celebrations.
    - **Theming:** A deep black festive dark theme with gold primary, festive red secondary, and orange accents. Uses Google Fonts (Bebas Neue for display, Plus Jakarta Sans for body).
    - **Forms:** React Hook Form with Zod resolvers for validation.
    - **Icons:** Lucide React and `react-icons` for various icons, including payment brand logos.
- **Currency Handling:** Postgres `numeric` columns are cast to `Number` on the frontend for calculations and formatted with `toFixed(2)`.
- **Checkout Flow:** The in-app payment has been removed. The checkout flow now leads to an "ORDER ENQUIRY" page with a "Send Enquiry on WhatsApp" button, pre-filling customer and item details.
- **Renamed Terminology:** Cart → Enquiry, Orders → My Requests, BUY NOW → BOOK NOW, ADD TO CART → ADD TO ENQUIRY, etc., to align with an enquiry-based sales model.
- **Floating WhatsApp Icon:** A persistent WhatsApp icon is displayed on all pages, linking to a configurable number.
- **Tax/Charges:** "GST (18%)" replaced with "Handling Charges (3%)" across the application, with the `gstAmount` DB column now storing this 3% value.
- **Partner Page Enhancements:**
    - Wallet Transaction History card is always visible, displaying Withdrawals and Wallet Purchases.
    - Product purchase is a 3-step modal workflow: wallet amount → product selection → customer/delivery details. Confirmed purchases open WhatsApp with order details and immediately decrement the wallet.
    - Withdrawal modal also opens WhatsApp and decrements the wallet immediately.
    - Added dedicated sub-screens for Wallet History, Referral Earnings, and Bank Details accessible from the Partner page, with filtering, totals, and CSV download capabilities.

### Backend Architecture

- **Framework & Language:** Express 5 in TypeScript, run with `tsx` in development.
- **Entry Point:** `server/index.ts` registers API routes.
- **Data Access:** `DatabaseStorage` class (in `server/storage.ts`) abstracts Drizzle ORM queries behind an `IStorage` interface.
- **API Routes:** Defined in `server/routes.ts`, leveraging `shared/routes.ts` for typed API manifests to ensure client-server synchronization.
- **Database Seeding:** `seedDatabase()` populates default products on startup if the table is empty.
- **Static Serving:** Serves Vite build output in production; integrates Vite middleware in development.
- **Body Size Limit:** 50 MB to accommodate potential future image/video uploads.
- **Notifications System:**
    - A `notifications` table stores notifications (customerId, type, title, message, link, isRead, createdAt).
    - Server hooks generate notifications for order events, referral credits, and wallet transactions.
    - Customer endpoints for fetching, marking as read, and reading all notifications.
    - `NotificationBubble` component (event-driven) displays notifications, marks them as read after a delay, and provides click-through links.
    - Admin broadcast functionality to send notifications to all customers with role-based access.
- **Admin Panel Enhancements:**
    - **Order Edit Dialog:** Transport/dispatch fields moved to a separate sub-dialog. Includes auto-fill for destination and remarks, and a "Save & Generate Transport Bill PDF" button.
    - **Email Invoice:** Button added to OrderEditDialog; triggers `POST /api/admin-pro/orders/:id/email-invoice`. Invoice email sending is now triggered by admin confirmation of an order, not automatically on creation.
    - **Wallet Rejection Workflow:** Admin can select predefined rejection remarks, which are stored and surfaced to the customer.
    - **Receipt Label Changes:** Updated labels for withdrawals and purchases, removed UPI line from bank details.
    - **Email Security:** HTML escaping for dynamic fields in wallet transaction emails.

### Database

- **Engine & ORM:** PostgreSQL (`pg` / `node-postgres`) with Drizzle ORM.
- **Schema:** Defined in `shared/schema.ts`.
- **Migrations:** Managed with Drizzle Kit.
- **Tables:** `products`, `orders`, `customers`, `notifications`, `app_settings`, `offers`, `referral_uses`, `staff`, `stock_movements`, `user_sessions`, `wallet_transactions`.
- **Zod Schemas:** Auto-generated from Drizzle definitions for client and server validation.
- **Hosting:**
    - **Replit deployment** continues to use the Replit-managed Postgres (`DATABASE_URL` provided by Replit).
    - **Vercel deployment** uses **Neon Postgres**. The schema + data were migrated via `pg_dump --inserts --column-inserts --no-owner --no-acl` (the file lives at `migrations/replit_to_neon_full.sql` for reference). No code changes were needed: `server/db.ts` and the `connect-pg-simple` session store both read `DATABASE_URL`, and Neon's URL ships with `?sslmode=require` so TLS is automatic.
    - To re-run the migration on a fresh Neon project: `psql "$NEON_URL" -f migrations/replit_to_neon_full.sql`.

### Authentication

- **Admin Panel:** Client-side password check for basic access.
- **Customer Accounts:** Session-based authentication using `express-session` and `memorystore`.
    - Passwords hashed with `crypto.scryptSync`.
    - Phone OTP verification: 6-digit code with 10-minute expiry, sent via configurable SMS gateway (StartMessaging or Fast2SMS) or displayed on-screen as a fallback. Normalizes phone numbers to E.164.
- **Admin Pro (staff portal at `/admin-pro`):** Per-user menu permissions.
    - `staff.permissions` (JSON-string array) lists which sidebar IDs each non-superadmin can see; the `/api/admin-pro/me` endpoint parses it to `string[]`.
    - Superadmins always see every menu, including the Staff tab. Non-superadmins always see Dashboard plus only the menus listed in `permissions`.
    - PATCH `/api/admin-pro/staff/:id` accepts `permissions: []` to clear access.
- **Transport bills:** Admin uploads a PDF in the Transport / Dispatch dialog → POST `/api/admin-pro/orders/:id/transport-bill { pdfBase64, filename }` (≤5 MB). The PDF is stored as a data URL in `orders.transportBillUrl`, a customer notification is created, an email with the PDF attachment is sent (when `customerEmail` exists), and the admin UI opens WhatsApp with a link.
    - List endpoints (`/api/admin-pro/orders`, `/api/customers/orders`) strip the large `transportBillUrl` blob and expose only `hasTransportBill: boolean` plus filename/sentAt metadata; the full PDF is served on demand from `/api/customers/orders/:id/transport-bill` (auth + ownership enforced; supports `?download=1`).
    - Customer route `/transport-bill/:id` (`client/src/pages/TransportBillView.tsx`) iframes the PDF and provides a download button. The "My Requests" page shows a Transport Bill button when `hasTransportBill` is true.
    - Transport tab status is derived: `confirmed` iff both `lorryName` and `lrNumber` are filled, else `pending`.

## External Dependencies

- **PostgreSQL** (`pg`, `drizzle-orm`): Primary data store.
- **Drizzle Kit**: Schema migrations.
- **Google Fonts**: Custom typography.
- **Unsplash**: Default product images for seed data.
- **UPI Deep Links** (PhonePe, GPay, Paytm): Mobile payment initiation.
- **Framer Motion**: Animations.
- **react-confetti**: Post-purchase effect.
- **TanStack Query v5**: Server state management.
- **Radix UI**: Accessible UI primitives.
- **shadcn/ui**: Component library.
- **Tailwind CSS**: Styling framework.
- **wouter**: Client-side routing.
- **Zod**: Runtime validation.
- **React Hook Form**: Form management.
- **react-icons**: Payment brand icons.
- **Vite**: Frontend bundler and dev server.
- **esbuild**: Server bundler for production.
- **SMS Gateways**: StartMessaging or Fast2SMS for OTPs.

**Environment Variables Required:**
- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET` (recommended): signing key for session cookies. Falls back to a hard-coded dev secret if absent — set this in production.
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`: Gmail SMTP credentials for invoice / wallet / transport-bill emails (optional — Brevo SMTP is also supported via `BREVO_*` vars).
- `OPENAI_API_KEY`: enables the AI chat / assistant features (optional; the admin can also store a key in Settings).
- `START_MSG_API_KEY` / `FAST2SMS_API_KEY`: SMS-gateway keys for OTP delivery (either one works; on-screen fallback if neither is set).

## Deployment

The project is set up to deploy to two targets from the same codebase:

### Replit (autoscale)
- `npm run build` → `script/build.ts` produces:
  - `dist/index.cjs` — long-lived Node entry (used by Replit's autoscale deployment and `npm run start`).
  - `dist/serverless.cjs` — Vercel serverless wrapper of the same Express app.
  - `dist/public/` — Vite build of the React SPA.
- Runs `NODE_ENV=production node dist/index.cjs`.

### Vercel (serverless via single Express handler)
- `vercel.json` configures `buildCommand: npm run build`, `outputDirectory: dist/public`, and a catch-all SPA rewrite.
- `api/[...path].js` is a thin Vercel function that `require()`s `dist/serverless.cjs` (the bundled Express app). All `/api/*` requests land in Express; everything else is served as static SPA assets with `index.html` fallback.
- `server/index.ts` skips its `app.listen(...)` IIFE when `process.env.VERCEL` is set, so importing `createApp()` from the serverless entry never starts an HTTP listener.
- **Sessions** use `connect-pg-simple` (table `user_sessions`, auto-created) whenever `NODE_ENV=production` + `DATABASE_URL` are set, so logins survive cold starts and multiple serverless instances. `MemoryStore` is only used in local dev.
- `app.set("trust proxy", 1)` + `cookie.secure: true` are enabled when `VERCEL` is set, so session cookies work behind Vercel's TLS-terminating proxy.
- All required keys must be added to the Vercel project as environment variables — the same names listed above.
- **Known Vercel platform limit:** request bodies are capped at ~4.5 MB (free / Hobby) or ~5 MB (Pro). The transport-bill PDF upload uses base64 over JSON, so the practical PDF size limit on Vercel is ~3 MB. Larger PDFs continue to work fine on the Replit deployment, which has the full 50 MB Express limit. If you need bigger PDFs on Vercel later, switch the upload to a presigned direct-to-object-storage flow.
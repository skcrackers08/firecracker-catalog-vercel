# S K Crackers

## Partner & Wishlist UX (Apr 25, 2026)
- **Partner profile photo upload**: The circular briefcase area at the top of `/partner` is now a tappable button (`button-partner-photo-pick`). Tapping opens the phone gallery / camera (`<input type="file" accept="image/*" capture="environment">`); image is compressed (320px max, q=0.82) and saved via `updateProfile({ profilePhoto })` from `useCustomerAuth`. Saving spinner overlays the circle; the camera badge in the corner hints at the action. >5MB images are rejected and the file input is reset so the same file can be retried. Backend reuses existing `customers.profile_photo` column + `/api/customers/me` PATCH (700kB cap unchanged).
- **Wallet Transaction History toggle**: The history card on `/partner` now starts hidden behind a `View` / `Hide` eye toggle (`button-toggle-history`). Hidden state shows a short helper line; expanded state renders the existing Withdrawals + Wallet Purchases sections.
- **Wishlist 'Add to Enquiry' mirrors ProductDetails**: Each wishlist card's `Add to Enquiry` button now switches to a quantity picker (`-` / qty / `+`) plus a `Confirm Enquiry` button. Confirm calls `addToCart(product, qty)`, fires the toast, and resets the per-product draft state so the original `Add to Enquiry` button reappears. Per-product draft state lives in `Record<number, number>` keyed by product id.

## Notifications & Partner Refresh (Apr 24, 2026)
- **Notifications system**: New `notifications` table (customerId, type, title, message, link, isRead, createdAt). Server hooks emit notifications on order create (order_confirmed), admin order status update (order_status / order_cancelled), referral credit (wallet_credit + referral_join for referrer), and wallet withdraw / wallet purchase (wallet_debit). Customer endpoints: `GET/POST /api/notifications/me`, `/me/:id/read`, `/me/read-all`.
- **NotificationBubble** (`client/src/components/NotificationBubble.tsx`) is now event-driven: opens via `openNotifications()` (window CustomEvent `open-notifications`), reads `/api/notifications/me`, auto-marks all read 800ms after open, shows typed icons + relative time + click-through to `notification.link`. Exposes `useUnreadNotifications()` hook.
- **Layout** removed the front-page floating bell. Navbar bell uses `NavbarBellButton` (badge from `useUnreadNotifications`, refetch every 30s). Customer logout clears `/api/notifications/me` and `/api/customers/me/partner` caches to avoid stale badges.
- **Wishlist** removed the top "Share Wishlist" button and the bottom "Copy Share Link" card. Per-product share remains.
- **Partner page** rewritten:
  - Wallet card now sits above an always-visible **Wallet Transaction History** card (sectioned: Withdrawals, Wallet Purchases). Withdrawal & Purchase buttons live on the wallet card.
  - **Purchase Product** is now a 3-step modal: (1) wallet amount → (2) Enquiry — searchable product picker with qty +/- and live subtotal → (3) customer/delivery (name/phone/address pre-filled from logged-in customer). On confirm: posts to `/api/customers/me/wallet/purchase`, opens WhatsApp with partner / wallet / products / delivery sections, and decrements the wallet immediately.
  - Withdrawal modal unchanged in flow but now also opens WhatsApp + decrements wallet immediately.
- **Admin Broadcast Notifications** (`/admin` → "Broadcast Notifications to All Customers"): composer for type (Announcement / Special Offer), title, message, optional link with live preview. Posts `POST /api/admin-pro/notifications/broadcast` which requires an active admin-pro staff session with role `superadmin` or `manager`. Broadcast uses a single `INSERT … SELECT id FROM customers` (no N+1). The section detects missing admin-pro session and shows an inline staff login form (default seeded staff: `superadmin` / `super@123`).

## Recent Refactor (Apr 2026)
- Removed in-app payment (UPI/Card/QR). Checkout flow → "ORDER ENQUIRY" page → "Send Enquiry on WhatsApp" button creates order with `paymentMethod="whatsapp-enquiry"` and opens wa.me link with pre-filled customer + items + estimated total.
- Added floating WhatsApp icon (Layout.tsx) on every page; number stored in app_settings key `whatsapp-number` (default `919344468937`).
- Tax label changed from "GST (18%)" to "Handling Charges (3%)" everywhere (Bill, Checkout, email, AdminProInvoice). DB column `gstAmount` retained for compatibility — value now stores 3% of subtotal.
- Removed "Delivery Free" line entirely.
- Customer-facing string renames: Cart→Enquiry, Orders→My Requests, BUY NOW→BOOK NOW, ADD TO CART→ADD TO ENQUIRY, CONFIRM→CONFIRM ENQUIRY, Saved/Add to Wishlist→Saved/Add to Favorites, Subtotal→Estimated Amount, Total Amount→Estimated Total, Order Summary→Enquiry Summary, Review Items→Selected Items, SECURE CHECKOUT→ORDER ENQUIRY, Delivery Address→Contact Details, Continue to Payment→Send Enquiry, PROCEED TO CHECKOUT→CONFIRM BOOKING, Shop by Category→PRODUCT CATEGORIES, Add to Cart→Add to Enquiry (Wishlist).
- ProductDetails: after clicking CONFIRM ENQUIRY, quantity resets to 0 so "ADD TO ENQUIRY" button reappears.
 — replit.md

## Overview

S K Crackers is a festive e-commerce web application for buying firecrackers/sparklers online. It is an Indian market-focused storefront (prices in INR, UPI payment support) with the following key features:

- **Product catalog** — browse sparklers, chakkars, flower pots, rockets, etc.
- **Product detail pages** — with image/video, add-to-cart, and wishlist
- **Shopping cart** — in-memory client-side cart with quantity management
- **Wishlist** — persisted in `localStorage`, shareable via URL query params
- **Checkout flow** — two-step form (customer details → payment) supporting UPI (PhonePe/GPay/Paytm deep links) and card (debit/credit with form validation)
- **Bill/Invoice page** — post-purchase celebration page with confetti and printable invoice
- **Customer accounts** — register with username/password + phone OTP verification; login/logout; view full order history at `/account`
- **Admin panel** — password-protected CRUD for products (name, description, price, image URL, video URL)

The app is a full-stack TypeScript monorepo with a React SPA frontend and an Express backend, sharing types and schema through a `shared/` directory.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Full-Stack Monorepo Layout

```
/
├── client/          # React SPA (Vite)
│   └── src/
│       ├── pages/   # Route-level components
│       ├── components/  # Layout + shadcn/ui components
│       ├── hooks/   # Data-fetching and context hooks
│       └── lib/     # queryClient, utils
├── server/          # Express backend
│   ├── index.ts     # App entry point
│   ├── routes.ts    # API route registration + DB seeding
│   ├── storage.ts   # DatabaseStorage class (data access layer)
│   ├── db.ts        # Drizzle + pg Pool setup
│   └── vite.ts      # Dev-mode Vite middleware
├── shared/          # Shared between client and server
│   ├── schema.ts    # Drizzle table definitions + Zod schemas
│   └── routes.ts    # Typed API route manifest
└── script/build.ts  # Production build (esbuild + vite)
```

**Why a monorepo?** Sharing TypeScript types and Zod schemas between client and server eliminates duplication and keeps API contracts in sync automatically.

### Frontend Architecture

- **Framework:** React 18 (no SSR; `rsc: false` in components.json)
- **Build tool:** Vite, rooted in `client/`
- **Routing:** `wouter` (lightweight client-side router)
- **State management:**
  - Server state: TanStack Query (React Query v5) with custom `useProducts`, `useProduct`, `useOrder`, `useCreateOrder` hooks
  - UI/cart state: React Context (`CartProvider`, `WishlistProvider`)
  - Wishlist is persisted to `localStorage`
- **UI components:** shadcn/ui (Radix UI primitives + Tailwind), plus a custom `ui-custom.tsx` for festive-themed Button and Card variants
- **Animations:** Framer Motion (page transitions, swipe gestures, scroll effects)
- **Post-purchase effect:** `react-confetti`
- **Forms:** React Hook Form + Zod resolvers (`@hookform/resolvers`)
- **Icons:** Lucide React, `react-icons` (for payment brand logos)

**Theme:** Deep black festive dark theme with gold primary, festive red secondary, and orange accent. Fonts are Bebas Neue (display) and Plus Jakarta Sans (body), loaded from Google Fonts.

**Note on numeric prices:** Postgres returns `numeric` columns as strings. The frontend explicitly casts them with `Number(item.price)` for calculations and `toFixed(2)` for display/submission.

### Backend Architecture

- **Framework:** Express 5 (`express@^5`)
- **Language:** TypeScript, run with `tsx` in development
- **Entry point:** `server/index.ts` creates an HTTP server and calls `registerRoutes()`
- **Data access:** `DatabaseStorage` class in `server/storage.ts` wraps all Drizzle queries behind an `IStorage` interface — making it easy to swap implementations
- **API routes:** Defined in `server/routes.ts`; route paths are imported from `shared/routes.ts` to keep client and server in sync
- **Database seeding:** `registerRoutes()` calls `seedDatabase()` on startup, inserting default products if the table is empty
- **Static serving:** In production, `server/static.ts` serves the Vite build output from `dist/public/`; in development, Vite middleware is injected via `server/vite.ts`
- **Body size limit:** 50 MB (for potential image/video upload support)

### Database

- **Engine:** PostgreSQL (via `pg` / `node-postgres`)
- **ORM:** Drizzle ORM (`drizzle-orm/node-postgres`)
- **Schema location:** `shared/schema.ts`
- **Migrations:** Drizzle Kit (`drizzle-kit push` for schema pushes; migration files go to `./migrations/`)
- **Connection:** `DATABASE_URL` environment variable required

**Tables:**

| Table | Key Columns |
|-------|-------------|
| `products` | `id`, `name`, `description`, `price` (numeric 10,2), `imageUrl`, `videoUrl` |
| `orders` | `id`, `productId`, `quantity`, `customerName`, `customerPhone`, `customerAddress`, `paymentMethod`, `subtotal`, `gstAmount`, `totalAmount`, `customerId` (nullable FK) |
| `customers` | `id`, `username` (unique), `passwordHash`, `phone` (unique), `phoneVerified` |

**Zod schemas** are auto-generated from Drizzle table definitions using `drizzle-zod`, then re-exported for use on both client and server.

### Shared API Contract (`shared/routes.ts`)

A typed `api` manifest object defines each endpoint with its HTTP method, path, input schema, and response schemas. Both client hooks and server route handlers import from this manifest, so path strings are never duplicated and response types are always in sync.

### Build

- **Development:** `tsx server/index.ts` with Vite HMR via middleware
- **Production:** `script/build.ts` runs Vite (client) then esbuild (server); the server bundle inlines selected dependencies (stripe, drizzle, pg, express, etc.) to reduce cold-start syscalls. Output goes to `dist/`.

### Authentication

**Admin panel:** Simple client-side password check stored in localStorage (`sk-admin-creds`), not a full auth system.

**Customer accounts:** Full session-based auth using `express-session` + `memorystore`.
- Passwords hashed with Node.js `crypto.scryptSync` (salt:hash format)
- Sessions stored in memory, cookie-based (`sk-crackers-secret-key`)
- Phone OTP verification: 6-digit code generated server-side, stored in a Map with 10-minute expiry. Sent via configurable SMS gateway (StartMessaging or Fast2SMS). Provider, API key, endpoint and sender ID are managed in `/admin` → "SMS / OTP Settings". If sending fails, OTP falls back to on-screen display so the flow can still complete.
  - StartMessaging integration: header `x-api-key`, endpoint `https://api.startmessaging.com/otp/send`, body `{phoneNumber: "+91...", variables: {otp}}`. Phone is auto-normalised to E.164 (10-digit assumed Indian and prefixed with +91). Logic lives in `server/sms.ts`.
- New pages: `/login` (register/login), `/account` (order history)
- `CustomerAuthProvider` wraps the entire app in `App.tsx`

---

## Recent Updates (Apr 2026)

- **Admin OrderEditDialog** restructured: transport/dispatch fields removed from inline edit form and moved to a dedicated "Transport / Dispatch" sub-dialog opened from the main edit dialog. Destination auto-fills from `customerAddress` and Remarks auto-fills with the standard policy text. New "Save & Generate Transport Bill PDF" button opens `/admin-pro/transport-bill/:id` (auto-prints; A4 landscape-friendly).
- **Email Invoice button** added to OrderEditDialog footer (visible when `customerEmail` is set). Calls `POST /api/admin-pro/orders/:id/email-invoice`.
- **Schema:** `orders.transportRemarks` (text, nullable) added to keep transport bill remarks separate from general order remarks (prevents overwrite between the two dialogs).
- **Wallet rejection workflow:** admin now picks one of two predefined remarks via a `RejectWalletTxDialog` (radio options) — server (`/api/admin-pro/wallet-tx/:id/reject`) enforces the enum (defence-in-depth). Reason is stored in `walletTransactions.notes` prefixed `[Admin remark]` and surfaced to the customer in email + in-app notification + receipt PDF.
- **Receipt label changes:** withdrawals show "Reference Number"; purchases show "Remarks" (replacing "UTR"). UPI line removed from bank details. Completed wallet purchases display a green "Your order successfully confirmed" banner on the receipt PDF, view modal, and email.
- **Email security hardening:** `buildWalletTxHtml` now HTML-escapes all dynamic fields (notes, transactionRef, customerName, fromName, bank fields) to prevent injection from admin/user input.

## External Dependencies

| Dependency | Purpose |
|---|---|
| **PostgreSQL** (`pg`, `drizzle-orm`) | Primary data store for products and orders |
| **Drizzle Kit** | Schema migrations and DB push |
| **Google Fonts** | Bebas Neue, Plus Jakarta Sans, DM Sans, Geist Mono, Fira Code, Architects Daughter |
| **Unsplash** | Default product images (hardcoded Unsplash URLs in seed data) |
| **UPI Deep Links** (PhonePe, GPay, Paytm) | Mobile payment initiation via `phonepe://`, `tez://`, `paytm://` URI schemes |
| **Framer Motion** | Animations and gesture handling |
| **react-confetti** | Post-purchase celebration effect |
| **TanStack Query v5** | Server state, caching, and mutations |
| **Radix UI** | Accessible UI primitives (full suite) |
| **shadcn/ui** | Component scaffolding on top of Radix + Tailwind |
| **Tailwind CSS** | Utility-first styling |
| **wouter** | Client-side routing |
| **Zod** | Runtime validation on client and server |
| **React Hook Form** | Form state management |
| **react-icons** | Payment brand icons (SiPhonepe, SiGooglepay, SiPaytm, SiVisa, SiMastercard) |
| **Vite + @vitejs/plugin-react** | Frontend bundler and dev server |
| **esbuild** | Server bundler for production |
| **@replit/vite-plugin-runtime-error-modal** | Dev-time error overlay (Replit-specific) |
| **@replit/vite-plugin-cartographer** | Replit dev tooling |

### Environment Variables Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required at startup) |
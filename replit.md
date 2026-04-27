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
- **Tables:** `products`, `orders`, `customers`, `notifications`.
- **Zod Schemas:** Auto-generated from Drizzle definitions for client and server validation.

### Authentication

- **Admin Panel:** Client-side password check for basic access.
- **Customer Accounts:** Session-based authentication using `express-session` and `memorystore`.
    - Passwords hashed with `crypto.scryptSync`.
    - Phone OTP verification: 6-digit code with 10-minute expiry, sent via configurable SMS gateway (StartMessaging or Fast2SMS) or displayed on-screen as a fallback. Normalizes phone numbers to E.164.

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
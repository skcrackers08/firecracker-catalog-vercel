import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { ORDER_STATUSES, PAYMENT_STATUSES, STAFF_ROLES, insertOfferSchema } from "@shared/schema";
import { sendWalletTxEmail, sendInvoiceEmail } from "./email";

async function requireStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.session.staffId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  // Re-validate that the staff user still exists and is active
  const s = await storage.getStaffById(req.session.staffId);
  if (!s || !s.active) {
    req.session.staffId = undefined;
    req.session.staffRole = undefined;
    req.session.staffName = undefined;
    return res.status(401).json({ message: "Account disabled or removed" });
  }
  // Refresh role from DB in case it changed
  req.session.staffRole = s.role;
  next();
}

function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.staffId) return res.status(401).json({ message: "Not authenticated" });
    const s = await storage.getStaffById(req.session.staffId);
    if (!s || !s.active) return res.status(401).json({ message: "Account disabled" });
    if (!roles.includes(s.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

function safeStaff(s: any) {
  if (!s) return s;
  const { passwordHash, ...rest } = s;
  return rest;
}

export async function seedDefaultStaff() {
  const existing = await storage.getStaff();
  if (existing.length === 0) {
    await storage.createStaff({
      username: "superadmin",
      password: "super@123",
      fullName: "Super Admin",
      role: "superadmin",
    });
    console.log("[admin-pro] Seeded default superadmin (username: superadmin / password: super@123)");
    return;
  }
  // Lockout protection: ensure at least one ACTIVE superadmin always exists.
  // If everyone got deactivated, restore the default superadmin so the owner can sign in.
  const activeSuperadmin = existing.find((s) => s.active && s.role === "superadmin");
  if (!activeSuperadmin) {
    const sa = existing.find((s) => s.username === "superadmin");
    if (sa) {
      await storage.updateStaff(sa.id, { active: true, role: "superadmin" });
      await storage.resetStaffPassword(sa.id, "super@123");
      console.log("[admin-pro] WARNING: superadmin was inactive — reactivated and reset password to default 'super@123'. Please change it after login.");
    } else {
      await storage.createStaff({
        username: "superadmin",
        password: "super@123",
        fullName: "Super Admin",
        role: "superadmin",
      });
      console.log("[admin-pro] WARNING: no active superadmin found — created default 'superadmin' / 'super@123'. Please change the password after login.");
    }
  }
}

export function registerAdminProRoutes(app: Express) {
  // ============== AUTH ==============
  app.post("/api/admin-pro/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);
      const s = await storage.validateStaffPassword(username, password);
      if (!s) return res.status(401).json({ message: "Invalid username or password" });
      // Regenerate session ID to prevent session fixation
      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ message: "Session error" });
        req.session.staffId = s.id;
        req.session.staffRole = s.role;
        req.session.staffName = s.fullName;
        req.session.save((err2) => {
          if (err2) return res.status(500).json({ message: "Session error" });
          res.json({ staff: safeStaff(s) });
        });
      });
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Login failed" });
    }
  });

  app.post("/api/admin-pro/logout", (req, res) => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/admin-pro/me", requireStaff, async (req, res) => {
    const s = await storage.getStaffById(req.session.staffId!);
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json({ staff: safeStaff(s) });
  });

  // ============== DASHBOARD ==============
  app.get("/api/admin-pro/dashboard", requireStaff, async (_req, res) => {
    const orders = await storage.getOrders();
    const products = await storage.getProducts();
    const customers = await storage.getCustomers();
    const lowStock = await storage.getLowStockProducts();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
    const monthOrders = orders.filter((o) => new Date(o.createdAt) >= monthStart);
    const sumTotal = (arr: typeof orders) => arr.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const sumDue = (arr: typeof orders) =>
      arr.reduce((s, o) => s + Math.max(0, Number(o.totalAmount || 0) - Number(o.paidAmount || 0)), 0);

    // Top selling products (last 90 days)
    const sales: Record<number, { id: number; name: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      try {
        const items = o.cartItems ? JSON.parse(o.cartItems) : [{ id: o.productId, quantity: o.quantity, price: o.totalAmount, name: "" }];
        if (Array.isArray(items)) {
          for (const it of items) {
            const pid = Number(it.id ?? it.productId);
            const qty = Number(it.quantity ?? 0);
            const price = Number(it.price ?? 0);
            if (!sales[pid]) sales[pid] = { id: pid, name: it.name ?? "", qty: 0, revenue: 0 };
            sales[pid].qty += qty;
            sales[pid].revenue += qty * price;
          }
        }
      } catch {}
    }
    for (const p of products) {
      if (sales[p.id]) sales[p.id].name = p.name;
    }
    const topProducts = Object.values(sales).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Last 14 days sales chart
    const dailyChart: { date: string; total: number; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter((o) => {
        const od = new Date(o.createdAt);
        return od >= d && od < next;
      });
      dailyChart.push({
        date: d.toISOString().slice(5, 10),
        total: sumTotal(dayOrders),
        count: dayOrders.length,
      });
    }

    res.json({
      todayOrders: todayOrders.length,
      todaySales: sumTotal(todayOrders),
      monthSales: sumTotal(monthOrders),
      pendingPayments: sumDue(orders.filter((o) => o.paymentStatus !== "paid" && o.orderStatus !== "cancelled")),
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.slice(0, 5),
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      topProducts,
      dailyChart,
    });
  });

  // ============== ORDERS ==============
  app.get("/api/admin-pro/orders", requireStaff, async (req, res) => {
    const all = await storage.getOrders();
    const { status, payment, q } = req.query as { status?: string; payment?: string; q?: string };
    let filtered = all;
    if (status) filtered = filtered.filter((o) => o.orderStatus === status);
    if (payment) filtered = filtered.filter((o) => o.paymentStatus === payment);
    if (q) {
      const ql = q.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.customerName.toLowerCase().includes(ql) ||
          o.customerPhone.includes(ql) ||
          String(o.id).includes(ql)
      );
    }
    res.json(filtered);
  });

  app.patch("/api/admin-pro/orders/:id", requireStaff, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const patch = z.object({
        orderStatus: z.enum(ORDER_STATUSES).optional(),
        paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
        paidAmount: z.union([z.string(), z.number()]).optional(),
        lorryName: z.string().nullable().optional(),
        lrNumber: z.string().nullable().optional(),
        transportContact: z.string().nullable().optional(),
        dispatchDate: z.string().nullable().optional(),
        destination: z.string().nullable().optional(),
        remarks: z.string().nullable().optional(),
        transportRemarks: z.string().nullable().optional(),
      }).parse(req.body);
      const cleaned: any = { ...patch };
      if (cleaned.paidAmount !== undefined) cleaned.paidAmount = String(cleaned.paidAmount);
      const updated = await storage.updateOrder(id, cleaned);
      if (!updated) return res.status(404).json({ message: "Order not found" });
      // Notify customer on order status changes (best-effort)
      if (patch.orderStatus && updated.customerId) {
        const isCancel = patch.orderStatus === "cancelled";
        storage.createNotification({
          customerId: updated.customerId,
          type: isCancel ? "order_cancelled" : "order_status",
          title: isCancel ? `Order #${updated.id} cancelled` : `Order #${updated.id}: ${patch.orderStatus}`,
          message: isCancel
            ? `Sorry, your order has been cancelled. Please contact us on WhatsApp for any clarification.`
            : `Your order is now ${patch.orderStatus}. Total ₹${Number(updated.totalAmount).toFixed(2)}.`,
          link: `/account`,
        }).catch(() => {});
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Update failed" });
    }
  });

  app.get("/api/admin-pro/orders/:id", requireStaff, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json(order);
  });

  app.post("/api/admin-pro/orders/:id/email-invoice", requireStaff, async (req, res) => {
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (!order.customerEmail) return res.status(400).json({ message: "Customer has no email on file" });
      await sendInvoiceEmail(order);
      res.json({ ok: true });
    } catch (err: any) {
      console.error("[admin-pro] email-invoice failed", err);
      res.status(500).json({ message: err?.message || "Failed to send email" });
    }
  });

  // ============== STOCK ==============
  app.get("/api/admin-pro/stock/low", requireStaff, async (_req, res) => {
    res.json(await storage.getLowStockProducts());
  });

  app.post("/api/admin-pro/stock/adjust", requireStaff, async (req, res) => {
    try {
      const { productId, changeQty, reason, notes } = z.object({
        productId: z.number(),
        changeQty: z.number(),
        reason: z.string().min(1),
        notes: z.string().optional().nullable(),
      }).parse(req.body);
      const updated = await storage.adjustStock(productId, changeQty, reason, notes ?? null, req.session.staffName ?? "staff");
      if (!updated) return res.status(404).json({ message: "Product not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Adjust failed" });
    }
  });

  app.patch("/api/admin-pro/stock/:id/settings", requireStaff, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const patch = z.object({
        productCode: z.string().nullable().optional(),
        lowStockThreshold: z.number().int().min(0).optional(),
        costPrice: z.union([z.string(), z.number()]).optional(),
      }).parse(req.body);
      const cleaned: any = { ...patch };
      if (cleaned.costPrice !== undefined) cleaned.costPrice = String(cleaned.costPrice);
      const updated = await storage.updateProduct(id, cleaned);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Update failed" });
    }
  });

  app.get("/api/admin-pro/stock/movements", requireStaff, async (req, res) => {
    const pid = req.query.productId ? Number(req.query.productId) : undefined;
    res.json(await storage.getStockMovements(pid));
  });

  // ============== CUSTOMERS ==============
  app.get("/api/admin-pro/customers", requireStaff, async (_req, res) => {
    const customers = await storage.getCustomers();
    const orders = await storage.getOrders();
    const enriched = customers.map((c) => {
      const cOrders = orders.filter((o) => o.customerId === c.id || o.customerPhone === c.phone);
      const totalSpent = cOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
      const totalDue = cOrders.reduce((s, o) => s + Math.max(0, Number(o.totalAmount || 0) - Number(o.paidAmount || 0)), 0);
      const { passwordHash, ...safe } = c;
      return { ...safe, orderCount: cOrders.length, totalSpent, totalDue };
    });
    res.json(enriched);
  });

  app.get("/api/admin-pro/customers/:id/orders", requireStaff, async (req, res) => {
    const id = Number(req.params.id);
    const c = await storage.getCustomerById(id);
    if (!c) return res.status(404).json({ message: "Not found" });
    const orders = await storage.getOrders();
    const cOrders = orders.filter((o) => o.customerId === id || o.customerPhone === c.phone);
    const { passwordHash, ...safe } = c;
    res.json({ customer: safe, orders: cOrders });
  });

  // ============== REPORTS ==============
  app.get("/api/admin-pro/reports/sales", requireStaff, async (req, res) => {
    const { from, to } = req.query as { from?: string; to?: string };
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    const orders = await storage.getOrdersInRange(start, end);
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalGst = orders.reduce((s, o) => s + Number(o.gstAmount || 0), 0);
    const totalCount = orders.length;
    const paidAmt = orders.reduce((s, o) => s + Number(o.paidAmount || 0), 0);
    const dueAmt = totalRevenue - paidAmt;

    // group by day
    const dayMap: Record<string, { date: string; total: number; count: number }> = {};
    for (const o of orders) {
      const k = new Date(o.createdAt).toISOString().slice(0, 10);
      if (!dayMap[k]) dayMap[k] = { date: k, total: 0, count: 0 };
      dayMap[k].total += Number(o.totalAmount || 0);
      dayMap[k].count += 1;
    }
    const daily = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ totalRevenue, totalGst, totalCount, paidAmt, dueAmt, daily, orders });
  });

  app.get("/api/admin-pro/reports/profit", requireStaff, async (req, res) => {
    const { from, to } = req.query as { from?: string; to?: string };
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    const orders = await storage.getOrdersInRange(start, end);
    const products = await storage.getProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalRevenue = 0;
    let totalCost = 0;
    const productProfit: Record<number, { id: number; name: string; qty: number; revenue: number; cost: number; profit: number }> = {};

    for (const o of orders) {
      try {
        const items = o.cartItems
          ? JSON.parse(o.cartItems)
          : [{ id: o.productId, quantity: o.quantity, price: Number(o.subtotal) / Math.max(1, o.quantity) }];
        if (!Array.isArray(items)) continue;
        for (const it of items) {
          const pid = Number(it.id ?? it.productId);
          const qty = Number(it.quantity ?? 0);
          const price = Number(it.price ?? 0);
          const p = productMap.get(pid);
          const cost = p ? Number(p.costPrice || 0) : 0;
          const rev = qty * price;
          const c = qty * cost;
          totalRevenue += rev;
          totalCost += c;
          if (!productProfit[pid])
            productProfit[pid] = { id: pid, name: p?.name ?? `#${pid}`, qty: 0, revenue: 0, cost: 0, profit: 0 };
          productProfit[pid].qty += qty;
          productProfit[pid].revenue += rev;
          productProfit[pid].cost += c;
          productProfit[pid].profit += rev - c;
        }
      } catch {}
    }

    res.json({
      totalRevenue,
      totalCost,
      grossProfit: totalRevenue - totalCost,
      productProfit: Object.values(productProfit).sort((a, b) => b.profit - a.profit),
    });
  });

  // ============== STAFF MGMT ==============
  app.get("/api/admin-pro/staff", requireRole("superadmin"), async (_req, res) => {
    const list = await storage.getStaff();
    res.json(list.map(safeStaff));
  });

  app.post("/api/admin-pro/staff", requireRole("superadmin"), async (req, res) => {
    try {
      const data = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        fullName: z.string().min(1),
        role: z.enum(STAFF_ROLES),
      }).parse(req.body);
      const existing = await storage.getStaffByUsername(data.username);
      if (existing) return res.status(400).json({ message: "Username already exists" });
      const s = await storage.createStaff(data);
      res.status(201).json(safeStaff(s));
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Failed" });
    }
  });

  app.patch("/api/admin-pro/staff/:id", requireRole("superadmin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const patch = z.object({
        fullName: z.string().optional(),
        role: z.enum(STAFF_ROLES).optional(),
        active: z.boolean().optional(),
      }).parse(req.body);
      const updated = await storage.updateStaff(id, patch);
      if (!updated) return res.status(404).json({ message: "Not found" });
      res.json(safeStaff(updated));
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Failed" });
    }
  });

  app.post("/api/admin-pro/staff/:id/reset-password", requireRole("superadmin"), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { newPassword } = z.object({ newPassword: z.string().min(6) }).parse(req.body);
      await storage.resetStaffPassword(id, newPassword);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Failed" });
    }
  });

  app.delete("/api/admin-pro/staff/:id", requireRole("superadmin"), async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.session.staffId) return res.status(400).json({ message: "Cannot delete your own account" });
    await storage.deleteStaff(id);
    res.json({ success: true });
  });

  // ============== OFFERS (Admin) ==============
  app.get("/api/admin-pro/offers", requireStaff, async (_req, res) => {
    const list = await storage.listOffers();
    res.json(list);
  });

  app.post("/api/admin-pro/offers", requireStaff, async (req, res) => {
    try {
      const data = insertOfferSchema.parse(req.body);
      const o = await storage.createOffer(data);
      res.status(201).json(o);
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Failed" });
    }
  });

  app.patch("/api/admin-pro/offers/:id", requireStaff, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const patch = insertOfferSchema.partial().parse(req.body);
      const o = await storage.updateOffer(id, patch);
      if (!o) return res.status(404).json({ message: "Not found" });
      res.json(o);
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Failed" });
    }
  });

  app.delete("/api/admin-pro/offers/:id", requireStaff, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteOffer(id);
    res.json({ success: true });
  });

  // ============== WALLET TRANSACTIONS APPROVAL (Admin) ==============
  app.get("/api/admin-pro/wallet-tx", requireStaff, async (req, res) => {
    const status = (req.query.status as string) || undefined;
    const type = (req.query.type as string) || undefined;
    const list = await storage.listWalletTransactions({ status, type });
    // Hydrate customer name/email/phone for admin UI
    const enriched = await Promise.all(list.map(async (t) => {
      const c = await storage.getCustomerById(t.customerId);
      return { ...t, customerName: c?.fullName || c?.username || null, customerEmail: c?.email || null, customerPhone: c?.phone || null };
    }));
    res.json(enriched);
  });

  app.post("/api/admin-pro/wallet-tx/:id/approve", requireStaff, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { transactionRef } = z.object({ transactionRef: z.string().optional() }).parse(req.body || {});
      // Atomic: only updates when current status is 'pending'. Prevents concurrent double-approve.
      const updated = await storage.approveWalletTransactionIfPending(id, transactionRef ?? null);
      if (!updated) {
        const exists = await storage.getWalletTransactionById(id);
        if (!exists) return res.status(404).json({ message: "Not found" });
        return res.status(409).json({ message: "Already processed" });
      }
      const cust = await storage.getCustomerById(updated.customerId);
      // Notification (in-app)
      try {
        await storage.createNotification({
          customerId: updated.customerId,
          type: "wallet",
          title: updated.type === "withdrawal" ? "Withdrawal Approved" : "Wallet Purchase Confirmed",
          message: `Invoice ${updated.invoiceNumber || `#${updated.id}`} for ₹${Number(updated.amount).toFixed(2)} has been approved.`,
          link: "/partner",
        });
      } catch (e) { console.warn("[wallet-tx] notify failed", e); }
      // Email
      try {
        await sendWalletTxEmail({
          customerEmail: cust?.email || null,
          customerName: cust?.fullName || cust?.username || null,
          invoiceNumber: updated.invoiceNumber || `SK-WT-${String(updated.id).padStart(5, "0")}`,
          amount: updated.amount,
          type: (updated.type === "withdrawal" ? "withdrawal" : "purchase"),
          status: "completed",
          productDetails: updated.productDetails,
          bankSnapshot: updated.bankSnapshot,
          transactionRef: updated.transactionRef,
          notes: updated.notes,
        });
      } catch (e) { console.warn("[wallet-tx] email failed", e); }
      res.json({ ...updated, customerPhone: cust?.phone || null, customerName: cust?.fullName || cust?.username || null, customerEmail: cust?.email || null });
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Failed" });
    }
  });

  app.post("/api/admin-pro/wallet-tx/:id/reject", requireStaff, async (req, res) => {
    try {
      const id = Number(req.params.id);
      // Only allow the two predefined remark options the UI offers (defence-in-depth).
      const ALLOWED_REASONS = [
        "Your account details may be entered incorrectly. Please double-check or update if you have a different account.",
        "Other reasons — please contact our team within 24 to 48 hours.",
      ];
      const { reason: rawReason } = z.object({ reason: z.string().optional() }).parse(req.body || {});
      const reason = rawReason && ALLOWED_REASONS.includes(rawReason) ? rawReason : null;
      const result = await storage.refundWalletTransaction(id, reason);
      if (!result.ok) return res.status(400).json({ message: result.error });
      const updated = result.tx;
      const cust = await storage.getCustomerById(updated.customerId);
      try {
        await storage.createNotification({
          customerId: updated.customerId,
          type: "wallet",
          title: updated.type === "withdrawal" ? "Withdrawal Rejected" : "Wallet Purchase Rejected",
          message: `Invoice ${updated.invoiceNumber || `#${updated.id}`} for ₹${Number(updated.amount).toFixed(2)} was rejected. The amount has been refunded to your wallet.${reason ? ` Reason: ${reason}` : ""}`.slice(0, 500),
          link: "/partner",
        });
      } catch {}
      try {
        await sendWalletTxEmail({
          customerEmail: cust?.email || null,
          customerName: cust?.fullName || cust?.username || null,
          invoiceNumber: updated.invoiceNumber || `SK-WT-${String(updated.id).padStart(5, "0")}`,
          amount: updated.amount,
          type: (updated.type === "withdrawal" ? "withdrawal" : "purchase"),
          status: "rejected",
          productDetails: updated.productDetails,
          bankSnapshot: updated.bankSnapshot,
          transactionRef: updated.transactionRef,
          notes: updated.notes,
        });
      } catch {}
      res.json({ ...updated, customerPhone: cust?.phone || null, customerName: cust?.fullName || cust?.username || null, customerEmail: cust?.email || null });
    } catch (err: any) {
      res.status(400).json({ message: err?.message ?? "Failed" });
    }
  });
}

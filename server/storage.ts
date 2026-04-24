import { db, pool } from "./db";
import {
  products,
  orders,
  customers,
  staff,
  stockMovements,
  referralUses,
  walletTransactions,
  notifications,
  type Product,
  type Order,
  type Customer,
  type Staff,
  type StockMovement,
  type ReferralUse,
  type WalletTransaction,
  type Notification,
  type InsertProduct,
  type InsertOrder,
  type InsertCustomer,
  type InsertStockMovement,
  type InsertNotification,
} from "@shared/schema";
import { eq, desc, gte, lte, and, sql } from "drizzle-orm";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.includes(":")) return false;
  try {
    const [salt, hash] = stored.split(":");
    const inputHash = scryptSync(password, salt, 64).toString("hex");
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(inputHash, "hex"));
  } catch {
    return false;
  }
}

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  adjustStock(productId: number, changeQty: number, reason: string, notes: string | null, by: string | null): Promise<Product | undefined>;
  getLowStockProducts(): Promise<Product[]>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrders(): Promise<Order[]>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByPhone(phone: string): Promise<Order[]>;
  updateOrder(id: number, patch: Partial<Order>): Promise<Order | undefined>;
  getOrdersInRange(start: Date, end: Date): Promise<Order[]>;

  getCustomers(): Promise<Customer[]>;
  createCustomer(data: { username: string; password: string; phone: string; fullName?: string; email?: string }): Promise<Customer>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  verifyCustomerPhone(customerId: number): Promise<void>;
  validateCustomerPassword(username: string, password: string): Promise<Customer | null>;
  updateCustomerPassword(customerId: number, newPassword: string): Promise<void>;
  updateCustomerProfile(customerId: number, patch: Partial<{ fullName: string | null; email: string | null; address: string | null; profilePhoto: string | null }>): Promise<Customer | undefined>;
  updateCustomerBank(customerId: number, patch: Partial<{ bankAccountHolder: string | null; bankName: string | null; bankAccountNumber: string | null; bankIfsc: string | null; bankUpi: string | null }>): Promise<Customer | undefined>;
  setCustomerReferral(customerId: number, percentage: number): Promise<Customer | undefined>;
  getCustomerByReferralCode(code: string): Promise<Customer | undefined>;
  creditReferralUse(data: { referrerCustomerId: number; usedByCustomerId: number | null; usedByName: string; usedByPhone?: string | null; orderId?: number | null; amountCredited: string }): Promise<void>;
  getReferralHistory(customerId: number): Promise<ReferralUse[]>;
  createWalletTransaction(data: { customerId: number; type: string; amount: string; notes?: string | null; productDetails?: string | null; bankSnapshot?: string | null }): Promise<{ tx: WalletTransaction; newBalance: string } | { error: "insufficient" | "invalid" }>;
  getWalletTransactions(customerId: number): Promise<WalletTransaction[]>;
  updateWalletTransactionStatus(id: number, status: string, transactionRef?: string | null): Promise<WalletTransaction | undefined>;

  createStaff(data: { username: string; password: string; fullName: string; role: string; permissions?: string }): Promise<Staff>;
  getStaff(): Promise<Staff[]>;
  getStaffByUsername(username: string): Promise<Staff | undefined>;
  getStaffById(id: number): Promise<Staff | undefined>;
  updateStaff(id: number, patch: Partial<{ fullName: string; role: string; active: boolean; permissions: string }>): Promise<Staff | undefined>;
  resetStaffPassword(id: number, newPassword: string): Promise<void>;
  validateStaffPassword(username: string, password: string): Promise<Staff | null>;
  deleteStaff(id: number): Promise<boolean>;

  getStockMovements(productId?: number): Promise<StockMovement[]>;

  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;

  createNotification(data: InsertNotification): Promise<Notification>;
  getNotificationsForCustomer(customerId: number, limit?: number): Promise<Notification[]>;
  countUnreadNotifications(customerId: number): Promise<number>;
  markNotificationRead(id: number, customerId: number): Promise<boolean>;
  markAllNotificationsRead(customerId: number): Promise<number>;
  broadcastNotification(data: Omit<InsertNotification, "customerId">): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updatedProduct;
  }
  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }
  async adjustStock(productId: number, changeQty: number, reason: string, notes: string | null, by: string | null): Promise<Product | undefined> {
    // Atomic update: prevents race conditions when multiple orders decrement stock concurrently
    const result = await pool.query(
      `UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + $1) WHERE id = $2 RETURNING *`,
      [changeQty, productId]
    );
    if (result.rows.length === 0) return undefined;
    await db.insert(stockMovements).values({ productId, changeQty, reason, notes, createdBy: by });
    const r = result.rows[0];
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      price: r.price,
      imageUrl: r.image_url,
      videoUrl: r.video_url,
      category: r.category,
      subgroup: r.subgroup,
      stockQuantity: r.stock_quantity,
      productCode: r.product_code,
      lowStockThreshold: r.low_stock_threshold,
      costPrice: r.cost_price,
    } as Product;
  }
  async getLowStockProducts(): Promise<Product[]> {
    return await db.select().from(products).where(sql`${products.stockQuantity} <= ${products.lowStockThreshold}`);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    // auto-decrement stock from cart items
    try {
      let items: any[] = [];
      if (newOrder.cartItems) {
        const parsed = JSON.parse(newOrder.cartItems);
        if (Array.isArray(parsed)) items = parsed;
      }
      if (items.length > 0) {
        for (const it of items) {
          const pid = Number(it.id ?? it.productId);
          const qty = Number(it.quantity ?? 0);
          if (pid && qty > 0) {
            await this.adjustStock(pid, -qty, "order", `Order #${newOrder.id}`, "system");
          }
        }
      } else if (newOrder.productId && newOrder.quantity) {
        await this.adjustStock(newOrder.productId, -newOrder.quantity, "order", `Order #${newOrder.id}`, "system");
      }
    } catch (err) {
      console.error("[Stock] Auto-decrement failed:", err);
    }
    return newOrder;
  }
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.id));
  }
  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.id));
  }
  async getOrdersByPhone(phone: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerPhone, phone)).orderBy(desc(orders.id));
  }
  async updateOrder(id: number, patch: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set(patch).where(eq(orders.id, id)).returning();
    return updated;
  }
  async getOrdersInRange(start: Date, end: Date): Promise<Order[]> {
    return await db.select().from(orders).where(and(gte(orders.createdAt, start), lte(orders.createdAt, end))).orderBy(desc(orders.createdAt));
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.id));
  }
  async createCustomer(data: { username: string; password: string; phone: string; fullName?: string; email?: string }): Promise<Customer> {
    const passwordHash = hashPassword(data.password);
    const [customer] = await db.insert(customers).values({
      username: data.username,
      passwordHash,
      phone: data.phone,
      fullName: data.fullName ?? null,
      email: data.email ?? null,
    }).returning();
    return customer;
  }
  async getCustomerByUsername(username: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.username, username));
    return customer;
  }
  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
    return customer;
  }
  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }
  async verifyCustomerPhone(customerId: number): Promise<void> {
    await db.update(customers).set({ phoneVerified: true }).where(eq(customers.id, customerId));
  }
  async validateCustomerPassword(username: string, password: string): Promise<Customer | null> {
    const cleaned = (username || "").trim();
    let customer = await this.getCustomerByUsername(cleaned);
    if (!customer) {
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length >= 10) {
        customer = await this.getCustomerByPhone(digits.slice(-10));
      }
    }
    if (!customer) return null;
    if (!verifyPassword(password, customer.passwordHash)) return null;
    return customer;
  }
  async updateCustomerPassword(customerId: number, newPassword: string): Promise<void> {
    const passwordHash = hashPassword(newPassword);
    await db.update(customers).set({ passwordHash }).where(eq(customers.id, customerId));
  }
  async updateCustomerProfile(customerId: number, patch: Partial<{ fullName: string | null; email: string | null; address: string | null; profilePhoto: string | null }>): Promise<Customer | undefined> {
    const [row] = await db.update(customers).set(patch).where(eq(customers.id, customerId)).returning();
    return row;
  }
  async updateCustomerBank(customerId: number, patch: Partial<{ bankAccountHolder: string | null; bankName: string | null; bankAccountNumber: string | null; bankIfsc: string | null; bankUpi: string | null }>): Promise<Customer | undefined> {
    const [row] = await db.update(customers).set(patch).where(eq(customers.id, customerId)).returning();
    return row;
  }
  async createWalletTransaction(data: { customerId: number; type: string; amount: string; notes?: string | null; productDetails?: string | null; bankSnapshot?: string | null }): Promise<{ tx: WalletTransaction; newBalance: string } | { error: "insufficient" | "invalid" }> {
    const amt = Number(data.amount);
    if (!Number.isFinite(amt) || amt <= 0) return { error: "invalid" };
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const balRes = await client.query(`SELECT wallet_balance FROM customers WHERE id = $1 FOR UPDATE`, [data.customerId]);
      if (balRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return { error: "invalid" };
      }
      const current = Number(balRes.rows[0].wallet_balance || 0);
      if (current < amt) {
        await client.query("ROLLBACK");
        return { error: "insufficient" };
      }
      const updRes = await client.query(
        `UPDATE customers SET wallet_balance = wallet_balance - $1 WHERE id = $2 RETURNING wallet_balance`,
        [amt.toFixed(2), data.customerId]
      );
      const newBalance = String(updRes.rows[0].wallet_balance);
      const txRes = await client.query(
        `INSERT INTO wallet_transactions (customer_id, type, amount, status, notes, product_details, bank_snapshot) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [data.customerId, data.type, amt.toFixed(2), "pending", data.notes ?? null, data.productDetails ?? null, data.bankSnapshot ?? null]
      );
      await client.query(
        `UPDATE wallet_transactions SET invoice_number = $1 WHERE id = $2`,
        [`SK-WT-${String(txRes.rows[0].id).padStart(5, "0")}`, txRes.rows[0].id]
      );
      const finalRes = await client.query(`SELECT * FROM wallet_transactions WHERE id = $1`, [txRes.rows[0].id]);
      await client.query("COMMIT");
      const r = finalRes.rows[0];
      const tx: WalletTransaction = {
        id: r.id,
        customerId: r.customer_id,
        type: r.type,
        amount: r.amount,
        status: r.status,
        notes: r.notes,
        productDetails: r.product_details,
        bankSnapshot: r.bank_snapshot,
        invoiceNumber: r.invoice_number,
        transactionRef: r.transaction_ref,
        createdAt: r.created_at,
      };
      return { tx, newBalance };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async getWalletTransactions(customerId: number): Promise<WalletTransaction[]> {
    return await db.select().from(walletTransactions).where(eq(walletTransactions.customerId, customerId)).orderBy(desc(walletTransactions.id));
  }
  async updateWalletTransactionStatus(id: number, status: string, transactionRef?: string | null): Promise<WalletTransaction | undefined> {
    const patch: any = { status };
    if (transactionRef !== undefined) patch.transactionRef = transactionRef;
    const [row] = await db.update(walletTransactions).set(patch).where(eq(walletTransactions.id, id)).returning();
    return row;
  }
  async setCustomerReferral(customerId: number, percentage: number): Promise<Customer | undefined> {
    const cust = await this.getCustomerById(customerId);
    if (!cust) return undefined;
    let code = cust.referralCode;
    if (!code) {
      for (let i = 0; i < 8; i++) {
        const candidate = "SK" + Math.random().toString(36).slice(2, 8).toUpperCase();
        const exists = await this.getCustomerByReferralCode(candidate);
        if (!exists) { code = candidate; break; }
      }
    }
    const [row] = await db.update(customers)
      .set({ referralCode: code, referralPercentage: percentage })
      .where(eq(customers.id, customerId))
      .returning();
    return row;
  }
  async getCustomerByReferralCode(code: string): Promise<Customer | undefined> {
    const [row] = await db.select().from(customers).where(eq(customers.referralCode, code)).limit(1);
    return row;
  }
  async creditReferralUse(data: { referrerCustomerId: number; usedByCustomerId: number | null; usedByName: string; usedByPhone?: string | null; orderId?: number | null; amountCredited: string }): Promise<void> {
    await db.insert(referralUses).values({
      referrerCustomerId: data.referrerCustomerId,
      usedByCustomerId: data.usedByCustomerId,
      usedByName: data.usedByName,
      usedByPhone: data.usedByPhone || null,
      orderId: data.orderId || null,
      amountCredited: data.amountCredited,
    });
    await db.execute(sql`UPDATE customers SET wallet_balance = wallet_balance + ${data.amountCredited} WHERE id = ${data.referrerCustomerId}`);
  }
  async getReferralHistory(customerId: number): Promise<ReferralUse[]> {
    return db.select().from(referralUses).where(eq(referralUses.referrerCustomerId, customerId)).orderBy(desc(referralUses.createdAt));
  }

  async createStaff(data: { username: string; password: string; fullName: string; role: string; permissions?: string }): Promise<Staff> {
    const passwordHash = hashPassword(data.password);
    const [s] = await db.insert(staff).values({
      username: data.username,
      passwordHash,
      fullName: data.fullName,
      role: data.role,
      permissions: data.permissions ?? "[]",
    }).returning();
    return s;
  }
  async getStaff(): Promise<Staff[]> {
    return await db.select().from(staff).orderBy(staff.id);
  }
  async getStaffByUsername(username: string): Promise<Staff | undefined> {
    const [s] = await db.select().from(staff).where(eq(staff.username, username));
    return s;
  }
  async getStaffById(id: number): Promise<Staff | undefined> {
    const [s] = await db.select().from(staff).where(eq(staff.id, id));
    return s;
  }
  async updateStaff(id: number, patch: Partial<{ fullName: string; role: string; active: boolean; permissions: string }>): Promise<Staff | undefined> {
    const [s] = await db.update(staff).set(patch).where(eq(staff.id, id)).returning();
    return s;
  }
  async resetStaffPassword(id: number, newPassword: string): Promise<void> {
    const passwordHash = hashPassword(newPassword);
    await db.update(staff).set({ passwordHash }).where(eq(staff.id, id));
  }
  async validateStaffPassword(username: string, password: string): Promise<Staff | null> {
    const s = await this.getStaffByUsername(username);
    if (!s || !s.active) return null;
    if (!verifyPassword(password, s.passwordHash)) return null;
    return s;
  }
  async deleteStaff(id: number): Promise<boolean> {
    await db.delete(staff).where(eq(staff.id, id));
    return true;
  }

  async getStockMovements(productId?: number): Promise<StockMovement[]> {
    if (productId) {
      return await db.select().from(stockMovements).where(eq(stockMovements.productId, productId)).orderBy(desc(stockMovements.id)).limit(200);
    }
    return await db.select().from(stockMovements).orderBy(desc(stockMovements.id)).limit(200);
  }

  async getSetting(key: string): Promise<string | null> {
    const result = await pool.query(`SELECT value FROM app_settings WHERE key = $1`, [key]);
    if (result.rows.length === 0) return null;
    return result.rows[0].value ?? null;
  }
  async setSetting(key: string, value: string): Promise<void> {
    await pool.query(
      `INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [row] = await db.insert(notifications).values(data).returning();
    return row;
  }

  async getNotificationsForCustomer(customerId: number, limit = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.customerId, customerId))
      .orderBy(desc(notifications.id))
      .limit(limit);
  }

  async countUnreadNotifications(customerId: number): Promise<number> {
    const r = await pool.query(
      `SELECT COUNT(*)::int AS c FROM notifications WHERE customer_id = $1 AND is_read = false`,
      [customerId]
    );
    return r.rows[0]?.c ?? 0;
  }

  async markNotificationRead(id: number, customerId: number): Promise<boolean> {
    const r = await pool.query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND customer_id = $2`,
      [id, customerId]
    );
    return (r.rowCount ?? 0) > 0;
  }

  async markAllNotificationsRead(customerId: number): Promise<number> {
    const r = await pool.query(
      `UPDATE notifications SET is_read = true WHERE customer_id = $1 AND is_read = false`,
      [customerId]
    );
    return r.rowCount ?? 0;
  }

  async broadcastNotification(data: Omit<InsertNotification, "customerId">): Promise<number> {
    const r = await pool.query(
      `INSERT INTO notifications (customer_id, type, title, message, link)
       SELECT id, $1, $2, $3, $4 FROM customers`,
      [data.type, data.title, data.message, data.link ?? null]
    );
    return r.rowCount ?? 0;
  }
}

export const storage = new DatabaseStorage();

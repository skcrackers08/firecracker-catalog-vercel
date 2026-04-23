import { db, pool } from "./db";
import {
  products,
  orders,
  customers,
  staff,
  stockMovements,
  type Product,
  type Order,
  type Customer,
  type Staff,
  type StockMovement,
  type InsertProduct,
  type InsertOrder,
  type InsertCustomer,
  type InsertStockMovement,
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
}

export const storage = new DatabaseStorage();

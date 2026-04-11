import { db, pool } from "./db";
import {
  products,
  orders,
  customers,
  type Product,
  type Order,
  type Customer,
  type InsertProduct,
  type InsertOrder,
  type InsertCustomer
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const inputHash = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(inputHash, "hex"));
}

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  getOrdersByPhone(phone: string): Promise<Order[]>;
  createCustomer(data: { username: string; password: string; phone: string }): Promise<Customer>;
  getCustomerByUsername(username: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  verifyCustomerPhone(customerId: number): Promise<void>;
  validateCustomerPassword(username: string, password: string): Promise<Customer | null>;
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
    const [updatedProduct] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async getOrdersByPhone(phone: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerPhone, phone));
  }

  async createCustomer(data: { username: string; password: string; phone: string }): Promise<Customer> {
    const passwordHash = hashPassword(data.password);
    const [customer] = await db
      .insert(customers)
      .values({ username: data.username, passwordHash, phone: data.phone })
      .returning();
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
    const customer = await this.getCustomerByUsername(username);
    if (!customer) return null;
    if (!verifyPassword(password, customer.passwordHash)) return null;
    return customer;
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

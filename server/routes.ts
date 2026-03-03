import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { products } from "@shared/schema";

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    await db.insert(products).values([
      {
        name: "Standard Sparklers (Box of 10)",
        description: "Bright and colorful sparklers perfect for kids and adults alike. Burns for approximately 1 minute.",
        price: "150.00",
        imageUrl: "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=800",
        category: "Sparklers",
      },
      {
        name: "Ground Chakkars (Box of 25)",
        description: "Classic spinning firecrackers that create a beautiful glowing circle on the ground.",
        price: "200.00",
        imageUrl: "https://images.unsplash.com/photo-1542154564-963d5966601b?auto=format&fit=crop&q=80&w=800",
        category: "Ground Crackers",
      },
      {
        name: "Flower Pots Deluxe (Pack of 5)",
        description: "Premium flower pots that shoot up brilliant fountains of colorful sparks up to 10 feet.",
        price: "450.00",
        imageUrl: "https://images.unsplash.com/photo-1481023848149-166fb94b2853?auto=format&fit=crop&q=80&w=800",
        category: "Flower Pots",
      },
      {
        name: "Sky Shot Rockets (Pack of 6)",
        description: "High-flying rockets that burst into colorful patterns in the night sky.",
        price: "600.00",
        imageUrl: "https://images.unsplash.com/photo-1498843516560-6b66d5ed330a?auto=format&fit=crop&q=80&w=800",
        category: "Rockets",
      }
    ]);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  seedDatabase().catch(console.error);

  app.get(api.products.list.path, async (req, res) => {
    const productsList = await storage.getProducts();
    res.json(productsList);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const customerId = req.session.customerId ?? null;
      const order = await storage.createOrder({ ...input, customerId });
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch(api.products.update.path, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), input);
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    const success = await storage.deleteProduct(Number(req.params.id));
    if (!success) return res.status(404).json({ message: 'Product not found' });
    res.status(204).end();
  });

  app.post("/api/customers/send-otp", async (req, res) => {
    try {
      const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
      const otp = generateOtp();
      otpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
      res.json({ success: true, otp });
    } catch (err) {
      res.status(400).json({ message: "Invalid phone number" });
    }
  });

  app.post("/api/customers/verify-otp", async (req, res) => {
    try {
      const { phone, otp } = z.object({ phone: z.string(), otp: z.string() }).parse(req.body);
      const stored = otpStore.get(phone);
      if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      otpStore.delete(phone);
      const customer = await storage.getCustomerByPhone(phone);
      if (customer) {
        await storage.verifyCustomerPhone(customer.id);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: "Verification failed" });
    }
  });

  app.post("/api/customers/register", async (req, res) => {
    try {
      const { username, password, phone } = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        phone: z.string().min(10),
      }).parse(req.body);

      const existingByUsername = await storage.getCustomerByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingByPhone = await storage.getCustomerByPhone(phone);
      if (existingByPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      const customer = await storage.createCustomer({ username, password, phone });
      const { passwordHash: _, ...safeCustomer } = customer;
      req.session.customerId = customer.id;
      res.status(201).json(safeCustomer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/customers/login", async (req, res) => {
    try {
      const { username, password } = z.object({
        username: z.string(),
        password: z.string(),
      }).parse(req.body);

      const customer = await storage.validateCustomerPassword(username, password);
      if (!customer) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const { passwordHash: _, ...safeCustomer } = customer;
      req.session.customerId = customer.id;
      res.json(safeCustomer);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post("/api/customers/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/customers/me", async (req, res) => {
    if (!req.session.customerId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    const customer = await storage.getCustomerById(req.session.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const { passwordHash: _, ...safeCustomer } = customer;
    res.json(safeCustomer);
  });

  app.get("/api/customers/orders", async (req, res) => {
    if (!req.session.customerId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    const customerOrders = await storage.getOrdersByCustomer(req.session.customerId);
    res.json(customerOrders);
  });

  return httpServer;
}

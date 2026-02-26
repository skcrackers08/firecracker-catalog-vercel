import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { products } from "@shared/schema";

async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    await db.insert(products).values([
      {
        name: "Standard Sparklers (Box of 10)",
        description: "Bright and colorful sparklers perfect for kids and adults alike. Burns for approximately 1 minute.",
        price: "150.00",
        imageUrl: "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=800",
      },
      {
        name: "Ground Chakkars (Box of 25)",
        description: "Classic spinning firecrackers that create a beautiful glowing circle on the ground.",
        price: "200.00",
        imageUrl: "https://images.unsplash.com/photo-1542154564-963d5966601b?auto=format&fit=crop&q=80&w=800",
      },
      {
        name: "Flower Pots Deluxe (Pack of 5)",
        description: "Premium flower pots that shoot up brilliant fountains of colorful sparks up to 10 feet.",
        price: "450.00",
        imageUrl: "https://images.unsplash.com/photo-1481023848149-166fb94b2853?auto=format&fit=crop&q=80&w=800",
      },
      {
        name: "Sky Shot Rockets (Pack of 6)",
        description: "High-flying rockets that burst into colorful patterns in the night sky.",
        price: "600.00",
        imageUrl: "https://images.unsplash.com/photo-1498843516560-6b66d5ed330a?auto=format&fit=crop&q=80&w=800",
      }
    ]);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed the database with initial products
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
      const order = await storage.createOrder(input);
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

  return httpServer;
}

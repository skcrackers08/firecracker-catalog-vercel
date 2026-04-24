import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { db } from "./db";
import { products } from "@shared/schema";
import { sendInvoiceEmail } from "./email";
import { registerAdminProRoutes, seedDefaultStaff } from "./admin-pro-routes";
import { sendOtpSms } from "./sms";
import OpenAI from "openai";

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
  seedDefaultStaff().catch(console.error);
  registerAdminProRoutes(app);

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
      if (order.customerEmail) {
        sendInvoiceEmail(order).catch((err) => {
          console.error("[Email] Failed to send invoice:", err?.message ?? err);
        });
      }
      // Process referral credit (best-effort, non-blocking)
      const promoCode: string | undefined = (req.body?.promoCode || "").toString().trim().toUpperCase();
      if (promoCode) {
        try {
          const referrer = await storage.getCustomerByReferralCode(promoCode);
          if (referrer && referrer.id !== customerId && referrer.referralPercentage > 0) {
            const subtotal = Number(order.subtotal || 0);
            const credit = (subtotal * referrer.referralPercentage / 100).toFixed(2);
            if (Number(credit) > 0) {
              await storage.creditReferralUse({
                referrerCustomerId: referrer.id,
                usedByCustomerId: customerId,
                usedByName: order.customerName,
                usedByPhone: order.customerPhone,
                orderId: order.id,
                amountCredited: credit,
              });
            }
          }
        } catch (e) {
          console.error("[Referral] credit failed:", (e as Error).message);
        }
      }
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

  const SECRET_SETTING_KEYS = new Set([
    "openai-api-key",
    "brevo-smtp-key",
    "startmessaging-api-key",
    "fast2sms-api-key",
  ]);

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const value = await storage.getSetting(key);
      if (SECRET_SETTING_KEYS.has(key)) {
        const v = (value ?? "").trim();
        if (!v) return res.json({ value: "", configured: false, masked: "" });
        const masked = v.length <= 6 ? "•".repeat(v.length) : `${v.slice(0, 3)}${"•".repeat(Math.max(4, v.length - 7))}${v.slice(-4)}`;
        return res.json({ value: "", configured: true, masked });
      }
      if (value === null) return res.json({ value: null });
      res.json({ value });
    } catch (err) {
      res.status(500).json({ message: 'Failed to get setting' });
    }
  });

  app.post("/api/settings/:key", async (req, res) => {
    try {
      const { value } = z.object({ value: z.string() }).parse(req.body);
      await storage.setSetting(req.params.key, value);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: 'Failed to save setting' });
    }
  });

  app.post("/api/customers/send-otp", async (req, res) => {
    try {
      const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
      const otp = generateOtp();
      otpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

      const result = await sendOtpSms(phone, otp);
      if (!result.success) console.error(`[SMS:${result.provider}] Failed:`, result.error);
      if (result.success) {
        res.json({ success: true, smsSent: true, provider: result.provider });
      } else {
        res.json({ success: true, smsSent: false, otp, provider: result.provider, error: result.error });
      }
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

      let customer = await storage.getCustomerByPhone(phone);
      if (customer) {
        await storage.verifyCustomerPhone(customer.id);
      } else {
        const autoUsername = `user_${phone}`;
        customer = await storage.createCustomer({ username: autoUsername, password: `__otp_${Date.now()}__`, phone });
        await storage.verifyCustomerPhone(customer.id);
      }

      req.session.customerId = customer.id;
      const { passwordHash: _, ...safeCustomer } = customer;
      res.json({ success: true, customer: safeCustomer });
    } catch (err) {
      res.status(400).json({ message: "Verification failed" });
    }
  });

  app.post("/api/customers/register", async (req, res) => {
    try {
      const { username, password, phone, fullName, email } = z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        phone: z.string().min(10),
        fullName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
      }).parse(req.body);

      const existingByUsername = await storage.getCustomerByUsername(username);
      if (existingByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const existingByPhone = await storage.getCustomerByPhone(phone);
      if (existingByPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      const customer = await storage.createCustomer({
        username,
        password,
        phone,
        fullName: fullName?.trim() || undefined,
        email: email?.trim() || undefined,
      });
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

  app.post("/api/customers/forgot-password/send-otp", async (req, res) => {
    try {
      const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
      const customer = await storage.getCustomerByPhone(phone);
      if (!customer) {
        return res.status(404).json({ message: "No account found with this phone number" });
      }
      const otp = generateOtp();
      otpStore.set(`reset_${phone}`, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

      const result = await sendOtpSms(phone, otp);
      if (result.success) res.json({ success: true, smsSent: true, provider: result.provider });
      else res.json({ success: true, smsSent: false, otp, provider: result.provider, error: result.error });
    } catch (err) {
      res.status(400).json({ message: "Invalid phone number" });
    }
  });

  app.post("/api/customers/forgot-password/reset", async (req, res) => {
    try {
      const { phone, otp, newPassword } = z.object({
        phone: z.string(),
        otp: z.string(),
        newPassword: z.string().min(6),
      }).parse(req.body);

      const stored = otpStore.get(`reset_${phone}`);
      if (!stored || stored.otp !== otp || Date.now() > stored.expiresAt) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      otpStore.delete(`reset_${phone}`);

      const customer = await storage.getCustomerByPhone(phone);
      if (!customer) {
        return res.status(404).json({ message: "Account not found" });
      }
      await storage.updateCustomerPassword(customer.id, newPassword);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Password reset failed" });
    }
  });

  app.post("/api/customers/change-password", async (req, res) => {
    if (!req.session.customerId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    try {
      const { oldPassword, newPassword } = z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      }).parse(req.body);

      const customer = await storage.getCustomerById(req.session.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      const valid = await storage.validateCustomerPassword(customer.username, oldPassword);
      if (!valid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      await storage.updateCustomerPassword(customer.id, newPassword);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Failed to change password" });
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

  app.get("/api/customers/me/partner", async (req, res) => {
    if (!req.session.customerId) return res.status(401).json({ message: "Not logged in" });
    const customer = await storage.getCustomerById(req.session.customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    const history = await storage.getReferralHistory(customer.id);
    res.json({
      referralCode: customer.referralCode,
      referralPercentage: customer.referralPercentage,
      walletBalance: customer.walletBalance,
      history,
    });
  });

  app.post("/api/customers/me/partner", async (req, res) => {
    try {
      if (!req.session.customerId) return res.status(401).json({ message: "Not logged in" });
      const { percentage } = z.object({
        percentage: z.number().int().min(0).max(20),
      }).parse(req.body);
      const updated = await storage.setCustomerReferral(req.session.customerId, percentage);
      if (!updated) return res.status(404).json({ message: "Customer not found" });
      res.json({
        referralCode: updated.referralCode,
        referralPercentage: updated.referralPercentage,
        walletBalance: updated.walletBalance,
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update referral settings" });
    }
  });

  app.patch("/api/customers/me", async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ message: "Not logged in" });
      }
      const patch = z.object({
        fullName: z.string().max(120).optional(),
        email: z.string().email().optional().or(z.literal("")),
        address: z.string().max(500).optional(),
        profilePhoto: z.string().max(700_000, "Image is too large").optional(),
      }).parse(req.body);

      const cleaned: any = {};
      if (patch.fullName !== undefined) cleaned.fullName = patch.fullName.trim() || null;
      if (patch.email !== undefined) cleaned.email = (patch.email || "").trim() || null;
      if (patch.address !== undefined) cleaned.address = patch.address.trim() || null;
      if (patch.profilePhoto !== undefined) cleaned.profilePhoto = patch.profilePhoto || null;

      const updated = await storage.updateCustomerProfile(req.session.customerId, cleaned);
      if (!updated) return res.status(404).json({ message: "Customer not found" });
      const { passwordHash: _, ...safe } = updated;
      res.json(safe);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  function getAutoReply(message: string, waNumber: string): string {
    const text = message.toLowerCase();
    if (text.includes("offer") || text.includes("discount")) {
      return "Current offer: Up to 50% OFF for online enquiry. Final order confirmation will be done manually via WhatsApp.";
    }
    if (text.includes("order") || text.includes("how to order") || text.includes("buy") || text.includes("purchase")) {
      return "To place an order: 1) Add products to enquiry  2) Click Send Enquiry  3) Send details via WhatsApp  4) Our team will confirm your order manually.";
    }
    if (text.includes("cancel")) {
      return `To cancel your order, please send your order number and mobile number to WhatsApp: ${waNumber}. Our team will check and confirm the cancellation.`;
    }
    if (/\bpay\b|payment|\bupi\b|\bqr\b|gpay|phonepe|paytm/.test(text)) {
      return "Payment is accepted only after manual order confirmation via enquiry. No direct online payment facility is available.";
    }
    if (text.includes("refund") || text.includes("credit") || text.includes("return")) {
      return `Refund/credit timing depends on payment method and order status. Please share your order details on WhatsApp: ${waNumber} for confirmation.`;
    }
    if (text.includes("delivery") || text.includes("transport") || text.includes("ship") || text.includes("courier")) {
      return "Transport details will be shared within 24-48 hours after order confirmation. Transport charges should be paid directly while collecting the parcel.";
    }
    if (text.includes("contact") || text.includes("phone") || text.includes("number") || text.includes("whatsapp")) {
      return `You can reach S K Crackers on WhatsApp: ${waNumber}. We respond quickly during business hours.`;
    }
    if (text.includes("hi") || text.includes("hello") || text.includes("hey")) {
      return "Hello! Welcome to S K Crackers. Ask me about products, offers, how to order, payment, cancellation, or transport.";
    }
    return "Thank you for contacting S K Crackers. Please ask about products, offers, order, payment, cancellation, or transport details.";
  }

  const chatRateLimit = new Map<string, { count: number; resetAt: number }>();
  app.post("/api/chat", async (req, res) => {
    try {
      const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()) || req.ip || "unknown";
      const now = Date.now();
      const entry = chatRateLimit.get(ip);
      if (entry && entry.resetAt > now) {
        if (entry.count >= 12) {
          return res.status(429).json({ reply: "Too many messages. Please wait a minute and try again." });
        }
        entry.count++;
      } else {
        chatRateLimit.set(ip, { count: 1, resetAt: now + 60_000 });
      }
      if (chatRateLimit.size > 5000) {
        for (const [k, v] of chatRateLimit) if (v.resetAt < now) chatRateLimit.delete(k);
      }
      const { message } = z.object({ message: z.string().min(1).max(1000) }).parse(req.body);
      const waSetting = await storage.getSetting("whatsapp-number");
      const waNumber = (waSetting || "919344468937").replace(/\D/g, "");
      const dbKey = await storage.getSetting("openai-api-key");
      const apiKey = (dbKey && dbKey.trim()) || process.env.OPENAI_API_KEY || "";
      if (!apiKey) {
        return res.json({ reply: getAutoReply(message, waNumber), source: "auto" });
      }
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 250,
        messages: [
          {
            role: "system",
            content:
              `You are S K Crackers AI Help assistant.\n\nRules:\n- This website is only for product enquiry.\n- Do not confirm orders automatically.\n- Always tell the customer that orders are confirmed manually through WhatsApp.\n- WhatsApp number: ${waNumber}.\n- Share payment details only after order confirmation.\n- Do not explain how to make fireworks or anything unsafe.\n- Give short, simple, friendly answers (2-4 sentences).`,
          },
          { role: "user", content: message },
        ],
      });
      const reply = completion.choices?.[0]?.message?.content?.trim() || getAutoReply(message, waNumber);
      res.json({ reply, source: "ai" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error("AI chat error:", err?.message || err);
      const waSetting = await storage.getSetting("whatsapp-number").catch(() => null);
      const waNumber = (waSetting || "919344468937").replace(/\D/g, "");
      const userMsg = (req.body && typeof req.body.message === "string") ? req.body.message : "";
      res.json({ reply: getAutoReply(userMsg, waNumber), source: "auto" });
    }
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

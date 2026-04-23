import { pgTable, text, serial, integer, numeric, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  "Sparklers",
  "Flower Pots",
  "Twinkling Star",
  "Chakkars",
  "Fancy Wheels",
  "Fancy Fountains",
  "Peacock Series",
  "Mini Fancy",
  "Fancy Colour Shots",
  "Sky Shots",
  "One Sound Crackers",
  "Bomb Varieties",
  "Rockets",
  "Wala",
  "Kids Item",
  "Bijili Crackers",
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export const ORDER_STATUSES = ["new", "confirmed", "packed", "dispatched", "delivered", "cancelled"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const PAYMENT_STATUSES = ["pending", "partial", "paid", "refunded"] as const;
export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const STAFF_ROLES = ["superadmin", "manager", "staff", "viewer"] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  videoUrl: text("video_url"),
  category: text("category").notNull().default("Sparklers"),
  subgroup: text("subgroup").default(""),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  productCode: text("product_code"),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull().unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  fullName: text("full_name"),
  email: text("email"),
  address: text("address"),
  profilePhoto: text("profile_photo"),
  referralCode: text("referral_code").unique(),
  referralPercentage: integer("referral_percentage").notNull().default(0),
  walletBalance: numeric("wallet_balance", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const referralUses = pgTable("referral_uses", {
  id: serial("id").primaryKey(),
  referrerCustomerId: integer("referrer_customer_id").notNull(),
  usedByCustomerId: integer("used_by_customer_id"),
  usedByName: text("used_by_name").notNull(),
  usedByPhone: text("used_by_phone"),
  orderId: integer("order_id"),
  amountCredited: numeric("amount_credited", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  customerAddress: text("customer_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  gstAmount: numeric("gst_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  customerId: integer("customer_id"),
  cartItems: text("cart_items"),
  orderStatus: text("order_status").notNull().default("new"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  lorryName: text("lorry_name"),
  lrNumber: text("lr_number"),
  transportContact: text("transport_contact"),
  dispatchDate: text("dispatch_date"),
  destination: text("destination"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("staff"),
  permissions: text("permissions").notNull().default("[]"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  changeQty: integer("change_qty").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const updateProductSchema = createInsertSchema(products).partial().omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, phoneVerified: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true, passwordHash: true }).extend({
  password: z.string().min(6),
});
export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type ReferralUse = typeof referralUses.$inferSelect;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

export type CreateOrderRequest = InsertOrder;
export type OrderResponse = Order;
export type ProductResponse = Product;

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
  bankAccountHolder: text("bank_account_holder"),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfsc: text("bank_ifsc"),
  bankUpi: text("bank_upi"),
});

export const WALLET_TX_TYPES = ["withdrawal", "purchase"] as const;
export type WalletTxType = typeof WALLET_TX_TYPES[number];
export const WALLET_TX_STATUSES = ["pending", "completed", "rejected"] as const;
export type WalletTxStatus = typeof WALLET_TX_STATUSES[number];

export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  productDetails: text("product_details"),
  bankSnapshot: text("bank_snapshot"),
  invoiceNumber: text("invoice_number"),
  transactionRef: text("transaction_ref"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  transportRemarks: text("transport_remarks"),
  invoiceSentAt: timestamp("invoice_sent_at"),
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

export const NOTIFICATION_TYPES = [
  "order_confirmed",
  "order_status",
  "order_cancelled",
  "wallet_credit",
  "wallet_debit",
  "referral_join",
  "offer",
  "broadcast",
] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true, isRead: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  whatsappText: text("whatsapp_text").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true }).extend({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;

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

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export const insertWalletTxSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export type InsertWalletTransaction = z.infer<typeof insertWalletTxSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;

export type CreateOrderRequest = InsertOrder;
export type OrderResponse = Order;
export type ProductResponse = Product;

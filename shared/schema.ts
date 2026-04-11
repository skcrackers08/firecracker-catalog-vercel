import { pgTable, text, serial, integer, numeric, boolean } from "drizzle-orm/pg-core";
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

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  videoUrl: text("video_url"),
  category: text("category").notNull().default("Sparklers"),
  subgroup: text("subgroup").default(""),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull().unique(),
  phoneVerified: boolean("phone_verified").notNull().default(false),
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
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const updateProductSchema = createInsertSchema(products).partial().omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, phoneVerified: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type CreateOrderRequest = InsertOrder;
export type OrderResponse = Order;
export type ProductResponse = Product;

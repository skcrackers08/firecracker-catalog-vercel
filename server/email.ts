import nodemailer from "nodemailer";
import type { Order } from "@shared/schema";
import { storage } from "./storage";

interface CartItem {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  quantity: number;
  lineTotal: string;
}

interface BrevoConfig {
  host: string;
  port: number;
  login: string;
  key: string;
  fromEmail: string;
  fromName: string;
}

const DEFAULTS = {
  host: "smtp-relay.brevo.com",
  port: "587",
  login: "a893c9001@smtp-brevo.com",
  fromEmail: "invoice@skcrackers.net",
  fromName: "S K Crackers",
};

function parseCartItems(raw: string | null | undefined): CartItem[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function formatPaymentMethod(pm: string): string {
  if (pm === "whatsapp-enquiry") return "WhatsApp Enquiry";
  if (pm.startsWith("upi-phonepe")) return "PhonePe UPI";
  if (pm.startsWith("upi-gpay")) return "Google Pay UPI";
  if (pm.startsWith("upi-paytm")) return "Paytm UPI";
  if (pm.startsWith("upi")) return "UPI Payment";
  if (pm.startsWith("card-debit")) return "Debit Card";
  if (pm.startsWith("card-credit")) return "Credit Card";
  if (pm === "cod") return "Cash on Delivery";
  return pm;
}

function buildInvoiceHtml(order: Order, fromName: string): string {
  const items = parseCartItems(order.cartItems);
  const date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e0c8;font-size:14px;color:#333;">${item.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e0c8;font-size:14px;color:#555;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e0c8;font-size:14px;color:#555;text-align:right;">₹${Number(item.price).toFixed(2)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e0c8;font-size:14px;font-weight:600;color:#b91c1c;text-align:right;">₹${item.lineTotal}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${fromName} – Invoice #${order.id}</title></head>
<body style="margin:0;padding:0;background:#fdf6ee;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee;padding:24px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#b91c1c 0%,#7f1d1d 100%);padding:32px 32px 24px;text-align:center;">
<p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#fff;letter-spacing:1px;">🎆 ${fromName.toUpperCase()}</p>
<p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Order Confirmation &amp; Invoice</p>
</td></tr>
<tr><td style="background:#fef3c7;padding:14px 32px;text-align:center;border-bottom:1px solid #fde68a;">
<p style="margin:0;font-size:13px;color:#92400e;">Order ID: <strong style="font-size:15px;color:#78350f;">#SK-${String(order.id).padStart(4, "0")}</strong> &nbsp;|&nbsp; Date: <strong>${date}</strong></p>
</td></tr>
<tr><td style="padding:28px 32px;">
<p style="margin:0 0 20px;font-size:16px;color:#374151;">Dear <strong>${order.customerName}</strong>,<br>
<span style="color:#6b7280;font-size:14px;">Thank you for your enquiry with ${fromName}! Here is a summary of your enquiry. Our team will contact you on WhatsApp to confirm and share payment details.</span></p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
<tr><td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;"><p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Customer Details</p></td></tr>
<tr><td style="padding:12px 16px;"><table width="100%" cellpadding="0" cellspacing="0">
<tr><td width="30%" style="padding:4px 0;font-size:13px;color:#6b7280;">📱 Phone</td><td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">+91 ${order.customerPhone}</td></tr>
${order.customerEmail ? `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">✉️ Email</td><td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${order.customerEmail}</td></tr>` : ""}
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;vertical-align:top;">📍 Address</td><td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${order.customerAddress}</td></tr>
<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">💳 Payment</td><td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${formatPaymentMethod(order.paymentMethod)}</td></tr>
</table></td></tr></table>
<p style="margin:0 0 10px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order Items</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #f0e0c8;margin-bottom:20px;">
<thead><tr style="background:#fef3c7;">
<th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
<th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
<th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Unit Price</th>
<th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
</tr></thead><tbody>
${itemRows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">No item details available</td></tr>`}
</tbody></table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Estimated Amount</td><td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">₹${Number(order.subtotal).toFixed(2)}</td></tr>
<tr><td style="padding:6px 0;font-size:14px;color:#6b7280;">Handling Charges (3%)</td><td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">₹${Number(order.gstAmount).toFixed(2)}</td></tr>
<tr><td colspan="2" style="padding:4px 0;border-top:2px solid #e5e7eb;"></td></tr>
<tr><td style="padding:8px 0 0;font-size:18px;font-weight:700;color:#b91c1c;">Estimated Total</td><td style="padding:8px 0 0;font-size:18px;font-weight:700;color:#b91c1c;text-align:right;">₹${Number(order.totalAmount).toFixed(2)}</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#ecfdf5;border-radius:10px;border:1px solid #6ee7b7;">
<tr><td style="padding:14px 16px;text-align:center;">
<p style="margin:0;font-size:15px;font-weight:600;color:#065f46;">✅ Enquiry Received!</p>
<p style="margin:4px 0 0;font-size:12px;color:#059669;">Our team will confirm your enquiry on WhatsApp and share payment details shortly.</p>
</td></tr></table>
<p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">For any queries, reply to this email or contact us.<br>Thank you for choosing ${fromName} – Celebrate safely! 🎇</p>
</td></tr>
<tr><td style="background:#fef3c7;padding:16px 32px;text-align:center;border-top:1px solid #fde68a;">
<p style="margin:0;font-size:12px;color:#92400e;">© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function getBrevoConfig(): Promise<BrevoConfig | null> {
  const [host, port, login, key, fromEmail, fromName] = await Promise.all([
    storage.getSetting("brevo-smtp-host"),
    storage.getSetting("brevo-smtp-port"),
    storage.getSetting("brevo-smtp-login"),
    storage.getSetting("brevo-smtp-key"),
    storage.getSetting("brevo-from-email"),
    storage.getSetting("brevo-from-name"),
  ]);

  const finalKey = (key || process.env.BREVO_SMTP_KEY || "").trim();
  if (!finalKey) return null;

  return {
    host: (host || process.env.BREVO_SMTP_HOST || DEFAULTS.host).trim(),
    port: Number((port || process.env.BREVO_SMTP_PORT || DEFAULTS.port).trim()),
    login: (login || process.env.BREVO_SMTP_LOGIN || DEFAULTS.login).trim(),
    key: finalKey,
    fromEmail: (fromEmail || process.env.FROM_EMAIL || DEFAULTS.fromEmail).trim(),
    fromName: (fromName || process.env.FROM_NAME || DEFAULTS.fromName).trim(),
  };
}

function buildWalletTxHtml(opts: {
  fromName: string;
  customerName: string;
  invoiceNumber: string;
  amount: string;
  type: "withdrawal" | "purchase";
  status: "completed" | "rejected";
  productDetails?: string | null;
  bankSnapshot?: string | null;
  transactionRef?: string | null;
  notes?: string | null;
}): string {
  const isWithdraw = opts.type === "withdrawal";
  const isApproved = opts.status === "completed";
  const headTitle = isWithdraw
    ? (isApproved ? "Withdrawal Approved" : "Withdrawal Rejected")
    : (isApproved ? "Wallet Purchase Confirmed" : "Wallet Purchase Rejected");
  const accent = isApproved ? "#065f46" : "#991b1b";
  const accentBg = isApproved ? "#ecfdf5" : "#fef2f2";
  const accentBorder = isApproved ? "#6ee7b7" : "#fecaca";
  // HTML-escape any user/admin-provided dynamic content to prevent injection.
  const esc = (v: string | null | undefined) =>
    String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  let bank: any = {};
  try { bank = opts.bankSnapshot ? JSON.parse(opts.bankSnapshot) : {}; } catch {}
  const cleanedNotes = opts.notes ? opts.notes.replace(/\[Admin remark\]\s*/g, "") : "";
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${esc(opts.fromName)} - ${headTitle}</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111827;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:24px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:linear-gradient(135deg,#f97316 0%,#ea580c 100%);padding:28px 32px;color:#fff;">
<h1 style="margin:0;font-size:22px;letter-spacing:1px;">${esc(opts.fromName)}</h1>
<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.9);text-transform:uppercase;letter-spacing:2px;">${headTitle}</p>
</td></tr>
<tr><td style="padding:28px 32px;">
<p style="margin:0 0 12px;font-size:14px;color:#374151;">Hi <b>${esc(opts.customerName) || "Partner"}</b>,</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${accentBg};border:1px solid ${accentBorder};border-radius:10px;margin-bottom:20px;">
<tr><td style="padding:14px 16px;text-align:center;">
<p style="margin:0;font-size:15px;font-weight:600;color:${accent};">${headTitle}</p>
<p style="margin:4px 0 0;font-size:13px;color:${accent};">Invoice <b>${esc(opts.invoiceNumber)}</b> &middot; Amount <b>₹${Number(opts.amount).toFixed(2)}</b></p>
</td></tr></table>
${!isWithdraw && isApproved ? `<p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#065f46;text-align:center;background:#ecfdf5;border:1px solid #6ee7b7;padding:10px 12px;border-radius:8px;">Your order successfully confirmed</p>` : ""}
${opts.transactionRef ? `<p style="margin:0 0 8px;font-size:13px;color:#374151;"><b>${isWithdraw ? "Reference Number" : "Remarks"}:</b> ${esc(opts.transactionRef)}</p>` : ""}
${isWithdraw && bank?.accountNumber ? `<p style="margin:0 0 8px;font-size:13px;color:#374151;"><b>Bank:</b> ${esc(bank.bankName) || "-"} &middot; A/C ${esc(bank.accountNumber)} &middot; IFSC ${esc(bank.ifsc) || "-"}</p>` : ""}
${!isWithdraw && opts.productDetails ? `<p style="margin:8px 0 4px;font-size:13px;color:#111827;font-weight:600;">Selected Items</p><pre style="margin:0;padding:10px;background:#f3f4f6;border-radius:6px;font-family:inherit;font-size:12px;color:#111827;white-space:pre-wrap;">${esc(opts.productDetails)}</pre>` : ""}
${cleanedNotes ? `<p style="margin:12px 0 0;font-size:12px;color:#6b7280;"><b>${opts.status === "rejected" ? "Reason" : "Notes"}:</b> ${esc(cleanedNotes)}</p>` : ""}
<p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">For any queries, reply to this email or message us on WhatsApp. Thank you for partnering with ${esc(opts.fromName)}.</p>
</td></tr>
<tr><td style="background:#fef3c7;padding:14px 32px;text-align:center;border-top:1px solid #fde68a;">
<p style="margin:0;font-size:12px;color:#92400e;">© ${new Date().getFullYear()} ${esc(opts.fromName)}. All rights reserved.</p>
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendWalletTxEmail(opts: {
  customerEmail: string | null;
  customerName: string | null;
  invoiceNumber: string;
  amount: string;
  type: "withdrawal" | "purchase";
  status: "completed" | "rejected";
  productDetails?: string | null;
  bankSnapshot?: string | null;
  transactionRef?: string | null;
  notes?: string | null;
}): Promise<void> {
  if (!opts.customerEmail) return;
  const cfg = await getBrevoConfig();
  if (!cfg) {
    console.warn("[Email] Brevo SMTP key not configured – skipping wallet tx email.");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, secure: false,
    auth: { user: cfg.login, pass: cfg.key },
  });
  const html = buildWalletTxHtml({
    fromName: cfg.fromName,
    customerName: opts.customerName || "Partner",
    invoiceNumber: opts.invoiceNumber,
    amount: opts.amount,
    type: opts.type,
    status: opts.status,
    productDetails: opts.productDetails,
    bankSnapshot: opts.bankSnapshot,
    transactionRef: opts.transactionRef,
    notes: opts.notes,
  });
  const subject = `${opts.status === "completed" ? "✅" : "⚠️"} ${opts.type === "withdrawal" ? "Withdrawal" : "Wallet Purchase"} ${opts.status === "completed" ? "Approved" : "Rejected"} – ${opts.invoiceNumber}`;
  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    to: opts.customerEmail,
    subject,
    html,
  });
  console.log(`[Email] Wallet ${opts.type} ${opts.status} email sent to ${opts.customerEmail} (${opts.invoiceNumber})`);
}

export async function sendTransportBillEmail(
  order: Order,
  pdfBase64: string,
  filename: string,
): Promise<void> {
  if (!order.customerEmail) return;
  const cfg = await getBrevoConfig();
  if (!cfg) {
    console.warn("[Email] Brevo SMTP key not configured – skipping transport bill email.");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: cfg.host, port: cfg.port, secure: false,
    auth: { user: cfg.login, pass: cfg.key },
  });
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fdf6ee;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee;padding:24px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#b91c1c 0%,#7f1d1d 100%);padding:24px 32px;text-align:center;">
<p style="margin:0;font-size:24px;font-weight:800;color:#fff;letter-spacing:1px;">🚚 ${cfg.fromName.toUpperCase()}</p>
<p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:1px;text-transform:uppercase;">Transport Bill — Order #SK-${String(order.id).padStart(4, "0")}</p>
</td></tr>
<tr><td style="padding:28px 32px;">
<p style="margin:0 0 14px;font-size:16px;color:#374151;">Dear <strong>${order.customerName}</strong>,</p>
<p style="margin:0 0 14px;font-size:14px;color:#4b5563;line-height:1.6;">
Your order has been dispatched. Please find the transport bill attached for your reference.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;margin-bottom:18px;">
<tr><td style="padding:14px 18px;font-size:13px;color:#78350f;">
<b>Lorry / Transport:</b> ${order.lorryName || "—"}<br>
<b>LR Number:</b> ${order.lrNumber || "—"}<br>
<b>Dispatch Date:</b> ${order.dispatchDate || "—"}<br>
<b>Destination:</b> ${order.destination || order.customerAddress}
</td></tr></table>
<p style="margin:0 0 14px;font-size:13px;color:#6b7280;line-height:1.6;">
You can also view the transport bill any time from <b>My Requests</b> in your S K Crackers account.
</p>
<p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">— Team ${cfg.fromName}</p>
</td></tr></table></td></tr></table></body></html>`;
  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    to: order.customerEmail,
    subject: `🚚 Transport Bill — Order #SK-${String(order.id).padStart(4, "0")}`,
    html,
    attachments: [{ filename, content: Buffer.from(pdfBase64, "base64"), contentType: "application/pdf" }],
  });
  console.log(`[Email] Transport bill sent for order #${order.id} to ${order.customerEmail}`);
}

export async function sendInvoiceEmail(order: Order): Promise<void> {
  if (!order.customerEmail) return;

  const cfg = await getBrevoConfig();
  if (!cfg) {
    console.warn("[Email] Brevo SMTP key not configured – skipping invoice email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: false,
    auth: { user: cfg.login, pass: cfg.key },
  });

  const html = buildInvoiceHtml(order, cfg.fromName);

  await transporter.sendMail({
    from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
    to: order.customerEmail,
    subject: `🎆 Enquiry Received! #SK-${String(order.id).padStart(4, "0")} – ${cfg.fromName}`,
    html,
  });

  console.log(`[Email] Invoice sent for order #${order.id} to ${order.customerEmail}`);
}

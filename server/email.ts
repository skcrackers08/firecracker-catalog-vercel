import nodemailer from "nodemailer";
import type { Order } from "@shared/schema";

interface CartItem {
  id: number;
  name: string;
  price: string;
  imageUrl: string;
  quantity: number;
  lineTotal: string;
}

function parseCartItems(raw: string | null | undefined): CartItem[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function formatPaymentMethod(pm: string): string {
  if (pm.startsWith("upi-phonepe")) return "PhonePe UPI";
  if (pm.startsWith("upi-gpay")) return "Google Pay UPI";
  if (pm.startsWith("upi-paytm")) return "Paytm UPI";
  if (pm.startsWith("upi")) return "UPI Payment";
  if (pm.startsWith("card-debit")) return "Debit Card";
  if (pm.startsWith("card-credit")) return "Credit Card";
  if (pm === "cod") return "Cash on Delivery";
  return pm;
}

function buildInvoiceHtml(order: Order): string {
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SK Crackers – Order Invoice #${order.id}</title>
</head>
<body style="margin:0;padding:0;background:#fdf6ee;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#b91c1c 0%,#7f1d1d 100%);padding:32px 32px 24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#fff;letter-spacing:1px;">🎆 SK CRACKERS</p>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;">Order Confirmation &amp; Invoice</p>
            </td>
          </tr>

          <!-- Order Badge -->
          <tr>
            <td style="background:#fef3c7;padding:14px 32px;text-align:center;border-bottom:1px solid #fde68a;">
              <p style="margin:0;font-size:13px;color:#92400e;">Order ID: <strong style="font-size:15px;color:#78350f;">#SK-${String(order.id).padStart(4,"0")}</strong> &nbsp;|&nbsp; Date: <strong>${date}</strong></p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 20px;font-size:16px;color:#374151;">
                Dear <strong>${order.customerName}</strong>,<br>
                <span style="color:#6b7280;font-size:14px;">Thank you for shopping with SK Crackers! Your order has been received and is being processed. Here is your invoice summary.</span>
              </p>

              <!-- Customer Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Customer Details</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding:4px 0;font-size:13px;color:#6b7280;">📱 Phone</td>
                        <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">+91 ${order.customerPhone}</td>
                      </tr>
                      ${order.customerEmail ? `<tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">✉️ Email</td>
                        <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${order.customerEmail}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;vertical-align:top;">📍 Address</td>
                        <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${order.customerAddress}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#6b7280;">💳 Payment</td>
                        <td style="padding:4px 0;font-size:13px;color:#111827;font-weight:500;">${formatPaymentMethod(order.paymentMethod)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order Items</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #f0e0c8;margin-bottom:20px;">
                <thead>
                  <tr style="background:#fef3c7;">
                    <th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
                    <th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                    <th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Unit Price</th>
                    <th style="padding:10px 12px;font-size:12px;color:#92400e;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px;">No item details available</td></tr>`}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;">Subtotal</td>
                  <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">₹${Number(order.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#6b7280;">GST (18%)</td>
                  <td style="padding:6px 0;font-size:14px;color:#374151;text-align:right;">₹${Number(order.gstAmount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:4px 0;border-top:2px solid #e5e7eb;"></td>
                </tr>
                <tr>
                  <td style="padding:8px 0 0;font-size:18px;font-weight:700;color:#b91c1c;">Amount Paid</td>
                  <td style="padding:8px 0 0;font-size:18px;font-weight:700;color:#b91c1c;text-align:right;">₹${Number(order.totalAmount).toFixed(2)}</td>
                </tr>
              </table>

              <!-- Status Banner -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#ecfdf5;border-radius:10px;border:1px solid #6ee7b7;">
                <tr>
                  <td style="padding:14px 16px;text-align:center;">
                    <p style="margin:0;font-size:15px;font-weight:600;color:#065f46;">✅ Payment Received – Order Confirmed!</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#059669;">We will dispatch your order within 1-2 business days.</p>
                  </td>
                </tr>
              </table>

              <!-- Footer note -->
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.6;">
                For any queries, reply to this email or contact us.<br>
                Thank you for choosing SK Crackers – Celebrate safely! 🎇
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fef3c7;padding:16px 32px;text-align:center;border-top:1px solid #fde68a;">
              <p style="margin:0;font-size:12px;color:#92400e;">© ${new Date().getFullYear()} SK Crackers. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function sendInvoiceEmail(order: Order): Promise<void> {
  if (!order.customerEmail) return;

  const transport = getTransporter();
  if (!transport) {
    console.warn("[Email] GMAIL_USER or GMAIL_APP_PASSWORD not configured – skipping invoice email.");
    return;
  }

  const html = buildInvoiceHtml(order);

  await transport.sendMail({
    from: `"SK Crackers" <${process.env.GMAIL_USER}>`,
    to: order.customerEmail,
    subject: `🎆 Order Confirmed! Invoice #SK-${String(order.id).padStart(4, "0")} – SK Crackers`,
    html,
  });

  console.log(`[Email] Invoice sent for order #${order.id} to ${order.customerEmail}`);
}

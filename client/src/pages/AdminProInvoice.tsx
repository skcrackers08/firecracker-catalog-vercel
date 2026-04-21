import { useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

function fmtINR(n: number | string) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function AdminProInvoice() {
  const [, params] = useRoute("/admin-pro/invoice/:id");
  const id = params?.id;
  const { data: order } = useQuery<Order>({
    queryKey: ["/api/admin-pro/orders", id],
    queryFn: async () => {
      const r = await fetch(`/api/admin-pro/orders/${id}`);
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (order) setTimeout(() => window.print(), 400);
  }, [order]);

  if (!order) return <div className="p-8 text-center">Loading invoice…</div>;

  let items: any[] = [];
  try { items = order.cartItems ? JSON.parse(order.cartItems) : []; } catch {}
  if (items.length === 0) items = [{ name: `Product #${order.productId}`, quantity: order.quantity, price: Number(order.subtotal) / Math.max(1, order.quantity) }];

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white text-black print:p-0">
      <style>{`@media print { body { background: white; } .no-print { display: none; } }`}</style>
      <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-600">S K Crackers</h1>
          <p className="text-sm">Sivakasi, Tamil Nadu</p>
          <p className="text-sm">www.skcrackers.net</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold">INVOICE</h2>
          <p className="text-sm">Invoice #: <b>{order.id}</b></p>
          <p className="text-sm">Date: {new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="font-bold text-sm uppercase text-gray-600">Bill To</h3>
          <p className="font-semibold">{order.customerName}</p>
          <p className="text-sm">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-sm">{order.customerEmail}</p>}
          <p className="text-sm">{order.customerAddress}</p>
        </div>
        <div className="text-right">
          <h3 className="font-bold text-sm uppercase text-gray-600">Status</h3>
          <p className="text-sm">Order: <b>{order.orderStatus.toUpperCase()}</b></p>
          <p className="text-sm">Payment: <b>{order.paymentStatus.toUpperCase()}</b></p>
          <p className="text-sm">Method: {order.paymentMethod}</p>
          {order.lrNumber && <p className="text-sm">LR: {order.lrNumber} ({order.lorryName})</p>}
        </div>
      </div>

      <table className="w-full mt-6 border-collapse">
        <thead>
          <tr className="bg-amber-100 border-b-2 border-amber-500">
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">Product</th>
            <th className="text-right p-2">Qty</th>
            <th className="text-right p-2">Rate</th>
            <th className="text-right p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{it.name ?? `#${it.id}`}</td>
              <td className="p-2 text-right">{it.quantity}</td>
              <td className="p-2 text-right">{fmtINR(it.price)}</td>
              <td className="p-2 text-right">{fmtINR((it.price ?? 0) * (it.quantity ?? 0))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4} className="text-right p-2">Estimated Amount</td><td className="text-right p-2">{fmtINR(order.subtotal)}</td></tr>
          <tr><td colSpan={4} className="text-right p-2">Handling Charges (3%)</td><td className="text-right p-2">{fmtINR(order.gstAmount)}</td></tr>
          <tr className="bg-amber-100 font-bold text-lg">
            <td colSpan={4} className="text-right p-2">ESTIMATED TOTAL</td>
            <td className="text-right p-2">{fmtINR(order.totalAmount)}</td>
          </tr>
          <tr><td colSpan={4} className="text-right p-2">Paid</td><td className="text-right p-2 text-green-600">{fmtINR(order.paidAmount)}</td></tr>
          <tr><td colSpan={4} className="text-right p-2 font-bold">Balance Due</td>
            <td className="text-right p-2 text-red-600 font-bold">{fmtINR(Math.max(0, Number(order.totalAmount) - Number(order.paidAmount)))}</td></tr>
        </tfoot>
      </table>

      {order.remarks && <div className="mt-4 text-sm"><b>Remarks:</b> {order.remarks}</div>}

      <div className="mt-12 text-center text-xs text-gray-500 border-t pt-4">
        Thank you for your business! • S K Crackers
      </div>

      <div className="no-print mt-6 text-center">
        <button onClick={() => window.print()} className="px-4 py-2 bg-amber-500 text-white rounded">Print / Save PDF</button>
      </div>
    </div>
  );
}

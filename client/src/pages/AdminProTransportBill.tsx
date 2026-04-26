import { useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@shared/schema";

function fmtINR(n: number | string) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

const DEFAULT_REMARKS = "Transport/Delivery charges should be paid by the customer at the time of receiving the goods.";

export default function AdminProTransportBill() {
  const [, params] = useRoute("/admin-pro/transport-bill/:id");
  const id = params?.id;
  const { data: order, isLoading, isError, error } = useQuery<Order>({
    queryKey: ["/api/admin-pro/orders", id],
    queryFn: async () => {
      const r = await fetch(`/api/admin-pro/orders/${id}`, { credentials: "include" });
      if (r.status === 401) throw new Error("Session expired — please log in to admin again");
      if (!r.ok) throw new Error(`Failed to load order #${id}`);
      return r.json();
    },
    enabled: !!id,
    retry: 1,
  });

  useEffect(() => {
    if (order) setTimeout(() => window.print(), 400);
  }, [order]);

  if (isError) {
    return (
      <div className="p-8 max-w-md mx-auto text-center" data-testid="page-transport-error">
        <h2 className="text-xl font-bold text-red-600 mb-2">Could not load transport bill</h2>
        <p className="text-sm text-gray-700 mb-4">{(error as Error)?.message || "Unknown error"}</p>
        <a href="/admin-pro" className="inline-block bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded font-semibold">Back to Admin</a>
      </div>
    );
  }
  if (isLoading || !order) return <div className="p-8 text-center">Loading transport bill…</div>;

  let items: any[] = [];
  try { items = order.cartItems ? JSON.parse(order.cartItems) : []; } catch {}
  if (items.length === 0) items = [{ name: `Product #${order.productId}`, quantity: order.quantity, price: Number(order.subtotal) / Math.max(1, order.quantity) }];

  const totalQty = items.reduce((s, it) => s + Number(it.quantity || 0), 0);
  const destination = order.destination || order.customerAddress || "—";
  const remarks = order.transportRemarks || DEFAULT_REMARKS;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white text-black print:p-0" data-testid="page-transport-bill">
      <style>{`@media print { body { background: white; } .no-print { display: none; } @page { size: A4; margin: 12mm; } }`}</style>

      <div className="flex justify-between items-start border-b-2 border-amber-500 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-600">S K Crackers</h1>
          <p className="text-sm">Sivakasi, Tamil Nadu</p>
          <p className="text-sm">www.skcrackers.net</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold">TRANSPORT BILL</h2>
          <p className="text-sm">Order #: <b>SK-{String(order.id).padStart(4, "0")}</b></p>
          <p className="text-sm">Bill Date: {new Date().toLocaleDateString("en-IN")}</p>
          {order.dispatchDate && <p className="text-sm">Dispatch: {new Date(order.dispatchDate).toLocaleDateString("en-IN")}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div>
          <h3 className="font-bold text-sm mb-2 text-gray-700 uppercase">Consignee (Bill To)</h3>
          <p className="font-semibold">{order.customerName}</p>
          <p className="text-sm whitespace-pre-line">{order.customerAddress}</p>
          <p className="text-sm">Phone: +91 {order.customerPhone}</p>
          {order.customerEmail && <p className="text-sm">Email: {order.customerEmail}</p>}
        </div>
        <div>
          <h3 className="font-bold text-sm mb-2 text-gray-700 uppercase">Destination</h3>
          <p className="text-sm whitespace-pre-line">{destination}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6 border-t pt-4">
        <div>
          <h3 className="font-bold text-sm mb-2 text-gray-700 uppercase">Transport Details</h3>
          <table className="text-sm w-full">
            <tbody>
              <tr><td className="py-1 pr-2 text-gray-600 w-1/3">Lorry / Transport</td><td className="font-medium">{order.lorryName || "—"}</td></tr>
              <tr><td className="py-1 pr-2 text-gray-600">LR Number</td><td className="font-medium">{order.lrNumber || "—"}</td></tr>
              <tr><td className="py-1 pr-2 text-gray-600">Transport Contact</td><td className="font-medium">{order.transportContact || "—"}</td></tr>
              <tr><td className="py-1 pr-2 text-gray-600">Dispatch Date</td><td className="font-medium">{order.dispatchDate ? new Date(order.dispatchDate).toLocaleDateString("en-IN") : "—"}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="font-bold text-sm mb-2 text-gray-700 uppercase">Order Summary</h3>
          <table className="text-sm w-full">
            <tbody>
              <tr><td className="py-1 pr-2 text-gray-600">Total Items</td><td className="font-medium">{items.length}</td></tr>
              <tr><td className="py-1 pr-2 text-gray-600">Total Quantity</td><td className="font-medium">{totalQty}</td></tr>
              <tr><td className="py-1 pr-2 text-gray-600">Order Value</td><td className="font-medium">{fmtINR(order.totalAmount)}</td></tr>
              <tr><td className="py-1 pr-2 text-gray-600">Payment Status</td><td className="font-medium uppercase">{order.paymentStatus}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table className="w-full mt-6 text-sm border">
        <thead className="bg-amber-50">
          <tr>
            <th className="text-left p-2 border w-12">#</th>
            <th className="text-left p-2 border">Item Description</th>
            <th className="text-right p-2 border w-24">Qty</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{it.name ?? `#${it.id}`}</td>
              <td className="p-2 border text-right">{it.quantity}</td>
            </tr>
          ))}
          <tr className="bg-amber-50 font-bold">
            <td className="p-2 border" colSpan={2}>Total Quantity</td>
            <td className="p-2 border text-right">{totalQty}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 border rounded p-3 bg-amber-50">
        <h3 className="font-bold text-sm mb-1 text-gray-700 uppercase">Remarks</h3>
        <p className="text-sm whitespace-pre-line">{remarks}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-12 text-sm">
        <div className="border-t pt-2 text-center text-gray-600">Receiver's Signature</div>
        <div className="border-t pt-2 text-center text-gray-600">For S K Crackers</div>
      </div>

      <div className="no-print mt-6 text-center">
        <button onClick={() => window.print()} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded font-semibold" data-testid="button-print-transport">
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

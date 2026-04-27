import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { openWhatsApp } from "@/lib/whatsapp";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3, Truck, UserCog, LogOut,
  TrendingUp, AlertTriangle, IndianRupee, Receipt, Plus, Minus, Printer,
  Search, RefreshCcw, Wallet, Megaphone, BadgeCheck, X as XIcon, Edit2, Trash2, Check,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { ORDER_STATUSES, PAYMENT_STATUSES, STAFF_ROLES, type Order, type Product, type Staff } from "@shared/schema";

type StaffMe = { id: number; username: string; fullName: string; role: string; active: boolean };

function fmtINR(n: number | string) {
  const v = Number(n || 0);
  return "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
function fmtDate(d: string | Date) {
  const x = new Date(d);
  return x.toLocaleDateString("en-IN") + " " + x.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function statusColor(s: string) {
  return ({
    new: "bg-blue-500",
    confirmed: "bg-indigo-500",
    packed: "bg-purple-500",
    dispatched: "bg-amber-500",
    delivered: "bg-green-600",
    cancelled: "bg-red-500",
    pending: "bg-amber-500",
    partial: "bg-orange-500",
    paid: "bg-green-600",
    refunded: "bg-gray-500",
  } as Record<string, string>)[s] || "bg-gray-400";
}

// ============ LOGIN ============
function StaffLogin({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const m = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin-pro/login", { username, password }),
    onSuccess: () => {
      onSuccess();
      toast({ title: "Welcome back!" });
    },
    onError: (e: any) => toast({ title: "Login failed", description: e?.message ?? "Invalid credentials", variant: "destructive" }),
  });
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-rose-50 dark:from-zinc-900 dark:to-zinc-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center mb-3">
            <UserCog className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl">S K Crackers — Admin Pro</CardTitle>
          <p className="text-sm text-muted-foreground">Business management portal</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input data-testid="input-staff-username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </div>
          <div>
            <Label>Password</Label>
            <Input data-testid="input-staff-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && m.mutate()} />
          </div>
          <Button data-testid="button-staff-login" className="w-full" disabled={m.isPending} onClick={() => m.mutate()}>
            {m.isPending ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Default: <code>superadmin</code> / <code>super@123</code> — change after first login
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/admin-pro/dashboard"] });
  if (isLoading || !data) return <div className="p-8 text-center text-muted-foreground">Loading dashboard…</div>;
  const stats = [
    { label: "Today's Orders", value: data.todayOrders, icon: ShoppingBag, color: "text-blue-600 bg-blue-50 dark:bg-blue-950" },
    { label: "Today's Sales", value: fmtINR(data.todaySales), icon: IndianRupee, color: "text-green-600 bg-green-50 dark:bg-green-950" },
    { label: "Month Sales", value: fmtINR(data.monthSales), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950" },
    { label: "Pending Payments", value: fmtINR(data.pendingPayments), icon: Wallet, color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
    { label: "Low Stock Items", value: data.lowStockCount, icon: AlertTriangle, color: "text-red-600 bg-red-50 dark:bg-red-950" },
    { label: "Total Customers", value: data.totalCustomers, icon: Users, color: "text-purple-600 bg-purple-50 dark:bg-purple-950" },
  ];
  const COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6"];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} data-testid={`card-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-md ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">{s.label}</div>
              <div className="text-xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sales — Last 14 Days</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.dailyChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v: any) => fmtINR(v)} />
                <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Selling (by Qty)</CardTitle></CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.topProducts} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.topProducts.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {data.lowStockItems.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Stock</TableHead><TableHead>Threshold</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.lowStockItems.map((p: Product) => (
                  <TableRow key={p.id} data-testid={`row-low-stock-${p.id}`}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="destructive">{p.stockQuantity}</Badge></TableCell>
                    <TableCell>{p.lowStockThreshold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ ORDERS ============
function OrdersModule() {
  const [statusF, setStatusF] = useState<string>("all");
  const [paymentF, setPaymentF] = useState<string>("all");
  const [q, setQ] = useState("");
  const params = new URLSearchParams();
  if (statusF !== "all") params.set("status", statusF);
  if (paymentF !== "all") params.set("payment", paymentF);
  if (q) params.set("q", q);
  const qs = params.toString();
  const { data: orders = [], isLoading } = useQuery<Order[]>({ queryKey: ["/api/admin-pro/orders", qs] });
  const [editing, setEditing] = useState<Order | null>(null);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input data-testid="input-order-search" className="pl-8 w-64" placeholder="Search name, phone, ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={statusF} onValueChange={setStatusF}>
          <SelectTrigger className="w-44" data-testid="select-status-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={paymentF} onValueChange={setPaymentF}>
          <SelectTrigger className="w-44" data-testid="select-payment-filter"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/orders"] })}>
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={10} className="text-center py-8">Loading…</TableCell></TableRow>}
              {!isLoading && orders.length === 0 && <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No orders</TableCell></TableRow>}
              {orders.map((o) => {
                const due = Math.max(0, Number(o.totalAmount) - Number(o.paidAmount));
                return (
                  <TableRow key={o.id} data-testid={`row-order-${o.id}`}>
                    <TableCell className="font-mono">#{o.id}</TableCell>
                    <TableCell className="text-xs">{fmtDate(o.createdAt)}</TableCell>
                    <TableCell className="font-medium">{o.customerName}</TableCell>
                    <TableCell>{o.customerPhone}</TableCell>
                    <TableCell>{fmtINR(o.totalAmount)}</TableCell>
                    <TableCell>{fmtINR(o.paidAmount)}</TableCell>
                    <TableCell className={due > 0 ? "text-red-600 font-semibold" : ""}>{fmtINR(due)}</TableCell>
                    <TableCell><Badge className={`${statusColor(o.orderStatus)} text-white`}>{o.orderStatus}</Badge></TableCell>
                    <TableCell><Badge className={`${statusColor(o.paymentStatus)} text-white`}>{o.paymentStatus}</Badge></TableCell>
                    <TableCell>
                      <Button data-testid={`button-edit-order-${o.id}`} variant="outline" size="sm" onClick={() => setEditing(o)}>Manage</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && <OrderEditDialog order={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const DEFAULT_TRANSPORT_REMARKS = "Transport/Delivery charges should be paid by the customer at the time of receiving the goods.";

function OrderEditDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { toast } = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const update = useMutation({
    mutationFn: async (newStatus: "confirmed" | "cancelled") => {
      const r = await apiRequest("PATCH", `/api/admin-pro/orders/${order.id}`, { orderStatus: newStatus });
      return r.json();
    },
    onSuccess: (data: any, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/dashboard"] });
      const justConfirmed = !!data?._justConfirmed;
      if (newStatus === "cancelled") {
        toast({ title: "Order cancelled", description: `Order #${order.id} marked as cancelled.` });
      } else {
        toast({
          title: "Order approved",
          description: order.customerEmail
            ? (justConfirmed
                ? `Invoice emailed to ${order.customerEmail}. Opening WhatsApp…`
                : `Customer can now view & download the invoice in My Requests.`)
            : `Customer can now view & download the invoice in My Requests. Opening WhatsApp…`,
        });
        try {
          const phone = order.customerPhone.replace(/\D/g, "");
          const formatted = phone.length === 10 ? "91" + phone : phone;
          const msg = `Hi ${order.customerName}, your S K Crackers order #SK-${String(order.id).padStart(4, "0")} has been CONFIRMED. Total: ${fmtINR(order.totalAmount)}. You can view and download your invoice from "My Requests" in our app. Thank you!`;
          openWhatsApp(formatted, msg);
        } catch {}
      }
      onClose();
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });

  let cartItems: any[] = [];
  try { cartItems = order.cartItems ? JSON.parse(order.cartItems) : []; } catch {}

  const subtotalNum = Number(order.subtotal) || 0;
  const handlingNum = Number(order.gstAmount) || 0;
  const totalNum = Number(order.totalAmount) || 0;
  const handlingPct = subtotalNum > 0 ? Math.round((handlingNum / subtotalNum) * 100) : 0;
  // Proportionally include handling per line. When subtotal is 0/missing, fall back to
  // distributing the total evenly across line raw amounts (safe: no divergence vs footer).
  const linesRawSum = cartItems.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
    0,
  );
  const inclusiveRatio = subtotalNum > 0
    ? totalNum / subtotalNum
    : (linesRawSum > 0 ? totalNum / linesRawSum : 1);

  const printInvoice = () => window.open(`/admin-pro/invoice/${order.id}`, "_blank");
  const status = order.orderStatus;
  const isCancelled = status === "cancelled";
  const isConfirmed = status !== "new" && !isCancelled;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>Order #{order.id} — {order.customerName}</span>
            <Badge className={`${statusColor(status)} text-white`} data-testid="badge-order-status">{status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">Customer</h3>
            <div className="text-sm space-y-1 bg-muted p-3 rounded">
              <div><b>Name:</b> {order.customerName}</div>
              <div><b>Phone:</b> {order.customerPhone}</div>
              {order.customerEmail && <div><b>Email:</b> {order.customerEmail}</div>}
              <div><b>Address:</b> {order.customerAddress}</div>
              <div><b>Payment Method:</b> {order.paymentMethod}</div>
              <div><b>Date:</b> {fmtDate(order.createdAt)}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Items <span className="text-xs text-muted-foreground font-normal">(prices include {handlingPct}% handling)</span></h3>
            <div className="border rounded text-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/60 font-semibold text-xs uppercase tracking-wider">
                <span className="col-span-7">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-3 text-right">Price (incl.)</span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {cartItems.length > 0 ? cartItems.map((it, i) => {
                  const lineRaw = (Number(it.price) || 0) * (Number(it.quantity) || 0);
                  const lineIncl = lineRaw * inclusiveRatio;
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-t text-sm" data-testid={`row-item-${i}`}>
                      <span className="col-span-7 truncate">{it.name ?? `#${it.id}`}</span>
                      <span className="col-span-2 text-center">{it.quantity}</span>
                      <span className="col-span-3 text-right font-mono">{fmtINR(lineIncl)}</span>
                    </div>
                  );
                }) : (
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 border-t text-sm">
                    <span className="col-span-7 truncate">Product #{order.productId}</span>
                    <span className="col-span-2 text-center">{order.quantity}</span>
                    <span className="col-span-3 text-right font-mono">{fmtINR(totalNum)}</span>
                  </div>
                )}
              </div>
              <div className="border-t bg-muted/40 text-sm">
                <div className="flex justify-between px-3 py-1.5"><span>Subtotal</span><span className="font-mono">{fmtINR(subtotalNum)}</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>Handling Charges ({handlingPct}%)</span><span className="font-mono">{fmtINR(handlingNum)}</span></div>
                <div className="flex justify-between px-3 py-2 border-t bg-muted font-bold"><span>Total</span><span className="font-mono" data-testid="text-total-incl">{fmtINR(totalNum)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={printInvoice} data-testid="button-print-invoice">
            <Printer className="w-4 h-4 mr-1" /> Print Invoice
          </Button>
          <Button
            onClick={() => update.mutate("confirmed")}
            disabled={update.isPending || isConfirmed || isCancelled}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            data-testid="button-approve-order"
          >
            {update.isPending ? "Working…" : isConfirmed ? "Already Approved" : "Order Approve"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmCancel(true)}
            disabled={update.isPending || isCancelled}
            data-testid="button-cancel-order"
          >
            {isCancelled ? "Already Cancelled" : "Cancel Order"}
          </Button>
        </DialogFooter>

        {confirmCancel && (
          <Dialog open onOpenChange={() => setConfirmCancel(false)}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Cancel this order?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Order #{order.id} for {order.customerName} will be marked as cancelled. The customer will not see an invoice.</p>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setConfirmCancel(false)} data-testid="button-cancel-no">Keep Order</Button>
                <Button variant="destructive" onClick={() => { setConfirmCancel(false); update.mutate("cancelled"); }} data-testid="button-cancel-yes">Yes, Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransportDispatchDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { toast } = useToast();
  const [lorryName, setLorryName] = useState(order.lorryName ?? "");
  const [lrNumber, setLrNumber] = useState(order.lrNumber ?? "");
  const [transportContact, setTransportContact] = useState(order.transportContact ?? "");
  const [dispatchDate, setDispatchDate] = useState(order.dispatchDate ?? new Date().toISOString().slice(0, 10));
  // Auto-fill destination from customer address if not yet set
  const [destination, setDestination] = useState(order.destination || order.customerAddress || "");
  // Auto-fill remarks with the default policy text if not yet set
  const [transportRemarks, setTransportRemarks] = useState(order.transportRemarks || DEFAULT_TRANSPORT_REMARKS);

  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin-pro/orders/${order.id}`, {
      lorryName, lrNumber, transportContact, dispatchDate, destination, transportRemarks,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/orders"] });
      toast({ title: "Transport details saved" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const generatePdf = async () => {
    try { await save.mutateAsync(); } catch { return; }
    window.open(`/admin-pro/transport-bill/${order.id}`, "_blank");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-transport">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Transport / Dispatch — Order #{order.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Lorry / Transport Name</Label><Input data-testid="input-lorry" value={lorryName} onChange={(e) => setLorryName(e.target.value)} /></div>
            <div><Label>LR Number</Label><Input data-testid="input-lr" value={lrNumber} onChange={(e) => setLrNumber(e.target.value)} /></div>
            <div><Label>Transport Contact</Label><Input data-testid="input-transport-contact" value={transportContact} onChange={(e) => setTransportContact(e.target.value)} /></div>
            <div><Label>Dispatch Date</Label><Input data-testid="input-dispatch-date" type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} /></div>
          </div>
          <div>
            <Label>Destination <span className="text-xs text-muted-foreground">(auto-filled from customer address)</span></Label>
            <Textarea data-testid="input-destination" rows={2} value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div>
            <Label>Remarks <span className="text-xs text-muted-foreground">(default policy auto-filled)</span></Label>
            <Textarea data-testid="input-transport-remarks" rows={3} value={transportRemarks} onChange={(e) => setTransportRemarks(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={() => save.mutate()} disabled={save.isPending} data-testid="button-save-transport">
            {save.isPending ? "Saving…" : "Save"}
          </Button>
          <Button onClick={generatePdf} disabled={save.isPending} data-testid="button-transport-pdf">
            <Printer className="w-4 h-4 mr-1" /> Save &amp; Generate Transport Bill PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ STOCK ============
function StockModule() {
  const { toast } = useToast();
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const [search, setSearch] = useState("");
  const [adjusting, setAdjusting] = useState<Product | null>(null);

  const filtered = useMemo(() =>
    products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.productCode ?? "").toLowerCase().includes(search.toLowerCase())), [products, search]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stock Management</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input data-testid="input-stock-search" className="pl-8 w-64" placeholder="Search product / code" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost ₹</TableHead>
                <TableHead>Sell ₹</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Min Alert</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const low = (p.stockQuantity ?? 0) <= (p.lowStockThreshold ?? 0);
                return (
                  <TableRow key={p.id} data-testid={`row-stock-${p.id}`}>
                    <TableCell className="font-mono text-xs">{p.productCode ?? "—"}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                    <TableCell>{fmtINR(p.costPrice)}</TableCell>
                    <TableCell>{fmtINR(p.price)}</TableCell>
                    <TableCell><span className={low ? "text-red-600 font-bold" : "font-semibold"}>{p.stockQuantity}</span></TableCell>
                    <TableCell>{p.lowStockThreshold}</TableCell>
                    <TableCell>{low ? <Badge variant="destructive">LOW</Badge> : <Badge className="bg-green-600">OK</Badge>}</TableCell>
                    <TableCell><Button data-testid={`button-adjust-${p.id}`} size="sm" variant="outline" onClick={() => setAdjusting(p)}>Adjust</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {adjusting && <StockAdjustDialog product={adjusting} onClose={() => setAdjusting(null)} />}
    </div>
  );
}

function StockAdjustDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const { toast } = useToast();
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("purchase");
  const [notes, setNotes] = useState("");
  const [productCode, setProductCode] = useState(product.productCode ?? "");
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold ?? 10);
  const [costPrice, setCostPrice] = useState(product.costPrice ?? "0");

  const adjust = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin-pro/stock/adjust", { productId: product.id, changeQty: qty, reason, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Stock adjusted" });
      setQty(0); setNotes("");
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  const updateMeta = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin-pro/stock/${product.id}/settings`, { productCode, lowStockThreshold, costPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Settings updated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{product.name}</DialogTitle></DialogHeader>
        <Tabs defaultValue="adjust">
          <TabsList className="grid grid-cols-2"><TabsTrigger value="adjust">Adjust Stock</TabsTrigger><TabsTrigger value="settings">Product Settings</TabsTrigger></TabsList>
          <TabsContent value="adjust" className="space-y-3 pt-3">
            <p className="text-sm">Current Stock: <b>{product.stockQuantity}</b></p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setQty((q) => q - 1)}><Minus className="w-4 h-4" /></Button>
              <Input data-testid="input-adjust-qty" type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="text-center" />
              <Button variant="outline" size="icon" onClick={() => setQty((q) => q + 1)}><Plus className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Use positive numbers to add stock (purchase), negative to reduce (damage/return).</p>
            <div>
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger data-testid="select-stock-reason"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase / Stock In</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="damage">Damage / Loss</SelectItem>
                  <SelectItem value="correction">Correction</SelectItem>
                  <SelectItem value="opening">Opening Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea data-testid="input-stock-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <Button data-testid="button-confirm-adjust" disabled={qty === 0 || adjust.isPending} onClick={() => adjust.mutate()} className="w-full">
              {adjust.isPending ? "Saving…" : `Apply ${qty > 0 ? "+" : ""}${qty}`}
            </Button>
          </TabsContent>
          <TabsContent value="settings" className="space-y-3 pt-3">
            <div><Label>Product Code</Label><Input data-testid="input-product-code" value={productCode} onChange={(e) => setProductCode(e.target.value)} /></div>
            <div><Label>Low Stock Threshold</Label><Input data-testid="input-low-threshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} /></div>
            <div><Label>Cost Price (per unit)</Label><Input data-testid="input-cost-price" type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} /></div>
            <Button data-testid="button-save-settings" disabled={updateMeta.isPending} onClick={() => updateMeta.mutate()} className="w-full">
              {updateMeta.isPending ? "Saving…" : "Save Settings"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============ CUSTOMERS ============
function CustomersModule() {
  const { data: customers = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin-pro/customers"] });
  const [view, setView] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Username</TableHead><TableHead>Phone</TableHead>
                <TableHead>Orders</TableHead><TableHead>Total Spent</TableHead><TableHead>Due</TableHead><TableHead>Verified</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8">Loading…</TableCell></TableRow>}
              {customers.map((c) => (
                <TableRow key={c.id} data-testid={`row-customer-${c.id}`}>
                  <TableCell>#{c.id}</TableCell>
                  <TableCell>{c.username}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{c.orderCount}</TableCell>
                  <TableCell>{fmtINR(c.totalSpent)}</TableCell>
                  <TableCell className={c.totalDue > 0 ? "text-red-600 font-semibold" : ""}>{fmtINR(c.totalDue)}</TableCell>
                  <TableCell>{c.phoneVerified ? <Badge className="bg-green-600">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                  <TableCell><Button data-testid={`button-view-customer-${c.id}`} variant="outline" size="sm" onClick={() => setView(c.id)}>History</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {view && <CustomerHistoryDialog id={view} onClose={() => setView(null)} />}
    </div>
  );
}

function CustomerHistoryDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const { data } = useQuery<any>({ queryKey: ["/api/admin-pro/customers", id, "orders"], queryFn: async () => {
    const r = await fetch(`/api/admin-pro/customers/${id}/orders`); return r.json();
  } });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{data?.customer?.username} — Order History</DialogTitle></DialogHeader>
        {data && (
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Payment</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.orders.map((o: Order) => (
                <TableRow key={o.id}>
                  <TableCell>#{o.id}</TableCell>
                  <TableCell className="text-xs">{fmtDate(o.createdAt)}</TableCell>
                  <TableCell>{fmtINR(o.totalAmount)}</TableCell>
                  <TableCell><Badge className={`${statusColor(o.orderStatus)} text-white`}>{o.orderStatus}</Badge></TableCell>
                  <TableCell><Badge className={`${statusColor(o.paymentStatus)} text-white`}>{o.paymentStatus}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============ REPORTS ============
function ReportsModule() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const { data } = useQuery<any>({ queryKey: ["/api/admin-pro/reports/sales", from, to], queryFn: async () => {
    const r = await fetch(`/api/admin-pro/reports/sales?from=${from}&to=${to}`); return r.json();
  } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales Reports</h1>
      <div className="flex gap-2 items-end flex-wrap">
        <div><Label>From</Label><Input data-testid="input-report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To</Label><Input data-testid="input-report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <Button onClick={() => window.print()} variant="outline" data-testid="button-print-report"><Printer className="w-4 h-4 mr-1" />Print</Button>
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Orders</div><div className="text-xl font-bold">{data.totalCount}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Revenue</div><div className="text-xl font-bold">{fmtINR(data.totalRevenue)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">GST</div><div className="text-xl font-bold">{fmtINR(data.totalGst)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Paid</div><div className="text-xl font-bold text-green-600">{fmtINR(data.paidAmt)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Due</div><div className="text-xl font-bold text-red-600">{fmtINR(data.dueAmt)}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Daily Sales</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => fmtINR(v)} />
                  <Legend />
                  <Bar dataKey="total" fill="#f59e0b" name="Sales (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ProfitModule() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const { data } = useQuery<any>({ queryKey: ["/api/admin-pro/reports/profit", from, to], queryFn: async () => {
    const r = await fetch(`/api/admin-pro/reports/profit?from=${from}&to=${to}`); return r.json();
  } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Profit Report</h1>
      <div className="flex gap-2 items-end">
        <div><Label>From</Label><Input data-testid="input-profit-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>To</Label><Input data-testid="input-profit-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>
      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Revenue</div><div className="text-xl font-bold">{fmtINR(data.totalRevenue)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Cost</div><div className="text-xl font-bold text-orange-600">{fmtINR(data.totalCost)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Gross Profit</div><div className="text-xl font-bold text-green-600">{fmtINR(data.grossProfit)}</div></CardContent></Card>
          </div>
          <p className="text-xs text-muted-foreground">Tip: Set cost price for each product in Stock → Adjust → Settings to get accurate profit.</p>
          <Card>
            <CardHeader><CardTitle>Per-Product Profit</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Qty Sold</TableHead><TableHead>Revenue</TableHead><TableHead>Cost</TableHead><TableHead>Profit</TableHead><TableHead>Margin</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.productProfit.map((p: any) => {
                    const margin = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.qty}</TableCell>
                        <TableCell>{fmtINR(p.revenue)}</TableCell>
                        <TableCell>{fmtINR(p.cost)}</TableCell>
                        <TableCell className={p.profit >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{fmtINR(p.profit)}</TableCell>
                        <TableCell>{margin.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ============ TRANSPORT ============
function TransportModule() {
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/admin-pro/orders"] });
  const dispatchOrders = orders.filter((o) => ["confirmed", "packed", "dispatched"].includes(o.orderStatus));
  const [editing, setEditing] = useState<Order | null>(null);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Transport / Dispatch</h1>
      <p className="text-sm text-muted-foreground">Orders ready to ship or already dispatched. Click an order to add transport details.</p>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Destination</TableHead>
              <TableHead>Lorry</TableHead><TableHead>LR No</TableHead><TableHead>Dispatch Date</TableHead>
              <TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {dispatchOrders.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No orders to dispatch</TableCell></TableRow>}
              {dispatchOrders.map((o) => (
                <TableRow key={o.id} data-testid={`row-transport-${o.id}`}>
                  <TableCell>#{o.id}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell>{o.destination ?? "—"}</TableCell>
                  <TableCell>{o.lorryName ?? "—"}</TableCell>
                  <TableCell>{o.lrNumber ?? "—"}</TableCell>
                  <TableCell>{o.dispatchDate ?? "—"}</TableCell>
                  <TableCell><Badge className={`${statusColor(o.orderStatus)} text-white`}>{o.orderStatus}</Badge></TableCell>
                  <TableCell><Button data-testid={`button-transport-${o.id}`} size="sm" variant="outline" onClick={() => setEditing(o)}>Update</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editing && <TransportDispatchDialog order={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

// ============ STAFF MGMT ============
function StaffModule({ me }: { me: StaffMe }) {
  const { toast } = useToast();
  const { data: staffList = [] } = useQuery<Staff[]>({ queryKey: ["/api/admin-pro/staff"] });
  const [showCreate, setShowCreate] = useState(false);

  if (me.role !== "superadmin") {
    return <div className="p-8 text-center text-muted-foreground">Only Super Admin can manage staff.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <Button onClick={() => setShowCreate(true)} data-testid="button-add-staff"><Plus className="w-4 h-4 mr-1" />Add Staff</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {staffList.map((s) => <StaffRow key={s.id} s={s} me={me} />)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {showCreate && <CreateStaffDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function StaffRow({ s, me }: { s: Staff; me: StaffMe }) {
  const { toast } = useToast();
  const [pwd, setPwd] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const toggle = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin-pro/staff/${s.id}`, { active: !s.active }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/staff"] }); toast({ title: "Updated" }); },
  });
  const reset = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin-pro/staff/${s.id}/reset-password`, { newPassword: pwd }),
    onSuccess: () => { setPwd(""); setResetOpen(false); toast({ title: "Password reset" }); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  const del = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin-pro/staff/${s.id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/staff"] }); toast({ title: "Deleted" }); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  return (
    <TableRow data-testid={`row-staff-${s.id}`}>
      <TableCell className="font-mono">{s.username}</TableCell>
      <TableCell>{s.fullName}</TableCell>
      <TableCell><Badge>{s.role}</Badge></TableCell>
      <TableCell>{s.active ? <Badge className="bg-green-600">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
      <TableCell className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => toggle.mutate()} data-testid={`button-toggle-staff-${s.id}`}>{s.active ? "Disable" : "Enable"}</Button>
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline" data-testid={`button-reset-pwd-${s.id}`}>Reset Pwd</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Reset password — {s.username}</DialogTitle></DialogHeader>
            <Input type="password" placeholder="New password (min 6 chars)" value={pwd} onChange={(e) => setPwd(e.target.value)} data-testid="input-new-staff-password" />
            <DialogFooter><Button onClick={() => reset.mutate()} disabled={pwd.length < 6 || reset.isPending}>Reset</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        {s.id !== me.id && (
          <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Delete ${s.username}?`)) del.mutate(); }} data-testid={`button-delete-staff-${s.id}`}>Delete</Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function CreateStaffDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("staff");
  const m = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin-pro/staff", { username, password, fullName, role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/staff"] }); toast({ title: "Staff created" }); onClose(); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Username</Label><Input data-testid="input-new-staff-username" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
          <div><Label>Full Name</Label><Input data-testid="input-new-staff-name" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div><Label>Password (min 6)</Label><Input data-testid="input-new-staff-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-new-staff-role"><SelectValue /></SelectTrigger>
              <SelectContent>{STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={() => m.mutate()} disabled={m.isPending} data-testid="button-create-staff">{m.isPending ? "Creating…" : "Create"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ OFFERS MODULE ============
type OfferRow = {
  id: number; title: string; message: string; startDate: string; endDate: string;
  isActive: boolean; whatsappText: string | null; createdAt: string;
};

function toLocalDateInput(d: string | Date): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

function OffersModule() {
  const { toast } = useToast();
  const { data: offers = [], isLoading } = useQuery<OfferRow[]>({ queryKey: ["/api/admin-pro/offers"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OfferRow | null>(null);
  const blank = { title: "", message: "", startDate: toLocalDateInput(new Date()), endDate: toLocalDateInput(new Date(Date.now() + 7 * 86400000)), isActive: true, whatsappText: "" };
  const [form, setForm] = useState(blank);

  function openNew() { setEditing(null); setForm(blank); setOpen(true); }
  function openEdit(o: OfferRow) {
    setEditing(o);
    setForm({ title: o.title, message: o.message, startDate: toLocalDateInput(o.startDate), endDate: toLocalDateInput(o.endDate), isActive: o.isActive, whatsappText: o.whatsappText || "" });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() };
      if (editing) return apiRequest("PATCH", `/api/admin-pro/offers/${editing.id}`, payload);
      return apiRequest("POST", "/api/admin-pro/offers", payload);
    },
    onSuccess: () => {
      toast({ title: editing ? "Offer updated" : "Offer created" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/active"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin-pro/offers/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/active"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin-pro/offers/${id}`),
    onSuccess: () => {
      toast({ title: "Offer deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/offers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/offers/active"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offer Notifications</h1>
          <p className="text-sm text-muted-foreground">Show banners & popups to customers. Only one active in-date offer is displayed.</p>
        </div>
        <Button onClick={openNew} data-testid="button-new-offer"><Plus className="w-4 h-4 mr-1" /> New Offer</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Title</TableHead><TableHead>Window</TableHead>
            <TableHead>Active</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && offers.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No offers yet.</TableCell></TableRow>}
            {offers.map((o) => (
              <TableRow key={o.id} data-testid={`row-offer-${o.id}`}>
                <TableCell>
                  <div className="font-medium">{o.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{o.message}</div>
                </TableCell>
                <TableCell className="text-xs">
                  {new Date(o.startDate).toLocaleString()}<br/>→ {new Date(o.endDate).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant={o.isActive ? "default" : "outline"} onClick={() => toggle.mutate({ id: o.id, isActive: !o.isActive })} data-testid={`button-toggle-offer-${o.id}`}>
                    {o.isActive ? "Active" : "Inactive"}
                  </Button>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(o)} data-testid={`button-edit-offer-${o.id}`}><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this offer?")) del.mutate(o.id); }} data-testid={`button-delete-offer-${o.id}`}><Trash2 className="w-3 h-3" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Offer" : "New Offer"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Diwali Mega Sale 30% OFF" data-testid="input-offer-title" /></div>
            <div><Label>Message</Label><textarea className="w-full border rounded-md p-2 text-sm bg-background" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Detailed message shown in banner & popup" data-testid="input-offer-message" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Starts</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} data-testid="input-offer-start" /></div>
              <div><Label>Ends</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} data-testid="input-offer-end" /></div>
            </div>
            <div><Label>WhatsApp Text (optional)</Label><Input value={form.whatsappText} onChange={(e) => setForm({ ...form, whatsappText: e.target.value })} placeholder="Hi! I'm interested in the Diwali Sale offer." data-testid="input-offer-whatsapp" /></div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} data-testid="checkbox-offer-active" />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.title || !form.message} data-testid="button-save-offer">{save.isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ WALLET APPROVALS MODULE ============
type WalletTxRow = {
  id: number; customerId: number; type: string; amount: string; status: string;
  notes: string | null; productDetails: string | null; bankSnapshot: string | null;
  invoiceNumber: string | null; transactionRef: string | null; createdAt: string;
  customerName: string | null; customerEmail: string | null; customerPhone: string | null;
};

function WalletApprovalsModule() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const { data: rows = [], isLoading } = useQuery<WalletTxRow[]>({
    queryKey: ["/api/admin-pro/wallet-tx", statusFilter, typeFilter],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (statusFilter) qs.set("status", statusFilter);
      if (typeFilter) qs.set("type", typeFilter);
      const r = await fetch(`/api/admin-pro/wallet-tx?${qs.toString()}`);
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });

  const [refDraft, setRefDraft] = useState<Record<number, string>>({});
  const [viewing, setViewing] = useState<WalletTxRow | null>(null);
  const [rejecting, setRejecting] = useState<WalletTxRow | null>(null);

  const approve = useMutation({
    mutationFn: ({ id, transactionRef }: { id: number; transactionRef?: string }) =>
      apiRequest("POST", `/api/admin-pro/wallet-tx/${id}/approve`, { transactionRef }),
    onSuccess: (data: any) => {
      toast({ title: "Approved", description: `Email + notification sent. Use WhatsApp to message customer.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/wallet-tx"] });
      // Open WhatsApp with prefilled message
      try {
        const phone = (data?.customerPhone || "").replace(/\D/g, "");
        if (phone) {
          const isWithdraw = data.type === "withdrawal";
          const refLabel = isWithdraw ? "Reference Number" : "Remarks";
          const msg = isWithdraw
            ? `Hi ${data?.customerName || "there"}, your withdrawal ${data.invoiceNumber || ""} for ₹${Number(data.amount).toFixed(2)} has been approved.${data.transactionRef ? ` ${refLabel}: ${data.transactionRef}.` : ""} Thank you!`
            : `Hi ${data?.customerName || "there"}, your wallet purchase ${data.invoiceNumber || ""} for ₹${Number(data.amount).toFixed(2)} is successfully confirmed.${data.transactionRef ? ` ${refLabel}: ${data.transactionRef}.` : ""} Thank you!`;
          openWhatsApp(phone, msg);
        }
      } catch {}
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("POST", `/api/admin-pro/wallet-tx/${id}/reject`, { reason }),
    onSuccess: () => {
      toast({ title: "Rejected & refunded to wallet", description: "Customer has been notified by email + in-app." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/wallet-tx"] });
      setRejecting(null);
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  const renderBank = (snapshot: string | null) => {
    if (!snapshot) return null;
    try {
      const b = JSON.parse(snapshot);
      return (
        <div className="text-xs space-y-0.5">
          {b.accountHolder && <div><b>Holder:</b> {b.accountHolder}</div>}
          {b.bankName && <div><b>Bank:</b> {b.bankName}</div>}
          {b.accountNumber && <div><b>A/C:</b> {b.accountNumber}</div>}
          {b.ifsc && <div><b>IFSC:</b> {b.ifsc}</div>}
          {b.upi && <div><b>UPI:</b> {b.upi}</div>}
        </div>
      );
    } catch { return <div className="text-xs text-muted-foreground">{snapshot}</div>; }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Wallet Approvals</h1>
          <p className="text-sm text-muted-foreground">Approve or reject partner withdrawals & wallet purchases. Approval triggers email + WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[140px]" data-testid="select-wtx-status"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[140px]" data-testid="select-wtx-type"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead>
            <TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6">Loading…</TableCell></TableRow>}
            {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No transactions.</TableCell></TableRow>}
            {rows.map((t) => (
              <TableRow key={t.id} data-testid={`row-wtx-${t.id}`}>
                <TableCell className="font-mono text-xs">{t.invoiceNumber || `#${t.id}`}</TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{t.customerName || `Cust #${t.customerId}`}</div>
                  <div className="text-xs text-muted-foreground">{t.customerPhone}</div>
                </TableCell>
                <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                <TableCell className="text-right font-semibold">₹{Number(t.amount).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={t.status === "completed" ? "default" : t.status === "rejected" ? "destructive" : "secondary"}>{t.status}</Badge>
                </TableCell>
                <TableCell className="text-xs">{new Date(t.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setViewing(t)} data-testid={`button-view-wtx-${t.id}`}>View</Button>
                    {t.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => approve.mutate({ id: t.id, transactionRef: refDraft[t.id] })} disabled={approve.isPending} data-testid={`button-approve-wtx-${t.id}`}>
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setRejecting(t)} disabled={reject.isPending} data-testid={`button-reject-wtx-${t.id}`}>
                          <XIcon className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{viewing?.invoiceNumber || `#${viewing?.id}`} – {viewing?.type}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-xs text-muted-foreground">Customer</div><div className="font-medium">{viewing.customerName || `Cust #${viewing.customerId}`}</div></div>
                <div><div className="text-xs text-muted-foreground">Phone</div><div>{viewing.customerPhone || "-"}</div></div>
                <div><div className="text-xs text-muted-foreground">Email</div><div>{viewing.customerEmail || "-"}</div></div>
                <div><div className="text-xs text-muted-foreground">Amount</div><div className="font-semibold">₹{Number(viewing.amount).toFixed(2)}</div></div>
                <div><div className="text-xs text-muted-foreground">Status</div><div>{viewing.status}</div></div>
                <div><div className="text-xs text-muted-foreground">Created</div><div>{new Date(viewing.createdAt).toLocaleString()}</div></div>
              </div>
              {viewing.notes && <div><div className="text-xs text-muted-foreground">Notes</div><div>{viewing.notes}</div></div>}
              {viewing.bankSnapshot && <div><div className="text-xs text-muted-foreground mb-1">Bank Details</div>{renderBank(viewing.bankSnapshot)}</div>}
              {viewing.productDetails && <div><div className="text-xs text-muted-foreground mb-1">Product Details</div><pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap">{viewing.productDetails}</pre></div>}
              {viewing.status === "pending" && (
                <div>
                  <Label>{viewing.type === "withdrawal" ? "Reference Number (optional)" : "Remarks (optional)"}</Label>
                  <Input
                    value={refDraft[viewing.id] || ""}
                    onChange={(e) => setRefDraft({ ...refDraft, [viewing.id]: e.target.value })}
                    placeholder={viewing.type === "withdrawal" ? "Bank/UTR reference number" : "e.g. Order confirmed"}
                    data-testid={`input-ref-${viewing.id}`}
                  />
                </div>
              )}
              {viewing.transactionRef && <div><div className="text-xs text-muted-foreground">{viewing.type === "withdrawal" ? "Reference Number" : "Remarks"}</div><div className="font-mono">{viewing.transactionRef}</div></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {rejecting && (
        <RejectWalletTxDialog
          tx={rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => reject.mutate({ id: rejecting.id, reason })}
          loading={reject.isPending}
        />
      )}
    </div>
  );
}

const REJECT_REASON_OPTIONS = [
  { value: "account-details", label: "Your account details may be entered incorrectly. Please double-check or update if you have a different account." },
  { value: "other", label: "Other reasons — please contact our team within 24 to 48 hours." },
];

function RejectWalletTxDialog({ tx, onClose, onConfirm, loading }: { tx: WalletTxRow; onClose: () => void; onConfirm: (reason: string) => void; loading: boolean }) {
  const [choice, setChoice] = useState<string>(REJECT_REASON_OPTIONS[0].value);
  const reason = REJECT_REASON_OPTIONS.find((o) => o.value === choice)?.label || "";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" data-testid="dialog-reject-wtx">
        <DialogHeader>
          <DialogTitle>Reject &amp; Refund — {tx.invoiceNumber || `#${tx.id}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm bg-muted p-3 rounded">
            <div><b>Customer:</b> {tx.customerName || `Cust #${tx.customerId}`}</div>
            <div><b>Type:</b> {tx.type} · <b>Amount:</b> ₹{Number(tx.amount).toFixed(2)}</div>
          </div>
          <div>
            <Label className="mb-2 block">Choose remark (will be visible to customer on receipt)</Label>
            <RadioGroup value={choice} onValueChange={setChoice}>
              {REJECT_REASON_OPTIONS.map((o) => (
                <label key={o.value} className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/40" data-testid={`reject-opt-${o.value}`}>
                  <RadioGroupItem value={o.value} className="mt-1" />
                  <span className="text-sm leading-relaxed">{o.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <p className="text-xs text-muted-foreground">The amount will be automatically refunded to the customer's wallet and a notification will be sent.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(reason)} disabled={loading} data-testid="button-confirm-reject">
            {loading ? "Rejecting…" : "Reject & Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ MAIN SHELL ============
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "stock", label: "Stock", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Sales Reports", icon: BarChart3 },
  { id: "profit", label: "Profit", icon: TrendingUp },
  { id: "transport", label: "Transport", icon: Truck },
  { id: "offers", label: "Offers", icon: Megaphone },
  { id: "wallet-approvals", label: "Wallet Approvals", icon: BadgeCheck },
  { id: "staff", label: "Staff", icon: UserCog, role: "superadmin" },
];

export default function AdminPro() {
  const [, setLocation] = useLocation();
  const { data: meData, isLoading, refetch } = useQuery<{ staff: StaffMe }>({
    queryKey: ["/api/admin-pro/me"],
    retry: false,
    queryFn: async () => {
      const r = await fetch("/api/admin-pro/me");
      if (!r.ok) throw new Error("Not logged in");
      return r.json();
    },
  });
  const [tab, setTab] = useState<string>("dashboard");
  const me = meData?.staff;

  const logout = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin-pro/logout"),
    onSuccess: () => { queryClient.clear(); refetch(); },
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (!me) return <StaffLogin onSuccess={() => refetch()} />;

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-60 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white">S K Crackers</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Admin Pro</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.filter((n) => !n.role || n.role === me.role).map((n) => (
            <button
              key={n.id}
              data-testid={`nav-${n.id}`}
              onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === n.id
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <n.icon className="w-4 h-4" /> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Signed in as</div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-white">{me.fullName}</div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{me.role}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => logout.mutate()} data-testid="button-logout-staff">
            <LogOut className="w-4 h-4 mr-1" /> Sign out
          </Button>
          <button onClick={() => setLocation("/")} className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 hover:underline hover:text-zinc-900 dark:hover:text-white w-full text-left">← Back to website</button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-6 overflow-x-auto">
        {tab === "dashboard" && <Dashboard />}
        {tab === "orders" && <OrdersModule />}
        {tab === "stock" && <StockModule />}
        {tab === "customers" && <CustomersModule />}
        {tab === "reports" && <ReportsModule />}
        {tab === "profit" && <ProfitModule />}
        {tab === "transport" && <TransportModule />}
        {tab === "offers" && <OffersModule />}
        {tab === "wallet-approvals" && <WalletApprovalsModule />}
        {tab === "staff" && <StaffModule me={me} />}
      </main>
    </div>
  );
}

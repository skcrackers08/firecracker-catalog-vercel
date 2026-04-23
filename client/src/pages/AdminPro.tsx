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
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3, Truck, UserCog, LogOut,
  TrendingUp, AlertTriangle, IndianRupee, Receipt, Plus, Minus, Printer, MessageCircle,
  Search, RefreshCcw, Wallet,
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

function OrderEditDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const { toast } = useToast();
  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [paidAmount, setPaidAmount] = useState(order.paidAmount);
  const [lorryName, setLorryName] = useState(order.lorryName ?? "");
  const [lrNumber, setLrNumber] = useState(order.lrNumber ?? "");
  const [transportContact, setTransportContact] = useState(order.transportContact ?? "");
  const [dispatchDate, setDispatchDate] = useState(order.dispatchDate ?? "");
  const [destination, setDestination] = useState(order.destination ?? "");
  const [remarks, setRemarks] = useState(order.remarks ?? "");

  const m = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin-pro/orders/${order.id}`, {
      orderStatus, paymentStatus, paidAmount, lorryName, lrNumber, transportContact, dispatchDate, destination, remarks,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin-pro/dashboard"] });
      toast({ title: "Order updated" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });

  let cartItems: any[] = [];
  try { cartItems = order.cartItems ? JSON.parse(order.cartItems) : []; } catch {}

  const printInvoice = () => window.open(`/admin-pro/invoice/${order.id}`, "_blank");
  const sendWhatsApp = () => {
    const phone = order.customerPhone.replace(/\D/g, "");
    const formatted = phone.length === 10 ? "91" + phone : phone;
    const msg = `Hi ${order.customerName}, your S K Crackers order #${order.id} status: ${orderStatus.toUpperCase()}. Total: ${fmtINR(order.totalAmount)}, Paid: ${fmtINR(paidAmount)}. ${lrNumber ? `LR: ${lrNumber}, Transport: ${lorryName}` : ""} Thank you!`;
    openWhatsApp(formatted, msg);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id} — {order.customerName}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Customer</h3>
            <div className="text-sm space-y-1 bg-muted p-3 rounded">
              <div><b>Name:</b> {order.customerName}</div>
              <div><b>Phone:</b> {order.customerPhone}</div>
              {order.customerEmail && <div><b>Email:</b> {order.customerEmail}</div>}
              <div><b>Address:</b> {order.customerAddress}</div>
              <div><b>Payment Method:</b> {order.paymentMethod}</div>
              <div><b>Date:</b> {fmtDate(order.createdAt)}</div>
            </div>

            <h3 className="font-semibold text-sm">Items</h3>
            <div className="border rounded text-sm max-h-48 overflow-y-auto">
              {cartItems.length > 0 ? cartItems.map((it, i) => (
                <div key={i} className="flex justify-between p-2 border-b last:border-0">
                  <span>{it.name ?? `#${it.id}`} × {it.quantity}</span>
                  <span>{fmtINR((it.price ?? 0) * (it.quantity ?? 0))}</span>
                </div>
              )) : <div className="p-2">Product #{order.productId} × {order.quantity}</div>}
              <div className="p-2 bg-muted font-semibold flex justify-between"><span>Total</span><span>{fmtINR(order.totalAmount)}</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Status & Payment</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Order Status</Label>
                <Select value={orderStatus} onValueChange={(v) => setOrderStatus(v as any)}>
                  <SelectTrigger data-testid="select-edit-order-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
                  <SelectTrigger data-testid="select-edit-payment-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Paid Amount</Label>
              <Input data-testid="input-paid-amount" type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
            </div>

            <h3 className="font-semibold text-sm pt-2">Transport / Dispatch</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Lorry / Transport Name</Label><Input data-testid="input-lorry" value={lorryName} onChange={(e) => setLorryName(e.target.value)} /></div>
              <div><Label>LR Number</Label><Input data-testid="input-lr" value={lrNumber} onChange={(e) => setLrNumber(e.target.value)} /></div>
              <div><Label>Transport Contact</Label><Input data-testid="input-transport-contact" value={transportContact} onChange={(e) => setTransportContact(e.target.value)} /></div>
              <div><Label>Dispatch Date</Label><Input data-testid="input-dispatch-date" type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} /></div>
              <div className="col-span-2"><Label>Destination</Label><Input data-testid="input-destination" value={destination} onChange={(e) => setDestination(e.target.value)} /></div>
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea data-testid="input-remarks" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={printInvoice} data-testid="button-print-invoice"><Printer className="w-4 h-4 mr-1" /> Print Invoice</Button>
          <Button variant="outline" onClick={sendWhatsApp} data-testid="button-whatsapp"><MessageCircle className="w-4 h-4 mr-1" /> Send WhatsApp</Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending} data-testid="button-save-order">{m.isPending ? "Saving…" : "Save Changes"}</Button>
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
      {editing && <OrderEditDialog order={editing} onClose={() => setEditing(null)} />}
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

// ============ MAIN SHELL ============
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "stock", label: "Stock", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reports", label: "Sales Reports", icon: BarChart3 },
  { id: "profit", label: "Profit", icon: TrendingUp },
  { id: "transport", label: "Transport", icon: Truck },
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
      <aside className="w-60 bg-white dark:bg-zinc-900 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">S K Crackers</h2>
          <p className="text-xs text-muted-foreground">Admin Pro</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.filter((n) => !n.role || n.role === me.role).map((n) => (
            <button
              key={n.id}
              data-testid={`nav-${n.id}`}
              onClick={() => setTab(n.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${tab === n.id ? "bg-amber-500 text-white" : "hover:bg-muted"}`}
            >
              <n.icon className="w-4 h-4" /> {n.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="text-xs text-muted-foreground mb-1">Signed in as</div>
          <div className="text-sm font-semibold">{me.fullName}</div>
          <div className="text-xs text-muted-foreground mb-2">{me.role}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => logout.mutate()} data-testid="button-logout-staff">
            <LogOut className="w-4 h-4 mr-1" /> Sign out
          </Button>
          <button onClick={() => setLocation("/")} className="text-xs text-muted-foreground mt-2 hover:underline w-full text-left">← Back to website</button>
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
        {tab === "staff" && <StaffModule me={me} />}
      </main>
    </div>
  );
}

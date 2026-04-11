import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User, LogOut, Package, ShieldCheck, Phone, ChevronRight, ShoppingBag, KeyRound, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label, cn } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  productId: number;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  subtotal: string;
  gstAmount: string;
  totalAmount: string;
  customerId: number | null;
}

function ChangePasswordSection({ changePassword }: { changePassword: (o: string, n: string) => Promise<{ ok: boolean; message?: string }> }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ old: "", new: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (form.new !== form.confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    const result = await changePassword(form.old, form.new);
    setLoading(false);
    if (result.ok) {
      toast({ title: "Password Changed", description: "Your password has been updated." });
      setForm({ old: "", new: "", confirm: "" });
      setOpen(false);
    } else {
      setError(result.message || "Failed to change password.");
    }
  };

  return (
    <Card className="overflow-hidden">
      <button
        data-testid="button-toggle-change-password"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center border border-amber-500/20">
            <KeyRound className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 space-y-4 animate-in fade-in duration-200">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current Password</Label>
            <div className="relative">
              <Input
                data-testid="input-old-password"
                type={showPwd ? "text" : "password"}
                value={form.old}
                onChange={e => { setForm(f => ({ ...f, old: e.target.value })); setError(""); }}
                placeholder="Enter current password"
                className="h-11 pr-10 bg-white/5 border-white/10"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">New Password</Label>
            <Input
              data-testid="input-new-password"
              type={showPwd ? "text" : "password"}
              value={form.new}
              onChange={e => { setForm(f => ({ ...f, new: e.target.value })); setError(""); }}
              placeholder="Minimum 6 characters"
              className="h-11 bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
            <Input
              data-testid="input-confirm-password"
              type={showPwd ? "text" : "password"}
              value={form.confirm}
              onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setError(""); }}
              placeholder="Re-enter new password"
              className="h-11 bg-white/5 border-white/10"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <Button data-testid="button-save-password" type="submit" className="flex-1 h-10 font-bold text-sm" isLoading={loading}>
              <KeyRound className="w-4 h-4" /> Update Password
            </Button>
            <Button type="button" onClick={() => { setOpen(false); setForm({ old: "", new: "", confirm: "" }); setError(""); }}
              className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white text-sm">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export default function CustomerAccount() {
  const { customer, isLoading, logout, changePassword } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/customers/orders"],
    enabled: !!customer,
  });

  const { data: products } = useQuery<{ id: number; name: string; imageUrl: string; price: string }[]>({
    queryKey: ["/api/products"],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto mt-10 space-y-4 animate-pulse">
          <div className="h-32 bg-white/5 rounded-2xl" />
          <div className="h-48 bg-white/5 rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl text-white mb-2">Not Logged In</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your account and order history.</p>
          <Button className="w-full h-12 font-bold" onClick={() => setLocation("/login")}>
            Sign In / Create Account
          </Button>
        </div>
      </Layout>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    toast({ title: "Logged out", description: "See you next time!" });
    setLocation("/");
  };

  const getProductName = (productId: number) => {
    return products?.find(p => p.id === productId)?.name || `Product #${productId}`;
  };

  const getProductImage = (productId: number) => {
    return products?.find(p => p.id === productId)?.imageUrl || "";
  };

  const formatPayment = (method: string) => {
    if (method === "upi" || method.includes("phonepe") || method.includes("gpay") || method.includes("paytm")) return "📱 UPI";
    if (method === "card" || method === "debit" || method === "credit") return "💳 Card";
    return "💵 " + method;
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-4 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">{customer.username}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{customer.phone}</span>
                  {customer.phoneVerified && (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              data-testid="button-logout"
              onClick={handleLogout}
              isLoading={loggingOut}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-white px-4 h-9 text-sm gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </Card>

        <ChangePasswordSection changePassword={changePassword} />

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl text-white tracking-wider">ORDER HISTORY</h3>
            {orders && (
              <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !orders || orders.length === 0 ? (
            <Card className="p-10 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground font-medium">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Start shopping to see your orders here</p>
              <Link href="/">
                <Button className="h-10 px-6 font-bold">Browse Products</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {[...orders].reverse().map(order => (
                <Link key={order.id} href={`/bill/${order.id}`}>
                  <Card
                    data-testid={`order-card-${order.id}`}
                    className="p-4 hover:border-primary/30 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      {getProductImage(order.productId) && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                          <img
                            src={getProductImage(order.productId)}
                            alt={getProductName(order.productId)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{getProductName(order.productId)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Qty: {order.quantity} · {formatPayment(order.paymentMethod)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{order.customerAddress}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-lg">₹{Number(order.totalAmount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">Order #{order.id}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

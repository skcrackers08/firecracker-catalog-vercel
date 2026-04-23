import { Link, useLocation } from "wouter";
import { User, Package, ChevronRight, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button, Card } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";

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

export default function CustomerAccount() {
  const { customer, isLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();

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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 overflow-hidden">
              {customer.profilePhoto ? (
                <img src={customer.profilePhoto} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <Package className="w-7 h-7 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">My Requests</p>
              <h2 className="font-bold text-lg text-white truncate" data-testid="text-account-name">
                {customer.fullName || customer.username}
              </h2>
            </div>
          </div>
        </Card>

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

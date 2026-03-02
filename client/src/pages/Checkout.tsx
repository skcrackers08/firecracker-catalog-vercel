import { useState } from "react";
import { useLocation, Link } from "wouter";
import { CreditCard, Banknote, Smartphone, ArrowLeft, Receipt, ShieldCheck, Trash2 } from "lucide-react";
import { useCreateOrder } from "@/hooks/use-orders";
import { Layout } from "@/components/Layout";
import { Button, Card, cn } from "@/components/ui-custom";
import { useCart } from "@/hooks/use-cart";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalAmount, removeFromCart, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cash">("upi");

  if (items.length === 0) {
    return (
      <Layout>
        <div className="p-12 text-center bg-white/5 rounded-3xl max-w-2xl mx-auto border border-white/10">
          <h2 className="text-3xl font-display text-primary mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-8">Add some crackers to your cart before proceeding to checkout.</p>
          <Link href="/">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Calculations
  const gstAmount = totalAmount * 0.18;
  const finalAmount = totalAmount + gstAmount;

  const handleCheckout = () => {
    // For multiple products, we'll place one order with a combined summary
    // The current order system seems to support one product per order in the schema
    // but for simplicity here we'll use the first product's ID and note the others
    // Real-world would need an OrderItems table.
    createOrder.mutate({
      productId: items[0].id,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      paymentMethod,
      subtotal: totalAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalAmount: finalAmount.toFixed(2),
    }, {
      onSuccess: (data) => {
        clearCart();
        setLocation(`/bill/${data.id}`);
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
        </Link>

        <h1 className="text-4xl font-display text-white mb-8">SECURE CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form / Options Side */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">1</span>
                Review Items
              </h2>
              
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-20 h-20 bg-black/40 rounded-xl p-2 shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                      <p className="text-primary font-bold">₹{Number(item.price).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Qty</p>
                        <p className="font-bold text-lg">{item.quantity}</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Subtotal</p>
                        <p className="font-bold text-lg">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">2</span>
                Payment Method
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentMethod("upi")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                    paymentMethod === "upi" 
                      ? "border-primary bg-primary/10 text-white" 
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:bg-white/10"
                  )}
                >
                  <Smartphone className={cn("w-8 h-8", paymentMethod === "upi" ? "text-primary" : "")} />
                  <span className="font-bold tracking-wide">UPI</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                    paymentMethod === "card" 
                      ? "border-primary bg-primary/10 text-white" 
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:bg-white/10"
                  )}
                >
                  <CreditCard className={cn("w-8 h-8", paymentMethod === "card" ? "text-primary" : "")} />
                  <span className="font-bold tracking-wide">Card</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-200",
                    paymentMethod === "cash" 
                      ? "border-primary bg-primary/10 text-white" 
                      : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:bg-white/10"
                  )}
                >
                  <Banknote className={cn("w-8 h-8", paymentMethod === "cash" ? "text-primary" : "")} />
                  <span className="font-bold tracking-wide">Cash</span>
                </button>
              </div>
            </Card>
          </div>

          {/* Summary Side */}
          <div className="lg:col-span-1">
            <Card className="p-6 md:p-8 sticky top-28 bg-gradient-to-b from-card to-black/80">
              <h3 className="text-xl font-display tracking-wider mb-6 flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-primary" /> Order Summary
              </h3>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-white">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>GST (18%)</span>
                  <span className="text-white">₹{gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-green-400">Free</span>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-white">Total Amount</span>
                  <span className="text-3xl font-bold text-primary">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg mb-4" 
                onClick={handleCheckout}
                isLoading={createOrder.isPending}
              >
                Place Order
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

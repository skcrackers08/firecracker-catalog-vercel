import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { CreditCard, Banknote, Smartphone, ArrowLeft, Receipt, ShieldCheck } from "lucide-react";
import { useProduct } from "@/hooks/use-products";
import { useCreateOrder } from "@/hooks/use-orders";
import { Layout } from "@/components/Layout";
import { Button, Card, cn } from "@/components/ui-custom";

export default function Checkout() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const productId = parseInt(id || "0");
  
  const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
  const createOrder = useCreateOrder();
  
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cash">("upi");

  if (isLoadingProduct) {
    return (
      <Layout>
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto w-full">
          <div className="h-10 bg-white/5 rounded w-1/4" />
          <div className="h-[400px] bg-white/5 rounded-3xl" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="p-12 text-center bg-red-500/10 rounded-3xl">
          <h2 className="text-2xl font-display text-red-400 mb-4">Product Not Found</h2>
        </div>
      </Layout>
    );
  }

  // Calculations
  const price = Number(product.price);
  const subtotal = price * quantity;
  const gstAmount = subtotal * 0.18;
  const totalAmount = subtotal + gstAmount;

  const handleCheckout = () => {
    createOrder.mutate({
      productId,
      quantity,
      paymentMethod,
      subtotal: subtotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
    }, {
      onSuccess: (data) => {
        setLocation(`/bill/${data.id}`);
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full">
        <Link href={`/product/${product.id}`} className="inline-flex items-center text-muted-foreground hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Product
        </Link>

        <h1 className="text-4xl font-display text-white mb-8">SECURE CHECKOUT</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form / Options Side */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
                <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">1</span>
                Order Details
              </h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-white/5 rounded-xl p-2 shrink-0">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-primary font-bold">₹{price.toFixed(2)}</p>
                </div>
                
                <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-xl p-2 shrink-0">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-xl transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-xl transition-colors"
                  >
                    +
                  </button>
                </div>
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
                  <span>Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span className="text-white">₹{subtotal.toFixed(2)}</span>
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
                  <span className="text-3xl font-bold text-primary">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-lg mb-4" 
                onClick={handleCheckout}
                isLoading={createOrder.isPending}
              >
                Place Order
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                100% Secure Checkout
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

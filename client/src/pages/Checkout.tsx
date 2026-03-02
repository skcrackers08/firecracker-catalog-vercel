import { useState } from "react";
import { useLocation, Link } from "wouter";
import { CreditCard, Banknote, Smartphone, ArrowLeft, Receipt, ShieldCheck, Trash2, User, Phone, ArrowRight, MapPin } from "lucide-react";
import { useCreateOrder } from "@/hooks/use-orders";
import { Layout } from "@/components/Layout";
import { Button, Card, cn, Input, Label, Textarea } from "@/components/ui-custom";
import { useCart } from "@/hooks/use-cart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const customerDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

type CustomerDetails = z.infer<typeof customerDetailsSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalAmount, removeFromCart, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const [step, setStep] = useState<1 | 2>(1);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cash">("upi");

  const form = useForm<CustomerDetails>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
    },
  });

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

  const onDetailsSubmit = (data: CustomerDetails) => {
    setCustomerDetails(data);
    setStep(2);
  };

  const handleCheckout = () => {
    if (!customerDetails) return;

    createOrder.mutate({
      productId: items[0].id,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      customerName: customerDetails.name,
      customerPhone: customerDetails.phone,
      customerAddress: customerDetails.address,
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
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => step === 2 ? setStep(1) : setLocation('/')}
            className="inline-flex items-center text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> {step === 2 ? "Back to Details" : "Back to Catalog"}
          </button>
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", step === 1 ? "bg-primary" : "bg-primary/20")} />
            <div className={cn("w-3 h-3 rounded-full", step === 2 ? "bg-primary" : "bg-primary/20")} />
          </div>
        </div>

        <h1 className="text-4xl font-display text-white mb-8">
          {step === 1 ? "CUSTOMER DETAILS" : "SECURE CHECKOUT"}
        </h1>

        <div className="flex flex-col gap-8">
          {step === 1 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
                    <User className="w-5 h-5 mr-3 text-primary" />
                    Enter Delivery Information
                  </h2>
                  <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input 
                          id="name" 
                          placeholder="Enter your name" 
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          {...form.register("name")}
                        />
                      </div>
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input 
                          id="phone" 
                          type="tel"
                          placeholder="Enter your phone number" 
                          className="pl-10 h-12 bg-white/5 border-white/10"
                          {...form.register("phone")}
                        />
                      </div>
                      {form.formState.errors.phone && (
                        <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Delivery Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Textarea 
                          id="address" 
                          placeholder="Enter your full delivery address" 
                          className="pl-10 min-h-[100px] bg-white/5 border-white/10"
                          {...form.register("address")}
                        />
                      </div>
                      {form.formState.errors.address && (
                        <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-14 text-lg font-bold group">
                      Continue to Payment
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                </Card>

                <Card className="p-6 md:p-8">
                  <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
                    Review Items
                  </h2>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="w-12 h-12 bg-black/40 rounded-lg p-1 shrink-0">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.quantity} x ₹{Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="text-sm font-bold text-primary">₹{(Number(item.price) * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="p-6 md:p-8 bg-gradient-to-b from-card to-black/80">
                  <h3 className="text-xl font-display tracking-wider mb-6 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-primary" /> Order Summary
                  </h3>
                  <div className="space-y-4 text-sm">
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
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-primary">₹{finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="p-6 md:p-8 border-primary/20">
                  <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4 text-primary">
                    Select Payment Method
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

                <Card className="p-6 md:p-8 bg-white/5">
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary" /> Delivery Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-muted-foreground">
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1">Customer Name</p>
                      <p className="text-white font-medium">{customerDetails?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider mb-1">Phone Number</p>
                      <p className="text-white font-medium">{customerDetails?.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs uppercase tracking-wider mb-1">Delivery Address</p>
                      <p className="text-white font-medium">{customerDetails?.address}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="p-6 md:p-8 bg-gradient-to-b from-card to-black/80 sticky top-28">
                  <h3 className="text-xl font-display tracking-wider mb-6 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-primary" /> Final Summary
                  </h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="text-white">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>GST (18%)</span>
                      <span className="text-white">₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-3xl font-bold text-primary">₹{finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full h-16 text-xl font-bold shadow-fire-glow" 
                    onClick={handleCheckout}
                    isLoading={createOrder.isPending}
                  >
                    Confirm Order
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

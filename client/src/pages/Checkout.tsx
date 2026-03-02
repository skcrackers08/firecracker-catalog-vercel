import { useState } from "react";
import { useLocation, Link } from "wouter";
import { CreditCard, Banknote, ArrowLeft, Receipt, Trash2, User, Phone, ArrowRight, MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import { SiPhonepe, SiGooglepay, SiPaytm } from "react-icons/si";
import { useCreateOrder } from "@/hooks/use-orders";
import { Layout } from "@/components/Layout";
import { Button, Card, cn, Input, Label, Textarea } from "@/components/ui-custom";
import { useCart } from "@/hooks/use-cart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const MERCHANT_UPI = "skcrackers@upi";
const MERCHANT_NAME = "SK+Crackers";

const customerDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

type CustomerDetails = z.infer<typeof customerDetailsSchema>;
type UpiApp = "phonepe" | "gpay" | "paytm";

function buildUpiLink(app: UpiApp, amount: string): string {
  const note = "SK+Crackers+Order+Payment";
  const base = `pa=${MERCHANT_UPI}&pn=${MERCHANT_NAME}&am=${amount}&cu=INR&tn=${note}`;
  switch (app) {
    case "phonepe": return `phonepe://pay?${base}`;
    case "gpay":    return `tez://upi/pay?${base}`;
    case "paytm":   return `paytm://upi/pay?${base}`;
  }
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalAmount, removeFromCart, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const [step, setStep] = useState<1 | 2>(1);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cash">("upi");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiApp | null>(null);
  const [upiLaunched, setUpiLaunched] = useState(false);

  const form = useForm<CustomerDetails>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  if (items.length === 0) {
    return (
      <Layout>
        <div className="p-12 text-center bg-white/5 rounded-3xl max-w-2xl mx-auto border border-white/10">
          <h2 className="text-3xl font-display text-primary mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-8">Add some crackers to your cart before proceeding to checkout.</p>
          <Link href="/"><Button>Back to Catalog</Button></Link>
        </div>
      </Layout>
    );
  }

  const gstAmount = totalAmount * 0.18;
  const finalAmount = totalAmount + gstAmount;

  const onDetailsSubmit = (data: CustomerDetails) => {
    setCustomerDetails(data);
    setStep(2);
  };

  const openUpiApp = (app: UpiApp) => {
    setSelectedUpiApp(app);
    const link = buildUpiLink(app, finalAmount.toFixed(2));
    window.location.href = link;
    setTimeout(() => setUpiLaunched(true), 1500);
  };

  const handleCheckout = () => {
    if (!customerDetails) return;
    const pm = paymentMethod === "upi" && selectedUpiApp ? `upi-${selectedUpiApp}` : paymentMethod;

    createOrder.mutate({
      productId: items[0].id,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      customerName: customerDetails.name,
      customerPhone: customerDetails.phone,
      customerAddress: customerDetails.address,
      paymentMethod: pm,
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

  const upiApps = [
    { id: "phonepe" as UpiApp, label: "PhonePe",  icon: SiPhonepe,  color: "text-[#5f259f]", bg: "hover:bg-[#5f259f]/10 border-[#5f259f]/30" },
    { id: "gpay"    as UpiApp, label: "Google Pay", icon: SiGooglepay, color: "text-[#4285F4]", bg: "hover:bg-[#4285F4]/10 border-[#4285F4]/30" },
    { id: "paytm"  as UpiApp, label: "Paytm",      icon: SiPaytm,    color: "text-[#00BAF2]", bg: "hover:bg-[#00BAF2]/10 border-[#00BAF2]/30" },
  ];

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
          {step === 1 ? "SECURE CHECKOUT" : "PAYMENT OPTIONS"}
        </h1>

        <div className="flex flex-col gap-8">
          {step === 1 ? (
            <>
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
                        <button onClick={() => removeFromCart(item.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 md:p-8 bg-gradient-to-b from-card to-black/80">
                <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">2</span>
                  Order Summary
                </h2>
                <div className="space-y-4 text-sm mb-6 max-w-md">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Subtotal</span><span className="text-white">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>GST (18%)</span><span className="text-white">₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Delivery</span><span className="text-green-400">Free</span>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-bold text-white">Total Amount</span>
                      <span className="text-3xl font-bold text-primary">₹{finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">3</span>
                  Enter Delivery Information
                </h2>
                <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input id="name" placeholder="Enter your name" className="pl-10 h-12 bg-white/5 border-white/10" {...form.register("name")} />
                      </div>
                      {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input id="phone" type="tel" placeholder="Enter your phone number" className="pl-10 h-12 bg-white/5 border-white/10" {...form.register("phone")} />
                      </div>
                      {form.formState.errors.phone && <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <Textarea id="address" placeholder="Enter your full delivery address" className="pl-10 min-h-[100px] bg-white/5 border-white/10" {...form.register("address")} />
                    </div>
                    {form.formState.errors.address && <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>}
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-bold group">
                    Continue to Payment
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
              </Card>
            </>
          ) : (
            <div className="max-w-2xl mx-auto w-full space-y-8">
              {!showPaymentOptions ? (
                <Card className="p-6 md:p-8 bg-gradient-to-b from-card to-black/80">
                  <h3 className="text-xl font-display tracking-wider mb-6 flex items-center">
                    <Receipt className="w-5 h-5 mr-2 text-primary" /> Final Summary
                  </h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal</span><span className="text-white">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>GST (18%)</span><span className="text-white">₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-3xl font-bold text-primary">₹{finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-16 text-xl font-bold shadow-fire-glow group" onClick={() => setShowPaymentOptions(true)}>
                    Proceed to Payment
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Card>
              ) : (
                <Card className="p-6 md:p-8 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4 text-primary">
                    <CreditCard className="w-6 h-6 mr-3" />
                    Select Payment Method
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <button
                      onClick={() => { setPaymentMethod("upi"); setSelectedUpiApp(null); setUpiLaunched(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
                        paymentMethod === "upi"
                          ? "border-primary bg-primary/10 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:bg-white/10"
                      )}
                    >
                      <div className="flex gap-2">
                        <SiPhonepe className="w-5 h-5 text-[#5f259f]" />
                        <SiGooglepay className="w-5 h-5 text-[#4285F4]" />
                        <SiPaytm className="w-5 h-5 text-[#00BAF2]" />
                      </div>
                      <span className="font-bold text-sm">UPI</span>
                    </button>

                    <button
                      onClick={() => { setPaymentMethod("card"); setSelectedUpiApp(null); setUpiLaunched(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
                        paymentMethod === "card"
                          ? "border-primary bg-primary/10 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:bg-white/10"
                      )}
                    >
                      <CreditCard className={cn("w-7 h-7", paymentMethod === "card" ? "text-primary" : "")} />
                      <span className="font-bold text-sm">Card</span>
                    </button>

                    <button
                      onClick={() => { setPaymentMethod("cash"); setSelectedUpiApp(null); setUpiLaunched(false); }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
                        paymentMethod === "cash"
                          ? "border-primary bg-primary/10 text-white"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:bg-white/10"
                      )}
                    >
                      <Banknote className={cn("w-7 h-7", paymentMethod === "cash" ? "text-primary" : "")} />
                      <span className="font-bold text-sm">Cash</span>
                    </button>
                  </div>

                  {paymentMethod === "upi" && (
                    <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10 animate-in fade-in duration-300">
                      <p className="text-sm text-muted-foreground mb-4 font-medium">Choose your UPI app to pay ₹{finalAmount.toFixed(2)}:</p>
                      <div className="grid grid-cols-3 gap-3">
                        {upiApps.map(app => (
                          <button
                            key={app.id}
                            onClick={() => openUpiApp(app.id)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 font-bold",
                              app.bg,
                              selectedUpiApp === app.id
                                ? "border-current scale-95 opacity-90"
                                : "border-white/10 bg-white/5 hover:scale-105"
                            )}
                          >
                            <app.icon className={cn("w-9 h-9", app.color)} />
                            <span className="text-xs text-white">{app.label}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </button>
                        ))}
                      </div>

                      {selectedUpiApp && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center animate-in fade-in duration-300">
                          <p className="text-green-400 text-sm font-medium">
                            {upiLaunched
                              ? "✓ UPI app launched — complete payment there, then click below"
                              : `Opening ${upiApps.find(a => a.id === selectedUpiApp)?.label}...`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider text-center sm:text-left">Final Total</p>
                        <p className="text-4xl font-bold text-primary text-center sm:text-left">₹{finalAmount.toFixed(2)}</p>
                      </div>
                      <Button
                        className={cn(
                          "h-16 px-10 text-lg font-bold shadow-fire-glow w-full sm:w-auto gap-2",
                          paymentMethod === "upi" && !upiLaunched && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={handleCheckout}
                        isLoading={createOrder.isPending}
                        disabled={paymentMethod === "upi" && !upiLaunched}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {paymentMethod === "upi" ? "Payment Done – Generate Invoice" : "Pay Now & Generate Invoice"}
                      </Button>
                    </div>
                    {paymentMethod === "upi" && !upiLaunched && (
                      <p className="text-xs text-muted-foreground text-center mt-3">Select a UPI app above to enable this button</p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

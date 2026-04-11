import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { CreditCard, ArrowLeft, Receipt, Trash2, User, Phone, ArrowRight, MapPin, CheckCircle2, ExternalLink, Landmark, Lock, Calendar, Copy, Check, Smartphone, Mail, Truck } from "lucide-react";
import { SiPhonepe, SiGooglepay, SiPaytm, SiVisa, SiMastercard } from "react-icons/si";
import { useCreateOrder } from "@/hooks/use-orders";
import { Layout } from "@/components/Layout";
import { Button, Card, cn, Input, Label, Textarea } from "@/components/ui-custom";
import { useCart } from "@/hooks/use-cart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEFAULT_MERCHANT_UPI = "9344468937@axl";
const MERCHANT_NAME = "SK Crackers";
const PAYMENT_NOTE = "SK Crackers Order Payment";

function getMerchantUPI() {
  return localStorage.getItem("sk-merchant-upi") || DEFAULT_MERCHANT_UPI;
}

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const customerDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().length(10, "Please enter a valid 10-digit mobile number"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  doorStreet: z.string().min(3, "Please enter your door no / street"),
  area: z.string().min(2, "Please enter your area / locality"),
  city: z.string().min(2, "Please enter your city"),
  district: z.string().min(2, "Please enter your district"),
  state: z.string().min(2, "Please select your state"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
});

type CustomerDetails = z.infer<typeof customerDetailsSchema>;
type CustomerDetailsWithAddress = CustomerDetails & { address: string };
type UpiApp = "phonepe" | "gpay" | "paytm" | "any";
type CardType = "debit" | "credit";

function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

function buildUpiLink(app: UpiApp, amount: string): string {
  const pa  = encodeURIComponent(getMerchantUPI());
  const pn  = encodeURIComponent(MERCHANT_NAME);
  const tn  = encodeURIComponent(PAYMENT_NOTE);
  const params = `pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${tn}`;

  if (isAndroid()) {
    // Android Chrome requires Intent URLs to reliably open specific apps
    switch (app) {
      case "phonepe":
        return `intent://pay?${params}#Intent;scheme=phonepe;package=com.phonepe.app;S.browser_fallback_url=https%3A%2F%2Fphon.pe;end`;
      case "gpay":
        return `intent://upi/pay?${params}#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=https%3A%2F%2Fpay.google.com;end`;
      case "paytm":
        return `intent://pay?${params}#Intent;scheme=paytm;package=net.one97.paytm;S.browser_fallback_url=https%3A%2F%2Fpaytm.com;end`;
      case "any":
        return `upi://pay?${params}`;
    }
  }

  // iOS / desktop — use scheme URLs
  switch (app) {
    case "phonepe": return `phonepe://pay?${params}`;
    case "gpay":    return `tez://upi/pay?${params}`;
    case "paytm":   return `paytm://pay?${params}`;
    case "any":     return `upi://pay?${params}`;
  }
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalAmount, removeFromCart, clearCart } = useCart();
  const createOrder = useCreateOrder();
  const [step, setStep] = useState<1 | 2>(1);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetailsWithAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState<UpiApp | null>(null);
  const [upiLaunched, setUpiLaunched] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const upiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(null);
  const [cardPaid, setCardPaid] = useState(false);
  const [cardForm, setCardForm] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [cardError, setCardError] = useState("");

  const form = useForm<CustomerDetails>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: { name: "", phone: "", email: "", doorStreet: "", area: "", city: "", district: "", state: "", pincode: "" },
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
    const parts = [
      data.doorStreet,
      data.area,
      data.city,
      `${data.district}, ${data.state}`,
      `PIN: ${data.pincode}`,
    ].filter(Boolean);
    setCustomerDetails({ ...data, address: parts.join(", ") } as CustomerDetailsWithAddress);
    setStep(2);
  };

  const copyUpiId = () => {
    const upiId = getMerchantUPI();
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2500);
    const fallback = () => {
      try {
        const el = document.createElement("textarea");
        el.value = upiId;
        el.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      } catch { /* ignore */ }
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(upiId).catch(fallback);
    } else {
      fallback();
    }
  };

  const openUpiApp = (app: UpiApp) => {
    if (upiTimeoutRef.current) clearTimeout(upiTimeoutRef.current);
    setSelectedUpiApp(app);
    setUpiLaunched(false);
    const link = buildUpiLink(app, finalAmount.toFixed(2));
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noreferrer noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    upiTimeoutRef.current = setTimeout(() => setUpiLaunched(true), 1200);
  };

  const handleCheckout = () => {
    if (!customerDetails) return;
    const pm = paymentMethod === "upi" && selectedUpiApp
    ? `upi-${selectedUpiApp}`
    : paymentMethod === "card" && selectedCardType
    ? `card-${selectedCardType}`
    : paymentMethod;

    const cartSnapshot = items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      lineTotal: (Number(item.price) * item.quantity).toFixed(2),
    }));

    createOrder.mutate({
      productId: items[0].id,
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      customerName: customerDetails.name,
      customerPhone: customerDetails.phone,
      customerEmail: customerDetails.email || undefined,
      customerAddress: customerDetails.address,
      paymentMethod: pm,
      subtotal: totalAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      totalAmount: finalAmount.toFixed(2),
      cartItems: JSON.stringify(cartSnapshot),
    }, {
      onSuccess: (data) => {
        clearCart();
        setLocation(`/bill/${data.id}`);
      }
    });
  };

  const upiApps: { id: UpiApp; label: string; icon?: (p: { className?: string }) => JSX.Element; color: string; bg: string }[] = [
    { id: "phonepe", label: "PhonePe",     icon: SiPhonepe,   color: "text-[#5f259f]", bg: "hover:bg-[#5f259f]/10 border-[#5f259f]/30" },
    { id: "gpay",    label: "Google Pay",  icon: SiGooglepay, color: "text-[#4285F4]", bg: "hover:bg-[#4285F4]/10 border-[#4285F4]/30" },
    { id: "paytm",   label: "Paytm",       icon: SiPaytm,     color: "text-[#00BAF2]", bg: "hover:bg-[#00BAF2]/10 border-[#00BAF2]/30" },
    { id: "any",     label: "Any UPI App", icon: undefined,   color: "text-green-400",  bg: "hover:bg-green-500/10 border-green-500/30" },
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
                        <img src={item.imageUrl ?? ""} alt={item.name} className="w-full h-full object-contain" />
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
                <form onSubmit={form.handleSubmit(onDetailsSubmit)} className="space-y-8">

                  {/* CUSTOMER DETAILS */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Customer Details</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Name <span className="text-red-400">(Mandatory)</span>
                        </Label>
                        <Input
                          data-testid="input-name"
                          placeholder="Enter full name"
                          className="h-12 bg-white/5 border-white/10"
                          {...form.register("name")}
                        />
                        {form.formState.errors.name && <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            Phone <span className="text-red-400">(Mandatory)</span>
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center h-12 px-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-muted-foreground shrink-0">+91</div>
                            <Input
                              data-testid="input-phone"
                              type="tel"
                              inputMode="numeric"
                              placeholder="Mobile number"
                              className="h-12 bg-white/5 border-white/10 font-mono tracking-wider flex-1"
                              maxLength={10}
                              {...form.register("phone", {
                                onChange: (e) => {
                                  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                }
                              })}
                            />
                          </div>
                          {form.formState.errors.phone && <p className="text-xs text-red-400">{form.formState.errors.phone.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            Email <span className="text-muted-foreground/60">(Optional)</span>
                          </Label>
                          <Input
                            data-testid="input-email"
                            type="email"
                            placeholder="mail@example.com"
                            className="h-12 bg-white/5 border-white/10"
                            {...form.register("email")}
                          />
                          {form.formState.errors.email && <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* DELIVERY ADDRESS */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Delivery Address</h3>
                    </div>
                    <div className="bg-white/3 rounded-2xl border border-white/8 p-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Door No / Street</Label>
                        <Input
                          data-testid="input-door-street"
                          placeholder="Building, Street name"
                          className="h-12 bg-white/5 border-white/10"
                          {...form.register("doorStreet")}
                        />
                        {form.formState.errors.doorStreet && <p className="text-xs text-red-400">{form.formState.errors.doorStreet.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Area</Label>
                          <Input
                            data-testid="input-area"
                            placeholder="Locality"
                            className="h-12 bg-white/5 border-white/10"
                            {...form.register("area")}
                          />
                          {form.formState.errors.area && <p className="text-xs text-red-400">{form.formState.errors.area.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">City</Label>
                          <Input
                            data-testid="input-city"
                            placeholder="City name"
                            className="h-12 bg-white/5 border-white/10"
                            {...form.register("city")}
                          />
                          {form.formState.errors.city && <p className="text-xs text-red-400">{form.formState.errors.city.message}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">District</Label>
                          <Input
                            data-testid="input-district"
                            placeholder="District"
                            className="h-12 bg-white/5 border-white/10"
                            {...form.register("district")}
                          />
                          {form.formState.errors.district && <p className="text-xs text-red-400">{form.formState.errors.district.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">State</Label>
                          <Select onValueChange={(val) => form.setValue("state", val, { shouldValidate: true })}>
                            <SelectTrigger data-testid="select-state" className="h-12 bg-white/5 border-white/10">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDIAN_STATES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.state && <p className="text-xs text-red-400">{form.formState.errors.state.message}</p>}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pincode</Label>
                        <Input
                          data-testid="input-pincode"
                          type="text"
                          inputMode="numeric"
                          placeholder="6 digits"
                          className="h-12 bg-white/5 border-white/10 font-mono tracking-widest max-w-[160px]"
                          maxLength={6}
                          {...form.register("pincode", {
                            onChange: (e) => {
                              e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
                            }
                          })}
                        />
                        {form.formState.errors.pincode && <p className="text-xs text-red-400">{form.formState.errors.pincode.message}</p>}
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-14 text-lg font-bold group" data-testid="button-continue-payment">
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

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => { setPaymentMethod("upi"); setSelectedUpiApp(null); setUpiLaunched(false); setSelectedCardType(null); setCardPaid(false); setCardForm({ number: "", name: "", expiry: "", cvv: "" }); setCardError(""); }}
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
                      onClick={() => { setPaymentMethod("card"); setSelectedUpiApp(null); setUpiLaunched(false); setSelectedCardType(null); setCardPaid(false); setCardForm({ number: "", name: "", expiry: "", cvv: "" }); setCardError(""); }}
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
                  </div>

                  {paymentMethod === "upi" && (
                    <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10 animate-in fade-in duration-300 space-y-4">
                      <p className="text-sm text-muted-foreground font-medium">Choose your UPI app to pay <span className="text-white font-bold">₹{finalAmount.toFixed(2)}</span>:</p>

                      <div className="grid grid-cols-2 gap-3">
                        {upiApps.map(app => (
                          <button
                            key={app.id}
                            data-testid={`button-upi-${app.id}`}
                            onClick={() => openUpiApp(app.id)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 font-bold",
                              app.bg,
                              selectedUpiApp === app.id
                                ? "border-current scale-95 opacity-90 bg-white/10"
                                : "border-white/10 bg-white/5 hover:scale-105"
                            )}
                          >
                            {app.icon
                              ? <app.icon className={cn("w-8 h-8", app.color)} />
                              : <Smartphone className={cn("w-8 h-8", app.color)} />
                            }
                            <span className="text-xs text-white">{app.label}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </button>
                        ))}
                      </div>

                      {selectedUpiApp && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg animate-in fade-in duration-300">
                          <p className="text-green-400 text-sm font-medium text-center">
                            {upiLaunched
                              ? `✓ ${upiApps.find(a => a.id === selectedUpiApp)?.label} launched — complete payment there, then click Confirm Order below`
                              : `Opening ${upiApps.find(a => a.id === selectedUpiApp)?.label}…`}
                          </p>
                          {upiLaunched && !isAndroid() && (
                            <p className="text-yellow-400/80 text-xs text-center mt-1">
                              If the app did not open, copy the UPI ID below and pay manually
                            </p>
                          )}
                        </div>
                      )}

                      <div className="border-t border-white/10 pt-3 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">
                          📱 UPI buttons work on mobile. On desktop, copy the UPI ID below:
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black/40 text-white text-sm font-mono px-3 py-2 rounded-lg border border-white/10 select-all">
                            {getMerchantUPI()}
                          </code>
                          <button
                            onClick={copyUpiId}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors border border-white/10"
                          >
                            {upiCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {upiCopied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Amount to pay: <span className="text-white font-bold">₹{finalAmount.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10 animate-in fade-in duration-300">
                      <p className="text-sm text-muted-foreground mb-4 font-medium">Select your card type to pay ₹{finalAmount.toFixed(2)}:</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          data-testid="button-debit-card"
                          onClick={() => { setSelectedCardType("debit"); setCardPaid(false); setCardForm({ number: "", name: "", expiry: "", cvv: "" }); setCardError(""); }}
                          className={cn(
                            "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
                            selectedCardType === "debit"
                              ? "border-blue-500 bg-blue-500/10 text-white"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:border-blue-500/40 hover:bg-blue-500/5 hover:scale-105"
                          )}
                        >
                          <Landmark className={cn("w-6 h-6", selectedCardType === "debit" ? "text-blue-400" : "")} />
                          <span className="font-bold text-sm">Debit Card</span>
                          <div className="flex gap-2 opacity-70">
                            <SiVisa className="w-5 h-5 text-blue-300" />
                            <SiMastercard className="w-5 h-5 text-red-400" />
                          </div>
                        </button>

                        <button
                          data-testid="button-credit-card"
                          onClick={() => { setSelectedCardType("credit"); setCardPaid(false); setCardForm({ number: "", name: "", expiry: "", cvv: "" }); setCardError(""); }}
                          className={cn(
                            "flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all duration-200",
                            selectedCardType === "credit"
                              ? "border-purple-500 bg-purple-500/10 text-white"
                              : "border-white/10 bg-white/5 text-muted-foreground hover:border-purple-500/40 hover:bg-purple-500/5 hover:scale-105"
                          )}
                        >
                          <CreditCard className={cn("w-6 h-6", selectedCardType === "credit" ? "text-purple-400" : "")} />
                          <span className="font-bold text-sm">Credit Card</span>
                          <div className="flex gap-2 opacity-70">
                            <SiVisa className="w-5 h-5 text-blue-300" />
                            <SiMastercard className="w-5 h-5 text-red-400" />
                          </div>
                        </button>
                      </div>

                      {!selectedCardType && (
                        <p className="text-xs text-muted-foreground text-center mt-3">Select Debit or Credit Card above to continue</p>
                      )}

                      {selectedCardType && !cardPaid && (
                        <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className={cn(
                            "flex items-center gap-2 text-sm font-semibold pb-2 border-b border-white/10",
                            selectedCardType === "debit" ? "text-blue-400" : "text-purple-400"
                          )}>
                            {selectedCardType === "debit"
                              ? <><Landmark className="w-4 h-4" /> Enter Debit Card Details</>
                              : <><CreditCard className="w-4 h-4" /> Enter Credit Card Details</>
                            }
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Card Number</Label>
                            <div className="relative">
                              <Input
                                data-testid="input-card-number"
                                value={cardForm.number}
                                maxLength={19}
                                placeholder="0000 0000 0000 0000"
                                className="bg-white/5 border-white/10 pl-4 pr-16 h-12 font-mono text-base tracking-widest"
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                                  const formatted = raw.replace(/(.{4})/g, "$1 ").trim();
                                  setCardForm(f => ({ ...f, number: formatted }));
                                  setCardError("");
                                }}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-60">
                                <SiVisa className="w-5 h-5 text-blue-300" />
                                <SiMastercard className="w-5 h-5 text-red-400" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Cardholder Name</Label>
                            <Input
                              data-testid="input-card-name"
                              value={cardForm.name}
                              placeholder="Name on card"
                              className="bg-white/5 border-white/10 h-12"
                              onChange={(e) => { setCardForm(f => ({ ...f, name: e.target.value })); setCardError(""); }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Expiry Date</Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  data-testid="input-card-expiry"
                                  value={cardForm.expiry}
                                  maxLength={5}
                                  placeholder="MM/YY"
                                  className="bg-white/5 border-white/10 pl-9 h-12 font-mono"
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                                    const formatted = raw.length > 2 ? `${raw.slice(0,2)}/${raw.slice(2)}` : raw;
                                    setCardForm(f => ({ ...f, expiry: formatted }));
                                    setCardError("");
                                  }}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">CVV</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  data-testid="input-card-cvv"
                                  value={cardForm.cvv}
                                  maxLength={4}
                                  placeholder="•••"
                                  type="password"
                                  className="bg-white/5 border-white/10 pl-9 h-12 font-mono tracking-widest"
                                  onChange={(e) => { setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, "").slice(0,4) })); setCardError(""); }}
                                />
                              </div>
                            </div>
                          </div>

                          {cardError && (
                            <p className="text-red-400 text-sm text-center">{cardError}</p>
                          )}

                          <button
                            data-testid="button-verify-card"
                            onClick={() => {
                              const digits = cardForm.number.replace(/\s/g, "");
                              if (digits.length < 16) { setCardError("Please enter a valid 16-digit card number."); return; }
                              if (!cardForm.name.trim()) { setCardError("Please enter the cardholder name."); return; }
                              if (cardForm.expiry.length < 5) { setCardError("Please enter a valid expiry date (MM/YY)."); return; }
                              if (cardForm.cvv.length < 3) { setCardError("Please enter a valid CVV."); return; }
                              setCardPaid(true);
                              setCardError("");
                            }}
                            className={cn(
                              "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200",
                              selectedCardType === "debit"
                                ? "bg-blue-600 hover:bg-blue-500 text-white"
                                : "bg-purple-600 hover:bg-purple-500 text-white"
                            )}
                          >
                            <Lock className="w-4 h-4" />
                            Verify & Pay ₹{finalAmount.toFixed(2)}
                          </button>

                          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Secured payment — your card details are encrypted
                          </p>
                        </div>
                      )}

                      {cardPaid && (
                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center animate-in fade-in duration-300 space-y-1">
                          <p className="text-green-400 font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Payment Verified
                          </p>
                          <p className="text-green-300 text-sm">
                            {selectedCardType === "debit" ? "Debit" : "Credit"} card ending in {cardForm.number.replace(/\s/g, "").slice(-4)} — click below to generate your invoice
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
                        className="h-16 px-10 text-lg font-bold shadow-fire-glow w-full sm:w-auto gap-2"
                        onClick={handleCheckout}
                        isLoading={createOrder.isPending}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Generate Invoice
                      </Button>
                    </div>
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

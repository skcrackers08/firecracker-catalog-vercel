import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Receipt, Trash2, User, ArrowRight, Truck, MessageCircle } from "lucide-react";
import { useCreateOrder } from "@/hooks/use-orders";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label } from "@/components/ui-custom";
import { useCart } from "@/hooks/use-cart";
import { openWhatsApp } from "@/lib/whatsapp";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HANDLING_PERCENT = 3;

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

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalAmount, removeFromCart, clearCart } = useCart();
  const createOrder = useCreateOrder();

  const { data: waSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings/whatsapp-number"],
  });
  const whatsappNumber = (waSetting?.value || "919344468937").replace(/\D/g, "");

  const form = useForm<CustomerDetails>({
    resolver: zodResolver(customerDetailsSchema),
    defaultValues: { name: "", phone: "", email: "", doorStreet: "", area: "", city: "", district: "", state: "", pincode: "" },
  });

  if (items.length === 0) {
    return (
      <Layout>
        <div className="p-12 text-center bg-white/5 rounded-3xl max-w-2xl mx-auto border border-white/10">
          <h2 className="text-3xl font-display text-primary mb-4">Your Enquiry is Empty</h2>
          <p className="text-muted-foreground mb-8">Add some crackers to your enquiry before proceeding.</p>
          <Link href="/"><Button>Back to Catalog</Button></Link>
        </div>
      </Layout>
    );
  }

  const handlingAmount = totalAmount * (HANDLING_PERCENT / 100);
  const finalAmount = totalAmount + handlingAmount;

  const buildWhatsAppMessage = (data: CustomerDetails, address: string, orderId: number): string => {
    const lines: string[] = [];
    lines.push(`*New Enquiry — S K Crackers*`);
    lines.push(`Enquiry ID: SK-${String(orderId).padStart(4, "0")}`);
    lines.push("");
    lines.push(`*Customer*`);
    lines.push(`Name: ${data.name}`);
    lines.push(`Phone: +91 ${data.phone}`);
    if (data.email) lines.push(`Email: ${data.email}`);
    lines.push(`Address: ${address}`);
    lines.push("");
    lines.push(`*Selected Items*`);
    items.forEach((it, i) => {
      lines.push(`${i + 1}. ${it.name} × ${it.quantity} = ₹${(Number(it.price) * it.quantity).toFixed(2)}`);
    });
    lines.push("");
    lines.push(`Estimated Amount: ₹${totalAmount.toFixed(2)}`);
    lines.push(`Handling Charges (${HANDLING_PERCENT}%): ₹${handlingAmount.toFixed(2)}`);
    lines.push(`*Estimated Total: ₹${finalAmount.toFixed(2)}*`);
    lines.push("");
    lines.push(`Please confirm this enquiry and share payment details.`);
    return lines.join("\n");
  };

  const onSubmit = (data: CustomerDetails) => {
    const parts = [
      data.doorStreet,
      data.area,
      data.city,
      `${data.district}, ${data.state}`,
      `PIN: ${data.pincode}`,
    ].filter(Boolean);
    const address = parts.join(", ");

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
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email || undefined,
      customerAddress: address,
      paymentMethod: "whatsapp-enquiry",
      subtotal: totalAmount.toFixed(2),
      gstAmount: handlingAmount.toFixed(2),
      totalAmount: finalAmount.toFixed(2),
      cartItems: JSON.stringify(cartSnapshot),
    }, {
      onSuccess: (created) => {
        const text = buildWhatsAppMessage(data, address, created.id);
        try {
          openWhatsApp(whatsappNumber, text);
        } catch { /* ignore popup-blocker */ }
        clearCart();
        setLocation(`/bill/${created.id}`);
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setLocation('/')}
            className="inline-flex items-center text-muted-foreground hover:text-white transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
          </button>
        </div>

        <h1 className="text-4xl font-display text-white mb-8">ORDER ENQUIRY</h1>

        <div className="flex flex-col gap-8">
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">1</span>
              Selected Items
            </h2>
            <div className="space-y-6">
              {items.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5" data-testid={`row-cart-${item.id}`}>
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
                      <p className="text-xs text-muted-foreground uppercase mb-1">Estimated Amount</p>
                      <p className="font-bold text-lg">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-2 text-muted-foreground hover:text-red-400 transition-colors" data-testid={`button-remove-${item.id}`}>
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
              <Receipt className="w-5 h-5 mr-2 text-primary" />
              Enquiry Summary
            </h2>
            <div className="space-y-4 text-sm mb-6 max-w-md">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Estimated Amount</span><span className="text-white" data-testid="text-subtotal">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Handling Charges ({HANDLING_PERCENT}%)</span><span className="text-white" data-testid="text-handling">₹{handlingAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-white">Estimated Total</span>
                  <span className="text-3xl font-bold text-primary" data-testid="text-total">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center border-b border-white/10 pb-4">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">3</span>
              Contact Details
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

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

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Delivery Address</h3>
                </div>
                <div className="bg-white/3 rounded-2xl border border-white/8 p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Door No / Street</Label>
                    <Input data-testid="input-door-street" placeholder="Building, Street name" className="h-12 bg-white/5 border-white/10" {...form.register("doorStreet")} />
                    {form.formState.errors.doorStreet && <p className="text-xs text-red-400">{form.formState.errors.doorStreet.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Area</Label>
                      <Input data-testid="input-area" placeholder="Locality" className="h-12 bg-white/5 border-white/10" {...form.register("area")} />
                      {form.formState.errors.area && <p className="text-xs text-red-400">{form.formState.errors.area.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">City</Label>
                      <Input data-testid="input-city" placeholder="City name" className="h-12 bg-white/5 border-white/10" {...form.register("city")} />
                      {form.formState.errors.city && <p className="text-xs text-red-400">{form.formState.errors.city.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">District</Label>
                      <Input data-testid="input-district" placeholder="District" className="h-12 bg-white/5 border-white/10" {...form.register("district")} />
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

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold group bg-[#25D366] hover:bg-[#1ebe57] text-white"
                  data-testid="button-send-enquiry"
                  isLoading={createOrder.isPending}
                >
                  <MessageCircle className="w-5 h-5 mr-2 fill-white" />
                  Send Enquiry on WhatsApp
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Your enquiry will be sent to S K Crackers on WhatsApp. We will confirm and share payment details.
                </p>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

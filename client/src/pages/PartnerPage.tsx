import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  Briefcase, Wallet, Share2, Copy, Sparkles, Users, History, Check, ArrowLeft,
  IndianRupee, Tag, TrendingUp, Building2, Edit2, Save, ArrowDownToLine, ShoppingBag,
  FileText, MessageCircle, X, Search, Plus, Minus, Trash2, ChevronRight, ChevronLeft,
  Eye, EyeOff, Camera, Loader2, Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { openWhatsApp } from "@/lib/whatsapp";
import type { Product } from "@shared/schema";

async function compressImage(file: File, maxSize: number, quality: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = dataUrl;
  });
}

interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
}

interface WalletTx {
  id: number;
  customerId: number;
  type: "withdrawal" | "purchase" | string;
  amount: string;
  status: "pending" | "completed" | "rejected" | string;
  notes: string | null;
  productDetails: string | null;
  bankSnapshot: string | null;
  invoiceNumber: string | null;
  transactionRef: string | null;
  createdAt: string;
}

interface PartnerData {
  referralCode: string | null;
  referralPercentage: number;
  walletBalance: string;
  bank: BankDetails;
  history: Array<{ id: number; usedByName: string; amountCredited: string; createdAt: string; orderId: number | null }>;
  walletTransactions: WalletTx[];
}

interface CartLine {
  product: Product;
  qty: number;
}

export default function PartnerPage() {
  const { customer, isLoading, updateProfile } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: allProducts } = useProducts();
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const handlePhotoPick = () => photoFileRef.current?.click();
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please pick an image under 5MB.", variant: "destructive" });
      if (photoFileRef.current) photoFileRef.current.value = "";
      return;
    }
    setSavingPhoto(true);
    try {
      const dataUrl = await compressImage(file, 320, 0.82);
      const result = await updateProfile({ profilePhoto: dataUrl });
      if (result.ok) {
        toast({ title: "Profile photo updated" });
      } else {
        toast({ title: "Upload failed", description: result.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", description: "Could not process the image.", variant: "destructive" });
    } finally {
      setSavingPhoto(false);
      if (photoFileRef.current) photoFileRef.current.value = "";
    }
  };

  const [percentage, setPercentage] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editingBank, setEditingBank] = useState(false);
  const [bank, setBank] = useState<BankDetails>({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", upi: "" });
  const [savingBank, setSavingBank] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Purchase flow state
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseStep, setPurchaseStep] = useState<1 | 2 | 3>(1);
  const [purchaseAmt, setPurchaseAmt] = useState<string>("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<CartLine[]>([]);
  const [deliveryName, setDeliveryName] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const { data: waSetting } = useQuery<{ value: string | null }>({
    queryKey: ["/api/settings/whatsapp-number"],
  });
  const adminWhatsapp = (waSetting?.value || "919344468937").replace(/\D/g, "");

  const { data, isLoading: loadingPartner } = useQuery<PartnerData>({
    queryKey: ["/api/customers/me/partner"],
    enabled: !!customer,
  });

  useEffect(() => {
    if (data) {
      setPercentage(data.referralPercentage);
      setBank({
        accountHolder: data.bank?.accountHolder || "",
        bankName: data.bank?.bankName || "",
        accountNumber: data.bank?.accountNumber || "",
        ifsc: data.bank?.ifsc || "",
        upi: data.bank?.upi || "",
      });
    }
  }, [data]);

  useEffect(() => {
    if (!isLoading && !customer) setLocation("/login");
  }, [isLoading, customer, setLocation]);

  // Pre-fill delivery from customer
  useEffect(() => {
    if (customer && showPurchase && !deliveryName) {
      setDeliveryName(customer.fullName || customer.username || "");
      setDeliveryPhone(customer.phone || "");
      setDeliveryAddress(customer.address || "");
    }
  }, [customer, showPurchase]);

  if (isLoading || !customer) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-10">
          <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  const handleSave = async () => {
    if (percentage < 0 || percentage > 20) {
      toast({ title: "Invalid percentage", description: "Pick a value between 0% and 20%.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiRequest("POST", "/api/customers/me/partner", { percentage });
      await queryClient.invalidateQueries({ queryKey: ["/api/customers/me/partner"] });
      toast({ title: "Referral code updated", description: data?.referralCode ? "Percentage saved." : "Your unique referral code has been generated." });
    } catch {
      toast({ title: "Save failed", description: "Could not update referral settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    setSavingBank(true);
    try {
      await apiRequest("PATCH", "/api/customers/me/bank", bank);
      await queryClient.invalidateQueries({ queryKey: ["/api/customers/me/partner"] });
      toast({ title: "Bank details saved" });
      setEditingBank(false);
    } catch {
      toast({ title: "Save failed", description: "Could not save bank details", variant: "destructive" });
    } finally {
      setSavingBank(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://skcrackers.net";
  const shareText = data?.referralCode
    ? `🎆 Shop at S K Crackers and get the best fireworks! Use my referral code *${data.referralCode}* on checkout.\n\n${shareUrl}`
    : `🎆 Shop at S K Crackers — best fireworks from Sivakasi!\n\n${shareUrl}`;

  const handleCopy = async () => {
    if (!data?.referralCode) return;
    try {
      await navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast({ title: "Copied!", description: "Referral code copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "S K Crackers - Sivakasi Fireworks", text: shareText, url: shareUrl }); }
      catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Share message copied!", description: "Paste it anywhere to share" });
      } catch { /* fail silently */ }
    }
  };

  const partnerLine = `Partner: ${customer?.fullName || customer?.username} (+91 ${customer?.phone})`;
  const codeLine = data?.referralCode ? `Referral Code: ${data.referralCode}` : "";

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmt);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (amt > Number(data?.walletBalance || 0)) {
      toast({ title: "Insufficient wallet balance", variant: "destructive" });
      return;
    }
    if (!bank.accountNumber && !bank.upi) {
      toast({ title: "Add bank or UPI first", description: "Save your bank/UPI details before withdrawal.", variant: "destructive" });
      setEditingBank(true);
      setShowWithdrawModal(false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/customers/me/wallet/withdraw", { amount: amt });
      const json = await res.json();
      const tx: WalletTx = json.tx;
      await queryClient.invalidateQueries({ queryKey: ["/api/customers/me/partner"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications/me"] });

      const msg = [
        "🏦 *S K Crackers — Withdrawal Request*",
        "",
        partnerLine,
        codeLine,
        `Invoice: ${tx.invoiceNumber}`,
        `Amount: ₹${Number(tx.amount).toFixed(2)}`,
        "",
        "*Bank Details:*",
        `Account Holder: ${bank.accountHolder || "-"}`,
        `Bank: ${bank.bankName || "-"}`,
        `A/c No: ${bank.accountNumber || "-"}`,
        `IFSC: ${bank.ifsc || "-"}`,
        bank.upi ? `UPI: ${bank.upi}` : "",
        "",
        "Please transfer the amount to my account within 24 hours.",
      ].filter(Boolean).join("\n");

      openWhatsApp(adminWhatsapp, msg);
      toast({ title: "Withdrawal requested", description: `Wallet decreased by ₹${amt.toFixed(2)}. WhatsApp opened.` });
      setShowWithdrawModal(false);
      setWithdrawAmt("");
    } catch (err: any) {
      const message = err?.message?.includes("Insufficient") ? "Insufficient wallet balance" : "Withdrawal failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const list = allProducts ?? [];
    if (!q) return list.slice(0, 50);
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.productCode || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    ).slice(0, 50);
  }, [allProducts, productSearch]);

  const selectedTotal = selectedItems.reduce((s, l) => s + Number(l.product.price) * l.qty, 0);

  const setQty = (p: Product, qty: number) => {
    setSelectedItems(prev => {
      const next = [...prev];
      const idx = next.findIndex(l => l.product.id === p.id);
      if (qty <= 0) {
        if (idx >= 0) next.splice(idx, 1);
      } else if (idx >= 0) {
        next[idx] = { ...next[idx], qty };
      } else {
        next.push({ product: p, qty });
      }
      return next;
    });
  };

  const getQty = (id: number) => selectedItems.find(l => l.product.id === id)?.qty ?? 0;

  const openPurchase = () => {
    setPurchaseStep(1);
    setPurchaseAmt("");
    setProductSearch("");
    setSelectedItems([]);
    setShowPurchase(true);
  };

  const handlePurchaseSubmit = async () => {
    const amt = Number(purchaseAmt);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      setPurchaseStep(1);
      return;
    }
    if (amt > Number(data?.walletBalance || 0)) {
      toast({ title: "Insufficient wallet balance", variant: "destructive" });
      return;
    }
    if (selectedItems.length === 0) {
      toast({ title: "Select at least one product", variant: "destructive" });
      setPurchaseStep(2);
      return;
    }
    if (!deliveryName.trim() || !deliveryPhone.trim() || !deliveryAddress.trim()) {
      toast({ title: "Fill all delivery details", variant: "destructive" });
      setPurchaseStep(3);
      return;
    }

    const productLines = selectedItems
      .map(l => `${l.qty} × ${l.product.name}${l.product.productCode ? ` (${l.product.productCode})` : ""} — ₹${(Number(l.product.price) * l.qty).toFixed(2)}`)
      .join("\n");
    const productDetailsForBackend = `${productLines}\n\nProducts subtotal: ₹${selectedTotal.toFixed(2)}\nDelivery to: ${deliveryName}, +91 ${deliveryPhone}\n${deliveryAddress}`;

    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/customers/me/wallet/purchase", {
        amount: amt,
        productDetails: productDetailsForBackend,
      });
      const json = await res.json();
      const tx: WalletTx = json.tx;
      await queryClient.invalidateQueries({ queryKey: ["/api/customers/me/partner"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/notifications/me"] });

      const msg = [
        "🛒 *S K Crackers — Wallet Purchase Request*",
        "",
        "*Partner Details:*",
        partnerLine,
        codeLine,
        "",
        "*Wallet:*",
        `Invoice: ${tx.invoiceNumber}`,
        `Wallet Used: ₹${Number(tx.amount).toFixed(2)}`,
        `Wallet Balance after: ₹${Number(json.newBalance).toFixed(2)}`,
        "",
        "*Products Selected:*",
        productLines,
        `Products Subtotal: ₹${selectedTotal.toFixed(2)}`,
        "",
        "*Delivery Details:*",
        `Name: ${deliveryName}`,
        `Phone: +91 ${deliveryPhone}`,
        `Address: ${deliveryAddress}`,
        "",
        "Please confirm the order and share transport details.",
      ].filter(Boolean).join("\n");

      openWhatsApp(adminWhatsapp, msg);
      toast({ title: "Purchase requested", description: `Wallet decreased by ₹${amt.toFixed(2)}. WhatsApp opened.` });
      setShowPurchase(false);
    } catch (err: any) {
      const message = err?.message?.includes("Insufficient") ? "Insufficient wallet balance" : "Purchase failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const transactions = data?.walletTransactions || [];
  const withdrawals = transactions.filter(t => t.type === "withdrawal");
  const purchases = transactions.filter(t => t.type === "purchase");

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-4 space-y-5">
        <button onClick={() => setLocation("/")} className="inline-flex items-center text-sm text-muted-foreground hover:text-white" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </button>

        {/* Hero / Profile (with photo upload from gallery) */}
        <Card className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handlePhotoPick}
              disabled={savingPhoto}
              data-testid="button-partner-photo-pick"
              aria-label="Upload profile photo from gallery"
              className="relative w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0 group hover-elevate active-elevate-2"
            >
              {customer?.profilePhoto ? (
                <img src={customer.profilePhoto} alt="profile" className="w-full h-full object-cover" data-testid="img-partner-photo" />
              ) : (
                <Briefcase className="w-7 h-7 text-amber-400" />
              )}
              {savingPhoto ? (
                <span className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </span>
              ) : (
                <span className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </span>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                <Camera className="w-2.5 h-2.5 text-black" />
              </span>
            </button>
            <input
              ref={photoFileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
              data-testid="input-partner-photo"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Partner Program</p>
              <h1 className="font-display text-2xl text-white" data-testid="text-partner-name">{customer?.fullName || customer?.username}</h1>
              <p className="text-xs text-muted-foreground">+91 {customer?.phone}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-1">Tap photo to change from gallery / camera</p>
            </div>
          </div>
        </Card>

        {/* Wallet + Actions */}
        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Wallet className="w-4 h-4" />
                <p className="text-[10px] uppercase tracking-widest font-bold">My Wallet</p>
              </div>
              <p className="font-display text-3xl text-white flex items-center" data-testid="text-wallet-balance">
                <IndianRupee className="w-6 h-6" /> {Number(data?.walletBalance || 0).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Earned from your referral code</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              data-testid="button-withdraw-open"
              onClick={() => setShowWithdrawModal(true)}
              disabled={Number(data?.walletBalance || 0) <= 0}
              className="h-12 font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <ArrowDownToLine className="w-4 h-4" /> Withdrawal
            </Button>
            <Button
              data-testid="button-purchase-open"
              onClick={openPurchase}
              disabled={Number(data?.walletBalance || 0) <= 0}
              className="h-12 font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black"
            >
              <ShoppingBag className="w-4 h-4" /> Purchase Product
            </Button>
          </div>
        </Card>

        {/* Wallet Transaction History (collapsible View / Hide) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg text-white tracking-wide">Wallet Transaction History</h2>
            <span className="ml-2 text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
              {transactions.length} total
            </span>
            <button
              type="button"
              onClick={() => setHistoryVisible(v => !v)}
              data-testid="button-toggle-history"
              aria-expanded={historyVisible}
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary hover-elevate active-elevate-2"
            >
              {historyVisible ? (
                <><EyeOff className="w-3.5 h-3.5" /> Hide</>
              ) : (
                <><Eye className="w-3.5 h-3.5" /> View</>
              )}
            </button>
          </div>
          {!historyVisible ? (
            <p className="text-xs text-muted-foreground" data-testid="text-history-hidden">
              Wallet transaction details are hidden. Tap <span className="text-primary font-bold">View</span> to see all your withdrawals and wallet purchases.
            </p>
          ) : (
            <>
              <HistorySection
                title="Withdrawals"
                icon={<ArrowDownToLine className="w-4 h-4 text-emerald-400" />}
                items={withdrawals}
                emptyText="No withdrawals yet."
                partner={{ name: customer?.fullName || customer?.username || "", phone: customer?.phone || "", email: customer?.email || "" }}
              />
              <HistorySection
                title="Wallet Purchases"
                icon={<ShoppingBag className="w-4 h-4 text-amber-400" />}
                items={purchases}
                emptyText="No wallet purchases yet."
                partner={{ name: customer?.fullName || customer?.username || "", phone: customer?.phone || "", email: customer?.email || "" }}
              />
            </>
          )}
        </Card>

        {/* Bank Details */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-white tracking-wide">Bank Details</h2>
            </div>
            {!editingBank ? (
              <Button
                data-testid="button-bank-edit"
                onClick={() => setEditingBank(true)}
                variant="outline"
                className="h-9 gap-1.5 border-white/10 text-white hover:bg-white/5 text-xs"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Button>
            ) : (
              <Button
                data-testid="button-bank-save"
                onClick={handleSaveBank}
                isLoading={savingBank}
                className="h-9 gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            )}
          </div>

          {!editingBank ? (
            <div className="space-y-2 text-sm">
              <DetailRow label="Account Holder" value={bank.accountHolder} />
              <DetailRow label="Bank Name" value={bank.bankName} />
              <DetailRow label="Account Number" value={bank.accountNumber ? `••••${bank.accountNumber.slice(-4)}` : ""} />
              <DetailRow label="IFSC" value={bank.ifsc} />
              <DetailRow label="UPI ID" value={bank.upi} />
              {!bank.accountNumber && !bank.upi && (
                <p className="text-xs text-amber-400 mt-2">⚠ Add at least bank account or UPI to enable withdrawal.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <BankInput label="Account Holder Name" value={bank.accountHolder} onChange={v => setBank({ ...bank, accountHolder: v })} testId="input-bank-holder" />
              <BankInput label="Bank Name" value={bank.bankName} onChange={v => setBank({ ...bank, bankName: v })} testId="input-bank-name" />
              <BankInput label="Account Number" value={bank.accountNumber} onChange={v => setBank({ ...bank, accountNumber: v.replace(/[^0-9]/g, "") })} testId="input-bank-acct" />
              <BankInput label="IFSC Code" value={bank.ifsc} onChange={v => setBank({ ...bank, ifsc: v.toUpperCase() })} testId="input-bank-ifsc" />
              <BankInput label="UPI ID (optional)" value={bank.upi} onChange={v => setBank({ ...bank, upi: v })} testId="input-bank-upi" placeholder="example@upi" />
              <Button
                onClick={() => { setEditingBank(false); if (data?.bank) setBank(data.bank); }}
                variant="outline"
                className="w-full h-9 border-white/10 text-muted-foreground hover:bg-white/5 text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </Card>

        {/* Generate / Edit Referral Code */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg text-white tracking-wide">Your Referral Code</h2>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Profit Percentage (0% – 20%)
            </Label>
            <div className="flex gap-2">
              <Input
                data-testid="input-percentage"
                type="number"
                min={0}
                max={20}
                value={percentage}
                onChange={e => setPercentage(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                className="h-12 text-lg font-bold bg-white/5 border-white/10 flex-1"
              />
              <div className="flex items-center px-4 text-2xl font-bold text-primary">%</div>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={percentage}
              onChange={e => setPercentage(Number(e.target.value))}
              className="w-full accent-primary"
              data-testid="slider-percentage"
            />
            <p className="text-xs text-muted-foreground">
              You will earn <span className="text-primary font-bold">{percentage}%</span> of every order placed using your referral code (max 20%).
            </p>
          </div>

          <Button onClick={handleSave} isLoading={saving} className="w-full h-11 font-bold" data-testid="button-save-referral">
            <Sparkles className="w-4 h-4" /> {data?.referralCode ? "Update Percentage" : "Generate Referral Code"}
          </Button>

          {loadingPartner ? (
            <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ) : data?.referralCode ? (
            <div className="rounded-2xl bg-black/40 border-2 border-dashed border-primary/40 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Your Code</p>
              <p className="font-display text-3xl text-gradient-gold tracking-[0.3em] mb-3" data-testid="text-referral-code">{data.referralCode}</p>
              <div className="flex gap-2">
                <Button onClick={handleCopy} className="flex-1 h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm" data-testid="button-copy-code">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy Code"}
                </Button>
                <Button onClick={handleShare} className="flex-1 h-10 font-bold text-sm" data-testid="button-share-referral">
                  <Share2 className="w-4 h-4" /> Share Code & Website
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-2">Set a percentage and tap Generate to create your unique code.</p>
          )}
        </Card>

        {/* Referral History */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg text-white tracking-wide">Referral Earnings</h2>
            {data?.history && (
              <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
                {data.history.length} member{data.history.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingPartner ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : !data?.history || data.history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No one has used your referral code yet.</p>
              <p className="text-xs mt-1">Share your code to start earning!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.history.map(h => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10" data-testid={`history-${h.id}`}>
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate" data-testid={`history-name-${h.id}`}>{h.usedByName}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(h.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <p className="font-bold text-emerald-400 text-sm flex items-center" data-testid={`history-amount-${h.id}`}>
                    <IndianRupee className="w-3 h-3" />{Number(h.amountCredited).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <ActionModal
          title="Withdrawal Request"
          icon={<ArrowDownToLine className="w-5 h-5 text-emerald-400" />}
          onClose={() => setShowWithdrawModal(false)}
        >
          <p className="text-xs text-muted-foreground">
            Available balance: <span className="text-emerald-400 font-bold">₹{Number(data?.walletBalance || 0).toFixed(2)}</span>
          </p>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount to withdraw (₹)</Label>
          <Input
            data-testid="input-withdraw-amount"
            type="number"
            min={1}
            max={Number(data?.walletBalance || 0)}
            value={withdrawAmt}
            onChange={e => setWithdrawAmt(e.target.value)}
            className="h-12 text-lg font-bold bg-white/5 border-white/10"
            placeholder="0"
          />
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs space-y-1 text-muted-foreground">
            <p>On confirm:</p>
            <p>• Wallet decreases by entered amount immediately</p>
            <p>• WhatsApp opens with bank details for admin</p>
            <p>• Admin transfers to your account within 24 hours</p>
          </div>
          <Button
            data-testid="button-withdraw-confirm"
            onClick={handleWithdraw}
            isLoading={submitting}
            className="w-full h-12 font-bold gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <MessageCircle className="w-4 h-4" /> Send to WhatsApp & Deduct
          </Button>
        </ActionModal>
      )}

      {/* Purchase Modal — multi-step */}
      {showPurchase && (
        <ActionModal
          title={`Wallet Purchase — Step ${purchaseStep} / 3`}
          icon={<ShoppingBag className="w-5 h-5 text-amber-400" />}
          onClose={() => setShowPurchase(false)}
        >
          {/* STEP 1: amount */}
          {purchaseStep === 1 && (
            <>
              <p className="text-xs text-muted-foreground">
                Available balance: <span className="text-amber-400 font-bold">₹{Number(data?.walletBalance || 0).toFixed(2)}</span>
              </p>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Wallet amount to spend (₹)</Label>
              <Input
                data-testid="input-purchase-amount"
                type="number"
                min={1}
                max={Number(data?.walletBalance || 0)}
                value={purchaseAmt}
                onChange={e => setPurchaseAmt(e.target.value)}
                className="h-12 text-lg font-bold bg-white/5 border-white/10"
                placeholder="0"
                autoFocus
              />
              <Button
                data-testid="button-purchase-step1-next"
                onClick={() => {
                  const a = Number(purchaseAmt);
                  if (!Number.isFinite(a) || a <= 0) {
                    toast({ title: "Enter a valid amount", variant: "destructive" });
                    return;
                  }
                  if (a > Number(data?.walletBalance || 0)) {
                    toast({ title: "Insufficient wallet balance", variant: "destructive" });
                    return;
                  }
                  setPurchaseStep(2);
                }}
                className="w-full h-12 font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black"
              >
                Enquiry — Pick Products <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* STEP 2: select products */}
          {purchaseStep === 2 && (
            <>
              <div className="flex items-center gap-2 -mt-1">
                <button onClick={() => setPurchaseStep(1)} className="text-xs text-muted-foreground hover:text-white inline-flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Amount: ₹{Number(purchaseAmt).toFixed(2)}
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  data-testid="input-product-search"
                  placeholder="Search products by name, code or category…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="h-10 pl-9 bg-white/5 border-white/10"
                />
              </div>

              {selectedItems.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">Selected ({selectedItems.length})</p>
                  {selectedItems.map(l => (
                    <div key={l.product.id} className="flex items-center gap-2 text-xs" data-testid={`selected-${l.product.id}`}>
                      <span className="flex-1 truncate text-white">{l.qty}× {l.product.name}</span>
                      <span className="text-amber-400 font-bold">₹{(Number(l.product.price) * l.qty).toFixed(2)}</span>
                      <button onClick={() => setQty(l.product, 0)} className="text-red-400 hover:text-red-300" data-testid={`button-remove-${l.product.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1.5 border-t border-amber-500/20 text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-amber-400 font-bold" data-testid="text-purchase-subtotal">₹{selectedTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No products found.</p>
                ) : filteredProducts.map(p => {
                  const qty = getQty(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/10" data-testid={`product-row-${p.id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.productCode || ""} · ₹{Number(p.price).toFixed(2)}</p>
                      </div>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/40 rounded-lg">
                          <button onClick={() => setQty(p, qty - 1)} className="w-7 h-7 flex items-center justify-center text-amber-400" data-testid={`button-qty-dec-${p.id}`}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white min-w-6 text-center" data-testid={`text-qty-${p.id}`}>{qty}</span>
                          <button onClick={() => setQty(p, qty + 1)} className="w-7 h-7 flex items-center justify-center text-amber-400" data-testid={`button-qty-inc-${p.id}`}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setQty(p, 1)} className="text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-600" data-testid={`button-add-${p.id}`}>
                          <Plus className="w-3 h-3 inline mr-0.5" /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button
                data-testid="button-purchase-step2-next"
                onClick={() => {
                  if (selectedItems.length === 0) {
                    toast({ title: "Select at least one product", variant: "destructive" });
                    return;
                  }
                  setPurchaseStep(3);
                }}
                className="w-full h-12 font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black"
              >
                Continue — Delivery Details <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* STEP 3: customer + delivery */}
          {purchaseStep === 3 && (
            <>
              <div className="flex items-center gap-2 -mt-1">
                <button onClick={() => setPurchaseStep(2)} className="text-xs text-muted-foreground hover:text-white inline-flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> {selectedItems.length} product{selectedItems.length !== 1 ? "s" : ""} · ₹{selectedTotal.toFixed(2)}
                </button>
              </div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Customer Name</Label>
              <Input data-testid="input-delivery-name" value={deliveryName} onChange={e => setDeliveryName(e.target.value)} placeholder="Full name" className="h-10 bg-white/5 border-white/10" />

              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</Label>
              <Input data-testid="input-delivery-phone" value={deliveryPhone} onChange={e => setDeliveryPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" className="h-10 bg-white/5 border-white/10" />

              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Delivery Address</Label>
              <textarea
                data-testid="textarea-delivery-address"
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Door no, street, city, district, pincode"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
              />

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs space-y-1 text-muted-foreground">
                <p>• Wallet decreases by ₹{Number(purchaseAmt).toFixed(2)} immediately</p>
                <p>• WhatsApp opens with partner, wallet, products & delivery details</p>
                <p>• Admin confirms order and shares transport details</p>
              </div>

              <Button
                data-testid="button-purchase-confirm"
                onClick={handlePurchaseSubmit}
                isLoading={submitting}
                className="w-full h-12 font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black"
              >
                <MessageCircle className="w-4 h-4" /> Send to WhatsApp & Deduct ₹{Number(purchaseAmt).toFixed(2)}
              </Button>
            </>
          )}
        </ActionModal>
      )}
    </Layout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-white/5 last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-white font-medium">{value || "—"}</span>
    </div>
  );
}

function BankInput({ label, value, onChange, testId, placeholder }: { label: string; value: string; onChange: (v: string) => void; testId: string; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <Input
        data-testid={testId}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 bg-white/5 border-white/10 text-white"
      />
    </div>
  );
}

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWalletTxInvoiceHtml(tx: WalletTx, partner: { name: string; phone: string; email: string }): string {
  let bank: any = {};
  try { bank = tx.bankSnapshot ? JSON.parse(tx.bankSnapshot) : {}; } catch {}
  const isWithdraw = tx.type === "withdrawal";
  const status = (tx.status || "pending").toUpperCase();
  const statusColor = tx.status === "completed" ? "#10b981" : tx.status === "rejected" ? "#ef4444" : "#f59e0b";
  const e = escapeHtml;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${e(tx.invoiceNumber || "Invoice")}</title>
<style>
  body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:24px;color:#111827;background:#f9fafb}
  .card{max-width:720px;margin:auto;background:#fff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.08);overflow:hidden}
  .head{background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;color:#fff}
  .head h1{margin:0;font-size:22px;letter-spacing:1px}
  .head p{margin:4px 0 0;font-size:13px;opacity:.92;text-transform:uppercase;letter-spacing:2px}
  .body{padding:24px 32px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px}
  .label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:2px}
  .val{font-size:14px;font-weight:600;color:#111827}
  .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:${statusColor}}
  .pre{background:#f3f4f6;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap;font-family:inherit;color:#111827}
  .foot{background:#fef3c7;padding:14px 32px;text-align:center;font-size:12px;color:#92400e;border-top:1px solid #fde68a}
  .row{display:flex;justify-content:space-between;align-items:center;margin:10px 0;padding-bottom:10px;border-bottom:1px dashed #e5e7eb}
  @media print{.noprint{display:none}body{background:#fff;padding:0}.card{box-shadow:none;border-radius:0}}
</style></head><body>
<div class="card">
  <div class="head">
    <h1>S K Crackers</h1>
    <p>${isWithdraw ? "Withdrawal Receipt" : "Wallet Purchase Invoice"}</p>
  </div>
  <div class="body">
    <div class="row"><div><div class="label">Invoice #</div><div class="val">${e(tx.invoiceNumber || `#${tx.id}`)}</div></div><span class="badge">${e(status)}</span></div>
    ${!isWithdraw && tx.status === "completed" ? `<div style="margin:0 0 16px;padding:12px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;text-align:center;color:#065f46;font-weight:700;font-size:14px;">Your order successfully confirmed</div>` : ""}
    <div class="grid">
      <div><div class="label">Partner</div><div class="val">${e(partner.name) || "-"}</div></div>
      <div><div class="label">Phone</div><div class="val">${partner.phone ? "+91 " + e(partner.phone) : "-"}</div></div>
      <div><div class="label">Email</div><div class="val">${e(partner.email) || "-"}</div></div>
      <div><div class="label">Date</div><div class="val">${e(new Date(tx.createdAt).toLocaleString())}</div></div>
      <div><div class="label">Type</div><div class="val">${isWithdraw ? "Wallet Withdrawal" : "Wallet Purchase"}</div></div>
      <div><div class="label">Amount</div><div class="val">₹ ${Number(tx.amount).toFixed(2)}</div></div>
      ${tx.transactionRef ? `<div><div class="label">${isWithdraw ? "Reference Number" : "Remarks"}</div><div class="val">${e(tx.transactionRef)}</div></div>` : ""}
    </div>
    ${isWithdraw && bank?.accountNumber ? `<h3 style="margin:0 0 8px;font-size:14px;">Bank Account</h3>
      <div class="grid">
        ${bank.accountHolder ? `<div><div class="label">Holder</div><div class="val">${e(bank.accountHolder)}</div></div>` : ""}
        ${bank.bankName ? `<div><div class="label">Bank</div><div class="val">${e(bank.bankName)}</div></div>` : ""}
        ${bank.accountNumber ? `<div><div class="label">A/C No.</div><div class="val">${e(bank.accountNumber)}</div></div>` : ""}
        ${bank.ifsc ? `<div><div class="label">IFSC</div><div class="val">${e(bank.ifsc)}</div></div>` : ""}
      </div>` : ""}
    ${!isWithdraw && tx.productDetails ? `<h3 style="margin:18px 0 8px;font-size:14px;">Selected Items</h3><div class="pre">${e(tx.productDetails)}</div>` : ""}
    ${tx.notes ? `<p style="margin:14px 0 0;font-size:13px;color:${tx.status === "rejected" ? "#991b1b" : "#6b7280"};background:${tx.status === "rejected" ? "#fef2f2" : "transparent"};border:${tx.status === "rejected" ? "1px solid #fecaca" : "0"};padding:${tx.status === "rejected" ? "10px" : "0"};border-radius:6px;"><b>${tx.status === "rejected" ? "Reason" : "Notes"}:</b> ${e(tx.notes.replace(/\[Admin remark\]\s*/g, ""))}</p>` : ""}
    <div style="margin-top:24px;text-align:center" class="noprint">
      <button onclick="window.print()" style="background:#ea580c;color:#fff;border:0;padding:10px 24px;border-radius:8px;font-weight:600;cursor:pointer">Print / Save as PDF</button>
    </div>
  </div>
  <div class="foot">© ${new Date().getFullYear()} S K Crackers. Thank you for partnering with us.</div>
</div>
</body></html>`;
}

function downloadWalletTxInvoice(tx: WalletTx, partner: { name: string; phone: string; email: string }) {
  const html = buildWalletTxInvoiceHtml(tx, partner);
  // Try popup window first (best for printing). Fall back to blob download.
  const w = window.open("", "_blank");
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    return;
  }
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tx.invoiceNumber || `wallet-${tx.id}`}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function HistorySection({ title, icon, items, emptyText, partner }: { title: string; icon: React.ReactNode; items: WalletTx[]; emptyText: string; partner: { name: string; phone: string; email: string } }) {
  const [viewing, setViewing] = useState<WalletTx | null>(null);
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs uppercase tracking-wider font-bold text-white">{title} ({items.length})</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 px-3">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {items.map(tx => (
            <div key={tx.id} className="p-3 rounded-xl bg-white/5 border border-white/10" data-testid={`tx-${tx.id}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-bold text-white" data-testid={`tx-invoice-${tx.id}`}>{tx.invoiceNumber || `#${tx.id}`}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  tx.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : tx.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>
                  {tx.status}
                </span>
              </div>
              <p className="text-lg font-bold text-white flex items-center" data-testid={`tx-amount-${tx.id}`}>
                <IndianRupee className="w-4 h-4" />{Number(tx.amount).toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">{new Date(tx.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              {tx.productDetails && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-line">📦 {tx.productDetails}</p>
              )}
              {tx.bankSnapshot && (() => {
                try {
                  const bs = JSON.parse(tx.bankSnapshot);
                  return (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      🏦 {bs.bankName || "Bank"} ••••{(bs.accountNumber || "").slice(-4)}
                    </p>
                  );
                } catch { return null; }
              })()}
              {tx.transactionRef && (
                <p className="text-[10px] text-emerald-400 mt-1">{tx.type === "withdrawal" ? "Ref" : "Remarks"}: {tx.transactionRef}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setViewing(tx)}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg bg-white/5 border border-white/15 text-white hover:bg-white/10"
                  data-testid={`button-view-tx-${tx.id}`}
                >
                  <Eye className="w-3 h-3" /> View
                </button>
                <button
                  type="button"
                  onClick={() => downloadWalletTxInvoice(tx, partner)}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                  data-testid={`button-download-tx-${tx.id}`}
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4" onClick={() => setViewing(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full sm:max-w-md max-h-[92vh] bg-background border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm font-bold text-white" data-testid={`text-tx-detail-invoice-${viewing.id}`}>{viewing.invoiceNumber || `#${viewing.id}`}</p>
              <button onClick={() => setViewing(null)} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white" data-testid="button-close-tx-detail">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  viewing.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : viewing.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}>{viewing.status}</span>
                <span className="text-[11px] text-muted-foreground">{new Date(viewing.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-xl font-extrabold text-white flex items-center"><IndianRupee className="w-5 h-5" />{Number(viewing.amount).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground capitalize">{viewing.type === "withdrawal" ? "Wallet Withdrawal" : "Wallet Purchase"}</div>
              {viewing.type === "purchase" && viewing.status === "completed" && (
                <div className="text-xs font-bold text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg py-2 px-3">
                  Your order successfully confirmed
                </div>
              )}
              {viewing.transactionRef && (
                <div className="text-xs"><span className="text-muted-foreground">{viewing.type === "withdrawal" ? "Reference Number" : "Remarks"}: </span><span className="text-emerald-400 font-mono">{viewing.transactionRef}</span></div>
              )}
              {viewing.bankSnapshot && (() => {
                try {
                  const b = JSON.parse(viewing.bankSnapshot);
                  return (
                    <div className="space-y-1 text-xs bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="font-bold text-white text-[11px] uppercase tracking-wider">Bank Details</p>
                      {b.accountHolder && <p><span className="text-muted-foreground">Holder:</span> <span className="text-white">{b.accountHolder}</span></p>}
                      {b.bankName && <p><span className="text-muted-foreground">Bank:</span> <span className="text-white">{b.bankName}</span></p>}
                      {b.accountNumber && <p><span className="text-muted-foreground">A/C:</span> <span className="text-white font-mono">{b.accountNumber}</span></p>}
                      {b.ifsc && <p><span className="text-muted-foreground">IFSC:</span> <span className="text-white font-mono">{b.ifsc}</span></p>}
                    </div>
                  );
                } catch { return null; }
              })()}
              {viewing.productDetails && (
                <div className="space-y-1">
                  <p className="font-bold text-white text-[11px] uppercase tracking-wider">Selected Items</p>
                  <pre className="text-xs bg-white/5 border border-white/10 rounded-lg p-3 whitespace-pre-wrap text-muted-foreground">{viewing.productDetails}</pre>
                </div>
              )}
              {viewing.notes && (
                <div className={viewing.status === "rejected"
                  ? "text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                  : "text-xs text-muted-foreground"
                }>
                  <b>{viewing.status === "rejected" ? "Reason" : "Notes"}:</b> {viewing.notes.replace(/\[Admin remark\]\s*/g, "")}
                </div>
              )}
              <button
                type="button"
                onClick={() => downloadWalletTxInvoice(viewing, partner)}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold"
                data-testid={`button-download-tx-modal-${viewing.id}`}
              >
                <Download className="w-4 h-4" /> Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionModal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92vh] bg-background border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {icon}
            <p className="text-sm font-bold text-white">{title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" data-testid="button-modal-close" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

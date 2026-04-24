import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Briefcase, Wallet, Share2, Copy, Sparkles, Users, History, Check, ArrowLeft,
  IndianRupee, Tag, TrendingUp, Building2, Edit2, Save, ArrowDownToLine, ShoppingBag,
  FileText, MessageCircle, X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { openWhatsApp } from "@/lib/whatsapp";

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

export default function PartnerPage() {
  const { customer, isLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [percentage, setPercentage] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [editingBank, setEditingBank] = useState(false);
  const [bank, setBank] = useState<BankDetails>({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", upi: "" });
  const [savingBank, setSavingBank] = useState(false);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [withdrawAmt, setWithdrawAmt] = useState<string>("");
  const [purchaseAmt, setPurchaseAmt] = useState<string>("");
  const [purchaseProducts, setPurchaseProducts] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  const handlePurchase = async () => {
    const amt = Number(purchaseAmt);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!purchaseProducts.trim()) {
      toast({ title: "Enter product details", description: "List the products you want to purchase.", variant: "destructive" });
      return;
    }
    if (amt > Number(data?.walletBalance || 0)) {
      toast({ title: "Insufficient wallet balance", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/customers/me/wallet/purchase", {
        amount: amt,
        productDetails: purchaseProducts.trim(),
      });
      const json = await res.json();
      const tx: WalletTx = json.tx;
      await queryClient.invalidateQueries({ queryKey: ["/api/customers/me/partner"] });

      const msg = [
        "🛒 *S K Crackers — Wallet Purchase Request*",
        "",
        partnerLine,
        codeLine,
        `Invoice: ${tx.invoiceNumber}`,
        `Wallet Used: ₹${Number(tx.amount).toFixed(2)}`,
        `Wallet Balance after: ₹${Number(json.newBalance).toFixed(2)}`,
        "",
        "*Products:*",
        purchaseProducts.trim(),
        "",
        "Please confirm the order and share transport details.",
      ].filter(Boolean).join("\n");

      openWhatsApp(adminWhatsapp, msg);
      toast({ title: "Purchase requested", description: `Wallet decreased by ₹${amt.toFixed(2)}. WhatsApp opened.` });
      setShowPurchaseModal(false);
      setPurchaseAmt("");
      setPurchaseProducts("");
    } catch {
      toast({ title: "Purchase failed", variant: "destructive" });
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

        {/* Hero / Profile */}
        <Card className="p-5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0">
              {customer?.profilePhoto ? (
                <img src={customer.profilePhoto} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <Briefcase className="w-7 h-7 text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Partner Program</p>
              <h1 className="font-display text-2xl text-white" data-testid="text-partner-name">{customer?.fullName || customer?.username}</h1>
              <p className="text-xs text-muted-foreground">+91 {customer?.phone}</p>
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
              onClick={() => setShowPurchaseModal(true)}
              disabled={Number(data?.walletBalance || 0) <= 0}
              className="h-12 font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black"
            >
              <ShoppingBag className="w-4 h-4" /> Purchase Product
            </Button>
          </div>

          <Button
            data-testid="button-history-toggle"
            onClick={() => setShowHistory(v => !v)}
            variant="outline"
            className="w-full h-10 gap-2 border-white/10 text-white hover:bg-white/5"
          >
            <History className="w-4 h-4" /> {showHistory ? "Hide" : "View"} Withdrawal & Purchase History ({transactions.length})
          </Button>
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

        {/* Withdrawal & Purchase History */}
        {showHistory && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-white tracking-wide">Wallet Transaction History</h2>
            </div>

            <HistorySection
              title="Withdrawals"
              icon={<ArrowDownToLine className="w-4 h-4 text-emerald-400" />}
              items={withdrawals}
              emptyText="No withdrawals yet."
            />
            <HistorySection
              title="Wallet Purchases"
              icon={<ShoppingBag className="w-4 h-4 text-amber-400" />}
              items={purchases}
              emptyText="No wallet purchases yet."
            />
          </Card>
        )}
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

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <ActionModal
          title="Wallet Purchase"
          icon={<ShoppingBag className="w-5 h-5 text-amber-400" />}
          onClose={() => setShowPurchaseModal(false)}
        >
          <p className="text-xs text-muted-foreground">
            Available balance: <span className="text-amber-400 font-bold">₹{Number(data?.walletBalance || 0).toFixed(2)}</span>
          </p>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount to spend (₹)</Label>
          <Input
            data-testid="input-purchase-amount"
            type="number"
            min={1}
            max={Number(data?.walletBalance || 0)}
            value={purchaseAmt}
            onChange={e => setPurchaseAmt(e.target.value)}
            className="h-12 text-lg font-bold bg-white/5 border-white/10"
            placeholder="0"
          />
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Product details</Label>
          <textarea
            data-testid="textarea-purchase-products"
            value={purchaseProducts}
            onChange={e => setPurchaseProducts(e.target.value)}
            placeholder="e.g. 2 x Flower Pot Big, 1 x Sky Shot Multi"
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
          />
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 text-xs space-y-1 text-muted-foreground">
            <p>On confirm:</p>
            <p>• Wallet decreases by entered amount immediately</p>
            <p>• WhatsApp opens with partner & product details for admin</p>
            <p>• Admin confirms order and shares transport details</p>
          </div>
          <Button
            data-testid="button-purchase-confirm"
            onClick={handlePurchase}
            isLoading={submitting}
            className="w-full h-12 font-bold gap-2 bg-amber-500 hover:bg-amber-600 text-black"
          >
            <MessageCircle className="w-4 h-4" /> Send to WhatsApp & Deduct
          </Button>
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

function HistorySection({ title, icon, items, emptyText }: { title: string; icon: React.ReactNode; items: WalletTx[]; emptyText: string }) {
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
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">📦 {tx.productDetails}</p>
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
                <p className="text-[10px] text-emerald-400 mt-1">UTR: {tx.transactionRef}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionModal({ title, icon, onClose, children }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[90vh] bg-background border border-white/10 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {icon}
            <p className="text-sm font-bold text-white">{title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">{children}</div>
      </div>
    </div>
  );
}

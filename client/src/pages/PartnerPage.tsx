import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Briefcase, Wallet, Share2, Copy, Sparkles, Users, History, Check, ArrowLeft, IndianRupee, Tag, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PartnerData {
  referralCode: string | null;
  referralPercentage: number;
  walletBalance: string;
  history: Array<{ id: number; usedByName: string; amountCredited: string; createdAt: string; orderId: number | null }>;
}

export default function PartnerPage() {
  const { customer, isLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [percentage, setPercentage] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading: loadingPartner } = useQuery<PartnerData>({
    queryKey: ["/api/customers/me/partner"],
    enabled: !!customer,
  });

  useEffect(() => {
    if (data) setPercentage(data.referralPercentage);
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
      try {
        await navigator.share({ title: "S K Crackers - Sivakasi Fireworks", text: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Share message copied!", description: "Paste it anywhere to share" });
      } catch { /* fail silently */ }
    }
  };

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

        {/* Wallet */}
        <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30">
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
              <p className="text-[10px] text-muted-foreground mt-3">
                Share text: "{shareText.slice(0, 80)}…"
              </p>
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-2">Set a percentage and tap Generate to create your unique code.</p>
          )}
        </Card>

        {/* History */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg text-white tracking-wide">Referral History</h2>
            {data?.history && (
              <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
                <Users className="w-3 h-3 inline mr-1" />{data.history.length} member{data.history.length !== 1 ? "s" : ""}
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
    </Layout>
  );
}

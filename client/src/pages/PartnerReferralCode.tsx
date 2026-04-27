import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button, Card, Input, Label } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Tag, Copy, Check, Share2 } from "lucide-react";

type PartnerData = {
  referralCode: string | null;
  referralPercentage: number;
};

export default function PartnerReferralCode() {
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  useEffect(() => {
    if (!authLoading && !customer) setLocation("/login");
  }, [authLoading, customer, setLocation]);

  const { data, isLoading } = useQuery<PartnerData>({
    queryKey: ["/api/customers/me/partner"],
    enabled: !!customer,
  });

  const [percentage, setPercentage] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data) setPercentage(data.referralPercentage || 0);
  }, [data]);

  const save = useMutation({
    mutationFn: () => apiRequest("POST", "/api/customers/me/partner", { percentage }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me/partner"] });
      toast({ title: data?.referralCode ? "Percentage updated" : "Referral code generated" });
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const copy = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode).then(() => {
      setCopied(true);
      toast({ title: "Copied", description: data.referralCode! });
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const share = () => {
    if (!data?.referralCode) return;
    const url = window.location.origin;
    const text = `Use my code ${data.referralCode} on S K Crackers and get the best fireworks at wholesale prices! ${url}`;
    if (navigator.share) {
      navigator.share({ title: "S K Crackers", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => toast({ title: "Share text copied" }));
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-2xl">
        <Link href="/partner">
          <Button variant="outline" className="gap-2 border-white/10" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" /> Back to Partner
          </Button>
        </Link>

        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl text-white tracking-wide">Your Referral Code</h1>
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
                onChange={(e) => setPercentage(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                className="h-12 text-lg font-bold bg-white/5 border-white/10 flex-1"
              />
              <div className="flex items-center px-4 text-2xl font-bold text-primary">%</div>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full accent-primary"
              data-testid="slider-percentage"
            />
            <p className="text-xs text-muted-foreground">
              You will earn <span className="text-primary font-bold">{percentage}%</span> of every order placed using your referral code (max 20%).
            </p>
          </div>

          <Button onClick={() => save.mutate()} isLoading={save.isPending} className="w-full h-11 font-bold" data-testid="button-save-referral">
            <Sparkles className="w-4 h-4" /> {data?.referralCode ? "Update Percentage" : "Generate Referral Code"}
          </Button>

          {isLoading ? (
            <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
          ) : data?.referralCode ? (
            <div className="rounded-2xl bg-black/40 border-2 border-dashed border-primary/40 p-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Your Code</p>
              <p className="font-display text-3xl text-gradient-gold tracking-[0.3em] mb-3" data-testid="text-referral-code">{data.referralCode}</p>
              <div className="flex gap-2">
                <Button onClick={copy} className="flex-1 h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm" data-testid="button-copy-code">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy Code"}
                </Button>
                <Button onClick={share} className="flex-1 h-10 font-bold text-sm" data-testid="button-share-referral">
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-center text-muted-foreground py-2">Set a percentage and tap Generate to create your unique code.</p>
          )}
        </Card>
      </div>
    </Layout>
  );
}

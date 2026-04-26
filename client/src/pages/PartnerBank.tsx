import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Copy, Edit2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/use-customer-auth";

type PartnerData = {
  bank: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upi: string;
  };
};

function Row({ label, value, copyable, testId }: { label: string; value: string; copyable?: boolean; testId: string }) {
  const { toast } = useToast();
  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => toast({ title: "Copied", description: label }));
  };
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-white/10 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-mono text-white truncate" data-testid={testId}>{value || "—"}</p>
      </div>
      {copyable && value && (
        <button onClick={copy} className="p-2 rounded-lg border border-white/10 hover:bg-white/5" aria-label={`Copy ${label}`} data-testid={`copy-${testId}`}>
          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export default function PartnerBank() {
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!authLoading && !customer) setLocation("/login");
  }, [authLoading, customer, setLocation]);

  const { data, isLoading, isError, error } = useQuery<PartnerData>({
    queryKey: ["/api/customers/me/partner"],
    enabled: !!customer,
  });

  const b = data?.bank;
  const printPage = () => window.print();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-2xl">
        <div className="flex items-center justify-between gap-3 flex-wrap no-print">
          <Link href="/partner">
            <Button variant="outline" className="gap-2 border-white/10" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" /> Back to Partner
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button onClick={printPage} variant="outline" className="gap-2 border-white/10" data-testid="button-print">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Link href="/partner">
              <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold" data-testid="button-edit">
                <Edit2 className="w-4 h-4" /> Edit on Partner
              </Button>
            </Link>
          </div>
        </div>

        <Card className="p-6 bg-black/40 border-white/10 print:bg-white print:text-black">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl text-white tracking-wide print:text-black">Bank Details</h1>
          </div>

          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}</div>
          ) : isError ? (
            <p className="text-sm text-red-400">{(error as Error)?.message || "Failed to load."}</p>
          ) : (
            <div>
              <Row label="Account Holder" value={b?.accountHolder || ""} testId="text-holder" />
              <Row label="Bank Name" value={b?.bankName || ""} testId="text-bank-name" />
              <Row label="Account Number" value={b?.accountNumber || ""} copyable testId="text-account-number" />
              <Row label="IFSC Code" value={b?.ifsc || ""} copyable testId="text-ifsc" />
              <Row label="UPI ID" value={b?.upi || ""} copyable testId="text-upi" />

              {b && !b.accountNumber && !b.upi && (
                <p className="text-xs text-amber-400 mt-4">Add at least a bank account or UPI ID on the Partner page to enable withdrawals.</p>
              )}
            </div>
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center no-print">
          These details are used only for your withdrawal payouts. They are private and never shared with other customers.
        </p>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
    </Layout>
  );
}

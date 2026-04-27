import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Building2, Copy, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Bank = {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upi: string;
};

type PartnerData = { bank: Bank };

const EMPTY_BANK: Bank = { accountHolder: "", bankName: "", accountNumber: "", ifsc: "", upi: "" };

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

function Field({ label, value, onChange, testId, placeholder, transform }: { label: string; value: string; onChange: (v: string) => void; testId: string; placeholder?: string; transform?: (v: string) => string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input
        data-testid={testId}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(transform ? transform(e.target.value) : e.target.value)}
        className="h-10 bg-white/5 border-white/10 text-white"
      />
    </div>
  );
}

export default function PartnerBank() {
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  useEffect(() => {
    if (!authLoading && !customer) setLocation("/login");
  }, [authLoading, customer, setLocation]);

  const { data, isLoading, isError, error } = useQuery<PartnerData>({
    queryKey: ["/api/customers/me/partner"],
    enabled: !!customer,
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Bank>(EMPTY_BANK);

  useEffect(() => {
    if (data?.bank) setDraft(data.bank);
  }, [data]);

  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/customers/me/bank", draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/me/partner"] });
      toast({ title: "Bank details saved" });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const b = data?.bank;

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
            {editing ? (
              <>
                <Button
                  onClick={() => { setEditing(false); if (data?.bank) setDraft(data.bank); }}
                  variant="outline"
                  className="gap-2 border-white/10"
                  data-testid="button-cancel-bank"
                >
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button
                  onClick={() => save.mutate()}
                  isLoading={save.isPending}
                  className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  data-testid="button-save-bank"
                >
                  <Save className="w-4 h-4" /> Save
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)} className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold" data-testid="button-edit-bank">
                <Edit2 className="w-4 h-4" /> Edit
              </Button>
            )}
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
          ) : editing ? (
            <div className="space-y-4">
              <Field label="Account Holder Name" value={draft.accountHolder} onChange={(v) => setDraft({ ...draft, accountHolder: v })} testId="input-bank-holder" />
              <Field label="Bank Name" value={draft.bankName} onChange={(v) => setDraft({ ...draft, bankName: v })} testId="input-bank-name" />
              <Field label="Account Number" value={draft.accountNumber} onChange={(v) => setDraft({ ...draft, accountNumber: v })} testId="input-bank-acct" transform={(v) => v.replace(/[^0-9]/g, "")} />
              <Field label="IFSC Code" value={draft.ifsc} onChange={(v) => setDraft({ ...draft, ifsc: v })} testId="input-bank-ifsc" transform={(v) => v.toUpperCase()} />
              <Field label="UPI ID (optional)" value={draft.upi} onChange={(v) => setDraft({ ...draft, upi: v })} testId="input-bank-upi" placeholder="example@upi" />
            </div>
          ) : (
            <div>
              <Row label="Account Holder" value={b?.accountHolder || ""} testId="text-holder" />
              <Row label="Bank Name" value={b?.bankName || ""} testId="text-bank-name" />
              <Row label="Account Number" value={b?.accountNumber || ""} copyable testId="text-account-number" />
              <Row label="IFSC Code" value={b?.ifsc || ""} copyable testId="text-ifsc" />
              <Row label="UPI ID" value={b?.upi || ""} copyable testId="text-upi" />

              {b && !b.accountNumber && !b.upi && (
                <p className="text-xs text-amber-400 mt-4">Tap <span className="text-amber-300 font-bold">Edit</span> above to add at least a bank account or UPI ID and enable withdrawals.</p>
              )}
            </div>
          )}
        </Card>

        <p className="text-xs text-muted-foreground text-center no-print">
          These details are used only for your withdrawal payouts. They are private and never shared with other customers.
        </p>
      </div>

    </Layout>
  );
}

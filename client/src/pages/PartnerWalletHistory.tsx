import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, History, IndianRupee, Search } from "lucide-react";

type WalletTx = {
  id: number;
  invoiceNumber: string | null;
  type: "withdrawal" | "purchase";
  amount: string;
  status: "pending" | "completed" | "rejected";
  transactionRef: string | null;
  notes: string | null;
  createdAt: string;
};

type PartnerData = {
  walletTransactions: WalletTx[];
};

export default function PartnerWalletHistory() {
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!authLoading && !customer) setLocation("/login");
  }, [authLoading, customer, setLocation]);

  const { data, isLoading, isError, error } = useQuery<PartnerData>({
    queryKey: ["/api/customers/me/partner"],
    enabled: !!customer,
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const txs = data?.walletTransactions ?? [];

  const filtered = useMemo(() => {
    return txs.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.invoiceNumber || ""} ${t.transactionRef || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [txs, statusFilter, typeFilter, search]);

  const totals = useMemo(() => {
    let withdrawn = 0;
    let purchased = 0;
    for (const t of filtered) {
      const v = Number(t.amount);
      if (t.status !== "completed") continue;
      if (t.type === "withdrawal") withdrawn += v;
      else purchased += v;
    }
    return { withdrawn, purchased };
  }, [filtered]);

  const downloadCsv = () => {
    const header = ["Invoice #", "Type", "Amount (INR)", "Status", "Reference / Remarks", "Date"];
    const rows = filtered.map((t) => [
      t.invoiceNumber || `#${t.id}`,
      t.type,
      Number(t.amount).toFixed(2),
      t.status,
      (t.transactionRef || "").replace(/[\n,]/g, " "),
      new Date(t.createdAt).toLocaleString("en-IN"),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-6xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link href="/partner">
            <Button variant="outline" className="gap-2 border-white/10" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" /> Back to Partner
            </Button>
          </Link>
          <Button onClick={downloadCsv} disabled={!filtered.length} className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold" data-testid="button-download-csv">
            <Download className="w-4 h-4" /> Download CSV
          </Button>
        </div>

        <Card className="p-5 bg-black/40 border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl text-white tracking-wide">Wallet Transaction History</h1>
            <span className="ml-auto text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full border border-white/10">
              {filtered.length} of {txs.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-status"><SelectValue placeholder="All status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white" data-testid="select-type"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice / reference"
                className="pl-9 bg-white/5 border-white/10 text-white"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="stat-withdrawn">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Withdrawn (filtered)</p>
              <p className="text-xl font-bold text-emerald-400 flex items-center"><IndianRupee className="w-4 h-4" />{totals.withdrawn.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="stat-purchased">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Wallet Purchases (filtered)</p>
              <p className="text-xl font-bold text-amber-400 flex items-center"><IndianRupee className="w-4 h-4" />{totals.purchased.toFixed(2)}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}</div>
          ) : isError ? (
            <p className="text-sm text-red-400">{(error as Error)?.message || "Failed to load."}</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No transactions match your filters.</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-muted-foreground">Invoice</TableHead>
                    <TableHead className="text-muted-foreground">Type</TableHead>
                    <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Ref / Remarks</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id} className="border-white/10" data-testid={`row-tx-${t.id}`}>
                      <TableCell className="font-mono text-xs">{t.invoiceNumber || `#${t.id}`}</TableCell>
                      <TableCell className="capitalize text-xs">{t.type}</TableCell>
                      <TableCell className="text-right font-bold">₹{Number(t.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase font-bold ${
                          t.status === "completed" ? "bg-emerald-500/20 text-emerald-300"
                          : t.status === "rejected" ? "bg-red-500/20 text-red-300"
                          : "bg-amber-500/20 text-amber-300"
                        }`}>{t.status}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate" title={t.transactionRef || ""}>
                        {t.transactionRef || "—"}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{new Date(t.createdAt).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}

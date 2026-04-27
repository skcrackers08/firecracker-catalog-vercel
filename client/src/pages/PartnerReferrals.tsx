import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, IndianRupee, Search, Users } from "lucide-react";

type ReferralRow = {
  id: number;
  usedByName: string;
  usedByPhone: string;
  amountCredited: string;
  orderSubtotal: string | null;
  orderId: number | null;
  createdAt: string;
};

type PartnerData = {
  referralCode: string | null;
  referralPercentage: number;
  history: ReferralRow[];
};

const refSerial = (id: number) => `SK-RF-${String(id).padStart(5, "0")}`;

export default function PartnerReferrals() {
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!authLoading && !customer) setLocation("/login");
  }, [authLoading, customer, setLocation]);

  const { data, isLoading, isError, error } = useQuery<PartnerData>({
    queryKey: ["/api/customers/me/partner"],
    enabled: !!customer,
  });

  const [search, setSearch] = useState("");
  const history = data?.history ?? [];

  const filtered = useMemo(() => {
    if (!search) return history;
    const q = search.toLowerCase();
    return history.filter((h) =>
      h.usedByName.toLowerCase().includes(q) ||
      refSerial(h.id).toLowerCase().includes(q) ||
      (h.orderId ? String(h.orderId).includes(q) : false)
    );
  }, [history, search]);

  const totals = useMemo(() => {
    let productPrice = 0;
    let earned = 0;
    for (const h of filtered) {
      productPrice += Number(h.orderSubtotal || 0);
      earned += Number(h.amountCredited || 0);
    }
    return { productPrice, earned };
  }, [filtered]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 space-y-4 max-w-6xl">
        <Link href="/partner">
          <Button variant="outline" className="gap-2 border-white/10" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" /> Back to Partner
          </Button>
        </Link>

        <Card className="p-5 bg-black/40 border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl text-white tracking-wide">Referral Earnings</h1>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="stat-product-price">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total Product Price (filtered)</p>
              <p className="text-xl font-bold text-white flex items-center"><IndianRupee className="w-4 h-4" />{totals.productPrice.toFixed(2)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Excludes GST &amp; handling charges.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid="stat-earned">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">You Earned (filtered)</p>
              <p className="text-xl font-bold text-emerald-400 flex items-center"><IndianRupee className="w-4 h-4" />{totals.earned.toFixed(2)}</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ref ID or order #"
              className="pl-9 bg-white/5 border-white/10 text-white"
              data-testid="input-search"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}</div>
          ) : isError ? (
            <p className="text-sm text-red-400">{(error as Error)?.message || "Failed to load."}</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No referrals yet. Share your code to start earning.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-muted-foreground">Ref ID</TableHead>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-muted-foreground">Customer Name</TableHead>
                    <TableHead className="text-muted-foreground">Order</TableHead>
                    <TableHead className="text-muted-foreground text-right">Product Price</TableHead>
                    <TableHead className="text-muted-foreground text-right">You Earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((h) => (
                    <TableRow key={h.id} className="border-white/10" data-testid={`row-ref-${h.id}`}>
                      <TableCell className="font-mono text-xs text-amber-300">{refSerial(h.id)}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">{new Date(h.createdAt).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-sm font-semibold">{h.usedByName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{h.orderId ? `SK-${String(h.orderId).padStart(4, "0")}` : "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">₹{Number(h.orderSubtotal || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">₹{Number(h.amountCredited).toFixed(2)}</TableCell>
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

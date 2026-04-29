import { Link, useParams, useLocation } from "wouter";
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui-custom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Download, ArrowLeft, Truck, Loader2 } from "lucide-react";

export default function TransportBillView() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { customer, isLoading } = useCustomerAuth();

  useEffect(() => {
    if (!isLoading && !customer) {
      setLocation(`/login?redirect=/transport-bill/${id}`);
    }
  }, [isLoading, customer, id, setLocation]);

  if (isLoading || !customer) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      </Layout>
    );
  }

  const viewUrl = `/api/customers/orders/${id}/transport-bill`;
  const downloadUrl = `/api/customers/orders/${id}/transport-bill?download=1`;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Link href="/account">
              <Button
                variant="outline"
                data-testid="button-back-account"
                className="h-9 px-3 text-xs gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-500" /> Transport Bill
              <span className="text-sm font-mono text-muted-foreground">
                #SK-{String(id).padStart(4, "0")}
              </span>
            </h1>
          </div>
          <a href={downloadUrl} download>
            <Button
              data-testid="button-download-transport-bill"
              className="h-9 px-4 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </a>
        </div>

        <div className="border rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
          <iframe
            src={viewUrl}
            title="Transport Bill PDF"
            className="w-full h-[80vh]"
            data-testid="iframe-transport-bill"
          />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          If the PDF does not load, click "Download PDF" above to save it.
        </p>
      </div>
    </Layout>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, Input } from "@/components/ui-custom";
import logoPng from "@assets/pngtree-logo-template-for-esports-vector-illustration-of-a-lio_1772309271956.png";

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  imageUrl: string;
}

export function SearchPopup({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const [query, setQuery] = useState("");

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: open,
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [products, query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[78] bg-black/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 left-3 right-3 sm:top-20 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[94vw] sm:max-w-2xl z-[79]"
            data-testid="popup-search"
          >
            <Card className="overflow-hidden border-primary/30 shadow-2xl">
              <div className="flex items-center gap-3 p-3 border-b border-white/10 bg-background/95">
                <img src={logoPng} alt="logo" className="w-8 h-8 rounded-full ring-2 ring-primary/40 shrink-0" />
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    data-testid="input-popup-search"
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search crackers by name or category..."
                    className="pl-9 h-11 bg-white/5 border-white/10"
                  />
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-white shrink-0"
                  data-testid="button-search-close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-3 bg-background/95">
                {!products ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No products found for "{query}"
                  </div>
                ) : (
                  <>
                    {!query && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-1">Suggestions</p>
                    )}
                    <div className="space-y-1.5">
                      {results.map(p => (
                        <Link
                          key={p.id}
                          href={`/product/${p.id}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                          data-testid={`search-result-${p.id}`}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Search className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-primary transition">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{p.category}</p>
                          </div>
                          <p className="text-sm font-bold text-primary shrink-0">₹{Number(p.price).toFixed(0)}</p>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

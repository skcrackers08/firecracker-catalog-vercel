import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, Share2, Check, ShoppingCart, ArrowLeft, Sparkles, Plus, Minus } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useProducts } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { Layout } from "@/components/Layout";
import { Button, Card } from "@/components/ui-custom";
import { Product } from "@shared/schema";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToWishlist } = useWishlist();
  const { data: allProducts } = useProducts();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [draftQty, setDraftQty] = useState<Record<number, number>>({});

  const urlParams = new URLSearchParams(window.location.search);
  const sharedIds = urlParams.get("ids")?.split(",").map(Number).filter(Boolean) ?? [];
  const isSharedView = sharedIds.length > 0;

  const sharedProducts: Product[] = isSharedView
    ? (allProducts ?? []).filter(p => sharedIds.includes(p.id))
    : [];

  const displayItems = isSharedView ? sharedProducts : wishlist;

  const handleAddSharedToWishlist = (product: Product) => {
    addToWishlist(product);
    toast({ title: "Added to your wishlist!", description: product.name });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Catalog
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Heart className="w-6 h-6 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-display text-white tracking-widest">
              {isSharedView ? "SHARED WISHLIST" : "MY WISHLIST"}
            </h1>
            {isSharedView && (
              <p className="text-muted-foreground mt-1">Someone shared their favourite crackers with you!</p>
            )}
          </div>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-2xl font-display text-muted-foreground mb-4">
              {isSharedView ? "No products found in this wishlist" : "Your wishlist is empty"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isSharedView ? "The products may have been removed." : "Browse our catalog and add your favourites!"}
            </p>
            <Link href="/">
              <Button>Browse Catalog</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayItems.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <Card className="p-5 flex flex-col gap-4 group hover:border-primary/30 transition-all duration-300">
                  <Link href={`/product/${product.id}`} className="block">
                    <div className="aspect-square bg-black/40 rounded-xl p-4 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary/20 transition-colors">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </Link>

                  <div className="flex-1 space-y-2">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-bold text-white text-lg mb-1 hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    </Link>
                    {product.productCode && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Code: <span className="text-white/80">{product.productCode}</span></p>
                    )}
                    {product.category && (
                      <p className="text-[10px] uppercase tracking-wider text-amber-400">{product.category}</p>
                    )}
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-primary">₹{Number(product.price).toFixed(2)}</p>
                      {Number(product.stockQuantity) > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">In stock</span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/30">Out of stock</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(() => {
                      const qty = draftQty[product.id] ?? 0;
                      if (qty === 0) {
                        return (
                          <Button
                            className="flex-1 gap-2"
                            onClick={() => setDraftQty(prev => ({ ...prev, [product.id]: 1 }))}
                            data-testid={`button-add-enquiry-${product.id}`}
                          >
                            <ShoppingCart className="w-4 h-4" /> Add to Enquiry
                          </Button>
                        );
                      }
                      return (
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => setDraftQty(prev => ({ ...prev, [product.id]: Math.max(1, qty - 1) }))}
                              data-testid={`button-qty-dec-${product.id}`}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-white" data-testid={`text-qty-${product.id}`}>{qty}</span>
                            <button
                              type="button"
                              onClick={() => setDraftQty(prev => ({ ...prev, [product.id]: qty + 1 }))}
                              data-testid={`button-qty-inc-${product.id}`}
                              aria-label="Increase quantity"
                              className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <Button
                            className="flex-1 gap-2"
                            onClick={() => {
                              addToCart(product, qty);
                              toast({ title: "Added to enquiry", description: `${product.name} × ${qty}` });
                              setDraftQty(prev => {
                                const next = { ...prev };
                                delete next[product.id];
                                return next;
                              });
                            }}
                            data-testid={`button-confirm-enquiry-${product.id}`}
                          >
                            <Check className="w-4 h-4" /> Confirm Enquiry
                          </Button>
                        </div>
                      );
                    })()}

                    {isSharedView ? (
                      <Button
                        variant="outline"
                        className="p-3 border-pink-500/30 text-pink-400 hover:bg-pink-500/10"
                        onClick={() => handleAddSharedToWishlist(product)}
                        title="Save to my wishlist"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="p-3 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => removeFromWishlist(product.id)}
                        title="Remove from wishlist"
                      >
                        <Heart className="w-4 h-4 fill-red-400" />
                      </Button>
                    )}
                  </div>

                  <Button
                    data-testid={`button-share-product-${product.id}`}
                    variant="outline"
                    className="w-full gap-2 border-white/10 text-white hover:bg-white/5 text-xs"
                    onClick={async () => {
                      const websiteUrl = `${window.location.origin}/product/${product.id}`;
                      const shareData = {
                        title: product.name,
                        text: `${product.name}\n${websiteUrl}`,
                        url: websiteUrl,
                      };
                      if (navigator.share) {
                        try { await navigator.share(shareData); }
                        catch { /* user cancelled */ }
                      } else {
                        try {
                          await navigator.clipboard.writeText(`${product.name}\n${websiteUrl}`);
                          toast({ title: "Link copied!", description: "Product name and website link copied." });
                        } catch {
                          toast({ title: "Copy failed", variant: "destructive" });
                        }
                      }
                    }}
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share product link
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}

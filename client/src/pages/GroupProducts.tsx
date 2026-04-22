import { useRoute, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useProducts } from "@/hooks/use-products";
import { PRODUCT_GROUPS } from "@/lib/product-groups";
import { Card, Button } from "@/components/ui-custom";
import { Heart, ArrowLeft, ChevronRight } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useState } from "react";

export default function GroupProducts() {
  const [, params] = useRoute("/group/:name");
  const [, setLocation] = useLocation();
  const groupName = params?.name ? decodeURIComponent(params.name) : "";
  const { data: products, isLoading } = useProducts();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [activeSubgroup, setActiveSubgroup] = useState<string>("All");

  const groupData = PRODUCT_GROUPS.find(g => g.name === groupName);

  const groupProducts = products?.filter(p =>
    groupData
      ? p.category === groupData.category
      : p.category === groupName
  ) ?? [];

  const subgroups = ["All", ...Array.from(new Set(
    groupProducts.map(p => p.subgroup || "").filter(Boolean)
  ))];

  const filteredProducts = activeSubgroup === "All"
    ? groupProducts
    : groupProducts.filter(p => p.subgroup === activeSubgroup);

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setLocation("/")}
          data-testid="button-back-to-groups"
          className="p-2 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display tracking-wider text-white truncate">{groupName.toUpperCase()}</h1>
          <p className="text-xs text-muted-foreground">{groupProducts.length} products</p>
        </div>
      </div>

      {/* Subgroup Tabs */}
      {subgroups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-1 px-1">
          {subgroups.map((sub) => {
            const count = sub === "All"
              ? groupProducts.length
              : groupProducts.filter(p => p.subgroup === sub).length;
            return (
              <button
                key={sub}
                data-testid={`tab-subgroup-${sub.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setActiveSubgroup(sub)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeSubgroup === sub
                    ? "bg-primary text-black shadow-fire-glow scale-105"
                    : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10"
                }`}
              >
                {sub} {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-52 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl">
          <p className="text-lg text-muted-foreground">No products found.</p>
          <button onClick={() => setActiveSubgroup("All")} className="text-primary text-sm underline mt-3">
            Show all
          </button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }}
            >
              <Card
                data-testid={`card-product-${product.id}`}
                className="h-full flex flex-col group bg-black/40 border border-white/5 hover:border-primary/30 transition-all duration-300"
              >
                <Link
                  href={`/product/${product.id}`}
                  className="block relative h-36 overflow-hidden bg-white/5 p-3 cursor-pointer rounded-t-xl"
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=400&h=400&fit=crop";
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
                    <span className="font-bold text-primary text-[10px]">₹{Number(product.price).toFixed(0)}</span>
                  </div>
                  {product.subgroup && (
                    <div className="absolute bottom-2 left-2 bg-primary/20 border border-primary/30 px-1.5 py-0.5 rounded-full">
                      <span className="text-primary text-[9px] font-semibold">{product.subgroup}</span>
                    </div>
                  )}
                </Link>

                <div className="p-2.5 flex flex-col flex-1">
                  <Link href={`/product/${product.id}`}>
                    <h4 className="text-xs font-semibold mb-1 line-clamp-2 hover:text-primary transition-colors text-center text-white leading-tight">{product.name}</h4>
                  </Link>
                  <div className="text-center mb-2">
                    <span className="text-sm font-bold text-primary">₹{Number(product.price).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-auto">
                    <Link href={`/product/${product.id}`} className="flex-1">
                      <Button
                        variant="primary"
                        className="w-full h-7 px-2 text-[10px] font-bold uppercase tracking-wider"
                        data-testid={`button-buy-${product.id}`}
                      >
                        SEND ENQUIRY
                      </Button>
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                      className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-pink-500/10 hover:border-pink-500/30 transition-colors shrink-0"
                      data-testid={`button-wishlist-${product.id}`}
                    >
                      <Heart className={`w-3 h-3 transition-colors ${isInWishlist(product.id) ? "text-pink-500 fill-pink-500" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </Layout>
  );
}

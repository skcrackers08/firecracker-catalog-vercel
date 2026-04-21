import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useProducts } from "@/hooks/use-products";
import { PRODUCT_GROUPS } from "@/lib/product-groups";
import { Card, Button } from "@/components/ui-custom";
import { Heart, ChevronRight, X, ArrowLeft } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";

export default function ProductGroups() {
  const { data: products, isLoading } = useProducts();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const activeGroupData = PRODUCT_GROUPS.find(g => g.name === activeGroup);

  const groupProducts = activeGroup && activeGroupData
    ? products?.filter(p => p.category === activeGroupData.category)
    : null;

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {activeGroup ? (
          <button
            onClick={() => setActiveGroup(null)}
            className="p-2 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : null}
        <h1 className="text-2xl font-display tracking-wider text-white">
          {activeGroup ? activeGroup.toUpperCase() : "PRODUCT GROUPS"}
        </h1>
        {activeGroup && (
          <span className="text-sm text-muted-foreground">
            ({groupProducts?.length ?? 0} items)
          </span>
        )}
      </div>

      {!activeGroup ? (
        /* Groups Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {PRODUCT_GROUPS.map((group, idx) => {
            const count = products?.filter(p => p.category === group.category).length ?? 0;

            return (
              <motion.button
                key={group.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                onClick={() => setActiveGroup(group.name)}
                data-testid={`group-card-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] group text-left"
              >
                <div className="relative h-36 sm:h-44">
                  <img
                    src={group.image}
                    alt={group.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display text-white text-base tracking-wider">{group.name}</p>
                      <p className="text-[11px] text-white/60 mt-0.5">{count} products</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                      <ChevronRight className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* Products in Selected Group */
        <div>
          {/* Sub-groups tabs */}
          {activeGroupData && groupProducts && groupProducts.length > 0 && (() => {
            const subgroups = [...new Set(groupProducts.map(p => p.subgroup || "").filter(Boolean))];
            return subgroups.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                <span className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium bg-primary text-black">
                  All {activeGroup}
                </span>
              </div>
            ) : null;
          })()}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-52 bg-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : groupProducts?.length === 0 ? (
            <div className="p-12 text-center bg-white/5 rounded-2xl">
              <p className="text-lg text-muted-foreground">No products in this group yet.</p>
              <button onClick={() => setActiveGroup(null)} className="text-primary text-sm underline mt-3">
                View all groups
              </button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {groupProducts?.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                >
                  <Card className="h-full flex flex-col group bg-black/40 border border-white/5 hover:border-primary/30 transition-all duration-300">
                    <Link href={`/product/${product.id}`} className="block relative h-32 sm:h-36 overflow-hidden bg-white/5 p-3 cursor-pointer rounded-t-xl">
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
                    </Link>

                    <div className="p-2.5 flex flex-col flex-1">
                      <Link href={`/product/${product.id}`}>
                        <h4 className="text-xs font-semibold mb-1 line-clamp-1 hover:text-primary transition-colors text-center text-white">{product.name}</h4>
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
                            BOOK NOW
                          </Button>
                        </Link>
                        <button
                          onClick={() => toggleWishlist(product)}
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
        </div>
      )}
    </Layout>
  );
}

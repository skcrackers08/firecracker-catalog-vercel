import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { Layout } from "@/components/Layout";
import { Card, Button } from "@/components/ui-custom";
import { Settings, ChevronLeft, ChevronRight, ShoppingCart, Heart, Search, X, ChevronRight as ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { PRODUCT_GROUPS } from "@/lib/product-groups";

export default function Home() {
  const { data: products, isLoading, error } = useProducts();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const [location] = useLocation();

  useEffect(() => {
    if (location.includes("search=1")) {
      searchRef.current?.focus();
      catalogRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % Math.min(products.length, 5));
    }, 4000);
    return () => clearInterval(timer);
  }, [products]);

  const handleDragEnd = (event: any, info: any) => {
    if (!products) return;
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setCurrentIdx((prev) => (prev + 1) % Math.min(products.length, 5));
    } else if (info.offset.x > swipeThreshold) {
      setCurrentIdx((prev) => (prev - 1 + Math.min(products.length, 5)) % Math.min(products.length, 5));
    }
  };

  const featuredProducts = products?.slice(0, 5) ?? [];
  const topProduct = featuredProducts[currentIdx];

  const getGroupCategories = (groupName: string | null) => {
    if (!groupName) return null;
    const group = PRODUCT_GROUPS.find(g => g.name === groupName);
    return group?.categories ?? null;
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch = !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const groupCategories = getGroupCategories(selectedGroup);
    const matchesGroup = !groupCategories || groupCategories.includes(p.category || "Other");
    return matchesSearch && matchesGroup;
  });

  return (
    <Layout>
      <div className="absolute top-4 right-4 z-50 hidden">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" data-testid="button-admin-settings">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative mb-5" ref={catalogRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Find your festival spark..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
          className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white/8 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* FESTIVE OFFER Carousel */}
      {!isLoading && !error && featuredProducts.length > 0 && !searchQuery && (
        <section className="mb-6 relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-xl touch-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={topProduct?.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
              <img
                src={topProduct?.imageUrl}
                alt={topProduct?.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=800";
                }}
              />
              <div className="absolute inset-0 z-20 p-5 sm:p-7 flex flex-col justify-center max-w-[65%]">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-black text-[10px] font-bold uppercase tracking-wider mb-3 w-fit">
                  🎆 FESTIVE OFFER
                </span>
                <Link href={`/product/${topProduct?.id}`}>
                  <h2 className="text-xl sm:text-2xl font-display text-white leading-tight mb-1.5 hover:text-primary transition-colors line-clamp-2">
                    {topProduct?.name}
                  </h2>
                </Link>
                <p className="text-xs text-white/70 line-clamp-2 mb-4">
                  {topProduct?.description}
                </p>
                <Link href={`/product/${topProduct?.id}`}>
                  <Button className="h-8 px-4 text-xs font-bold w-fit">
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                    BUY NOW
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-30">
            {featuredProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIdx ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Nav Arrows */}
          <button
            onClick={() => setCurrentIdx((p) => (p - 1 + featuredProducts.length) % featuredProducts.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white z-30 hover:bg-black/70"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentIdx((p) => (p + 1) % featuredProducts.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white z-30 hover:bg-black/70"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {/* Product Groups */}
      {!searchQuery && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display tracking-wider text-white">Still looking for these</h2>
            <Link href="/groups" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {PRODUCT_GROUPS.map((group) => {
              const isSelected = selectedGroup === group.name;
              const count = products?.filter(p =>
                group.categories.includes(p.category || "Other")
              ).length ?? 0;

              return (
                <button
                  key={group.name}
                  data-testid={`group-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setSelectedGroup(isSelected ? null : group.name)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                    isSelected
                      ? "border-primary shadow-fire-glow scale-105"
                      : "border-white/10 hover:border-primary/50 hover:scale-105"
                  }`}>
                    <div className="relative w-full h-full">
                      <img
                        src={group.image}
                        alt={group.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=200";
                        }}
                      />
                      <div className={`absolute inset-0 bg-black/20 ${isSelected ? "bg-primary/20" : ""}`} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`text-[11px] font-medium leading-tight ${isSelected ? "text-primary" : "text-muted-foreground group-hover:text-white"} transition-colors`}>
                      {group.name}
                    </p>
                    {count > 0 && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">{count} items</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display tracking-wider flex items-center gap-2 text-white">
          <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
          {selectedGroup ? selectedGroup.toUpperCase() : "ALL CRACKERS"}
          {selectedGroup && (
            <span className="text-xs text-muted-foreground font-sans font-normal ml-1">
              ({filteredProducts?.length ?? 0} items)
            </span>
          )}
        </h3>
        {selectedGroup && (
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-52 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
          Failed to load products. Please try again later.
        </div>
      ) : filteredProducts?.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl">
          <p className="text-lg text-muted-foreground">
            {searchQuery
              ? `No crackers found for "${searchQuery}"`
              : selectedGroup
              ? `No products in "${selectedGroup}" yet.`
              : "No crackers available right now."}
          </p>
          <div className="flex gap-3 justify-center mt-4">
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-primary text-sm underline">
                Clear search
              </button>
            )}
            {selectedGroup && (
              <button onClick={() => setSelectedGroup(null)} className="text-primary text-sm underline">
                Show all products
              </button>
            )}
          </div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filteredProducts?.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.4) }}
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
                        BUY NOW
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
    </Layout>
  );
}

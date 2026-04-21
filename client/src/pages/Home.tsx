import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { Layout } from "@/components/Layout";
import { Card, Button } from "@/components/ui-custom";
import { ChevronLeft, ChevronRight, ShoppingCart, Heart, Search, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useWishlist } from "@/hooks/use-wishlist";
import { PRODUCT_GROUPS } from "@/lib/product-groups";
import { useGroupImages } from "@/hooks/use-group-images";

const CAROUSEL_SIZE = 8;

export default function Home() {
  const { data: products, isLoading, error } = useProducts();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { getGroupImage } = useGroupImages();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location.includes("search=1")) {
      searchRef.current?.focus();
    }
  }, [location]);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % Math.min(products.length, CAROUSEL_SIZE));
    }, 3000);
    return () => clearInterval(timer);
  }, [products]);

  const handleDragEnd = (_event: any, info: any) => {
    if (!products) return;
    const total = Math.min(products.length, CAROUSEL_SIZE);
    if (info.offset.x < -50) setCurrentIdx((p) => (p + 1) % total);
    else if (info.offset.x > 50) setCurrentIdx((p) => (p - 1 + total) % total);
  };

  const featuredProducts = products?.slice(0, CAROUSEL_SIZE) ?? [];
  const topProduct = featuredProducts[currentIdx];

  const filteredProducts = products?.filter(p =>
    searchQuery.trim()
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      : false
  );

  return (
    <Layout>
      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search crackers by name or category..."
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

      {/* Search Results */}
      {searchQuery && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display tracking-wider flex items-center gap-2 text-white">
              <span className="w-1.5 h-5 bg-primary rounded-full inline-block"></span>
              SEARCH RESULTS
              <span className="text-xs text-muted-foreground font-sans font-normal">
                ({filteredProducts?.length ?? 0} items)
              </span>
            </h3>
            <button onClick={() => setSearchQuery("")} className="text-xs text-primary flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          </div>

          {filteredProducts?.length === 0 ? (
            <div className="p-10 text-center bg-white/5 rounded-2xl">
              <p className="text-muted-foreground">No crackers found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts?.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                >
                  <Card className="h-full flex flex-col group bg-black/40 border border-white/5 hover:border-primary/30 transition-all duration-300">
                    <Link href={`/product/${product.id}`} className="block relative h-32 overflow-hidden bg-white/5 p-3 cursor-pointer rounded-t-xl">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=400&h=400&fit=crop"; }}
                      />
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                        <span className="font-bold text-primary text-[10px]">₹{Number(product.price).toFixed(0)}</span>
                      </div>
                    </Link>
                    <div className="p-2.5 flex flex-col flex-1">
                      <Link href={`/product/${product.id}`}>
                        <h4 className="text-xs font-semibold mb-1 line-clamp-1 hover:text-primary text-center text-white">{product.name}</h4>
                      </Link>
                      <div className="text-center mb-2">
                        <span className="text-sm font-bold text-primary">₹{Number(product.price).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-auto">
                        <Link href={`/product/${product.id}`} className="flex-1">
                          <Button variant="primary" className="w-full h-7 px-2 text-[10px] font-bold uppercase tracking-wider" data-testid={`button-buy-${product.id}`}>
                            BOOK NOW
                          </Button>
                        </Link>
                        <button
                          onClick={() => toggleWishlist(product)}
                          className="w-7 h-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-pink-500/10 transition-colors shrink-0"
                          data-testid={`button-wishlist-${product.id}`}
                        >
                          <Heart className={`w-3 h-3 ${isInWishlist(product.id) ? "text-pink-500 fill-pink-500" : "text-muted-foreground"}`} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Selling Carousel — shown when not searching */}
      {!searchQuery && !isLoading && !error && featuredProducts.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-5 bg-primary rounded-full inline-block"></span>
            <h2 className="text-base font-display tracking-wider text-white uppercase">Top Selling</h2>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl touch-none bg-black/60 border border-white/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={topProduct?.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                className="flex items-stretch cursor-grab active:cursor-grabbing min-h-[160px]"
              >
                {/* Left: Info */}
                <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-black text-[9px] font-bold uppercase tracking-wider mb-2 w-fit">
                    🎆 TOP SELLING
                  </span>
                  <Link href={`/product/${topProduct?.id}`}>
                    <h3 className="text-sm sm:text-base font-display text-white leading-snug mb-1 hover:text-primary transition-colors line-clamp-2">
                      {topProduct?.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{topProduct?.category}</p>
                  <div className="text-primary font-bold text-lg mb-3">₹{Number(topProduct?.price ?? 0).toFixed(0)}</div>
                  <Link href={`/product/${topProduct?.id}`}>
                    <Button className="h-7 px-3 text-[10px] font-bold w-fit">
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      BOOK NOW
                    </Button>
                  </Link>
                </div>

                {/* Right: Full Product Image */}
                <div className="w-40 sm:w-48 shrink-0 relative bg-white/3 flex items-center justify-center p-3">
                  <img
                    src={topProduct?.imageUrl}
                    alt={topProduct?.name}
                    data-testid="carousel-product-image"
                    className="w-full h-full object-contain max-h-[150px] filter drop-shadow-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10 pointer-events-none" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav Arrows */}
            <button
              onClick={() => setCurrentIdx((p) => (p - 1 + featuredProducts.length) % featuredProducts.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white z-10 hover:bg-black/80"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIdx((p) => (p + 1) % featuredProducts.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white z-10 hover:bg-black/80"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {featuredProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`transition-all duration-300 rounded-full ${idx === currentIdx ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/30"}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 16 Product Groups — shown when not searching */}
      {!searchQuery && (
        <section className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 bg-primary rounded-full inline-block"></span>
            <h2 className="text-base font-display tracking-wider text-white uppercase">Product Categories</h2>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {PRODUCT_GROUPS.map((group) => {
              const count = products?.filter(p => p.category === group.category).length ?? 0;
              const imgSrc = getGroupImage(group.name);

              return (
                <button
                  key={group.name}
                  data-testid={`group-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setLocation(`/group/${encodeURIComponent(group.name)}`)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-white/10 group-hover:border-primary/60 group-hover:scale-105 transition-all duration-200 shadow-md">
                    <img
                      src={imgSrc}
                      alt={group.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1514304859873-1025ee74eb3a?auto=format&fit=crop&q=80&w=200";
                      }}
                    />
                  </div>
                  <div className="text-center w-full px-0.5">
                    <p className="text-[10px] font-semibold leading-tight text-muted-foreground group-hover:text-white transition-colors line-clamp-2">
                      {group.name}
                    </p>
                    {count > 0 && (
                      <p className="text-[9px] text-muted-foreground/70 mt-0.5">{count}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </Layout>
  );
}

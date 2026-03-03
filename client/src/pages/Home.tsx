import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { Layout } from "@/components/Layout";
import { Card, Button } from "@/components/ui-custom";
import { Settings, ChevronLeft, ChevronRight, ShoppingCart, Heart, Search, X, Layers } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@shared/schema";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";

export default function Home() {
  const { data: products, isLoading, error } = useProducts();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Auto-scroll logic for top selling products
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % products.length);
    }, 5000); // Scroll every 5 seconds

    return () => clearInterval(timer);
  }, [products]);

  const updateQuantity = (id: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const handleDragEnd = (event: any, info: any) => {
    if (!products) return;
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setCurrentIdx((prev) => (prev + 1) % products.length);
    } else if (info.offset.x > swipeThreshold) {
      setCurrentIdx((prev) => (prev - 1 + products.length) % products.length);
    }
  };

  const topProduct = products?.[currentIdx];

  const activeCategories = products
    ? ["All", ...Array.from(new Set(products.map(p => p.category || "Other"))).sort()]
    : ["All"];

  const filteredProducts = products?.filter(p => {
    const matchesCategory = selectedCategory === "All" || (p.category || "Other") === selectedCategory;
    const matchesSearch = !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="absolute top-4 right-4 z-50">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" data-testid="button-admin-settings">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Top Selling Product Slider */}
      {!isLoading && !error && products && products.length > 0 && (
        <section className="mb-16 relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group touch-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={topProduct?.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 flex flex-col md:flex-row cursor-grab active:cursor-grabbing"
            >
              {/* Image Side */}
              <div className="relative w-full md:w-1/2 h-1/2 md:h-full bg-gradient-to-br from-black/60 to-black/20 overflow-hidden">
                <Link href={`/product/${topProduct?.id}`} className="block w-full h-full cursor-pointer">
                  <img 
                    src={topProduct?.imageUrl} 
                    alt={topProduct?.name}
                    className="w-full h-full object-contain p-8 drop-shadow-[0_0_30px_rgba(255,184,76,0.3)] transition-transform duration-500 hover:scale-105 pointer-events-none"
                  />
                </Link>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:bg-gradient-to-r pointer-events-none" />
              </div>

              {/* Content Side */}
              <div className="w-full md:w-1/2 h-1/2 md:h-full p-8 md:p-12 flex flex-col justify-center bg-black/40 backdrop-blur-sm border-l border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold tracking-widest uppercase">
                    Top Selling
                  </span>
                </div>
                <Link href={`/product/${topProduct?.id}`}>
                  <h2 className="text-3xl md:text-5xl font-display text-white mb-4 leading-tight hover:text-primary transition-colors cursor-pointer">
                    {topProduct?.name}
                  </h2>
                </Link>
                <p className="text-sm md:text-lg text-white/70 mb-8 max-w-md line-clamp-3">
                  {topProduct?.description}
                </p>
                <div className="flex flex-wrap items-center gap-6 mt-auto md:mt-0">
                  <div className="text-2xl md:text-3xl font-display text-primary">
                    ₹{Number(topProduct?.price).toFixed(2)}
                  </div>
                  
                  <Link href={`/product/${topProduct?.id}`}>
                    <Button className="group/btn h-10 md:h-12 px-6 md:px-8 text-base md:text-lg">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      BUY NOW
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
            {products.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIdx ? "w-8 bg-primary" : "bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button 
            onClick={() => setCurrentIdx((prev) => (prev - 1 + products.length) % products.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 z-30"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrentIdx((prev) => (prev + 1) % products.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20 z-30"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </section>
      )}

      {/* Catalog Grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-3xl font-display tracking-wider flex items-center gap-3">
          <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
          OUR CRACKERS
        </h3>
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hidden sm:flex">
            Admin Access
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search crackers by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
          className="w-full h-11 pl-11 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-colors"
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

      {/* Category Filter Tabs */}
      {!isLoading && !error && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {activeCategories.map((cat) => (
            <button
              key={cat}
              data-testid={`button-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-gold-glow"
                  : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat === "All" && <Layers className="w-3.5 h-3.5" />}
              {cat}
              {cat !== "All" && products && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedCategory === cat ? "bg-white/20" : "bg-white/10"}`}>
                  {products.filter(p => (p.category || "Other") === cat).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {searchQuery && (
        <p className="text-sm text-muted-foreground mb-4">
          {filteredProducts?.length === 0
            ? "No products found"
            : `${filteredProducts?.length} result${filteredProducts?.length === 1 ? "" : "s"} for "${searchQuery}"`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-56 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
          Failed to load products. Please try again later.
        </div>
      ) : filteredProducts?.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl">
          <p className="text-xl text-muted-foreground">
            {searchQuery
              ? `No crackers found for "${searchQuery}"${selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}`
              : selectedCategory !== "All"
              ? `No products in "${selectedCategory}" yet.`
              : "No crackers available right now."}
          </p>
          {(searchQuery || selectedCategory !== "All") && (
            <div className="flex gap-3 justify-center mt-4">
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-primary text-sm underline">
                  Clear search
                </button>
              )}
              {selectedCategory !== "All" && (
                <button onClick={() => setSelectedCategory("All")} className="text-primary text-sm underline">
                  Show all products
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {filteredProducts?.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full flex flex-col group bg-black/40 border border-white/5 hover:border-primary/30 transition-all duration-300">
                <Link href={`/product/${product.id}`} className="block relative h-36 sm:h-40 overflow-hidden bg-white/5 p-3 cursor-pointer">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=400&h=400&fit=crop";
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                    <span className="font-bold text-primary text-xs">₹{Number(product.price).toFixed(0)}</span>
                  </div>
                </Link>
                
                <div className="p-3 flex flex-col flex-1">
                  <Link href={`/product/${product.id}`}>
                    <h4 className="text-sm font-display tracking-wide mb-1 line-clamp-1 hover:text-primary transition-colors cursor-pointer text-center">{product.name}</h4>
                  </Link>
                  <div className="text-center mb-3">
                    <span className="text-base font-bold text-primary">₹{Number(product.price).toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-auto">
                    <Link href={`/product/${product.id}`} className="flex-1">
                      <Button 
                        variant="primary" 
                        className="w-full h-8 px-3 text-xs font-bold uppercase tracking-wider"
                      >
                        BUY NOW
                      </Button>
                    </Link>
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center hover:bg-pink-500/10 hover:border-pink-500/30 transition-colors shrink-0"
                      title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`w-3.5 h-3.5 transition-colors ${isInWishlist(product.id) ? "text-pink-500 fill-pink-500" : "text-muted-foreground"}`} />
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

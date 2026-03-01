import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { Layout } from "@/components/Layout";
import { Card, Button } from "@/components/ui-custom";
import { Sparkles, ArrowRight, Settings, ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";

export default function Home() {
  const { data: products, isLoading, error } = useProducts();
  const { addToCart } = useCart();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

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

  return (
    <Layout>
      <div className="absolute top-4 right-4 z-50">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" data-testid="button-admin-settings">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Top Selling Product Auto-Slider */}
      {!isLoading && !error && products && products.length > 0 && (
        <section className="mb-12 relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group touch-none">
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
                  <h2 className="text-4xl md:text-6xl font-display text-white mb-4 leading-tight hover:text-primary transition-colors cursor-pointer">
                    {topProduct?.name}
                  </h2>
                </Link>
                <p className="text-lg text-white/70 mb-8 max-w-md line-clamp-3">
                  {topProduct?.description}
                </p>
                <div className="flex flex-wrap items-center gap-6 mt-auto md:mt-0">
                  <div className="text-3xl font-display text-primary">
                    ₹{Number(topProduct?.price).toFixed(2)}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {quantities[topProduct!.id] === undefined ? (
                      <Button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setQuantities(prev => ({ ...prev, [topProduct!.id]: 1 }));
                        }}
                        className="group/btn"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Add to Cart
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateQuantity(topProduct!.id, -1); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-bold">{quantities[topProduct!.id]}</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateQuantity(topProduct!.id, 1); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <Button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (topProduct) addToCart(topProduct, quantities[topProduct.id]); 
                          }}
                          className="group/btn"
                        >
                          Confirm
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
            {products.map((_, idx) => (
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

      {/* Hero Section */}
      <section className="mb-16 relative rounded-3xl overflow-hidden shadow-gold-glow h-60">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1498622205843-3b0ac17f8ba4?w=1920&h=600&fit=crop" 
          alt="Fireworks Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold tracking-wider mb-2">
            <Sparkles className="w-4 h-4" /> DIWALI SPECIALS
          </span>
          <h2 className="text-3xl md:text-5xl font-display text-white">
            CELEBRATE WITH <span className="text-gradient-fire">FIREWORKS</span>
          </h2>
        </div>
      </section>

      {/* Catalog Grid */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-display tracking-wider flex items-center gap-3">
          <span className="w-2 h-8 bg-primary rounded-full inline-block"></span>
          OUR CRACKERS
        </h3>
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            Admin Access
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
          Failed to load products. Please try again later.
        </div>
      ) : products?.length === 0 ? (
        <div className="p-12 text-center bg-white/5 rounded-2xl">
          <p className="text-xl text-muted-foreground">No crackers available right now.</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {products?.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="h-full flex flex-col group bg-black/40 border border-white/5 hover:border-primary/30 transition-all duration-300">
                <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-white/5 p-4 cursor-pointer">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=400&h=400&fit=crop";
                    }}
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <span className="font-bold text-primary">₹{Number(product.price).toFixed(2)}</span>
                  </div>
                </Link>
                
                <div className="p-4 md:p-6 flex flex-col flex-1">
                  <Link href={`/product/${product.id}`}>
                    <h4 className="text-lg md:text-xl font-display tracking-wide mb-2 line-clamp-1 hover:text-primary transition-colors cursor-pointer">{product.name}</h4>
                  </Link>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between gap-3 mt-auto">
                    {quantities[product.id] === undefined ? (
                      <Button 
                        onClick={() => setQuantities(prev => ({ ...prev, [product.id]: 1 }))}
                        variant="primary" 
                        className="w-full h-9 px-3 text-xs"
                      >
                        ADD
                      </Button>
                    ) : (
                      <>
                        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-1">
                          <button 
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{quantities[product.id]}</span>
                          <button 
                            onClick={() => updateQuantity(product.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <Button 
                          onClick={() => addToCart(product, quantities[product.id])}
                          variant="primary" 
                          className="flex-1 h-9 px-3 text-xs"
                        >
                          CONFIRM
                        </Button>
                      </>
                    )}
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

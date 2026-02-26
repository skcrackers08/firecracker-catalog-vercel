import { Link } from "wouter";
import { motion } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { Layout } from "@/components/Layout";
import { Card, Button } from "@/components/ui-custom";
import { Sparkles, ArrowRight, Settings } from "lucide-react";

export default function Home() {
  const { data: products, isLoading, error } = useProducts();

  return (
    <Layout>
      <div className="absolute top-4 right-4 z-50">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>
      {/* Hero Section */}
      <section className="mb-16 relative rounded-3xl overflow-hidden shadow-gold-glow">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        {/* landing page hero fireworks celebration */}
        <img 
          src="https://images.unsplash.com/photo-1498622205843-3b0ac17f8ba4?w=1920&h=600&fit=crop" 
          alt="Fireworks Hero" 
          className="w-full h-[400px] object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 md:px-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-bold tracking-wider mb-4">
              <Sparkles className="w-4 h-4" /> DIWALI SPECIALS
            </span>
            <h2 className="text-5xl md:text-7xl font-display text-white mb-4 leading-tight">
              LIGHT UP YOUR <br/>
              <span className="text-gradient-fire">CELEBRATION</span>
            </h2>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
              Explore our premium collection of spectacular fireworks. Safe, vibrant, and guaranteed to make your night unforgettable.
            </p>
          </motion.div>
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
              <Card className="h-full flex flex-col group hover:-translate-y-1 bg-black/40">
                <div className="relative aspect-square overflow-hidden bg-white/5 p-4">
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
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h4 className="text-xl font-display tracking-wide mb-2 line-clamp-1">{product.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">
                    {product.description}
                  </p>
                  
                  <Link href={`/product/${product.id}`} className="w-full mt-auto block">
                    <Button variant="outline" className="w-full group/btn">
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </Layout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Product } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui-custom";
import { ArrowLeft, ShoppingCart, Video, Sparkles, ShieldCheck, Truck, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

export default function ProductDetails() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id;
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(0);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [buildUrl(api.products.get.path, { id: id! })],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h2 className="text-3xl font-display mb-4 text-red-400">Product Not Found</h2>
          <p className="text-muted-foreground mb-8">The cracker you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button variant="outline">Back to Catalog</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Product Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square rounded-3xl bg-white/5 p-8 flex items-center justify-center overflow-hidden border border-white/10 shadow-fire-glow"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain filter drop-shadow-2xl relative z-10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=800&h=800&fit=crop";
              }}
            />
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold tracking-widest mb-4">
                <Sparkles className="w-3 h-3" /> PREMIUM QUALITY
              </span>
              <h2 className="text-4xl md:text-5xl font-display mb-4 leading-tight">{product.name}</h2>
              <div className="text-3xl font-bold text-primary mb-6">₹{Number(product.price).toFixed(2)}</div>
            </div>

            <div className="space-y-6 mb-8">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {product.description}
              </p>
              
              {product.videoUrl && (
                <div className="mt-8">
                  <h3 className="text-xl font-display mb-4 flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    SEE IT IN ACTION
                  </h3>
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                    <video
                      src={product.videoUrl}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              {quantity === 0 ? (
                <Button 
                  onClick={() => setQuantity(1)}
                  className="w-full h-16 text-xl font-bold rounded-2xl shadow-gold-glow group"
                >
                  <Plus className="w-6 h-6 mr-3 transition-transform group-hover:scale-110" />
                  ADD
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl w-fit">
                    <button 
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-xl font-bold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Button 
                    onClick={() => addToCart(product, quantity)}
                    className="w-full h-16 text-xl font-bold rounded-2xl shadow-gold-glow group"
                  >
                    <ShoppingCart className="w-6 h-6 mr-3 transition-transform group-hover:scale-110" />
                    CONFIRM
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}

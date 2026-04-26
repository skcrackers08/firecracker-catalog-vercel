import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Product } from "@shared/schema";
import { api, buildUrl } from "@shared/routes";
import { Layout } from "@/components/Layout";
import { OfferBanner } from "@/components/OfferBanner";
import { Button } from "@/components/ui-custom";
import { ArrowLeft, ShoppingCart, Video, Sparkles, Plus, Minus, Heart, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetails() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
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
      <OfferBanner context="product" />
      <div className="max-w-2xl mx-auto w-full">
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          data-testid="button-back"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-5 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        {/* Category + Subgroup Badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold tracking-widest">
            <Sparkles className="w-3 h-3" /> {product.category}
          </span>
          {product.subgroup && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-xs font-medium">
              <Tag className="w-3 h-3" /> {product.subgroup}
            </span>
          )}
        </div>

        {/* Product Name */}
        <h1 className="text-2xl sm:text-3xl font-display leading-tight mb-1 text-white">{product.name}</h1>
        <div className="text-2xl font-bold text-primary mb-5">₹{Number(product.price).toFixed(2)}</div>

        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full aspect-square rounded-3xl bg-white/5 p-6 flex items-center justify-center overflow-hidden border border-white/10 shadow-fire-glow mb-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <img
            src={product.imageUrl}
            alt={product.name}
            data-testid="img-product"
            className="w-full h-full object-contain filter drop-shadow-2xl relative z-10"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=800&h=800&fit=crop";
            }}
          />
        </motion.div>

        {/* Video Section — directly below image */}
        {product.videoUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-5"
          >
            <h3 className="text-sm font-display mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Video className="w-4 h-4 text-primary" />
              See it in action
            </h3>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/60">
              <video
                src={product.videoUrl}
                data-testid="video-product"
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
            </div>
          </motion.div>
        )}

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-4"
        >
          <button
            onClick={() => toggleWishlist(product)}
            data-testid="button-wishlist"
            className={`flex items-center gap-2 text-sm font-medium transition-colors w-fit ${isInWishlist(product.id) ? "text-pink-400" : "text-muted-foreground hover:text-pink-400"}`}
          >
            <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? "fill-pink-400" : ""}`} />
            {isInWishlist(product.id) ? "Saved to Favorites" : "Add to Favorites"}
          </button>

          {quantity === 0 ? (
            <Button
              onClick={() => setQuantity(1)}
              data-testid="button-add"
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-gold-glow group"
            >
              <Plus className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
              ADD TO ENQUIRY
            </Button>
          ) : (
            <>
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-2xl w-fit">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  data-testid="button-decrease"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-xl font-bold" data-testid="text-quantity">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => prev + 1)}
                  data-testid="button-increase"
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                onClick={() => {
                  addToCart(product, quantity);
                  toast({ title: "Added to enquiry", description: `${product.name} × ${quantity}` });
                  setQuantity(0);
                }}
                data-testid="button-confirm-cart"
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-gold-glow group"
              >
                <ShoppingCart className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                CONFIRM ENQUIRY
              </Button>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}

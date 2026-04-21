import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, Share2, Copy, Check, ShoppingCart, ArrowLeft, Sparkles } from "lucide-react";
import { useWishlist } from "@/hooks/use-wishlist";
import { useProducts } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { Layout } from "@/components/Layout";
import { Button, Card } from "@/components/ui-custom";
import { Product } from "@shared/schema";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToWishlist, getShareUrl } = useWishlist();
  const { data: allProducts } = useProducts();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const sharedIds = urlParams.get("ids")?.split(",").map(Number).filter(Boolean) ?? [];
  const isSharedView = sharedIds.length > 0;

  const sharedProducts: Product[] = isSharedView
    ? (allProducts ?? []).filter(p => sharedIds.includes(p.id))
    : [];

  const displayItems = isSharedView ? sharedProducts : wishlist;

  const copyShareLink = () => {
    if (wishlist.length === 0) {
      toast({ title: "Wishlist is empty", description: "Add products to your wishlist first.", variant: "destructive" });
      return;
    }
    const url = getShareUrl();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast({ title: "Link copied!", description: "Share this link with friends and family." });
      setTimeout(() => setCopied(false), 2500);
    });
  };

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

          {!isSharedView && wishlist.length > 0 && (
            <Button onClick={copyShareLink} variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 gap-2">
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share Wishlist"}
            </Button>
          )}
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

                  <div className="flex-1">
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-bold text-white text-lg mb-1 hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    </Link>
                    <p className="text-2xl font-bold text-primary">₹{Number(product.price).toFixed(2)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => addToCart(product, 1)}
                    >
                      <ShoppingCart className="w-4 h-4" /> Add to Enquiry
                    </Button>

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
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!isSharedView && wishlist.length > 0 && (
          <div className="mt-10 p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
            <p className="text-muted-foreground mb-3">Share your wishlist with friends and family</p>
            <Button onClick={copyShareLink} className="gap-2 mx-auto">
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Link Copied!" : "Copy Share Link"}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

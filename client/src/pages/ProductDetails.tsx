import { useParams, Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, PlayCircle, ShoppingCart } from "lucide-react";
import { useProduct } from "@/hooks/use-products";
import { Layout } from "@/components/Layout";
import { Button, Card } from "@/components/ui-custom";

export default function ProductDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const productId = parseInt(id || "0");
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse flex flex-col md:flex-row gap-12">
          <div className="flex-1 h-[500px] bg-white/5 rounded-3xl" />
          <div className="flex-1 space-y-6 py-8">
            <div className="h-10 bg-white/5 rounded w-3/4" />
            <div className="h-6 bg-white/5 rounded w-1/4" />
            <div className="h-32 bg-white/5 rounded w-full" />
            <div className="h-14 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="p-12 text-center bg-red-500/10 rounded-3xl border border-red-500/20">
          <h2 className="text-2xl font-display text-red-400 mb-4">Product Not Found</h2>
          <Link href="/">
            <Button variant="outline">Return to Catalog</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasVideo = !!product.videoUrl && product.videoUrl.length > 5;

  return (
    <Layout>
      <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
      </Link>

      <motion.div 
        className="flex flex-col lg:flex-row gap-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Media Section */}
        <div className="flex-1 space-y-6">
          <Card className="aspect-square lg:aspect-[4/3] flex items-center justify-center p-8 bg-black/40 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-contain filter drop-shadow-2xl z-10 relative"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=800&h=800&fit=crop";
              }}
            />
          </Card>

          {hasVideo && (
            <Card className="aspect-video bg-black/60 overflow-hidden relative">
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold tracking-wider">PREVIEW</span>
              </div>
              <iframe
                src={product.videoUrl}
                title={`${product.name} video`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </Card>
          )}
        </div>

        {/* Details Section */}
        <div className="flex-1 flex flex-col py-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-wider text-muted-foreground flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1 text-green-400" /> In Stock
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display text-white mb-4 leading-none">
            {product.name}
          </h1>
          
          <div className="text-3xl font-bold text-primary mb-8 flex items-end gap-2">
            ₹{Number(product.price).toFixed(2)}
            <span className="text-sm text-muted-foreground font-normal mb-1">excl. GST</span>
          </div>
          
          <div className="prose prose-invert max-w-none mb-10">
            <p className="text-lg leading-relaxed text-white/80">
              {product.description}
            </p>
          </div>
          
          <div className="mt-auto space-y-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-semibold text-white">Premium Crackers</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">GST Applicable</span>
              <span className="font-semibold text-white">18%</span>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <Button 
                size="lg" 
                className="w-full text-xl h-16 group/btn"
                onClick={() => setLocation(`/checkout/${product.id}`)}
              >
                <ShoppingCart className="w-6 h-6 mr-3 transition-transform group-hover/btn:-rotate-12" />
                BUY NOW
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
}

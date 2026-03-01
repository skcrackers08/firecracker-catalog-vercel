import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, ShoppingBag, X, ShoppingCart, ArrowRight } from "lucide-react";
import logoPng from "@assets/pngtree-logo-template-for-esports-vector-illustration-of-a-lio_1772309271956.png";
import { useCart } from "@/hooks/use-cart";
import { Button, Card, cn } from "@/components/ui-custom";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { items, totalItems, totalAmount, removeFromCart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 shadow-fire-glow group-hover:scale-110 transition-transform duration-300">
              <img src={logoPng} alt="S K Crackers Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display text-gradient-gold drop-shadow-sm tracking-widest mt-1">
              S K CRACKERS
            </h1>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              ADMIN
            </Link>
            <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              CATALOG
            </Link>
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                  {totalItems}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {children}
      </main>

      {/* Cart Popup */}
      <AnimatePresence>
        {(isCartOpen || totalItems > 0) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[60] w-[350px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="p-4 shadow-2xl bg-black/90 backdrop-blur-xl border-primary/20">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <h3 className="font-display text-lg flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  YOUR CART ({totalItems})
                </h3>
                <button onClick={() => setIsCartOpen(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                {items.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground text-sm italic">Your cart is empty</p>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl group">
                      <div className="w-12 h-12 bg-black/40 rounded-lg p-1 shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground">{item.quantity} x ₹{Number(item.price).toFixed(2)}</p>
                      </div>
                      <div className="text-xs font-bold text-primary">₹{(Number(item.price) * item.quantity).toFixed(2)}</div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-t border-white/10 pt-3">
                    <span className="text-sm font-bold text-muted-foreground">TOTAL AMOUNT</span>
                    <span className="text-xl font-display text-primary">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <Button 
                    className="w-full h-12 text-sm font-bold"
                    onClick={() => {
                      setIsCartOpen(false);
                      setLocation('/checkout');
                    }}
                  >
                    PROCEED TO CHECKOUT
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 mt-auto bg-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoPng} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-white/10" />
            <span className="font-display text-xl tracking-wider text-muted-foreground">S K CRACKERS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Top S K Crackers. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

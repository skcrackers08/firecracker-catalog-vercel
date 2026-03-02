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
  const [location, setLocation] = useLocation();

  const isCheckoutPage = location === "/checkout";

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
            {!isCheckoutPage && (
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
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {children}
      </main>

      {/* Cart Popup Icon (Visible when items are added) */}
      <AnimatePresence>
        {totalItems > 0 && !isCartOpen && !isCheckoutPage && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-[60]"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-16 h-16 bg-primary text-white rounded-full shadow-fire-glow flex items-center justify-center relative hover:scale-110 transition-transform border-2 border-white/20"
            >
              <ShoppingCart className="w-8 h-8" />
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-primary text-xs font-bold flex items-center justify-center rounded-full border-2 border-primary">
                {totalItems}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer/Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-end p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="relative w-full max-w-md pointer-events-auto"
            >
              <Card className="p-6 shadow-2xl bg-black/90 backdrop-blur-xl border-primary/20 flex flex-col h-[80vh] max-h-[600px]">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <h3 className="font-display text-2xl flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                    YOUR CART
                  </h3>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 text-muted-foreground hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground italic">Your cart is empty</p>
                    </div>
                  ) : (
                    items.map(item => (
                      <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl group border border-white/5 hover:border-white/10 transition-colors">
                        <div className="w-16 h-16 bg-black/40 rounded-xl p-2 shrink-0">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold truncate text-white">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.quantity} x ₹{Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="text-sm font-bold text-primary">₹{(Number(item.price) * item.quantity).toFixed(2)}</div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {items.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Amount</span>
                      <span className="text-3xl font-display text-primary">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <Button 
                      className="w-full h-14 text-lg font-bold shadow-fire-glow"
                      onClick={() => {
                        setIsCartOpen(false);
                        setLocation('/checkout');
                      }}
                    >
                      PROCEED TO CHECKOUT
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
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

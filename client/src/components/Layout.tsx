import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, X, ShoppingCart, ArrowRight, Heart, User, Home, Search, Package, Bell, Menu, Settings } from "lucide-react";
import logoPng from "@assets/pngtree-logo-template-for-esports-vector-illustration-of-a-lio_1772309271956.png";
import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button, Card, cn } from "@/components/ui-custom";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { items, totalItems, totalAmount, removeFromCart } = useCart();
  const { wishlist } = useWishlist();
  const { customer } = useCustomerAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const isCheckoutPage = location === "/checkout";

  const bottomNavItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Search", icon: Search, href: "/?search=1" },
    { label: "Cart", icon: ShoppingCart, href: null, action: () => setIsCartOpen(true) },
    { label: "Orders", icon: Package, href: customer ? "/account" : "/login" },
    { label: "Profile", icon: User, href: customer ? "/account" : "/login" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors md:hidden" data-testid="button-menu">
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-primary/40 shadow-fire-glow group-hover:scale-110 transition-transform duration-300">
                <img src={logoPng} alt="S K Crackers Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display text-gradient-gold drop-shadow-sm tracking-widest">
                S K CRACKERS
              </h1>
            </Link>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              data-testid="link-admin"
              title="Admin Panel"
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <Link
              href={customer ? "/account" : "/login"}
              data-testid="link-account"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors mr-1"
            >
              <User className="w-4 h-4" />
              {customer ? customer.username : "LOGIN"}
            </Link>
            <Link href="/wishlist" className="relative p-2 text-muted-foreground hover:text-pink-400 transition-colors">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-background">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            {!isCheckoutPage && (
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
                data-testid="button-cart-open"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-black text-[9px] font-bold flex items-center justify-center rounded-full border border-background">
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isCheckoutPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-white/10 safe-area-bottom">
          <div className="max-w-7xl mx-auto flex items-center justify-around h-16">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href && (item.href === "/" ? location === "/" : location.startsWith(item.href.split("?")[0]));
              const isCart = item.label === "Cart";

              if (item.action) {
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className="flex flex-col items-center gap-1 px-3 py-2 relative"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                      isCart && totalItems > 0
                        ? "bg-primary text-black shadow-fire-glow scale-110"
                        : "text-muted-foreground hover:text-primary"
                    )}>
                      <Icon className="w-5 h-5" />
                      {isCart && totalItems > 0 && (
                        <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                          {totalItems}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium",
                      isCart && totalItems > 0 ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className="flex flex-col items-center gap-1 px-3 py-2 relative"
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isActive
                      ? "bg-primary text-black shadow-fire-glow"
                      : "text-muted-foreground hover:text-primary"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

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
                          <img src={item.imageUrl ?? ""} alt={item.name} className="w-full h-full object-contain" />
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
    </div>
  );
}

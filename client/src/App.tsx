import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";

import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import ProductDetails from "@/pages/ProductDetails";
import Checkout from "@/pages/Checkout";
import Bill from "@/pages/Bill";
import Wishlist from "@/pages/Wishlist";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={Admin} />
      <Route path="/product/:id" component={ProductDetails} />
      <Route path="/checkout/:id" component={Checkout} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/bill/:id" component={Bill} />
      <Route path="/wishlist" component={Wishlist} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </WishlistProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/hooks/use-cart";
import { WishlistProvider } from "@/hooks/use-wishlist";
import { CustomerAuthProvider } from "@/hooks/use-customer-auth";

import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import AdminPro from "@/pages/AdminPro";
import AdminProInvoice from "@/pages/AdminProInvoice";
import AdminProTransportBill from "@/pages/AdminProTransportBill";
import ProductDetails from "@/pages/ProductDetails";
import ProductGroups from "@/pages/ProductGroups";
import GroupProducts from "@/pages/GroupProducts";
import Checkout from "@/pages/Checkout";
import Bill from "@/pages/Bill";
import Wishlist from "@/pages/Wishlist";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerAccount from "@/pages/CustomerAccount";
import PartnerPage from "@/pages/PartnerPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/groups" component={ProductGroups} />
      <Route path="/group/:name" component={GroupProducts} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin-pro/invoice/:id" component={AdminProInvoice} />
      <Route path="/admin-pro/transport-bill/:id" component={AdminProTransportBill} />
      <Route path="/admin-pro" component={AdminPro} />
      <Route path="/product/:id" component={ProductDetails} />
      <Route path="/checkout/:id" component={Checkout} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/bill/:id" component={Bill} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/login" component={CustomerLogin} />
      <Route path="/account" component={CustomerAccount} />
      <Route path="/partner" component={PartnerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomerAuthProvider>
        <CartProvider>
          <WishlistProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WishlistProvider>
        </CartProvider>
      </CustomerAuthProvider>
    </QueryClientProvider>
  );
}

export default App;

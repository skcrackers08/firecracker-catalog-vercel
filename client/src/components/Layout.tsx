import { ReactNode } from "react";
import { Link } from "wouter";
import { Sparkles, ShoppingBag } from "lucide-react";
import logoPng from "@assets/pngtree-logo-template-for-esports-vector-illustration-of-a-lio_1772309271956.png";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {children}
      </main>

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

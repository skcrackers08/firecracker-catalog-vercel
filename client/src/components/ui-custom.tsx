// Reusable beautifully styled custom components for the festive theme
import React from "react";
import { Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-bold transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-xl";
    
    const variants = {
      primary: "bg-gradient-fire text-white shadow-fire-glow hover:shadow-[0_0_30px_-5px_rgba(255,75,31,0.8)] hover:-translate-y-0.5 active:translate-y-0 border border-white/10",
      secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-lg hover:-translate-y-0.5",
      outline: "border-2 border-primary text-primary hover:bg-primary/10 shadow-[0_0_10px_-5px_hsl(var(--primary))] hover:-translate-y-0.5",
      ghost: "text-muted-foreground hover:text-foreground hover:bg-white/5",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
      icon: "p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      "bg-card border border-white/5 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:border-primary/30",
      className
    )}>
      {children}
    </div>
  );
}

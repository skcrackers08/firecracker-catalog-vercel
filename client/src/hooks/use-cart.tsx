
  import React, { createContext, useContext, useState, useEffect } from 'react';
  import { Product } from '@shared/schema';

  export interface CartItem extends Product {
    quantity: number;
  }

  interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
  }

  const CartContext = createContext<CartContextType | undefined>(undefined);

  export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addToCart = (product: Product, quantity: number) => {
      setItems(prev => {
        const existing = prev.find(item => item.id === product.id);
        if (existing) {
          return prev.map(item => 
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, { ...product, quantity }];
      });
    };

    const removeFromCart = (productId: number) => {
      setItems(prev => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    return (
      <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalItems, totalAmount }}>
        {children}
      </CartContext.Provider>
    );
  }

  export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
  }
  
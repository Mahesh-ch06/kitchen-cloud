import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Cart, CartItem, MenuItem } from '@/types';

interface CartContextType {
  cart: Cart | null;
  addToCart: (item: MenuItem, vendorId: string) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);

  const addToCart = (item: MenuItem, vendorId: string) => {
    setCart(prev => {
      if (!prev || prev.vendorId !== vendorId) {
        // Start new cart for different vendor
        return {
          vendorId,
          items: [{
            menuItemId: item.id,
            name: item.name,
            quantity: 1,
            price: item.price,
            menuItem: item,
          }],
          total: item.price,
        };
      }

      const existingItem = prev.items.find(i => i.menuItemId === item.id);
      if (existingItem) {
        const updatedItems = prev.items.map(i =>
          i.menuItemId === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
        return {
          ...prev,
          items: updatedItems,
          total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        };
      }

      const newItems = [...prev.items, {
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        menuItem: item,
      }];
      return {
        ...prev,
        items: newItems,
        total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => {
      if (!prev) return null;
      const newItems = prev.items.filter(i => i.menuItemId !== menuItemId);
      if (newItems.length === 0) return null;
      return {
        ...prev,
        items: newItems,
        total: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    setCart(prev => {
      if (!prev) return null;
      const updatedItems = prev.items.map(i =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      );
      return {
        ...prev,
        items: updatedItems,
        total: updatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
      };
    });
  };

  const clearCart = () => setCart(null);

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { CartItem, SessionUser } from "@/lib/types";

type StoreContextValue = {
  cart: CartItem[];
  wishlist: string[];
  user: SessionUser | null;
  isHydrated: boolean;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  setUserSession: (user: SessionUser | null) => void;
  logout: () => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function readStorage<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : fallback;
}

function getScopedKey(prefix: string, userId?: string | null) {
  return `${prefix}-${userId ?? "guest"}`;
}

function mergeCartItems(items: CartItem[]) {
  return items.reduce<CartItem[]>((result, item) => {
    const existing = result.find((entry) => entry.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
      return result;
    }

    result.push({ ...item });
    return result;
  }, []);
}

export function Providers({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: SessionUser | null;
}) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setCart(readStorage<CartItem[]>(getScopedKey("gearhub-cart", initialUser?.id), []));
    setWishlist(readStorage<string[]>(getScopedKey("gearhub-wishlist", initialUser?.id), []));
    setIsHydrated(true);
  }, [initialUser?.id]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(getScopedKey("gearhub-cart", user?.id), JSON.stringify(cart));
  }, [cart, isHydrated, user?.id]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(getScopedKey("gearhub-wishlist", user?.id), JSON.stringify(wishlist));
  }, [wishlist, isHydrated, user?.id]);

  function setUserSession(nextUser: SessionUser | null) {
    if (typeof window === "undefined") {
      setUser(nextUser);
      return;
    }

    const nextCart = readStorage<CartItem[]>(getScopedKey("gearhub-cart", nextUser?.id), []);
    const nextWishlist = readStorage<string[]>(getScopedKey("gearhub-wishlist", nextUser?.id), []);

    setCart((current) => mergeCartItems([...nextCart, ...current]));
    setWishlist((current) => Array.from(new Set([...nextWishlist, ...current])));
    setUser(nextUser);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCart(readStorage<CartItem[]>(getScopedKey("gearhub-cart"), []));
    setWishlist(readStorage<string[]>(getScopedKey("gearhub-wishlist"), []));
  }

  const value: StoreContextValue = {
    cart,
    wishlist,
    user,
    isHydrated,
    addToCart: (item) => {
      setCart((current) => {
        const existing = current.find((entry) => entry.id === item.id);
        if (existing) {
          return current.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
          );
        }

        return [...current, { ...item, quantity: 1 }];
      });
    },
    updateQuantity: (id, quantity) => {
      setCart((current) =>
        current
          .map((item) => (item.id === id ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    removeFromCart: (id) => {
      setCart((current) => current.filter((item) => item.id !== id));
    },
    clearCart: () => {
      setCart([]);
    },
    toggleWishlist: (productId) => {
      setWishlist((current) =>
        current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId],
      );
    },
    setUserSession,
    logout,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside Providers");
  }
  return context;
}

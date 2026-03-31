"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Heart, LogOut, Search, ShoppingCart, UserCircle2 } from "lucide-react";
import { useStore } from "@/components/providers";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Trang chủ" },
  { href: "/products", label: "Sản phẩm" },
  { href: "/blog", label: "Tin tức" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, wishlist, user, logout } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="site-header">
      <div className="container topbar">
        <Link href="/" className="brand">
          <span className="brand-mark">GH</span>
          <span>
            <strong>Đông Quân GearHub</strong>
            <small>Máy tính - Laptop - Điện thoại</small>
          </span>
        </Link>

        <form action="/products" className="searchbar">
          <Search size={18} />
          <input
            type="text"
            name="q"
            placeholder="Tìm laptop, PC, điện thoại..."
          />
          <button type="submit">Tìm kiếm</button>
        </form>

        <nav className="icon-nav">
          <Link href="/cart" className="icon-link">
            <ShoppingCart size={18} />
            <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </Link>
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setMenuOpen((value) => !value)}
              >
                <UserCircle2 size={18} />
                <span>{user.name}</span>
                <ChevronDown size={16} />
              </button>
              {menuOpen ? (
                <div className="user-menu-panel">
                  <Link href="/account" className="user-menu-link" onClick={() => setMenuOpen(false)}>
                    <UserCircle2 size={16} />
                    Thông tin cá nhân
                  </Link>
                  <Link href="/wishlist" className="user-menu-link" onClick={() => setMenuOpen(false)}>
                    <Heart size={16} />
                    Yêu thích
                    <strong>{wishlist.length}</strong>
                  </Link>
                  <Link href="/orders" className="user-menu-link" onClick={() => setMenuOpen(false)}>
                    <ShoppingCart size={16} />
                    Lịch sử mua hàng
                  </Link>
                  <button type="button" className="user-menu-link user-menu-button" onClick={handleLogout}>
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="auth-nav auth-nav-top">
              <Link href="/auth/login" className="secondary-button">
                Đăng nhập
              </Link>
              <Link href="/auth/register" className="primary-button">
                Đăng ký
              </Link>
            </div>
          )}
        </nav>
      </div>

      <div className="container navbar">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn("nav-link", pathname === link.href && "nav-link-active")}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

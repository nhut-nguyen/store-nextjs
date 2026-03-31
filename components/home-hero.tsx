"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    id: "macbook",
    eyebrow: "Ưu đãi Apple chính hãng",
    title: "MacBook Neo\nMượt tuyệt đối",
    subtitle: "Quà tặng độc quyền 790K • Trả góp 0% • Ưu đãi sinh viên 200K",
    cta: "Đăng ký ngay",
    href: "/products?brand=Apple",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80",
    accent: "lime",
  },
  {
    id: "gaming",
    eyebrow: "Tuần lễ gaming gear",
    title: "Laptop RTX mới\nGiảm sâu bất ngờ",
    subtitle: "Combo balo, chuột gaming và miễn phí vệ sinh máy trong 12 tháng",
    cta: "Săn deal gaming",
    href: "/products?category=cat-laptop",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1400&q=80",
    accent: "blue",
  },
  {
    id: "phone",
    eyebrow: "Flagship month",
    title: "Điện thoại cao cấp\nThu cũ đổi mới",
    subtitle: "Giảm thêm đến 2 triệu và trợ giá bộ quà lên tới 1.1 triệu đồng",
    cta: "Xem điện thoại",
    href: "/products?category=cat-phone",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
    accent: "orange",
  },
];

const promoTiles = [
  {
    title: "Build PC",
    value: "Giảm tới 2 triệu",
    href: "/products?promo=build-pc",
    image: "https://picsum.photos/seed/gearhub-promo-pc/700/520",
  },
  {
    title: "Bộ quà laptop",
    value: "Ưu đãi tới 2 triệu",
    href: "/products?promo=laptop-bundle",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "Màn hình",
    value: "Mua là có quà",
    href: "/products?promo=monitor-deal",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80",
  },
  {
    title: "iPhone & Air",
    value: "Quà tặng đến 1.1 triệu",
    href: "/products?promo=apple-bundle",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=700&q=80",
  },
];

const sidePromos = [
  { title: "Khuyến mãi tháng này", value: "Giảm đến 50%", href: "/products?promo=month-sale" },
  { title: "Nhận ngay", value: "Bộ quà 100K", href: "/products?promo=gift-100k" },
];

export function HomeHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <section className="home-hero">
      <div className="container home-hero-shell">
        <div className="hero-carousel card">
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
            aria-label="slide trước"
            onClick={() => setActiveIndex((activeIndex - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft size={22} />
          </button>

          <div className={`carousel-slide carousel-${activeSlide.accent}`}>
            <div className="carousel-copy">
              <p className="carousel-eyebrow">{activeSlide.eyebrow}</p>
              <h1>
                {activeSlide.title.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h1>
              <p>{activeSlide.subtitle}</p>
              <div className="carousel-metrics">
                <span>Quà tặng 790K</span>
                <span>Trả góp 0%</span>
                <span>Hỗ trợ 24/7</span>
              </div>
              <Link href={activeSlide.href} className="carousel-cta">
                {activeSlide.cta}
              </Link>
            </div>

            <div className="carousel-visual">
              <div className="carousel-device">
                <Image
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            aria-label="slide sau"
            onClick={() => setActiveIndex((activeIndex + 1) % slides.length)}
          >
            <ChevronRight size={22} />
          </button>

          <div className="carousel-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={slide.title}
                className={index === activeIndex ? "carousel-dot carousel-dot-active" : "carousel-dot"}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="hero-side-promos">
          {sidePromos.map((promo) => (
            <Link key={promo.title} href={promo.href} className="hero-side-card">
              <strong>{promo.title}</strong>
              <span>{promo.value}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="container hero-bottom-grid">
        {promoTiles.map((tile) => (
          <Link key={tile.title} href={tile.href} className="hero-mini-card">
            <div>
              <small>{tile.title}</small>
              <strong>{tile.value}</strong>
            </div>
            <div className="hero-mini-image">
              <Image src={tile.image} alt={tile.title} fill sizes="(max-width: 768px) 100vw, 25vw" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

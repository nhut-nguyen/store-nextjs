"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductGallery({
  name,
  image,
  gallery,
}: {
  name: string;
  image: string;
  gallery: string[];
}) {
  const images = Array.from(new Set([image, ...gallery]));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, isLightboxOpen]);

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <>
      <div className="gallery-column">
        <div className="detail-main-image detail-gallery-stage">
          <Image src={images[activeIndex]} alt={`${name} ${activeIndex + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" />
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="detail-gallery-arrow detail-gallery-arrow-left"
                onClick={showPrevious}
                aria-label="Xem ảnh trước"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="detail-gallery-arrow detail-gallery-arrow-right"
                onClick={showNext}
                aria-label="Xem ảnh tiếp theo"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="detail-gallery-expand"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Phóng to ảnh sản phẩm"
          >
            <Expand size={18} />
            Xem lớn
          </button>
        </div>

        <div className="thumb-row detail-thumb-row">
          {images.map((entry, index) => (
            <button
              key={`${entry}-${index}`}
              type="button"
              className={cn("thumb-box detail-thumb-button", index === activeIndex && "detail-thumb-button-active")}
              onClick={() => setActiveIndex(index)}
              aria-label={`Chọn ảnh ${index + 1}`}
            >
              <Image src={entry} alt={`${name} ${index + 1}`} fill sizes="120px" />
            </button>
          ))}
        </div>
      </div>

      {isLightboxOpen ? (
        <div className="product-lightbox" onClick={() => setIsLightboxOpen(false)} role="presentation">
          <div className="product-lightbox-shell" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Hình ảnh ${name}`}>
            <button
              type="button"
              className="product-lightbox-close"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Đóng ảnh lớn"
            >
              <X size={20} />
            </button>
            <div className="product-lightbox-stage">
              <Image src={images[activeIndex]} alt={`${name} ${activeIndex + 1}`} fill sizes="90vw" />
            </div>
            {images.length > 1 ? (
              <div className="product-lightbox-actions">
                <button type="button" className="secondary-button" onClick={showPrevious}>
                  <ChevronLeft size={16} />
                  Ảnh trước
                </button>
                <span>
                  {activeIndex + 1}/{images.length}
                </span>
                <button type="button" className="secondary-button" onClick={showNext}>
                  Ảnh sau
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

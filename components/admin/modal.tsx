"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function AdminModal({
  open,
  onClose,
  eyebrow,
  title,
  size = "default",
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  size?: "default" | "wide";
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`admin-modal-shell ${size === "wide" ? "admin-modal-shell-wide" : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="admin-modal-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="admin-icon-button icon-only"
            onClick={onClose}
            aria-label="Đóng form"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

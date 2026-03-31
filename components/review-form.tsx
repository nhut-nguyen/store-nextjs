"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/components/providers";

export function ReviewForm({
  productId,
  hasReviewed,
  reviewStatus,
}: {
  productId: string;
  hasReviewed: boolean;
  reviewStatus?: "pending" | "approved";
}) {
  const router = useRouter();
  const { user } = useStore();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          comment: formData.get("comment"),
        }),
      });

      const result = await response.json();
      setMessage(result.message);

      if (response.ok) {
        form.reset();
        setRating(5);
        setHoverRating(null);
        router.refresh();
      }
    } catch {
      setMessage("Không thể gửi đánh giá lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="review-cta">
        <p className="helper-text">Đăng nhập để chia sẻ trải nghiệm thực tế của bạn về sản phẩm này.</p>
        <Link href="/auth/login" className="secondary-button">
          Đăng nhập để đánh giá
        </Link>
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="review-cta">
        <p className="helper-text">
          {reviewStatus === "pending"
            ? "Đánh giá của bạn đang chờ quản trị viên duyệt trước khi hiển thị công khai."
            : "Bạn đã gửi đánh giá cho sản phẩm này. Cảm ơn bạn đã chia sẻ trải nghiệm."}
        </p>
      </div>
    );
  }

  const displayRating = hoverRating ?? rating;

  return (
    <form className="form-card review-form" onSubmit={handleSubmit}>
      <h3>Viết đánh giá của bạn</h3>
      <label>
        Số sao
        <input type="hidden" name="rating" value={rating} />
        <div
          className="review-star-picker"
          role="radiogroup"
          aria-label="Chọn số sao"
          onMouseLeave={() => setHoverRating(null)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} sao`}
              className={cn("review-star-button", value <= displayRating && "review-star-button-active")}
              onMouseEnter={() => setHoverRating(value)}
              onFocus={() => setHoverRating(value)}
              onBlur={() => setHoverRating(null)}
              onClick={() => {
                setRating(value);
                setHoverRating(null);
              }}
            >
              <Star size={22} fill="currentColor" />
            </button>
          ))}
        </div>
        <small className="helper-text">
          {displayRating === 5
            ? "5 sao - Rất hài lòng"
            : displayRating === 4
              ? "4 sao - Tốt"
              : displayRating === 3
                ? "3 sao - Ổn"
                : displayRating === 2
                  ? "2 sao - Chưa tốt"
                  : "1 sao - Không hài lòng"}
        </small>
      </label>
      <label>
        Nhận xét
        <textarea
          name="comment"
          rows={4}
          placeholder="Chia sẻ trải nghiệm dùng thực tế, điểm bạn thích và điều còn chưa hài lòng..."
          required
        />
      </label>
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
      </button>
      {message ? <p className="helper-text">{message}</p> : null}
    </form>
  );
}

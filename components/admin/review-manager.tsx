"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCheck, Star, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type AdminReview = {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string | null;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  status?: "pending" | "approved";
};

export function ReviewManager() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReviews() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/reviews", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message ?? "Không thể tải danh sách đánh giá.");
        }

        if (isMounted) {
          setReviews(result);
          setMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Không thể tải đánh giá.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa đánh giá này?");
    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể xóa đánh giá.");
      setDeletingId(null);
      return;
    }

    setReviews((current) => current.filter((item) => item.id !== id));
    setMessage("Đã xóa đánh giá.");
    setDeletingId(null);
  }

  async function handleApprove(id: string) {
    setApprovingId(id);
    setMessage("");

    const response = await fetch(`/api/admin/reviews/${id}`, { method: "PUT" });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể duyệt đánh giá.");
      setApprovingId(null);
      return;
    }

    setReviews((current) =>
      current.map((item) => (item.id === id ? { ...item, ...result, status: "approved" } : item)),
    );
    setMessage("Đã duyệt đánh giá.");
    setApprovingId(null);
  }

  return (
    <div className="admin-stack">
      <div className="card table-card">
        {message ? <p className="helper-text">{message}</p> : null}
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Khách hàng</th>
              <th>Đánh giá</th>
              <th>Trạng thái</th>
              <th>Nội dung</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Đang tải đánh giá...</td>
              </tr>
            ) : null}
            {!isLoading && reviews.length === 0 ? (
              <tr>
                <td colSpan={7}>Chưa có đánh giá nào.</td>
              </tr>
            ) : null}
            {reviews.map((review) => (
              <tr key={review.id}>
                <td>
                  {review.productSlug ? (
                    <Link href={`/products/${review.productSlug}`} className="admin-table-link">
                      {review.productName}
                    </Link>
                  ) : (
                    review.productName
                  )}
                </td>
                <td>{review.author}</td>
                <td>
                  <span className="admin-rating-badge">
                    <Star size={14} fill="currentColor" />
                    {review.rating}/5
                  </span>
                </td>
                <td>
                  <span className={`status-pill ${review.status === "approved" ? "status-delivered" : "status-pending"}`}>
                    {review.status === "approved" ? "Đã duyệt" : "Chờ duyệt"}
                  </span>
                </td>
                <td>{review.comment}</td>
                <td>{formatDateTime(review.createdAt)}</td>
                <td className="actions-cell">
                  {review.status !== "approved" ? (
                    <button
                      type="button"
                      className="admin-icon-button icon-only"
                      onClick={() => handleApprove(review.id)}
                      disabled={approvingId === review.id}
                      aria-label={`Duyệt đánh giá ${review.id}`}
                      title="Duyệt đánh giá"
                    >
                      <CheckCheck size={15} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="admin-icon-button icon-only danger"
                    onClick={() => handleDelete(review.id)}
                    disabled={deletingId === review.id}
                    aria-label={`Xóa đánh giá ${review.id}`}
                    title="Xóa đánh giá"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

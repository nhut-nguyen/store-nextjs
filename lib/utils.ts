import { OrderStatus, PaymentMethod } from "@/lib/types";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatOrderStatus(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "shipping":
      return "Đang giao";
    case "delivered":
      return "Đã giao";
    default:
      return status;
  }
}

export function formatPaymentMethod(paymentMethod: PaymentMethod) {
  switch (paymentMethod) {
    case "cod":
      return "Thanh toán khi nhận hàng";
    case "bank":
      return "Chuyển khoản ngân hàng";
    case "online":
      return "Thanh toán online";
    default:
      return paymentMethod;
  }
}

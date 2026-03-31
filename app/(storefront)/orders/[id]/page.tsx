import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { BanknoteArrowDown, CircleCheckBig, CreditCard, PackageCheck, Truck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getOrderById } from "@/lib/repository";
import { OrderStatus } from "@/lib/types";
import { cn, formatCurrency, formatDate, formatDateTime, formatOrderStatus, formatPaymentMethod } from "@/lib/utils";

const statusConfig = {
  pending: { icon: PackageCheck, className: "order-status-pending" },
  confirmed: { icon: CircleCheckBig, className: "order-status-confirmed" },
  shipping: { icon: Truck, className: "order-status-shipping" },
  delivered: { icon: CircleCheckBig, className: "order-status-delivered" },
} as const;

const paymentConfig = {
  cod: { icon: BanknoteArrowDown },
  bank: { icon: CreditCard },
  online: { icon: CreditCard },
} as const;

const orderTimeline: Array<{
  key: OrderStatus;
  title: string;
  description: string;
}> = [
  {
    key: "pending",
    title: "Chờ xác nhận",
    description: "Đơn hàng đã được tạo và đang chờ hệ thống xác nhận.",
  },
  {
    key: "confirmed",
    title: "Đã xác nhận",
    description: "Đơn hàng đã được xác nhận và đang chuẩn bị xử lý.",
  },
  {
    key: "shipping",
    title: "Đang giao",
    description: "Đơn hàng đã bàn giao cho đơn vị vận chuyển.",
  },
  {
    key: "delivered",
    title: "Đã giao",
    description: "Đơn hàng đã giao thành công tới người nhận.",
  },
];

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const order = await getOrderById(id);
  const cookieStore = await cookies();
  const lastCreatedOrderId = cookieStore.get("gearhub-last-order-id")?.value;

  if (!order) {
    notFound();
  }

  const canAccess =
    order.userId === user.id ||
    ((!order.userId || order.userId.trim() === "") &&
      order.customerEmail?.toLowerCase() === user.email.toLowerCase()) ||
    lastCreatedOrderId === order.id;

  if (!canAccess) {
    notFound();
  }

  const StatusIcon = statusConfig[order.status].icon;
  const PaymentIcon = paymentConfig[order.paymentMethod].icon;
  const currentStatusIndex = orderTimeline.findIndex((step) => step.key === order.status);

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Lịch sử mua hàng</p>
          <h1>Chi tiết đơn {order.id}</h1>
          <p>Theo dõi trạng thái, thông tin giao hàng và các sản phẩm trong đơn của bạn.</p>
        </div>

        <div className="card order-card order-card-elevated">
          <div className="order-card-head">
            <div>
              <p className="eyebrow">Mã đơn {order.id}</p>
              <h2>{formatDate(order.createdAt)}</h2>
              <div className="order-badges">
                <span className={cn("order-status-pill", statusConfig[order.status].className)}>
                  <StatusIcon size={16} />
                  {formatOrderStatus(order.status)}
                </span>
                <span className="order-payment-pill">
                  <PaymentIcon size={16} />
                  {formatPaymentMethod(order.paymentMethod)}
                </span>
              </div>
            </div>
            <div className="order-total-block">
              <span>Tổng thanh toán</span>
              <strong>{formatCurrency(order.total)}</strong>
            </div>
          </div>

          <div className="order-meta-grid">
            <div>
              <strong>Người nhận</strong>
              <p>{order.customerName}</p>
            </div>
            <div>
              <strong>Số điện thoại</strong>
              <p>{order.phone}</p>
            </div>
            <div>
              <strong>Hình thức thanh toán</strong>
              <p>{formatPaymentMethod(order.paymentMethod)}</p>
            </div>
            <div>
              <strong>Tổng tiền</strong>
              <p>{formatCurrency(order.total)}</p>
            </div>
            <div>
              <strong>Địa chỉ</strong>
              <p>{order.address}</p>
            </div>
            <div>
              <strong>Ghi chú</strong>
              <p>{order.note?.trim() ? order.note : "Không có ghi chú."}</p>
            </div>
            <div>
              <strong>Trạng thái đơn hàng</strong>
              <p>{formatOrderStatus(order.status)}</p>
            </div>
          </div>

          <div className="order-timeline card">
            <div className="order-timeline-head">
              <h3>Tiến trình đơn hàng</h3>
              <p>Đơn của bạn hiện đang ở bước {formatOrderStatus(order.status).toLowerCase()}.</p>
            </div>
            <div className="order-timeline-steps">
              {orderTimeline.map((step, index) => {
                const StepIcon = statusConfig[step.key].icon;
                const state =
                  index < currentStatusIndex ? "completed" : index === currentStatusIndex ? "current" : "upcoming";

                return (
                  <div key={step.key} className={cn("order-timeline-step", `order-timeline-step-${state}`)}>
                    <div className="order-timeline-marker">
                      <StepIcon size={18} />
                    </div>
                    <div className="order-timeline-content">
                      <strong>{step.title}</strong>
                      <p>{step.description}</p>
                      {order.statusTimeline?.[step.key] ? (
                        <small>Cập nhật lúc {formatDateTime(order.statusTimeline[step.key]!)}</small>
                      ) : (
                        <small>Chưa có mốc thời gian</small>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-items">
            {order.items.map((item) => (
              <div key={`${order.id}-${item.id}`} className="order-item-row">
                <div className="order-item-media">
                  <Image src={item.image} alt={item.name} fill sizes="72px" />
                </div>
                <div className="order-item-content">
                  <Link href={`/products/${item.slug}`} className="order-item-title">
                    {item.name}
                  </Link>
                  <p>
                    Số lượng: {item.quantity} · Đơn giá: {formatCurrency(item.price)}
                  </p>
                </div>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <Link href="/orders" className="secondary-button">
            Quay lại lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </section>
  );
}

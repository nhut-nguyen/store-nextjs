import Image from "next/image";
import Link from "next/link";
import { BanknoteArrowDown, CircleCheckBig, CreditCard, PackageCheck, Truck } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getOrdersByUserId } from "@/lib/repository";
import { cn, formatCurrency, formatDate, formatOrderStatus, formatPaymentMethod } from "@/lib/utils";

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

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  const orders = await getOrdersByUserId(user);

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Tài khoản</p>
          <h1>Lịch sử mua hàng</h1>
          <p>Theo dõi đơn đã đặt, trạng thái xử lý và các sản phẩm bạn đã mua.</p>
        </div>

        {orders.length === 0 ? (
          <div className="card empty-state">
            <h2>Bạn chưa có đơn hàng nào</h2>
            <p>Hãy khám phá thêm sản phẩm rồi quay lại đây để theo dõi đơn của mình.</p>
            <Link href="/products" className="primary-button">
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article key={order.id} className="card order-card order-card-elevated">
                {(() => {
                  const StatusIcon = statusConfig[order.status].icon;
                  const PaymentIcon = paymentConfig[order.paymentMethod].icon;

                  return (
                    <>
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
                    <strong>Hình thức thanh toán</strong>
                    <p>{formatPaymentMethod(order.paymentMethod)}</p>
                  </div>
                  <div>
                    <strong>Địa chỉ</strong>
                    <p>{order.address}</p>
                  </div>
                  <div>
                    <strong>Trạng thái</strong>
                    <p>{formatOrderStatus(order.status)}</p>
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

                <div className="account-actions">
                  <Link href={`/orders/${order.id}`} className="secondary-button">
                    Xem chi tiết đơn hàng
                  </Link>
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

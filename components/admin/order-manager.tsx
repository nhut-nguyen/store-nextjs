"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminModal } from "@/components/admin/modal";
import { Order, User } from "@/lib/types";
import { formatCurrency, formatDate, formatDateTime, formatOrderStatus } from "@/lib/utils";

type OrderFormState = {
  userId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  address: string;
  paymentMethod: Order["paymentMethod"];
  status: Order["status"];
  total: string;
  note: string;
  itemsText: string;
};

type StatusFormState = {
  orderId: string;
  status: Order["status"];
};

function defaultForm(): OrderFormState {
  return {
    userId: "",
    customerName: "",
    customerEmail: "",
    phone: "",
    address: "",
    paymentMethod: "cod",
    status: "pending",
    total: "0",
    note: "",
    itemsText: "[]",
  };
}

function toFormState(order: Order): OrderFormState {
  return {
    userId: order.userId ?? "",
    customerName: order.customerName,
    customerEmail: order.customerEmail ?? "",
    phone: order.phone,
    address: order.address,
    paymentMethod: order.paymentMethod,
    status: order.status,
    total: String(order.total),
    note: order.note ?? "",
    itemsText: JSON.stringify(order.items, null, 2),
  };
}

function parseItems(value: string) {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

export function OrderManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [form, setForm] = useState<OrderFormState>(defaultForm());
  const [statusForm, setStatusForm] = useState<StatusFormState | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [ordersResponse, usersResponse] = await Promise.all([
          fetch("/api/admin/orders", { cache: "no-store" }),
          fetch("/api/admin/users", { cache: "no-store" }),
        ]);
        const ordersResult = await ordersResponse.json();
        const usersResult = await usersResponse.json();

        if (!ordersResponse.ok) {
          throw new Error(ordersResult.message ?? "Không thể tải đơn hàng.");
        }
        if (!usersResponse.ok) {
          throw new Error(usersResult.message ?? "Không thể tải người dùng.");
        }

        if (isMounted) {
          setOrders(ordersResult);
          setUsers(usersResult);
          setMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu đơn hàng.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm());
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function closeStatusModal() {
    setIsStatusModalOpen(false);
    setStatusForm(null);
  }

  function handleCreate() {
    setMessage("");
    resetForm();
    setIsModalOpen(true);
  }

  function handleEdit(order: Order) {
    setMessage("");
    setEditingId(order.id);
    setForm(toFormState(order));
    setIsModalOpen(true);
  }

  function handleOpenStatusModal(order: Order) {
    setMessage("");
    setStatusForm({
      orderId: order.id,
      status: order.status,
    });
    setIsStatusModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const endpoint = editingId ? `/api/admin/orders/${editingId}` : "/api/admin/orders";
    const response = await fetch(endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.userId || null,
        customerName: form.customerName,
        customerEmail: form.customerEmail || null,
        phone: form.phone,
        address: form.address,
        paymentMethod: form.paymentMethod,
        status: form.status,
        total: Number(form.total),
        note: form.note || null,
        items: parseItems(form.itemsText),
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể lưu đơn hàng.");
      setIsSubmitting(false);
      return;
    }

    setOrders((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? result : item))
        : [result, ...current],
    );
    closeModal();
    setMessage(editingId ? "Đã cập nhật đơn hàng." : "Đã tạo đơn hàng mới.");
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setMessage("");
    const confirmed = window.confirm("Bạn có chắc muốn xóa đơn hàng này?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể xóa đơn hàng.");
      return;
    }

    setOrders((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
    setMessage("Đã xóa đơn hàng.");
  }

  async function handleQuickStatusChange(order: Order, nextStatus: Order["status"]) {
    if (order.status === nextStatus) {
      return;
    }

    setUpdatingStatusId(order.id);
    setMessage("");

    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: order.userId || null,
        customerName: order.customerName,
        customerEmail: order.customerEmail || null,
        phone: order.phone,
        address: order.address,
        paymentMethod: order.paymentMethod,
        status: nextStatus,
        total: order.total,
        note: order.note || null,
        items: order.items,
        statusTimeline: order.statusTimeline,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể cập nhật trạng thái đơn hàng.");
      setUpdatingStatusId(null);
      return;
    }

    setOrders((current) => current.map((item) => (item.id === order.id ? result : item)));
    setMessage("Đã cập nhật trạng thái đơn hàng.");
    setUpdatingStatusId(null);
    closeStatusModal();
  }

  return (
    <div className="admin-stack">
      <div className="toolbar">
        <button type="button" className="primary-button admin-button" onClick={handleCreate}>
          <Plus size={16} />
          Tạo đơn hàng
        </button>
      </div>

      <div className="card table-card">
        {message && !isModalOpen && !isStatusModalOpen ? <p className="helper-text">{message}</p> : null}
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Thanh toán</th>
              <th>Ngày tạo</th>
              <th>Tổng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Đang tải đơn hàng...</td>
              </tr>
            ) : null}
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.paymentMethod}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <div className="admin-order-status">
                    <button
                      type="button"
                      className={`status-pill status-${order.status} admin-status-trigger`}
                      onClick={() => handleOpenStatusModal(order)}
                      disabled={updatingStatusId === order.id}
                    >
                      {formatOrderStatus(order.status)}
                    </button>
                    <small>
                      {order.statusTimeline?.[order.status]
                        ? `Cập nhật: ${formatDateTime(order.statusTimeline[order.status]!)}`
                        : "Chưa có thời gian cập nhật"}
                    </small>
                  </div>
                </td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="admin-icon-button icon-only"
                    onClick={() => handleEdit(order)}
                    aria-label={`Sửa đơn ${order.id}`}
                    title="Sửa đơn hàng"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button icon-only danger"
                    onClick={() => handleDelete(order.id)}
                    aria-label={`Xóa đơn ${order.id}`}
                    title="Xóa đơn hàng"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminModal
        open={isModalOpen}
        onClose={closeModal}
        eyebrow={editingId ? "Cập nhật" : "Tạo mới"}
        title={editingId ? "Chỉnh sửa đơn hàng" : "Đơn hàng mới"}
      >
        <form className="form-card admin-modal-form" onSubmit={handleSubmit}>
          <select
            value={form.userId}
            onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
          >
            <option value="">Khách vãng lai</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
          <input
            placeholder="Tên khách hàng"
            value={form.customerName}
            onChange={(event) =>
              setForm((current) => ({ ...current, customerName: event.target.value }))
            }
            required
          />
          <input
            type="email"
            placeholder="Email khách hàng"
            value={form.customerEmail}
            onChange={(event) =>
              setForm((current) => ({ ...current, customerEmail: event.target.value }))
            }
          />
          <input
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            required
          />
          <input
            placeholder="Địa chỉ"
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            required
          />
          <div className="admin-form-grid">
            <select
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  paymentMethod: event.target.value as Order["paymentMethod"],
                }))
              }
            >
              <option value="cod">COD</option>
              <option value="bank">Chuyển khoản</option>
              <option value="online">Online</option>
            </select>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as Order["status"] }))
              }
              >
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="shipping">Đang giao</option>
              <option value="delivered">Đã giao</option>
            </select>
            <input
              type="number"
              placeholder="Tổng tiền"
              value={form.total}
              onChange={(event) => setForm((current) => ({ ...current, total: event.target.value }))}
              required
            />
          </div>
          <textarea
            rows={3}
            placeholder="Ghi chú"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          />
          <textarea
            rows={8}
            placeholder="Items JSON"
            value={form.itemsText}
            onChange={(event) => setForm((current) => ({ ...current, itemsText: event.target.value }))}
          />

          <div className="toolbar">
            <button type="submit" className="primary-button admin-button" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo đơn hàng"}
            </button>
            <button type="button" className="secondary-button" onClick={closeModal}>
              Hủy
            </button>
          </div>
          {message ? <p className="helper-text">{message}</p> : null}
        </form>
      </AdminModal>

      <AdminModal
        open={isStatusModalOpen}
        onClose={closeStatusModal}
        eyebrow="Cập nhật"
        title={statusForm ? `Trạng thái đơn ${statusForm.orderId}` : "Trạng thái đơn hàng"}
      >
        <form
          className="form-card admin-modal-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!statusForm) return;
            const order = orders.find((item) => item.id === statusForm.orderId);
            if (!order) return;
            void handleQuickStatusChange(order, statusForm.status);
          }}
        >
          <p className="helper-text">
            Chọn trạng thái mới. Hệ thống sẽ tự lưu ngày giờ cập nhật để hiển thị ở timeline khách hàng.
          </p>
          <select
            value={statusForm?.status ?? "pending"}
            onChange={(event) =>
              setStatusForm((current) =>
                current
                  ? { ...current, status: event.target.value as Order["status"] }
                  : current,
              )
            }
            disabled={!statusForm}
          >
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="shipping">Đang giao</option>
            <option value="delivered">Đã giao</option>
          </select>
          {statusForm ? (
            <p className="helper-text">
              {(() => {
                const order = orders.find((item) => item.id === statusForm.orderId);
                if (!order?.statusTimeline?.[order.status]) {
                  return "Chưa có thời gian cập nhật trạng thái hiện tại.";
                }

                return `Trạng thái hiện tại được cập nhật lúc ${formatDateTime(order.statusTimeline[order.status]!)}.`;
              })()}
            </p>
          ) : null}
          <div className="toolbar">
            <button
              type="submit"
              className="primary-button admin-button"
              disabled={!statusForm || updatingStatusId === statusForm.orderId}
            >
              {statusForm && updatingStatusId === statusForm.orderId ? "Đang lưu..." : "Lưu trạng thái"}
            </button>
            <button type="button" className="secondary-button" onClick={closeStatusModal}>
              Hủy
            </button>
          </div>
          {message && isStatusModalOpen ? <p className="helper-text">{message}</p> : null}
        </form>
      </AdminModal>
    </div>
  );
}

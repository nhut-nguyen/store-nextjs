"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type Summary = {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
};

export function DashboardOverview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [summaryResponse, ordersResponse] = await Promise.all([
          fetch("/api/admin/summary", { cache: "no-store" }),
          fetch("/api/admin/orders", { cache: "no-store" }),
        ]);

        const summaryResult = await summaryResponse.json();
        const ordersResult = await ordersResponse.json();

        if (!summaryResponse.ok) {
          throw new Error(summaryResult.message ?? "Không thể tải tổng quan hệ thống.");
        }

        if (!ordersResponse.ok) {
          throw new Error(ordersResult.message ?? "Không thể tải danh sách đơn hàng.");
        }

        if (!isMounted) return;
        setSummary(summaryResult);
        setOrders(ordersResult);
        setMessage("");
      } catch (error) {
        if (!isMounted) return;
        setMessage(error instanceof Error ? error.message : "Không thể tải dashboard admin.");
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

  const deliveredRevenue = orders
    .filter((item) => item.status === "delivered")
    .reduce((sum, item) => sum + item.total, 0);
  const pendingOrders = orders.filter((item) => item.status === "pending").length;
  const statusConfig = [
    { key: "pending", label: "Chờ xử lý", color: "#f59e0b" },
    { key: "confirmed", label: "Đã xác nhận", color: "#06b6d4" },
    { key: "shipping", label: "Đang giao", color: "#3b82f6" },
    { key: "delivered", label: "Hoàn tất", color: "#22c55e" },
  ] as const;
  const paymentConfig = [
    { key: "cod", label: "COD", color: "#f97316" },
    { key: "bank", label: "Chuyển khoản", color: "#0ea5e9" },
    { key: "online", label: "Online", color: "#14b8a6" },
  ] as const;
  const totalOrders = orders.length || 1;
  const revenueByDay = Array.from({ length: 7 }, (_, index) => {
    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);
    targetDate.setDate(targetDate.getDate() - (6 - index));

    const total = orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === targetDate.getTime();
      })
      .reduce((sum, order) => sum + order.total, 0);

    return {
      label: targetDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      total,
    };
  });
  const orderStatusData = statusConfig.map((item) => {
    const value = orders.filter((order) => order.status === item.key).length;
    return {
      ...item,
      value,
      percent: Math.round((value / totalOrders) * 100),
    };
  });
  const paymentData = paymentConfig.map((item) => {
    const value = orders.filter((order) => order.paymentMethod === item.key).length;
    return {
      ...item,
      value,
      percent: Math.round((value / totalOrders) * 100),
    };
  });

  function asNumber(value: unknown) {
    return typeof value === "number" ? value : Number(value ?? 0);
  }

  if (isLoading && !summary) {
    return <p className="helper-text">Đang tải dữ liệu dashboard...</p>;
  }

  if (!summary) {
    return <p className="helper-text">{message || "Không có dữ liệu dashboard."}</p>;
  }

  return (
    <>
      <div className="stats-grid">
        <article className="card stat-tile">
          <span>Sản phẩm</span>
          <strong>{summary.totalProducts}</strong>
        </article>
        <article className="card stat-tile">
          <span>Đơn hàng</span>
          <strong>{summary.totalOrders}</strong>
        </article>
        <article className="card stat-tile">
          <span>Người dùng</span>
          <strong>{summary.totalUsers}</strong>
        </article>
        <article className="card stat-tile">
          <span>Doanh thu</span>
          <strong>{formatCurrency(summary.totalRevenue)}</strong>
        </article>
      </div>

      <div className="card">
        <div className="page-head admin-page-head admin-section-head">
          <div>
            <p className="eyebrow">Thống kê</p>
            <h2>Doanh thu và hiệu suất bán hàng</h2>
          </div>
        </div>
        <div className="stats-grid admin-stats-grid">
          <article className="card stat-tile">
            <span>Tổng doanh thu</span>
            <strong>{formatCurrency(summary.totalRevenue)}</strong>
          </article>
          <article className="card stat-tile">
            <span>Doanh thu đã giao</span>
            <strong>{formatCurrency(deliveredRevenue)}</strong>
          </article>
          <article className="card stat-tile">
            <span>Đơn chờ xử lý</span>
            <strong>{pendingOrders}</strong>
          </article>
        </div>
      </div>

      <div className="admin-chart-grid">
        <article className="card admin-chart-card">
          <div className="admin-chart-head">
            <div>
              <p className="eyebrow">Revenue</p>
              <h3>Doanh thu 7 ngày gần nhất</h3>
            </div>
            <strong>{formatCurrency(summary.totalRevenue)}</strong>
          </div>
          <div className="admin-chart-canvas">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip formatter={(value) => formatCurrency(asNumber(value))} />
                <Bar dataKey="total" radius={[12, 12, 4, 4]} fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card admin-chart-card">
          <div className="admin-chart-head">
            <div>
              <p className="eyebrow">Orders</p>
              <h3>Trạng thái đơn hàng</h3>
            </div>
            <strong>{orders.length} đơn</strong>
          </div>
          <div className="admin-chart-canvas">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={orderStatusData} layout="vertical" margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={88} />
                <Tooltip formatter={(value) => [`${asNumber(value)} đơn`, "Số lượng"]} />
                <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                  {orderStatusData.map((item) => (
                    <Cell key={item.key} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card admin-chart-card">
          <div className="admin-chart-head">
            <div>
              <p className="eyebrow">Payments</p>
              <h3>Phương thức thanh toán</h3>
            </div>
            <strong>{orders.length} giao dịch</strong>
          </div>
          <div className="admin-chart-canvas">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentData}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={3}
                >
                  {paymentData.map((item) => (
                    <Cell key={item.key} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${asNumber(value)} giao dịch`, "Số lượng"]} />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="admin-payment-legend">
            {paymentData.map((item) => (
              <div key={item.key} className="admin-payment-item">
                <span className={`admin-payment-dot payment-${item.key}`} />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="card table-card">
        <h2>Đơn hàng mới</h2>
        {message ? <p className="helper-text">{message}</p> : null}
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.status}</td>
                <td>{formatDate(order.createdAt)}</td>
                <td>{formatCurrency(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

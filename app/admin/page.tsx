import { DashboardOverview } from "@/components/admin/dashboard-overview";

export default function AdminDashboardPage() {
  return (
    <div className="admin-stack">
      <div className="page-head admin-page-head">
        <p className="eyebrow">Dashboard</p>
        <h1>Tổng quan hệ thống</h1>
      </div>
      <DashboardOverview />
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminModal } from "@/components/admin/modal";
import { User } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type UserFormState = {
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
  password: string;
};

const defaultForm: UserFormState = {
  name: "",
  email: "",
  role: "customer",
  status: "active",
  password: "",
};

function toFormState(user: User): UserFormState {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    password: "",
  };
}

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(defaultForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/users", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message ?? "Không thể tải người dùng.");
        }

        if (isMounted) {
          setUsers(result);
          setMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Không thể tải người dùng.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  function handleCreate() {
    setMessage("");
    resetForm();
    setIsModalOpen(true);
  }

  function handleEdit(user: User) {
    setMessage("");
    setEditingId(user.id);
    setForm(toFormState(user));
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const endpoint = editingId ? `/api/admin/users/${editingId}` : "/api/admin/users";
    const response = await fetch(endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        role: form.role,
        status: form.status,
        password: form.password || undefined,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể lưu người dùng.");
      setIsSubmitting(false);
      return;
    }

    setUsers((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? result : item))
        : [result, ...current],
    );
    closeModal();
    setMessage(editingId ? "Đã cập nhật người dùng." : "Đã tạo người dùng mới.");
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setMessage("");
    const confirmed = window.confirm("Bạn có chắc muốn xóa người dùng này?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể xóa người dùng.");
      return;
    }

    setUsers((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
    setMessage("Đã xóa người dùng.");
  }

  return (
    <div className="admin-stack">
      <div className="toolbar">
        <button type="button" className="primary-button admin-button" onClick={handleCreate}>
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      <div className="card table-card">
        {message && !isModalOpen ? <p className="helper-text">{message}</p> : null}
        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Đang tải người dùng...</td>
              </tr>
            ) : null}
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-pill status-${user.status}`}>{user.status}</span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="admin-icon-button icon-only"
                    onClick={() => handleEdit(user)}
                    aria-label={`Sửa ${user.name}`}
                    title="Sửa người dùng"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button icon-only danger"
                    onClick={() => handleDelete(user.id)}
                    aria-label={`Xóa ${user.name}`}
                    title="Xóa người dùng"
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
        title={editingId ? "Chỉnh sửa người dùng" : "Người dùng mới"}
      >
        <form className="form-card admin-modal-form" onSubmit={handleSubmit}>
          <input
            placeholder="Họ tên"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
          <div className="admin-form-grid">
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value as User["role"] }))
              }
            >
              <option value="customer">customer</option>
              <option value="admin">admin</option>
            </select>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((current) => ({ ...current, status: event.target.value as User["status"] }))
              }
            >
              <option value="active">active</option>
              <option value="locked">locked</option>
            </select>
          </div>
          <input
            type="password"
            placeholder={editingId ? "Mật khẩu mới (không bắt buộc)" : "Mật khẩu"}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required={!editingId}
          />

          <div className="toolbar">
            <button type="submit" className="primary-button admin-button" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo người dùng"}
            </button>
            <button type="button" className="secondary-button" onClick={closeModal}>
              Hủy
            </button>
          </div>
          {message ? <p className="helper-text">{message}</p> : null}
        </form>
      </AdminModal>
    </div>
  );
}

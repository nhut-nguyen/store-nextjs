"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminModal } from "@/components/admin/modal";
import { CATEGORY_ICON_OPTIONS, Category } from "@/lib/types";

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: string;
};

const defaultForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  icon: "Laptop",
  isActive: true,
  sortOrder: "0",
};

function sortCategories(list: Category[]) {
  return [...list].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function toFormState(category?: Category): CategoryFormState {
  if (!category) return defaultForm;
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    isActive: category.isActive,
    sortOrder: String(category.sortOrder),
  };
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"info" | "success" | "error">("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCategories() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/categories", { cache: "no-store" });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message ?? "Không thể tải danh mục.");
        }

        if (isMounted) {
          setCategories(sortCategories(result));
          setMessage("");
          setMessageKind("info");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Không thể tải danh mục.");
          setMessageKind("error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategories();
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
    setMessageKind("info");
    resetForm();
    setIsModalOpen(true);
  }

  function handleEdit(category: Category) {
    setMessage("");
    setMessageKind("info");
    setEditingId(category.id);
    setForm(toFormState(category));
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const endpoint = editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories";
    const response = await fetch(endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể lưu danh mục.");
      setMessageKind("error");
      setIsSubmitting(false);
      return;
    }

    setCategories((current) =>
      sortCategories(
        editingId ? current.map((item) => (item.id === editingId ? result : item)) : [...current, result],
      ),
    );
    closeModal();
    setMessage(editingId ? "Đã cập nhật danh mục." : "Đã tạo danh mục mới.");
    setMessageKind("success");
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setMessage("");
    const confirmed = window.confirm("Bạn có chắc muốn xóa danh mục này?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể xóa danh mục.");
      setMessageKind("error");
      return;
    }

    setCategories((current) => sortCategories(current.filter((item) => item.id !== id)));
    if (editingId === id) {
      resetForm();
    }
    setMessage("Đã xóa danh mục.");
    setMessageKind("success");
  }

  return (
    <div className="admin-stack">
      <div className="toolbar">
        <button type="button" className="primary-button admin-button" onClick={handleCreate}>
          <Plus size={16} />
          Thêm danh mục
        </button>
      </div>

      <div className="card table-card">
        {message && !isModalOpen ? (
          <p className="helper-text" role={messageKind === "error" ? "alert" : "status"}>
            {message}
          </p>
        ) : null}
        <table>
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Icon</th>
              <th>Thứ tự</th>
              <th>Trạng thái</th>
              <th>Mô tả</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Đang tải danh mục...</td>
              </tr>
            ) : null}
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.icon}</td>
                <td>{category.sortOrder}</td>
                <td>{category.isActive ? "Hiển thị" : "Ẩn"}</td>
                <td>{category.description}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="admin-icon-button icon-only"
                    onClick={() => handleEdit(category)}
                    aria-label={`Sửa ${category.name}`}
                    title="Sửa danh mục"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button icon-only danger"
                    onClick={() => handleDelete(category.id)}
                    aria-label={`Xóa ${category.name}`}
                    title="Xóa danh mục"
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
        title={editingId ? "Chỉnh sửa danh mục" : "Danh mục mới"}
      >
        <form className="form-card admin-modal-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Tên danh mục"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <input
            name="slug"
            placeholder="Slug"
            value={form.slug}
            onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
            required
          />
          <input
            name="icon"
            value={form.icon}
            onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
            required
            list="category-icons"
          />
          <datalist id="category-icons">
            {CATEGORY_ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon} />
            ))}
          </datalist>
          <label className="form-check">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
            Hiển thị trên storefront
          </label>
          <input
            type="number"
            name="sortOrder"
            min={0}
            step={1}
            placeholder="Thứ tự hiển thị"
            value={form.sortOrder}
            onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
            required
          />
          <textarea
            name="description"
            placeholder="Mô tả danh mục"
            rows={5}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            required
          />

          <div className="toolbar">
            <button type="submit" className="primary-button admin-button" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
            <button type="button" className="secondary-button" onClick={closeModal}>
              Hủy
            </button>
          </div>
          {message ? (
            <p className="helper-text" role={messageKind === "error" ? "alert" : "status"}>
              {message}
            </p>
          ) : null}
        </form>
      </AdminModal>
    </div>
  );
}

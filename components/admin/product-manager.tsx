"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminModal } from "@/components/admin/modal";
import { Category, Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type ProductFormState = {
  name: string;
  slug: string;
  categoryId: string;
  brand: string;
  price: string;
  originalPrice: string;
  rating: string;
  reviewCount: string;
  stock: string;
  image: string;
  galleryText: string;
  shortDescription: string;
  description: string;
  specsText: string;
  tagsText: string;
  featured: boolean;
  onSale: boolean;
  isNew: boolean;
};

function createDefaultForm(categoryId: string): ProductFormState {
  return {
    name: "",
    slug: "",
    categoryId,
    brand: "",
    price: "0",
    originalPrice: "",
    rating: "0",
    reviewCount: "0",
    stock: "0",
    image: "",
    galleryText: "",
    shortDescription: "",
    description: "",
    specsText: "",
    tagsText: "",
    featured: false,
    onSale: false,
    isNew: false,
  };
}

function toFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    categoryId: product.categoryId,
    brand: product.brand,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    rating: String(product.rating),
    reviewCount: String(product.reviewCount),
    stock: String(product.stock),
    image: product.image,
    galleryText: product.gallery.join("\n"),
    shortDescription: product.shortDescription,
    description: product.description,
    specsText: Object.entries(product.specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
    tagsText: product.tags.join(", "),
    featured: Boolean(product.featured),
    onSale: Boolean(product.onSale),
    isNew: Boolean(product.isNew),
  };
}

function toPayload(form: ProductFormState) {
  const gallery = form.galleryText
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const specs = Object.fromEntries(
    form.specsText
      .split("\n")
      .map((line) => line.split(":"))
      .filter((parts) => parts.length >= 2)
      .map(([key, ...rest]) => [key.trim(), rest.join(":").trim()]),
  );

  return {
    name: form.name,
    slug: form.slug,
    categoryId: form.categoryId,
    brand: form.brand,
    price: Number(form.price),
    originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
    rating: Number(form.rating),
    reviewCount: Number(form.reviewCount),
    stock: Number(form.stock),
    image: form.image,
    gallery: gallery.length > 0 ? gallery : [form.image],
    shortDescription: form.shortDescription,
    description: form.description,
    specs,
    tags: form.tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    featured: form.featured,
    onSale: form.onSale,
    isNew: form.isNew,
  };
}

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [modalHint, setModalHint] = useState("");
  const [form, setForm] = useState<ProductFormState>(createDefaultForm(categories[0]?.id ?? ""));

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/admin/products", { cache: "no-store" }),
          fetch("/api/admin/categories", { cache: "no-store" }),
        ]);
        const productsResult = await productsResponse.json();
        const categoriesResult = await categoriesResponse.json();

        if (!productsResponse.ok) {
          throw new Error(productsResult.message ?? "Không thể tải sản phẩm.");
        }
        if (!categoriesResponse.ok) {
          throw new Error(categoriesResult.message ?? "Không thể tải danh mục.");
        }

        if (isMounted) {
          setProducts(productsResult);
          setCategories(categoriesResult);
          setForm((current) =>
            current.categoryId
              ? current
              : {
                  ...current,
                  categoryId: categoriesResult[0]?.id ?? "",
                },
          );
          setMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Không thể tải dữ liệu sản phẩm.");
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
    setForm(createDefaultForm(categories[0]?.id ?? ""));
    setModalHint("");
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

  function handleEdit(product: Product) {
    setMessage("");
    setEditingId(product.id);
    setForm(toFormState(product));
    setModalHint("");
    setIsModalOpen(true);
  }

  function handleImageEdit(product: Product) {
    setMessage("");
    setEditingId(product.id);
    setForm(toFormState(product));
    setModalHint("Bạn đang chỉnh riêng phần ảnh và gallery cho sản phẩm.");
    setIsModalOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const endpoint = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const response = await fetch(endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(form)),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể lưu sản phẩm.");
      setIsSubmitting(false);
      return;
    }

    setProducts((current) =>
      editingId
        ? current.map((item) => (item.id === editingId ? result : item))
        : [result, ...current],
    );
    closeModal();
    setMessage(editingId ? "Đã cập nhật sản phẩm." : "Đã tạo sản phẩm mới.");
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    setMessage("");
    const confirmed = window.confirm("Bạn có chắc muốn xóa sản phẩm này?");
    if (!confirmed) return;

    const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message ?? "Không thể xóa sản phẩm.");
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetForm();
    }
    setMessage("Đã xóa sản phẩm.");
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    try {
      setIsUploadingFiles(true);
      setMessage("");
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Không thể upload ảnh.");
      }

      const uploadedUrls = result.files.map((item: { url: string }) => item.url);
      setForm((current) => {
        const currentGallery = current.galleryText
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
        const nextGallery = Array.from(new Set([...currentGallery, ...uploadedUrls]));

        return {
          ...current,
          image: uploadedUrls[0] ?? current.image,
          galleryText: nextGallery.join("\n"),
        };
      });
      setModalHint(`Đã upload ${uploadedUrls.length} ảnh lên hệ thống.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể upload ảnh.");
    } finally {
      setIsUploadingFiles(false);
      event.target.value = "";
    }
  }

  return (
    <div className="admin-stack">
      <div className="toolbar">
        <button type="button" className="primary-button admin-button" onClick={handleCreate}>
          <Plus size={16} />
          Thêm sản phẩm
        </button>
      </div>

      <div className="card table-card">
        {message && !isModalOpen ? <p className="helper-text">{message}</p> : null}
        <table>
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Hãng</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Tồn kho</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Đang tải sản phẩm...</td>
              </tr>
            ) : null}
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="admin-product-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt={product.name} />
                  </div>
                </td>
                <td>{product.name}</td>
                <td>{product.brand}</td>
                <td>{categories.find((item) => item.id === product.categoryId)?.name ?? "-"}</td>
                <td>{formatCurrency(product.price)}</td>
                <td>{product.stock}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="admin-icon-button icon-only"
                    onClick={() => handleEdit(product)}
                    aria-label={`Sửa ${product.name}`}
                    title="Sửa sản phẩm"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button icon-only danger"
                    onClick={() => handleDelete(product.id)}
                    aria-label={`Xóa ${product.name}`}
                    title="Xóa sản phẩm"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-icon-button icon-only"
                    onClick={() => handleImageEdit(product)}
                    aria-label={`Cập nhật hình ảnh ${product.name}`}
                    title="Cập nhật hình ảnh"
                  >
                    <ImagePlus size={15} />
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
        title={editingId ? "Chỉnh sửa sản phẩm" : "Sản phẩm mới"}
        size="wide"
      >
        <form className="form-card admin-modal-form" onSubmit={handleSubmit}>
          {modalHint ? <p className="helper-text">{modalHint}</p> : null}
          <div className="admin-form-grid">
            <input
              placeholder="Tên sản phẩm"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <input
              placeholder="Slug"
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              required
            />
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm((current) => ({ ...current, categoryId: event.target.value }))
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Thương hiệu"
              value={form.brand}
              onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="Giá bán"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              required
            />
            <input
              type="number"
              placeholder="Giá gốc"
              value={form.originalPrice}
              onChange={(event) =>
                setForm((current) => ({ ...current, originalPrice: event.target.value }))
              }
            />
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Đánh giá"
              value={form.rating}
              onChange={(event) =>
                setForm((current) => ({ ...current, rating: event.target.value }))
              }
            />
            <input
              type="number"
              placeholder="Số review"
              value={form.reviewCount}
              onChange={(event) =>
                setForm((current) => ({ ...current, reviewCount: event.target.value }))
              }
            />
            <input
              type="number"
              placeholder="Tồn kho"
              value={form.stock}
              onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
              required
            />
            <input
              placeholder="Ảnh đại diện URL"
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              required
            />
          </div>

          <div className="admin-upload-box">
            <label className="admin-upload-label" htmlFor="product-image-upload">
              Upload file ảnh sản phẩm
            </label>
            <input
              id="product-image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
            />
            <p className="helper-text">
              {isUploadingFiles
                ? "Đang upload ảnh..."
                : "Chọn một hoặc nhiều file. Ảnh đầu tiên sẽ được dùng làm ảnh đại diện."}
            </p>
          </div>

          <textarea
            rows={3}
            placeholder="Gallery URL, mỗi dòng 1 ảnh"
            value={form.galleryText}
            onChange={(event) =>
              setForm((current) => ({ ...current, galleryText: event.target.value }))
            }
            required
          />
          <textarea
            rows={3}
            placeholder="Mô tả ngắn"
            value={form.shortDescription}
            onChange={(event) =>
              setForm((current) => ({ ...current, shortDescription: event.target.value }))
            }
            required
          />
          <textarea
            rows={5}
            placeholder="Mô tả chi tiết"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            required
          />
          <textarea
            rows={4}
            placeholder="Thông số, mỗi dòng theo dạng Key: Value"
            value={form.specsText}
            onChange={(event) => setForm((current) => ({ ...current, specsText: event.target.value }))}
          />
          <input
            placeholder="Tags, cách nhau bằng dấu phẩy"
            value={form.tagsText}
            onChange={(event) => setForm((current) => ({ ...current, tagsText: event.target.value }))}
          />

          {form.galleryText ? (
            <div className="admin-upload-preview">
              {form.galleryText
                .split("\n")
                .map((item) => item.trim())
                .filter(Boolean)
                .map((image) => (
                  <div key={image} className="admin-upload-preview-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Preview ảnh sản phẩm" />
                  </div>
                ))}
            </div>
          ) : null}

          <div className="admin-checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm((current) => ({ ...current, featured: event.target.checked }))
                }
              />
              Nổi bật
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.onSale}
                onChange={(event) =>
                  setForm((current) => ({ ...current, onSale: event.target.checked }))
                }
              />
              Đang sale
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(event) => setForm((current) => ({ ...current, isNew: event.target.checked }))}
              />
              Hàng mới
            </label>
          </div>

          <div className="toolbar">
            <button type="submit" className="primary-button admin-button" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo sản phẩm"}
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

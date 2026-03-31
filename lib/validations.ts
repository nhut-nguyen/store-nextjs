import { z } from "zod";
import { CATEGORY_ICON_OPTIONS } from "@/lib/types";

const imageUrlSchema = z.string().refine(
  (value) => {
    if (!value || typeof value !== "string") return false;
    if (value.startsWith("/uploads/")) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Ảnh phải là URL hợp lệ hoặc đường dẫn upload nội bộ." },
);

const cartItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  image: z.string().min(1),
  price: z.number().positive("Giá sản phẩm không hợp lệ."),
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0."),
});

const orderStatusTimelineSchema = z
  .object({
    pending: z.string().optional(),
    confirmed: z.string().optional(),
    shipping: z.string().optional(),
    delivered: z.string().optional(),
  })
  .optional();

export const checkoutSchema = z.object({
  fullName: z.string().min(3, "Họ tên phải có ít nhất 3 ký tự."),
  phone: z.string().min(9, "Số điện thoại không hợp lệ."),
  address: z.string().min(10, "Địa chỉ phải chi tiết hơn."),
  paymentMethod: z.enum(["cod", "bank", "online"]),
  note: z.string().optional(),
  items: z.array(cartItemSchema).min(1, "Giỏ hàng đang trống."),
});

export const authSchema = z.object({
  email: z.email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

export const registerSchema = authSchema.extend({
  name: z.string().min(3, "Tên phải có ít nhất 3 ký tự."),
});

export const reviewSchema = z.object({
  productId: z.string().min(1, "Thiếu sản phẩm cần đánh giá."),
  rating: z.coerce.number().int().min(1, "Vui lòng chọn số sao.").max(5, "Số sao tối đa là 5."),
  comment: z.string().min(10, "Nhận xét phải có ít nhất 10 ký tự.").max(1000, "Nhận xét quá dài."),
});

export const profileSchema = z.object({
  name: z.string().min(3, "Họ tên phải có ít nhất 3 ký tự."),
  email: z.email("Email không hợp lệ."),
  phone: z.string().min(9, "Số điện thoại không hợp lệ."),
  address: z.string().min(10, "Địa chỉ nhận hàng phải chi tiết hơn."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự."),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự."),
    confirmPassword: z.string().min(6, "Vui lòng nhập lại mật khẩu mới."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

const slugSchema = z
  .string()
  .min(2, "Slug phải có ít nhất 2 ký tự.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ được gồm chữ thường, số và dấu gạch ngang.");

export const adminCategorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự."),
  slug: slugSchema,
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự."),
  icon: z.enum(CATEGORY_ICON_OPTIONS),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().nonnegative("Thứ tự hiển thị không hợp lệ.").default(0),
});

export const adminProductSchema = z.object({
  name: z.string().min(3, "Tên sản phẩm phải có ít nhất 3 ký tự."),
  slug: slugSchema,
  categoryId: z.string().min(1, "Vui lòng chọn danh mục."),
  brand: z.string().min(2, "Thương hiệu phải có ít nhất 2 ký tự."),
  price: z.coerce.number().nonnegative("Giá không hợp lệ."),
  originalPrice: z.coerce.number().nonnegative("Giá gốc không hợp lệ.").optional().nullable(),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().nonnegative().default(0),
  stock: z.coerce.number().int().nonnegative("Tồn kho không hợp lệ."),
  image: imageUrlSchema,
  gallery: z.array(imageUrlSchema).min(1, "Cần ít nhất 1 ảnh."),
  shortDescription: z.string().min(10, "Mô tả ngắn phải có ít nhất 10 ký tự."),
  description: z.string().min(20, "Mô tả chi tiết phải có ít nhất 20 ký tự."),
  specs: z.record(z.string(), z.string()).default({}),
  tags: z.array(z.string().min(1)).default([]),
  featured: z.boolean().default(false),
  onSale: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

export const adminOrderSchema = z.object({
  userId: z.string().optional().nullable(),
  customerName: z.string().min(3, "Tên khách hàng phải có ít nhất 3 ký tự."),
  customerEmail: z.email("Email khách hàng không hợp lệ.").optional().nullable(),
  phone: z.string().min(9, "Số điện thoại không hợp lệ."),
  address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự."),
  paymentMethod: z.enum(["cod", "bank", "online"]),
  status: z.enum(["pending", "confirmed", "shipping", "delivered"]),
  total: z.coerce.number().nonnegative("Tổng tiền không hợp lệ."),
  note: z.string().optional().nullable(),
  items: z.array(cartItemSchema).default([]),
  statusTimeline: orderStatusTimelineSchema,
});

export const adminUserSchema = z.object({
  name: z.string().min(3, "Tên phải có ít nhất 3 ký tự."),
  email: z.email("Email không hợp lệ."),
  role: z.enum(["customer", "admin"]),
  status: z.enum(["active", "locked"]),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự.").optional(),
});

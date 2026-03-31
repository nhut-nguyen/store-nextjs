export const CATEGORY_ICON_OPTIONS = [
  "Laptop",
  "MonitorSmartphone",
  "Smartphone",
  "Monitor",
  "Headphones",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICON_OPTIONS)[number];

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: CategoryIcon;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  image: string;
  gallery: string[];
  shortDescription: string;
  description: string;
  specs: Record<string, string>;
  featured?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  tags: string[];
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: string;
  category: string;
  publishedAt: string;
  readTime: string;
  content: string[];
};

export type Review = {
  id: string;
  productId: string;
  userId?: string | null;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  status?: "pending" | "approved";
};

export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered";

export type PaymentMethod = "cod" | "bank" | "online";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
};

export type OrderItem = CartItem;

export type OrderStatusTimeline = Partial<Record<OrderStatus, string>>;

export type Order = {
  id: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string;
  phone: string;
  address: string;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  total: number;
  createdAt: string;
  note?: string;
  items: OrderItem[];
  statusTimeline?: OrderStatusTimeline;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: "customer" | "admin";
  status: "active" | "locked";
  createdAt: string;
};

export type SessionUser = Pick<User, "id" | "name" | "email" | "phone" | "address" | "role" | "status">;

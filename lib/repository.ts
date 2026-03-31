import { createHash } from "node:crypto";
import sql from "mssql";
import {
  blogPosts,
  categories,
  orders,
  products,
  reviews,
  users,
} from "@/lib/data";
import type { BlogPost, Category, Order, OrderStatus, Product, Review, SessionUser, User } from "@/lib/types";

type ProductFilters = {
  category?: string;
  brand?: string;
  search?: string;
  priceRange?: string;
};

type CategoryQueryOptions = {
  includeInactive?: boolean;
};

type CreateOrderInput = Omit<Order, "id" | "createdAt" | "status" | "customerEmail" | "note"> & {
  customerEmail?: string | null;
  note?: string | null;
  status?: Order["status"];
};

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

type CreateReviewInput = {
  productId: string;
  rating: number;
  comment: string;
  user: SessionUser;
};

type CategoryMutationInput = Omit<Category, "id" | "createdAt" | "updatedAt">;
type ProductMutationInput = Omit<Product, "id" | "originalPrice"> & {
  originalPrice?: number | null;
};
type OrderMutationInput = Omit<Order, "id" | "createdAt" | "note" | "customerEmail"> & {
  note?: string | null;
  customerEmail?: string | null;
};
type UserMutationInput = {
  name: string;
  email: string;
  role: User["role"];
  status: User["status"];
  password?: string;
};

type ProfileUpdateInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

let poolPromise: Promise<any> | null = null;
const tableColumnCache = new Map<string, Promise<Set<string>>>();
const localCategories = categories.map((item) => ({ ...item }));
const localProducts = products.map((item) => ({
  ...item,
  gallery: [...item.gallery],
  specs: { ...item.specs },
  tags: [...item.tags],
}));
const localBlogPosts = blogPosts.map((item) => ({ ...item, content: [...item.content] }));
const localReviews = reviews.map((item) => ({ ...item }));
const orderStatusFlow: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered"];
const localOrders = orders.map((item) => {
  const normalizedOrder = {
    ...item,
    items: item.items.map((entry) => ({ ...entry })),
  };

  return {
    ...normalizedOrder,
    statusTimeline: buildStatusTimelineOnCreate(
      normalizedOrder.status,
      normalizedOrder.createdAt,
      normalizedOrder.statusTimeline,
    ),
  };
});
const localUsers = users.map((item) => ({ ...item }));
const localPasswords = new Map<string, string>([
  ["trandongquan9@gmail.com", "admin123"],
  ["hai@gmail.com", "123456"],
  ["linh@gmail.com", "123456"],
]);

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...fallback.filter((item) => !seen.has(item.id))];
}

function normalizeCategory(category: Partial<Category> & Pick<Category, "id" | "name" | "slug" | "description" | "icon">): Category {
  const now = new Date().toISOString();
  return {
    id: category.id,
    name: category.name.trim(),
    slug: category.slug.trim(),
    description: category.description.trim(),
    icon: category.icon,
    isActive: category.isActive ?? true,
    sortOrder: Number.isFinite(category.sortOrder) ? Math.max(0, Math.floor(Number(category.sortOrder))) : 0,
    createdAt: category.createdAt ?? now,
    updatedAt: category.updatedAt ?? category.createdAt ?? now,
  };
}

function sortCategories(list: Category[]) {
  return [...list].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function replaceLocalCategory(nextCategory: Category) {
  const currentIndex = localCategories.findIndex((item) => item.id === nextCategory.id);
  if (currentIndex >= 0) {
    localCategories[currentIndex] = nextCategory;
    return;
  }

  localCategories.unshift(nextCategory);
}

function categoryConflictError(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 409;
  return error;
}

function isDuplicateCategoryError(error: unknown) {
  const anyError = error as { number?: number; message?: string } | null | undefined;
  if (anyError?.number === 2601 || anyError?.number === 2627) {
    return true;
  }

  const message = anyError?.message?.toLowerCase() ?? "";
  return (
    message.includes("duplicate") ||
    message.includes("unique") ||
    message.includes("already exists")
  );
}

async function ensureCategorySlugAvailable(slug: string, currentId?: string) {
  const categories = await getCategories({ includeInactive: true });
  const normalizedSlug = slug.trim().toLowerCase();
  const conflict = categories.find(
    (item) => item.slug.trim().toLowerCase() === normalizedSlug && item.id !== currentId,
  );

  if (conflict) {
    throw categoryConflictError("Slug danh mục đã tồn tại.");
  }
}

function mergeOrderWithFallback(primary: Order, fallback?: Order) {
  if (!fallback) {
    return primary;
  }

  return {
    ...fallback,
    ...primary,
    userId: primary.userId ?? fallback.userId,
    customerEmail: primary.customerEmail ?? fallback.customerEmail,
    note: primary.note ?? fallback.note,
    items: primary.items.length > 0 ? primary.items : fallback.items,
    statusTimeline: {
      ...fallback.statusTimeline,
      ...primary.statusTimeline,
    },
  };
}

function normalizeStatusTimeline(createdAt: string, timeline?: Order["statusTimeline"]) {
  return {
    pending: createdAt,
    ...timeline,
  } satisfies NonNullable<Order["statusTimeline"]>;
}

function buildStatusTimelineOnCreate(
  status: OrderStatus,
  createdAt: string,
  timeline?: Order["statusTimeline"],
) {
  const nextTimeline = normalizeStatusTimeline(createdAt, timeline);

  if (status !== "pending" && !nextTimeline[status]) {
    nextTimeline[status] = createdAt;
  }

  return nextTimeline;
}

function buildStatusTimelineOnUpdate(
  status: OrderStatus,
  createdAt: string,
  timeline?: Order["statusTimeline"],
  updatedAt = new Date().toISOString(),
) {
  const nextTimeline = normalizeStatusTimeline(createdAt, timeline);
  const targetIndex = orderStatusFlow.indexOf(status);

  for (let index = targetIndex + 1; index < orderStatusFlow.length; index += 1) {
    delete nextTimeline[orderStatusFlow[index]];
  }

  nextTimeline[status] = updatedAt;
  return nextTimeline;
}

function replaceLocalOrder(nextOrder: Order) {
  const nextLocalOrder = {
    ...nextOrder,
    items: nextOrder.items.map((entry) => ({ ...entry })),
    statusTimeline: normalizeStatusTimeline(nextOrder.createdAt, nextOrder.statusTimeline),
  };
  const currentIndex = localOrders.findIndex((item) => item.id === nextOrder.id);

  if (currentIndex >= 0) {
    localOrders[currentIndex] = nextLocalOrder;
    return;
  }

  localOrders.unshift(nextLocalOrder);
}

function syncLocalProductRating(productId: string, reviewsForProduct: Review[]) {
  const approvedReviews = reviewsForProduct.filter((item) => (item.status ?? "approved") === "approved");
  const reviewCount = approvedReviews.length;
  const rating =
    reviewCount > 0
      ? Number((approvedReviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount).toFixed(1))
      : 0;
  const productIndex = localProducts.findIndex((item) => item.id === productId);

  if (productIndex !== -1) {
    localProducts[productIndex] = {
      ...localProducts[productIndex],
      reviewCount,
      rating,
    };
  }
}

async function syncProductRatingInDatabase(productId: string, reviewsForProduct: Review[]) {
  const pool = await getPool();
  if (!pool) {
    syncLocalProductRating(productId, reviewsForProduct);
    return;
  }

  const approvedReviews = reviewsForProduct.filter((item) => (item.status ?? "approved") === "approved");
  const reviewCount = approvedReviews.length;
  const rating =
    reviewCount > 0
      ? Number((approvedReviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount).toFixed(1))
      : 0;

  await pool
    .request()
    .input("id", sql.VarChar, productId)
    .input("reviewCount", sql.Int, reviewCount)
    .input("rating", sql.Decimal(3, 2), rating)
    .query(`
      UPDATE Products
      SET ReviewCount = @reviewCount, Rating = @rating
      WHERE Id = @id
    `);

  syncLocalProductRating(productId, reviewsForProduct);
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isMissingColumnError(error: unknown, columnName: string) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("invalid column name") &&
    error.message.toLowerCase().includes(columnName.toLowerCase())
  );
}

function isForeignKeyProductError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("foreign key constraint") &&
    error.message.toLowerCase().includes("products")
  );
}

function hashPassword(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function generateId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeProductInput(input: ProductMutationInput): Omit<Product, "id"> {
  const gallery = input.gallery.length > 0 ? input.gallery : [input.image];

  return {
    ...input,
    originalPrice: input.originalPrice ?? undefined,
    image: input.image.trim(),
    gallery,
    specs: Object.fromEntries(
      Object.entries(input.specs).filter(([key, value]) => key.trim() && value.trim()),
    ),
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
  };
}

function matchesPrice(product: Product, priceRange?: string) {
  if (!priceRange) return true;
  if (priceRange === "under-10") return product.price < 10_000_000;
  if (priceRange === "10-30") return product.price >= 10_000_000 && product.price <= 30_000_000;
  if (priceRange === "30-plus") return product.price > 30_000_000;
  return true;
}

function filterProducts(list: Product[], filters?: ProductFilters) {
  return list.filter((product) => {
    const term = filters?.search?.trim().toLowerCase();
    const matchSearch = term
      ? product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.tags.some((tag) => tag.toLowerCase().includes(term))
      : true;

    return (
      (!filters?.category || product.categoryId === filters.category) &&
      (!filters?.brand || product.brand === filters.brand) &&
      matchSearch &&
      matchesPrice(product, filters?.priceRange)
    );
  });
}

function toSessionUser(
  user: Pick<User, "id" | "name" | "email" | "phone" | "address" | "role" | "status">,
): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    status: user.status,
  };
}

export function isSqlServerConfigured() {
  return Boolean(
    process.env.SQLSERVER_USER &&
      process.env.SQLSERVER_PASSWORD &&
      process.env.SQLSERVER_HOST &&
      process.env.SQLSERVER_DATABASE,
  );
}

async function getPool() {
  if (!isSqlServerConfigured()) {
    return null;
  }

  if (!poolPromise) {
    poolPromise = new sql
      .ConnectionPool({
        user: process.env.SQLSERVER_USER,
        password: process.env.SQLSERVER_PASSWORD,
        server: process.env.SQLSERVER_HOST!,
        port: Number(process.env.SQLSERVER_PORT ?? 1433),
        database: process.env.SQLSERVER_DATABASE,
        options: {
          encrypt: process.env.SQLSERVER_ENCRYPT === "true",
          trustServerCertificate: true,
        },
      })
      .connect()
      .catch(() => {
        poolPromise = null;
        tableColumnCache.clear();
        return null;
      });
  }

  return poolPromise;
}

async function requirePool() {
  const pool = await getPool();
  if (!pool) {
    throw new Error("SQL Server chưa được cấu hình hoặc không khả dụng.");
  }

  return pool;
}

async function getTableColumns(tableName: string) {
  const pool = await getPool();
  if (!pool) {
    return new Set<string>();
  }

  if (!tableColumnCache.has(tableName)) {
    tableColumnCache.set(
      tableName,
      (async () => {
        const result = await pool
          .request()
          .input("tableName", sql.VarChar, tableName)
          .query(`
            SELECT COLUMN_NAME as name
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = @tableName
          `);

        return new Set(result.recordset.map((item: any) => String(item.name).toLowerCase()));
      })(),
    );
  }

  return tableColumnCache.get(tableName)!;
}

export async function getCategories(options: CategoryQueryOptions = {}): Promise<Category[]> {
  const pool = await getPool();
  if (!pool) {
    const visibleCategories = options.includeInactive ? localCategories : localCategories.filter((item) => item.isActive);
    return sortCategories(visibleCategories);
  }

  const columns = await getTableColumns("Categories");
  const hasIsActive = columns.has("isactive");
  const hasSortOrder = columns.has("sortorder");
  const hasCreatedAt = columns.has("createdat");
  const hasUpdatedAt = columns.has("updatedat");
  const selectParts = [
    "Id as id",
    "Name as name",
    "Slug as slug",
    "Description as description",
    "Icon as icon",
    `${hasIsActive ? "COALESCE(CAST(IsActive AS bit), 1)" : "CAST(1 AS bit)"} as isActive`,
    `${hasSortOrder ? "COALESCE(SortOrder, 0)" : "0"} as sortOrder`,
    `${hasCreatedAt ? "CONVERT(varchar(33), CreatedAt, 126)" : "CONVERT(varchar(33), GETDATE(), 126)"} as createdAt`,
    `${hasUpdatedAt ? "CONVERT(varchar(33), UpdatedAt, 126)" : "CONVERT(varchar(33), GETDATE(), 126)"} as updatedAt`,
  ];
  const result = await pool.request().query(`
    SELECT
      ${selectParts.join(",\n      ")}
    FROM Categories
    ${!options.includeInactive && hasIsActive ? "WHERE COALESCE(CAST(IsActive AS bit), 1) = 1" : ""}
    ORDER BY ${hasSortOrder ? "COALESCE(SortOrder, 0)" : "0"} ASC, Name ASC
  `);

  const fromDb = (result.recordset as Array<Partial<Category> & Pick<Category, "id" | "name" | "slug" | "description" | "icon">>).map(normalizeCategory);
  const merged = mergeById(fromDb, localCategories);
  const visibleCategories = options.includeInactive ? merged : merged.filter((item) => item.isActive);
  return sortCategories(visibleCategories);
}

export async function createCategory(input: CategoryMutationInput) {
  await ensureCategorySlugAvailable(input.slug);
  const now = new Date().toISOString();
  const nextCategory = normalizeCategory({
    id: generateId("cat-"),
    createdAt: now,
    updatedAt: now,
    ...input,
  });

  const pool = await getPool();
  if (!pool) {
    replaceLocalCategory(nextCategory);
    return nextCategory;
  }

  const request = pool.request();
  request.input("id", sql.VarChar, nextCategory.id);
  request.input("name", sql.NVarChar, nextCategory.name);
  request.input("slug", sql.VarChar, nextCategory.slug);
  request.input("description", sql.NVarChar, nextCategory.description);
  request.input("icon", sql.VarChar, nextCategory.icon);
  request.input("isActive", sql.Bit, nextCategory.isActive);
  request.input("sortOrder", sql.Int, nextCategory.sortOrder);
  request.input("createdAt", sql.DateTime2, nextCategory.createdAt);
  request.input("updatedAt", sql.DateTime2, nextCategory.updatedAt);

  const columns = await getTableColumns("Categories");
  const fieldNames = ["Id", "Name", "Slug", "Description", "Icon"];
  const valueNames = ["@id", "@name", "@slug", "@description", "@icon"];

  if (columns.has("isactive")) {
    fieldNames.push("IsActive");
    valueNames.push("@isActive");
  }

  if (columns.has("sortorder")) {
    fieldNames.push("SortOrder");
    valueNames.push("@sortOrder");
  }

  if (columns.has("createdat")) {
    fieldNames.push("CreatedAt");
    valueNames.push("@createdAt");
  }

  if (columns.has("updatedat")) {
    fieldNames.push("UpdatedAt");
    valueNames.push("@updatedAt");
  }

  try {
    await request.query(`
      INSERT INTO Categories (${fieldNames.join(", ")})
      VALUES (${valueNames.join(", ")})
    `);
  } catch (error) {
    if (isDuplicateCategoryError(error)) {
      throw categoryConflictError("Slug danh mục đã tồn tại.");
    }

    throw error;
  }

  return nextCategory;
}

export async function updateCategory(id: string, input: CategoryMutationInput) {
  const pool = await getPool();
  await ensureCategorySlugAvailable(input.slug, id);
  const now = new Date().toISOString();
  const nextCategory = normalizeCategory({
    id,
    createdAt: now,
    updatedAt: now,
    ...input,
  });

  if (!pool) {
    replaceLocalCategory(nextCategory);
    return nextCategory;
  }

  const request = pool.request();
  request.input("id", sql.VarChar, id);
  request.input("name", sql.NVarChar, nextCategory.name);
  request.input("slug", sql.VarChar, nextCategory.slug);
  request.input("description", sql.NVarChar, nextCategory.description);
  request.input("icon", sql.VarChar, nextCategory.icon);
  request.input("isActive", sql.Bit, nextCategory.isActive);
  request.input("sortOrder", sql.Int, nextCategory.sortOrder);
  request.input("createdAt", sql.DateTime2, nextCategory.createdAt);
  request.input("updatedAt", sql.DateTime2, nextCategory.updatedAt);

  const columns = await getTableColumns("Categories");
  const setParts = ["Name = @name", "Slug = @slug", "Description = @description", "Icon = @icon"];

  if (columns.has("isactive")) {
    setParts.push("IsActive = @isActive");
  }

  if (columns.has("sortorder")) {
    setParts.push("SortOrder = @sortOrder");
  }

  if (columns.has("updatedat")) {
    setParts.push("UpdatedAt = @updatedAt");
  }

  try {
    await request.query(`
      UPDATE Categories
      SET ${setParts.join(", ")}
      WHERE Id = @id
    `);
  } catch (error) {
    if (isDuplicateCategoryError(error)) {
      throw categoryConflictError("Slug danh mục đã tồn tại.");
    }

    throw error;
  }

  return nextCategory;
}

export async function deleteCategory(id: string) {
  const categoryProducts = (await getProducts()).filter((item) => item.categoryId === id);
  if (categoryProducts.length > 0) {
    throw categoryConflictError("Không thể xóa danh mục đang có sản phẩm.");
  }

  const pool = await getPool();
  if (!pool) {
    const index = localCategories.findIndex((item) => item.id === id);
    if (index >= 0) {
      localCategories.splice(index, 1);
    }
    return;
  }

  const request = pool.request();
  request.input("id", sql.VarChar, id);
  try {
    await request.query(`DELETE FROM Categories WHERE Id = @id`);
  } catch (error) {
    const anyError = error as { number?: number; message?: string } | null | undefined;
    if (
      anyError?.number === 547 ||
      (anyError?.message?.toLowerCase().includes("foreign key") ?? false)
    ) {
      throw categoryConflictError("Không thể xóa danh mục đang có sản phẩm.");
    }

    throw error;
  }
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const pool = await getPool();
  if (!pool) {
    return filterProducts(localProducts, filters);
  }

  const request = pool.request();
  let query = `
    SELECT
      Id as id,
      Name as name,
      Slug as slug,
      CategoryId as categoryId,
      Brand as brand,
      Price as price,
      OriginalPrice as originalPrice,
      Rating as rating,
      ReviewCount as reviewCount,
      Stock as stock,
      Image as image,
      GalleryJson as galleryJson,
      ShortDescription as shortDescription,
      Description as description,
      SpecsJson as specsJson,
      TagsJson as tagsJson,
      Featured as featured,
      OnSale as onSale,
      IsNew as isNew
    FROM Products
    WHERE 1 = 1
  `;

  if (filters?.category) {
    query += " AND CategoryId = @category";
    request.input("category", sql.VarChar, filters.category);
  }

  if (filters?.brand) {
    query += " AND Brand = @brand";
    request.input("brand", sql.NVarChar, filters.brand);
  }

  if (filters?.search) {
    query += " AND (Name LIKE @search OR Brand LIKE @search)";
    request.input("search", sql.NVarChar, `%${filters.search}%`);
  }

  const result = await request.query(query);
  const fromDb = result.recordset.map((item: any) => ({
    ...item,
    gallery: parseJson<string[]>(item.galleryJson, [item.image]),
    specs: parseJson<Record<string, string>>(item.specsJson, {}),
    tags: parseJson<string[]>(item.tagsJson, []),
    featured: Boolean(item.featured),
    onSale: Boolean(item.onSale),
    isNew: Boolean(item.isNew),
  })) as Product[];

  return filterProducts(mergeById(fromDb, localProducts), filters);
}

export async function createProduct(input: ProductMutationInput) {
  const nextProduct: Product = {
    id: generateId("p"),
    ...normalizeProductInput(input),
  };

  const pool = await requirePool();
  const request = pool.request();
  request.input("id", sql.VarChar, nextProduct.id);
  request.input("categoryId", sql.VarChar, nextProduct.categoryId);
  request.input("name", sql.NVarChar, nextProduct.name);
  request.input("slug", sql.VarChar, nextProduct.slug);
  request.input("brand", sql.NVarChar, nextProduct.brand);
  request.input("price", sql.Decimal(18, 0), nextProduct.price);
  request.input("originalPrice", sql.Decimal(18, 0), nextProduct.originalPrice ?? null);
  request.input("rating", sql.Decimal(3, 2), nextProduct.rating);
  request.input("reviewCount", sql.Int, nextProduct.reviewCount);
  request.input("stock", sql.Int, nextProduct.stock);
  request.input("image", sql.NVarChar, nextProduct.image);
  request.input("galleryJson", sql.NVarChar(sql.MAX), JSON.stringify(nextProduct.gallery));
  request.input("shortDescription", sql.NVarChar, nextProduct.shortDescription);
  request.input("description", sql.NVarChar(sql.MAX), nextProduct.description);
  request.input("specsJson", sql.NVarChar(sql.MAX), JSON.stringify(nextProduct.specs));
  request.input("tagsJson", sql.NVarChar(sql.MAX), JSON.stringify(nextProduct.tags));
  request.input("featured", sql.Bit, nextProduct.featured ?? false);
  request.input("onSale", sql.Bit, nextProduct.onSale ?? false);
  request.input("isNew", sql.Bit, nextProduct.isNew ?? false);

  await request.query(`
    INSERT INTO Products (
      Id, CategoryId, Name, Slug, Brand, Price, OriginalPrice, Rating, ReviewCount, Stock, Image,
      GalleryJson, ShortDescription, Description, SpecsJson, TagsJson, Featured, OnSale, IsNew
    )
    VALUES (
      @id, @categoryId, @name, @slug, @brand, @price, @originalPrice, @rating, @reviewCount, @stock, @image,
      @galleryJson, @shortDescription, @description, @specsJson, @tagsJson, @featured, @onSale, @isNew
    )
  `);

  return nextProduct;
}

export async function updateProduct(id: string, input: ProductMutationInput) {
  const nextProduct: Product = {
    id,
    ...normalizeProductInput(input),
  };

  const pool = await requirePool();
  {
    const request = pool.request();
    request.input("id", sql.VarChar, id);
    request.input("categoryId", sql.VarChar, nextProduct.categoryId);
    request.input("name", sql.NVarChar, nextProduct.name);
    request.input("slug", sql.VarChar, nextProduct.slug);
    request.input("brand", sql.NVarChar, nextProduct.brand);
    request.input("price", sql.Decimal(18, 0), nextProduct.price);
    request.input("originalPrice", sql.Decimal(18, 0), nextProduct.originalPrice ?? null);
    request.input("rating", sql.Decimal(3, 2), nextProduct.rating);
    request.input("reviewCount", sql.Int, nextProduct.reviewCount);
    request.input("stock", sql.Int, nextProduct.stock);
    request.input("image", sql.NVarChar, nextProduct.image);
    request.input("galleryJson", sql.NVarChar(sql.MAX), JSON.stringify(nextProduct.gallery));
    request.input("shortDescription", sql.NVarChar, nextProduct.shortDescription);
    request.input("description", sql.NVarChar(sql.MAX), nextProduct.description);
    request.input("specsJson", sql.NVarChar(sql.MAX), JSON.stringify(nextProduct.specs));
    request.input("tagsJson", sql.NVarChar(sql.MAX), JSON.stringify(nextProduct.tags));
    request.input("featured", sql.Bit, nextProduct.featured ?? false);
    request.input("onSale", sql.Bit, nextProduct.onSale ?? false);
    request.input("isNew", sql.Bit, nextProduct.isNew ?? false);

    await request.query(`
      UPDATE Products
      SET
        CategoryId = @categoryId,
        Name = @name,
        Slug = @slug,
        Brand = @brand,
        Price = @price,
        OriginalPrice = @originalPrice,
        Rating = @rating,
        ReviewCount = @reviewCount,
        Stock = @stock,
        Image = @image,
        GalleryJson = @galleryJson,
        ShortDescription = @shortDescription,
        Description = @description,
        SpecsJson = @specsJson,
        TagsJson = @tagsJson,
        Featured = @featured,
        OnSale = @onSale,
        IsNew = @isNew
      WHERE Id = @id
    `);
  }

  return nextProduct;
}

export async function deleteProduct(id: string) {
  const pool = await requirePool();
  const request = pool.request();
  request.input("id", sql.VarChar, id);
  await request.query(`DELETE FROM Products WHERE Id = @id`);
}

export async function getProductBySlug(slug: string) {
  const data = await getProducts();
  return data.find((product) => product.slug === slug) ?? null;
}

export async function getProductById(productId: string) {
  const data = await getProducts();
  return data.find((product) => product.id === productId) ?? null;
}

export async function getFeaturedProducts() {
  const data = await getProducts();
  return data.filter((product) => product.featured);
}

export async function getSaleProducts() {
  const data = await getProducts();
  return data.filter((product) => product.onSale);
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const pool = await getPool();
  if (!pool) {
    return localBlogPosts;
  }

  const result = await pool.request().query(`
    SELECT
      Id as id,
      Title as title,
      Slug as slug,
      Excerpt as excerpt,
      Cover as cover,
      Category as category,
      PublishedAt as publishedAt,
      ReadTime as readTime,
      ContentJson as contentJson
    FROM BlogPosts
    ORDER BY PublishedAt DESC
  `);

  const fromDb = result.recordset.map((item: any) => ({
    ...item,
    publishedAt: new Date(item.publishedAt).toISOString(),
    content: parseJson<string[]>(item.contentJson, []),
  })) as BlogPost[];

  return mergeById(fromDb, localBlogPosts);
}

export async function getBlogPostBySlug(slug: string) {
  const data = await getBlogPosts();
  return data.find((post) => post.slug === slug) ?? null;
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const pool = await getPool();
  if (!pool) {
    return localReviews
      .filter((item) => item.productId === productId && (item.status ?? "approved") === "approved")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const request = pool.request();
  request.input("productId", sql.VarChar, productId);
  const columns = await getTableColumns("Reviews");
  let recordset: any[] = [];

  try {
    const result = await request.query(`
      SELECT
        Id as id,
        ProductId as productId,
        UserId as userId,
        Author as author,
        Rating as rating,
        Comment as comment,
        ${columns.has("status") ? "Status" : "'approved'"} as status,
        CreatedAt as createdAt
      FROM Reviews
      WHERE ProductId = @productId
      ORDER BY CreatedAt DESC
    `);
    recordset = result.recordset;
  } catch (error) {
    if (!isMissingColumnError(error, "UserId")) {
      throw error;
    }

    const legacyResult = await request.query(`
      SELECT
        Id as id,
        ProductId as productId,
        Author as author,
        Rating as rating,
        Comment as comment,
        'approved' as status,
        CreatedAt as createdAt
      FROM Reviews
      WHERE ProductId = @productId
      ORDER BY CreatedAt DESC
    `);
    recordset = legacyResult.recordset.map((item: any) => ({ ...item, userId: null }));
  }

  return mergeById(
    recordset.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt).toISOString(),
    })),
    localReviews.filter((item) => item.productId === productId),
  ).filter((item) => (item.status ?? "approved") === "approved");
}

export async function getReviews(): Promise<Review[]> {
  const pool = await getPool();
  if (!pool) {
    return localReviews.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  let recordset: any[] = [];
  const columns = await getTableColumns("Reviews");

  try {
    const result = await pool.request().query(`
      SELECT
        Id as id,
        ProductId as productId,
        UserId as userId,
        Author as author,
        Rating as rating,
        Comment as comment,
        ${columns.has("status") ? "Status" : "'approved'"} as status,
        CreatedAt as createdAt
      FROM Reviews
      ORDER BY CreatedAt DESC
    `);
    recordset = result.recordset;
  } catch (error) {
    if (!isMissingColumnError(error, "UserId")) {
      throw error;
    }

    const legacyResult = await pool.request().query(`
      SELECT
        Id as id,
        ProductId as productId,
        Author as author,
        Rating as rating,
        Comment as comment,
        'approved' as status,
        CreatedAt as createdAt
      FROM Reviews
      ORDER BY CreatedAt DESC
    `);
    recordset = legacyResult.recordset.map((item: any) => ({ ...item, userId: null }));
  }

  return mergeById(
    recordset.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt).toISOString(),
    })),
    localReviews,
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getReviewByProductAndUser(productId: string, userId: string) {
  const reviews = await getReviews();
  return reviews.find((item) => item.productId === productId && item.userId === userId) ?? null;
}

export async function createReview(input: CreateReviewInput) {
  const currentReviews = (await getReviews()).filter((item) => item.productId === input.productId);
  const existingReview = currentReviews.find((review) => review.userId === input.user.id);

  if (existingReview) {
    throw new Error("Bạn đã đánh giá sản phẩm này rồi.");
  }

  const nextReview: Review = {
    id: generateId("r"),
    productId: input.productId,
    userId: input.user.id,
    author: input.user.name,
    rating: input.rating,
    comment: input.comment,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  const pool = await getPool();
  const updatedReviews = [nextReview, ...currentReviews];

  if (pool) {
    const request = pool.request();
    request.input("id", sql.VarChar, nextReview.id);
    request.input("productId", sql.VarChar, nextReview.productId);
    request.input("author", sql.NVarChar, nextReview.author);
    request.input("rating", sql.Int, nextReview.rating);
    request.input("comment", sql.NVarChar, nextReview.comment);
    request.input("status", sql.VarChar, nextReview.status);
    request.input("createdAt", sql.DateTime, nextReview.createdAt);
    const columns = await getTableColumns("Reviews");

    try {
      if (columns.has("userid") && columns.has("status")) {
        request.input("userId", sql.VarChar, nextReview.userId ?? null);
        await request.query(`
          INSERT INTO Reviews (Id, ProductId, UserId, Author, Rating, Comment, Status, CreatedAt)
          VALUES (@id, @productId, @userId, @author, @rating, @comment, @status, @createdAt)
        `);
      } else if (columns.has("userid")) {
        request.input("userId", sql.VarChar, nextReview.userId ?? null);
        await request.query(`
          INSERT INTO Reviews (Id, ProductId, UserId, Author, Rating, Comment, CreatedAt)
          VALUES (@id, @productId, @userId, @author, @rating, @comment, @createdAt)
        `);
      } else if (columns.has("status")) {
        await request.query(`
          INSERT INTO Reviews (Id, ProductId, Author, Rating, Comment, Status, CreatedAt)
          VALUES (@id, @productId, @author, @rating, @comment, @status, @createdAt)
        `);
      } else {
        await request.query(`
          INSERT INTO Reviews (Id, ProductId, Author, Rating, Comment, CreatedAt)
          VALUES (@id, @productId, @author, @rating, @comment, @createdAt)
        `);
      }
      localReviews.unshift(nextReview);
      syncLocalProductRating(input.productId, updatedReviews);
    } catch (error) {
      if (!isForeignKeyProductError(error)) {
        throw error;
      }
      localReviews.unshift(nextReview);
      syncLocalProductRating(input.productId, updatedReviews);
      return nextReview;
    }
  } else {
    localReviews.unshift(nextReview);
    syncLocalProductRating(input.productId, updatedReviews);
  }

  return nextReview;
}

export async function approveReview(id: string) {
  const currentReviews = await getReviews();
  const targetReview = currentReviews.find((item) => item.id === id);
  if (!targetReview) {
    throw new Error("Không tìm thấy đánh giá cần duyệt.");
  }

  const nextReview: Review = {
    ...targetReview,
    status: "approved",
  };

  const pool = await getPool();
  if (pool) {
    const columns = await getTableColumns("Reviews");
    if (columns.has("status")) {
      await pool
        .request()
        .input("id", sql.VarChar, id)
        .input("status", sql.VarChar, "approved")
        .query(`
          UPDATE Reviews
          SET Status = @status
          WHERE Id = @id
        `);
    }
  }

  const localIndex = localReviews.findIndex((item) => item.id === id);
  if (localIndex !== -1) {
    localReviews[localIndex] = nextReview;
  } else {
    localReviews.unshift(nextReview);
  }

  syncLocalProductRating(
    nextReview.productId,
    currentReviews.map((item) => (item.id === id ? nextReview : item)).filter((item) => item.productId === nextReview.productId),
  );

  await syncProductRatingInDatabase(
    nextReview.productId,
    currentReviews.map((item) => (item.id === id ? nextReview : item)).filter((item) => item.productId === nextReview.productId),
  );

  return nextReview;
}

export async function deleteReview(id: string) {
  const currentReviews = await getReviews();
  const targetReview = currentReviews.find((item) => item.id === id);
  if (!targetReview) {
    throw new Error("Không tìm thấy đánh giá cần xóa.");
  }

  const pool = await getPool();
  if (pool) {
    const request = pool.request();
    request.input("id", sql.VarChar, id);
    await request.query(`DELETE FROM Reviews WHERE Id = @id`);

    await syncProductRatingInDatabase(
      targetReview.productId,
      currentReviews.filter((item) => item.id !== id && item.productId === targetReview.productId),
    );
  }

  const localIndex = localReviews.findIndex((item) => item.id === id);
  if (localIndex !== -1) {
    localReviews.splice(localIndex, 1);
  }
  syncLocalProductRating(
    targetReview.productId,
    localReviews.filter((item) => item.productId === targetReview.productId),
  );

  return { success: true };
}

export async function getAdminSummary() {
  const pool = await requirePool();
  const [productResult, orderResult, userResult, revenueResult] = await Promise.all([
    pool.request().query("SELECT COUNT(*) as totalProducts FROM Products"),
    pool.request().query("SELECT COUNT(*) as totalOrders FROM Orders"),
    pool.request().query("SELECT COUNT(*) as totalUsers FROM Users"),
    pool.request().query("SELECT ISNULL(SUM(Total), 0) as totalRevenue FROM Orders"),
  ]);

  return {
    totalProducts: productResult.recordset[0]?.totalProducts ?? 0,
    totalOrders: orderResult.recordset[0]?.totalOrders ?? 0,
    totalUsers: userResult.recordset[0]?.totalUsers ?? 0,
    totalRevenue: revenueResult.recordset[0]?.totalRevenue ?? 0,
  };
}

export async function getOrders(): Promise<Order[]> {
  const pool = await getPool();
  if (!pool) {
    return localOrders;
  }

  const columns = await getTableColumns("Orders");
  const result = await pool.request().query(`
    SELECT
      Id as id,
      ${columns.has("userid") ? "UserId" : "NULL"} as userId,
      CustomerName as customerName,
      ${columns.has("customeremail") ? "CustomerEmail" : "NULL"} as customerEmail,
      Phone as phone,
      Address as address,
      PaymentMethod as paymentMethod,
      Status as status,
      Total as total,
      ${columns.has("note") ? "Note" : "NULL"} as note,
      ${columns.has("itemsjson") ? "ItemsJson" : "NULL"} as itemsJson,
      ${columns.has("statustimelinejson") ? "StatusTimelineJson" : "NULL"} as statusTimelineJson,
      CreatedAt as createdAt
    FROM Orders
    ORDER BY CreatedAt DESC
  `);

  const fromDb = result.recordset.map((item: any) => {
    const currentOrder = {
      ...item,
      createdAt: new Date(item.createdAt).toISOString(),
      items: parseJson<Order["items"]>(item.itemsJson, []),
      statusTimeline: normalizeStatusTimeline(
        new Date(item.createdAt).toISOString(),
        parseJson<Order["statusTimeline"]>(item.statusTimelineJson, undefined),
      ),
    } as Order;

    return mergeOrderWithFallback(
      currentOrder,
      localOrders.find((localOrder) => localOrder.id === currentOrder.id),
    );
  });

  return mergeById(fromDb, localOrders);
}

export async function getOrdersByUserId(user: Pick<SessionUser, "id" | "email">) {
  const data = await getOrders();
  return data.filter(
    (order) =>
      order.userId === user.id ||
      ((!order.userId || order.userId.trim() === "") &&
        order.customerEmail?.toLowerCase() === user.email.toLowerCase()),
  );
}

export async function getOrderById(id: string) {
  const data = await getOrders();
  return data.find((order) => order.id === id) ?? null;
}

export async function createOrder(input: CreateOrderInput) {
  const createdAt = new Date().toISOString();
  const nextOrder: Order = {
    ...input,
    customerEmail: input.customerEmail ?? undefined,
    note: input.note ?? undefined,
    id: `OD${String(Date.now()).slice(-6)}`,
    createdAt,
    status: input.status ?? "pending",
    statusTimeline: buildStatusTimelineOnCreate(input.status ?? "pending", createdAt, input.statusTimeline),
  };

  const pool = await getPool();
  if (pool) {
    const columns = await getTableColumns("Orders");
    const request = pool.request();
    request.input("id", sql.VarChar, nextOrder.id);
    request.input("customerName", sql.NVarChar, nextOrder.customerName);
    request.input("phone", sql.VarChar, nextOrder.phone);
    request.input("address", sql.NVarChar, nextOrder.address);
    request.input("paymentMethod", sql.VarChar, nextOrder.paymentMethod);
    request.input("status", sql.VarChar, nextOrder.status);
    request.input("total", sql.Decimal(18, 0), nextOrder.total);
    request.input("createdAt", sql.DateTime, nextOrder.createdAt);

    const insertColumns = ["Id", "CustomerName", "Phone", "Address", "PaymentMethod", "Status", "Total", "CreatedAt"];
    const insertValues = [
      "@id",
      "@customerName",
      "@phone",
      "@address",
      "@paymentMethod",
      "@status",
      "@total",
      "@createdAt",
    ];

    if (columns.has("userid")) {
      request.input("userId", sql.VarChar, nextOrder.userId ?? null);
      insertColumns.splice(1, 0, "UserId");
      insertValues.splice(1, 0, "@userId");
    }

    if (columns.has("customeremail")) {
      request.input("customerEmail", sql.VarChar, nextOrder.customerEmail ?? null);
      insertColumns.splice(3, 0, "CustomerEmail");
      insertValues.splice(3, 0, "@customerEmail");
    }

    if (columns.has("note")) {
      request.input("note", sql.NVarChar, nextOrder.note ?? null);
      insertColumns.splice(insertColumns.length - 1, 0, "Note");
      insertValues.splice(insertValues.length - 1, 0, "@note");
    }

    if (columns.has("itemsjson")) {
      request.input("itemsJson", sql.NVarChar(sql.MAX), JSON.stringify(nextOrder.items));
      insertColumns.splice(insertColumns.length - 1, 0, "ItemsJson");
      insertValues.splice(insertValues.length - 1, 0, "@itemsJson");
    }

    if (columns.has("statustimelinejson")) {
      request.input("statusTimelineJson", sql.NVarChar(sql.MAX), JSON.stringify(nextOrder.statusTimeline));
      insertColumns.splice(insertColumns.length - 1, 0, "StatusTimelineJson");
      insertValues.splice(insertValues.length - 1, 0, "@statusTimelineJson");
    }

    await request.query(`
      INSERT INTO Orders (${insertColumns.join(", ")})
      VALUES (${insertValues.join(", ")})
    `);
    replaceLocalOrder(nextOrder);
  } else {
    replaceLocalOrder(nextOrder);
  }

  return nextOrder;
}

export async function updateOrder(id: string, input: OrderMutationInput) {
  const currentOrder = (await getOrders()).find((item) => item.id === id);
  const nextStatusTimeline =
    currentOrder?.status === input.status && currentOrder.statusTimeline
      ? currentOrder.statusTimeline
      : buildStatusTimelineOnUpdate(
          input.status,
          currentOrder?.createdAt ?? new Date().toISOString(),
          currentOrder?.statusTimeline ?? input.statusTimeline,
        );
  const nextOrder: Order = {
    id,
    createdAt: currentOrder?.createdAt ?? new Date().toISOString(),
    ...input,
    customerEmail: input.customerEmail ?? undefined,
    note: input.note ?? undefined,
    statusTimeline: nextStatusTimeline,
  };

  const pool = await requirePool();
  {
    const columns = await getTableColumns("Orders");
    const request = pool.request();
    request.input("id", sql.VarChar, id);
    request.input("customerName", sql.NVarChar, nextOrder.customerName);
    request.input("phone", sql.VarChar, nextOrder.phone);
    request.input("address", sql.NVarChar, nextOrder.address);
    request.input("paymentMethod", sql.VarChar, nextOrder.paymentMethod);
    request.input("status", sql.VarChar, nextOrder.status);
    request.input("total", sql.Decimal(18, 0), nextOrder.total);

    const setParts = [
      "CustomerName = @customerName",
      "Phone = @phone",
      "Address = @address",
      "PaymentMethod = @paymentMethod",
      "Status = @status",
      "Total = @total",
    ];

    if (columns.has("userid")) {
      request.input("userId", sql.VarChar, nextOrder.userId ?? null);
      setParts.unshift("UserId = @userId");
    }

    if (columns.has("customeremail")) {
      request.input("customerEmail", sql.VarChar, nextOrder.customerEmail ?? null);
      setParts.splice(2, 0, "CustomerEmail = @customerEmail");
    }

    if (columns.has("note")) {
      request.input("note", sql.NVarChar, nextOrder.note ?? null);
      setParts.push("Note = @note");
    }

    if (columns.has("itemsjson")) {
      request.input("itemsJson", sql.NVarChar(sql.MAX), JSON.stringify(nextOrder.items));
      setParts.push("ItemsJson = @itemsJson");
    }

    if (columns.has("statustimelinejson")) {
      request.input("statusTimelineJson", sql.NVarChar(sql.MAX), JSON.stringify(nextOrder.statusTimeline));
      setParts.push("StatusTimelineJson = @statusTimelineJson");
    }

    await request.query(`
      UPDATE Orders
      SET ${setParts.join(", ")}
      WHERE Id = @id
    `);
  }

  replaceLocalOrder(nextOrder);

  return nextOrder;
}

export async function deleteOrder(id: string) {
  const pool = await requirePool();
  const request = pool.request();
  request.input("id", sql.VarChar, id);
  await request.query(`DELETE FROM Orders WHERE Id = @id`);
}

export async function getUsers(): Promise<User[]> {
  const pool = await getPool();
  if (!pool) {
    return localUsers;
  }

  const columns = await getTableColumns("Users");
  const hasPhone = columns.has("phone");
  const hasAddress = columns.has("address");

  const result = await pool.request().query(`
    SELECT
      Id as id,
      Name as name,
      Email as email,
      ${hasPhone ? "Phone" : "NULL"} as phone,
      ${hasAddress ? "Address" : "NULL"} as address,
      Role as role,
      Status as status,
      CreatedAt as createdAt
    FROM Users
    ORDER BY CreatedAt DESC
  `);

  const fromDb = result.recordset.map((item: any) => ({
    ...item,
    createdAt: new Date(item.createdAt).toISOString(),
  })) as User[];

  return mergeById(fromDb, localUsers);
}

export async function getUserByEmail(email: string) {
  const data = await getUsers();
  return data.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  try {
    const pool = await getPool();
    if (pool) {
      const request = pool.request();
      request.input("email", sql.VarChar, email);
      const columns = await getTableColumns("Users");
      const hasPhone = columns.has("phone");
      const hasAddress = columns.has("address");
      const hasPasswordHash = columns.has("passwordhash");

      if (hasPasswordHash) {
        const result = await request.query(`
          SELECT TOP 1
            Id as id,
            Name as name,
            Email as email,
            ${hasPhone ? "Phone" : "NULL"} as phone,
            ${hasAddress ? "Address" : "NULL"} as address,
            Role as role,
            Status as status,
            PasswordHash as passwordHash
          FROM Users
          WHERE Email = @email
        `);

        const user = result.recordset[0];
        if (!user || user.status !== "active" || user.passwordHash !== hashPassword(password)) {
          return null;
        }

        return toSessionUser(user);
      }
    }
  } catch {
    // Fall back to local demo credentials when SQL Server is unreachable or legacy schema lacks auth fields.
  }

  const user = localUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user || user.status !== "active") {
    return null;
  }

  if (localPasswords.get(user.email) !== password) {
    return null;
  }

  return toSessionUser(user);
}

export async function createUser(input: CreateUserInput): Promise<SessionUser> {
  const user = await createAdminUser({
    name: input.name,
    email: input.email,
    role: "customer",
    status: "active",
    password: input.password,
  });

  return toSessionUser(user);
}

export async function createAdminUser(input: UserMutationInput) {
  const existing = await getUserByEmail(input.email);
  if (existing) {
    throw new Error("Email đã tồn tại.");
  }

  const password = input.password ?? "123456";
  const nextUser: User = {
    id: generateId("u"),
    name: input.name,
    email: input.email,
    phone: "",
    address: "",
    role: input.role,
    status: input.status,
    createdAt: new Date().toISOString(),
  };

  const pool = await getPool();
  if (pool) {
    const request = pool.request();
    const columns = await getTableColumns("Users");
    const hasPhone = columns.has("phone");
    const hasAddress = columns.has("address");
    request.input("id", sql.VarChar, nextUser.id);
    request.input("name", sql.NVarChar, nextUser.name);
    request.input("email", sql.VarChar, nextUser.email);
    if (hasPhone) {
      request.input("phone", sql.VarChar, nextUser.phone ?? "");
    }
    if (hasAddress) {
      request.input("address", sql.NVarChar, nextUser.address ?? "");
    }
    request.input("role", sql.VarChar, nextUser.role);
    request.input("status", sql.VarChar, nextUser.status);
    request.input("createdAt", sql.DateTime, nextUser.createdAt);

    request.input("passwordHash", sql.VarChar, hashPassword(password));
    await request.query(`
      INSERT INTO Users (Id, Name, Email${hasPhone ? ", Phone" : ""}${hasAddress ? ", Address" : ""}, Role, Status, PasswordHash, CreatedAt)
      VALUES (@id, @name, @email${hasPhone ? ", @phone" : ""}${hasAddress ? ", @address" : ""}, @role, @status, @passwordHash, @createdAt)
    `);
  }

  localUsers.unshift(nextUser);
  localPasswords.set(nextUser.email, password);

  return nextUser;
}

export async function updateUser(id: string, input: UserMutationInput) {
  const currentUser = (await getUsers()).find((item) => item.id === id);
  if (!currentUser) {
    throw new Error("Không tìm thấy người dùng.");
  }

  if (input.email !== currentUser.email) {
    const duplicate = await getUserByEmail(input.email);
    if (duplicate && duplicate.id !== id) {
      throw new Error("Email đã tồn tại.");
    }
  }

  const nextUser: User = {
    id,
    createdAt: currentUser.createdAt,
    name: input.name,
    email: input.email,
    phone: currentUser.phone,
    address: currentUser.address,
    role: input.role,
    status: input.status,
  };

  const pool = await requirePool();
  {
    const request = pool.request();
    const columns = await getTableColumns("Users");
    const hasPhone = columns.has("phone");
    const hasAddress = columns.has("address");
    request.input("id", sql.VarChar, id);
    request.input("name", sql.NVarChar, nextUser.name);
    request.input("email", sql.VarChar, nextUser.email);
    if (hasPhone) {
      request.input("phone", sql.VarChar, nextUser.phone ?? "");
    }
    if (hasAddress) {
      request.input("address", sql.NVarChar, nextUser.address ?? "");
    }
    request.input("role", sql.VarChar, nextUser.role);
    request.input("status", sql.VarChar, nextUser.status);

    let query = `
      UPDATE Users
      SET Name = @name, Email = @email${hasPhone ? ", Phone = @phone" : ""}${hasAddress ? ", Address = @address" : ""}, Role = @role, Status = @status
    `;

    if (input.password) {
      request.input("passwordHash", sql.VarChar, hashPassword(input.password));
      query += ", PasswordHash = @passwordHash";
    }

    query += " WHERE Id = @id";
    await request.query(query);
  }

  return nextUser;
}

export async function updateCustomerProfile(userId: string, input: ProfileUpdateInput) {
  const currentUser = (await getUsers()).find((item) => item.id === userId);
  if (!currentUser) {
    throw new Error("Không tìm thấy tài khoản.");
  }

  if (input.email !== currentUser.email) {
    const duplicate = await getUserByEmail(input.email);
    if (duplicate && duplicate.id !== userId) {
      throw new Error("Email đã tồn tại.");
    }
  }

  const nextUser: User = {
    ...currentUser,
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
  };

  const pool = await getPool();
  if (pool) {
    const columns = await getTableColumns("Users");
    const hasPhone = columns.has("phone");
    const hasAddress = columns.has("address");
    const request = pool.request();

    request.input("id", sql.VarChar, userId);
    request.input("name", sql.NVarChar, nextUser.name);
    request.input("email", sql.VarChar, nextUser.email);
    if (hasPhone) {
      request.input("phone", sql.VarChar, nextUser.phone ?? "");
    }
    if (hasAddress) {
      request.input("address", sql.NVarChar, nextUser.address ?? "");
    }

    await request.query(`
      UPDATE Users
      SET Name = @name, Email = @email${hasPhone ? ", Phone = @phone" : ""}${hasAddress ? ", Address = @address" : ""}
      WHERE Id = @id
    `);
  }

  const index = localUsers.findIndex((item) => item.id === userId);
  if (index !== -1) {
    localUsers[index] = nextUser;
  }

  return toSessionUser(nextUser);
}

export async function changeUserPassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const currentUser = (await getUsers()).find((item) => item.id === userId);
  if (!currentUser) {
    throw new Error("Không tìm thấy tài khoản.");
  }

  const pool = await getPool();
  let isValidPassword = false;

  if (pool) {
    const request = pool.request();
    request.input("id", sql.VarChar, userId);
    const result = await request.query(`
      SELECT TOP 1 PasswordHash as passwordHash
      FROM Users
      WHERE Id = @id
    `);

    const passwordHash = result.recordset[0]?.passwordHash;
    isValidPassword = passwordHash === hashPassword(input.currentPassword);
  } else {
    isValidPassword = localPasswords.get(currentUser.email) === input.currentPassword;
  }

  if (!isValidPassword) {
    throw new Error("Mật khẩu hiện tại không đúng.");
  }

  if (pool) {
    const updateRequest = pool.request();
    updateRequest.input("id", sql.VarChar, userId);
    updateRequest.input("passwordHash", sql.VarChar, hashPassword(input.newPassword));
    await updateRequest.query(`
      UPDATE Users
      SET PasswordHash = @passwordHash
      WHERE Id = @id
    `);
  }

  localPasswords.set(currentUser.email, input.newPassword);
}

export async function deleteUser(id: string) {
  const currentUser = (await getUsers()).find((item) => item.id === id);
  if (!currentUser) {
    throw new Error("Không tìm thấy người dùng.");
  }

  const pool = await requirePool();
  const request = pool.request();
  request.input("id", sql.VarChar, id);
  await request.query(`DELETE FROM Users WHERE Id = @id`);
}

export async function getUserById(userId: string) {
  const data = await getUsers();
  return data.find((user) => user.id === userId) ?? null;
}

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "./roles";
import { ensureCategories, getCategoryBySlug, productStatusValidator } from "./app";
import { getCurrentUser } from "./users";

/** Authenticated upload URL for product/profile images. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in to upload images.");
    return await ctx.storage.generateUploadUrl();
  },
});

/** List all product categories from the reference table. */
export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories
      .map((c) => ({ id: c._id, name: c.name, slug: c.slug }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** Public marketplace listing: search, category filter, sort, pagination. */
export const listProducts = query({
  args: {
    search: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
    sort: v.optional(
      v.union(v.literal("newest"), v.literal("price_asc"), v.literal("price_desc")),
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 12, 1), 50);

    let page;
    let isDone = false;
    let continueCursor = "";

    if (args.search && args.search.trim()) {
      const term = args.search.trim();
      let searchQuery = ctx.db
        .query("products")
        .withSearchIndex("search_name", (s) =>
          s.search("name", term).eq("status", "available"),
        );
      if (args.categorySlug) {
        const category = await getCategoryBySlug(ctx, args.categorySlug);
        if (!category) return { page: [], isDone: true, continueCursor: "" };
        searchQuery = ctx.db
          .query("products")
          .withSearchIndex("search_name", (s) =>
            s
              .search("name", term)
              .eq("status", "available")
              .eq("categoryId", category._id),
          );
      }
      const result = await searchQuery.paginate({
        numItems: limit,
        cursor: args.cursor ?? null,
      });
      page = result.page;
      isDone = result.isDone;
      continueCursor = result.continueCursor;
    } else if (args.categorySlug) {
      const category = await getCategoryBySlug(ctx, args.categorySlug);
      if (!category) return { page: [], isDone: true, continueCursor: "" };
      const sort = args.sort ?? "newest";
      const result = await ctx.db
        .query("products")
        .withIndex(
          sort === "price_asc" || sort === "price_desc"
            ? "by_status_category_price"
            : "by_status_category",
          (q) => q.eq("status", "available").eq("categoryId", category._id),
        )
        .order(sort === "price_asc" ? "asc" : "desc")
        .paginate({ numItems: limit, cursor: args.cursor ?? null });
      page = result.page;
      isDone = result.isDone;
      continueCursor = result.continueCursor;
    } else {
      const sort = args.sort ?? "newest";
      const result = await ctx.db
        .query("products")
        .withIndex(
          sort === "price_asc" || sort === "price_desc"
            ? "by_status_price"
            : "by_status",
          (q) => q.eq("status", "available"),
        )
        .order(sort === "price_asc" ? "asc" : "desc")
        .paginate({ numItems: limit, cursor: args.cursor ?? null });
      page = result.page;
      isDone = result.isDone;
      continueCursor = result.continueCursor;
    }

    const products = await Promise.all(
      page.map(async (product) => {
        const [farmer, category, imageUrl] = await Promise.all([
          ctx.db.get(product.farmerId),
          ctx.db.get(product.categoryId),
          product.imageId ? ctx.storage.getUrl(product.imageId) : null,
        ]);
        return {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          unit: product.unit,
          location: product.location,
          status: product.status,
          imageUrl,
          categoryName: category?.name ?? "Other",
          farmerId: product.farmerId,
          farmerName: farmer?.name ?? "AgriLink farmer",
        };
      }),
    );

    return { page: products, isDone, continueCursor };
  },
});

/** Validate product input; throws on any invalid field. */
function validateProductInput(args: {
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
  location: string;
}) {
  const name = args.name.trim();
  if (!name) throw new Error("Product name is required.");
  if (name.length > 80) throw new Error("Product name is too long.");
  const description = args.description.trim();
  if (!description) throw new Error("Please add a short description.");
  if (!Number.isFinite(args.price) || args.price <= 0) {
    throw new Error("Price must be greater than zero.");
  }
  if (!Number.isFinite(args.quantity) || args.quantity < 0) {
    throw new Error("Quantity cannot be negative.");
  }
  const unit = args.unit.trim();
  if (!unit) throw new Error("Unit is required.");
  const location = args.location.trim();
  if (!location) throw new Error("Location is required.");
  return {
    name,
    description,
    unit,
    location,
    price: args.price,
    quantity: args.quantity,
  };
}

/** Farmer-only. Creates a product owned by the signed-in farmer. */
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    categorySlug: v.string(),
    price: v.number(),
    quantity: v.number(),
    unit: v.string(),
    location: v.string(),
    imageId: v.optional(v.id("_storage")),
    status: productStatusValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in to add a product.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmer accounts can list products.");
    }

    await ensureCategories(ctx);
    const category = await getCategoryBySlug(ctx, args.categorySlug);
    if (!category) throw new Error("Please choose a valid category.");

    const fields = validateProductInput(args);

    const productId = await ctx.db.insert("products", {
      farmerId: user._id,
      name: fields.name,
      description: fields.description,
      categoryId: category._id,
      price: fields.price,
      quantity: fields.quantity,
      unit: fields.unit,
      imageId: args.imageId,
      location: fields.location,
      status: args.status,
    });

    return { productId };
  },
});

/** Fetch a single product with farmer + category detail for the detail page. */
export const getProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    const farmer = product.farmerId ? await ctx.db.get(product.farmerId) : null;
    const category = await ctx.db.get(product.categoryId);
    let farmName: string | null = null;
    let farmDescription: string | null = null;
    if (farmer) {
      const farmerProfile = await ctx.db
        .query("farmerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", farmer._id))
        .unique();
      farmName = farmerProfile?.farmName ?? null;
      farmDescription = farmerProfile?.farmDescription ?? null;
    }
    const imageUrl = product.imageId
      ? await ctx.storage.getUrl(product.imageId)
      : null;
    return {
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      unit: product.unit,
      location: product.location,
      status: product.status,
      imageUrl,
      categoryName: category?.name ?? "Other",
      farmer: {
        id: product.farmerId,
        name: farmer?.name ?? "AgriLink farmer",
        image: farmer?.image ?? null,
        farmName,
        farmDescription,
      },
    };
  },
});

/** Related products: same category, available, excluding the current one. */
export const getRelatedProducts = query({
  args: { productId: v.id("products"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (product) {
      const related = await ctx.db
        .query("products")
        .withIndex("by_status_category", (q) =>
          q.eq("status", "available").eq("categoryId", product.categoryId),
        )
        .order("desc")
        .take((args.limit ?? 4) + 1);
      const filtered = related
        .filter((p) => p._id !== args.productId)
        .slice(0, args.limit ?? 4);
      const hydrated = await Promise.all(
        filtered.map(async (rel) => {
          const farmer = await ctx.db.get(rel.farmerId);
          const imageUrl = rel.imageId
            ? await ctx.storage.getUrl(rel.imageId)
            : null;
          return {
            id: rel._id,
            name: rel.name,
            price: rel.price,
            unit: rel.unit,
            imageUrl,
            location: rel.location,
            farmerName: farmer?.name ?? "AgriLink farmer",
          };
        }),
      );
      return hydrated;
    }
    return [];
  },
});

/** Farmer's own products (any status) with category + image detail. */
export const getMyProducts = query({
  args: {
    search: v.optional(v.string()),
    categorySlug: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmers can view their product list.");
    }

    let products = await ctx.db
      .query("products")
      .withIndex("by_farmer", (q) => q.eq("farmerId", user._id))
      .collect();

    if (args.search && args.search.trim()) {
      const term = args.search.trim().toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(term));
    }
    if (args.categorySlug && args.categorySlug !== "all") {
      const category = await getCategoryBySlug(ctx, args.categorySlug);
      products = products.filter((p) => p.categoryId === category?._id);
    }
    if (args.status === "available" || args.status === "unavailable") {
      products = products.filter((p) => p.status === args.status);
    }

    return Promise.all(
      products.map(async (product) => {
        const category = await ctx.db.get(product.categoryId);
        const imageUrl = product.imageId
          ? await ctx.storage.getUrl(product.imageId)
          : null;
        return {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          unit: product.unit,
          location: product.location,
          status: product.status,
          imageUrl,
          categoryName: category?.name ?? "Other",
        };
      }),
    );
  },
});

/** Fetch a farmer's own product for the edit form. Ownership is enforced. */
export const getMyProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmers can edit products.");
    }
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    if (product.farmerId !== user._id) {
      throw new Error("You can only edit your own products.");
    }
    const category = await ctx.db.get(product.categoryId);
    return {
      id: product._id,
      name: product.name,
      description: product.description,
      categorySlug: category?.slug ?? "other",
      price: product.price,
      quantity: product.quantity,
      unit: product.unit,
      location: product.location,
      status: product.status,
      imageId: product.imageId ?? null,
      imageUrl: product.imageId
        ? await ctx.storage.getUrl(product.imageId)
        : null,
    };
  },
});

/** Farmer-only. Update a product the caller owns. */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.string(),
    description: v.string(),
    categorySlug: v.string(),
    price: v.number(),
    quantity: v.number(),
    unit: v.string(),
    location: v.string(),
    imageId: v.optional(v.id("_storage")),
    status: productStatusValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmers can edit products.");
    }
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found.");
    if (product.farmerId !== user._id) {
      throw new Error("You can only edit your own products.");
    }

    const category = await getCategoryBySlug(ctx, args.categorySlug);
    if (!category) throw new Error("Please choose a valid category.");
    const fields = validateProductInput(args);

    await ctx.db.patch(args.productId, {
      name: fields.name,
      description: fields.description,
      categoryId: category._id,
      price: fields.price,
      quantity: fields.quantity,
      unit: fields.unit,
      location: fields.location,
      status: args.status,
      ...(args.imageId !== undefined ? { imageId: args.imageId } : {}),
    });
    return { ok: true };
  },
});

/** Farmer-only. Delete a product the caller owns. */
export const deleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmers can delete products.");
    }
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found.");
    if (product.farmerId !== user._id) {
      throw new Error("You can only delete your own products.");
    }
    await ctx.db.delete(args.productId);
    return { ok: true };
  },
});

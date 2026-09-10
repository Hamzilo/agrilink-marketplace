import { type MutationCtx, type QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const APP_NAME = "AgriLink";

export const roleValidator = v.union(
  v.literal("farmer"),
  v.literal("buyer"),
  v.literal("admin"),
);

export const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("cancelled"),
);

export const productStatusValidator = v.union(
  v.literal("available"),
  v.literal("unavailable"),
);

/** Every agricultural category that exists on the platform. */
export const CATEGORIES = [
  { name: "Grains", slug: "grains" },
  { name: "Vegetables", slug: "vegetables" },
  { name: "Fruits", slug: "fruits" },
  { name: "Tubers", slug: "tubers" },
  { name: "Livestock", slug: "livestock" },
  { name: "Poultry", slug: "poultry" },
  { name: "Fish", slug: "fish" },
  { name: "Farm Produce", slug: "farm-produce" },
  { name: "Other", slug: "other" },
] as const;

export const UNITS = [
  "kg",
  "bag",
  "crate",
  "bunch",
  "basket",
  "ton",
  "paint rubber",
  "piece",
  "litre",
  "tray",
] as const;

/**
 * Allowed order status transitions. Farmers drive the pipeline forward;
 * buyers may cancel an order while it is still pending.
 */
export const ORDER_TRANSITIONS: Record<
  string,
  { farmer: string[]; buyer: string[] }
> = {
  pending: { farmer: ["confirmed", "cancelled"], buyer: ["cancelled"] },
  confirmed: { farmer: ["processing", "cancelled"], buyer: [] },
  processing: { farmer: ["completed", "cancelled"], buyer: [] },
  completed: { farmer: [], buyer: [] },
  cancelled: { farmer: [], buyer: [] },
};

/** Ensure the category reference table is populated; safe to call concurrently. */
export async function ensureCategories(ctx: MutationCtx) {
  for (const category of CATEGORIES) {
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", category.slug))
      .unique();
    if (!existing) {
      await ctx.db.insert("categories", {
        name: category.name,
        slug: category.slug,
      });
    }
  }
}

export async function getCategoryBySlug(ctx: QueryCtx, slug: string) {
  return ctx.db
    .query("categories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
}

export type PublicUser = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
  role?: "farmer" | "buyer" | "admin";
  phone?: string;
  location?: string;
};

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { roleValidator, orderStatusValidator, productStatusValidator } from "./app";
import { authTables } from "@convex-dev/auth/server";

// AgriLink database schema. Convex Auth owns the users/auth tables; product,
// order, profile and notification tables below are application data with
// server-enforced ownership on every read and write.

const schema = defineSchema(
  {
    // Convex Auth tables (do not remove or modify).
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()), // do not remove
      image: v.optional(v.string()), // do not remove
      email: v.optional(v.string()), // do not remove
      emailVerificationTime: v.optional(v.number()), // do not remove
      isAnonymous: v.optional(v.boolean()), // do not remove
      role: v.optional(roleValidator), // do not remove
      phone: v.optional(v.string()),
      location: v.optional(v.string()),
    }).index("email", ["email"]), // do not remove or modify

    categories: defineTable({
      name: v.string(),
      slug: v.string(),
    }).index("by_slug", ["slug"]),

    products: defineTable({
      farmerId: v.id("users"),
      name: v.string(),
      description: v.string(),
      categoryId: v.id("categories"),
      price: v.number(), // naira per unit — server-side source of truth
      quantity: v.number(), // units in stock
      unit: v.string(),
      imageId: v.optional(v.id("_storage")),
      location: v.string(),
      status: productStatusValidator,
    })
      .index("by_farmer", ["farmerId"])
      .index("by_status", ["status"])
      .index("by_status_category", ["status", "categoryId"])
      .searchIndex("search_name", {
        searchField: "name",
        filterFields: ["status", "categoryId"],
      }),

    orders: defineTable({
      buyerId: v.id("users"),
      farmerId: v.id("users"),
      status: orderStatusValidator,
      totalAmount: v.number(),
      deliveryAddress: v.string(),
      buyerNote: v.optional(v.string()),
      clientToken: v.optional(v.string()), // idempotency key for checkout
    })
      .index("by_buyer", ["buyerId"])
      .index("by_farmer", ["farmerId"])
      .index("by_token", ["clientToken"]),

    // Line items snapshot name/price at purchase time; products can be
    // edited or deleted later without corrupting order history.
    orderItems: defineTable({
      orderId: v.id("orders"),
      productId: v.id("products"),
      productName: v.string(),
      quantity: v.number(),
      unit: v.string(),
      unitPrice: v.number(),
      subtotal: v.number(),
    }).index("by_order", ["orderId"]),

    farmerProfiles: defineTable({
      userId: v.id("users"),
      farmName: v.string(),
      farmDescription: v.string(),
      farmLocation: v.string(),
    }).index("by_user", ["userId"]),

    buyerProfiles: defineTable({
      userId: v.id("users"),
      businessName: v.string(),
      deliveryAddress: v.string(),
    }).index("by_user", ["userId"]),

    notifications: defineTable({
      userId: v.id("users"),
      title: v.string(),
      body: v.string(),
      link: v.optional(v.string()),
      read: v.boolean(),
    })
      .index("by_user", ["userId"])
      .index("by_user_read", ["userId", "read"]),
  },
  // Kept false to match the template; Convex Auth manages its own tables.
  { schemaValidation: false },
);

export default schema;

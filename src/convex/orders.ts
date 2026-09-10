import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "./roles";
import { APP_NAME, ORDER_TRANSITIONS } from "./app";
import { getCurrentUser, createNotification } from "./users";

type HydratedOrder = {
  id: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  buyerNote: string | null;
  createdAt: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }[];
  farmer: { name: string | null; phone: string | null } | null;
  buyer: { name: string | null; phone: string | null; image: string | null } | null;
};

async function hydrateOrder(
  ctx: any,
  order: any,
  includeBuyer = false,
): Promise<HydratedOrder> {
  const items = await ctx.db
    .query("orderItems")
    .withIndex("by_order", (q: any) => q.eq("orderId", order._id))
    .collect();
  const farmerDoc = await ctx.db.get(order.farmerId);
  let buyer: HydratedOrder["buyer"] = null;
  if (includeBuyer) {
    const buyerDoc = await ctx.db.get(order.buyerId);
    buyer = buyerDoc
      ? {
          name: buyerDoc.name ?? null,
          phone: buyerDoc.phone ?? null,
          image: buyerDoc.image ?? null,
        }
      : null;
  }
  return {
    id: order._id,
    status: order.status,
    totalAmount: order.totalAmount,
    deliveryAddress: order.deliveryAddress,
    buyerNote: order.buyerNote ?? null,
    createdAt: order._creationTime,
    items: items.map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    farmer: farmerDoc
      ? { name: farmerDoc.name ?? null, phone: farmerDoc.phone ?? null }
      : null,
    buyer,
  };
}

/**
 * Place an order. Runs inside a single Convex mutation — mutations execute as
 * serializable transactions, so availability checks, order + item creation and
 * inventory decrements are atomic. Prices are read from the database, never
 * trusted from the client.
 */
export const placeOrder = mutation({
  args: {
    items: v.array(
      v.object({ productId: v.id("products"), quantity: v.number() }),
    ),
    deliveryAddress: v.string(),
    buyerNote: v.optional(v.string()),
    clientToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in to place an order.");
    if (user.role !== ROLES.BUYER) {
      throw new Error("Only buyer accounts can place orders.");
    }
    if (!args.items.length) throw new Error("Your cart is empty.");
    const deliveryAddress = args.deliveryAddress.trim();
    if (!deliveryAddress) {
      throw new Error("Please provide a delivery address.");
    }

    // Idempotency: ignore accidental duplicate submissions of the same cart.
    if (args.clientToken) {
      const existing = await ctx.db
        .query("orders")
        .withIndex("by_token", (q) => q.eq("clientToken", args.clientToken))
        .unique();
      if (existing) {
        return { orderId: existing._id, duplicate: true };
      }
    }

    // Validate every cart item against live product records.
    const validated = new Map<
      string,
      { product: any; quantity: number }
    >();
    for (const item of args.items) {
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error("Item quantity must be greater than zero.");
      }
      if (validated.has(item.productId)) {
        throw new Error("Duplicate cart items detected. Refresh and try again.");
      }
      const product = await ctx.db.get(item.productId);
      if (!product) throw new Error("A product in your cart no longer exists.");
      if (product.status !== "available") {
        throw new Error(`"${product.name}" is no longer available.`);
      }
      if (item.quantity > product.quantity) {
        throw new Error(
          `Only ${product.quantity} ${product.unit} of "${product.name}" remain in stock.`,
        );
      }
      validated.set(item.productId, { product, quantity: item.quantity });
    }

    // Group by farmer — each farmer receives their own order document.
    const byFarmer = new Map<string, { product: any; quantity: number }[]>();
    for (const entry of validated.values()) {
      const list = byFarmer.get(entry.product.farmerId) ?? [];
      list.push(entry);
      byFarmer.set(entry.product.farmerId, list);
    }

    const orderIds: string[] = [];
    for (const [farmerId, items] of byFarmer) {
      const lines = items.map(({ product, quantity }) => ({
        productId: product._id as string,
        productName: product.name as string,
        quantity,
        unit: product.unit as string,
        unitPrice: product.price as number, // trusted server-side price
        subtotal: (product.price as number) * quantity,
      }));
      const totalAmount = lines.reduce((sum, l) => sum + l.subtotal, 0);

      const orderId = await ctx.db.insert("orders", {
        buyerId: user._id,
        farmerId: farmerId as any,
        status: "pending",
        totalAmount,
        deliveryAddress,
        buyerNote: args.buyerNote?.trim() || undefined,
        clientToken: args.clientToken,
      });

      for (const line of lines) {
        await ctx.db.insert("orderItems", {
          orderId,
          productId: line.productId as any,
          productName: line.productName,
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          subtotal: line.subtotal,
        });
      }

      // Inventory decrement in the same transaction as order creation.
      for (const { product, quantity } of items) {
        const remaining = product.quantity - quantity;
        await ctx.db.patch(product._id, {
          quantity: remaining,
          // Stock hit zero — delist from the marketplace but keep the record
          // visible (and re-listable) to the farmer.
          status: remaining <= 0 ? "unavailable" : product.status,
        });
      }

      await createNotification(ctx, farmerId as any, {
        title: `New order from ${user.name ?? "a buyer"}`,
        body: `${lines.length} product${lines.length > 1 ? "s" : ""} · ₦${totalAmount.toLocaleString()} — review and confirm.`,
        link: "/farmer/orders",
      });

      orderIds.push(orderId);
    }

    return { orderIds, duplicate: false };
  },
});

/** Buyer's own orders with items and farmer info. */
export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.BUYER) {
      throw new Error("Only buyers can view their orders.");
    }
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .collect();
    const hydrated = await Promise.all(orders.map((o) => hydrateOrder(ctx, o)));
    return hydrated.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Farmer's incoming orders with items and buyer info. */
export const getFarmerOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmers can view incoming orders.");
    }
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_farmer", (q) => q.eq("farmerId", user._id))
      .collect();
    const hydrated = await Promise.all(
      orders.map((o) => hydrateOrder(ctx, o, true)),
    );
    return hydrated.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Fetch one order. Buyers see only their own; farmers only their own. */
export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const isBuyer = order.buyerId === user._id;
    const isFarmer = order.farmerId === user._id;
    if (!isBuyer && !isFarmer) {
      throw new Error("You do not have permission to view this order.");
    }
    return hydrateOrder(ctx, order, isFarmer);
  },
});

/**
 * Update an order's status. Farmers drive the pipeline; buyers may cancel
 * while pending. Cancelling restores inventory atomically.
 */
export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found.");

    const isFarmer = user.role === ROLES.FARMER && order.farmerId === user._id;
    const isBuyer = user.role === ROLES.BUYER && order.buyerId === user._id;
    if (!isFarmer && !isBuyer) {
      throw new Error("You do not have permission to update this order.");
    }

    const allowed = isFarmer
      ? ORDER_TRANSITIONS[order.status]?.farmer ?? []
      : ORDER_TRANSITIONS[order.status]?.buyer ?? [];
    if (!allowed.includes(args.status)) {
      throw new Error(
        `An order that is "${order.status}" cannot be moved to "${args.status}".`,
      );
    }

    // Cancelling restores inventory for every line item.
    if (args.status === "cancelled") {
      const items = await ctx.db
        .query("orderItems")
        .withIndex("by_order", (q) => q.eq("orderId", order._id))
        .collect();
      for (const item of items) {
        const product = await ctx.db.get(item.productId);
        if (!product) continue;
        await ctx.db.patch(product._id, {
          quantity: product.quantity + item.quantity,
          status: "available",
        });
      }
    }

    await ctx.db.patch(args.orderId, { status: args.status });

    if (isFarmer) {
      await createNotification(ctx, order.buyerId, {
        title: `Order ${args.status}`,
        body: `Your ${APP_NAME} order was ${args.status === "cancelled" ? "cancelled" : `marked ${args.status}`} by the farmer.`,
        link: "/buyer/orders",
      });
    } else {
      await createNotification(ctx, order.farmerId, {
        title: "Order cancelled by buyer",
        body: "A pending order was cancelled by the buyer.",
        link: "/farmer/orders",
      });
    }

    return { ok: true };
  },
});

/** Real buyer dashboard statistics from live records. */
export const getBuyerStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.BUYER) {
      throw new Error("Only buyers can view buyer statistics.");
    }
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
      .collect();
    const count = (status: string) =>
      orders.filter((o) => o.status === status).length;
    return {
      totalOrders: orders.length,
      pendingOrders: count("pending"),
      activeOrders: orders.filter((o) =>
        ["confirmed", "processing"].includes(o.status),
      ).length,
      completedOrders: count("completed"),
      cancelledOrders: count("cancelled"),
      totalSpent: orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };
  },
});

/** Real farmer dashboard statistics from live records. */
export const getFarmerStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmers can view farm statistics.");
    }
    const products = await ctx.db
      .query("products")
      .withIndex("by_farmer", (q) => q.eq("farmerId", user._id))
      .collect();
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_farmer", (q) => q.eq("farmerId", user._id))
      .collect();
    const count = (status: string) =>
      orders.filter((o) => o.status === status).length;
    return {
      totalProducts: products.length,
      availableProducts: products.filter((p) => p.status === "available").length,
      outOfStock: products.filter((p) => p.quantity <= 0).length,
      pendingOrders: count("pending"),
      confirmedOrders: count("confirmed"),
      processingOrders: count("processing"),
      completedOrders: count("completed"),
      cancelledOrders: count("cancelled"),
      revenue: orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + o.totalAmount, 0),
      pipelineValue: orders
        .filter((o) => ["pending", "confirmed", "processing"].includes(o.status))
        .reduce((sum, o) => sum + o.totalAmount, 0),
    };
  },
});

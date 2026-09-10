import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { APP_NAME, roleValidator } from "./app";
import { ROLES } from "./roles";
import type { Id } from "./_generated/dataModel";

/** Read-only projection of the signed-in user, including role + profile. */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return publicUser(user);
  },
});

export async function getCurrentUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  return user ?? null;
}

export function publicUser(user: {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  phone?: string;
  location?: string;
}) {
  return {
    _id: user._id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
    role: user.role ?? null,
    phone: user.phone ?? null,
    location: user.location ?? null,
  };
}

/**
 * Records the user's chosen role during onboarding and creates the matching
 * role-specific profile. Idempotent for repeated submissions.
 */
export const completeOnboarding = mutation({
  args: {
    role: roleValidator,
    fullName: v.string(),
    phone: v.string(),
    location: v.string(),
    farmName: v.optional(v.string()),
    businessName: v.optional(v.string()),
    farmDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in to complete setup.");

    const fullName = args.fullName.trim();
    if (!fullName) throw new Error("Please enter your full name.");
    if (!args.phone.trim()) throw new Error("Please enter your phone number.");
    if (!args.location.trim()) throw new Error("Please enter your location.");

    if (args.role === ROLES.FARMER && !args.farmName?.trim()) {
      throw new Error("Please enter your farm or business name.");
    }

    await ctx.db.patch(user._id, {
      name: fullName,
      phone: args.phone.trim(),
      location: args.location.trim(),
      role: args.role,
    });

    if (args.role === ROLES.FARMER) {
      const existing = await ctx.db
        .query("farmerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      const farmFields = {
        farmName: args.farmName!.trim(),
        farmDescription: (args.farmDescription ?? "").trim(),
        farmLocation: args.location.trim(),
      };
      if (existing) {
        await ctx.db.patch(existing._id, farmFields);
      } else {
        await ctx.db.insert("farmerProfiles", {
          userId: user._id,
          ...farmFields,
        });
      }
    } else if (args.role === ROLES.BUYER) {
      const existing = await ctx.db
        .query("buyerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      const fields = {
        businessName: (args.businessName ?? "").trim(),
        deliveryAddress: args.location.trim(),
      };
      if (existing) {
        await ctx.db.patch(existing._id, fields);
      } else {
        await ctx.db.insert("buyerProfiles", { userId: user._id, ...fields });
      }
    }

    await createNotification(ctx, user._id, {
      title: `Welcome to ${APP_NAME}!`,
      body:
        args.role === ROLES.FARMER
          ? "Your farmer account is ready. Add your first product to start selling."
          : "Your buyer profile is ready. Explore fresh produce from Nigerian farmers.",
      link: args.role === ROLES.FARMER ? "/farmer" : "/buyer",
    });

    return { role: args.role };
  },
});

/** Update editable profile fields for the signed-in user. */
export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in to update your profile.");

    const patch: {
      name?: string;
      phone?: string;
      location?: string;
      image?: string;
    } = {};
    if (args.fullName !== undefined) {
      if (!args.fullName.trim()) throw new Error("Name cannot be empty.");
      patch.name = args.fullName.trim();
    }
    if (args.phone !== undefined) patch.phone = args.phone.trim();
    if (args.location !== undefined) patch.location = args.location.trim();
    if (args.imageId !== undefined) {
      const url = await ctx.storage.getUrl(args.imageId);
      if (!url) throw new Error("Uploaded image could not be found.");
      patch.image = url;
    }
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }
    return { ok: true };
  },
});

/** Farmer-only: update farm details shown on the product detail page. */
export const updateFarmerProfile = mutation({
  args: {
    farmName: v.string(),
    farmDescription: v.string(),
    farmLocation: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.FARMER) {
      throw new Error("Only farmers can update farm details.");
    }
    if (!args.farmName.trim()) throw new Error("Farm name cannot be empty.");

    const existing = await ctx.db
      .query("farmerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const fields = {
      farmName: args.farmName.trim(),
      farmDescription: args.farmDescription.trim(),
      farmLocation: args.farmLocation.trim(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("farmerProfiles", { userId: user._id, ...fields });
    }
    return { ok: true };
  },
});

/** Buyer-only: update delivery info used as the checkout default. */
export const updateBuyerProfile = mutation({
  args: {
    businessName: v.string(),
    deliveryAddress: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("You must be signed in.");
    if (user.role !== ROLES.BUYER) {
      throw new Error("Only buyers can update delivery details.");
    }

    const existing = await ctx.db
      .query("buyerProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const fields = {
      businessName: args.businessName.trim(),
      deliveryAddress: args.deliveryAddress.trim(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("buyerProfiles", { userId: user._id, ...fields });
    }
    return { ok: true };
  },
});

/** Get the current user's role-specific profile alongside base fields. */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    if (user.role === ROLES.FARMER) {
      const farmerProfile = await ctx.db
        .query("farmerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      return {
        user: publicUser(user),
        farmer: farmerProfile
          ? {
              farmName: farmerProfile.farmName,
              farmDescription: farmerProfile.farmDescription,
              farmLocation: farmerProfile.farmLocation,
            }
          : null,
        buyer: null,
      };
    }
    if (user.role === ROLES.BUYER) {
      const buyerProfile = await ctx.db
        .query("buyerProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      return {
        user: publicUser(user),
        farmer: null,
        buyer: buyerProfile
          ? {
              businessName: buyerProfile.businessName,
              deliveryAddress: buyerProfile.deliveryAddress,
            }
          : null,
      };
    }
    return { user: publicUser(user), farmer: null, buyer: null };
  },
});

export async function createNotification(
  ctx: MutationCtx,
  userId: Id<"users">,
  notification: { title: string; body: string; link?: string },
) {
  await ctx.db.insert("notifications", {
    userId,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    read: false,
  });
}

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addToWaitlist = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    nativeLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error("Email already registered for waitlist");
    }

    // Add to waitlist
    const waitlistId = await ctx.db.insert("waitlist", {
      name: args.name,
      email: args.email,
      nativeLanguage: args.nativeLanguage,
    });

    return waitlistId;
  },
});

export const getAllWaitlist = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("waitlist").collect();
  },
});

export const searchWaitlistByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
  },
});
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createDemoSession = mutation({
  args: {
    durationSec: v.number(),
    wer: v.number(),
    per: v.number(),
    issues: v.array(v.object({
      type: v.string(),
      description: v.string(),
      severity: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("demoSessions", {
      durationSec: args.durationSec,
      wer: args.wer,
      per: args.per,
      issues: args.issues,
    });

    return sessionId;
  },
});

export const getAllDemoSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("demoSessions").collect();
  },
});

import { z } from "zod";

const rankTierSchema = z.enum([
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Emerald",
  "Diamond",
]);
const rankDivisionSchema = z.enum(["IV", "III", "II", "I"]);
const rankSelectionSchema = z.object({
  tier: rankTierSchema,
  division: rankDivisionSchema,
  lp: z.number().int().min(0).max(2000),
});
const boostMethodSchema = z.enum([
  "division",
  "net-wins",
  "placements",
  "duo",
  "pay-per-game",
]);
const addOnIdSchema = z.enum([
  "live-updates",
  "priority",
  "role-selection",
  "champion-request",
  "games-screenshare",
]);

export const riotIdSchema = z
  .string()
  .trim()
  .regex(/^[\p{L}\p{N} ._-]{3,16}#[A-Za-z0-9]{2,5}$/u, {
    message: "Use the Riot ID format GameName#TAG.",
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(10).max(128),
  termsAccepted: z.boolean().refine((value) => value, {
    message: "Accept the Terms of Service to register.",
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
});

export const checkoutSchema = z.object({
  serviceId: z.string().min(2),
  coachId: z.string().optional(),
  riotId: riotIdSchema.optional(),
  queue: z.enum(["Ranked Solo/Duo", "Ranked Flex"]).default("Ranked Solo/Duo"),
  method: boostMethodSchema.optional(),
  currentRank: rankSelectionSchema.optional(),
  targetRank: rankSelectionSchema.optional(),
  netWins: z.number().int().min(1).max(30).default(5),
  placementGames: z.number().int().min(1).max(5).default(5),
  payPerGames: z.number().int().min(1).max(40).default(5),
  duoPremium: z.number().min(1).max(2.5).default(1.65),
  addOnIds: z.array(addOnIdSchema).default([]),
  goalRank: z.string().min(2),
  role: z.string().min(2),
  addOns: z.array(z.string()).default([]),
  championPool: z.array(z.string().trim().min(2).max(32)).max(30).default([]),
});

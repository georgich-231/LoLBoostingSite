import { Prisma } from "@prisma/client";
import {
  BOOST_ADD_ONS,
  DEFAULT_BOOST_PRICING_CONFIG,
  RANK_TIERS,
  type AddOnId,
  type BoostAddOn,
  type BoostPricingConfig,
  type RankTier,
} from "@/lib/boost-pricing";
import { prisma } from "@/server/prisma";

const BOOST_PRICING_KEY = "boost-pricing";

export async function getBoostPricingConfig(): Promise<BoostPricingConfig> {
  const stored = await prisma.boostPricingConfig.findUnique({
    where: { key: BOOST_PRICING_KEY },
  });

  return normalizeBoostPricingConfig(stored?.value);
}

export async function ensureBoostPricingConfig() {
  return prisma.boostPricingConfig.upsert({
    where: { key: BOOST_PRICING_KEY },
    update: {},
    create: {
      key: BOOST_PRICING_KEY,
      value: DEFAULT_BOOST_PRICING_CONFIG as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function saveBoostPricingConfig(input: {
  actorId: string;
  config: BoostPricingConfig;
}) {
  const config = normalizeBoostPricingConfig(input.config);

  await prisma.$transaction([
    prisma.boostPricingConfig.upsert({
      where: { key: BOOST_PRICING_KEY },
      update: {
        value: config as unknown as Prisma.InputJsonValue,
        updatedById: input.actorId,
      },
      create: {
        key: BOOST_PRICING_KEY,
        value: config as unknown as Prisma.InputJsonValue,
        updatedById: input.actorId,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        action: "pricing.update",
        target: BOOST_PRICING_KEY,
        metadata: { tiers: RANK_TIERS.length, addOns: config.addOns.length },
      },
    }),
  ]);
}

export function normalizeBoostPricingConfig(value: unknown): BoostPricingConfig {
  const source = isRecord(value) ? value : {};
  const division = isRecord(source.division) ? source.division : {};
  const netWins = isRecord(source.netWins) ? source.netWins : {};
  const placements = isRecord(source.placements) ? source.placements : {};
  const duo = isRecord(source.duo) ? source.duo : {};
  const payPerGame = isRecord(source.payPerGame) ? source.payPerGame : {};

  return {
    division: {
      minimumOrder: numberOrDefault(
        division.minimumOrder,
        DEFAULT_BOOST_PRICING_CONFIG.division.minimumOrder,
      ),
      pricePer100LpByTier: normalizeTierRates(
        isRecord(division.pricePer100LpByTier) ? division.pricePer100LpByTier : {},
        DEFAULT_BOOST_PRICING_CONFIG.division.pricePer100LpByTier,
      ),
    },
    netWins: {
      pricePerWinByTier: normalizeTierRates(
        isRecord(netWins.pricePerWinByTier) ? netWins.pricePerWinByTier : {},
        DEFAULT_BOOST_PRICING_CONFIG.netWins.pricePerWinByTier,
      ),
    },
    placements: {
      maxGames: clampNumber(
        placements.maxGames,
        DEFAULT_BOOST_PRICING_CONFIG.placements.maxGames,
        1,
        5,
      ),
      pricePerGameByTier: normalizeTierRates(
        isRecord(placements.pricePerGameByTier) ? placements.pricePerGameByTier : {},
        DEFAULT_BOOST_PRICING_CONFIG.placements.pricePerGameByTier,
      ),
    },
    duo: {
      defaultPremium: clampNumber(
        duo.defaultPremium,
        DEFAULT_BOOST_PRICING_CONFIG.duo.defaultPremium,
        1,
        3,
      ),
      premiumOptions: normalizeDuoPremiums(duo.premiumOptions),
    },
    payPerGame: {
      netWinDiscount: clampNumber(
        payPerGame.netWinDiscount,
        DEFAULT_BOOST_PRICING_CONFIG.payPerGame.netWinDiscount,
        0.1,
        1,
      ),
    },
    addOns: normalizeAddOns(source.addOns),
  };
}

function normalizeTierRates(
  source: Record<string, unknown>,
  defaults: Record<RankTier, number>,
) {
  return RANK_TIERS.reduce(
    (rates, tier) => ({
      ...rates,
      [tier]: numberOrDefault(source[tier], defaults[tier]),
    }),
    {} as Record<RankTier, number>,
  );
}

function normalizeDuoPremiums(value: unknown) {
  if (!Array.isArray(value)) {
    return DEFAULT_BOOST_PRICING_CONFIG.duo.premiumOptions;
  }

  const premiums = value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const amount = clampNumber(item.value, Number.NaN, 1, 3);

      if (!Number.isFinite(amount)) {
        return null;
      }

      return {
        label: typeof item.label === "string" && item.label.trim() ? item.label : `${amount}x`,
        value: amount,
      };
    })
    .filter((item): item is { label: string; value: number } => Boolean(item))
    .slice(0, 5);

  return premiums.length ? premiums : DEFAULT_BOOST_PRICING_CONFIG.duo.premiumOptions;
}

function normalizeAddOns(value: unknown): BoostAddOn[] {
  const source = Array.isArray(value)
    ? new Map(
        value
          .filter(isRecord)
          .map((item) => [item.id, item]),
      )
    : new Map<unknown, Record<string, unknown>>();

  return BOOST_ADD_ONS.map((defaultAddOn) => {
    const item = source.get(defaultAddOn.id) ?? {};
    const mode = item.mode === "percent" || item.mode === "flat" ? item.mode : defaultAddOn.mode;

    return {
      id: defaultAddOn.id as AddOnId,
      label: typeof item.label === "string" && item.label.trim() ? item.label : defaultAddOn.label,
      description:
        typeof item.description === "string" && item.description.trim()
          ? item.description
          : defaultAddOn.description,
      mode,
      amount:
        mode === "percent"
          ? clampNumber(item.amount, defaultAddOn.amount, 0, 1)
          : numberOrDefault(item.amount, defaultAddOn.amount),
    };
  });
}

function numberOrDefault(value: unknown, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

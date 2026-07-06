"use server";

import { revalidatePath } from "next/cache";
import { RANK_TIERS, type BoostAddOn, type BoostPricingConfig } from "@/lib/boost-pricing";
import { prisma } from "@/server/prisma";
import { getCurrentUser } from "@/server/session";
import { normalizeBoostPricingConfig, saveBoostPricingConfig } from "@/server/services/pricing";

export async function updateServiceCatalogAction(formData: FormData) {
  const admin = await requireAdminUser();
  const services = await prisma.service.findMany({ select: { id: true, slug: true } });

  await prisma.$transaction([
    ...services.map((service) =>
      prisma.service.update({
        where: { id: service.id },
        data: {
          basePriceCents: Math.round(
            getFormNumber(formData, `service:${service.id}:basePrice`, 0) * 100,
          ),
          estimatedLengthMin: Math.round(
            getFormNumber(formData, `service:${service.id}:estimatedLengthMin`, 60),
          ),
          active: formData.get(`service:${service.id}:active`) === "on",
        },
      }),
    ),
    prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        action: "catalog.pricing.update",
        target: "services",
        metadata: { services: services.map((service) => service.slug) },
      },
    }),
  ]);

  revalidateAdminPricingPaths();
}

export async function updateBoostPricingAction(formData: FormData) {
  const admin = await requireAdminUser();
  const config: BoostPricingConfig = normalizeBoostPricingConfig({
    division: {
      minimumOrder: getFormNumber(formData, "division.minimumOrder", 7),
      pricePer100LpByTier: getTierRates(formData, "division"),
    },
    netWins: {
      pricePerWinByTier: getTierRates(formData, "netWins"),
    },
    placements: {
      maxGames: getFormNumber(formData, "placements.maxGames", 5),
      pricePerGameByTier: getTierRates(formData, "placements"),
    },
    duo: {
      defaultPremium: getFormNumber(formData, "duo.defaultPremium", 1.65),
      premiumOptions: [0, 1, 2].map((index) => {
        const value = getFormNumber(formData, `duo.option:${index}`, 1.5 + index * 0.25);

        return {
          label: `+${Math.max(0, Math.round((value - 1) * 100))}% duo premium`,
          value,
        };
      }),
    },
    payPerGame: {
      netWinDiscount: getFormNumber(formData, "payPerGame.netWinDiscountPercent", 65) / 100,
    },
    addOns: getAddOns(formData),
  });

  await saveBoostPricingConfig({
    actorId: admin.id,
    config,
  });

  revalidateAdminPricingPaths();
}

async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    throw new Error("Admin access required");
  }

  return user;
}

function getTierRates(formData: FormData, prefix: string) {
  return RANK_TIERS.reduce(
    (rates, tier) => ({
      ...rates,
      [tier]: getFormNumber(formData, `${prefix}.${tier}`, 0),
    }),
    {} as Record<(typeof RANK_TIERS)[number], number>,
  );
}

function getAddOns(formData: FormData): BoostAddOn[] {
  return [
    "live-updates",
    "priority",
    "role-selection",
    "champion-request",
    "games-screenshare",
  ].map(
    (id) => {
      const mode = formData.get(`addon:${id}:mode`) === "percent" ? "percent" : "flat";
      const amount =
        mode === "percent"
          ? getFormNumber(formData, `addon:${id}:amount`, 0) / 100
          : getFormNumber(formData, `addon:${id}:amount`, 0);

      return {
        id: id as BoostAddOn["id"],
        label: String(formData.get(`addon:${id}:label`) ?? ""),
        description: String(formData.get(`addon:${id}:description`) ?? ""),
        mode,
        amount,
      };
    },
  );
}

function getFormNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key));

  return Number.isFinite(value) ? value : fallback;
}

function revalidateAdminPricingPaths() {
  revalidatePath("/admin");
  revalidatePath("/marketplace");
  revalidatePath("/checkout");
}

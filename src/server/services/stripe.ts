import Stripe from "stripe";
import {
  calculateBoostQuote,
  getBoostMethodForService,
  type AddOnId,
  type BoostMethod,
  type RankSelection,
} from "@/lib/boost-pricing";
import { getAppUrl, getRequiredEnv } from "@/server/config";
import { prisma } from "@/server/prisma";
import { getBoostPricingConfig } from "@/server/services/pricing";

export async function createCheckoutSession(input: {
  serviceId: string;
  orderId?: string;
  customerEmail?: string;
  quote?: {
    method?: BoostMethod;
    currentRank?: RankSelection;
    targetRank?: RankSelection;
    netWins?: number;
    placementGames?: number;
    payPerGames?: number;
    duoPremium?: number;
    addOnIds?: AddOnId[];
  };
}) {
  const service = await prisma.service.findFirst({
    where: {
      OR: [{ id: input.serviceId }, { slug: input.serviceId }],
      active: true,
    },
  });

  if (!service) {
    throw new Error("Unknown or inactive service");
  }

  const pricingConfig = await getBoostPricingConfig();
  const quote =
    input.quote?.currentRank
      ? calculateBoostQuote({
          method:
            input.quote.method ??
            getBoostMethodForService({
              id: service.slug,
              title: service.title,
              category: service.category,
            }),
          serviceBasePrice: service.basePriceCents / 100,
          currentRank: input.quote.currentRank,
          targetRank: input.quote.targetRank,
          netWins: input.quote.netWins,
          placementGames: input.quote.placementGames,
          payPerGames: input.quote.payPerGames,
          duoPremium: input.quote.duoPremium,
          addOnIds: input.quote.addOnIds,
        }, pricingConfig)
      : null;
  if (quote?.invalidReason) {
    throw new Error(quote.invalidReason);
  }
  const unitAmount = quote ? Math.max(100, Math.round(quote.total * 100)) : service.basePriceCents;
  const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    success_url: `${getAppUrl()}/orders?checkout=success`,
    cancel_url: `${getAppUrl()}/checkout?checkout=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: unitAmount,
          product_data: {
            name: service.title,
            description: service.description,
          },
        },
      },
    ],
    metadata: {
      serviceId: service.id,
      orderId: input.orderId ?? "",
      quoteTotalCents: String(unitAmount),
      orderAccess: "method-specific-post-checkout-handoff",
    },
  });

  return {
    mode: "stripe",
    url: session.url,
    service,
  };
}

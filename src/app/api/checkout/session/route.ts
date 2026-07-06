import { createCheckoutSession } from "@/server/services/stripe";
import { checkoutSchema } from "@/server/validation";
import { AppConfigError } from "@/server/config";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid checkout details", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const checkout = await createCheckoutSession({
      serviceId: parsed.data.serviceId,
      customerEmail: user.email,
      quote: {
        method: parsed.data.method,
        currentRank: parsed.data.currentRank,
        targetRank: parsed.data.targetRank,
        netWins: parsed.data.netWins,
        placementGames: parsed.data.placementGames,
        payPerGames: parsed.data.payPerGames,
        duoPremium: parsed.data.duoPremium,
        addOnIds: parsed.data.addOnIds,
      },
    });

    return Response.json(checkout);
  } catch (error) {
    if (error instanceof AppConfigError) {
      return Response.json(
        { error: error.message, setupRequired: true },
        { status: 503 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Unable to create checkout session";

    return Response.json({ error: message }, { status: 500 });
  }
}

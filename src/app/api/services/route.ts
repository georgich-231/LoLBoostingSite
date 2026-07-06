import { prisma } from "@/server/prisma";

export const runtime = "nodejs";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { basePriceCents: "asc" },
  });

  return Response.json({
    services,
    compliance:
      "Division boosts, net wins, placements, duo boosts, pay-per-game orders, and progress tracking with method-specific account-access requirements.",
  });
}

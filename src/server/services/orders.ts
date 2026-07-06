import { rankLpLabel, rankScore } from "@/lib/rank-progression";
import { prisma } from "@/server/prisma";

export async function listOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      service: true,
      coachProfile: true,
      milestones: { orderBy: { createdAt: "asc" } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(input: {
  userId: string;
  serviceId: string;
  coachId?: string;
  riotId?: string;
  queue: "Ranked Solo/Duo" | "Ranked Flex";
  goalRank: string;
  role: string;
  addOns: string[];
  championPool: string[];
}) {
  const service = await prisma.service.findFirst({
    where: { OR: [{ id: input.serviceId }, { slug: input.serviceId }], active: true },
  });

  if (!service) {
    throw new Error("Unknown or inactive service");
  }

  const coach = input.coachId
    ? await prisma.coachProfile.findFirst({
        where: {
          OR: [{ id: input.coachId }, { userId: input.coachId }],
        },
      })
    : null;

  const linkedAccount = await prisma.riotAccount.findFirst({
    where: { userId: input.userId, unlinkedAt: null },
    orderBy: { linkedAt: "desc" },
  });
  const latestRank = linkedAccount
    ? await prisma.rankSnapshot.findFirst({
        where: {
          riotAccountId: linkedAccount.id,
          queueType: input.queue,
        },
        orderBy: { capturedAt: "desc" },
      })
    : null;
  const addOnSummary = input.addOns.length
    ? ` Add-ons: ${input.addOns.join(", ")}.`
    : " No add-ons selected.";

  return prisma.order.create({
    data: {
      publicId: `RP-${Math.floor(Math.random() * 900000 + 100000)}`,
      userId: input.userId,
      coachProfileId: coach?.id,
      serviceId: service.id,
      linkedAccountId: linkedAccount?.id,
      manualRiotId: linkedAccount ? null : input.riotId,
      currentRank: latestRank
        ? `${input.queue} ${rankLpLabel(latestRank)}`
        : `Unverified ${input.queue}`,
      targetGoal: input.goalRank,
      role: input.role,
      champion: input.championPool.length ? input.championPool.join(", ") : null,
      startingLp: latestRank ? rankScore(latestRank) : null,
      currentLp: latestRank ? rankScore(latestRank) : null,
      milestones: {
        create: [
          {
            title: "Order created",
            detail: `Payment and assignment are ready to proceed.${addOnSummary}`,
            completedAt: new Date(),
          },
          {
            title: "Order assignment",
            detail: coach
              ? "Selected handler is attached to this order."
              : "Auto-assignment will attach an available handler.",
          },
        ],
      },
    },
    include: {
      service: true,
      coachProfile: true,
      milestones: true,
    },
  });
}

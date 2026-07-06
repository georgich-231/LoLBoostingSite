import {
  boostQueuePriority,
  clampRankLpForTier,
  isApexRankTier,
  type BoostQueue,
  type LinkedBoostRank,
  type RankSelection,
} from "@/lib/boost-pricing";
import { prisma } from "@/server/prisma";

const BOOST_QUEUE_SET = new Set<BoostQueue>(["Ranked Solo/Duo", "Ranked Flex"]);

export async function getLinkedRanksForBoostConfigurator(userId: string): Promise<LinkedBoostRank[]> {
  const account = await prisma.riotAccount.findFirst({
    where: { userId, unlinkedAt: null },
    orderBy: { linkedAt: "desc" },
    include: {
      rankSnapshots: {
        where: { queueType: { in: ["Ranked Solo/Duo", "Ranked Flex"] } },
        orderBy: { capturedAt: "desc" },
      },
    },
  });

  if (!account) {
    return [];
  }

  const latestByQueue = new Map<BoostQueue, LinkedBoostRank>();

  for (const snapshot of account.rankSnapshots) {
    const queue = toBoostQueue(snapshot.queueType);

    if (!queue || latestByQueue.has(queue)) {
      continue;
    }

    const rank = toRankSelection(snapshot);

    if (!rank) {
      continue;
    }

    latestByQueue.set(queue, {
      ...rank,
      accountLabel: `${account.gameName}#${account.tagLine}`,
      queue,
    });
  }

  return [...latestByQueue.values()].sort(
    (a, b) => boostQueuePriority(a.queue) - boostQueuePriority(b.queue),
  );
}

function toBoostQueue(value: string): BoostQueue | null {
  return BOOST_QUEUE_SET.has(value as BoostQueue) ? (value as BoostQueue) : null;
}

function toRankSelection(
  rank: {
    tier: string;
    division: string;
    lp: number;
  },
): RankSelection | null {
  const tier = toRankTier(rank.tier);

  if (!tier) {
    return null;
  }

  const division = toRankDivision(rank.division) ?? (isApexRankTier(tier) ? "I" : null);

  if (!division) {
    return null;
  }

  return {
    tier,
    division,
    lp: clampRankLpForTier(tier, rank.lp),
  };
}

function toRankTier(value: string): RankSelection["tier"] | null {
  const normalized = toTitleCase(value);

  if (
    normalized === "Iron" ||
    normalized === "Bronze" ||
    normalized === "Silver" ||
    normalized === "Gold" ||
    normalized === "Platinum" ||
    normalized === "Emerald" ||
    normalized === "Diamond" ||
    normalized === "Master" ||
    normalized === "Grandmaster" ||
    normalized === "Challenger"
  ) {
    return normalized;
  }

  return null;
}

function toRankDivision(value: string): RankSelection["division"] | null {
  const normalized = value.trim().toUpperCase();

  if (normalized === "IV" || normalized === "III" || normalized === "II" || normalized === "I") {
    return normalized;
  }

  return null;
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (_match, prefix: string, char: string) => `${prefix}${char.toUpperCase()}`);
}

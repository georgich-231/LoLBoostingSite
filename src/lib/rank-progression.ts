const TIER_POINTS: Record<string, number> = {
  IRON: 0,
  BRONZE: 400,
  SILVER: 800,
  GOLD: 1200,
  PLATINUM: 1600,
  EMERALD: 2000,
  DIAMOND: 2400,
  MASTER: 2800,
  GRANDMASTER: 2800,
  CHALLENGER: 2800,
};

const TIER_STAGES: Record<string, number> = {
  IRON: 0,
  BRONZE: 4,
  SILVER: 8,
  GOLD: 12,
  PLATINUM: 16,
  EMERALD: 20,
  DIAMOND: 24,
  MASTER: 28,
  GRANDMASTER: 29,
  CHALLENGER: 30,
};

const DIVISION_POINTS: Record<string, number> = {
  IV: 0,
  III: 100,
  II: 200,
  I: 300,
};

const DIVISION_STAGES: Record<string, number> = {
  IV: 0,
  III: 1,
  II: 2,
  I: 3,
};

const MASTER_PLUS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

export type RankLike = {
  tier: string;
  division?: string | null;
  lp: number;
};

export function rankScore(rank: RankLike) {
  const tier = normalizeTier(rank.tier);
  const tierPoints = TIER_POINTS[tier];

  if (tierPoints === undefined) {
    return rank.lp;
  }

  if (MASTER_PLUS.has(tier)) {
    return TIER_POINTS.MASTER + rank.lp;
  }

  return tierPoints + (DIVISION_POINTS[normalizeDivision(rank.division)] ?? 0) + rank.lp;
}

export function rankStageScore(rank: Pick<RankLike, "tier" | "division">) {
  const tier = normalizeTier(rank.tier);
  const tierStage = TIER_STAGES[tier];

  if (tierStage === undefined) {
    return -1;
  }

  if (MASTER_PLUS.has(tier)) {
    return tierStage;
  }

  return tierStage + (DIVISION_STAGES[normalizeDivision(rank.division)] ?? 0);
}

export function rankStageLabel(rank: Pick<RankLike, "tier" | "division">) {
  const tier = toTitleCase(rank.tier);

  if (MASTER_PLUS.has(normalizeTier(rank.tier))) {
    return tier;
  }

  return `${tier} ${normalizeDivision(rank.division)}`;
}

export function rankLpLabel(rank: RankLike) {
  return `${rankStageLabel(rank)} ${rank.lp} LP`;
}

function normalizeTier(tier: string) {
  return tier.replace(/\s+/g, "").toUpperCase();
}

function normalizeDivision(division?: string | null) {
  return (division ?? "IV").trim().toUpperCase();
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/(^|\s)([a-z])/g, (_match, prefix: string, char: string) =>
      `${prefix}${char.toUpperCase()}`,
    );
}

import type { Service } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export type BoostMethod =
  | "division"
  | "net-wins"
  | "placements"
  | "duo"
  | "pay-per-game";

export type RankTier =
  | "Iron"
  | "Bronze"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Emerald"
  | "Diamond"
  | "Master"
  | "Grandmaster"
  | "Challenger";

export type RankDivision = "IV" | "III" | "II" | "I";

export type RankSelection = {
  tier: RankTier;
  division: RankDivision;
  lp: number;
};

export type BoostQueue = "Ranked Solo/Duo" | "Ranked Flex";

export type LinkedBoostRank = RankSelection & {
  accountLabel: string;
  queue: BoostQueue;
};

export type AddOnId =
  | "live-updates"
  | "priority"
  | "role-selection"
  | "champion-request"
  | "games-screenshare";

export type BoostQuoteInput = {
  method: BoostMethod;
  serviceBasePrice?: number;
  currentRank: RankSelection;
  targetRank?: RankSelection;
  netWins?: number;
  placementGames?: number;
  payPerGames?: number;
  duoPremium?: number;
  addOnIds?: AddOnId[];
};

export type BoostAddOn = {
  id: AddOnId;
  label: string;
  description: string;
  mode: "flat" | "percent";
  amount: number;
};

export type BoostPricingRules = {
  division: {
    minimumOrder: number;
    pricePer100LpByTier: Record<RankTier, number>;
  };
  netWins: {
    pricePerWinByTier: Record<RankTier, number>;
  };
  placements: {
    maxGames: number;
    pricePerGameByTier: Record<RankTier, number>;
  };
  duo: {
    defaultPremium: number;
    premiumOptions: Array<{
      label: string;
      value: number;
    }>;
  };
  payPerGame: {
    netWinDiscount: number;
  };
};

export type BoostPricingConfig = BoostPricingRules & {
  addOns: BoostAddOn[];
};

export type BoostQuote = {
  total: number;
  subtotal: number;
  invalidReason: string | null;
  lineItems: Array<{
    label: string;
    value: string;
  }>;
};

export const RANK_TIERS: RankTier[] = [
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Emerald",
  "Diamond",
  "Master",
  "Grandmaster",
  "Challenger",
];

export const UNAVAILABLE_BOOST_TIERS: RankTier[] = [
  "Master",
  "Grandmaster",
  "Challenger",
];

export const AVAILABLE_RANK_TIERS = RANK_TIERS.filter(
  (tier) => !UNAVAILABLE_BOOST_TIERS.includes(tier),
);

export const RANK_DIVISIONS: RankDivision[] = ["IV", "III", "II", "I"];
export const LP_OPTIONS = [0, 20, 40, 60, 80, 100];
export const APEX_LP_OPTIONS = [
  0,
  20,
  40,
  50,
  60,
  80,
  100,
  200,
  300,
  400,
  500,
  750,
  1000,
  1250,
  1500,
  1750,
  2000,
];
export const BOOST_QUEUES: BoostQueue[] = ["Ranked Solo/Duo", "Ranked Flex"];

export const RANK_STAGE_OPTIONS = RANK_TIERS.reduce<
  Array<Pick<RankSelection, "tier" | "division">>
>((options, tier) => {
  if (isApexRankTier(tier)) {
    return [...options, { tier, division: "I" }];
  }

  return [
    ...options,
    ...RANK_DIVISIONS.map((division) => ({ tier, division })),
  ];
}, []);

export const AVAILABLE_RANK_STAGE_OPTIONS = RANK_STAGE_OPTIONS.filter((rank) =>
  isBoostRankAvailable(rank),
);

export const BOOST_ADD_ONS: BoostAddOn[] = [
  {
    id: "live-updates",
    label: "Live progress updates",
    description: "Status updates after every session block.",
    mode: "flat",
    amount: 5,
  },
  {
    id: "priority",
    label: "Priority scheduling",
    description: "Moves the order ahead for faster assignment.",
    mode: "percent",
    amount: 0.12,
  },
  {
    id: "role-selection",
    label: "Role selection",
    description: "Choose the role the booster should queue for.",
    mode: "percent",
    amount: 0.25,
  },
  {
    id: "champion-request",
    label: "Champion pool request",
    description: "Pick the champions the booster should prioritize.",
    mode: "flat",
    amount: 8,
  },
  {
    id: "games-screenshare",
    label: "Games screenshare",
    description: "Screenshare selected games for visibility while the order runs.",
    mode: "flat",
    amount: 7,
  },
];

export const BOOST_PRICING: BoostPricingRules = {
  division: {
    minimumOrder: 7,
    pricePer100LpByTier: {
      Iron: 3.5,
      Bronze: 4.5,
      Silver: 5.5,
      Gold: 7,
      Platinum: 8,
      Emerald: 9,
      Diamond: 12,
      Master: 0,
      Grandmaster: 0,
      Challenger: 0,
    } satisfies Record<RankTier, number>,
  },
  netWins: {
    pricePerWinByTier: {
      Iron: 2,
      Bronze: 2.5,
      Silver: 3,
      Gold: 4,
      Platinum: 4.5,
      Emerald: 5,
      Diamond: 6.5,
      Master: 0,
      Grandmaster: 0,
      Challenger: 0,
    } satisfies Record<RankTier, number>,
  },
  placements: {
    maxGames: 5,
    pricePerGameByTier: {
      Iron: 2,
      Bronze: 2.25,
      Silver: 2.75,
      Gold: 3.5,
      Platinum: 4,
      Emerald: 4.5,
      Diamond: 6,
      Master: 0,
      Grandmaster: 0,
      Challenger: 0,
    } satisfies Record<RankTier, number>,
  },
  duo: {
    defaultPremium: 1.65,
    premiumOptions: [
      { label: "+50% duo premium", value: 1.5 },
      { label: "+65% duo premium", value: 1.65 },
      { label: "+85% duo premium", value: 1.85 },
    ],
  },
  payPerGame: {
    netWinDiscount: 0.65,
  },
};

export const DEFAULT_BOOST_PRICING_CONFIG: BoostPricingConfig = {
  ...BOOST_PRICING,
  addOns: BOOST_ADD_ONS,
};

const TIER_POINTS: Record<RankTier, number> = {
  Iron: 0,
  Bronze: 400,
  Silver: 800,
  Gold: 1200,
  Platinum: 1600,
  Emerald: 2000,
  Diamond: 2400,
  Master: 2800,
  Grandmaster: 3300,
  Challenger: 3900,
};

const DIVISION_POINTS: Record<RankDivision, number> = {
  IV: 0,
  III: 100,
  II: 200,
  I: 300,
};

export function getBoostMethodForService(service?: Pick<Service, "id" | "title" | "category">): BoostMethod {
  const fingerprint = `${service?.id ?? ""} ${service?.title ?? ""} ${service?.category ?? ""}`.toLowerCase();

  if (fingerprint.includes("pay")) {
    return "pay-per-game";
  }

  if (fingerprint.includes("duo")) {
    return "duo";
  }

  if (fingerprint.includes("placement")) {
    return "placements";
  }

  if (fingerprint.includes("net") || fingerprint.includes("win")) {
    return "net-wins";
  }

  return "division";
}

export function rankLabel(rank: RankSelection) {
  if (isApexRankTier(rank.tier)) {
    return `${rank.tier} ${clampRankLpForTier(rank.tier, rank.lp)} LP`;
  }

  return `${rank.tier} ${rank.division} ${rank.lp} LP`;
}

export function rankStageLabel(rank: Pick<RankSelection, "tier" | "division">) {
  if (isApexRankTier(rank.tier)) {
    return rank.tier;
  }

  return `${rank.tier} ${rank.division}`;
}

export function rankScore(rank: RankSelection) {
  const divisionPoints = isApexRankTier(rank.tier) ? 0 : DIVISION_POINTS[rank.division];

  return TIER_POINTS[rank.tier] + divisionPoints + clampRankLpForTier(rank.tier, rank.lp);
}

export function rankStageScore(rank: Pick<RankSelection, "tier" | "division">) {
  const divisionPoints = isApexRankTier(rank.tier) ? 0 : DIVISION_POINTS[rank.division];

  return TIER_POINTS[rank.tier] + divisionPoints;
}

export function boostQueuePriority(queue: string) {
  const index = BOOST_QUEUES.findIndex((item) => item === queue);

  return index === -1 ? BOOST_QUEUES.length : index;
}

export function isBoostRankAvailable(rank: Pick<RankSelection, "tier">) {
  return !UNAVAILABLE_BOOST_TIERS.includes(rank.tier);
}

export function unavailableBoostRankReason() {
  return "Boosts are currently available up to Diamond. Master, Grandmaster, and Challenger orders are unavailable until further notice.";
}

export function isTargetRankAllowed(currentRank: RankSelection, targetRank: RankSelection) {
  return (
    isBoostRankAvailable(currentRank) &&
    isBoostRankAvailable(targetRank) &&
    rankScore(targetRank) > rankScore(currentRank)
  );
}

export function getNextTargetRank(currentRank: RankSelection): RankSelection {
  const currentStage = rankStageScore(currentRank);
  const currentLp = clampRankLpForTier(currentRank.tier, currentRank.lp);
  const nextLp = getLpOptionsForRank(currentRank).find((lp) => lp > currentLp);

  if (nextLp !== undefined) {
    return { ...currentRank, lp: nextLp };
  }

  const nextStage = AVAILABLE_RANK_STAGE_OPTIONS.find((stage) => rankStageScore(stage) > currentStage);

  if (nextStage) {
    return { ...nextStage, lp: 0 };
  }

  return { tier: "Diamond", division: "I", lp: 100 };
}

export function getLpOptionsForRank(rank: Pick<RankSelection, "tier">) {
  return isApexRankTier(rank.tier) ? APEX_LP_OPTIONS : LP_OPTIONS;
}

export function isApexRankTier(tier: RankTier) {
  return tier === "Master" || tier === "Grandmaster" || tier === "Challenger";
}

export function rankLpLimit(tier: RankTier) {
  return isApexRankTier(tier) ? 2000 : 100;
}

export function clampRankLpForTier(tier: RankTier, value: number) {
  return clampWholeNumber(value, 0, rankLpLimit(tier));
}

export function calculateBoostQuote(
  input: BoostQuoteInput,
  config: BoostPricingConfig = DEFAULT_BOOST_PRICING_CONFIG,
): BoostQuote {
  const methodQuote = calculateMethodSubtotal(input, config);
  const subtotal = methodQuote.invalidReason
    ? roundMoney(methodQuote.subtotal)
    : roundMoney(Math.max(methodQuote.subtotal, input.serviceBasePrice ?? 0));
  const addOns = methodQuote.invalidReason
    ? []
    : config.addOns.filter((item) => input.addOnIds?.includes(item.id));
  const addOnLineItems = addOns.map((addOn) => ({
    label: addOn.label,
    value:
      addOn.mode === "percent"
        ? `+${Math.round(addOn.amount * 100)}%`
        : `+${formatCurrency(addOn.amount)}`,
  }));
  const addOnAmount = roundMoney(addOns.reduce(
    (sum, addOn) =>
      sum + (addOn.mode === "percent" ? roundMoney(subtotal * addOn.amount) : addOn.amount),
    0,
  ));
  const total = roundMoney(subtotal + addOnAmount);

  return {
    total,
    subtotal,
    invalidReason: methodQuote.invalidReason,
    lineItems: [
      ...methodQuote.lineItems,
      ...(methodQuote.invalidReason
        ? []
        : addOnLineItems.length ? addOnLineItems : [{ label: "Add-ons", value: "None" }]),
    ],
  };
}

function calculateMethodSubtotal(
  input: BoostQuoteInput,
  config: BoostPricingConfig,
): Omit<BoostQuote, "total"> {
  const unavailableReason = getUnavailableRankReason(input);

  if (unavailableReason) {
    return {
      subtotal: 0,
      invalidReason: unavailableReason,
      lineItems: [{ label: "Availability", value: "Up to Diamond" }],
    };
  }

  if (input.method === "net-wins") {
    const wins = clampWholeNumber(input.netWins ?? 5, 1, 30);
    const rate = config.netWins.pricePerWinByTier[input.currentRank.tier];

    return {
      subtotal: roundMoney(wins * rate),
      invalidReason: null,
      lineItems: [
        { label: "Net wins", value: `${wins}` },
        { label: "Rate per net win", value: formatCurrency(rate) },
      ],
    };
  }

  if (input.method === "placements") {
    const games = clampWholeNumber(input.placementGames ?? 5, 1, config.placements.maxGames);
    const rate = config.placements.pricePerGameByTier[input.currentRank.tier];

    return {
      subtotal: roundMoney(games * rate),
      invalidReason: null,
      lineItems: [
        { label: "Placement games", value: `${games}/${config.placements.maxGames}` },
        { label: "Rate per game", value: formatCurrency(rate) },
      ],
    };
  }

  if (input.method === "pay-per-game") {
    const games = clampWholeNumber(input.payPerGames ?? 5, 1, 40);
    const netRate = config.netWins.pricePerWinByTier[input.currentRank.tier];
    const rate = roundMoney(netRate * config.payPerGame.netWinDiscount);

    return {
      subtotal: roundMoney(games * rate),
      invalidReason: null,
      lineItems: [
        { label: "Games", value: `${games}` },
        { label: "Pay-per-game discount", value: "35% lower" },
        { label: "Rate per game", value: formatCurrency(rate) },
      ],
    };
  }

  const targetRank = input.targetRank ?? getNextTargetRank(input.currentRank);
  const divisionSubtotal = calculateDivisionSubtotal(input.currentRank, targetRank, config);

  if (input.method === "duo") {
    const premium = input.duoPremium ?? config.duo.defaultPremium;

    return {
      subtotal: roundMoney(divisionSubtotal.subtotal * premium),
      invalidReason: divisionSubtotal.invalidReason,
      lineItems: [
        ...divisionSubtotal.lineItems,
        { label: "Duo multiplier", value: `${premium}x` },
      ],
    };
  }

  return divisionSubtotal;
}

function calculateDivisionSubtotal(
  currentRank: RankSelection,
  targetRank: RankSelection,
  config: BoostPricingConfig,
) {
  const gap = Math.max(0, rankScore(targetRank) - rankScore(currentRank));
  const rate = config.division.pricePer100LpByTier[currentRank.tier];
  const invalidReason = gap <= 0 ? "Target rank and LP must be higher than the current account state." : null;
  const subtotal = invalidReason
    ? 0
    : roundMoney(Math.max((gap / 100) * rate, config.division.minimumOrder));

  return {
    subtotal,
    invalidReason,
    lineItems: [
      { label: "LP gap", value: `${gap}` },
      { label: "Rate per 100 LP", value: formatCurrency(rate) },
    ],
  };
}

function getUnavailableRankReason(input: BoostQuoteInput) {
  if (!isBoostRankAvailable(input.currentRank)) {
    return unavailableBoostRankReason();
  }

  if (
    (input.method === "division" || input.method === "duo") &&
    input.targetRank &&
    !isBoostRankAvailable(input.targetRank)
  ) {
    return unavailableBoostRankReason();
  }

  return null;
}

function clampWholeNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

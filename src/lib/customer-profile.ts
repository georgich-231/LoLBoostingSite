export const PURCHASE_LEVELS = [
  { name: "Starter", minSpendCents: 0, discount: 0 },
  { name: "Bronze", minSpendCents: 1000, discount: 3 },
  { name: "Silver", minSpendCents: 5000, discount: 6 },
  { name: "Gold", minSpendCents: 20000, discount: 10 },
  { name: "Diamond", minSpendCents: 50000, discount: 14 },
];

export type CustomerDiscount = {
  purchaseRank: string;
  totalDiscount: number;
  nextRankSpendCents: number | null;
};

export function getCustomerDiscount(input: { spendCents: number }): CustomerDiscount {
  const spendCents = Math.max(0, input.spendCents);
  const purchaseRankLevel = PURCHASE_LEVELS.reduce(
    (best, level) => (spendCents >= level.minSpendCents ? level : best),
    PURCHASE_LEVELS[0],
  );
  const nextLevel =
    PURCHASE_LEVELS.find((level) => level.minSpendCents > spendCents) ?? null;

  return {
    purchaseRank: purchaseRankLevel.name,
    totalDiscount: purchaseRankLevel.discount,
    nextRankSpendCents: nextLevel ? nextLevel.minSpendCents - spendCents : null,
  };
}

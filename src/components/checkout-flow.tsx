"use client";

import Link from "next/link";
import { Check, CreditCard, Link2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { ChampionPoolPicker } from "@/components/champion-pool-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/panel";
import { Select } from "@/components/ui/select";
import {
  AVAILABLE_RANK_STAGE_OPTIONS,
  BOOST_QUEUES,
  RANK_STAGE_OPTIONS,
  calculateBoostQuote,
  clampRankLpForTier,
  getBoostMethodForService,
  getLpOptionsForRank,
  getNextTargetRank,
  isTargetRankAllowed,
  rankLpLimit,
  rankLabel,
  rankStageLabel,
  rankStageScore,
  type AddOnId,
  type BoostAddOn,
  type BoostMethod,
  type BoostPricingConfig,
  type BoostQueue,
  type LinkedBoostRank,
  type RankDivision,
  type RankSelection,
  type RankTier,
} from "@/lib/boost-pricing";
import type { Service } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const steps = [
  "Choose service",
  "Account context",
  "Set goal",
  "Assignment",
  "Pay securely",
  "Order dashboard",
];

type AccountMode = "linked" | "manual";

const defaultCurrentRank: RankSelection = {
  tier: "Gold",
  division: "II",
  lp: 62,
};

const roles = ["Top", "Jungle", "Mid", "ADC", "Support"];

export function CheckoutFlow({
  services,
  initialServiceId,
  initialQueue,
  initialAddOns,
  pricingConfig,
  linkedRanks = [],
}: {
  services: Service[];
  initialServiceId?: string;
  initialQueue?: string;
  initialAddOns?: string;
  pricingConfig: BoostPricingConfig;
  linkedRanks?: LinkedBoostRank[];
}) {
  const requestedQueue = toBoostQueue(initialQueue) ?? linkedRanks[0]?.queue ?? BOOST_QUEUES[0];
  const initialLinkedRank = getLinkedRankForQueue(linkedRanks, requestedQueue);
  const initialTargetRank = getNextTargetRank(initialLinkedRank ?? defaultCurrentRank);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(
    services.some((service) => service.id === initialServiceId)
      ? (initialServiceId as string)
      : services[0]?.id ?? "",
  );
  const [accountMode, setAccountMode] = useState<AccountMode>(
    initialLinkedRank ? "linked" : "manual",
  );
  const [queue, setQueue] = useState<BoostQueue>(requestedQueue);
  const [currentTier, setCurrentTier] = useState<RankTier>(defaultCurrentRank.tier);
  const [currentDivision, setCurrentDivision] = useState<RankDivision>(
    defaultCurrentRank.division,
  );
  const [currentLp, setCurrentLp] = useState(defaultCurrentRank.lp);
  const [targetTier, setTargetTier] = useState<RankTier>(initialTargetRank.tier);
  const [targetDivision, setTargetDivision] = useState<RankDivision>(
    initialTargetRank.division,
  );
  const [targetLp, setTargetLp] = useState(initialTargetRank.lp);
  const [netWins, setNetWins] = useState(5);
  const [placementGames, setPlacementGames] = useState(5);
  const [payPerGames, setPayPerGames] = useState(5);
  const [duoPremium, setDuoPremium] = useState(pricingConfig.duo.defaultPremium);
  const [role, setRole] = useState("Mid");
  const [riotId, setRiotId] = useState("");
  const [manualRiotId, setManualRiotId] = useState("");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<AddOnId[]>(
    parseAddOns(initialAddOns, pricingConfig.addOns),
  );
  const [selectedChampions, setSelectedChampions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const method = useMemo(() => getBoostMethodForService(service), [service]);
  const linkedRankForQueue = getLinkedRankForQueue(linkedRanks, queue);
  const effectiveAccountMode: AccountMode =
    accountMode === "linked" && linkedRankForQueue ? "linked" : "manual";
  const roleSelectionEnabled = selectedAddOnIds.includes("role-selection");
  const championPoolEnabled = selectedAddOnIds.includes("champion-request");
  const manualCurrentRank = useMemo<RankSelection>(
    () => ({
      tier: currentTier,
      division: currentDivision,
      lp: clampRankLp(currentTier, currentLp),
    }),
    [currentDivision, currentLp, currentTier],
  );
  const currentRank =
    effectiveAccountMode === "linked" && linkedRankForQueue
      ? linkedRankForQueue
      : manualCurrentRank;
  const targetRank = useMemo<RankSelection>(
    () => ({
      tier: targetTier,
      division: targetDivision,
      lp: clampRankLp(targetTier, targetLp),
    }),
    [targetDivision, targetLp, targetTier],
  );
  const usesTargetRank = method === "division" || method === "duo";
  const currentRankStageOptions =
    effectiveAccountMode === "linked" ? RANK_STAGE_OPTIONS : AVAILABLE_RANK_STAGE_OPTIONS;
  const targetRankStageOptions = AVAILABLE_RANK_STAGE_OPTIONS;
  const targetRankStageValue = `${targetTier}:${targetDivision}`;
  const selectedTargetRankIsAvailable = targetRankStageOptions.some(
    (rank) => `${rank.tier}:${rank.division}` === targetRankStageValue,
  );
  const goalRank = getGoalSummary(method, targetRank, netWins, placementGames, payPerGames);
  const selectedAddOns = getSelectedAddOns(
    selectedAddOnIds,
    selectedChampions,
    roleSelectionEnabled ? role : null,
    pricingConfig.addOns,
  );
  const quote = useMemo(
    () =>
      calculateBoostQuote({
        method,
        serviceBasePrice: service?.basePrice ?? 0,
        currentRank,
        targetRank,
        netWins,
        placementGames,
        payPerGames,
        duoPremium,
        addOnIds: selectedAddOnIds,
      }, pricingConfig),
    [
      currentRank,
      duoPremium,
      method,
      netWins,
      payPerGames,
      placementGames,
      selectedAddOnIds,
      service?.basePrice,
      targetRank,
      pricingConfig,
    ],
  );

  if (!services.length) {
    return (
      <GlassPanel className="p-5 text-sm text-zinc-400">
        No active boost services are configured yet.
      </GlassPanel>
    );
  }

  async function continueFlow() {
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setError(null);

    const selectedRiotId = riotId || manualRiotId || undefined;
    const payload = {
      serviceId,
      queue,
      riotId: selectedRiotId,
      method,
      currentRank,
      targetRank,
      netWins,
      placementGames,
      payPerGames,
      duoPremium,
      addOnIds: selectedAddOnIds,
      goalRank,
      role: roleSelectionEnabled ? role : "Any role",
      addOns: selectedAddOns,
      championPool: championPoolEnabled ? selectedChampions : [],
    };
    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!orderResponse.ok) {
      const data = (await orderResponse.json()) as { error?: string };
      setError(data.error ?? "Unable to create order");
      setLoading(false);
      return;
    }

    const checkoutResponse = await fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const checkout = (await checkoutResponse.json()) as {
      url?: string | null;
      error?: string;
    };

    setLoading(false);

    if (!checkoutResponse.ok || !checkout.url) {
      setError(checkout.error ?? "Unable to start Stripe checkout");
      return;
    }

    window.location.assign(checkout.url);
  }

  function setService(nextServiceId: string) {
    const nextService = services.find((item) => item.id === nextServiceId);
    const nextMethod = getBoostMethodForService(nextService);

    setServiceId(nextServiceId);
    coerceTargetForCurrent(currentRank, nextMethod);
  }

  function setAccountSource(value: AccountMode) {
    const nextMode = value === "linked" && linkedRankForQueue ? "linked" : "manual";
    const nextCurrentRank =
      nextMode === "linked" && linkedRankForQueue
        ? linkedRankForQueue
        : manualCurrentRank;

    setAccountMode(nextMode);
    coerceTargetForCurrent(nextCurrentRank);
  }

  function setQueueValue(value: BoostQueue) {
    const nextLinkedRank = getLinkedRankForQueue(linkedRanks, value);
    const nextCurrentRank =
      accountMode === "linked" && nextLinkedRank ? nextLinkedRank : manualCurrentRank;

    setQueue(value);
    coerceTargetForCurrent(nextCurrentRank);
  }

  function setCurrentRankStage(value: string) {
    const [tier, division] = value.split(":") as [RankTier, RankDivision];
    const nextCurrentRank = {
      tier,
      division,
      lp: clampRankLp(tier, currentLp),
    };

    setCurrentTier(tier);
    setCurrentDivision(division);
    coerceTargetForCurrent(nextCurrentRank);
  }

  function setCurrentLpValue(value: number) {
    const nextLp = clampRankLp(manualCurrentRank.tier, value);
    const nextCurrentRank = {
      ...manualCurrentRank,
      lp: nextLp,
    };

    setCurrentLp(nextLp);
    coerceTargetForCurrent(nextCurrentRank);
  }

  function setTargetRankStage(value: string) {
    const [tier, division] = value.split(":") as [RankTier, RankDivision];
    const nextTargetRank = {
      tier,
      division,
      lp: clampRankLp(tier, targetLp),
    };

    setTargetTier(tier);
    setTargetDivision(division);
    coerceTargetForCurrent(currentRank, method, nextTargetRank);
  }

  function toggleAddOn(addOnId: AddOnId) {
    if (selectedAddOnIds.includes(addOnId)) {
      setSelectedAddOnIds(selectedAddOnIds.filter((item) => item !== addOnId));

      if (addOnId === "champion-request") {
        setSelectedChampions([]);
      }

      return;
    }

    setSelectedAddOnIds([...selectedAddOnIds, addOnId]);
  }

  function clearAddOns() {
    setSelectedAddOnIds([]);
    setSelectedChampions([]);
  }

  function coerceTargetForCurrent(
    nextCurrentRank: RankSelection,
    nextMethod: BoostMethod = method,
    nextTargetRank: RankSelection = targetRank,
  ) {
    if (!methodUsesTargetRank(nextMethod) || isTargetRankAllowed(nextCurrentRank, nextTargetRank)) {
      return;
    }

    const nextTarget = getNextTargetRank(nextCurrentRank);
    setTargetTier(nextTarget.tier);
    setTargetDivision(nextTarget.division);
    setTargetLp(nextTarget.lp);
  }

  return (
    <GlassPanel className="p-5">
      <div className="grid gap-3 sm:grid-cols-6">
        {steps.map((label, index) => {
          const complete = index + 1 < step;
          const current = index + 1 === step;

          return (
            <div
              key={label}
              className={[
                "flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold",
                current
                  ? "border-emerald-300/40 bg-emerald-300/10 text-white"
                  : "border-white/10 bg-white/6 text-zinc-300",
              ].join(" ")}
            >
              <span className={complete || current ? "text-emerald-300" : "text-zinc-600"}>
                {complete ? <Check size={15} aria-hidden /> : index + 1}
              </span>
              {label}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-zinc-300 sm:col-span-2">
            Boosting service
            <Select value={serviceId} onChange={(event) => setService(event.target.value)}>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-2 text-sm text-zinc-300">
            Account source
            <Select
              value={effectiveAccountMode}
              onChange={(event) => setAccountSource(event.target.value as AccountMode)}
            >
              {linkedRankForQueue ? (
                <option value="linked">
                  Linked - {linkedRankForQueue.accountLabel} ({rankLabel(linkedRankForQueue)})
                </option>
              ) : (
                <option value="linked" disabled>
                  No linked {queue} rank found
                </option>
              )}
              <option value="manual">Manual rank</option>
            </Select>
          </label>

          <label className="grid gap-2 text-sm text-zinc-300">
            Queue
            <Select
              value={queue}
              onChange={(event) => setQueueValue(event.target.value as BoostQueue)}
            >
              {BOOST_QUEUES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </label>

          <label className="grid gap-2 text-sm text-zinc-300">
            Riot account
            <Input
              value={riotId}
              onChange={(event) => setRiotId(event.target.value)}
              placeholder={linkedRankForQueue?.accountLabel ?? "GameName#TAG"}
            />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            Manual Riot ID fallback
            <Input
              value={manualRiotId}
              onChange={(event) => setManualRiotId(event.target.value)}
              placeholder="GameName#TAG"
            />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            Current division
            <Select
              value={`${currentRank.tier}:${currentRank.division}`}
              onChange={(event) => setCurrentRankStage(event.target.value)}
              disabled={effectiveAccountMode === "linked"}
            >
              {currentRankStageOptions.map((rank) => (
                <option key={`${rank.tier}:${rank.division}`} value={`${rank.tier}:${rank.division}`}>
                  {rankStageLabel(rank)}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            Current LP
            <Input
              type="number"
              min={0}
              max={rankLpLimit(currentRank.tier)}
              value={currentRank.lp}
              onChange={(event) => setCurrentLpValue(Number(event.target.value))}
              disabled={effectiveAccountMode === "linked"}
            />
          </label>

          {usesTargetRank ? (
            <>
              <label className="grid gap-2 text-sm text-zinc-300">
                Target division
                <Select value={targetRankStageValue} onChange={(event) => setTargetRankStage(event.target.value)}>
                  {!selectedTargetRankIsAvailable ? (
                    <option value={targetRankStageValue} disabled>
                      {rankStageLabel(targetRank)} unavailable
                    </option>
                  ) : null}
                  {targetRankStageOptions.map((rank) => {
                    const sameStage = rankStageScore(rank) === rankStageScore(currentRank);
                    const hasHigherLpOption = getLpOptionsForRank(rank).some(
                      (lp) => lp > currentRank.lp,
                    );
                    const disabled =
                      rankStageScore(rank) < rankStageScore(currentRank) ||
                      (sameStage && !hasHigherLpOption);

                    return (
                      <option
                        key={`${rank.tier}:${rank.division}`}
                        value={`${rank.tier}:${rank.division}`}
                        disabled={disabled}
                      >
                        {rankStageLabel(rank)}
                      </option>
                    );
                  })}
                </Select>
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Target LP
                <Select value={targetLp} onChange={(event) => setTargetLp(Number(event.target.value))}>
                  {getLpOptionsForRank(targetRank).map((lp) => {
                    const sameStage = rankStageScore(targetRank) === rankStageScore(currentRank);

                    return (
                      <option key={lp} value={lp} disabled={sameStage && lp <= currentRank.lp}>
                        {lp} LP
                      </option>
                    );
                  })}
                </Select>
              </label>
            </>
          ) : null}

          {method === "net-wins" ? (
            <label className="grid gap-2 text-sm text-zinc-300">
              Net wins
              <Select value={netWins} onChange={(event) => setNetWins(Number(event.target.value))}>
                {Array.from({ length: 15 }, (_item, index) => index + 1).map((wins) => (
                  <option key={wins} value={wins}>
                    {wins} net {wins === 1 ? "win" : "wins"}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          {method === "placements" ? (
            <label className="grid gap-2 text-sm text-zinc-300">
              Placement games
              <Select value={placementGames} onChange={(event) => setPlacementGames(Number(event.target.value))}>
                {Array.from({ length: pricingConfig.placements.maxGames }, (_item, index) => index + 1).map((games) => (
                  <option key={games} value={games}>
                    {games} {games === 1 ? "game" : "games"}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          {method === "duo" ? (
            <label className="grid gap-2 text-sm text-zinc-300">
              Duo premium
              <Select value={duoPremium} onChange={(event) => setDuoPremium(Number(event.target.value))}>
                {pricingConfig.duo.premiumOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          {method === "pay-per-game" ? (
            <label className="grid gap-2 text-sm text-zinc-300">
              Games
              <Select value={payPerGames} onChange={(event) => setPayPerGames(Number(event.target.value))}>
                {Array.from({ length: 20 }, (_item, index) => index + 1).map((games) => (
                  <option key={games} value={games}>
                    {games} {games === 1 ? "game" : "games"}
                  </option>
                ))}
              </Select>
            </label>
          ) : null}

          {roleSelectionEnabled ? (
            <label className="grid gap-2 text-sm text-zinc-300">
              Role
              <Select value={role} onChange={(event) => setRole(event.target.value)}>
                {roles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </label>
          ) : null}
          <div className="rounded-md border border-white/10 bg-white/6 p-3 text-sm text-zinc-300">
            <p className="font-semibold text-white">Assignment</p>
            <p className="mt-1 text-zinc-400">
              Auto-assigned after payment from available order handlers.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-zinc-300 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold text-white">Add-ons</span>
              <button
                type="button"
                onClick={clearAddOns}
                className={[
                  "rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                  selectedAddOnIds.length === 0
                    ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                    : "border-white/10 bg-white/6 text-zinc-300 hover:bg-white/10",
                ].join(" ")}
              >
                No add-ons
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pricingConfig.addOns.map((addOn) => {
                const active = selectedAddOnIds.includes(addOn.id);

                return (
                  <label
                    key={addOn.id}
                    className={[
                      "grid min-h-24 cursor-pointer grid-cols-[auto_1fr_auto] gap-3 rounded-md border p-3 transition",
                      active
                        ? "border-cyan-300/35 bg-cyan-300/10"
                        : "border-white/10 bg-white/6 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleAddOn(addOn.id)}
                      className="mt-1 h-4 w-4 accent-emerald-300"
                    />
                    <span>
                      <span className="block font-semibold text-white">{addOn.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-500">
                        {addOn.description}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-emerald-200">
                      {formatAddOnPrice(addOn)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {championPoolEnabled ? (
            <ChampionPoolPicker
              selected={selectedChampions}
              onChange={setSelectedChampions}
            />
          ) : null}
        </div>

        <div className="rounded-lg border border-white/10 bg-black/25 p-5">
          <div className="grid gap-4">
            {method === "duo" ? (
              <div className="flex items-center gap-3">
                <Link2 className="text-cyan-200" size={20} aria-hidden />
                <div>
                  <p className="font-semibold text-white">Safe Riot linking</p>
                  <p className="text-sm text-zinc-400">OAuth-ready, no passwords, unlink anytime.</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <UserRound className="text-emerald-200" size={20} aria-hidden />
              <div>
                <p className="font-semibold text-white">Order visibility</p>
                <p className="text-sm text-zinc-400">Handlers see order notes and shared stats only.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="text-amber-200" size={20} aria-hidden />
              <div>
                <p className="font-semibold text-white">Stripe checkout</p>
                <p className="text-sm text-zinc-400">Payment routes are server-side and env driven.</p>
              </div>
            </div>
          </div>
          <div className="mt-5 rounded-md border border-white/10 bg-white/6 p-3 text-sm leading-6 text-zinc-300">
            <p className="font-semibold text-white">Selected requirement</p>
            <p className="mt-1 text-zinc-400">{queue}</p>
            <p className="mt-1 text-zinc-400">{goalRank}</p>
            <p className="mt-1 text-zinc-500">Current: {rankLabel(currentRank)}</p>
            {roleSelectionEnabled ? (
              <p className="mt-1 text-zinc-500">Role: {role}</p>
            ) : null}
            <p className="mt-1 text-zinc-500">
              Add-ons: {selectedAddOns.length ? selectedAddOns.join(", ") : "None"}
            </p>
          </div>
          <div className="mt-4 rounded-md border border-emerald-300/20 bg-emerald-300/8 p-3 text-sm leading-6 text-zinc-300">
            <p className="font-semibold text-white">Price estimate</p>
            <div className="mt-2 grid gap-2">
              {quote.lineItems.map((item) => (
                <div key={`${item.label}-${item.value}`} className="flex justify-between gap-3">
                  <span className="text-zinc-400">{item.label}</span>
                  <span className="font-semibold text-white">{item.value}</span>
                </div>
              ))}
              <div className="mt-1 flex justify-between gap-3 border-t border-white/10 pt-3 text-base">
                <span className="font-semibold text-zinc-200">Total</span>
                <span className="font-black text-emerald-200">
                  {formatCurrency(quote.total)}
                </span>
              </div>
            </div>
          </div>
          {quote.invalidReason ? (
            <div className="mt-4 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">
              {quote.invalidReason}
            </div>
          ) : null}
          {error ? (
            <div className="mt-5 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          <Button className="mt-6 w-full" onClick={continueFlow} disabled={loading || Boolean(quote.invalidReason)}>
            {loading ? "Connecting..." : step >= 5 ? "Create order and pay" : "Continue"}
          </Button>
          <p className="mt-3 text-center text-xs leading-5 text-zinc-500">
            By creating an order, you agree to the{" "}
            <Link href="/terms" className="font-semibold text-emerald-200 hover:text-emerald-100">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}

function getGoalSummary(
  method: BoostMethod,
  targetRank: RankSelection,
  netWins: number,
  placementGames: number,
  payPerGames: number,
) {
  if (method === "net-wins") {
    return `${netWins} net ${netWins === 1 ? "win" : "wins"}`;
  }

  if (method === "placements") {
    return `${placementGames} placement ${placementGames === 1 ? "game" : "games"}`;
  }

  if (method === "pay-per-game") {
    return `${payPerGames} paid ${payPerGames === 1 ? "game" : "games"}`;
  }

  return rankLabel(targetRank);
}

function getLinkedRankForQueue(linkedRanks: LinkedBoostRank[], queue: BoostQueue) {
  return linkedRanks.find((rank) => rank.queue === queue) ?? null;
}

function getSelectedAddOns(
  addOnIds: AddOnId[],
  selectedChampions: string[],
  selectedRole: string | null,
  addOns: BoostAddOn[],
) {
  const labels = addOns
    .filter((item) => addOnIds.includes(item.id))
    .map((item) =>
      item.id === "role-selection" && selectedRole
        ? `Role selection: ${selectedRole}`
        : item.label,
    );

  if (addOnIds.includes("champion-request") && selectedChampions.length) {
    return [...labels, `Champion pool: ${selectedChampions.join(", ")}`];
  }

  return labels;
}

function parseAddOns(value: string | undefined, addOns: BoostAddOn[]): AddOnId[] {
  if (!value) {
    return [];
  }

  const allowed = new Set<AddOnId>(addOns.map((item) => item.id));

  return value
    .split(",")
    .filter((item): item is AddOnId => allowed.has(item as AddOnId));
}

function toBoostQueue(value?: string): BoostQueue | null {
  if (value === "Ranked Solo/Duo" || value === "Ranked Flex") {
    return value;
  }

  return null;
}

function formatAddOnPrice(addOn: BoostAddOn) {
  if (addOn.mode === "percent") {
    return `+${Math.round(addOn.amount * 100)}%`;
  }

  return `+${formatCurrency(addOn.amount)}`;
}

function clampRankLp(tier: RankTier, value: number) {
  return clampRankLpForTier(tier, value);
}

function methodUsesTargetRank(method: BoostMethod) {
  return method === "division" || method === "duo";
}

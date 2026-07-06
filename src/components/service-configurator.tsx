"use client";

import {
  CreditCard,
  Gamepad2,
  Medal,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ChampionPoolPicker } from "@/components/champion-pool-picker";
import { Badge } from "@/components/ui/badge";
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

type AccountMode = "linked" | "manual";

const defaultCurrentRank: RankSelection = {
  tier: "Gold",
  division: "II",
  lp: 62,
};

const regions = ["EUW", "EUNE", "NA", "KR", "BR", "LAN", "LAS", "OCE", "TR"];
const roles = ["Top", "Jungle", "Mid", "ADC", "Support"];

const methodMeta: Record<
  BoostMethod,
  {
    icon: typeof Trophy;
    badge: string;
    title: string;
    summary: string;
  }
> = {
  division: {
    icon: Trophy,
    badge: "Rank target",
    title: "Division boost",
    summary: "Priced from current rank and LP to a higher target rank and LP.",
  },
  "net-wins": {
    icon: Medal,
    badge: "Guaranteed net",
    title: "Net wins",
    summary: "Losses do not reduce the paid win target.",
  },
  placements: {
    icon: Swords,
    badge: "1-5 games",
    title: "Placements",
    summary: "League placement orders cap at five selected games.",
  },
  duo: {
    icon: Users,
    badge: "Self-play",
    title: "Duo boost",
    summary: "The player queues with the booster at a selectable 50-100% premium.",
  },
  "pay-per-game": {
    icon: Gamepad2,
    badge: "Per game",
    title: "Pay per game",
    summary: "Every game counts, win or loss, at a lower rate than net wins.",
  },
};

export function ServiceConfigurator({
  services,
  pricingConfig,
  linkedRanks = [],
}: {
  services: Service[];
  pricingConfig: BoostPricingConfig;
  linkedRanks?: LinkedBoostRank[];
}) {
  const initialQueue = linkedRanks[0]?.queue ?? BOOST_QUEUES[0];
  const initialLinkedRank = getLinkedRankForQueue(linkedRanks, initialQueue);
  const initialTargetRank = getNextTargetRank(initialLinkedRank ?? defaultCurrentRank);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [accountMode, setAccountMode] = useState<AccountMode>(
    initialLinkedRank ? "linked" : "manual",
  );
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
  const [queue, setQueue] = useState<BoostQueue>(initialQueue);
  const [region, setRegion] = useState(regions[0]);
  const [role, setRole] = useState(roles[2]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<AddOnId[]>([]);
  const [selectedChampions, setSelectedChampions] = useState<string[]>([]);

  const service = services.find((item) => item.id === serviceId) ?? services[0];
  const method = useMemo(() => getBoostMethodForService(service), [service]);
  const meta = methodMeta[method];
  const CurrentIcon = meta.icon;
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

  if (!service) {
    return (
      <GlassPanel className="p-5 text-sm text-zinc-400">
        No active boost services are configured yet.
      </GlassPanel>
    );
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

  function setCurrentLpValue(value: number) {
    const nextLp = clampRankLp(manualCurrentRank.tier, value);
    const nextCurrentRank = {
      ...manualCurrentRank,
      lp: nextLp,
    };

    setCurrentLp(nextLp);
    coerceTargetForCurrent(nextCurrentRank);
  }

  function setService(nextServiceId: string) {
    const nextService = services.find((item) => item.id === nextServiceId);
    const nextMethod = getBoostMethodForService(nextService);

    setServiceId(nextServiceId);
    coerceTargetForCurrent(currentRank, nextMethod);
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

  function continueToCheckout() {
    const params = new URLSearchParams({
      service: service.id,
      method,
      queue,
      estimate: String(quote.total),
    });

    if (selectedAddOnIds.length) {
      params.set("addons", selectedAddOnIds.join(","));
    }

    window.location.assign(`/checkout?${params.toString()}`);
  }

  return (
    <GlassPanel className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm text-zinc-300 sm:col-span-2">
          Boost method
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
              <Select
                value={targetRankStageValue}
                onChange={(event) => setTargetRankStage(event.target.value)}
              >
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

        <label className="grid gap-2 text-sm text-zinc-300">
          Region
          <Select value={region} onChange={(event) => setRegion(event.target.value)}>
            {regions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </label>

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
        <div className="flex flex-wrap items-center gap-2">
          {method === "duo" ? (
            <Badge tone="emerald">No Riot password required</Badge>
          ) : null}
          <Badge tone="cyan">{meta.badge}</Badge>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <CurrentIcon size={24} className="mt-1 text-amber-200" aria-hidden />
          <div>
            <h3 className="text-2xl font-bold text-white">{service.title}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{meta.summary}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-zinc-400">{service.description}</p>

        <div className="mt-5 grid gap-3 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-zinc-400">Queue</span>
            <span className="font-semibold text-white">{queue}</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-zinc-400">Current state</span>
            <span className="font-semibold text-white">{rankLabel(currentRank)}</span>
          </div>
          {usesTargetRank ? (
            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-zinc-400">Target state</span>
              <span className="font-semibold text-white">{rankLabel(targetRank)}</span>
            </div>
          ) : null}
          {championPoolEnabled ? (
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <span className="text-zinc-400">Champion pool</span>
              <span className="text-right font-semibold text-white">
                {selectedChampions.length
                  ? `${selectedChampions.length} selected`
                  : "Any champion"}
              </span>
            </div>
          ) : null}
          {roleSelectionEnabled ? (
            <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
              <span className="text-zinc-400">Selected role</span>
              <span className="text-right font-semibold text-white">{role}</span>
            </div>
          ) : null}
          {quote.lineItems.map((item) => (
            <div key={`${item.label}-${item.value}`} className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-zinc-400">{item.label}</span>
              <span className="font-semibold text-white">{item.value}</span>
            </div>
          ))}
          <div className="flex justify-between text-lg">
            <span className="text-zinc-300">Estimated price</span>
            <span className="font-bold text-emerald-200">{formatCurrency(quote.total)}</span>
          </div>
        </div>

        {quote.invalidReason ? (
          <div className="mt-5 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100">
            {quote.invalidReason}
          </div>
        ) : method === "duo" ? (
          <div className="mt-5 rounded-md border border-emerald-300/20 bg-emerald-300/8 p-3 text-sm leading-6 text-emerald-100">
            <ShieldCheck size={16} className="mr-2 inline" aria-hidden />
            Order handlers can view shared order context and notes, but cannot request or receive Riot login credentials.
          </div>
        ) : null}

        <Button className="mt-5 w-full" type="button" onClick={continueToCheckout} disabled={Boolean(quote.invalidReason)}>
          <CreditCard size={17} aria-hidden />
          Continue to secure checkout
        </Button>
      </div>
    </GlassPanel>
  );
}

function getLinkedRankForQueue(linkedRanks: LinkedBoostRank[], queue: BoostQueue) {
  return linkedRanks.find((rank) => rank.queue === queue) ?? null;
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

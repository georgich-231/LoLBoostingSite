import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Link2,
  Radio,
  ShieldCheck,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { LpChart } from "@/components/lp-chart";
import { ManualRiotLinkForm } from "@/components/manual-riot-link-form";
import { MatchList } from "@/components/match-list";
import { MetricCard } from "@/components/metric-card";
import { ProfileSectionTabs } from "@/components/profile-section-tabs";
import { RefreshProfileButton } from "@/components/refresh-profile-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { boostQueuePriority } from "@/lib/boost-pricing";
import { championIconUrl, rankEmblemUrl } from "@/lib/league-assets";
import {
  rankLpLabel,
  rankScore,
  rankStageLabel,
  rankStageScore,
} from "@/lib/rank-progression";
import { getLiveGameForRiotAccount, getProfileForUser } from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";
import type { Match, RankSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="amber">Sign in required</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Connect an account to load real ranked data.
          </h1>
          <p className="mt-4 text-zinc-400">
            Create a RiftProgress account first, then connect your League data
            through OAuth or manual Riot ID search.
          </p>
          <Link href="/auth" className={buttonVariants({ className: "mt-6" })}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (user.role === "COACH") {
    redirect("/booster");
  }

  const profile = await getProfileForUser(user.id);

  if (!profile) {
    return (
      <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <ProfileSectionTabs active="lol" />
        <section>
          <Badge tone="emerald">Real Riot connection</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Link your Riot account.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            Use Riot Sign On when your production OAuth credentials are set, or
            link by Riot ID with a server-side `RIOT_API_KEY`. Both paths store
            only Riot account metadata and synced gameplay stats.
          </p>
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <Link2 className="text-emerald-300" size={23} aria-hidden />
              <h2 className="text-xl font-bold text-white">Riot Sign On</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Requires `RIOT_CLIENT_ID`, `RIOT_CLIENT_SECRET`, and a registered
              redirect URI. This is the preferred production account-link flow.
            </p>
            <Link href="/api/riot/link/start" className={buttonVariants({ className: "mt-5 w-full" })}>
              Start Riot OAuth
            </Link>
          </GlassPanel>
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-cyan-300" size={23} aria-hidden />
              <h2 className="text-xl font-bold text-white">Manual Riot ID sync</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              For development keys, enter a Riot ID. The server resolves PUUID,
              summoner profile, ranked entries, and recent matches through Riot API.
            </p>
            <div className="mt-5">
              <ManualRiotLinkForm />
            </div>
          </GlassPanel>
        </div>
      </main>
    );
  }

  const ranksByQueue = latestRanks(profile.ranks);
  const chartSnapshots = toChartSnapshots(profile.ranks);
  const matches = profile.matches.map(toMatchListItem);
  const perGameLpSnapshots = toPerGameLpSnapshots(matches);
  const rankMovementEvents = toRankMovementEvents(profile.ranks);
  const rankImprovement = getRankImprovement(profile.ranks, "Ranked Solo/Duo");
  const liveGame = await getLiveGameForRiotAccount(profile.account.id).catch(
    () => null,
  );
  const recentRankedMatches = matches
    .filter((match) => match.queue === "Ranked Solo/Duo" || match.queue === "Ranked Flex")
    .slice(0, 10);
  const recentWins = recentRankedMatches.filter((match) => match.result === "Win").length;
  const averageKda = getAverageKda(profile.matches);
  const bestChampion = getBestChampion(profile.championStats);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileSectionTabs active="lol" />
      <section>
        <GlassPanel className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#67e8f9,#34d399,#fbbf24)]" />
          <div className="grid gap-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/15 bg-white/8 sm:h-24 sm:w-24">
              {profile.account.summonerIconUrl ? (
                <Image
                  src={profile.account.summonerIconUrl}
                  alt={`${profile.account.gameName} summoner icon`}
                  fill
                  sizes="96px"
                  quality={100}
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <Badge tone="emerald">Linked Riot account</Badge>
              <h1 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-4xl">
                {profile.account.gameName}#{profile.account.tagLine}
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                {profile.account.platform} - Level{" "}
                {profile.account.summonerLevel ?? "unknown"} - Last synced{" "}
                {profile.lastUpdated
                  ? new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(profile.lastUpdated)
                  : "never"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              {liveGame ? (
                <Link
                  href="/dashboard/live"
                  className={buttonVariants({ variant: "primary" })}
                >
                  <Radio size={17} aria-hidden />
                  Live game
                </Link>
              ) : null}
              <RefreshProfileButton />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {ranksByQueue.length ? (
              ranksByQueue.map((rank) => (
                <div
                  key={rank.queueType}
                  className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-white/10 bg-white/7 p-4"
                >
                  <div className="relative -my-6 -ml-5 h-36 w-36 shrink-0 sm:h-40 sm:w-40 lg:h-44 lg:w-44">
                    <Image
                      src={rankEmblemUrl(rank.tier)}
                      alt={`${rank.tier} rank emblem`}
                      fill
                      sizes="176px"
                      quality={100}
                      className="scale-[1.85] object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.55)]"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">{rank.queueType}</p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {rankLpLabel(rank)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {rank.wins}W {rank.losses}L -{" "}
                      {Math.round((rank.wins / Math.max(rank.wins + rank.losses, 1)) * 100)}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-amber-300/20 bg-amber-300/8 p-4 text-sm text-amber-100 sm:col-span-2">
                Riot returned no ranked queues for this account yet.
              </div>
            )}
          </div>
        </GlassPanel>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Recent form"
          value={
            recentRankedMatches.length
              ? `${recentWins}W ${recentRankedMatches.length - recentWins}L`
              : "No games"
          }
          detail="Last 10 ranked games"
          accent="emerald"
        />
        <MetricCard
          label="Average KDA"
          value={averageKda}
          detail="Across synced matches"
          accent="cyan"
        />
        <MetricCard
          label="Best champion"
          value={bestChampion.name}
          detail={bestChampion.detail}
          accent="amber"
        />
        <MetricCard
          label="Solo/Duo movement"
          value={`${rankImprovement.delta > 0 ? "+" : ""}${rankImprovement.delta} LP`}
          detail="Since first tracked snapshot"
          accent={rankImprovement.delta >= 0 ? "emerald" : "rose"}
          trend={rankImprovement.delta < 0 ? "down" : "up"}
        />
      </section>

      <section className="mt-10">
        <div>
          <Badge tone="emerald">League account history</Badge>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Match history and rank tracking
          </h2>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="grid gap-4">
            {perGameLpSnapshots.length > 1 ? (
              <LpChart snapshots={perGameLpSnapshots} />
            ) : chartSnapshots.length > 1 ? (
              <LpChart snapshots={chartSnapshots} />
            ) : (
              <GlassPanel className="p-5 text-sm text-zinc-400">
                Refresh after more ranked movement to build an LP chart.
              </GlassPanel>
            )}
            {matches.length ? (
              <MatchList matches={matches} />
            ) : (
              <GlassPanel className="p-5 text-sm text-zinc-400">
                No recent matches have been synced yet.
              </GlassPanel>
            )}
          </div>

          <div className="grid content-start gap-4">
            <GlassPanel className="p-5">
              <div className="flex items-center gap-3">
                <TrendingUp size={22} className="text-cyan-200" aria-hidden />
                <h2 className="text-xl font-bold text-white">Rank improvement</h2>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-zinc-300">
                <RankImprovementRow label="First tracked" value={rankImprovement.first} />
                <RankImprovementRow label="Latest tracked" value={rankImprovement.latest} />
                <RankImprovementRow
                  label="Net LP movement"
                  value={`${rankImprovement.delta > 0 ? "+" : ""}${rankImprovement.delta} LP`}
                />
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="flex items-center gap-3">
                <Trophy size={22} className="text-amber-200" aria-hidden />
                <h2 className="text-xl font-bold text-white">Promotions & divisions</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {rankMovementEvents.length ? (
                  rankMovementEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-md border border-white/10 bg-white/6 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span
                            className={
                              event.direction === "up"
                                ? "mt-0.5 text-emerald-200"
                                : "mt-0.5 text-rose-200"
                            }
                          >
                            {event.direction === "up" ? (
                              <ArrowUpRight size={18} aria-hidden />
                            ) : (
                              <ArrowDownRight size={18} aria-hidden />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-white">{event.title}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {event.from} to {event.to} - {event.queueType}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={
                              event.lpDelta >= 0
                                ? "font-bold text-emerald-200"
                                : "font-bold text-rose-200"
                            }
                          >
                            {event.lpDelta > 0 ? "+" : ""}
                            {event.lpDelta} LP
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">{event.date}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-white/10 bg-white/6 p-3 text-sm text-zinc-400">
                    No promotion or division change has been captured yet.
                  </p>
                )}
              </div>
            </GlassPanel>

            <GlassPanel className="p-5">
              <div className="flex items-center gap-3">
                <Trophy size={22} className="text-amber-200" aria-hidden />
                <h2 className="text-xl font-bold text-white">Champion performance</h2>
              </div>
              <div className="mt-5 grid gap-3">
                {profile.championStats.length ? (
                  profile.championStats.map((stat) => (
                    <div
                      key={stat.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-white/10 bg-white/6 p-3"
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-md border border-white/10">
                        <Image
                          src={championIconUrl(stat.champion)}
                          alt={stat.champion}
                          fill
                          sizes="40px"
                          quality={100}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{stat.champion}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {stat.games} games - {stat.avgKda.toFixed(2)} KDA -{" "}
                          {stat.csPerMin.toFixed(1)} CS/min
                        </p>
                      </div>
                      <span className="font-bold text-emerald-200">
                        {Math.round(stat.winRate)}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">No champion aggregates yet.</p>
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      </section>

    </main>
  );
}

type RankRow = {
  queueType: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  capturedAt: Date;
};

type RankMovementEvent = {
  id: string;
  queueType: string;
  title: string;
  from: string;
  to: string;
  lpDelta: number;
  direction: "up" | "down";
  date: string;
  capturedAt: Date;
};

function RankImprovementRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/6 p-3">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function getRankImprovement(ranks: RankRow[], queueType: string) {
  const sorted = ranks
    .filter((rank) => rank.queueType === queueType)
    .slice()
    .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  if (!first || !latest) {
    return {
      first: "No snapshot yet",
      latest: "No snapshot yet",
      delta: 0,
    };
  }

  return {
    first: rankLpLabel(first),
    latest: rankLpLabel(latest),
    delta: rankScore(latest) - rankScore(first),
  };
}

function toRankMovementEvents(ranks: RankRow[]): RankMovementEvent[] {
  const byQueue = new Map<string, RankRow[]>();

  for (const rank of ranks) {
    byQueue.set(rank.queueType, [...(byQueue.get(rank.queueType) ?? []), rank]);
  }

  const events: RankMovementEvent[] = [];

  for (const [queueType, queueRanks] of byQueue) {
    const sorted = queueRanks
      .slice()
      .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const previousStage = rankStageScore(previous);
      const currentStage = rankStageScore(current);

      if (previousStage === currentStage) {
        continue;
      }

      const direction = currentStage > previousStage ? "up" : "down";
      const to = rankStageLabel(current);

      events.push({
        id: `${queueType}-${current.capturedAt.toISOString()}-${to}`,
        queueType,
        title: direction === "up" ? `Promoted to ${to}` : `Moved to ${to}`,
        from: rankStageLabel(previous),
        to,
        lpDelta: rankScore(current) - rankScore(previous),
        direction,
        date: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(current.capturedAt),
        capturedAt: current.capturedAt,
      });
    }
  }

  return events
    .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())
    .slice(0, 5);
}

function latestRanks(ranks: Array<{
  queueType: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  capturedAt: Date;
}>) {
  const seen = new Set<string>();
  const latest = ranks
    .slice()
    .sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime())
    .filter((rank) => {
      if (seen.has(rank.queueType)) {
        return false;
      }
      seen.add(rank.queueType);
      return true;
    });

  return latest.sort(
    (a, b) => boostQueuePriority(a.queueType) - boostQueuePriority(b.queueType),
  );
}

function toChartSnapshots(ranks: Array<{
  queueType: string;
  tier: string;
  division: string;
  lp: number;
  capturedAt: Date;
}>): RankSnapshot[] {
  return ranks
    .filter((rank) => rank.queueType === "Ranked Solo/Duo")
    .slice()
    .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime())
    .map((rank) => ({
      date: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(rank.capturedAt),
      label: `${rank.lp}`,
      lp: rankScore(rank),
      rank: rankLpLabel(rank),
    }));
}

function toMatchListItem(match: {
  id: string;
  riotMatchId: string;
  champion: string;
  role: string;
  queueType: string;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  csPerMin: number;
  damage: number;
  visionScore: number;
  lpChange: number | null;
  lpChangeSource: string | null;
  durationSec: number;
  playedAt: Date;
}): Match {
  const exactLp = match.lpChangeSource === "riot-snapshot" ? match.lpChange : null;
  const estimatedLp = estimateLpChange(match.result, match.queueType);
  const lpChange = exactLp ?? estimatedLp;

  return {
    id: match.id,
    champion: match.champion,
    role: normalizeRoleForUi(match.role),
    queue: match.queueType,
    result: match.result === "Win" ? "Win" : "Loss",
    kda: `${match.kills} / ${match.deaths} / ${match.assists}`,
    csPerMin: Number(match.csPerMin.toFixed(1)),
    damage: match.damage,
    visionScore: match.visionScore,
    lpChange,
    lpChangeSource: exactLp === null ? "estimated" : "exact",
    duration: `${Math.floor(match.durationSec / 60)}:${String(match.durationSec % 60).padStart(2, "0")}`,
    playedAt: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(match.playedAt),
    image: championIconUrl(match.champion),
  };
}

function estimateLpChange(result: string, queueType: string) {
  if (queueType !== "Ranked Solo/Duo" && queueType !== "Ranked Flex") {
    return null;
  }

  return result === "Win" ? 23 : -18;
}

function toPerGameLpSnapshots(matches: Match[]): RankSnapshot[] {
  const rankedMatches = matches
    .filter((match): match is Match & { lpChange: number } =>
        (match.queue === "Ranked Solo/Duo" || match.queue === "Ranked Flex") &&
        match.lpChange !== null,
    )
    .slice()
    .reverse();
  let runningLp = 0;

  return rankedMatches.map((match, index) => {
    runningLp += match.lpChange;

    return {
      date: match.playedAt,
      label: `${match.lpChange > 0 ? "+" : ""}${match.lpChange}`,
      lp: runningLp,
      rank: `Game ${index + 1}: ${match.lpChange > 0 ? "+" : ""}${match.lpChange} LP`,
    };
  });
}

function getAverageKda(matches: Array<{
  kills: number;
  deaths: number;
  assists: number;
}>) {
  if (!matches.length) {
    return "No games";
  }

  const totalKda = matches.reduce(
    (sum, match) => sum + (match.kills + match.assists) / Math.max(match.deaths, 1),
    0,
  );

  return (totalKda / matches.length).toFixed(2);
}

function getBestChampion(championStats: Array<{
  champion: string;
  games: number;
  winRate: number;
}>) {
  const best = championStats
    .slice()
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate)[0];

  if (!best) {
    return {
      name: "No data",
      detail: "Play more synced games",
    };
  }

  return {
    name: best.champion,
    detail: `${best.games} games - ${Math.round(best.winRate)}% win rate`,
  };
}

function normalizeRoleForUi(role: string): Match["role"] {
  if (role === "ADC") {
    return "ADC";
  }
  if (role === "Support") {
    return "Support";
  }
  if (role === "Jungle") {
    return "Jungle";
  }
  if (role === "Top") {
    return "Top";
  }
  return "Mid";
}

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock, Radio, ShieldCheck, Swords } from "lucide-react";
import { ProfileSectionTabs } from "@/components/profile-section-tabs";
import { RefreshProfileButton } from "@/components/refresh-profile-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { rankEmblemUrl } from "@/lib/league-assets";
import {
  getLiveGameForRiotAccount,
  getProfileForUser,
  type LiveGame,
  type LiveLaneRole,
  type LiveGameParticipant,
} from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ROLE_ORDER: LiveLaneRole[] = ["Top", "Jungle", "Mid", "ADC", "Support"];

export default async function LiveGamePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="amber">Sign in required</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Sign in to view live games.
          </h1>
          <Link href="/auth" className={buttonVariants({ className: "mt-6" })}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  const profile = await getProfileForUser(user.id);

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileSectionTabs active="lol" />
        <GlassPanel className="p-6 text-center">
          <Badge tone="amber">No Riot account</Badge>
          <h1 className="mt-4 text-3xl font-black text-white">
            Link a Riot account first.
          </h1>
          <Link
            href="/dashboard"
            className={buttonVariants({ className: "mt-6" })}
          >
            Account tracking
          </Link>
        </GlassPanel>
      </main>
    );
  }

  let liveGame: LiveGame | null = null;
  let liveGameError: string | null = null;

  try {
    liveGame = await getLiveGameForRiotAccount(profile.account.id);
  } catch (error) {
    liveGameError =
      error instanceof Error ? error.message : "Unable to load live game.";
  }

  if (liveGameError) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileSectionTabs active="lol" />
        <GlassPanel className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="rose">Live game unavailable</Badge>
              <h1 className="mt-4 text-3xl font-black text-white">
                Riot could not return live-game data.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                {liveGameError}
              </p>
            </div>
            <RefreshProfileButton />
          </div>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "secondary", className: "mt-6" })}
          >
            <ArrowLeft size={17} aria-hidden />
            Back to tracking
          </Link>
        </GlassPanel>
      </main>
    );
  }

  if (!liveGame) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileSectionTabs active="lol" />
        <GlassPanel className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="zinc">No live game</Badge>
              <h1 className="mt-4 text-3xl font-black text-white">
                Riot does not report an active game right now.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                Refresh after the player loads into champion select or game. If
                Riot returns an active Spectator match, the live game button
                will appear on the account tracking page.
              </p>
            </div>
            <RefreshProfileButton />
          </div>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "secondary", className: "mt-6" })}
          >
            <ArrowLeft size={17} aria-hidden />
            Back to tracking
          </Link>
        </GlassPanel>
      </main>
    );
  }

  const blueTeam = liveGame.participants.filter((player) => player.teamId === 100);
  const redTeam = liveGame.participants.filter((player) => player.teamId !== 100);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileSectionTabs active="lol" />

      <section>
        <GlassPanel className="relative overflow-hidden p-5 sm:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#67e8f9,#34d399,#fbbf24)]" />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="emerald">Live game</Badge>
              <h1 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-4xl">
                {profile.account.gameName}#{profile.account.tagLine}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-300">
                <LiveMeta icon={<Swords size={16} aria-hidden />} value={liveGame.queue} />
                <LiveMeta icon={<Radio size={16} aria-hidden />} value={`${liveGame.mode} - ${liveGame.map}`} />
                <LiveMeta icon={<Clock size={16} aria-hidden />} value={formatGameTime(liveGame)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "secondary" })}
              >
                <ArrowLeft size={17} aria-hidden />
                Tracking
              </Link>
              <RefreshProfileButton />
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="mt-6">
        <LiveMatchupBoard blueTeam={blueTeam} redTeam={redTeam} />
      </section>
    </main>
  );
}

function LiveMatchupBoard({
  blueTeam,
  redTeam,
}: {
  blueTeam: LiveGameParticipant[];
  redTeam: LiveGameParticipant[];
}) {
  return (
    <GlassPanel className="p-4 sm:p-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamHeader teamName="Blue" playerCount={blueTeam.length} />
        <div className="rounded-md border border-white/10 bg-white/6 px-3 py-2 text-center text-xs font-black uppercase tracking-normal text-zinc-400">
          VS
        </div>
        <TeamHeader teamName="Red" playerCount={redTeam.length} align="right" />
      </div>

      <div className="mt-4 grid gap-3">
        {ROLE_ORDER.map((role) => (
          <div
            key={role}
            className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] lg:items-stretch"
          >
            <MatchupPlayerCard player={getPlayerByRole(blueTeam, role)} teamName="Blue" />
            <div className="flex min-h-11 items-center justify-center rounded-md border border-white/10 bg-zinc-950/85 px-3 text-sm font-black text-white lg:min-h-36">
              {role}
            </div>
            <MatchupPlayerCard player={getPlayerByRole(redTeam, role)} teamName="Red" />
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function TeamHeader({
  teamName,
  playerCount,
  align = "left",
}: {
  teamName: "Blue" | "Red";
  playerCount: number;
  align?: "left" | "right";
}) {
  const isBlue = teamName === "Blue";

  return (
    <div
      className={[
        "flex items-center gap-3",
        align === "right" ? "justify-end text-right" : "",
      ].join(" ")}
    >
      <span
        className={
          isBlue
            ? "h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.45)]"
            : "h-3 w-3 rounded-full bg-rose-300 shadow-[0_0_16px_rgba(251,113,133,0.45)]"
        }
      />
      <div>
        <h2 className="text-xl font-bold text-white">{teamName}</h2>
        <p className="text-xs text-zinc-500">{playerCount} players</p>
      </div>
    </div>
  );
}

function MatchupPlayerCard({
  player,
  teamName,
}: {
  player?: LiveGameParticipant;
  teamName: "Blue" | "Red";
}) {
  const isBlue = teamName === "Blue";

  if (!player) {
    return (
      <div className="min-h-36 rounded-lg border border-white/10 bg-white/4 p-3" />
    );
  }

  return (
    <article
      className={[
        "grid min-h-36 gap-3 rounded-lg border p-3",
        "grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto]",
        player.isLinkedAccount
          ? "border-emerald-300/35 bg-emerald-300/10"
          : isBlue
            ? "border-cyan-300/20 bg-cyan-300/7"
            : "border-rose-300/20 bg-rose-300/7",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <div className="relative h-16 w-16 overflow-hidden rounded-md border border-white/15 bg-black/30">
          <Image
            src={player.championImage}
            alt={player.champion}
            fill
            sizes="64px"
            quality={100}
            className="object-cover"
          />
        </div>
        <div className="grid gap-1">
          <SpellIcon spell={player.spell1} />
          <SpellIcon spell={player.spell2} />
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-bold text-white">{player.riotId}</p>
          {player.isLinkedAccount ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
              <ShieldCheck size={12} aria-hidden />
              Linked
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-zinc-300">{player.champion}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {player.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
        <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
          <span className="rounded-md bg-black/25 px-2 py-1">
            {formatChampionExperience(player)}
          </span>
          <span className="rounded-md bg-black/25 px-2 py-1">
            {player.rank.label}
          </span>
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-[auto_1fr] items-center gap-3 sm:col-span-1 sm:block sm:text-right">
        {player.rank.tier ? (
          <div className="relative h-12 w-12 shrink-0 sm:ml-auto">
            <Image
              src={rankEmblemUrl(player.rank.tier)}
              alt={`${player.rank.tier} rank emblem`}
              fill
              sizes="48px"
              quality={100}
              className="scale-150 object-contain"
            />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-lg font-black text-white">
            {player.rank.winRate === null ? "-" : `${player.rank.winRate}%`}
          </p>
          <p className="text-xs text-zinc-500">
            {player.rank.wins}W {player.rank.losses}L
          </p>
        </div>
      </div>
    </article>
  );
}

function getPlayerByRole(players: LiveGameParticipant[], role: LiveLaneRole) {
  return players.find((player) => player.role === role);
}

function formatChampionExperience(player: LiveGameParticipant) {
  const { games, winRate } = player.championExperience;

  if (games === null) {
    return "Champ sample unavailable";
  }

  if (games === 0) {
    return "0 recent champ games";
  }

  return `${games} recent champ ${games === 1 ? "game" : "games"}${
    winRate === null ? "" : ` - ${winRate}%`
  }`;
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        getTagTone(tag),
      ].join(" ")}
    >
      {tag}
    </span>
  );
}

function getTagTone(tag: string) {
  if (tag.includes("Autofill")) {
    return "border-amber-300/25 bg-amber-300/10 text-amber-200";
  }
  if (tag.includes("Main") || tag.includes("Comfort") || tag.includes("Hot")) {
    return "border-emerald-300/25 bg-emerald-300/10 text-emerald-200";
  }
  if (tag.includes("Smite") || tag.includes("Recent")) {
    return "border-cyan-300/25 bg-cyan-300/10 text-cyan-200";
  }

  return "border-white/12 bg-white/8 text-zinc-300";
}

function SpellIcon({
  spell,
}: {
  spell: {
    name: string;
    image: string;
  };
}) {
  return (
    <div className="relative h-6 w-6 overflow-hidden rounded border border-white/15">
      <Image
        src={spell.image}
        alt={spell.name}
        fill
        sizes="24px"
        quality={100}
        className="object-cover"
      />
    </div>
  );
}

function LiveMeta({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/6 px-3 py-2">
      {icon}
      {value}
    </span>
  );
}

function formatGameTime(liveGame: LiveGame) {
  if (liveGame.gameLengthSec > 0) {
    return `${Math.floor(liveGame.gameLengthSec / 60)}:${String(
      liveGame.gameLengthSec % 60,
    ).padStart(2, "0")} in game`;
  }

  if (!liveGame.startedAt) {
    return "Starting now";
  }

  const elapsedSec = Math.max(
    0,
    Math.floor((Date.now() - liveGame.startedAt.getTime()) / 1000),
  );

  return `${Math.floor(elapsedSec / 60)}:${String(elapsedSec % 60).padStart(
    2,
    "0",
  )} in game`;
}

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/panel";
import type { Match } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MatchList({ matches }: { matches: Match[] }) {
  return (
    <GlassPanel className="divide-y divide-white/10 overflow-hidden">
      {matches.map((match) => (
        <article
          key={match.id}
          className="grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
        >
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-md border border-white/10 bg-black/30">
              <Image
                src={match.image}
                alt={match.champion}
                fill
                sizes="64px"
                quality={100}
                className="object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{match.champion}</h3>
                <Badge tone={match.result === "Win" ? "emerald" : "rose"}>
                  {match.result}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-zinc-400">
                {match.role} - {match.queue} - {match.duration}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm sm:text-center">
            <div>
              <p className="text-zinc-500">KDA</p>
              <p className="font-semibold text-white">{match.kda}</p>
            </div>
            <div>
              <p className="text-zinc-500">CS/min</p>
              <p className="font-semibold text-white">{match.csPerMin}</p>
            </div>
            <div>
              <p className="text-zinc-500">Vision</p>
              <p className="font-semibold text-white">{match.visionScore}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
            <div>
              <p
                className={cn(
                  "text-lg font-bold",
                  match.lpChange === null
                    ? "text-zinc-400"
                    : match.lpChange >= 0
                      ? "text-emerald-200"
                      : "text-rose-200",
                )}
              >
                {match.lpChange === null ? (
                  "No LP"
                ) : (
                  <>
                    {match.lpChange > 0 ? "+" : ""}
                    {match.lpChange} LP
                  </>
                )}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-normal text-zinc-500">
                {match.lpChange === null
                  ? "not ranked"
                  : match.lpChangeSource === "exact"
                    ? "exact LP"
                    : "estimated LP"}
              </p>
            </div>
            <p className="text-xs text-zinc-500">{match.playedAt}</p>
          </div>
        </article>
      ))}
    </GlassPanel>
  );
}

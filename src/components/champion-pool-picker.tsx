"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { LOL_CHAMPIONS } from "@/lib/champions";

const MAX_VISIBLE_CHAMPIONS = 24;

export function ChampionPoolPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (champions: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleChampions = useMemo(
    () =>
      LOL_CHAMPIONS.filter((champion) =>
        champion.toLowerCase().includes(normalizedQuery),
      ).slice(0, MAX_VISIBLE_CHAMPIONS),
    [normalizedQuery],
  );

  function toggleChampion(champion: string) {
    if (selected.includes(champion)) {
      onChange(selected.filter((item) => item !== champion));
      return;
    }

    onChange([...selected, champion]);
  }

  return (
    <div className="grid gap-3 rounded-md border border-cyan-300/15 bg-cyan-300/6 p-3 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">Champion pool</p>
          <p className="mt-1 text-xs text-zinc-500">
            Search and select every champion you want included.
          </p>
        </div>
        {selected.length ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/10"
          >
            Clear
          </button>
        ) : null}
      </div>

      {selected.length ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((champion) => (
            <button
              type="button"
              key={champion}
              onClick={() => toggleChampion(champion)}
              className="inline-flex min-h-8 items-center gap-1 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/15"
            >
              {champion}
              <X size={13} aria-hidden />
            </button>
          ))}
        </div>
      ) : null}

      <label className="grid gap-2 text-sm text-zinc-300">
        <span className="sr-only">Search champions</span>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search champions"
            className="pl-9"
          />
        </div>
      </label>

      <div className="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {visibleChampions.map((champion) => {
          const active = selected.includes(champion);

          return (
            <button
              type="button"
              key={champion}
              onClick={() => toggleChampion(champion)}
              className={[
                "min-h-9 rounded-md border px-3 py-2 text-left text-xs font-semibold transition",
                active
                  ? "border-emerald-300/40 bg-emerald-300/12 text-emerald-100"
                  : "border-white/10 bg-white/6 text-zinc-300 hover:bg-white/10",
              ].join(" ")}
            >
              {champion}
            </button>
          );
        })}
      </div>
    </div>
  );
}

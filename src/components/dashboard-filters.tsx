"use client";

import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { championStats, recentMatches } from "@/lib/starter-data";

export function DashboardFilters() {
  const [champion, setChampion] = useState("All champions");
  const [refreshing, setRefreshing] = useState(false);

  const filteredCount = useMemo(() => {
    if (champion === "All champions") {
      return recentMatches.length;
    }

    return recentMatches.filter((match) => match.champion === champion).length;
  }, [champion]);

  function refreshStats() {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 1100);
  }

  return (
    <div className="grid gap-3 rounded-lg border border-white/10 bg-white/6 p-3 sm:grid-cols-[1fr_1fr_auto]">
      <Select aria-label="Queue type" defaultValue="Ranked Solo/Duo">
        <option>Ranked Solo/Duo</option>
        <option>Ranked Flex</option>
      </Select>
      <Select
        aria-label="Champion filter"
        value={champion}
        onChange={(event) => setChampion(event.target.value)}
      >
        <option>All champions</option>
        {championStats.map((stat) => (
          <option key={stat.champion}>{stat.champion}</option>
        ))}
      </Select>
      <Button
        type="button"
        variant="secondary"
        onClick={refreshStats}
        disabled={refreshing}
      >
        <RefreshCw
          size={16}
          className={refreshing ? "animate-spin" : undefined}
          aria-hidden
        />
        {refreshing ? "Refreshing" : "Refresh stats"}
      </Button>
      <div className="flex items-center gap-2 text-sm text-zinc-400 sm:col-span-3">
        <SlidersHorizontal size={15} aria-hidden />
        <span>{filteredCount} recent games visible</span>
        <Badge tone={refreshing ? "amber" : "emerald"}>
          {refreshing ? "Riot API rate limit checked" : "Cache fresh · 4m ago"}
        </Badge>
      </div>
    </div>
  );
}

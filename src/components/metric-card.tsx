import { TrendingDown, TrendingUp } from "lucide-react";
import { GlassPanel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  trend?: "up" | "down" | "flat";
  accent?: "emerald" | "cyan" | "amber" | "rose";
};

const accentClasses = {
  emerald: "text-emerald-200 border-emerald-300/20",
  cyan: "text-cyan-200 border-cyan-300/20",
  amber: "text-amber-200 border-amber-300/20",
  rose: "text-rose-200 border-rose-300/20",
};

export function MetricCard({
  label,
  value,
  detail,
  trend = "up",
  accent = "emerald",
}: MetricCardProps) {
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;

  return (
    <GlassPanel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold text-white">{value}</p>
        </div>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md border bg-white/6",
            accentClasses[accent],
          )}
        >
          <TrendIcon size={18} aria-hidden />
        </span>
      </div>
      <p className="mt-4 text-sm text-zinc-400">{detail}</p>
    </GlassPanel>
  );
}

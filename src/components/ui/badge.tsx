import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "emerald" | "cyan" | "amber" | "rose" | "zinc";
  className?: string;
};

const tones = {
  emerald: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  cyan: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  amber: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  rose: "border-rose-300/25 bg-rose-300/10 text-rose-200",
  zinc: "border-white/15 bg-white/8 text-zinc-200",
};

export function Badge({ children, tone = "zinc", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

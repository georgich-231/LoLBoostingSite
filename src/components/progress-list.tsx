import { CheckCircle2, Circle } from "lucide-react";
import { GlassPanel } from "@/components/ui/panel";
import type { OrderMilestone } from "@/lib/types";

export function ProgressList({ milestones }: { milestones: OrderMilestone[] }) {
  return (
    <GlassPanel className="p-5">
      <div className="grid gap-4">
        {milestones.map((milestone) => {
          const Icon = milestone.complete ? CheckCircle2 : Circle;

          return (
            <div key={milestone.title} className="grid grid-cols-[auto_1fr] gap-3">
              <Icon
                size={20}
                className={milestone.complete ? "text-emerald-300" : "text-zinc-500"}
                aria-hidden
              />
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{milestone.title}</h3>
                  <span className="text-xs text-zinc-500">{milestone.date}</span>
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  {milestone.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

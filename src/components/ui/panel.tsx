import { cn } from "@/lib/utils";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
};

export function GlassPanel({ children, className, as: Component = "div" }: PanelProps) {
  return (
    <Component
      className={cn(
        "rounded-lg border border-white/12 bg-zinc-950/62 shadow-[0_18px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </Component>
  );
}

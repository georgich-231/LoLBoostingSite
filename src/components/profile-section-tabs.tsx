import Link from "next/link";
import { Activity, Crown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileSectionTab = "lol" | "boosting";

const tabs = [
  {
    href: "/dashboard",
    label: "LoL account tracking",
    value: "lol",
    icon: Activity,
  },
  {
    href: "/dashboard/boosting",
    label: "Boosting profile",
    value: "boosting",
    icon: Crown,
  },
] satisfies Array<{
  href: string;
  label: string;
  value: ProfileSectionTab;
  icon: typeof Activity;
}>;

export function ProfileSectionTabs({ active }: { active: ProfileSectionTab }) {
  return (
    <nav
      aria-label="Profile sections"
      className="mb-6 grid gap-2 sm:inline-grid sm:grid-cols-2"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.value === active;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              buttonVariants({
                variant: isActive ? "primary" : "secondary",
                className: "justify-start sm:justify-center",
              }),
              !isActive && "bg-white/5",
            )}
          >
            <Icon size={17} aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

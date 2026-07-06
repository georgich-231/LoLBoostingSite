import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import type { Service } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import divisionBoostImage from "@/app/images/division_boost_transparent.png";
import duoBoostImage from "@/app/images/duo_boost_transparent.png";
import netWinsImage from "@/app/images/net_wins_transparent.png";
import payPerGameImage from "@/app/images/pay_per_games_transparent.png";
import placementBoostImage from "@/app/images/placements_boost_transparent.png";

const serviceImages = {
  "division-boost": divisionBoostImage,
  "duo-boost": duoBoostImage,
  "duo-boosting": duoBoostImage,
  "net-wins-boost": netWinsImage,
  "win-boost": netWinsImage,
  "pay-per-game": payPerGameImage,
  "placement-boost": placementBoostImage,
} as const;

export function ServiceCard({ service }: { service: Service }) {
  const image = serviceImages[service.id as keyof typeof serviceImages] ?? service.image;

  return (
    <GlassPanel as="article" className="overflow-hidden">
      <div className="relative h-44 overflow-hidden bg-zinc-950">
        <Image
          src={image}
          alt={`${service.title} visual`}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-contain p-3"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/15 to-transparent" />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-white">{service.title}</h3>
          <span className="text-right text-lg font-bold text-emerald-200">
            {formatCurrency(service.basePrice)}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {service.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
          <Clock size={16} className="text-amber-200" aria-hidden />
          {service.sessionLength}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <Link
          href={`/checkout?service=${service.id}`}
          className={buttonVariants({
            variant: "secondary",
            className: "mt-5 w-full",
          })}
        >
          Configure service
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
    </GlassPanel>
  );
}

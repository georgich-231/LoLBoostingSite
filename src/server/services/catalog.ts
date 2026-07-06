import { prisma } from "@/server/prisma";
import type { Service } from "@/lib/types";

const CATEGORY_IMAGE: Record<string, string> = {
  ELO_BOOSTING:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Irelia_0.jpg",
  DUO_BOOSTING:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lucian_0.jpg",
  PLACEMENT_BOOST:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Akali_0.jpg",
  WIN_BOOST:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg",
  PAY_PER_GAME:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Nidalee_0.jpg",
  PROMO_HELP:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Riven_0.jpg",
  RANKED_BOOST_PLAN:
    "https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Thresh_0.jpg",
};

type DbService = {
  slug: string;
  category: string;
  title: string;
  description: string;
  basePriceCents: number;
  estimatedLengthMin: number;
  addOns: unknown;
};

export async function listActiveServices(): Promise<Service[]> {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ basePriceCents: "asc" }, { title: "asc" }],
  });

  return services.map(toCatalogService);
}

export function toCatalogService(service: DbService): Service {
  const addOns = Array.isArray(service.addOns)
    ? service.addOns.filter((item): item is string => typeof item === "string")
    : [];
  const category = formatCategory(service.category);

  return {
    id: service.slug,
    category,
    title: service.title,
    description: service.description,
    basePrice: service.basePriceCents / 100,
    sessionLength: formatDuration(service.estimatedLengthMin),
    tags: addOns.length ? addOns.slice(0, 3) : [category],
    includes: addOns,
    image: CATEGORY_IMAGE[service.category] ?? CATEGORY_IMAGE.ELO_BOOSTING,
  };
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min setup`;
  }

  const hours = minutes / 60;

  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h setup`;
}

function formatCategory(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

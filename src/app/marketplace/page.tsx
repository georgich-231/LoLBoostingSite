import { redirect } from "next/navigation";
import { ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { ServiceCard } from "@/components/service-card";
import { ServiceConfigurator } from "@/components/service-configurator";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/ui/panel";
import { listActiveServices } from "@/server/services/catalog";
import { getLinkedRanksForBoostConfigurator } from "@/server/services/linked-ranks";
import { getBoostPricingConfig } from "@/server/services/pricing";
import { getCurrentUser } from "@/server/session";

const marketplaceFaq = [
  {
    question: "Do solo boosts require League account login details?",
    answer:
      "Division boosts, net wins, placement boosts, and pay-per-game orders usually require the League account username and password after checkout so the booster can play the order. Duo boost is self-play and does not require sharing login details.",
  },
  {
    question: "Where are account-access details handled?",
    answer:
      "Any required account-access handoff belongs inside the protected paid order flow, not public forms or pre-checkout chat. The order dashboard can keep those instructions tied to the order.",
  },
];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function MarketplacePage() {
  const services = await listActiveServices();
  const user = await getCurrentUser();

  if (user?.role === "COACH") {
    redirect("/booster");
  }

  const [linkedRanks, pricingConfig] = await Promise.all([
    user ? getLinkedRanksForBoostConfigurator(user.id) : [],
    getBoostPricingConfig(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div>
          <Badge tone="emerald">Services marketplace</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-normal text-white sm:text-5xl">
            Build the right boost plan for your rank goal.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
            Configure rank, queue, region, champion requests, role add-ons, and
            target outcome with method-specific checkout requirements.
          </p>
        </div>
        <GlassPanel className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 text-emerald-300" size={22} aria-hidden />
            <div>
              <h2 className="font-bold text-white">Account access handoff</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Solo services can require account access after checkout. Duo
                boost stays self-play, while order-specific access details stay
                inside the protected paid order flow.
              </p>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <SlidersHorizontal size={20} className="text-cyan-200" aria-hidden />
          <h2 className="text-2xl font-bold text-white">Configure a plan</h2>
        </div>
        <ServiceConfigurator
          services={services}
          pricingConfig={pricingConfig}
          linkedRanks={linkedRanks}
        />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles size={20} className="text-amber-200" aria-hidden />
          <h2 className="text-2xl font-bold text-white">Boosting services</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.length ? (
            services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))
          ) : (
            <GlassPanel className="p-5 text-sm text-zinc-400 md:col-span-2 lg:col-span-3">
              No active services are configured yet.
            </GlassPanel>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-200" aria-hidden />
          <h2 className="text-2xl font-bold text-white">Boosting FAQ</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {marketplaceFaq.map((item) => (
            <GlassPanel key={item.question} className="p-5">
              <h3 className="font-semibold text-white">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{item.answer}</p>
            </GlassPanel>
          ))}
        </div>
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout-flow";
import { Badge } from "@/components/ui/badge";
import { listActiveServices } from "@/server/services/catalog";
import { getLinkedRanksForBoostConfigurator } from "@/server/services/linked-ranks";
import { getBoostPricingConfig } from "@/server/services/pricing";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ addons?: string; queue?: string; service?: string }>;
}) {
  const {
    addons: initialAddOns,
    queue: initialQueue,
    service: initialServiceId,
  } = await searchParams;
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
      <section className="mb-8 max-w-3xl">
        <Badge tone="amber">Secure order flow</Badge>
        <h1 className="mt-4 text-4xl font-black tracking-normal text-white sm:text-5xl">
          Checkout that keeps boost orders clear.
        </h1>
        <p className="mt-4 leading-7 text-zinc-400">
          The MVP flow covers service choice, Riot link/manual Riot ID fallback,
          rank and goal details, automatic assignment, Stripe-ready payment, and order
          dashboard access.
        </p>
      </section>
      <CheckoutFlow
        services={services}
        initialServiceId={initialServiceId}
        initialQueue={initialQueue}
        initialAddOns={initialAddOns}
        pricingConfig={pricingConfig}
        linkedRanks={linkedRanks}
      />
    </main>
  );
}

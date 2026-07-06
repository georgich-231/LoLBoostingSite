import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  BarChart3,
  CreditCard,
  Database,
  LockKeyhole,
  PackageOpen,
  Settings2,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  updateBoostPricingAction,
  updateServiceCatalogAction,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { RANK_TIERS, type BoostAddOn } from "@/lib/boost-pricing";
import { rankScore } from "@/lib/rank-progression";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/server/prisma";
import { getBoostPricingConfig } from "@/server/services/pricing";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=admin");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="rose">Admin only</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            This panel is locked.
          </h1>
          <p className="mt-4 text-zinc-400">
            Use an admin account to access pricing, order, revenue, and user
            controls.
          </p>
          <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
            Back to profile
          </Link>
        </div>
      </main>
    );
  }

  const [
    services,
    pricingConfig,
    orders,
    users,
    linkedAccountCount,
    soloRankSnapshots,
    logs,
  ] = await Promise.all([
    prisma.service.findMany({ orderBy: [{ active: "desc" }, { title: "asc" }] }),
    getBoostPricingConfig(),
    prisma.order.findMany({
      include: {
        user: { select: { email: true, name: true, createdAt: true } },
        service: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { riotAccounts: { where: { unlinkedAt: null }, take: 1 } },
    }),
    prisma.riotAccount.count({ where: { unlinkedAt: null } }),
    prisma.rankSnapshot.findMany({
      where: { queueType: "Ranked Solo/Duo" },
      orderBy: { capturedAt: "desc" },
      take: 250,
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: { select: { email: true, name: true } } },
    }),
  ]);
  const paidOrders = orders.filter((order) => order.payment?.status === "PAID");
  const revenueCents = paidOrders.reduce(
    (sum, order) => sum + (order.payment?.amountCents ?? 0),
    0,
  );
  const activeOrders = orders.filter(
    (order) => order.status !== "COMPLETED" && order.status !== "REFUNDED",
  );
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const newUsersThisWeek = users.filter(
    (item) => item.createdAt >= weekAgo,
  ).length;
  const serviceStats = getServiceStats(orders);
  const roleStats = getRoleStats(orders);
  const averageRank = getAverageSoloRank(soloRankSnapshots);
  const metrics = [
    {
      label: "Total revenue",
      value: formatCurrency(revenueCents / 100),
      detail: `${paidOrders.length} paid orders`,
      icon: CreditCard,
      tone: "emerald" as const,
    },
    {
      label: "Current orders",
      value: `${activeOrders.length}`,
      detail: `${orders.length} tracked total`,
      icon: ShoppingCart,
      tone: "cyan" as const,
    },
    {
      label: "Users",
      value: `${users.length}`,
      detail: `${newUsersThisWeek} joined this week`,
      icon: Users,
      tone: "amber" as const,
    },
    {
      label: "Average rank",
      value: averageRank,
      detail: `${linkedAccountCount} linked Riot accounts`,
      icon: BarChart3,
      tone: "rose" as const,
    },
    {
      label: "Avg order value",
      value: paidOrders.length
        ? formatCurrency(revenueCents / Math.max(paidOrders.length, 1) / 100)
        : "€0",
      detail: "Paid orders only",
      icon: Activity,
      tone: "emerald" as const,
    },
    {
      label: "Top service",
      value: serviceStats[0]?.title ?? "No data",
      detail: serviceStats[0] ? `${serviceStats[0].orders} purchases` : "No purchases yet",
      icon: PackageOpen,
      tone: "cyan" as const,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone="rose">Protected admin</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-normal text-white">
            Operations dashboard
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            Pricing, orders, revenue, customers, linked-account health, and
            audit history for the boosting platform.
          </p>
        </div>
        <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100">
          <LockKeyhole size={16} className="mr-2 inline" aria-hidden />
          {user.email}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <GlassPanel key={metric.label} className="p-4">
              <Icon size={19} className="text-cyan-200" aria-hidden />
              <p className="mt-3 text-sm text-zinc-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
              <p className="mt-2 text-sm text-emerald-200">{metric.detail}</p>
            </GlassPanel>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2">
            <Settings2 size={20} className="text-emerald-200" aria-hidden />
            <h2 className="text-2xl font-bold text-white">Service floor prices</h2>
          </div>
          <form action={updateServiceCatalogAction} className="mt-5 grid gap-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="border-b border-white/10 pb-3">Service</th>
                    <th className="border-b border-white/10 pb-3">Base floor</th>
                    <th className="border-b border-white/10 pb-3">Setup min</th>
                    <th className="border-b border-white/10 pb-3">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="text-zinc-300">
                      <td className="border-b border-white/8 py-3">
                        <p className="font-semibold text-white">{service.title}</p>
                        <p className="text-xs text-zinc-500">{service.slug}</p>
                      </td>
                      <td className="border-b border-white/8 py-3">
                        <PriceInput
                          name={`service:${service.id}:basePrice`}
                          defaultValue={service.basePriceCents / 100}
                          prefix="€"
                          step="0.05"
                        />
                      </td>
                      <td className="border-b border-white/8 py-3">
                        <PriceInput
                          name={`service:${service.id}:estimatedLengthMin`}
                          defaultValue={service.estimatedLengthMin}
                        />
                      </td>
                      <td className="border-b border-white/8 py-3">
                        <input
                          name={`service:${service.id}:active`}
                          type="checkbox"
                          defaultChecked={service.active}
                          className="h-4 w-4 accent-emerald-300"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className={buttonVariants({ className: "justify-self-start" })} type="submit">
              Save service prices
            </button>
          </form>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-cyan-200" aria-hidden />
            <h2 className="text-2xl font-bold text-white">Boost pricing rules</h2>
          </div>
          <form action={updateBoostPricingAction} className="mt-5 grid gap-5">
            <div className="grid gap-3 md:grid-cols-4">
              <AdminField label="Minimum division order">
                <PriceInput
                  name="division.minimumOrder"
                  defaultValue={pricingConfig.division.minimumOrder}
                  prefix="€"
                  step="0.05"
                />
              </AdminField>
              <AdminField label="Placement max games">
                <PriceInput
                  name="placements.maxGames"
                  defaultValue={pricingConfig.placements.maxGames}
                />
              </AdminField>
              <AdminField label="Pay-per-game multiplier">
                <PriceInput
                  name="payPerGame.netWinDiscountPercent"
                  defaultValue={Math.round(pricingConfig.payPerGame.netWinDiscount * 100)}
                  suffix="%"
                />
              </AdminField>
              <AdminField label="Default duo multiplier">
                <PriceInput
                  name="duo.defaultPremium"
                  defaultValue={pricingConfig.duo.defaultPremium}
                  step="0.05"
                />
              </AdminField>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {pricingConfig.duo.premiumOptions.slice(0, 3).map((option, index) => (
                <AdminField key={index} label={`Duo option ${index + 1}`}>
                  <PriceInput
                    name={`duo.option:${index}`}
                    defaultValue={option.value}
                    step="0.05"
                  />
                </AdminField>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="border-b border-white/10 pb-3">Rank</th>
                    <th className="border-b border-white/10 pb-3">Division / 100 LP</th>
                    <th className="border-b border-white/10 pb-3">Net win</th>
                    <th className="border-b border-white/10 pb-3">Placement game</th>
                  </tr>
                </thead>
                <tbody>
                  {RANK_TIERS.map((tier) => (
                    <tr key={tier}>
                      <td className="border-b border-white/8 py-3 font-semibold text-white">
                        {tier}
                      </td>
                      <td className="border-b border-white/8 py-3">
                        <PriceInput
                          name={`division.${tier}`}
                          defaultValue={pricingConfig.division.pricePer100LpByTier[tier]}
                          prefix="€"
                          step="0.05"
                        />
                      </td>
                      <td className="border-b border-white/8 py-3">
                        <PriceInput
                          name={`netWins.${tier}`}
                          defaultValue={pricingConfig.netWins.pricePerWinByTier[tier]}
                          prefix="€"
                          step="0.05"
                        />
                      </td>
                      <td className="border-b border-white/8 py-3">
                        <PriceInput
                          name={`placements.${tier}`}
                          defaultValue={pricingConfig.placements.pricePerGameByTier[tier]}
                          prefix="€"
                          step="0.05"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-bold text-white">Add-ons</h3>
              <div className="mt-3 grid gap-3">
                {pricingConfig.addOns.map((addOn) => (
                  <AddOnPricingRow key={addOn.id} addOn={addOn} />
                ))}
              </div>
            </div>

            <button className={buttonVariants({ className: "justify-self-start" })} type="submit">
              Save boost pricing
            </button>
          </form>
        </GlassPanel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-amber-200" aria-hidden />
            <h2 className="text-2xl font-bold text-white">Current orders</h2>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="border-b border-white/10 pb-3">Order</th>
                  <th className="border-b border-white/10 pb-3">User</th>
                  <th className="border-b border-white/10 pb-3">Service</th>
                  <th className="border-b border-white/10 pb-3">Goal</th>
                  <th className="border-b border-white/10 pb-3">Status</th>
                  <th className="border-b border-white/10 pb-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? (
                  orders.slice(0, 18).map((order) => (
                    <tr key={order.id} className="text-zinc-300">
                      <td className="border-b border-white/8 py-3 font-semibold text-white">
                        {order.publicId}
                      </td>
                      <td className="border-b border-white/8 py-3">
                        {order.user.name || order.user.email}
                      </td>
                      <td className="border-b border-white/8 py-3">{order.service.title}</td>
                      <td className="border-b border-white/8 py-3">
                        {order.currentRank} to {order.targetGoal}
                      </td>
                      <td className="border-b border-white/8 py-3">
                        <Badge tone={order.status === "COMPLETED" ? "emerald" : "cyan"}>
                          {formatStatus(order.status)}
                        </Badge>
                      </td>
                      <td className="border-b border-white/8 py-3">
                        {order.payment ? (
                          <span className="text-emerald-200">
                            {formatStatus(order.payment.status)} -{" "}
                            {formatCurrency(order.payment.amountCents / 100)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">Open</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-zinc-400">
                      No real orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassPanel>

        <div className="grid content-start gap-4">
          <AnalyticsPanel title="Most purchased" rows={serviceStats.map((item) => ({
            label: item.title,
            value: `${item.orders} orders`,
            detail: formatCurrency(item.revenueCents / 100),
          }))} />
          <AnalyticsPanel title="Role demand" rows={roleStats.map((item) => ({
            label: item.role,
            value: `${item.orders} orders`,
            detail: `${Math.round(item.share)}% share`,
          }))} />
          <GlassPanel className="p-5">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-cyan-200" aria-hidden />
              <h2 className="text-xl font-bold text-white">Recent users</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {users.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/6 p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.email}</p>
                  </div>
                  <Badge tone={item.riotAccounts.length ? "emerald" : "zinc"}>
                    {item.riotAccounts.length ? "Linked" : formatStatus(item.role)}
                  </Badge>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </section>

      <section className="mt-6">
        <GlassPanel className="p-5">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-emerald-200" aria-hidden />
            <h2 className="text-2xl font-bold text-white">Audit logs</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {logs.length ? (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-white/6 p-3 text-sm text-zinc-300"
                >
                  <span>
                    <span className="font-semibold text-white">{log.action}</span> -{" "}
                    {log.target}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {log.actor?.name ?? log.actor?.email ?? "System"} -{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(log.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-400">No audit logs yet.</p>
            )}
          </div>
        </GlassPanel>
      </section>
    </main>
  );
}

function AdminField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-300">
      {label}
      {children}
    </label>
  );
}

function PriceInput({
  name,
  defaultValue,
  prefix,
  suffix,
  step = "1",
}: {
  name: string;
  defaultValue: number;
  prefix?: string;
  suffix?: string;
  step?: string;
}) {
  return (
    <div className="flex h-10 min-w-32 items-center rounded-md border border-white/12 bg-zinc-950 px-3 text-sm text-white">
      {prefix ? <span className="mr-1 text-zinc-500">{prefix}</span> : null}
      <input
        name={name}
        type="number"
        min="0"
        step={step}
        defaultValue={Number.isInteger(defaultValue) ? defaultValue : defaultValue.toFixed(2)}
        className="min-w-0 flex-1 bg-transparent text-white outline-none"
      />
      {suffix ? <span className="ml-1 text-zinc-500">{suffix}</span> : null}
    </div>
  );
}

function AddOnPricingRow({ addOn }: { addOn: BoostAddOn }) {
  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-white/6 p-3 md:grid-cols-[1fr_0.65fr_0.5fr_0.5fr]">
      <AdminField label="Label">
        <input
          name={`addon:${addOn.id}:label`}
          defaultValue={addOn.label}
          className="h-10 rounded-md border border-white/12 bg-zinc-950 px-3 text-sm text-white outline-none"
        />
      </AdminField>
      <AdminField label="Description">
        <input
          name={`addon:${addOn.id}:description`}
          defaultValue={addOn.description}
          className="h-10 rounded-md border border-white/12 bg-zinc-950 px-3 text-sm text-white outline-none"
        />
      </AdminField>
      <AdminField label="Mode">
        <select
          name={`addon:${addOn.id}:mode`}
          defaultValue={addOn.mode}
          className="h-10 rounded-md border border-white/12 bg-zinc-950 px-3 text-sm text-white outline-none"
        >
          <option value="flat">Flat</option>
          <option value="percent">Percent</option>
        </select>
      </AdminField>
      <AdminField label="Amount">
        <PriceInput
          name={`addon:${addOn.id}:amount`}
          defaultValue={addOn.mode === "percent" ? addOn.amount * 100 : addOn.amount}
          prefix={addOn.mode === "flat" ? "€" : undefined}
          suffix={addOn.mode === "percent" ? "%" : undefined}
        />
      </AdminField>
    </div>
  );
}

function AnalyticsPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string; detail: string }>;
}) {
  return (
    <GlassPanel className="p-5">
      <div className="flex items-center gap-2">
        <BarChart3 size={20} className="text-amber-200" aria-hidden />
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {rows.length ? (
          rows.slice(0, 5).map((row) => (
            <div
              key={`${row.label}-${row.value}`}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/6 p-3 text-sm"
            >
              <div>
                <p className="font-semibold text-white">{row.label}</p>
                <p className="text-xs text-zinc-500">{row.detail}</p>
              </div>
              <span className="font-bold text-emerald-200">{row.value}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-400">No data yet.</p>
        )}
      </div>
    </GlassPanel>
  );
}

function getServiceStats(orders: AdminOrder[]) {
  const stats = new Map<string, { title: string; orders: number; revenueCents: number }>();

  for (const order of orders) {
    const current = stats.get(order.serviceId) ?? {
      title: order.service.title,
      orders: 0,
      revenueCents: 0,
    };

    current.orders += 1;
    current.revenueCents += order.payment?.status === "PAID" ? order.payment.amountCents : 0;
    stats.set(order.serviceId, current);
  }

  return [...stats.values()].sort(
    (a, b) => b.orders - a.orders || b.revenueCents - a.revenueCents,
  );
}

function getRoleStats(orders: AdminOrder[]) {
  const total = Math.max(orders.length, 1);
  const stats = new Map<string, { role: string; orders: number }>();

  for (const order of orders) {
    const current = stats.get(order.role) ?? { role: order.role, orders: 0 };
    current.orders += 1;
    stats.set(order.role, current);
  }

  return [...stats.values()]
    .map((item) => ({ ...item, share: (item.orders / total) * 100 }))
    .sort((a, b) => b.orders - a.orders);
}

function getAverageSoloRank(
  snapshots: Array<{
    riotAccountId: string;
    tier: string;
    division: string;
    lp: number;
  }>,
) {
  const latest = new Map<string, (typeof snapshots)[number]>();

  for (const snapshot of snapshots) {
    if (!latest.has(snapshot.riotAccountId)) {
      latest.set(snapshot.riotAccountId, snapshot);
    }
  }

  const values = [...latest.values()];

  if (!values.length) {
    return "No data";
  }

  const averageScore =
    values.reduce((sum, snapshot) => sum + rankScore(snapshot), 0) / values.length;

  return formatAverageRankScore(averageScore);
}

function formatAverageRankScore(score: number) {
  const tiers = [
    ["Iron", 0],
    ["Bronze", 400],
    ["Silver", 800],
    ["Gold", 1200],
    ["Platinum", 1600],
    ["Emerald", 2000],
    ["Diamond", 2400],
    ["Master", 2800],
    ["Grandmaster", 3300],
    ["Challenger", 3900],
  ] as const;
  const divisions = [
    ["IV", 0],
    ["III", 100],
    ["II", 200],
    ["I", 300],
  ] as const;
  const tier = [...tiers].reverse().find((item) => score >= item[1]) ?? tiers[0];

  if (tier[0] === "Master" || tier[0] === "Grandmaster" || tier[0] === "Challenger") {
    return `${tier[0]} ${Math.max(0, Math.round(score - tier[1]))} LP`;
  }

  const divisionScore = Math.max(0, score - tier[1]);
  const division = [...divisions].reverse().find((item) => divisionScore >= item[1]) ?? divisions[0];
  const lp = Math.max(0, Math.round(divisionScore - division[1]));

  return `${tier[0]} ${division[0]} ${lp} LP`;
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

type AdminOrder = Awaited<
  ReturnType<typeof prisma.order.findMany>
>[number] & {
  service: {
    title: string;
  };
  payment: {
    amountCents: number;
    status: string;
  } | null;
};

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Crown,
  Link2,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { ProfileSectionTabs } from "@/components/profile-section-tabs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { PURCHASE_LEVELS, getCustomerDiscount } from "@/lib/customer-profile";
import { rankLpLabel, rankScore } from "@/lib/rank-progression";
import { cn, formatCurrency } from "@/lib/utils";
import { listOrdersForUser } from "@/server/services/orders";
import { getProfileForUser } from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BoostingProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="amber">Sign in required</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Sign in to view your boosting profile.
          </h1>
          <p className="mt-4 text-zinc-400">
            Your purchase rank, discounts, and order history are attached to
            your RiftProgress account.
          </p>
          <Link href="/auth" className={buttonVariants({ className: "mt-6" })}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (user.role === "COACH") {
    redirect("/booster");
  }

  const [profile, orders] = await Promise.all([
    getProfileForUser(user.id),
    listOrdersForUser(user.id),
  ]);
  const paidSpendCents = orders.reduce(
    (sum, order) =>
      order.payment?.status === "PAID" ? sum + order.payment.amountCents : sum,
    0,
  );
  const discount = getCustomerDiscount({ spendCents: paidSpendCents });
  const rankImprovement = getRankImprovement(
    profile?.ranks ?? [],
    "Ranked Solo/Duo",
  );
  const displayName =
    user.name || profile?.account.gameName || user.email.split("@")[0] || "Customer";
  const connectedAccount = profile
    ? `${profile.account.gameName}#${profile.account.tagLine}`
    : null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <ProfileSectionTabs active="boosting" />

      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <Badge tone="amber">Boosting account</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-normal text-white sm:text-4xl">
            Discounts, purchase ranks, and order history
          </h1>
        </div>
        <LogoutButton />
      </section>

      <section className="mt-5">
        <GlassPanel className="p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
                <UserRound size={30} aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-black text-white">
                    {displayName}
                  </h2>
                  <Badge tone="amber">{discount.purchaseRank} purchase rank</Badge>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {connectedAccount
                    ? `${connectedAccount} is connected to this profile.`
                    : "No Riot account connected to this profile yet."}
                </p>
              </div>
            </div>
            {connectedAccount ? (
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                <ShieldCheck size={17} aria-hidden />
                Riot account connected
              </div>
            ) : (
              <Link
                href="/api/riot/link/start"
                className={buttonVariants({ variant: "primary" })}
              >
                <Link2 size={17} aria-hidden />
                Link Riot account
              </Link>
            )}
          </div>
        </GlassPanel>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid content-start gap-4">
          <GlassPanel className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="cyan">Customer profile</Badge>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  Boosting profile
                </h2>
              </div>
              <Crown className="text-amber-200" size={26} aria-hidden />
            </div>
            <div className="mt-5 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
              <ProfileStat label="Boost orders" value={`${orders.length}`} />
              <ProfileStat
                label="Paid spend"
                value={formatCurrency(paidSpendCents / 100, "EUR")}
                accent="emerald"
              />
              <ProfileStat
                label="Purchase discount"
                value={`${discount.totalDiscount}%`}
                accent="emerald"
              />
              <ProfileStat
                label="Solo/Duo movement"
                value={`${rankImprovement.delta > 0 ? "+" : ""}${rankImprovement.delta} LP`}
                accent={rankImprovement.delta >= 0 ? "emerald" : "rose"}
              />
            </div>
          </GlassPanel>

          <GlassPanel className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="amber">Purchase rank</Badge>
                <h2 className="mt-3 text-2xl font-bold text-white">
                  {discount.totalDiscount}% purchase discount
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
              <DiscountRow
                label="Current rank"
                value={discount.purchaseRank}
              />
              <DiscountRow
                label="Paid spend"
                value={formatCurrency(paidSpendCents / 100, "EUR")}
              />
              <DiscountRow
                label="Next rank"
                value={
                  discount.nextRankSpendCents
                    ? `${formatCurrency(discount.nextRankSpendCents / 100, "EUR")} left`
                    : "Max rank"
                }
              />
            </div>
            <PurchaseRankProgress spendCents={paidSpendCents} />
          </GlassPanel>

        </div>

        <div className="grid content-start gap-4">
          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <ReceiptText size={22} className="text-emerald-200" aria-hidden />
              <h2 className="text-xl font-bold text-white">Boosting history</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {orders.length ? (
                orders.slice(0, 6).map((order) => (
                  <div
                    key={order.id}
                    className="rounded-md border border-white/10 bg-white/6 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{order.service.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {order.currentRank} to {order.targetGoal} - {order.role}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge tone={order.status === "COMPLETED" ? "emerald" : "cyan"}>
                          {formatStatus(order.status)}
                        </Badge>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                          }).format(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                      <OrderMeta label="Order" value={order.publicId} />
                      <OrderMeta
                        label="Payment"
                        value={order.payment ? formatStatus(order.payment.status) : "Open"}
                      />
                      <OrderMeta
                        label="Value"
                        value={
                          order.payment
                            ? formatCurrency(order.payment.amountCents / 100, "EUR")
                            : formatCurrency(order.service.basePriceCents / 100, "EUR")
                        }
                        accent
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-white/10 bg-white/6 p-4 text-sm text-zinc-400">
                  No boost orders yet. Your completed and active purchases will
                  appear here automatically.
                </div>
              )}
            </div>
          </GlassPanel>

          <GlassPanel className="p-5">
            <div className="flex items-center gap-3">
              <TrendingUp size={22} className="text-cyan-200" aria-hidden />
              <h2 className="text-xl font-bold text-white">Rank movement</h2>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-zinc-300">
              <DiscountRow label="First tracked" value={rankImprovement.first} />
              <DiscountRow label="Latest tracked" value={rankImprovement.latest} />
              <DiscountRow
                label="Net Solo/Duo LP"
                value={`${rankImprovement.delta > 0 ? "+" : ""}${rankImprovement.delta} LP`}
              />
            </div>
          </GlassPanel>
        </div>
      </section>
    </main>
  );
}

type RankRow = {
  queueType: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  capturedAt: Date;
};

function ProfileStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "rose";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/6 p-3">
      <p className="text-zinc-500">{label}</p>
      <p
        className={
          accent === "rose"
            ? "mt-1 text-lg font-bold text-rose-200"
            : accent === "emerald"
              ? "mt-1 text-lg font-bold text-emerald-200"
              : "mt-1 text-lg font-bold text-white"
        }
      >
        {value}
      </p>
    </div>
  );
}

function PurchaseRankProgress({
  spendCents,
  compact = false,
}: {
  spendCents: number;
  compact?: boolean;
}) {
  const safeSpendCents = Math.max(0, spendCents);
  const currentRank = getCustomerDiscount({ spendCents: safeSpendCents }).purchaseRank;
  const fillPercent = getPurchaseRankFillPercent(safeSpendCents);

  return (
    <div
      className={cn(
        "mt-5 rounded-md border border-white/10 bg-white/6 p-5",
        compact && "border-0 bg-transparent p-0",
      )}
    >
      <div className="relative pt-2">
        <div className="absolute left-3 right-3 top-5 h-1.5 rounded-full bg-white/10" />
        <div
          className="absolute left-3 top-5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.35)]"
          style={{
            width: `calc((100% - 24px) * ${fillPercent / 100})`,
          }}
        />
        <div className="relative flex justify-between gap-1">
          {PURCHASE_LEVELS.map((level) => {
            const isActive = safeSpendCents >= level.minSpendCents;
            const isCurrent = currentRank === level.name;

            return (
              <div
                key={level.name}
                className="flex w-16 flex-col items-center text-center sm:w-24"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border bg-zinc-950",
                    isActive
                      ? "border-emerald-200 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.34)]"
                      : "border-white/20 text-zinc-500",
                    isCurrent && "ring-2 ring-amber-200/60 ring-offset-2 ring-offset-zinc-950",
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      "h-3.5 w-3.5 rounded-full",
                      isActive ? "bg-emerald-300" : "bg-white/20",
                    )}
                  />
                </span>
                <p className="mt-3 text-sm font-bold text-white">{level.name}</p>
                <p className="mt-1 text-xs leading-4 text-zinc-500">
                  {formatCurrency(level.minSpendCents / 100, "EUR")}
                </p>
                <p className="text-xs font-semibold leading-4 text-emerald-200">
                  {level.discount}% off
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DiscountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/6 p-3">
      <span className="text-zinc-400">{label}</span>
      <span className="text-right font-bold text-emerald-200">{value}</span>
    </div>
  );
}

function OrderMeta({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md bg-black/20 p-2">
      <p className="text-zinc-500">{label}</p>
      <p
        className={
          accent
            ? "mt-1 font-semibold text-emerald-200"
            : "mt-1 font-semibold text-zinc-200"
        }
      >
        {value}
      </p>
    </div>
  );
}

function getRankImprovement(ranks: RankRow[], queueType: string) {
  const sorted = ranks
    .filter((rank) => rank.queueType === queueType)
    .slice()
    .sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  if (!first || !latest) {
    return {
      first: "No snapshot yet",
      latest: "No snapshot yet",
      delta: 0,
    };
  }

  return {
    first: rankLpLabel(first),
    latest: rankLpLabel(latest),
    delta: rankScore(latest) - rankScore(first),
  };
}

function formatStatus(value: string) {
  const label = value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());

  return label.replace("Coach", "Booster");
}

function getPurchaseRankFillPercent(spendCents: number) {
  const maxIndex = PURCHASE_LEVELS.length - 1;

  if (maxIndex <= 0) {
    return 100;
  }

  if (spendCents >= PURCHASE_LEVELS[maxIndex].minSpendCents) {
    return 100;
  }

  let safeIndex = 0;

  for (let index = 0; index < PURCHASE_LEVELS.length; index += 1) {
    if (spendCents >= PURCHASE_LEVELS[index].minSpendCents) {
      safeIndex = index;
    }
  }

  const current = PURCHASE_LEVELS[safeIndex];
  const next = PURCHASE_LEVELS[safeIndex + 1];
  const segment = 100 / maxIndex;
  const segmentProgress =
    next.minSpendCents > current.minSpendCents
      ? (spendCents - current.minSpendCents) /
        (next.minSpendCents - current.minSpendCents)
      : 0;

  return Math.min(100, Math.max(0, (safeIndex + segmentProgress) * segment));
}

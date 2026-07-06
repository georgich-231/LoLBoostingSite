import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComponentType } from "react";
import { CalendarDays, CreditCard, ListChecks, MessageSquareText, ReceiptText } from "lucide-react";
import { sendCustomerOrderMessageAction } from "@/app/orders/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { formatCurrency } from "@/lib/utils";
import { listOrdersForUser } from "@/server/services/orders";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function OrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="amber">Sign in required</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Sign in to see your boost orders.
          </h1>
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

  const orders = await listOrdersForUser(user.id);
  const paidSpend = orders.reduce(
    (sum, order) =>
      order.payment?.status === "PAID" ? sum + order.payment.amountCents : sum,
    0,
  );
  const activeOrders = orders.filter(
    (order) => order.status !== "COMPLETED" && order.status !== "REFUNDED",
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <GlassPanel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge tone="cyan">Boosting history</Badge>
              <h1 className="mt-4 text-4xl font-black tracking-normal text-white">
                Your orders
              </h1>
              <p className="mt-2 max-w-2xl text-zinc-400">
                Active boosts, completed purchases, payment state, and order
                milestones from your real account.
              </p>
            </div>
            <Link href="/marketplace" className={buttonVariants({ variant: "secondary" })}>
              New boost order
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryTile label="Total orders" value={`${orders.length}`} />
            <SummaryTile label="Active orders" value={`${activeOrders}`} />
            <SummaryTile label="Paid spend" value={formatCurrency(paidSpend / 100)} />
          </div>
        </GlassPanel>

        <GlassPanel className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <ReceiptText className="text-emerald-200" size={24} aria-hidden />
            <div>
              <p className="text-sm text-zinc-400">Purchase rank input</p>
              <h2 className="text-2xl font-bold text-white">
                {orders.length} tracked order{orders.length === 1 ? "" : "s"}
              </h2>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-zinc-400">
            Completed paid orders increase the spend total that sets the
            dashboard purchase rank and discount.
          </p>
        </GlassPanel>
      </section>

      <section className="mt-6 grid gap-4">
        {orders.length ? (
          orders.map((order) => (
            <GlassPanel key={order.id} className="p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.65fr]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Badge tone={order.status === "COMPLETED" ? "emerald" : "cyan"}>
                        {formatStatus(order.status)}
                      </Badge>
                      <h2 className="mt-3 text-2xl font-bold text-white">
                        {order.publicId} - {order.service.title}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-400">
                        {order.currentRank} to {order.targetGoal} - {order.role}
                        {order.champion ? ` - ${order.champion}` : ""}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-zinc-500">Value</p>
                      <p className="text-xl font-bold text-emerald-200">
                        {order.payment
                          ? formatCurrency(order.payment.amountCents / 100)
                          : formatCurrency(order.service.basePriceCents / 100)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <InfoTile
                      icon={CalendarDays}
                      label="Created"
                      value={new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(order.createdAt)}
                    />
                    <InfoTile
                      icon={CreditCard}
                      label="Payment"
                      value={order.payment ? formatStatus(order.payment.status) : "Open"}
                    />
                    <InfoTile
                      icon={ListChecks}
                      label="Milestones"
                      value={`${order.milestones.length}`}
                    />
                  </div>

                  <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MessageSquareText size={18} className="text-emerald-200" aria-hidden />
                        <h3 className="font-semibold text-white">Order chat</h3>
                      </div>
                      <Badge tone={order.coachProfileId ? "emerald" : "zinc"}>
                        {order.coachProfileId ? "Saved dispute log" : "Opens after assignment"}
                      </Badge>
                    </div>
                    {order.coachProfileId ? (
                      <>
                        <div className="mt-4 grid max-h-72 gap-3 overflow-y-auto pr-1">
                          {order.messages.length ? (
                            order.messages.map((message) => (
                              <div
                                key={message.id}
                                className={[
                                  "rounded-md border p-3",
                                  message.senderId === user.id
                                    ? "border-emerald-300/20 bg-emerald-300/10"
                                    : "border-white/10 bg-white/6",
                                ].join(" ")}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-white">
                                    {message.senderId === user.id
                                      ? "You"
                                      : message.sender.name}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    {formatDateTime(message.createdAt)}
                                  </p>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                                  {message.body}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-md border border-white/10 bg-white/6 p-3 text-sm text-zinc-400">
                              No messages yet. Use this chat for order-specific questions so support has a saved record if there is a dispute.
                            </p>
                          )}
                        </div>
                        <form action={sendCustomerOrderMessageAction} className="mt-4 grid gap-3">
                          <input type="hidden" name="orderId" value={order.id} />
                          <textarea
                            name="body"
                            required
                            maxLength={1200}
                            rows={3}
                            placeholder="Message your booster..."
                            className="min-h-24 rounded-md border border-white/12 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/50"
                          />
                          <Button type="submit" className="justify-self-start">
                            Send message
                          </Button>
                        </form>
                      </>
                    ) : (
                      <p className="mt-4 rounded-md border border-white/10 bg-white/6 p-3 text-sm leading-6 text-zinc-400">
                        A private customer-booster chat appears here once a booster assigns themselves to this order.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <h3 className="font-semibold text-white">Milestones</h3>
                  <div className="mt-4 grid gap-3">
                    {order.milestones.length ? (
                      order.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="rounded-md border border-white/10 bg-white/6 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-white">{milestone.title}</p>
                            <Badge tone={milestone.completedAt ? "emerald" : "zinc"}>
                              {milestone.completedAt ? "Done" : "Open"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">
                            {milestone.detail}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-400">
                        No milestones have been added yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))
        ) : (
          <GlassPanel className="p-6 text-center">
            <Badge tone="zinc">No orders yet</Badge>
            <h2 className="mt-4 text-2xl font-bold text-white">
              Your boost history is empty.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Once you create a boost order, it will appear here with payment
              state, rank goal, and milestone progress.
            </p>
            <Link href="/marketplace" className={buttonVariants({ className: "mt-6" })}>
              Create first boost order
            </Link>
          </GlassPanel>
        )}
      </section>
    </main>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/6 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/6 p-3">
      <Icon size={17} className="text-cyan-200" aria-hidden />
      <p className="mt-2 text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}

function formatStatus(value: string) {
  const label = value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());

  return label.replace("Coach", "Booster");
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

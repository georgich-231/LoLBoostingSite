import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Inbox,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  claimBoostOrderAction,
  sendBoosterOrderMessageAction,
} from "@/app/booster/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/server/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BoosterPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=booster");
  }

  if (user.role !== "COACH") {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="rose">Booster only</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            This dashboard is for booster accounts.
          </h1>
          <p className="mt-4 text-zinc-400">
            Use a booster login to claim pending boosts and chat with assigned customers.
          </p>
          <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
            Back to profile
          </Link>
        </div>
      </main>
    );
  }

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="amber">Profile missing</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Booster profile needs setup.
          </h1>
          <p className="mt-4 text-zinc-400">
            Ask an admin to create the booster profile for {user.email}.
          </p>
        </div>
      </main>
    );
  }

  const [availableOrders, assignedOrders, completedCount] = await Promise.all([
    prisma.order.findMany({
      where: { status: "PENDING", coachProfileId: null },
      include: {
        user: { select: { name: true, email: true } },
        service: true,
        payment: true,
        milestones: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    prisma.order.findMany({
      where: {
        coachProfileId: profile.id,
        status: { notIn: ["COMPLETED", "REFUNDED"] },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: true,
        payment: true,
        milestones: { orderBy: { createdAt: "asc" } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.order.count({
      where: {
        coachProfileId: profile.id,
        status: "COMPLETED",
      },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone="emerald">Booster dashboard</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-normal text-white">
            Welcome, {profile.displayName}.
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            Claim pending boosts, manage assigned purchases, and keep customer
            chat saved on the order for support and dispute review.
          </p>
        </div>
        <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-100">
          <ShieldCheck size={16} className="mr-2 inline" aria-hidden />
          {user.email}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={PackageCheck} label="Assigned orders" value={`${assignedOrders.length}`} />
        <StatCard icon={Inbox} label="Pending queue" value={`${availableOrders.length}`} />
        <StatCard icon={CheckCircle2} label="Completed by you" value={`${completedCount}`} />
      </section>

      <section className="mt-8 grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white">Your current purchases</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Orders assigned to you with saved customer chat.
            </p>
          </div>
        </div>

        {assignedOrders.length ? (
          assignedOrders.map((order) => (
            <GlassPanel key={order.id} className="p-5">
              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Badge tone="cyan">{formatStatus(order.status)}</Badge>
                      <h3 className="mt-3 text-2xl font-bold text-white">
                        {order.publicId} - {order.service.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {order.currentRank} to {order.targetGoal} - {order.role}
                        {order.champion ? ` - ${order.champion}` : ""}
                      </p>
                    </div>
                    <p className="text-right text-xl font-bold text-emerald-200">
                      {formatOrderValue(order)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <InfoTile icon={UserRound} label="Customer" value={order.user.name} />
                    <InfoTile icon={CreditCard} label="Payment" value={order.payment ? formatStatus(order.payment.status) : "No record"} />
                    <InfoTile icon={CalendarDays} label="Created" value={formatDate(order.createdAt)} />
                  </div>

                  <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                    <h4 className="font-semibold text-white">Milestones</h4>
                    <div className="mt-3 grid gap-2">
                      {order.milestones.map((milestone) => (
                        <div key={milestone.id} className="rounded-md border border-white/10 bg-white/6 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-white">{milestone.title}</p>
                            <Badge tone={milestone.completedAt ? "emerald" : "zinc"}>
                              {milestone.completedAt ? "Done" : "Open"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-zinc-400">{milestone.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <OrderChat
                  currentUserId={user.id}
                  orderId={order.id}
                  messages={order.messages}
                />
              </div>
            </GlassPanel>
          ))
        ) : (
          <GlassPanel className="p-6 text-center">
            <Badge tone="zinc">No active claims</Badge>
            <h3 className="mt-4 text-2xl font-bold text-white">
              You have no assigned boosts right now.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              Claim an available pending order below to open its customer chat.
            </p>
          </GlassPanel>
        )}
      </section>

      <section className="mt-10 grid gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Pending orders</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Assign yourself to a boost when you are ready to work it.
          </p>
        </div>

        {availableOrders.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {availableOrders.map((order) => (
              <GlassPanel key={order.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Badge tone="amber">{formatStatus(order.status)}</Badge>
                    <h3 className="mt-3 text-xl font-bold text-white">
                      {order.publicId} - {order.service.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {order.currentRank} to {order.targetGoal} - {order.role}
                      {order.champion ? ` - ${order.champion}` : ""}
                    </p>
                  </div>
                  <p className="text-right text-lg font-bold text-emerald-200">
                    {formatOrderValue(order)}
                  </p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InfoTile icon={UserRound} label="Customer" value={order.user.name} />
                  <InfoTile icon={CreditCard} label="Payment" value={order.payment ? formatStatus(order.payment.status) : "No record"} />
                  <InfoTile icon={CalendarDays} label="Created" value={formatDate(order.createdAt)} />
                </div>
                <form action={claimBoostOrderAction} className="mt-5">
                  <input type="hidden" name="orderId" value={order.id} />
                  <Button type="submit" className="w-full">
                    Assign myself to this boost
                  </Button>
                </form>
              </GlassPanel>
            ))}
          </div>
        ) : (
          <GlassPanel className="p-6 text-center">
            <Badge tone="zinc">Queue empty</Badge>
            <h3 className="mt-4 text-2xl font-bold text-white">
              No pending orders are available.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
              New paid or created orders will appear here when they are waiting for assignment.
            </p>
          </GlassPanel>
        )}
      </section>
    </main>
  );
}

function OrderChat({
  currentUserId,
  orderId,
  messages,
}: {
  currentUserId: string;
  orderId: string;
  messages: Array<{
    id: string;
    senderId: string;
    body: string;
    createdAt: Date;
    sender: { name: string; email: string; role: string };
  }>;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareText size={18} className="text-emerald-200" aria-hidden />
          <h4 className="font-semibold text-white">Customer chat</h4>
        </div>
        <Badge tone="emerald">Saved dispute log</Badge>
      </div>
      <div className="mt-4 grid max-h-96 gap-3 overflow-y-auto pr-1">
        {messages.length ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={[
                "rounded-md border p-3",
                message.senderId === currentUserId
                  ? "border-emerald-300/20 bg-emerald-300/10"
                  : "border-white/10 bg-white/6",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">
                  {message.senderId === currentUserId ? "You" : message.sender.name}
                </p>
                <p className="text-xs text-zinc-500">{formatDateTime(message.createdAt)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                {message.body}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-white/10 bg-white/6 p-3 text-sm text-zinc-400">
            No messages yet. Send the first update after assignment.
          </p>
        )}
      </div>
      <form action={sendBoosterOrderMessageAction} className="mt-4 grid gap-3">
        <input type="hidden" name="orderId" value={orderId} />
        <textarea
          name="body"
          required
          maxLength={1200}
          rows={3}
          placeholder="Message the customer..."
          className="min-h-24 rounded-md border border-white/12 bg-zinc-950 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-300/50"
        />
        <Button type="submit" className="justify-self-start">
          Send message
        </Button>
      </form>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PackageCheck;
  label: string;
  value: string;
}) {
  return (
    <GlassPanel className="p-5">
      <Icon size={22} className="text-cyan-200" aria-hidden />
      <p className="mt-3 text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </GlassPanel>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/6 p-3">
      <Icon size={17} className="text-cyan-200" aria-hidden />
      <p className="mt-2 text-xs text-zinc-500">{label}</p>
      <p className="mt-1 truncate font-semibold text-white">{value}</p>
    </div>
  );
}

function formatOrderValue(order: {
  payment: { amountCents: number } | null;
  service: { basePriceCents: number };
}) {
  return formatCurrency((order.payment?.amountCents ?? order.service.basePriceCents) / 100);
}

function formatStatus(value: string) {
  const label = value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());

  return label.replace("Coach", "Booster");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

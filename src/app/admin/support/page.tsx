import Link from "next/link";
import { redirect } from "next/navigation";
import { LifeBuoy, MessageSquareReply, ShieldCheck } from "lucide-react";
import {
  closeSupportConversationAction,
  replyToSupportConversationAction,
} from "@/app/admin/support/actions";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { prisma } from "@/server/prisma";
import { getCurrentUser } from "@/server/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminSupportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth?next=admin/support");
  }

  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    return (
      <main className="mx-auto grid min-h-[60svh] w-full max-w-3xl place-items-center px-4 py-16 text-center">
        <div>
          <Badge tone="rose">Admin only</Badge>
          <h1 className="mt-4 text-4xl font-black text-white">
            Support requests are locked.
          </h1>
          <p className="mt-4 text-zinc-400">
            Use an admin account to read and reply to customer support chats.
          </p>
          <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
            Back to profile
          </Link>
        </div>
      </main>
    );
  }

  const conversations = await prisma.supportConversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 80,
    include: {
      user: { select: { email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  const waitingCount = conversations.filter(
    (conversation) => conversation.status === "WAITING_ADMIN",
  ).length;
  const answeredCount = conversations.filter(
    (conversation) => conversation.status === "ANSWERED",
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge tone="amber">Support inbox</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-normal text-white">
            Support requests
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
            Bot chats, escalated customer requests, and admin replies saved in
            the local database.
          </p>
        </div>
        <Link href="/admin" className={buttonVariants({ variant: "secondary" })}>
          Back to admin
        </Link>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <SupportStat label="Waiting" value={`${waitingCount}`} tone="amber" />
        <SupportStat label="Answered" value={`${answeredCount}`} tone="emerald" />
        <SupportStat label="Total chats" value={`${conversations.length}`} tone="cyan" />
      </section>

      <section className="mt-6 grid gap-4">
        {conversations.length ? (
          conversations.map((conversation) => {
            const lastUserMessage = [...conversation.messages]
              .reverse()
              .find((message) => message.sender === "USER");

            return (
              <GlassPanel key={conversation.id} className="p-5">
                <div className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={getStatusTone(conversation.status)}>
                        {formatStatus(conversation.status)}
                      </Badge>
                      <span className="text-xs text-zinc-500">
                        {formatDate(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-white">
                      {conversation.title}
                    </h2>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-400">
                      <p>
                        Customer:{" "}
                        <span className="font-semibold text-zinc-200">
                          {conversation.user?.name ??
                            conversation.user?.email ??
                            conversation.visitorId ??
                            "Guest visitor"}
                        </span>
                      </p>
                      <p>
                        Last question:{" "}
                        <span className="text-zinc-300">
                          {lastUserMessage?.body ?? "No user message yet"}
                        </span>
                      </p>
                    </div>
                    <form action={closeSupportConversationAction} className="mt-4">
                      <input type="hidden" name="conversationId" value={conversation.id} />
                      <button
                        type="submit"
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Mark closed
                      </button>
                    </form>
                  </div>

                  <div className="grid gap-4">
                    <div className="max-h-80 overflow-y-auto rounded-md border border-white/10 bg-black/20 p-3">
                      <div className="grid gap-3">
                        {conversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "rounded-md border px-3 py-2 text-sm leading-6",
                              message.sender === "USER"
                                ? "ml-auto max-w-[88%] border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
                                : message.sender === "ADMIN"
                                  ? "max-w-[88%] border-amber-300/20 bg-amber-300/10 text-amber-50"
                                  : "max-w-[88%] border-white/10 bg-white/7 text-zinc-200",
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                {formatSender(message.sender)}
                              </span>
                              <span className="text-[11px] text-zinc-600">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form action={replyToSupportConversationAction} className="grid gap-2">
                      <input type="hidden" name="conversationId" value={conversation.id} />
                      <label className="text-sm font-semibold text-white">
                        Reply to customer
                        <textarea
                          name="body"
                          rows={3}
                          maxLength={2000}
                          placeholder="Write a reply that will appear in their assistant chat..."
                          className="mt-2 min-h-24 w-full resize-y rounded-md border border-white/12 bg-zinc-950 px-3 py-2 text-sm font-normal text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/50"
                        />
                      </label>
                      <button
                        type="submit"
                        className={buttonVariants({ className: "justify-self-start" })}
                      >
                        <MessageSquareReply size={17} aria-hidden />
                        Send reply
                      </button>
                    </form>
                  </div>
                </div>
              </GlassPanel>
            );
          })
        ) : (
          <GlassPanel className="grid place-items-center p-10 text-center">
            <LifeBuoy className="text-amber-200" size={30} aria-hidden />
            <h2 className="mt-4 text-2xl font-bold text-white">No support requests yet.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              When users contact support from the floating assistant, their
              message and chat history will appear here.
            </p>
          </GlassPanel>
        )}
      </section>
    </main>
  );
}

function SupportStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "cyan" | "amber";
}) {
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-white">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/8">
          <ShieldCheck
            size={19}
            className={
              tone === "emerald"
                ? "text-emerald-200"
                : tone === "cyan"
                  ? "text-cyan-200"
                  : "text-amber-200"
            }
            aria-hidden
          />
        </span>
      </div>
    </GlassPanel>
  );
}

function getStatusTone(status: string) {
  if (status === "WAITING_ADMIN") {
    return "amber";
  }

  if (status === "ANSWERED") {
    return "emerald";
  }

  if (status === "CLOSED") {
    return "zinc";
  }

  return "cyan";
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function formatSender(value: string) {
  return value === "USER" ? "Customer" : value === "ADMIN" ? "Support" : "Assistant";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

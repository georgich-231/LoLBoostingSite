"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronRight,
  LifeBuoy,
  MessageCircle,
  MessageSquarePlus,
  Minus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { supportQuestions, type SupportQuestionKey } from "@/lib/support-assistant";
import { cn } from "@/lib/utils";

type SupportMessage = {
  id: string;
  sender: "USER" | "BOT" | "ADMIN" | "SYSTEM";
  body: string;
  createdAt: string;
};

type SupportConversation = {
  id: string;
  title: string;
  status: "BOT" | "WAITING_ADMIN" | "ANSWERED" | "CLOSED";
  lastMessageAt: string;
  messages: SupportMessage[];
};

const VISITOR_STORAGE_KEY = "riftprogress_support_visitor";

export function SupportAssistant() {
  const [open, setOpen] = useState(false);
  const [visitorId] = useState<string | null>(() => getOrCreateVisitorId());
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [supportMode, setSupportMode] = useState(false);
  const [supportText, setSupportText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );
  const hasAdminReply = conversations.some(
    (conversation) =>
      conversation.status === "ANSWERED" &&
      conversation.messages.at(-1)?.sender === "ADMIN",
  );

  async function loadConversations(
    nextVisitorId: string,
    options: { quiet?: boolean } = {},
  ) {
    if (!options.quiet) {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/support/conversations?visitorId=${encodeURIComponent(nextVisitorId)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        conversations: SupportConversation[];
      };

      setConversations(payload.conversations);
      setActiveId((current) => current ?? payload.conversations[0]?.id ?? null);
    } finally {
      if (!options.quiet) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!open || !visitorId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadConversations(visitorId);
    }, 0);
    const interval = window.setInterval(() => {
      void loadConversations(visitorId, { quiet: true });
    }, 15000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [open, visitorId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeConversation?.messages.length, open]);

  async function startQuestion(questionKey: SupportQuestionKey) {
    if (!visitorId) {
      return;
    }

    setSending(true);
    setSupportMode(false);

    try {
      const response = await fetch("/api/support/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitorId, questionKey }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { conversation: SupportConversation };
      mergeConversation(payload.conversation);
      setActiveId(payload.conversation.id);
    } finally {
      setSending(false);
    }
  }

  async function createNewChat() {
    if (!visitorId) {
      return;
    }

    setSending(true);
    setSupportMode(false);

    try {
      const response = await fetch("/api/support/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { conversation: SupportConversation };
      mergeConversation(payload.conversation);
      setActiveId(payload.conversation.id);
    } finally {
      setSending(false);
    }
  }

  async function askInActiveChat(questionKey: SupportQuestionKey) {
    if (!visitorId || !activeConversation) {
      await startQuestion(questionKey);
      return;
    }

    setSending(true);
    setSupportMode(false);

    try {
      const response = await fetch(
        `/api/support/conversations/${activeConversation.id}/messages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ visitorId, questionKey }),
        },
      );

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { conversation: SupportConversation };
      mergeConversation(payload.conversation);
      setActiveId(payload.conversation.id);
    } finally {
      setSending(false);
    }
  }

  async function sendSupportRequest() {
    const message = supportText.trim();

    if (!visitorId || !message) {
      return;
    }

    setSending(true);

    try {
      const endpoint = activeConversation
        ? `/api/support/conversations/${activeConversation.id}/messages`
        : "/api/support/conversations";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitorId, supportMessage: message }),
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { conversation: SupportConversation };
      mergeConversation(payload.conversation);
      setActiveId(payload.conversation.id);
      setSupportText("");
      setSupportMode(false);
    } finally {
      setSending(false);
    }
  }

  function mergeConversation(conversation: SupportConversation) {
    setConversations((current) => {
      const without = current.filter((item) => item.id !== conversation.id);

      return [conversation, ...without].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
    });
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {open ? (
        <div className="flex h-[min(680px,calc(100svh-2.5rem))] w-[min(390px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-lg border border-white/15 bg-zinc-950 shadow-[0_24px_100px_rgba(0,0,0,0.52)]">
          <div className="border-b border-white/10 bg-white/6 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-300 text-zinc-950 shadow-[0_0_28px_rgba(52,211,153,0.3)]">
                  <Bot size={21} aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-zinc-400">Rift assistant</p>
                  <h2 className="font-bold text-white">Boosting help</h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={createNewChat}
                  disabled={sending || !visitorId}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  aria-label="Start new assistant chat"
                >
                  <MessageSquarePlus size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Minimize assistant"
                >
                  <Minus size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSupportMode(false);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close assistant"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>

            {conversations.length ? (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setActiveId(conversation.id);
                      setSupportMode(false);
                    }}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      activeConversation?.id === conversation.id
                        ? "border-emerald-300/40 bg-emerald-300/12 text-emerald-100"
                        : "border-white/10 bg-white/6 text-zinc-300 hover:border-white/20 hover:text-white",
                    )}
                  >
                    {conversation.title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {!activeConversation && !loading ? (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <Sparkles className="mx-auto text-amber-200" size={28} aria-hidden />
                  <p className="mt-3 font-bold text-white">Start with a quick question</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Pick a prepared question or contact support directly.
                  </p>
                </div>
              </div>
            ) : null}

            {activeConversation ? (
              <div className="grid gap-3">
                {activeConversation.messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                <div ref={messageEndRef} />
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-zinc-950 p-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Quick questions
                </p>
                <button
                  type="button"
                  onClick={() => setSupportMode((value) => !value)}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/16"
                >
                  <LifeBuoy size={13} aria-hidden />
                  Contact support
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {supportQuestions.slice(0, 6).map((question) => (
                  <button
                    key={question.key}
                    type="button"
                    onClick={() => askInActiveChat(question.key)}
                    disabled={sending || !visitorId}
                    className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/6 px-3 py-2 text-left text-xs font-semibold text-zinc-200 transition hover:border-emerald-300/30 hover:bg-emerald-300/10 disabled:opacity-50"
                  >
                    {question.shortLabel}
                    <ChevronRight size={14} className="shrink-0 text-zinc-500" aria-hidden />
                  </button>
                ))}
              </div>
            </div>

            {supportMode ? (
              <div className="mt-3 grid gap-2">
                <textarea
                  value={supportText}
                  onChange={(event) => setSupportText(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Tell support what you need help with..."
                  className="max-h-28 min-h-20 resize-none rounded-md border border-white/12 bg-black/30 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-300/50"
                />
                <button
                  type="button"
                  onClick={sendSupportRequest}
                  disabled={sending || !supportText.trim() || !visitorId}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-300 px-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-200 disabled:opacity-50"
                >
                  <Send size={15} aria-hidden />
                  Send to support
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200/30 bg-emerald-300 text-zinc-950 shadow-[0_16px_48px_rgba(52,211,153,0.28)] transition hover:scale-105 hover:bg-emerald-200"
          aria-label="Open support assistant"
        >
          <MessageCircle size={25} aria-hidden />
          {hasAdminReply ? (
            <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-amber-300" />
          ) : null}
          <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white shadow-2xl group-hover:block">
            Need help?
          </span>
        </button>
      )}
    </div>
  );
}

function ChatBubble({ message }: { message: SupportMessage }) {
  const isUser = message.sender === "USER";
  const isAdmin = message.sender === "ADMIN";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-lg border px-3 py-2 text-sm leading-6",
          isUser
            ? "border-emerald-300/20 bg-emerald-300/12 text-emerald-50"
            : isAdmin
              ? "border-amber-300/20 bg-amber-300/12 text-amber-50"
              : "border-white/10 bg-white/7 text-zinc-200",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {isUser ? "You" : isAdmin ? "Support" : "Assistant"}
        </p>
        <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
      </div>
    </div>
  );
}

function createVisitorId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `visitor_${crypto.randomUUID().replace(/-/g, "")}`;
  }

  return `visitor_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getOrCreateVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(VISITOR_STORAGE_KEY);

  if (stored) {
    return stored;
  }

  const visitorId = createVisitorId();

  window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);

  return visitorId;
}

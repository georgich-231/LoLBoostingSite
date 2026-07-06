import { Prisma, SupportConversationStatus, SupportMessageSender } from "@prisma/client";
import {
  fallbackBotAnswer,
  getSupportQuestion,
  supportQuestions,
} from "@/lib/support-assistant";
import { prisma } from "@/server/prisma";
import type { CurrentUser } from "@/server/session";

const MAX_SUPPORT_MESSAGE_LENGTH = 2000;
const VISITOR_ID_PATTERN = /^[a-zA-Z0-9_-]{12,96}$/;

export function normalizeVisitorId(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const visitorId = value.trim();

  return VISITOR_ID_PATTERN.test(visitorId) ? visitorId : null;
}

export function sanitizeSupportBody(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, MAX_SUPPORT_MESSAGE_LENGTH);
}

export async function listSupportConversations({
  user,
  visitorId,
}: {
  user: CurrentUser;
  visitorId: string | null;
}) {
  const where = getConversationListWhere({ user, visitorId });

  if (!where) {
    return [];
  }

  return prisma.supportConversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: 20,
    include: {
      user: { select: { email: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 80,
      },
    },
  });
}

export async function createPreparedSupportConversation({
  user,
  visitorId,
  questionKey,
}: {
  user: CurrentUser;
  visitorId: string | null;
  questionKey?: string | null;
}) {
  const question = getSupportQuestion(questionKey) ?? supportQuestions[0];
  const now = new Date();

  return prisma.supportConversation.create({
    data: {
      visitorId,
      userId: user?.id,
      title: question.shortLabel,
      status: SupportConversationStatus.BOT,
      lastMessageAt: now,
      messages: {
        create: [
          {
            sender: SupportMessageSender.USER,
            body: question.label,
            preparedKey: question.key,
            createdAt: now,
          },
          {
            sender: SupportMessageSender.BOT,
            body: question.answer,
            preparedKey: question.key,
            createdAt: now,
          },
        ],
      },
    },
    include: {
      user: { select: { email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createEmptySupportConversation({
  user,
  visitorId,
}: {
  user: CurrentUser;
  visitorId: string | null;
}) {
  const now = new Date();

  return prisma.supportConversation.create({
    data: {
      visitorId,
      userId: user?.id,
      title: "New chat",
      status: SupportConversationStatus.BOT,
      lastMessageAt: now,
      messages: {
        create: {
          sender: SupportMessageSender.BOT,
          body: fallbackBotAnswer,
          createdAt: now,
        },
      },
    },
    include: {
      user: { select: { email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function appendPreparedSupportAnswer({
  user,
  visitorId,
  conversationId,
  questionKey,
}: {
  user: CurrentUser;
  visitorId: string | null;
  conversationId: string;
  questionKey: string;
}) {
  const question = getSupportQuestion(questionKey);

  if (!question) {
    throw new Error("Unknown support question");
  }

  await requireConversationAccess({ user, visitorId, conversationId });

  const now = new Date();

  return prisma.supportConversation.update({
    where: { id: conversationId },
    data: {
      status: SupportConversationStatus.BOT,
      lastMessageAt: now,
      title: question.shortLabel,
      messages: {
        create: [
          {
            sender: SupportMessageSender.USER,
            body: question.label,
            preparedKey: question.key,
            createdAt: now,
          },
          {
            sender: SupportMessageSender.BOT,
            body: question.answer,
            preparedKey: question.key,
            createdAt: now,
          },
        ],
      },
    },
    include: {
      user: { select: { email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function appendUserSupportRequest({
  user,
  visitorId,
  conversationId,
  body,
}: {
  user: CurrentUser;
  visitorId: string | null;
  conversationId: string;
  body: string;
}) {
  const cleanBody = sanitizeSupportBody(body);

  if (!cleanBody) {
    throw new Error("Support message is required");
  }

  await requireConversationAccess({ user, visitorId, conversationId });

  const now = new Date();

  return prisma.supportConversation.update({
    where: { id: conversationId },
    data: {
      status: SupportConversationStatus.WAITING_ADMIN,
      title: "Support request",
      lastMessageAt: now,
      userId: user?.id,
      messages: {
        create: [
          {
            sender: SupportMessageSender.USER,
            body: cleanBody,
            createdAt: now,
          },
          {
            sender: SupportMessageSender.BOT,
            body: "I sent this to support. When the team replies, their answer will show here automatically.",
            createdAt: now,
          },
        ],
      },
    },
    include: {
      user: { select: { email: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function appendAdminSupportReply({
  conversationId,
  body,
}: {
  conversationId: string;
  body: string;
}) {
  const cleanBody = sanitizeSupportBody(body);

  if (!cleanBody) {
    throw new Error("Reply is required");
  }

  const now = new Date();

  return prisma.supportConversation.update({
    where: { id: conversationId },
    data: {
      status: SupportConversationStatus.ANSWERED,
      lastMessageAt: now,
      messages: {
        create: {
          sender: SupportMessageSender.ADMIN,
          body: cleanBody,
          createdAt: now,
        },
      },
    },
  });
}

export async function requireConversationAccess({
  user,
  visitorId,
  conversationId,
}: {
  user: CurrentUser;
  visitorId: string | null;
  conversationId: string;
}) {
  const where = getConversationAccessWhere({ user, visitorId, conversationId });

  if (!where) {
    throw new Error("Conversation access required");
  }

  const conversation = await prisma.supportConversation.findFirst({
    where,
    select: { id: true },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}

function getConversationListWhere({
  user,
  visitorId,
}: {
  user: CurrentUser;
  visitorId: string | null;
}): Prisma.SupportConversationWhereInput | null {
  const clauses: Prisma.SupportConversationWhereInput[] = [];

  if (user) {
    clauses.push({ userId: user.id });
  }

  if (visitorId) {
    clauses.push({ visitorId });
  }

  if (!clauses.length) {
    return null;
  }

  return { OR: clauses };
}

function getConversationAccessWhere({
  user,
  visitorId,
  conversationId,
}: {
  user: CurrentUser;
  visitorId: string | null;
  conversationId: string;
}): Prisma.SupportConversationWhereInput | null {
  const ownerWhere = getConversationListWhere({ user, visitorId });

  if (!ownerWhere) {
    return null;
  }

  return {
    id: conversationId,
    ...ownerWhere,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { SupportConversationStatus } from "@prisma/client";
import { appendAdminSupportReply, sanitizeSupportBody } from "@/server/services/support";
import { prisma } from "@/server/prisma";
import { getCurrentUser } from "@/server/session";

export async function replyToSupportConversationAction(formData: FormData) {
  const admin = await requireAdminUser();
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = sanitizeSupportBody(formData.get("body"));

  if (!conversationId || !body) {
    throw new Error("Conversation and reply are required");
  }

  await appendAdminSupportReply({ conversationId, body });

  await prisma.adminAuditLog.create({
    data: {
      actorId: admin.id,
      action: "support.reply",
      target: conversationId,
      metadata: { replyLength: body.length },
    },
  });

  revalidatePath("/admin/support");
}

export async function closeSupportConversationAction(formData: FormData) {
  const admin = await requireAdminUser();
  const conversationId = String(formData.get("conversationId") ?? "");

  if (!conversationId) {
    throw new Error("Conversation is required");
  }

  await prisma.supportConversation.update({
    where: { id: conversationId },
    data: { status: SupportConversationStatus.CLOSED },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: admin.id,
      action: "support.close",
      target: conversationId,
      metadata: {},
    },
  });

  revalidatePath("/admin/support");
}

async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
    throw new Error("Admin access required");
  }

  return user;
}

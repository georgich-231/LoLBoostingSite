"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";
import { getCurrentUser } from "@/server/session";

export async function sendCustomerOrderMessageAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Sign in to send order messages.");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!orderId || body.length < 1 || body.length > 1200) {
    throw new Error("Message must be between 1 and 1200 characters.");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: user.id,
      coachProfileId: { not: null },
    },
    select: { id: true },
  });

  if (!order) {
    throw new Error("Order chat opens after a booster is assigned.");
  }

  await prisma.chatMessage.create({
    data: {
      orderId: order.id,
      senderId: user.id,
      body,
    },
  });

  revalidatePath("/orders");
  revalidatePath("/booster");
}

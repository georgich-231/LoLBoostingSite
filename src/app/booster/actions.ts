"use server";

import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";
import { getCurrentUser } from "@/server/session";

async function requireBoosterProfile() {
  const user = await getCurrentUser();

  if (!user || user.role !== "COACH") {
    throw new Error("Booster access required.");
  }

  const profile = await prisma.coachProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, displayName: true },
  });

  if (!profile) {
    throw new Error("Booster profile is missing.");
  }

  return { user, profile };
}

export async function claimBoostOrderAction(formData: FormData) {
  const { user, profile } = await requireBoosterProfile();
  const orderId = String(formData.get("orderId") ?? "");

  if (!orderId) {
    throw new Error("Missing order id.");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      status: OrderStatus.PENDING,
      coachProfileId: null,
    },
    select: { id: true, publicId: true },
  });

  if (!order) {
    throw new Error("This order is no longer available.");
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        coachProfileId: profile.id,
        status: OrderStatus.COACH_ASSIGNED,
      },
    }),
    prisma.orderMilestone.create({
      data: {
        orderId: order.id,
        title: "Booster assigned",
        detail: `${profile.displayName} assigned themselves to this boost.`,
        completedAt: new Date(),
      },
    }),
    prisma.chatMessage.create({
      data: {
        orderId: order.id,
        senderId: user.id,
        body: `${profile.displayName} joined the order chat. This chat is saved with the order for support and dispute review.`,
      },
    }),
  ]);

  revalidatePath("/booster");
  revalidatePath("/orders");
  revalidatePath("/admin");
}

export async function sendBoosterOrderMessageAction(formData: FormData) {
  const { user, profile } = await requireBoosterProfile();
  const orderId = String(formData.get("orderId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!orderId || body.length < 1 || body.length > 1200) {
    throw new Error("Message must be between 1 and 1200 characters.");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      coachProfileId: profile.id,
    },
    select: { id: true },
  });

  if (!order) {
    throw new Error("You can only message orders assigned to you.");
  }

  await prisma.chatMessage.create({
    data: {
      orderId: order.id,
      senderId: user.id,
      body,
    },
  });

  revalidatePath("/booster");
  revalidatePath("/orders");
}

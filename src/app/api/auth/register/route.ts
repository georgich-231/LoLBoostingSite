import { NextResponse } from "next/server";
import {
  createSessionPayload,
  hashPlatformPassword,
} from "@/server/services/auth";
import { prisma } from "@/server/prisma";
import { createSession, setSessionCookie } from "@/server/session";
import { registerSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message;

      return Response.json(
        { error: firstIssue ?? "Invalid registration details", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return Response.json({ error: "Email is already registered" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash: await hashPlatformPassword(parsed.data.password),
      },
    });

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return NextResponse.json({
      session: createSessionPayload({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }),
      security:
        "Platform password hashed server-side. Boost account-access details are handled separately in paid orders when needed.",
    });
  } catch {
    return Response.json({ error: "Unable to register" }, { status: 500 });
  }
}

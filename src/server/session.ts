import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";
import { prisma } from "@/server/prisma";
import { sha256 } from "@/server/crypto";

export const SESSION_COOKIE = "riftprogress_session";
const SESSION_DAYS = 7;

export type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const requestHeaders = await headers();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt,
      userAgent: requestHeaders.get("user-agent"),
      ipAddress:
        requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        requestHeaders.get("x-real-ip"),
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  });

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

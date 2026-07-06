import {
  createSessionPayload,
  verifyPlatformPassword,
} from "@/server/services/auth";
import { prisma } from "@/server/prisma";
import { createSession, setSessionCookie } from "@/server/session";
import { loginSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid login details", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (
      !user?.passwordHash ||
      !(await verifyPlatformPassword(parsed.data.password, user.passwordHash))
    ) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return Response.json({
      session: createSessionPayload({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }),
    });
  } catch {
    return Response.json({ error: "Unable to log in" }, { status: 500 });
  }
}

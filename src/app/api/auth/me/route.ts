import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({ user });
}

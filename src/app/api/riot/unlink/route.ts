import { z } from "zod";
import { unlinkRiotAccount } from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

const unlinkSchema = z.object({
  riotAccountId: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = unlinkSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid unlink request" }, { status: 400 });
  }

  await unlinkRiotAccount(user.id, parsed.data.riotAccountId);

  return Response.json({ ok: true });
}

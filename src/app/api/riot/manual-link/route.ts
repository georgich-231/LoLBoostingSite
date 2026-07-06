import { z } from "zod";
import {
  linkRiotAccountByRiotId,
  serializeRiotError,
} from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";
import { riotIdSchema } from "@/server/validation";

export const runtime = "nodejs";

const manualLinkSchema = z.object({
  riotId: riotIdSchema,
  platform: z.string().trim().min(2).max(6),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = manualLinkSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid Riot ID details", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const linked = await linkRiotAccountByRiotId({
      userId: user.id,
      riotId: parsed.data.riotId,
      platform: parsed.data.platform,
    });

    return Response.json({ linked });
  } catch (error) {
    return Response.json(serializeRiotError(error), { status: 500 });
  }
}

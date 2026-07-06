import { getProfileForUser, serializeRiotError } from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const profile = await getProfileForUser(user.id);

    return Response.json({ profile });
  } catch (error) {
    return Response.json(serializeRiotError(error), { status: 500 });
  }
}

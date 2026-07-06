import {
  getProfileForUser,
  serializeRiotError,
  syncRiotAccount,
} from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET() {
  return refresh();
}

export async function POST() {
  return refresh();
}

async function refresh() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const profile = await getProfileForUser(user.id);

    if (!profile) {
      return Response.json({ error: "No linked Riot account" }, { status: 404 });
    }

    const refreshed = await syncRiotAccount(profile.account.id);

    return Response.json({ profile: refreshed }, { status: 202 });
  } catch (error) {
    return Response.json(serializeRiotError(error), { status: 500 });
  }
}

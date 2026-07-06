import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  linkRiotAccountWithOAuth,
  serializeRiotError,
} from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  if (error) {
    return NextResponse.redirect(new URL(`/auth?riot=error&reason=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth?riot=missing-code", request.url));
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth?next=riot-link", request.url));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("riot_oauth_state")?.value;
  const platform = cookieStore.get("riot_oauth_platform")?.value;
  cookieStore.delete("riot_oauth_state");
  cookieStore.delete("riot_oauth_platform");

  if (!state || state !== expectedState) {
    return NextResponse.redirect(new URL("/auth?riot=bad-state", request.url));
  }

  try {
    await linkRiotAccountWithOAuth({
      userId: user.id,
      code,
      platform,
    });

    return NextResponse.redirect(new URL("/dashboard?riot=linked", request.url));
  } catch (caught) {
    const detail = encodeURIComponent(serializeRiotError(caught).error);
    return NextResponse.redirect(new URL(`/dashboard?riot=error&error=${detail}`, request.url));
  }
}

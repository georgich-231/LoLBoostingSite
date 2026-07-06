import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildRiotAuthorizationUrl,
  serializeRiotError,
} from "@/server/services/riot";
import { getCurrentUser } from "@/server/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth?next=riot-link", request.url));
  }

  try {
    const url = new URL(request.url);
    const auth = buildRiotAuthorizationUrl({
      platform: url.searchParams.get("platform") ?? undefined,
    });
    const cookieStore = await cookies();

    cookieStore.set("riot_oauth_state", auth.state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });
    cookieStore.set("riot_oauth_platform", auth.platform, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60,
    });

    return NextResponse.redirect(auth.url);
  } catch (error) {
    const detail = encodeURIComponent(serializeRiotError(error).error);
    return NextResponse.redirect(new URL(`/auth?riot=setup-required&error=${detail}`, request.url));
  }
}

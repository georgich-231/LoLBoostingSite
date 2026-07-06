import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authenticateWithOAuthCode,
  buildOAuthAuthorizationUrl,
  oauthStateCookie,
  serializeOAuthError,
  type OAuthProvider,
} from "@/server/services/oauth";
import { createSession, setSessionCookie } from "@/server/session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 10 * 60,
};

export async function startOAuth(provider: OAuthProvider, request: Request) {
  try {
    const state = randomUUID();
    const redirectUrl = buildOAuthAuthorizationUrl(provider, state);
    const cookieStore = await cookies();
    cookieStore.set(oauthStateCookie(provider), state, cookieOptions);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    const detail = encodeURIComponent(serializeOAuthError(error).error);
    return NextResponse.redirect(
      new URL(`/auth?oauth=${provider}&error=${detail}`, request.url),
    );
  }
}

export async function finishOAuth(provider: OAuthProvider, request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(oauthStateCookie(provider))?.value;
  cookieStore.delete(oauthStateCookie(provider));

  if (providerError) {
    return NextResponse.redirect(
      new URL(`/auth?oauth=${provider}&error=${encodeURIComponent(providerError)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/auth?oauth=${provider}&error=missing-code`, request.url),
    );
  }

  if (!state || state !== expectedState) {
    return NextResponse.redirect(
      new URL(`/auth?oauth=${provider}&error=bad-state`, request.url),
    );
  }

  try {
    const user = await authenticateWithOAuthCode({ provider, code });
    const { token, expiresAt } = await createSession(user.id);
    await setSessionCookie(token, expiresAt);

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    const detail = encodeURIComponent(serializeOAuthError(error).error);
    return NextResponse.redirect(
      new URL(`/auth?oauth=${provider}&error=${detail}`, request.url),
    );
  }
}

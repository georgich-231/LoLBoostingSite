import { prisma } from "@/server/prisma";
import { AppConfigError, getAppUrl, getRequiredEnv } from "@/server/config";
import { encryptSecret } from "@/server/crypto";

export type OAuthProvider = "google" | "discord";

type OAuthTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
};

type ProviderProfile = {
  providerAccountId: string;
  email: string;
  emailVerified?: boolean;
  name: string;
  imageUrl?: string;
};

type ProviderConfig = {
  provider: OAuthProvider;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  redirectUriEnv: string;
  defaultRedirectPath: string;
  scope: string;
};

const providers: Record<OAuthProvider, ProviderConfig> = {
  google: {
    provider: "google",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    redirectUriEnv: "GOOGLE_REDIRECT_URI",
    defaultRedirectPath: "/api/auth/google/callback",
    scope: "openid email profile",
  },
  discord: {
    provider: "discord",
    authorizationUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    clientIdEnv: "DISCORD_CLIENT_ID",
    clientSecretEnv: "DISCORD_CLIENT_SECRET",
    redirectUriEnv: "DISCORD_REDIRECT_URI",
    defaultRedirectPath: "/api/auth/discord/callback",
    scope: "identify email",
  },
};

export function oauthStateCookie(provider: OAuthProvider) {
  return `riftprogress_${provider}_oauth_state`;
}

export function buildOAuthAuthorizationUrl(provider: OAuthProvider, state: string) {
  const config = providers[provider];
  const clientId = getRequiredEnv(config.clientIdEnv);
  const redirectUri = getRedirectUri(config);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scope,
    state,
  });

  if (provider === "google") {
    params.set("prompt", "select_account");
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

export async function authenticateWithOAuthCode(input: {
  provider: OAuthProvider;
  code: string;
}) {
  const config = providers[input.provider];
  const token = await exchangeCode(config, input.code);
  const profile = await getProviderProfile(input.provider, config, token.access_token);

  if (!profile.email) {
    throw new Error(`${input.provider} did not return an email address.`);
  }

  if (profile.emailVerified === false) {
    throw new Error(`${input.provider} account email must be verified.`);
  }

  return upsertOAuthUser({
    provider: input.provider,
    profile,
    token,
  });
}

function getRedirectUri(config: ProviderConfig) {
  return process.env[config.redirectUriEnv] ?? `${getAppUrl()}${config.defaultRedirectPath}`;
}

async function exchangeCode(config: ProviderConfig, code: string) {
  const clientId = getRequiredEnv(config.clientIdEnv);
  const clientSecret = getRequiredEnv(config.clientSecretEnv);
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(config),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `${config.provider} token exchange failed: ${response.status} ${body.slice(0, 160)}`,
    );
  }

  return (await response.json()) as OAuthTokenResponse;
}

async function getProviderProfile(
  provider: OAuthProvider,
  config: ProviderConfig,
  accessToken: string,
): Promise<ProviderProfile> {
  const response = await fetch(config.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `${provider} profile request failed: ${response.status} ${body.slice(0, 160)}`,
    );
  }

  const profile = (await response.json()) as Record<string, unknown>;

  if (provider === "google") {
    return {
      providerAccountId: String(profile.sub ?? ""),
      email: String(profile.email ?? "").toLowerCase(),
      emailVerified:
        typeof profile.email_verified === "boolean"
          ? profile.email_verified
          : undefined,
      name: String(profile.name ?? profile.email ?? "Google user"),
      imageUrl: typeof profile.picture === "string" ? profile.picture : undefined,
    };
  }

  const username = String(profile.global_name ?? profile.username ?? "Discord user");
  const avatar =
    typeof profile.avatar === "string" && typeof profile.id === "string"
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : undefined;

  return {
    providerAccountId: String(profile.id ?? ""),
    email: String(profile.email ?? "").toLowerCase(),
    emailVerified:
      typeof profile.verified === "boolean" ? profile.verified : undefined,
    name: username,
    imageUrl: avatar,
  };
}

async function upsertOAuthUser(input: {
  provider: OAuthProvider;
  profile: ProviderProfile;
  token: OAuthTokenResponse;
}) {
  if (!input.profile.providerAccountId) {
    throw new Error(`${input.provider} did not return an account id.`);
  }

  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: input.provider,
        providerAccountId: input.profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  const tokenData = encryptedTokenData(input.token);

  if (existingAccount) {
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: existingAccount.userId },
        data: {
          name: input.profile.name,
          imageUrl: input.profile.imageUrl,
        },
      }),
      prisma.oAuthAccount.update({
        where: { id: existingAccount.id },
        data: {
          email: input.profile.email,
          name: input.profile.name,
          imageUrl: input.profile.imageUrl,
          ...tokenData,
        },
      }),
    ]);

    return updatedUser;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.profile.email },
  });

  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider: input.provider,
        providerAccountId: input.profile.providerAccountId,
        email: input.profile.email,
        name: input.profile.name,
        imageUrl: input.profile.imageUrl,
        ...tokenData,
      },
    });

    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: existingUser.name || input.profile.name,
        imageUrl: existingUser.imageUrl ?? input.profile.imageUrl,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: input.profile.email,
      name: input.profile.name,
      imageUrl: input.profile.imageUrl,
      oauthAccounts: {
        create: {
          provider: input.provider,
          providerAccountId: input.profile.providerAccountId,
          email: input.profile.email,
          name: input.profile.name,
          imageUrl: input.profile.imageUrl,
          ...tokenData,
        },
      },
    },
  });
}

function encryptedTokenData(token: OAuthTokenResponse) {
  return {
    accessTokenCiphertext: encryptSecret(token.access_token),
    refreshTokenCiphertext: token.refresh_token
      ? encryptSecret(token.refresh_token)
      : undefined,
    tokenExpiresAt: token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : undefined,
  };
}

export function serializeOAuthError(error: unknown) {
  if (error instanceof AppConfigError) {
    return {
      error: error.message,
      setupRequired: true,
    };
  }

  return {
    error: error instanceof Error ? error.message : "OAuth login failed",
  };
}

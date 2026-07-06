import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { rankScore } from "@/lib/rank-progression";
import { prisma } from "@/server/prisma";
import { AppConfigError, getAppUrl, getRequiredEnv } from "@/server/config";
import { encryptSecret } from "@/server/crypto";

const RIOT_AUTH_URL = "https://auth.riotgames.com/authorize";
const RIOT_TOKEN_URL = "https://auth.riotgames.com/token";

const PLATFORM_TO_REGIONAL: Record<string, string> = {
  BR1: "americas",
  LA1: "americas",
  LA2: "americas",
  NA1: "americas",
  OC1: "sea",
  PH2: "sea",
  SG2: "sea",
  TH2: "sea",
  TW2: "sea",
  VN2: "sea",
  EUW1: "europe",
  EUN1: "europe",
  RU: "europe",
  TR1: "europe",
  JP1: "asia",
  KR: "asia",
};

type RiotAccountDto = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

type RiotSummonerDto = {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
};

type RiotLeagueEntryDto = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

type RiotMatchDto = {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameEndTimestamp?: number;
    gameDuration: number;
    queueId: number;
    participants: Array<{
      puuid: string;
      championName: string;
      individualPosition: string;
      teamPosition: string;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      totalMinionsKilled: number;
      neutralMinionsKilled: number;
      totalDamageDealtToChampions: number;
      visionScore: number;
    }>;
  };
};

type RiotCurrentGameDto = {
  gameId: number;
  gameType: string;
  gameStartTime: number;
  mapId: number;
  gameLength: number;
  gameMode: string;
  gameQueueConfigId: number;
  participants: RiotCurrentGameParticipantDto[];
  bannedChampions?: Array<{
    championId: number;
    teamId: number;
    pickTurn: number;
  }>;
};

type RiotCurrentGameParticipantDto = {
  puuid: string;
  summonerId?: string;
  summonerName?: string;
  riotId?: string;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  bot: boolean;
};

type DataDragonChampionDto = {
  data: Record<
    string,
    {
      id: string;
      key: string;
      name: string;
      image: { full: string };
    }
  >;
};

type DataDragonSummonerSpellDto = {
  data: Record<
    string,
    {
      id: string;
      key: string;
      name: string;
      image: { full: string };
    }
  >;
};

type RiotTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

type RankedSnapshotInput = {
  riotAccountId: string;
  queueType: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  capturedAt: Date;
};

type ExactLpChange = {
  delta: number;
  result: "Win" | "Loss";
};

export type LiveLaneRole = "Top" | "Jungle" | "Mid" | "ADC" | "Support";

export type LiveGameParticipant = {
  puuid: string;
  teamId: number;
  teamName: "Blue" | "Red";
  role: LiveLaneRole;
  roleConfidence: "spell" | "recent" | "champion" | "estimated";
  tags: string[];
  isLinkedAccount: boolean;
  riotId: string;
  championId: number;
  champion: string;
  championImage: string;
  spell1: {
    name: string;
    image: string;
  };
  spell2: {
    name: string;
    image: string;
  };
  profileIconUrl: string;
  rank: {
    label: string;
    tier: string | null;
    division: string | null;
    lp: number | null;
    wins: number;
    losses: number;
    winRate: number | null;
  };
  flexRank: {
    label: string;
    winRate: number | null;
  };
  championExperience: {
    games: number | null;
    wins: number;
    losses: number;
    winRate: number | null;
    sampleSize: number;
  };
};

export type LiveGame = {
  gameId: string;
  platform: string;
  queue: string;
  mode: string;
  map: string;
  gameType: string;
  gameLengthSec: number;
  startedAt: Date | null;
  fetchedAt: Date;
  participants: LiveGameParticipant[];
};

const LIVE_ROLE_ORDER: LiveLaneRole[] = ["Top", "Jungle", "Mid", "ADC", "Support"];

export function normalizePlatform(platform?: string | null) {
  return (platform ?? process.env.RIOT_DEFAULT_PLATFORM ?? "EUW1").toUpperCase();
}

export function regionalRouteForPlatform(platform: string) {
  return PLATFORM_TO_REGIONAL[normalizePlatform(platform)] ?? "europe";
}

export function buildRiotAuthorizationUrl(input?: {
  state?: string;
  platform?: string;
}) {
  const clientId = getRequiredEnv("RIOT_CLIENT_ID");
  const redirectUri =
    process.env.RIOT_REDIRECT_URI ?? `${getAppUrl()}/api/riot/link/callback`;
  const state = input?.state ?? randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid offline_access",
    state,
  });

  return {
    state,
    platform: normalizePlatform(input?.platform),
    url: `${RIOT_AUTH_URL}?${params.toString()}`,
  };
}

export async function exchangeRiotCode(code: string) {
  const clientId = getRequiredEnv("RIOT_CLIENT_ID");
  const clientSecret = getRequiredEnv("RIOT_CLIENT_SECRET");
  const redirectUri =
    process.env.RIOT_REDIRECT_URI ?? `${getAppUrl()}/api/riot/link/callback`;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(RIOT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
    cache: "no-store",
  });

  return riotJson<RiotTokenResponse>(response, "Riot OAuth token exchange failed");
}

export async function getRiotAccountFromRso(accessToken: string, regional = "europe") {
  const response = await fetch(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/me`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  return riotJson<RiotAccountDto>(response, "Unable to load Riot account identity");
}

export async function linkRiotAccountWithOAuth(input: {
  userId: string;
  code: string;
  platform?: string;
}) {
  const token = await exchangeRiotCode(input.code);
  const platform = normalizePlatform(input.platform);
  const regional = regionalRouteForPlatform(platform);
  const account = await getRiotAccountFromRso(token.access_token, regional);

  const linked = await upsertLinkedRiotAccount({
    userId: input.userId,
    platform,
    account,
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
  });

  await syncRiotAccount(linked.id);

  return linked;
}

export async function linkRiotAccountByRiotId(input: {
  userId: string;
  riotId: string;
  platform: string;
}) {
  const [gameName, tagLine] = input.riotId.split("#");

  if (!gameName || !tagLine) {
    throw new Error("Use Riot ID format GameName#TAG.");
  }

  const platform = normalizePlatform(input.platform);
  const regional = regionalRouteForPlatform(platform);
  const account = await riotApi<RiotAccountDto>(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    "Unable to find that Riot ID",
  );

  const linked = await upsertLinkedRiotAccount({
    userId: input.userId,
    platform,
    account,
  });

  await syncRiotAccount(linked.id);

  return linked;
}

export async function syncRiotAccount(riotAccountId: string) {
  const linked = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
  });

  if (!linked) {
    throw new Error("Linked Riot account not found");
  }

  const platform = normalizePlatform(linked.platform);
  const regional = regionalRouteForPlatform(platform);
  const summoner = await riotApi<RiotSummonerDto>(
    `https://${platform.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(linked.puuid)}`,
    "Unable to load League summoner profile",
  );
  const version = await getDataDragonVersion();
  const leagueEntries = await getLeagueEntries(platform, linked.puuid, summoner.id);
  const matchIds = await riotApi<string[]>(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(linked.puuid)}/ids?start=0&count=10`,
    "Unable to load match history",
  );
  const matches = await Promise.all(
    matchIds.map((matchId) =>
      riotApi<RiotMatchDto>(
        `https://${regional}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
        `Unable to load match ${matchId}`,
      ),
    ),
  );
  const capturedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.riotAccount.update({
      where: { id: linked.id },
      data: {
        summonerId: summoner.id,
        summonerIconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${summoner.profileIconId}.png`,
        summonerLevel: summoner.summonerLevel,
        lastSyncedAt: new Date(),
      },
    });

    const exactLpByQueue = new Map<string, ExactLpChange>();
    const rankSnapshots: RankedSnapshotInput[] = leagueEntries.map((entry) => ({
      riotAccountId: linked.id,
      queueType: queueTypeLabel(entry.queueType),
      tier: titleCase(entry.tier),
      division: entry.rank,
      lp: entry.leaguePoints,
      wins: entry.wins,
      losses: entry.losses,
      capturedAt,
    }));

    if (rankSnapshots.length > 0) {
      const previousSnapshots = await tx.rankSnapshot.findMany({
        where: {
          riotAccountId: linked.id,
          queueType: { in: rankSnapshots.map((snapshot) => snapshot.queueType) },
        },
        orderBy: { capturedAt: "desc" },
      });
      const previousByQueue = new Map<string, (typeof previousSnapshots)[number]>();

      for (const snapshot of previousSnapshots) {
        if (!previousByQueue.has(snapshot.queueType)) {
          previousByQueue.set(snapshot.queueType, snapshot);
        }
      }

      for (const current of rankSnapshots) {
        const exactLpChange = calculateExactLpChange(
          previousByQueue.get(current.queueType),
          current,
        );

        if (exactLpChange) {
          exactLpByQueue.set(current.queueType, exactLpChange);
        }
      }

      await tx.rankSnapshot.createMany({
        data: rankSnapshots,
      });
    }

    for (const match of matches) {
      const participant = match.info.participants.find(
        (item) => item.puuid === linked.puuid,
      );

      if (!participant) {
        continue;
      }

      const queueType = queueTypeFromId(match.info.queueId);
      const minutes = Math.max(match.info.gameDuration / 60, 1);
      const result = participant.win ? "Win" : "Loss";
      const exactLpChange = exactLpByQueue.get(queueType);
      const shouldUseExactLp = exactLpChange?.result === result;
      const lpChange = shouldUseExactLp ? exactLpChange.delta : null;
      const lpChangeSource = shouldUseExactLp ? "riot-snapshot" : null;
      const playedAt = new Date(match.info.gameEndTimestamp ?? match.info.gameCreation);

      if (shouldUseExactLp) {
        exactLpByQueue.delete(queueType);
      }

      await tx.match.upsert({
        where: { riotMatchId: match.metadata.matchId },
        update: {
          queueType,
          champion: participant.championName,
          role: normalizeRole(participant.individualPosition || participant.teamPosition),
          result,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          csPerMin:
            (participant.totalMinionsKilled + participant.neutralMinionsKilled) /
            minutes,
          damage: participant.totalDamageDealtToChampions,
          visionScore: participant.visionScore,
          lpChange: lpChange ?? undefined,
          lpChangeSource: lpChangeSource ?? undefined,
          playedAt,
          durationSec: match.info.gameDuration,
        },
        create: {
          riotAccountId: linked.id,
          riotMatchId: match.metadata.matchId,
          queueType,
          champion: participant.championName,
          role: normalizeRole(participant.individualPosition || participant.teamPosition),
          result,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          csPerMin:
            (participant.totalMinionsKilled + participant.neutralMinionsKilled) /
            minutes,
          damage: participant.totalDamageDealtToChampions,
          visionScore: participant.visionScore,
          lpChange,
          lpChangeSource,
          playedAt,
          durationSec: match.info.gameDuration,
        },
      });
    }

    await rebuildChampionStats(tx, linked.id);
  });

  return getProfileForRiotAccount(linked.id);
}

export async function getProfileForUser(userId: string) {
  const linked = await prisma.riotAccount.findFirst({
    where: { userId, unlinkedAt: null },
    orderBy: [{ lastSyncedAt: "desc" }, { linkedAt: "desc" }],
  });

  if (!linked) {
    return null;
  }

  return getProfileForRiotAccount(linked.id);
}

export async function getProfileForRiotAccount(riotAccountId: string) {
  const [account, ranks, matches, championStats] = await Promise.all([
    prisma.riotAccount.findUnique({ where: { id: riotAccountId } }),
    prisma.rankSnapshot.findMany({
      where: { riotAccountId },
      orderBy: { capturedAt: "desc" },
      take: 20,
    }),
    prisma.match.findMany({
      where: { riotAccountId },
      orderBy: { playedAt: "desc" },
      take: 20,
    }),
    prisma.championStats.findMany({
      where: { riotAccountId },
      orderBy: [{ games: "desc" }, { winRate: "desc" }],
      take: 8,
    }),
  ]);

  if (!account) {
    return null;
  }

  return {
    account,
    ranks,
    matches,
    championStats,
    lastUpdated: account.lastSyncedAt,
  };
}

export async function getLiveGameForUser(userId: string) {
  const linked = await prisma.riotAccount.findFirst({
    where: { userId, unlinkedAt: null },
    orderBy: [{ lastSyncedAt: "desc" }, { linkedAt: "desc" }],
  });

  if (!linked) {
    return null;
  }

  return getLiveGameForRiotAccount(linked.id);
}

export async function getLiveGameForRiotAccount(riotAccountId: string): Promise<LiveGame | null> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
  });

  if (!account) {
    return null;
  }

  const platform = normalizePlatform(account.platform);
  const regional = regionalRouteForPlatform(platform);
  const liveGame = await riotApiOrNull<RiotCurrentGameDto>(
    `https://${platform.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(account.puuid)}`,
    "Unable to load live game",
  );

  if (!liveGame) {
    return null;
  }

  const version = await getDataDragonVersion();
  const [championsByKey, spellsByKey] = await Promise.all([
    getChampionMap(version),
    getSummonerSpellMap(version),
  ]);
  const participantData = await Promise.all(
    liveGame.participants.map(async (participant) => {
      const champion = championsByKey.get(String(participant.championId));
      const championName = champion?.name ?? `Champion ${participant.championId}`;
      const [leagueEntries, riotAccount, championContext] = await Promise.all([
        getLeagueEntries(platform, participant.puuid, participant.summonerId).catch(
          () => [] as RiotLeagueEntryDto[],
        ),
        participant.riotId
          ? Promise.resolve(null)
          : getRiotAccountByPuuid(regional, participant.puuid).catch(() => null),
        getLiveChampionContext(regional, participant.puuid, championName).catch(
          () => emptyLiveChampionContext(),
        ),
      ]);

      return {
        participant,
        champion,
        championName,
        leagueEntries,
        riotAccount,
        championContext,
      };
    }),
  );
  const participantDrafts = participantData.map(
    ({ participant, champion, championName, leagueEntries, riotAccount, championContext }) => {
      const spell1 = spellsByKey.get(String(participant.spell1Id));
      const spell2 = spellsByKey.get(String(participant.spell2Id));
      const soloRank = getRankSummary(leagueEntries, "RANKED_SOLO_5x5");
      const flexRank = getRankSummary(leagueEntries, "RANKED_FLEX_SR");
      const roleHint = inferLiveRole({
        championName,
        championContext,
        spellNames: [spell1?.name, spell2?.name],
      });

      return {
        puuid: participant.puuid,
        teamId: participant.teamId,
        teamName: participant.teamId === 100 ? "Blue" as const : "Red" as const,
        roleHint: roleHint.role,
        roleConfidence: roleHint.confidence,
        roleSignals: roleHint.tags,
        isLinkedAccount: participant.puuid === account.puuid,
        riotId:
          participant.riotId ??
          formatRiotId(riotAccount) ??
          participant.summonerName ??
          "Hidden player",
        championId: participant.championId,
        champion: championName,
        championImage: champion
          ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`
          : `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${participant.profileIconId}.png`,
        spell1: {
          name: spell1?.name ?? `Spell ${participant.spell1Id}`,
          image: spell1
            ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell1.image.full}`
            : `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${participant.profileIconId}.png`,
        },
        spell2: {
          name: spell2?.name ?? `Spell ${participant.spell2Id}`,
          image: spell2
            ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${spell2.image.full}`
            : `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${participant.profileIconId}.png`,
        },
        profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${participant.profileIconId}.png`,
        rank: soloRank,
        flexRank: {
          label: flexRank.label,
          winRate: flexRank.winRate,
        },
        championExperience: {
          games: championContext.games,
          wins: championContext.wins,
          losses: championContext.losses,
          winRate: championContext.winRate,
          sampleSize: championContext.sampleSize,
        },
        championContext,
      };
    },
  );
  const participants = [
    ...assignLiveTeamRoles(participantDrafts.filter((player) => player.teamId === 100)),
    ...assignLiveTeamRoles(participantDrafts.filter((player) => player.teamId !== 100)),
  ];

  return {
    gameId: String(liveGame.gameId),
    platform,
    queue: queueTypeFromId(liveGame.gameQueueConfigId),
    mode: titleCase(liveGame.gameMode),
    map: mapLabel(liveGame.mapId),
    gameType: titleCase(liveGame.gameType),
    gameLengthSec: liveGame.gameLength,
    startedAt: liveGame.gameStartTime ? new Date(liveGame.gameStartTime) : null,
    fetchedAt: new Date(),
    participants,
  };
}

type LiveChampionContext = {
  games: number | null;
  wins: number;
  losses: number;
  winRate: number | null;
  sampleSize: number;
  primaryRole: LiveLaneRole | null;
  tags: string[];
};

type LiveParticipantDraft = Omit<
  LiveGameParticipant,
  "role" | "roleConfidence" | "tags"
> & {
  roleHint: LiveLaneRole | null;
  roleConfidence: LiveGameParticipant["roleConfidence"];
  roleSignals: string[];
  championContext: LiveChampionContext;
};

async function getLiveChampionContext(
  regional: string,
  puuid: string,
  championName: string,
): Promise<LiveChampionContext> {
  const matchIds = await riotApi<string[]>(
    `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=0&count=12`,
    "Unable to load live participant match sample",
  );
  const matches = await Promise.all(
    matchIds.map((matchId) =>
      riotApi<RiotMatchDto>(
        `https://${regional}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
        "Unable to load live participant match",
      ).catch(() => null),
    ),
  );
  const participantMatches = matches
    .map((match) => {
      const participant = match?.info.participants.find((item) => item.puuid === puuid);

      if (!match || !participant) {
        return null;
      }

      return {
        champion: participant.championName,
        role: toLiveLaneRole(participant.individualPosition || participant.teamPosition),
        win: participant.win,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const championMatches = participantMatches.filter(
    (match) => normalizeChampionKey(match.champion) === normalizeChampionKey(championName),
  );
  const wins = championMatches.filter((match) => match.win).length;
  const games = championMatches.length;
  const primaryRole =
    getMostCommonRole(championMatches) ?? getMostCommonRole(participantMatches);
  const winRate = games ? Math.round((wins / games) * 100) : null;
  const tags: string[] = [];

  if (games >= 5) {
    tags.push("Comfort pick");
  } else if (games === 0 && participantMatches.length > 0) {
    tags.push("No recent champ games");
  }

  if (winRate !== null && winRate >= 60 && games >= 3) {
    tags.push("Hot pick");
  }

  return {
    games,
    wins,
    losses: Math.max(0, games - wins),
    winRate,
    sampleSize: participantMatches.length,
    primaryRole,
    tags,
  };
}

function emptyLiveChampionContext(): LiveChampionContext {
  return {
    games: null,
    wins: 0,
    losses: 0,
    winRate: null,
    sampleSize: 0,
    primaryRole: null,
    tags: ["Sample unavailable"],
  };
}

function inferLiveRole(input: {
  championName: string;
  championContext: LiveChampionContext;
  spellNames: Array<string | undefined>;
}): {
  role: LiveLaneRole | null;
  confidence: LiveGameParticipant["roleConfidence"];
  tags: string[];
} {
  if (input.spellNames.some((spellName) => spellName === "Smite")) {
    return {
      role: "Jungle",
      confidence: "spell",
      tags: ["Smite"],
    };
  }

  if (input.championContext.primaryRole) {
    return {
      role: input.championContext.primaryRole,
      confidence: "recent",
      tags: [`Recent ${input.championContext.primaryRole}`],
    };
  }

  const championRole = getChampionRoleHint(input.championName);

  if (championRole) {
    return {
      role: championRole,
      confidence: "champion",
      tags: ["Champion role"],
    };
  }

  return {
    role: null,
    confidence: "estimated",
    tags: [],
  };
}

function assignLiveTeamRoles(players: LiveParticipantDraft[]): LiveGameParticipant[] {
  const remaining = new Set(players.map((player) => player.puuid));
  const assigned = new Map<string, LiveLaneRole>();

  for (const role of LIVE_ROLE_ORDER) {
    const candidates = players
      .filter((player) => remaining.has(player.puuid) && player.roleHint === role)
      .sort((a, b) => roleConfidenceScore(b.roleConfidence) - roleConfidenceScore(a.roleConfidence));
    const selected = candidates[0];

    if (selected) {
      assigned.set(selected.puuid, role);
      remaining.delete(selected.puuid);
    }
  }

  const openRoles = LIVE_ROLE_ORDER.filter(
    (role) => ![...assigned.values()].includes(role),
  );
  const unassignedPlayers = players.filter((player) => remaining.has(player.puuid));

  for (let index = 0; index < unassignedPlayers.length; index += 1) {
    assigned.set(
      unassignedPlayers[index].puuid,
      openRoles[index] ?? LIVE_ROLE_ORDER[index % LIVE_ROLE_ORDER.length],
    );
  }

  return players
    .map((player) => {
      const role = assigned.get(player.puuid) ?? player.roleHint ?? "Support";
      const tags = getLivePlayerTags(player, role);
      const {
        roleHint: _roleHint,
        roleSignals: _roleSignals,
        championContext: _championContext,
        ...publicPlayer
      } = player;
      void _roleHint;
      void _roleSignals;
      void _championContext;

      return {
        ...publicPlayer,
        role,
        roleConfidence:
          player.roleHint === role ? player.roleConfidence : "estimated",
        tags,
      };
    })
    .sort((a, b) => LIVE_ROLE_ORDER.indexOf(a.role) - LIVE_ROLE_ORDER.indexOf(b.role));
}

function getLivePlayerTags(player: LiveParticipantDraft, assignedRole: LiveLaneRole) {
  const tags = [
    ...player.roleSignals,
    ...player.championContext.tags,
  ];

  if (
    player.championContext.primaryRole &&
    player.championContext.primaryRole !== assignedRole &&
    player.championContext.sampleSize >= 4
  ) {
    tags.push("Autofill risk");
  } else if (player.roleHint === assignedRole && player.roleConfidence !== "estimated") {
    tags.push("Main role");
  } else {
    tags.push("Role estimated");
  }

  if (player.isLinkedAccount) {
    tags.push("Linked account");
  }

  return [...new Set(tags)].slice(0, 4);
}

function roleConfidenceScore(confidence: LiveGameParticipant["roleConfidence"]) {
  if (confidence === "spell") {
    return 4;
  }
  if (confidence === "recent") {
    return 3;
  }
  if (confidence === "champion") {
    return 2;
  }

  return 1;
}

function getMostCommonRole(
  matches: Array<{
    role: LiveLaneRole | null;
  }>,
) {
  const counts = new Map<LiveLaneRole, number>();

  for (const match of matches) {
    if (!match.role) {
      continue;
    }

    counts.set(match.role, (counts.get(match.role) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function toLiveLaneRole(role: string): LiveLaneRole | null {
  const normalized = role.toUpperCase();

  if (normalized === "TOP") {
    return "Top";
  }
  if (normalized === "JUNGLE") {
    return "Jungle";
  }
  if (normalized === "MIDDLE" || normalized === "MID") {
    return "Mid";
  }
  if (normalized === "BOTTOM" || normalized === "ADC") {
    return "ADC";
  }
  if (normalized === "UTILITY" || normalized === "SUPPORT") {
    return "Support";
  }

  return null;
}

function normalizeChampionKey(championName: string) {
  return championName.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function getChampionRoleHint(championName: string): LiveLaneRole | null {
  const champion = normalizeChampionKey(championName);
  const championRoles: Record<LiveLaneRole, string[]> = {
    Top: [
      "aatrox",
      "camille",
      "darius",
      "fiora",
      "garen",
      "gnar",
      "gwen",
      "illaoi",
      "irelia",
      "jax",
      "ksante",
      "malphite",
      "mordekaiser",
      "ornn",
      "renekton",
      "riven",
      "sett",
      "shen",
      "singed",
      "sion",
      "tryndamere",
      "yone",
    ],
    Jungle: [
      "amumu",
      "belveth",
      "briar",
      "diana",
      "ekko",
      "elise",
      "evelynn",
      "graves",
      "hecarim",
      "jarvaniv",
      "kayn",
      "khazix",
      "leesin",
      "lillia",
      "masteryi",
      "nidalee",
      "nocturne",
      "nunu",
      "reksai",
      "rengar",
      "sejuani",
      "shaco",
      "taliyah",
      "viego",
      "vi",
      "warwick",
    ],
    Mid: [
      "ahri",
      "akali",
      "anivia",
      "annie",
      "aurelionsol",
      "azir",
      "cassiopeia",
      "fizz",
      "galio",
      "hwei",
      "kassadin",
      "katarina",
      "leblanc",
      "lissandra",
      "lux",
      "malzahar",
      "orianna",
      "qiyana",
      "ryze",
      "syndra",
      "sylas",
      "talon",
      "twistedfate",
      "veigar",
      "vex",
      "viktor",
      "yasuo",
      "zed",
      "zoe",
    ],
    ADC: [
      "aphelios",
      "ashe",
      "caitlyn",
      "draven",
      "ezreal",
      "jhin",
      "jinx",
      "kaisa",
      "kalista",
      "kogmaw",
      "lucian",
      "missfortune",
      "nilah",
      "samira",
      "sivir",
      "tristana",
      "twitch",
      "varus",
      "vayne",
      "xayah",
      "zeri",
    ],
    Support: [
      "alistar",
      "bard",
      "blitzcrank",
      "braum",
      "janna",
      "karma",
      "leona",
      "lulu",
      "milio",
      "morgana",
      "nami",
      "nautilus",
      "pyke",
      "rakan",
      "rell",
      "renata",
      "senna",
      "sona",
      "soraka",
      "tahmkench",
      "taric",
      "thresh",
      "yuumi",
      "zyra",
    ],
  };

  return LIVE_ROLE_ORDER.find((role) => championRoles[role].includes(champion)) ?? null;
}

export async function unlinkRiotAccount(userId: string, riotAccountId: string) {
  return prisma.riotAccount.updateMany({
    where: { id: riotAccountId, userId },
    data: {
      unlinkedAt: new Date(),
      accessTokenCiphertext: null,
      refreshTokenCiphertext: null,
      tokenExpiresAt: null,
    },
  });
}

async function upsertLinkedRiotAccount(input: {
  userId: string;
  platform: string;
  account: RiotAccountDto;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}) {
  return prisma.riotAccount.upsert({
    where: { puuid: input.account.puuid },
    update: {
      userId: input.userId,
      gameName: input.account.gameName,
      tagLine: input.account.tagLine,
      platform: input.platform,
      region: regionalRouteForPlatform(input.platform),
      accessTokenCiphertext: input.accessToken
        ? encryptSecret(input.accessToken)
        : undefined,
      refreshTokenCiphertext: input.refreshToken
        ? encryptSecret(input.refreshToken)
        : undefined,
      tokenExpiresAt: input.tokenExpiresAt,
      unlinkedAt: null,
      linkedAt: new Date(),
    },
    create: {
      userId: input.userId,
      puuid: input.account.puuid,
      gameName: input.account.gameName,
      tagLine: input.account.tagLine,
      platform: input.platform,
      region: regionalRouteForPlatform(input.platform),
      accessTokenCiphertext: input.accessToken
        ? encryptSecret(input.accessToken)
        : undefined,
      refreshTokenCiphertext: input.refreshToken
        ? encryptSecret(input.refreshToken)
        : undefined,
      tokenExpiresAt: input.tokenExpiresAt,
    },
  });
}

async function riotApi<T>(url: string, failureMessage: string) {
  const apiKey = getRequiredEnv("RIOT_API_KEY");
  const response = await fetch(url, {
    headers: {
      "X-Riot-Token": apiKey,
    },
    cache: "no-store",
  });

  return riotJson<T>(response, failureMessage);
}

async function riotApiOrNull<T>(url: string, failureMessage: string) {
  const apiKey = getRequiredEnv("RIOT_API_KEY");
  const response = await fetch(url, {
    headers: {
      "X-Riot-Token": apiKey,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  return riotJson<T>(response, failureMessage);
}

async function riotJson<T>(response: Response, failureMessage: string) {
  if (!response.ok) {
    const body = await response.text();
    const status = response.status;

    if (status === 429) {
      throw new Error(`${failureMessage}: Riot API rate limit reached.`);
    }

    if (status === 403) {
      throw new Error(`${failureMessage}: Riot credentials were rejected.`);
    }

    if (status === 404) {
      throw new Error(`${failureMessage}: not found.`);
    }

    throw new Error(`${failureMessage}: ${status} ${body.slice(0, 160)}`);
  }

  return (await response.json()) as T;
}

async function getRiotAccountByPuuid(regional: string, puuid: string) {
  return riotApi<RiotAccountDto>(
    `https://${regional}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`,
    "Unable to load Riot account identity",
  );
}

async function getLeagueEntries(
  platform: string,
  puuid: string,
  summonerId?: string,
) {
  try {
    return await riotApi<RiotLeagueEntryDto[]>(
      `https://${platform.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
      "Unable to load ranked entries",
    );
  } catch (error) {
    if (!summonerId) {
      throw error;
    }

    return riotApi<RiotLeagueEntryDto[]>(
      `https://${platform.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`,
      "Unable to load ranked entries",
    );
  }
}

async function getDataDragonVersion() {
  try {
    const response = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json",
      { next: { revalidate: 60 * 60 * 6 } },
    );
    const versions = (await response.json()) as string[];

    return versions[0] ?? "15.24.1";
  } catch {
    return "15.24.1";
  }
}

async function getChampionMap(version: string) {
  try {
    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      { next: { revalidate: 60 * 60 * 6 } },
    );
    const payload = (await response.json()) as DataDragonChampionDto;

    return new Map(
      Object.values(payload.data).map((champion) => [champion.key, champion]),
    );
  } catch {
    return new Map<string, DataDragonChampionDto["data"][string]>();
  }
}

async function getSummonerSpellMap(version: string) {
  try {
    const response = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/summoner.json`,
      { next: { revalidate: 60 * 60 * 6 } },
    );
    const payload = (await response.json()) as DataDragonSummonerSpellDto;

    return new Map(Object.values(payload.data).map((spell) => [spell.key, spell]));
  } catch {
    return new Map<string, DataDragonSummonerSpellDto["data"][string]>();
  }
}

async function rebuildChampionStats(
  tx: Prisma.TransactionClient,
  riotAccountId: string,
) {
  const matches = await tx.match.findMany({
    where: { riotAccountId },
    orderBy: { playedAt: "desc" },
    take: 80,
  });
  const grouped = new Map<
    string,
    {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      csPerMin: number;
      damagePerMin: number;
    }
  >();

  for (const match of matches) {
    const current =
      grouped.get(match.champion) ??
      {
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        csPerMin: 0,
        damagePerMin: 0,
      };
    current.games += 1;
    current.wins += match.result === "Win" ? 1 : 0;
    current.kills += match.kills;
    current.deaths += match.deaths;
    current.assists += match.assists;
    current.csPerMin += match.csPerMin;
    current.damagePerMin += match.damage / Math.max(match.durationSec / 60, 1);
    grouped.set(match.champion, current);
  }

  await tx.championStats.deleteMany({ where: { riotAccountId, season: "current" } });

  for (const [champion, stat] of grouped) {
    await tx.championStats.create({
      data: {
        riotAccountId,
        champion,
        queueType: "Ranked",
        season: "current",
        games: stat.games,
        winRate: (stat.wins / stat.games) * 100,
        avgKda:
          (stat.kills + stat.assists) /
          Math.max(stat.deaths === 0 ? 1 : stat.deaths, 1),
        csPerMin: stat.csPerMin / stat.games,
        damagePerMin: stat.damagePerMin / stat.games,
      },
    });
  }
}

function queueTypeLabel(queueType: string) {
  if (queueType === "RANKED_SOLO_5x5") {
    return "Ranked Solo/Duo";
  }

  if (queueType === "RANKED_FLEX_SR") {
    return "Ranked Flex";
  }

  return queueType;
}

function queueTypeFromId(queueId: number) {
  if (queueId === 400) {
    return "Normal Draft";
  }

  if (queueId === 430) {
    return "Normal Blind";
  }

  if (queueId === 420) {
    return "Ranked Solo/Duo";
  }

  if (queueId === 450) {
    return "ARAM";
  }

  if (queueId === 440) {
    return "Ranked Flex";
  }

  if (queueId === 700) {
    return "Clash";
  }

  return `Queue ${queueId}`;
}

function mapLabel(mapId: number) {
  if (mapId === 11) {
    return "Summoner's Rift";
  }

  if (mapId === 12) {
    return "Howling Abyss";
  }

  return `Map ${mapId}`;
}

function formatRiotId(account: RiotAccountDto | null) {
  if (!account) {
    return null;
  }

  return `${account.gameName}#${account.tagLine}`;
}

function getRankSummary(entries: RiotLeagueEntryDto[], queueType: string) {
  const entry = entries.find((item) => item.queueType === queueType);

  if (!entry) {
    return {
      label: "Unranked",
      tier: null,
      division: null,
      lp: null,
      wins: 0,
      losses: 0,
      winRate: null,
    };
  }

  const wins = entry.wins;
  const losses = entry.losses;
  const totalGames = wins + losses;
  const tier = titleCase(entry.tier);

  return {
    label: `${tier} ${entry.rank} ${entry.leaguePoints} LP`,
    tier,
    division: entry.rank,
    lp: entry.leaguePoints,
    wins,
    losses,
    winRate: totalGames ? Math.round((wins / totalGames) * 100) : null,
  };
}

function normalizeRole(role: string) {
  const normalized = role.toUpperCase();
  if (normalized === "BOTTOM") {
    return "ADC";
  }
  if (normalized === "UTILITY") {
    return "Support";
  }

  return titleCase(normalized.toLowerCase());
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/(^|_|\s)([a-z])/g, (_match, prefix: string, char: string) =>
      `${prefix === "_" ? " " : prefix}${char.toUpperCase()}`,
    );
}

function calculateExactLpChange(
  previous: {
    tier: string;
    division: string;
    lp: number;
    wins: number;
    losses: number;
  } | undefined,
  current: RankedSnapshotInput,
): ExactLpChange | null {
  if (!previous) {
    return null;
  }

  const winsDelta = current.wins - previous.wins;
  const lossesDelta = current.losses - previous.losses;
  const gamesDelta = winsDelta + lossesDelta;

  if (
    gamesDelta !== 1 ||
    (winsDelta !== 1 && lossesDelta !== 1) ||
    winsDelta < 0 ||
    lossesDelta < 0
  ) {
    return null;
  }

  return {
    delta: rankScore(current) - rankScore(previous),
    result: winsDelta === 1 ? "Win" : "Loss",
  };
}

export function serializeRiotError(error: unknown) {
  if (error instanceof AppConfigError) {
    return {
      error: error.message,
      setupRequired: true,
    };
  }

  return {
    error: error instanceof Error ? error.message : "Unexpected Riot API error",
  };
}

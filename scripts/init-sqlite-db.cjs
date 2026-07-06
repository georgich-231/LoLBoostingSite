const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const root = process.cwd();
const reset = process.argv.includes("--reset");

function readEnvFile(file) {
  if (!fs.existsSync(file)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line
          .slice(index + 1)
          .trim()
          .replace(/^"|"$/g, "");

        return [key, value];
      }),
  );
}

const env = {
  ...readEnvFile(path.join(root, ".env")),
  ...readEnvFile(path.join(root, ".env.local")),
  ...process.env,
};
const databaseUrl = env.DATABASE_URL || "file:./prisma/dev.db";

if (!databaseUrl.startsWith("file:")) {
  throw new Error("Local db:push expects a SQLite file: DATABASE_URL.");
}

const rawPath = databaseUrl.slice("file:".length);
const dbPath = path.resolve(root, rawPath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

if (reset && fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
}

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT,
  "imageUrl" TEXT,
  "role" TEXT NOT NULL DEFAULT 'USER',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" DATETIME NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE TABLE IF NOT EXISTS "OAuthAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "imageUrl" TEXT,
  "accessTokenCiphertext" TEXT,
  "refreshTokenCiphertext" TEXT,
  "tokenExpiresAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");
CREATE INDEX IF NOT EXISTS "OAuthAccount_email_idx" ON "OAuthAccount"("email");

CREATE TABLE IF NOT EXISTS "RiotAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "puuid" TEXT NOT NULL UNIQUE,
  "gameName" TEXT NOT NULL,
  "tagLine" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "summonerId" TEXT,
  "summonerIconUrl" TEXT,
  "summonerLevel" INTEGER,
  "accessTokenCiphertext" TEXT,
  "refreshTokenCiphertext" TEXT,
  "tokenExpiresAt" DATETIME,
  "linkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unlinkedAt" DATETIME,
  "lastSyncedAt" DATETIME,
  CONSTRAINT "RiotAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "RiotAccount_userId_idx" ON "RiotAccount"("userId");
CREATE INDEX IF NOT EXISTS "RiotAccount_platform_gameName_tagLine_idx" ON "RiotAccount"("platform", "gameName", "tagLine");

CREATE TABLE IF NOT EXISTS "RankSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "riotAccountId" TEXT NOT NULL,
  "queueType" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "division" TEXT NOT NULL,
  "lp" INTEGER NOT NULL,
  "wins" INTEGER NOT NULL,
  "losses" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'riot-api',
  "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RankSnapshot_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "RiotAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "RankSnapshot_riotAccountId_capturedAt_idx" ON "RankSnapshot"("riotAccountId", "capturedAt");

CREATE TABLE IF NOT EXISTS "Match" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "riotAccountId" TEXT NOT NULL,
  "riotMatchId" TEXT NOT NULL UNIQUE,
  "queueType" TEXT NOT NULL,
  "champion" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "kills" INTEGER NOT NULL,
  "deaths" INTEGER NOT NULL,
  "assists" INTEGER NOT NULL,
  "csPerMin" REAL NOT NULL,
  "damage" INTEGER NOT NULL,
  "visionScore" INTEGER NOT NULL,
  "lpChange" INTEGER,
  "lpChangeSource" TEXT,
  "playedAt" DATETIME NOT NULL,
  "durationSec" INTEGER NOT NULL,
  CONSTRAINT "Match_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "RiotAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Match_riotAccountId_playedAt_idx" ON "Match"("riotAccountId", "playedAt");
CREATE INDEX IF NOT EXISTS "Match_champion_role_idx" ON "Match"("champion", "role");

CREATE TABLE IF NOT EXISTS "ChampionStats" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "riotAccountId" TEXT NOT NULL,
  "champion" TEXT NOT NULL,
  "queueType" TEXT NOT NULL,
  "season" TEXT NOT NULL,
  "games" INTEGER NOT NULL,
  "winRate" REAL NOT NULL,
  "avgKda" REAL NOT NULL,
  "csPerMin" REAL NOT NULL,
  "damagePerMin" REAL NOT NULL,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ChampionStats_riotAccountId_fkey" FOREIGN KEY ("riotAccountId") REFERENCES "RiotAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ChampionStats_riotAccountId_champion_queueType_season_key" ON "ChampionStats"("riotAccountId", "champion", "queueType", "season");

CREATE TABLE IF NOT EXISTS "Goal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "targetRank" TEXT,
  "targetLp" INTEGER,
  "targetValue" REAL,
  "current" REAL NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL,
  "dueAt" DATETIME,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");

CREATE TABLE IF NOT EXISTS "CoachProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "displayName" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "peakRank" TEXT NOT NULL,
  "roles" TEXT NOT NULL,
  "championExpertise" TEXT NOT NULL,
  "languages" TEXT NOT NULL,
  "availability" TEXT NOT NULL,
  "pricePerSessionCents" INTEGER NOT NULL,
  "bio" TEXT NOT NULL,
  "verificationDocUrl" TEXT,
  "verifiedAt" DATETIME,
  "rating" REAL NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "basePriceCents" INTEGER NOT NULL,
  "estimatedLengthMin" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "addOns" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "BoostPricingConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "updatedById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "publicId" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "coachProfileId" TEXT,
  "serviceId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "linkedAccountId" TEXT,
  "manualRiotId" TEXT,
  "currentRank" TEXT NOT NULL,
  "targetGoal" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "champion" TEXT,
  "startingLp" INTEGER,
  "currentLp" INTEGER,
  "goalLp" INTEGER,
  "scheduledFor" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Order_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Order_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Order_userId_status_idx" ON "Order"("userId", "status");
CREATE INDEX IF NOT EXISTS "Order_coachProfileId_status_idx" ON "Order"("coachProfileId", "status");

CREATE TABLE IF NOT EXISTS "OrderMilestone" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "completedAt" DATETIME,
  "dueAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderMilestone_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "OrderMilestone_orderId_idx" ON "OrderMilestone"("orderId");

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "fileUrl" TEXT,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ChatMessage_orderId_createdAt_idx" ON "ChatMessage"("orderId", "createdAt");

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "stripeCheckoutSession" TEXT,
  "stripePaymentIntent" TEXT,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "refundedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "coachProfileId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Review_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "metadata" TEXT NOT NULL,
  "ipAddress" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "readAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

CREATE TABLE IF NOT EXISTS "SupportConversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "visitorId" TEXT,
  "userId" TEXT,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'BOT',
  "source" TEXT NOT NULL DEFAULT 'assistant',
  "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "SupportConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "SupportConversation_visitorId_lastMessageAt_idx" ON "SupportConversation"("visitorId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "SupportConversation_userId_lastMessageAt_idx" ON "SupportConversation"("userId", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "SupportConversation_status_lastMessageAt_idx" ON "SupportConversation"("status", "lastMessageAt");

CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "sender" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "preparedKey" TEXT,
  "readByUserAt" DATETIME,
  "readByAdminAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "SupportMessage_conversationId_createdAt_idx" ON "SupportMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportMessage_sender_createdAt_idx" ON "SupportMessage"("sender", "createdAt");
`);

const matchColumns = db.prepare(`PRAGMA table_info("Match")`).all();
if (!matchColumns.some((column) => column.name === "lpChangeSource")) {
  db.exec(`ALTER TABLE "Match" ADD COLUMN "lpChangeSource" TEXT`);
}

db.close();
console.log(`${reset ? "Reset and initialized" : "Initialized"} SQLite database at ${dbPath}`);

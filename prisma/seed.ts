import {
  NotificationType,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  ServiceCategory,
  UserRole,
} from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hashPlatformPassword } from "../src/server/services/auth";
import { DEFAULT_BOOST_PRICING_CONFIG } from "../src/lib/boost-pricing";
import {
  championStats,
  goals,
  lpSnapshots,
  recentMatches,
  riotAccount,
  services,
} from "../src/lib/starter-data";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const serviceCategoryMap: Record<string, ServiceCategory> = {
  "Elo Boosting": ServiceCategory.ELO_BOOSTING,
  "Duo Boosting": ServiceCategory.DUO_BOOSTING,
  "Placement Boost": ServiceCategory.PLACEMENT_BOOST,
  "Win Boost": ServiceCategory.WIN_BOOST,
  "Pay Per Game": ServiceCategory.PAY_PER_GAME,
  "Promo Help": ServiceCategory.PROMO_HELP,
  "Ranked Boost Plan": ServiceCategory.RANKED_BOOST_PLAN,
};

async function main() {
  const shouldSeedDemoData = process.env.SEED_DEMO_DATA === "true";
  const adminPasswordHash = await hashPlatformPassword(
    process.env.ADMIN_SEED_PASSWORD ?? "RiftAdmin!2026",
  );
  const adminEmail = process.env.ADMIN_SEED_EMAIL ?? "admin@riftprogress.gg";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      email: adminEmail,
      name: "Rift Admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  const seededServices = await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { slug: service.id },
        update: {
          title: service.title,
          description: service.description,
          category: serviceCategoryMap[service.category],
          basePriceCents: service.basePrice * 100,
          active: true,
          addOns: service.includes,
        },
        create: {
          slug: service.id,
          title: service.title,
          description: service.description,
          category: serviceCategoryMap[service.category],
          basePriceCents: service.basePrice * 100,
          estimatedLengthMin: service.sessionLength.includes("90") ? 90 : 60,
          addOns: service.includes,
        },
      }),
    ),
  );
  await prisma.service.updateMany({
    where: { slug: { notIn: services.map((service) => service.id) } },
    data: { active: false },
  });

  await prisma.boostPricingConfig.upsert({
    where: { key: "boost-pricing" },
    update: {},
    create: {
      key: "boost-pricing",
      value: DEFAULT_BOOST_PRICING_CONFIG,
      updatedById: admin.id,
    },
  });

  if (shouldSeedDemoData) {
    const passwordHash = await hashPlatformPassword("RiftProgress!2026");
    const user = await prisma.user.upsert({
      where: { email: "player@riftprogress.gg" },
      update: {},
      create: {
        email: "player@riftprogress.gg",
        name: "NovaFlux",
        passwordHash,
        role: UserRole.USER,
      },
    });

    const riot = await prisma.riotAccount.upsert({
      where: { puuid: riotAccount.puuid },
      update: {
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        region: riotAccount.region,
        platform: riotAccount.platform,
        summonerId: riotAccount.summonerId,
        summonerIconUrl: riotAccount.summonerIcon,
        summonerLevel: riotAccount.summonerLevel,
        lastSyncedAt: new Date(),
      },
      create: {
        userId: user.id,
        puuid: riotAccount.puuid,
        gameName: riotAccount.gameName,
        tagLine: riotAccount.tagLine,
        region: riotAccount.region,
        platform: riotAccount.platform,
        summonerId: riotAccount.summonerId,
        summonerIconUrl: riotAccount.summonerIcon,
        summonerLevel: riotAccount.summonerLevel,
        lastSyncedAt: new Date(),
      },
    });

    await prisma.rankSnapshot.deleteMany({ where: { riotAccountId: riot.id } });
    await prisma.rankSnapshot.createMany({
      data: lpSnapshots.map((snapshot) => ({
        riotAccountId: riot.id,
        queueType: "Ranked Solo/Duo",
        tier: snapshot.rank.split(" ")[0],
        division: snapshot.rank.split(" ")[1],
        lp: snapshot.lp,
        wins: 71,
        losses: 62,
        capturedAt: new Date(`2026 ${snapshot.date}`),
      })),
    });

    await prisma.match.deleteMany({ where: { riotAccountId: riot.id } });
    await prisma.match.createMany({
      data: recentMatches.map((match, index) => {
        const [kills, deaths, assists] = match.kda
          .split("/")
          .map((value) => Number(value.trim()));

        return {
          riotAccountId: riot.id,
          riotMatchId: match.id,
          queueType: match.queue,
          champion: match.champion,
          role: match.role,
          result: match.result,
          kills,
          deaths,
          assists,
          csPerMin: match.csPerMin,
          damage: match.damage,
          visionScore: match.visionScore,
          lpChange: match.lpChange,
          lpChangeSource: "riot-snapshot",
          durationSec: 1800 + index * 70,
          playedAt: new Date(Date.now() - index * 1000 * 60 * 60 * 6),
        };
      }),
    });

    await prisma.championStats.deleteMany({ where: { riotAccountId: riot.id } });
    await prisma.championStats.createMany({
      data: championStats.map((stat) => ({
        riotAccountId: riot.id,
        champion: stat.champion,
        queueType: "Ranked Solo/Duo",
        season: "2026",
        games: stat.games,
        winRate: stat.winRate,
        avgKda: stat.avgKda,
        csPerMin: stat.csPerMin,
        damagePerMin: stat.damagePerMin,
      })),
    });

    await prisma.goal.deleteMany({ where: { userId: user.id } });
    await prisma.goal.createMany({
      data: goals.map((goal) => ({
        userId: user.id,
        title: goal.title,
        current: goal.current,
        targetValue: goal.target,
        unit: goal.unit,
      })),
    });

    const seededDuoService =
      seededServices.find((service) => service.slug === "duo-boost") ??
      seededServices[0];

    const order = await prisma.order.upsert({
      where: { publicId: "RP-2048" },
      update: {
        serviceId: seededDuoService.id,
        status: OrderStatus.SCHEDULED,
        currentLp: 1702,
      },
      create: {
        publicId: "RP-2048",
        userId: user.id,
        serviceId: seededDuoService.id,
        status: OrderStatus.SCHEDULED,
        linkedAccountId: riot.id,
        currentRank: "Gold II",
        targetGoal: "Platinum IV",
        role: "Mid",
        champion: "Ahri",
        startingLp: 1645,
        currentLp: 1702,
        goalLp: 1840,
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 5),
      },
    });

    await prisma.orderMilestone.deleteMany({ where: { orderId: order.id } });
    await prisma.orderMilestone.createMany({
      data: [
        {
          orderId: order.id,
          title: "Profile audit",
          detail: "Reviewed last 20 ranked games and champion pool.",
          completedAt: new Date(),
        },
        {
          orderId: order.id,
          title: "Session scheduled",
          detail: "Live duo boost block confirmed.",
          completedAt: new Date(),
        },
        {
          orderId: order.id,
          title: "Progress tracking",
          detail: "LP movement and order progress will update after each sync.",
        },
      ],
    });

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { amountCents: 6900, status: PaymentStatus.PAID },
      create: {
        orderId: order.id,
        amountCents: 6900,
        status: PaymentStatus.PAID,
        stripeCheckoutSession: "cs_seed_riftprogress",
      },
    });

    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          type: NotificationType.SESSION,
          title: "Boost reminder",
          body: "Your duo boost block starts at 19:30.",
        },
        {
          userId: user.id,
          type: NotificationType.RANK_CHANGE,
          title: "Rank change detected",
          body: "Solo/Duo updated to Gold II 62 LP.",
        },
      ],
    });
  } else {
    await prisma.order.deleteMany({ where: { publicId: "RP-2048" } });
    await prisma.user.deleteMany({ where: { email: "player@riftprogress.gg" } });
  }

  await prisma.adminAuditLog.create({
    data: {
      actorId: admin.id,
      action: "seed.catalog",
      target: "riftprogress.mvp",
      metadata: { safeRiotLinking: true, noPasswordSharing: true },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import type {
  ChampionStat,
  Goal,
  Match,
  RankRecord,
  RankSnapshot,
  RiotAccount,
  RolePerformance,
  Service,
} from "@/lib/types";

export const championSplash = (champion: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion}_0.jpg`;

export const riotAccount: RiotAccount = {
  puuid: "starter-puuid-euw1-91f4",
  gameName: "NovaFlux",
  tagLine: "EUW",
  region: "Europe West",
  platform: "EUW1",
  summonerId: "encrypted-starter-summoner-id",
  summonerIcon:
    "https://ddragon.leagueoflegends.com/cdn/15.24.1/img/profileicon/588.png",
  summonerLevel: 413,
  linkedAt: "2026-07-01T11:30:00.000Z",
};

export const rankRecords: RankRecord[] = [
  {
    queue: "Ranked Solo/Duo",
    tier: "Gold",
    division: "II",
    lp: 62,
    wins: 71,
    losses: 62,
  },
  {
    queue: "Ranked Flex",
    tier: "Platinum",
    division: "IV",
    lp: 18,
    wins: 28,
    losses: 22,
  },
];

export const lpSnapshots: RankSnapshot[] = [
  { date: "Jun 03", label: "Start", lp: 1442, rank: "Silver I 82 LP" },
  { date: "Jun 08", label: "+42", lp: 1484, rank: "Gold IV 24 LP" },
  { date: "Jun 13", label: "+17", lp: 1501, rank: "Gold IV 41 LP" },
  { date: "Jun 18", label: "+44", lp: 1545, rank: "Gold III 5 LP" },
  { date: "Jun 23", label: "+71", lp: 1616, rank: "Gold III 76 LP" },
  { date: "Jun 28", label: "+29", lp: 1645, rank: "Gold II 5 LP" },
  { date: "Jul 02", label: "+57", lp: 1702, rank: "Gold II 62 LP" },
];

export const recentMatches: Match[] = [
  {
    id: "EUW1-721",
    champion: "Ahri",
    role: "Mid",
    queue: "Ranked Solo/Duo",
    result: "Win",
    kda: "9 / 2 / 11",
    csPerMin: 7.8,
    damage: 27400,
    visionScore: 28,
    lpChange: 23,
    duration: "29:14",
    playedAt: "2h ago",
    image: championSplash("Ahri"),
  },
  {
    id: "EUW1-720",
    champion: "LeeSin",
    role: "Jungle",
    queue: "Ranked Solo/Duo",
    result: "Loss",
    kda: "4 / 6 / 7",
    csPerMin: 5.9,
    damage: 18120,
    visionScore: 31,
    lpChange: -18,
    duration: "33:02",
    playedAt: "5h ago",
    image: championSplash("LeeSin"),
  },
  {
    id: "EUW1-719",
    champion: "Jinx",
    role: "ADC",
    queue: "Ranked Solo/Duo",
    result: "Win",
    kda: "13 / 4 / 8",
    csPerMin: 8.6,
    damage: 34200,
    visionScore: 19,
    lpChange: 22,
    duration: "31:48",
    playedAt: "Yesterday",
    image: championSplash("Jinx"),
  },
  {
    id: "EUW1-718",
    champion: "Thresh",
    role: "Support",
    queue: "Ranked Flex",
    result: "Win",
    kda: "2 / 3 / 19",
    csPerMin: 1.2,
    damage: 10900,
    visionScore: 72,
    lpChange: 19,
    duration: "27:41",
    playedAt: "Yesterday",
    image: championSplash("Thresh"),
  },
];

export const championStats: ChampionStat[] = [
  {
    champion: "Ahri",
    games: 27,
    winRate: 63,
    avgKda: 4.1,
    csPerMin: 7.4,
    damagePerMin: 812,
    image: championSplash("Ahri"),
  },
  {
    champion: "Jinx",
    games: 19,
    winRate: 58,
    avgKda: 3.6,
    csPerMin: 8.1,
    damagePerMin: 921,
    image: championSplash("Jinx"),
  },
  {
    champion: "Orianna",
    games: 14,
    winRate: 57,
    avgKda: 3.9,
    csPerMin: 7.9,
    damagePerMin: 784,
    image: championSplash("Orianna"),
  },
];

export const rolePerformance: RolePerformance[] = [
  { role: "Top", games: 8, winRate: 50, trend: "flat" },
  { role: "Jungle", games: 22, winRate: 46, trend: "down" },
  { role: "Mid", games: 49, winRate: 61, trend: "up" },
  { role: "ADC", games: 31, winRate: 58, trend: "up" },
  { role: "Support", games: 13, winRate: 54, trend: "flat" },
];

export const goals: Goal[] = [
  { title: "Target rank", current: 62, target: 200, unit: "LP to Platinum IV" },
  { title: "Last 20 win rate", current: 60, target: 65, unit: "%" },
  { title: "Champion pool", current: 3, target: 4, unit: "ranked-ready picks" },
  { title: "CS/min target", current: 7.8, target: 8.3, unit: "average" },
];

export const timeline = [
  "Gold II 5 LP -> Gold II 62 LP",
  "Three-game win streak on Ahri",
  "Promotion achieved from Gold III",
  "Weakest role flagged: Jungle pathing",
];

export const services: Service[] = [
  {
    id: "division-boost",
    category: "Elo Boosting",
    title: "Division boost",
    description:
      "A ranked climb from the synced account rank or a manually selected current rank to a higher target division and LP.",
    basePrice: 7,
    sessionLength: "Estimated 1-3 days",
    tags: ["Synced rank", "Higher target only", "LP priced"],
    includes: ["Synced or manual rank", "Target rank validation", "Adjustable LP pricing"],
    image: championSplash("Irelia"),
  },
  {
    id: "net-wins-boost",
    category: "Win Boost",
    title: "Net wins boost",
    description:
      "A guaranteed number of wins above losses. Losses do not reduce the paid win target.",
    basePrice: 2,
    sessionLength: "Per win bundle",
    tags: ["Guaranteed net wins", "Losses ignored", "Role add-on"],
    includes: ["Net win counter", "Role selection add-on", "Progress tracking"],
    image: championSplash("Jinx"),
  },
  {
    id: "placement-boost",
    category: "Placement Boost",
    title: "Placement games boost",
    description:
      "A placement order for up to five League placement games, priced per selected game.",
    basePrice: 2,
    sessionLength: "1-5 games",
    tags: ["5 game max", "Per game", "Order updates"],
    includes: ["Placement baseline", "Game-by-game updates", "Final report"],
    image: championSplash("Akali"),
  },
  {
    id: "duo-boost",
    category: "Duo Boosting",
    title: "Duo boost",
    description:
      "A self-play boost where the customer queues with the booster, with a selectable 50-100% duo premium.",
    basePrice: 12,
    sessionLength: "Per duo block",
    tags: ["Self-play", "50-100% premium", "No password sharing"],
    includes: ["Queue coordination", "Duo premium control", "LP tracking"],
    image: championSplash("Lucian"),
  },
  {
    id: "pay-per-game",
    category: "Pay Per Game",
    title: "Pay per game",
    description:
      "A lower-cost game bundle where each played game counts, win or loss, with no net-win guarantee.",
    basePrice: 1.3,
    sessionLength: "Per game bundle",
    tags: ["No guarantee", "35% cheaper", "Per game"],
    includes: ["Game counter", "Role selection add-on", "Lower per-game rate"],
    image: championSplash("Nidalee"),
  },
];

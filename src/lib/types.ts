export type UserRole = "user" | "coach" | "admin" | "superadmin";

export type LaneRole = "Top" | "Jungle" | "Mid" | "ADC" | "Support";

export type QueueType = "Ranked Solo/Duo" | "Ranked Flex";

export type OrderStatus =
  | "Pending"
  | "Coach Assigned"
  | "Scheduled"
  | "In Progress"
  | "Completed"
  | "Disputed"
  | "Refunded";

export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  platform: string;
  summonerId: string;
  summonerIcon: string;
  summonerLevel: number;
  linkedAt: string;
};

export type RankRecord = {
  queue: QueueType;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
};

export type RankSnapshot = {
  date: string;
  label: string;
  lp: number;
  rank: string;
};

export type Match = {
  id: string;
  champion: string;
  role: LaneRole;
  queue: string;
  result: "Win" | "Loss";
  kda: string;
  csPerMin: number;
  damage: number;
  visionScore: number;
  lpChange: number | null;
  lpChangeSource?: "exact" | "estimated";
  duration: string;
  playedAt: string;
  image: string;
};

export type ChampionStat = {
  champion: string;
  games: number;
  winRate: number;
  avgKda: number;
  csPerMin: number;
  damagePerMin: number;
  image: string;
};

export type RolePerformance = {
  role: LaneRole;
  games: number;
  winRate: number;
  trend: "up" | "flat" | "down";
};

export type Goal = {
  title: string;
  current: number;
  target: number;
  unit: string;
};

export type Service = {
  id: string;
  category: string;
  title: string;
  description: string;
  basePrice: number;
  sessionLength: string;
  tags: string[];
  includes: string[];
  image: string;
};

export type Coach = {
  id: string;
  name: string;
  region: string;
  peakRank: string;
  roles: LaneRole[];
  champions: string[];
  languages: string[];
  price: number;
  rating: number;
  reviews: number;
  availability: string;
  verified: boolean;
  image: string;
};

export type OrderMilestone = {
  title: string;
  detail: string;
  complete: boolean;
  date: string;
};

export type Order = {
  id: string;
  service: string;
  status: OrderStatus;
  coach: string;
  linkedAccount: string;
  startedAt: string;
  scheduledFor: string;
  startLp: number;
  currentLp: number;
  goalLp: number;
  milestones: OrderMilestone[];
};

export type Notification = {
  id: string;
  title: string;
  detail: string;
  time: string;
};

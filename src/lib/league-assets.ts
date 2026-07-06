const DDRAGON_VERSION = "16.13.1";
const RANK_EMBLEM_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem";

const CHAMPION_KEY_OVERRIDES: Record<string, string> = {
  AurelionSol: "AurelionSol",
  Chogath: "Chogath",
  DrMundo: "DrMundo",
  FiddleSticks: "Fiddlesticks",
  Fiddlesticks: "Fiddlesticks",
  JarvanIV: "JarvanIV",
  Kaisa: "Kaisa",
  Khazix: "Khazix",
  KogMaw: "KogMaw",
  KSante: "KSante",
  LeBlanc: "Leblanc",
  LeeSin: "LeeSin",
  MasterYi: "MasterYi",
  MissFortune: "MissFortune",
  MonkeyKing: "MonkeyKing",
  Nunu: "Nunu",
  NunuWillump: "Nunu",
  RekSai: "RekSai",
  Renata: "Renata",
  TahmKench: "TahmKench",
  TwistedFate: "TwistedFate",
  Velkoz: "Velkoz",
  XinZhao: "XinZhao",
};

export function championIconUrl(champion: string) {
  const key = championKey(champion);

  return `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${key}.png`;
}

export function rankEmblemUrl(tier: string) {
  const key = tier
    .replace(/\s+/g, "")
    .replace(/^grandmaster$/i, "grandmaster")
    .toLowerCase();

  return `${RANK_EMBLEM_BASE}/emblem-${key}.png`;
}

export function highQualitySplashUrl(champion: string, skinId = 0) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion}_${skinId}.jpg`;
}

function championKey(champion: string) {
  const stripped = champion.replace(/[^A-Za-z0-9]/g, "");

  return CHAMPION_KEY_OVERRIDES[stripped] ?? stripped;
}

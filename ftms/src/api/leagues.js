// Competition catalogue. IDs and slugs come from ESPN's public soccer API.
// `p` is the display priority (lower shows first). `top` marks the competitions
// shown by default on Home and in the "Top" filter on Scores.

const L = (slug, id, name, short, region, country, p, logoId, extra = {}) => ({
  slug,
  id: String(id),
  name,
  short,
  region,
  country,
  p,
  logo: logoId ? `https://a.espncdn.com/i/leaguelogos/soccer/500/${logoId}.png` : null,
  logoDark: logoId && extra.dark !== false ? `https://a.espncdn.com/i/leaguelogos/soccer/500-dark/${logoId}.png` : null,
  top: Boolean(extra.top),
  cup: Boolean(extra.cup),
  national: Boolean(extra.national),
  women: Boolean(extra.women),
});

export const LEAGUES = [
  // International — clubs
  L('uefa.champions', 775, 'UEFA Champions League', 'Champions League', 'International', 'Europe', 1, 2, { top: true, cup: true }),
  L('uefa.europa', 776, 'UEFA Europa League', 'Europa League', 'International', 'Europe', 8, 2310, { top: true, cup: true }),
  L('uefa.europa.conf', 20296, 'UEFA Conference League', 'Conference League', 'International', 'Europe', 12, 20296, { cup: true }),
  L('conmebol.libertadores', 783, 'CONMEBOL Libertadores', 'Libertadores', 'International', 'South America', 14, 58, { cup: true }),
  L('conmebol.sudamericana', 5454, 'CONMEBOL Sudamericana', 'Sudamericana', 'International', 'South America', 30, 1208, { cup: true }),
  L('concacaf.champions', 5699, 'Concacaf Champions Cup', 'Concacaf Champions', 'International', 'North America', 32, 2298, { cup: true }),
  L('afc.champions', 3902, 'AFC Champions League Elite', 'AFC Champions League', 'International', 'Asia', 33, 2200, { cup: true }),
  L('caf.champions', 2391, 'CAF Champions League', 'CAF Champions League', 'International', 'Africa', 34, 2391, { cup: true }),
  L('fifa.cwc', 5501, 'FIFA Club World Cup', 'Club World Cup', 'International', 'World', 9, 1932, { cup: true, top: true }),

  // International — national teams
  L('fifa.world', 606, 'FIFA World Cup', 'World Cup', 'National teams', 'World', 0, 4, { top: true, cup: true, national: true }),
  L('uefa.nations', 2395, 'UEFA Nations League', 'Nations League', 'National teams', 'Europe', 10, 2395, { top: true, national: true }),
  L('fifa.worldq.uefa', 786, 'World Cup Qualifying — UEFA', 'WCQ Europe', 'National teams', 'Europe', 11, 67, { top: true, national: true }),
  L('fifa.worldq.conmebol', 787, 'World Cup Qualifying — CONMEBOL', 'WCQ South America', 'National teams', 'South America', 13, 65, { top: true, national: true }),
  L('uefa.euro', 781, 'UEFA European Championship', 'EURO', 'National teams', 'Europe', 2, 74, { top: true, cup: true, national: true }),
  L('conmebol.america', 780, 'Copa América', 'Copa América', 'National teams', 'South America', 3, 83, { top: true, cup: true, national: true }),
  L('caf.nations', 3908, 'Africa Cup of Nations', 'AFCON', 'National teams', 'Africa', 15, 76, { cup: true, national: true }),
  L('afc.asian.cup', 20219, 'AFC Asian Cup', 'Asian Cup', 'National teams', 'Asia', 16, null, { cup: true, national: true }),
  L('fifa.friendly', 3922, 'International Friendly', 'Friendlies', 'National teams', 'World', 40, 53, { national: true }),

  // England
  L('eng.1', 700, 'Premier League', 'Premier League', 'Europe', 'England', 2, 23, { top: true }),
  L('eng.2', 3914, 'EFL Championship', 'Championship', 'Europe', 'England', 20, 24),
  L('eng.3', 3915, 'EFL League One', 'League One', 'Europe', 'England', 45, 25),
  L('eng.fa', 3918, 'FA Cup', 'FA Cup', 'Europe', 'England', 18, 40, { cup: true }),
  L('eng.league_cup', 3920, 'Carabao Cup', 'Carabao Cup', 'Europe', 'England', 19, 41, { cup: true }),

  // Spain
  L('esp.1', 740, 'LALIGA', 'LALIGA', 'Europe', 'Spain', 3, 15, { top: true }),
  L('esp.2', 3921, 'LALIGA 2', 'LALIGA 2', 'Europe', 'Spain', 42, 107, { dark: false }),
  L('esp.copa_del_rey', 3951, 'Copa del Rey', 'Copa del Rey', 'Europe', 'Spain', 21, 80, { cup: true }),

  // Germany
  L('ger.1', 720, 'Bundesliga', 'Bundesliga', 'Europe', 'Germany', 4, 10, { top: true }),
  L('ger.2', 3927, '2. Bundesliga', '2. Bundesliga', 'Europe', 'Germany', 43, 97, { dark: false }),
  L('ger.dfb_pokal', 3954, 'DFB-Pokal', 'DFB-Pokal', 'Europe', 'Germany', 22, 2061, { cup: true }),

  // Italy
  L('ita.1', 730, 'Serie A', 'Serie A', 'Europe', 'Italy', 5, 12, { top: true }),
  L('ita.2', 3931, 'Serie B', 'Serie B', 'Europe', 'Italy', 44, 99, { dark: false }),
  L('ita.coppa_italia', 3956, 'Coppa Italia', 'Coppa Italia', 'Europe', 'Italy', 23, 2192, { cup: true, dark: false }),

  // France
  L('fra.1', 710, 'Ligue 1', 'Ligue 1', 'Europe', 'France', 6, 9, { top: true }),
  L('fra.2', 3926, 'Ligue 2', 'Ligue 2', 'Europe', 'France', 46, 96),
  L('fra.coupe_de_france', 3952, 'Coupe de France', 'Coupe de France', 'Europe', 'France', 24, 182, { cup: true }),

  // Rest of Europe
  L('por.1', 715, 'Liga Portugal', 'Liga Portugal', 'Europe', 'Portugal', 16, 14),
  L('ned.1', 725, 'Eredivisie', 'Eredivisie', 'Europe', 'Netherlands', 17, 11),
  L('sco.1', 735, 'Scottish Premiership', 'Premiership', 'Europe', 'Scotland', 25, 45),
  L('bel.1', 3901, 'Belgian Pro League', 'Pro League', 'Europe', 'Belgium', 26, 6),
  L('tur.1', 3946, 'Süper Lig', 'Süper Lig', 'Europe', 'Türkiye', 27, 18),
  L('aut.1', 3907, 'Austrian Bundesliga', 'Austrian Bundesliga', 'Europe', 'Austria', 47, 5),
  L('sui.1', 3944, 'Swiss Super League', 'Swiss Super League', 'Europe', 'Switzerland', 48, 17, { dark: false }),
  L('gre.1', 3955, 'Greek Super League', 'Super League', 'Europe', 'Greece', 49, 98, { dark: false }),
  L('den.1', 3913, 'Danish Superliga', 'Superliga', 'Europe', 'Denmark', 50, null),
  L('nor.1', 3960, 'Eliteserien', 'Eliteserien', 'Europe', 'Norway', 51, null),
  L('swe.1', 3945, 'Allsvenskan', 'Allsvenskan', 'Europe', 'Sweden', 52, 16, { dark: false }),
  L('rus.1', 3939, 'Russian Premier League', 'RPL', 'Europe', 'Russia', 53, 106),
  L('irl.1', 3930, 'League of Ireland Premier Division', 'LOI Premier', 'Europe', 'Ireland', 54, 116),

  // Americas
  L('usa.1', 770, 'MLS', 'MLS', 'Americas', 'USA', 7, 19, { top: true }),
  L('mex.1', 760, 'Liga MX', 'Liga MX', 'Americas', 'Mexico', 28, 22),
  L('bra.1', 630, 'Brasileirão Série A', 'Brasileirão', 'Americas', 'Brazil', 29, 85),
  L('arg.1', 745, 'Liga Profesional', 'Liga Profesional', 'Americas', 'Argentina', 31, 1),
  L('col.1', 650, 'Primera A', 'Primera A', 'Americas', 'Colombia', 55, 1543),
  L('chi.1', 640, 'Primera División', 'Primera División', 'Americas', 'Chile', 56, 86),
  L('uru.1', 680, 'Liga AUF Uruguaya', 'Liga AUF', 'Americas', 'Uruguay', 57, 1592),
  L('per.1', 670, 'Liga 1', 'Liga 1', 'Americas', 'Peru', 58, 1813),
  L('ecu.1', 660, 'LigaPro', 'LigaPro', 'Americas', 'Ecuador', 59, 1944),

  // Asia & Oceania
  L('ksa.1', 21231, 'Saudi Pro League', 'Saudi Pro League', 'Asia & Oceania', 'Saudi Arabia', 26.5, 2488, { top: true }),
  L('jpn.1', 750, 'J1 League', 'J1 League', 'Asia & Oceania', 'Japan', 60, 2199),
  L('aus.1', 3906, 'A-League Men', 'A-League', 'Asia & Oceania', 'Australia', 61, 1308),
  L('ind.1', 8316, 'Indian Super League', 'ISL', 'Asia & Oceania', 'India', 62, 2334),
  L('chn.1', 8376, 'Chinese Super League', 'CSL', 'Asia & Oceania', 'China', 63, 2350),
  L('tha.1', 8344, 'Thai League 1', 'Thai League', 'Asia & Oceania', 'Thailand', 64, 2341),
  L('idn.1', 8339, 'Indonesian Super League', 'Super League', 'Asia & Oceania', 'Indonesia', 65, 2336),
  L('mys.1', 8340, 'Malaysia Super League', 'Super League', 'Asia & Oceania', 'Malaysia', 66, 2340),

  // Africa
  L('rsa.1', 3937, 'South African Premiership', 'Premiership', 'Africa', 'South Africa', 67, null),

  // Women
  L('uefa.wchampions', 19483, "UEFA Women's Champions League", "Women's UCL", 'Women', 'Europe', 35, 2408, { cup: true, women: true }),
  L('eng.w.1', 8097, "Women's Super League", 'WSL', 'Women', 'England', 36, 2314, { women: true }),
  L('usa.nwsl', 8301, 'NWSL', 'NWSL', 'Women', 'USA', 37, 2323, { women: true }),
];

export const REGIONS = ['International', 'National teams', 'Europe', 'Americas', 'Asia & Oceania', 'Africa', 'Women'];

const BY_SLUG = new Map(LEAGUES.map((l) => [l.slug, l]));
const BY_ID = new Map(LEAGUES.map((l) => [l.id, l]));

export const leagueBySlug = (slug) => BY_SLUG.get(slug) || null;
export const leagueById = (id) => BY_ID.get(String(id)) || null;

/** Leagues the manager hub offers clubs from (league tables with real squads). */
export const MANAGER_LEAGUES = ['eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'por.1', 'ned.1', 'usa.1', 'ksa.1', 'eng.2', 'sco.1', 'tur.1', 'bra.1', 'mex.1', 'arg.1'];

/** Leagues offered in the standings widget on Home. */
export const HOME_TABLE_LEAGUES = ['eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'usa.1'];

/** Turn an ESPN season slug like "2026-27-italian-serie-a" into "Italian Serie A". */
export function nameFromSeasonSlug(slug) {
  if (!slug) return 'Other competitions';
  const cleaned = String(slug)
    .replace(/^\d{4}(-\d{2,4})?-/, '')
    .replace(/-/g, ' ')
    .trim();
  if (!cleaned) return 'Other competitions';
  return cleaned.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

export function leagueLogo(league, theme = 'dark') {
  if (!league) return null;
  if (theme === 'dark' && league.logoDark) return league.logoDark;
  return league.logo;
}

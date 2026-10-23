// Turns an ESPN lineup (position codes + formation string) into pitch rows.
// ESPN codes look like "CD-L", "RB", "DM", "CM-R", "AM", "LW", "F".

const DEPTH = {
  G: 0,
  GK: 0,
  SW: 0.9,
  CB: 1,
  CD: 1,
  'CD-L': 1,
  'CD-R': 1,
  D: 1,
  LB: 1.05,
  RB: 1.05,
  LWB: 1.6,
  RWB: 1.6,
  WB: 1.6,
  DM: 2,
  CDM: 2,
  'DM-L': 2,
  'DM-R': 2,
  M: 2.5,
  CM: 2.5,
  'CM-L': 2.5,
  'CM-R': 2.5,
  LM: 2.6,
  RM: 2.6,
  AM: 3.2,
  CAM: 3.2,
  'AM-L': 3.2,
  'AM-R': 3.2,
  LW: 3.6,
  RW: 3.6,
  LF: 3.7,
  RF: 3.7,
  SS: 3.8,
  F: 4,
  FW: 4,
  CF: 4,
  'CF-L': 4,
  'CF-R': 4,
  ST: 4,
};

const GROUP_DEPTH = { GK: 0, DEF: 1, MID: 2.5, FWD: 4 };

function depthOf(p) {
  const code = String(p.posCode || '').toUpperCase();
  if (DEPTH[code] != null) return DEPTH[code];
  return GROUP_DEPTH[p.pos] ?? 2.5;
}

function lateralOf(p) {
  const c = String(p.posCode || '').toUpperCase();
  if (/^L/.test(c)) return -2;
  if (/^R/.test(c)) return 2;
  if (/-L$/.test(c)) return -1;
  if (/-R$/.test(c)) return 1;
  return 0;
}

export function parseFormation(str) {
  const parts = String(str || '')
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return parts.length >= 2 ? parts : null;
}

/**
 * @returns {Array<Array<player>>} rows from goalkeeper to attack, each ordered left → right
 *          from the team's own perspective.
 */
export function lineupRows(starters, formation) {
  if (!starters?.length) return [];
  const sorted = [...starters].sort((a, b) => depthOf(a) - depthOf(b) || a.formationPlace - b.formationPlace);
  const gk = sorted.filter((p) => depthOf(p) === 0).slice(0, 1);
  const outfield = sorted.filter((p) => !gk.includes(p));

  let counts = parseFormation(formation);
  if (!counts || counts.reduce((s, n) => s + n, 0) !== outfield.length) {
    const byGroup = { DEF: 0, MID: 0, FWD: 0 };
    outfield.forEach((p) => {
      const d = depthOf(p);
      if (d < 1.8) byGroup.DEF += 1;
      else if (d < 3.5) byGroup.MID += 1;
      else byGroup.FWD += 1;
    });
    counts = [byGroup.DEF, byGroup.MID, byGroup.FWD].filter(Boolean);
  }

  const rows = [];
  let i = 0;
  counts.forEach((n) => {
    const row = outfield.slice(i, i + n).sort((a, b) => lateralOf(a) - lateralOf(b) || a.formationPlace - b.formationPlace);
    rows.push(row);
    i += n;
  });
  if (i < outfield.length) rows.push(outfield.slice(i));
  return gk.length ? [gk, ...rows] : rows;
}

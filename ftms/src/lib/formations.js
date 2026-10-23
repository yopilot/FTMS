// Formation templates for the lineup builder.
// x: 0 (left touchline) → 100 (right), y: 0 (own goal) → 100 (opponent goal).

const S = (id, role, group, x, y) => ({ id, role, group, x, y });

export const FORMATIONS = {
  '4-3-3': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lb', 'LB', 'DEF', 12, 26),
    S('lcb', 'CB', 'DEF', 37, 22),
    S('rcb', 'CB', 'DEF', 63, 22),
    S('rb', 'RB', 'DEF', 88, 26),
    S('lcm', 'CM', 'MID', 28, 47),
    S('cdm', 'CDM', 'MID', 50, 40),
    S('rcm', 'CM', 'MID', 72, 47),
    S('lw', 'LW', 'FWD', 16, 74),
    S('st', 'ST', 'FWD', 50, 82),
    S('rw', 'RW', 'FWD', 84, 74),
  ],
  '4-2-3-1': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lb', 'LB', 'DEF', 12, 26),
    S('lcb', 'CB', 'DEF', 37, 22),
    S('rcb', 'CB', 'DEF', 63, 22),
    S('rb', 'RB', 'DEF', 88, 26),
    S('ldm', 'CDM', 'MID', 36, 41),
    S('rdm', 'CDM', 'MID', 64, 41),
    S('lam', 'LM', 'MID', 16, 62),
    S('cam', 'CAM', 'MID', 50, 62),
    S('ram', 'RM', 'MID', 84, 62),
    S('st', 'ST', 'FWD', 50, 83),
  ],
  '4-4-2': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lb', 'LB', 'DEF', 12, 26),
    S('lcb', 'CB', 'DEF', 37, 22),
    S('rcb', 'CB', 'DEF', 63, 22),
    S('rb', 'RB', 'DEF', 88, 26),
    S('lm', 'LM', 'MID', 13, 52),
    S('lcm', 'CM', 'MID', 38, 48),
    S('rcm', 'CM', 'MID', 62, 48),
    S('rm', 'RM', 'MID', 87, 52),
    S('lst', 'ST', 'FWD', 38, 80),
    S('rst', 'ST', 'FWD', 62, 80),
  ],
  '4-1-4-1': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lb', 'LB', 'DEF', 12, 25),
    S('lcb', 'CB', 'DEF', 37, 21),
    S('rcb', 'CB', 'DEF', 63, 21),
    S('rb', 'RB', 'DEF', 88, 25),
    S('cdm', 'CDM', 'MID', 50, 38),
    S('lm', 'LM', 'MID', 13, 58),
    S('lcm', 'CM', 'MID', 37, 56),
    S('rcm', 'CM', 'MID', 63, 56),
    S('rm', 'RM', 'MID', 87, 58),
    S('st', 'ST', 'FWD', 50, 82),
  ],
  '3-5-2': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lcb', 'CB', 'DEF', 26, 23),
    S('cb', 'CB', 'DEF', 50, 20),
    S('rcb', 'CB', 'DEF', 74, 23),
    S('lwb', 'LWB', 'DEF', 10, 50),
    S('lcm', 'CM', 'MID', 32, 50),
    S('cdm', 'CDM', 'MID', 50, 40),
    S('rcm', 'CM', 'MID', 68, 50),
    S('rwb', 'RWB', 'DEF', 90, 50),
    S('lst', 'ST', 'FWD', 38, 80),
    S('rst', 'ST', 'FWD', 62, 80),
  ],
  '3-4-3': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lcb', 'CB', 'DEF', 26, 23),
    S('cb', 'CB', 'DEF', 50, 20),
    S('rcb', 'CB', 'DEF', 74, 23),
    S('lm', 'LM', 'MID', 12, 50),
    S('lcm', 'CM', 'MID', 38, 46),
    S('rcm', 'CM', 'MID', 62, 46),
    S('rm', 'RM', 'MID', 88, 50),
    S('lw', 'LW', 'FWD', 18, 76),
    S('st', 'ST', 'FWD', 50, 83),
    S('rw', 'RW', 'FWD', 82, 76),
  ],
  '5-3-2': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lwb', 'LWB', 'DEF', 9, 34),
    S('lcb', 'CB', 'DEF', 30, 22),
    S('cb', 'CB', 'DEF', 50, 19),
    S('rcb', 'CB', 'DEF', 70, 22),
    S('rwb', 'RWB', 'DEF', 91, 34),
    S('lcm', 'CM', 'MID', 30, 50),
    S('cm', 'CM', 'MID', 50, 46),
    S('rcm', 'CM', 'MID', 70, 50),
    S('lst', 'ST', 'FWD', 38, 79),
    S('rst', 'ST', 'FWD', 62, 79),
  ],
  '4-3-1-2': [
    S('gk', 'GK', 'GK', 50, 6),
    S('lb', 'LB', 'DEF', 12, 26),
    S('lcb', 'CB', 'DEF', 37, 22),
    S('rcb', 'CB', 'DEF', 63, 22),
    S('rb', 'RB', 'DEF', 88, 26),
    S('lcm', 'CM', 'MID', 26, 46),
    S('cdm', 'CDM', 'MID', 50, 40),
    S('rcm', 'CM', 'MID', 74, 46),
    S('cam', 'CAM', 'MID', 50, 63),
    S('lst', 'ST', 'FWD', 38, 82),
    S('rst', 'ST', 'FWD', 62, 82),
  ],
};

export const FORMATION_IDS = Object.keys(FORMATIONS);

const GROUP_INDEX = { GK: 0, DEF: 1, MID: 2, FWD: 3 };

/** How well a player of `pos` suits a slot of `group` (0..1). */
export function positionFit(pos, group) {
  if (pos === group) return 1;
  if (pos === 'GK' || group === 'GK') return 0.35;
  const d = Math.abs(GROUP_INDEX[pos] - GROUP_INDEX[group]);
  return d === 1 ? 0.88 : 0.72;
}

export const effective = (player, slot) => (player ? Math.round((player.ovr || 50) * positionFit(player.pos, slot.group)) : 0);

const UNAVAILABLE = new Set(['injured', 'suspended', 'rested', 'unavailable']);
export const isAvailable = (p) => !UNAVAILABLE.has(p.status);

/**
 * Best XI for a formation, plus a bench.
 * @returns {{ lineup: Record<slotId, playerId>, bench: string[] }}
 */
export function autoPick(players, formationId, benchSize = 9) {
  const slots = FORMATIONS[formationId] || FORMATIONS['4-3-3'];
  const pool = players.filter(isAvailable).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
  const used = new Set();
  const lineup = {};

  // Pass 1: natural positions, strongest first
  ['GK', 'DEF', 'MID', 'FWD'].forEach((group) => {
    const groupSlots = slots.filter((s) => s.group === group);
    const candidates = pool.filter((p) => p.pos === group && !used.has(p.id));
    groupSlots.forEach((slot, i) => {
      const p = candidates[i];
      if (p) {
        lineup[slot.id] = p.id;
        used.add(p.id);
      }
    });
  });

  // Pass 2: fill gaps with the best effective rating
  slots
    .filter((s) => !lineup[s.id])
    .forEach((slot) => {
      const best = pool.filter((p) => !used.has(p.id)).sort((a, b) => effective(b, slot) - effective(a, slot))[0];
      if (best) {
        lineup[slot.id] = best.id;
        used.add(best.id);
      }
    });

  // Bench: a back-up keeper first, then the best of the rest
  const rest = pool.filter((p) => !used.has(p.id));
  const bench = [];
  const keeper = rest.find((p) => p.pos === 'GK');
  if (keeper) bench.push(keeper.id);
  rest.filter((p) => p !== keeper).forEach((p) => {
    if (bench.length < benchSize) bench.push(p.id);
  });

  return { lineup, bench };
}

/**
 * When the formation changes, keep players in the most similar slots.
 */
export function remapLineup(lineup, fromId, toId) {
  const from = FORMATIONS[fromId] || [];
  const to = FORMATIONS[toId] || [];
  const placed = from.filter((s) => lineup[s.id]).map((s) => ({ ...s, pid: lineup[s.id] }));
  const next = {};
  const taken = new Set();
  // Same slot id first, then nearest slot of the same group, then nearest overall.
  to.forEach((slot) => {
    const same = placed.find((p) => p.id === slot.id && !taken.has(p.pid));
    if (same) {
      next[slot.id] = same.pid;
      taken.add(same.pid);
    }
  });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  [true, false].forEach((sameGroup) => {
    to.filter((slot) => !next[slot.id]).forEach((slot) => {
      const candidates = placed.filter((p) => !taken.has(p.pid) && (!sameGroup || p.group === slot.group)).sort((a, b) => dist(a, slot) - dist(b, slot));
      if (candidates[0]) {
        next[slot.id] = candidates[0].pid;
        taken.add(candidates[0].pid);
      }
    });
  });
  const leftovers = placed.filter((p) => !taken.has(p.pid)).map((p) => p.pid);
  return { lineup: next, leftovers };
}

/** Team strength numbers from a lineup. */
export function teamStrength(lineup, formationId, playersById) {
  const slots = FORMATIONS[formationId] || [];
  const filled = slots.map((s) => ({ slot: s, p: playersById.get(lineup[s.id]) })).filter((x) => x.p);
  if (!filled.length) return null;
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((t, x) => t + x, 0) / arr.length) : 0);
  const eff = (x) => effective(x.p, x.slot);
  const byGroup = (g) => filled.filter((x) => x.slot.group === g).map(eff);
  const gk = byGroup('GK');
  const def = byGroup('DEF');
  const mid = byGroup('MID');
  const fwd = byGroup('FWD');
  const natural = filled.filter((x) => x.p.pos === x.slot.group).length;
  return {
    overall: avg(filled.map(eff)),
    attack: avg(fwd.length ? [...fwd, ...fwd, ...mid] : mid),
    midfield: avg(mid.length ? mid : [...def, ...fwd]),
    defence: avg([...def, ...def, ...def, ...gk]),
    fit: Math.round((natural / slots.length) * 100),
    filled: filled.length,
    avgAge: filled.some((x) => x.p.age) ? (filled.reduce((t, x) => t + (x.p.age || 0), 0) / filled.filter((x) => x.p.age).length).toFixed(1) : null,
  };
}

/* ---------- Tactics ---------- */

export const TACTIC_SLIDERS = [
  { key: 'mentality', label: 'Mentality', low: 'Defensive', high: 'Attacking' },
  { key: 'pressing', label: 'Pressing', low: 'Stand off', high: 'Press high' },
  { key: 'tempo', label: 'Tempo', low: 'Patient', high: 'Fast' },
  { key: 'width', label: 'Width', low: 'Narrow', high: 'Wide' },
  { key: 'line', label: 'Defensive line', low: 'Deep', high: 'High' },
  { key: 'passing', label: 'Passing', low: 'Short', high: 'Direct' },
];

export const TACTIC_PRESETS = {
  Balanced: { mentality: 50, pressing: 50, tempo: 50, width: 50, line: 50, passing: 50 },
  Gegenpress: { mentality: 68, pressing: 90, tempo: 82, width: 55, line: 78, passing: 55 },
  'Tiki-taka': { mentality: 62, pressing: 72, tempo: 42, width: 58, line: 70, passing: 12 },
  'Counter-attack': { mentality: 36, pressing: 35, tempo: 86, width: 62, line: 30, passing: 82 },
  'Wing play': { mentality: 60, pressing: 55, tempo: 62, width: 92, line: 55, passing: 60 },
  'Park the bus': { mentality: 10, pressing: 18, tempo: 28, width: 28, line: 8, passing: 72 },
};

export function matchPreset(t) {
  if (!t) return 'Balanced';
  for (const [name, p] of Object.entries(TACTIC_PRESETS)) {
    if (Object.keys(p).every((k) => Math.abs((t[k] ?? 50) - p[k]) <= 3)) return name;
  }
  return 'Custom';
}

/** A few plain-language notes about how the tactic suits the selected XI. */
export function tacticNotes(t, strength, playersInXI) {
  const notes = [];
  if (!t || !strength) return notes;
  const age = Number(strength.avgAge);
  const defenders = playersInXI.filter((p) => p.pos === 'DEF');
  const defAge = defenders.length ? defenders.reduce((s, p) => s + (p.age || 0), 0) / defenders.length : 0;
  if (t.pressing >= 75 && age >= 29) notes.push({ tone: 'warn', text: `A high press is demanding and your XI averages ${age} years. Expect legs to tire late on.` });
  if (t.line >= 70 && defAge >= 30) notes.push({ tone: 'warn', text: `Your back line averages ${defAge.toFixed(0)} years. A high line can be exposed by pace in behind.` });
  if (t.mentality >= 70 && strength.defence < strength.attack - 6) notes.push({ tone: 'warn', text: 'Very attacking with a weaker defence than attack. Consider a holding midfielder.' });
  if (t.mentality <= 25 && strength.attack >= strength.defence + 5) notes.push({ tone: 'info', text: 'Your attack is your strength, yet the plan is very defensive. You may be leaving goals out there.' });
  if (t.width >= 80 && !playersInXI.some((p) => p.pos === 'FWD')) notes.push({ tone: 'info', text: 'Wide play works best with a forward attacking crosses. None is in the XI.' });
  if (strength.fit < 82) notes.push({ tone: 'warn', text: `${100 - strength.fit}% of the XI is playing out of position, which lowers their effective rating.` });
  if (!notes.length) notes.push({ tone: 'good', text: 'The plan suits this XI. No obvious weak spots.' });
  return notes;
}

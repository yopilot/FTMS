// Team generation for the custom club (SRS FR-020 – FR-026).
// N teams of exactly T players. Anyone beyond N × T is an "extra" for the
// manager to place on a team or keep on the bench.

export const TEAM_PRESETS = [
  { name: 'Green', color: '#16a34a' },
  { name: 'White', color: '#e5e7eb' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Gold', color: '#d97706' },
  { name: 'Purple', color: '#7e22ce' },
];

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function validateSplit(count, n, t) {
  if (n < 2) return 'Choose at least 2 teams.';
  if (t < 1) return 'Each team needs at least 1 player.';
  if (count < n * t) return `${n} teams of ${t} need at least ${n * t} players. You have selected ${count}.`;
  return null;
}

/**
 * @param {Array<string|number>} ids  selected player ids (squad and guests)
 * @param {number} n  number of teams
 * @param {number} t  players per team
 * @param {'random'|'balanced'} mode
 * @param {(id) => number} ovrOf  rating lookup, used for balanced mode
 * @param {Array} existing  keep names/colours from the current teams
 */
export function generateTeams(ids, n, t, mode = 'random', ovrOf = () => 50, existing = []) {
  const picked = shuffle(ids);
  const playing = picked.slice(0, n * t);
  const extras = picked.slice(n * t);
  const teams = Array.from({ length: n }, (_, i) => ({
    name: existing[i]?.name || `Team ${TEAM_PRESETS[i % TEAM_PRESETS.length].name}`,
    color: existing[i]?.color || TEAM_PRESETS[i % TEAM_PRESETS.length].color,
    playerIds: [],
  }));

  if (mode === 'balanced') {
    // Snake draft by rating (with a little jitter so re-rolls differ)
    const ranked = [...playing].sort((a, b) => ovrOf(b) + Math.random() * 3 - (ovrOf(a) + Math.random() * 3));
    let dir = 1;
    let idx = 0;
    ranked.forEach((id) => {
      teams[idx].playerIds.push(id);
      idx += dir;
      if (idx === n || idx < 0) {
        dir *= -1;
        idx += dir;
      }
    });
  } else {
    playing.forEach((id, i) => teams[i % n].playerIds.push(id));
  }
  return { teams, extras };
}

export function teamAverage(team, ovrOf) {
  if (!team.playerIds.length) return 0;
  return Math.round(team.playerIds.reduce((s, id) => s + ovrOf(id), 0) / team.playerIds.length);
}

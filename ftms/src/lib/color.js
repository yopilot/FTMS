// Team colour helpers. ESPN gives hex strings without '#', sometimes malformed.

export function normalizeHex(hex, fallback = '6b7280') {
  if (!hex) return `#${fallback}`;
  const clean = String(hex).replace(/[^0-9a-f]/gi, '');
  if (clean.length === 6) return `#${clean}`;
  if (clean.length === 3) return `#${clean.split('').map((c) => c + c).join('')}`;
  return `#${fallback}`;
}

function luminance(hex) {
  const h = normalizeHex(hex).slice(1);
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Black or white text for a background colour. */
export function readableOn(hex) {
  return luminance(hex) > 0.45 ? '#0b0c0e' : '#ffffff';
}

function rgb(hex) {
  const h = normalizeHex(hex).slice(1);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function distance(a, b) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  // "redmean" approximation of perceived colour difference
  const rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}

/**
 * Two kit colours that can be told apart: if home and away clash, the away
 * side switches to its alternate colour, then to white/charcoal.
 */
export function distinctKits(home, away, theme = 'dark') {
  const h = visibleTeamColor(home?.color, home?.altColor, theme);
  const candidates = [away?.color, away?.altColor].filter(Boolean).map((c) => normalizeHex(c));
  candidates.push(theme === 'dark' ? '#f2f3f5' : '#1f2937');
  const a = candidates.find((c) => distance(c, h) > 160 && luminance(c) > 0.02) || candidates[candidates.length - 1];
  return { home: h, away: a };
}

/**
 * Pick a team colour that stays visible on the current theme background.
 * Very dark colours on dark mode (or very light ones on light mode) fall back
 * to the alternate colour, then to a neutral.
 */
export function visibleTeamColor(primary, alternate, theme = 'dark') {
  const candidates = [primary, alternate].filter(Boolean).map((c) => normalizeHex(c));
  for (const c of candidates) {
    const l = luminance(c);
    if (theme === 'dark' && l > 0.04 && l < 0.92) return c;
    if (theme === 'light' && l < 0.82) return c;
  }
  return theme === 'dark' ? '#9ca3af' : '#4b5563';
}

import { memo } from 'react';
import { motion } from 'motion/react';

/**
 * Lightweight SVG radar chart.
 * axes: [{ label, value (0-100), display? }]
 */
function Radar({ axes, size = 260, color = 'var(--accent)', compare, compareColor = 'var(--info)' }) {
  const n = axes.length;
  if (n < 3) return null;
  const pad = 58;
  const r = size / 2 - pad;
  const cx = size / 2;
  const cy = size / 2;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, v) => {
    const a = angle(i);
    const d = (Math.max(0, Math.min(100, v)) / 100) * r;
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d];
  };
  const poly = (vals) => vals.map((v, i) => point(i, v).join(',')).join(' ');
  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: 'block', margin: '0 auto', overflow: 'visible' }} role="img" aria-label={axes.map((a) => `${a.label} ${Math.round(a.value)}`).join(', ')}>
      {rings.map((ring) => (
        <polygon key={ring} points={poly(axes.map(() => ring))} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}
      {compare && (
        <motion.polygon
          points={poly(compare)}
          fill={compareColor}
          fillOpacity="0.12"
          stroke={compareColor}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
      <motion.polygon
        points={poly(axes.map((a) => a.value))}
        fill={color}
        fillOpacity="0.22"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {axes.map((a, i) => {
        const [x, y] = point(i, a.value);
        return <circle key={`d${i}`} cx={x} cy={y} r="3" fill={color} />;
      })}
      {axes.map((a, i) => {
        const a2 = angle(i);
        const x = cx + Math.cos(a2) * (r + 16);
        const y = cy + Math.sin(a2) * (r + 14) + (Math.sin(a2) > 0.3 ? 8 : Math.sin(a2) < -0.3 ? -6 : 0);
        const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end';
        return (
          <g key={`l${i}`}>
            <text x={x} y={y - 2} textAnchor={anchor} fontSize="11" fontWeight="600" fill="var(--text-2)">
              {a.label}
            </text>
            <text x={x} y={y + 12} textAnchor={anchor} fontSize="12" fontWeight="800" fill="var(--text)">
              {a.display ?? Math.round(a.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default memo(Radar);

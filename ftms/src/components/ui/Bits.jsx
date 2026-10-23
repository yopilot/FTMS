// Small display components used across many screens.

import { memo } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { ratingClass, tierClass } from '../../lib/ratings';

export function LiveDot({ className = '' }) {
  return <span className={`live-dot ${className}`} aria-hidden="true" />;
}

export const RatingBadge = memo(function RatingBadge({ value, size }) {
  if (value == null) return null;
  return (
    <span className={`rating ${ratingClass(value)}`} style={size === 'sm' ? { minWidth: 28, height: 18, fontSize: 11 } : undefined} title="FTMS match rating (computed from match stats)">
      {Number(value).toFixed(1)}
    </span>
  );
});

export const OvrBadge = memo(function OvrBadge({ value, title = 'FTMS overall rating' }) {
  if (value == null) return null;
  return (
    <span className={`ovr ${tierClass(value)}`} title={title}>
      {value}
    </span>
  );
});

export function FormGuide({ form = '', size, max = 5 }) {
  const letters = String(form).toUpperCase().replace(/[^WDL]/g, '').slice(-max).split('');
  if (!letters.length) return <span className="subtle">—</span>;
  return (
    <span className={`form-guide ${size === 'sm' ? 'sm' : ''}`} aria-label={`Form: ${letters.join(' ')}`}>
      {letters.map((l, i) => (
        <span key={i} className={`form-pip ${l}`}>
          {l}
        </span>
      ))}
    </span>
  );
}

export function PosBadge({ pos }) {
  if (!pos) return null;
  return <span className={`pos-badge pos-${pos}`}>{pos}</span>;
}

export function StarButton({ on, onToggle, label }) {
  return (
    <button
      type="button"
      className={`star-btn ${on ? 'is-on' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={on}
      aria-label={on ? `Unfollow ${label}` : `Follow ${label}`}
      title={on ? 'Following' : 'Follow'}
    >
      <motion.span key={on ? 'on' : 'off'} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }} style={{ display: 'grid' }}>
        <Star size={16} fill={on ? 'currentColor' : 'none'} />
      </motion.span>
    </button>
  );
}

export function FollowButton({ on, onToggle, label }) {
  return (
    <button type="button" className={`btn ${on ? 'btn-secondary' : 'btn-primary'}`} onClick={onToggle} aria-pressed={on}>
      <Star size={15} fill={on ? 'currentColor' : 'none'} />
      {on ? 'Following' : `Follow${label ? ` ${label}` : ''}`}
    </button>
  );
}

export function StatCompareRow({ label, home, away, unit = '', homeColor, awayColor }) {
  const total = home + away;
  const hp = total ? (home / total) * 100 : 50;
  const ap = total ? (away / total) * 100 : 50;
  const lead = home === away ? null : home > away ? 'home' : 'away';
  return (
    <div className="stat-row">
      <span className={`stat-val home ${lead === 'away' ? 'trail' : 'lead'}`}>
        {home}
        {unit}
      </span>
      <div className="stat-center">
        <span className="stat-label">{label}</span>
        <div className="stat-bars">
          <div className="stat-bar home">
            <motion.div
              className="stat-bar-fill"
              style={{ background: lead === 'away' ? 'var(--border-strong)' : homeColor || 'var(--accent)' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${hp}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="stat-bar">
            <motion.div
              className="stat-bar-fill"
              style={{ background: lead === 'home' ? 'var(--border-strong)' : awayColor || 'var(--info)' }}
              initial={{ width: 0 }}
              whileInView={{ width: `${ap}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
      <span className={`stat-val away ${lead === 'home' ? 'trail' : 'lead'}`}>
        {away}
        {unit}
      </span>
    </div>
  );
}

/** Subtle entrance for page sections. */
export function Reveal({ children, delay = 0, className = '', as = 'div', ...rest }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp className={className} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }} {...rest}>
      {children}
    </Comp>
  );
}

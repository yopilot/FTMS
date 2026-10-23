import { useId } from 'react';
import { motion } from 'motion/react';

/**
 * Underlined tabs with a sliding indicator.
 * items: [{ value, label, badge? }]
 */
export function Tabs({ items, value, onChange, className = '', ariaLabel }) {
  const id = useId();
  return (
    <div className={`tabs ${className}`} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`tab ${active ? 'is-active' : ''}`}
            onClick={() => onChange(item.value)}
          >
            <span className="row gap-2">
              {item.label}
              {item.badge != null && item.badge !== 0 && <span className="chip-count">{item.badge}</span>}
            </span>
            {active && <motion.span layoutId={`tab-${id}`} className="tab-indicator" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
          </button>
        );
      })}
    </div>
  );
}

/** Pill segmented control with a sliding thumb. */
export function Segmented({ items, value, onChange, className = '', ariaLabel, size }) {
  const id = useId();
  return (
    <div className={`segmented ${className}`} role="radiogroup" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={`segment ${active ? 'is-active' : ''}`}
            style={size === 'sm' ? { height: 26, padding: '0 10px', fontSize: 12 } : undefined}
            onClick={() => onChange(item.value)}
          >
            {active && <motion.span layoutId={`seg-${id}`} className="segment-thumb" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            {item.icon}
            {item.label}
            {item.badge != null && item.badge !== 0 && <span className="chip-count">{item.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

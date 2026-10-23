import { ArrowDown, ArrowUp, MonitorPlay, X } from 'lucide-react';

export function BallIcon({ size = 14, own = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill={own ? 'var(--danger)' : 'var(--text)'} />
      <path d="M12 7.2l3.3 2.4-1.2 3.9H9.9L8.7 9.6z" fill={own ? '#fff' : 'var(--bg)'} />
      <path
        d="M12 7.2V3.5M15.3 9.6l3.4-1.2M14.1 13.5l2.2 3.1M9.9 13.5l-2.2 3.1M8.7 9.6L5.3 8.4"
        stroke={own ? '#fff' : 'var(--bg)'}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CardIcon({ color = 'yellow', size = 14 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: size * 0.7,
        height: size,
        borderRadius: 2,
        background: color === 'red' ? 'var(--danger)' : '#facc15',
        flexShrink: 0,
        transform: 'rotate(6deg)',
      }}
    />
  );
}

export default function EventIcon({ kind, size = 14 }) {
  switch (kind) {
    case 'goal':
      return <BallIcon size={size} />;
    case 'own-goal':
      return <BallIcon size={size} own />;
    case 'yellow':
      return <CardIcon size={size} />;
    case 'red':
      return <CardIcon size={size} color="red" />;
    case 'sub':
      return (
        <span className="sub-icon" aria-hidden="true">
          <ArrowUp size={size - 3} color="var(--success)" strokeWidth={3} />
          <ArrowDown size={size - 3} color="var(--danger)" strokeWidth={3} />
        </span>
      );
    case 'pen-miss':
      return (
        <span className="pen-miss" aria-hidden="true">
          <X size={size - 2} strokeWidth={3} color="var(--danger)" />
        </span>
      );
    case 'var':
      return <MonitorPlay size={size} color="var(--info)" />;
    default:
      return null;
  }
}

import { useEffect, useState } from 'react';

function parts(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  const m = Math.floor(ms / 60000);
  return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 };
}

/** Live days / hours / minutes until kick-off. */
export default function Countdown({ to }) {
  const [p, setP] = useState(() => parts(to));
  useEffect(() => {
    setP(parts(to));
    const t = setInterval(() => setP(parts(to)), 30000);
    return () => clearInterval(t);
  }, [to]);
  const units = [
    ['d', 'days'],
    ['h', 'hrs'],
    ['m', 'min'],
  ];
  return (
    <div className="countdown" role="timer" aria-label={`${p.d} days ${p.h} hours ${p.m} minutes to kick-off`}>
      {units.map(([k, label]) => (
        <span key={k} className="countdown-unit">
          <strong>{String(p[k]).padStart(2, '0')}</strong>
          <span>{label}</span>
        </span>
      ))}
    </div>
  );
}

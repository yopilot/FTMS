import { MORALE_LABELS, ROLE_OPTIONS, STATUS_OPTIONS } from './playerOptions';

export function StatusSelect({ value, onChange, label }) {
  return (
    <select className="select mini-select status-select" data-status={value} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label || 'Status'}>
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function RoleSelect({ value, onChange, label }) {
  return (
    <select className="select mini-select" value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={label || 'Squad role'}>
      {ROLE_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Morale({ value = 3, onChange, label }) {
  return (
    <span className="morale" role="radiogroup" aria-label={label || 'Morale'} title={`Morale: ${MORALE_LABELS[value - 1]}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={MORALE_LABELS[n - 1]}
          className={n <= value ? 'is-on' : ''}
          onClick={(e) => {
            e.stopPropagation();
            onChange(n);
          }}
        />
      ))}
    </span>
  );
}

import { AlertTriangle, RefreshCw } from 'lucide-react';

export function EmptyState({ icon: Icon, title, text, action, compact }) {
  return (
    <div className="empty" style={compact ? { padding: '28px 20px' } : undefined}>
      {Icon && (
        <span className="empty-icon">
          <Icon size={20} />
        </span>
      )}
      {title && <div className="empty-title">{title}</div>}
      {text && <p className="empty-text">{text}</p>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Could not load this', compact }) {
  return (
    <EmptyState
      compact={compact}
      icon={AlertTriangle}
      title={title}
      text={error?.message || 'The data source did not respond. Check your connection and try again.'}
      action={
        onRetry && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => onRetry()}>
            <RefreshCw size={14} /> Try again
          </button>
        )
      }
    />
  );
}

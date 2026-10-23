import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Screen crashed:', error, info);
  }

  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunkError = /dynamically imported module|Loading chunk|Failed to fetch/i.test(String(this.state.error?.message));
    return (
      <div className="card" style={{ marginTop: 24 }}>
        <div className="empty">
          <span className="empty-icon">
            <AlertTriangle size={20} />
          </span>
          <div className="empty-title">{chunkError ? 'A new version is available' : 'This screen hit a problem'}</div>
          <p className="empty-text">
            {chunkError ? 'Reload to get the latest version of the app.' : 'Something unexpected happened while showing this page. Reloading usually fixes it.'}
          </p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.location.reload()} style={{ marginTop: 8 }}>
            <RefreshCw size={14} /> Reload
          </button>
        </div>
      </div>
    );
  }
}

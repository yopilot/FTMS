import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="notfound">
      <div className="notfound-code">404</div>
      <h1 className="page-title" style={{ fontSize: 22 }}>
        This page is offside
      </h1>
      <p className="muted">The link may be old, or the page moved.</p>
      <div className="row gap-2" style={{ marginTop: 8 }}>
        <Link to="/" className="btn btn-primary">
          Go home
        </Link>
        <Link to="/matches" className="btn btn-secondary">
          Live scores
        </Link>
      </div>
    </div>
  );
}

import { memo, useState } from 'react';
import { ArrowUpRight, Newspaper } from 'lucide-react';
import { timeAgo } from '../../lib/format';

function Thumb({ src, alt, className }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={`${className} news-thumb-empty`} aria-hidden="true">
        <Newspaper size={20} />
      </span>
    );
  }
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />;
}

/** News story. variant: 'feature' | 'card' | 'row' */
function NewsCard({ article, variant = 'card' }) {
  const a = article;
  const Wrapper = a.link ? 'a' : 'div';
  const linkProps = a.link ? { href: a.link, target: '_blank', rel: 'noopener noreferrer' } : {};

  if (variant === 'row') {
    return (
      <Wrapper className="news-row" {...linkProps}>
        <Thumb src={a.image} alt="" className="news-row-img" />
        <span className="grow">
          <span className="news-row-title">{a.headline}</span>
          <span className="news-meta">
            {timeAgo(a.published)}
            {a.byline && <span className="dot-sep">{a.byline}</span>}
          </span>
        </span>
      </Wrapper>
    );
  }

  return (
    <Wrapper className={`news-card ${variant === 'feature' ? 'is-feature' : ''}`} {...linkProps}>
      <span className="news-media">
        <Thumb src={a.image} alt={a.imageAlt} className="news-img" />
      </span>
      <span className="news-body">
        <span className="news-title">{a.headline}</span>
        {variant === 'feature' && a.description && <span className="news-desc">{a.description}</span>}
        <span className="news-meta">
          {timeAgo(a.published)}
          <span className="dot-sep">ESPN</span>
          {a.link && <ArrowUpRight size={13} className="news-out" />}
        </span>
      </span>
    </Wrapper>
  );
}

export default memo(NewsCard);

import { memo, useState } from 'react';
import { initials } from '../../lib/format';
import { normalizeHex, readableOn } from '../../lib/color';

function Avatar({ src, name = '', size = 36, color, ring, className = '' }) {
  const [failed, setFailed] = useState(false);
  const bg = color ? normalizeHex(color) : null;
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(10, Math.round(size * 0.36)),
    ...(bg && (!src || failed) ? { background: bg, color: readableOn(bg) } : null),
    ...(ring ? { boxShadow: `0 0 0 2px var(--surface), 0 0 0 4px ${ring}` } : null),
  };
  return (
    <span className={`avatar ${className}`} style={style} aria-hidden="true">
      {src && !failed ? <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} /> : initials(name)}
    </span>
  );
}

export default memo(Avatar);

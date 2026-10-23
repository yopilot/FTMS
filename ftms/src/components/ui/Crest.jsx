import { memo, useState } from 'react';
import { espnImage } from '../../api/espn';
import { useTheme } from '../../context/ThemeContext';
import { initials } from '../../lib/format';
import { normalizeHex, readableOn } from '../../lib/color';

/**
 * Team or competition logo with a graceful fallback to initials.
 * Uses ESPN's dark-variant logo when the theme is dark and one exists.
 */
function Crest({ src, srcDark, name = '', size = 24, color, className = '', title }) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState({});
  const preferred = theme === 'dark' && srcDark && !failed[srcDark] ? srcDark : src;
  const url = preferred && !failed[preferred] ? espnImage(preferred, size * 2, size * 2) : null;

  const style = { width: size, height: size, fontSize: size };

  if (!url) {
    const bg = color ? normalizeHex(color) : null;
    return (
      <span className={`crest ${className}`} style={style} title={title || name} aria-hidden={!title}>
        <span className="crest-fallback" style={bg ? { background: bg, color: readableOn(bg) } : undefined}>
          {initials(name) || '?'}
        </span>
      </span>
    );
  }

  return (
    <span className={`crest ${className}`} style={style} title={title}>
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        onError={() => setFailed((f) => ({ ...f, [preferred]: true }))}
      />
    </span>
  );
}

export default memo(Crest);

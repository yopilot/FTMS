import { memo } from 'react';
import { motion } from 'motion/react';
import { tierClass } from '../../lib/ratings';
import { initials } from '../../lib/format';

/** A FIFA-style player card: gold / silver / bronze by rating. */
function FutCard({ player, photo, attrs = [] }) {
  return (
    <motion.div
      className={`fut ${tierClass(player.ovr)}`}
      initial={{ rotateY: -25, opacity: 0, y: 10 }}
      animate={{ rotateY: 0, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ rotateY: 8, rotateX: -4, scale: 1.03 }}
      style={{ transformPerspective: 800 }}
    >
      <div className="fut-top">
        <span className="fut-ovr tnum">{player.ovr}</span>
        <span className="fut-pos">{player.pos}</span>
      </div>
      <div className="fut-face">{photo ? <img src={photo} alt="" /> : initials(player.name)}</div>
      <div className="fut-name">{player.lastName || player.name}</div>
      <div className="fut-attrs">
        {attrs.slice(0, 6).map((a) => (
          <span key={a.label}>
            <strong className="tnum">{a.value}</strong>
            {a.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default memo(FutCard);

import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { MAIN_NAV, MANAGER_NAV } from './navItems';

const ITEMS = [...MAIN_NAV, MANAGER_NAV];

export default function BottomNav({ liveCount }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `bnav-item ${isActive ? 'is-active' : ''}`}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="bnav-pill" className="bnav-pill" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                <Icon size={20} strokeWidth={2} style={{ marginTop: 4 }} />
                <span>{item.short || item.label}</span>
                {item.live && liveCount > 0 && <span className="bnav-badge">{liveCount > 99 ? '99+' : liveCount}</span>}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

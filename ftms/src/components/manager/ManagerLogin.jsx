import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Plus, Search, ShieldCheck, Users, X } from 'lucide-react';
import { MANAGER_LEAGUES, leagueBySlug } from '../../api/leagues';
import { useManager, usePersonSummary, useTeam, useTeamsInLeague } from '../../api/queries';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { ordinal, formatFullDate } from '../../lib/format';
import { visibleTeamColor } from '../../lib/color';
import Crest from '../ui/Crest';
import Avatar from '../ui/Avatar';
import { Skeleton } from '../ui/Skeleton';
import { ErrorState } from '../ui/States';
import { Modal } from '../ui/Modal';
import { useMediaQuery } from '../../lib/useMediaQuery';

const CUSTOM_ID = 'local';

const ClubCard = memo(function ClubCard({ team, selected, onSelect, index }) {
  const mgr = useManager({ id: team.id, name: team.name });
  return (
    <motion.button
      type="button"
      className={`club-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(team)}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 20) * 0.02, duration: 0.25 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="club-card-crest">
        <Crest src={team.logo} name={team.name} size={40} />
      </span>
      <span className="club-card-text">
        <span className="club-card-name truncate">{team.name}</span>
        <span className="club-card-mgr truncate">
          {mgr.isLoading ? <Skeleton w={90} h={10} /> : mgr.data?.name || 'Manager unknown'}
        </span>
      </span>
      {team.rank && <span className="club-card-rank tnum">{ordinal(team.rank)}</span>}
      <AnimatePresence>
        {selected && (
          <motion.span className="club-card-check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
            <Check size={12} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

function SignInForm({ club, onDone }) {
  const { login } = useAuth();
  const { push } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isCustom = club.id === CUSTOM_ID;
  const team = useTeam(isCustom ? null : club.id, club.leagueSlug);
  const mgr = useManager(isCustom ? null : { id: club.id, name: club.name });
  const wiki = usePersonSummary(mgr.data?.name, 'manager');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [clubName, setClubName] = useState('Sunday League FC');
  const [managerName, setManagerName] = useState('');
  const controls = useAnimationControls();

  const t = team.data;
  const color = visibleTeamColor(t?.color, t?.altColor, theme);
  const photo = mgr.data?.image || wiki.data?.image;
  const resolvedManager = isCustom ? managerName.trim() || 'Manager' : mgr.data?.name || managerName.trim() || 'Manager';

  const submit = (e) => {
    e.preventDefault();
    const res = login(
      isCustom
        ? { type: 'custom', id: CUSTOM_ID, name: clubName.trim() || 'Sunday League FC', short: clubName.trim() || 'My Club', managerName: resolvedManager, color: '#c4f25c' }
        : {
            type: 'real',
            id: club.id,
            name: club.name,
            short: club.short,
            logo: club.logo,
            logoDark: t?.logoDark,
            color: t?.color,
            altColor: t?.altColor,
            leagueSlug: club.leagueSlug,
            managerName: resolvedManager,
            managerImage: photo || null,
          },
      password,
    );
    if (!res.ok) {
      setError(res.error);
      controls.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.42 } });
      return;
    }
    push({ kind: 'success', title: `Welcome to the dugout, ${resolvedManager.split(' ')[0]}`, text: `You're now managing ${res.session.clubName}.` });
    onDone?.();
    navigate('/manager');
  };

  return (
    <motion.form onSubmit={submit} animate={controls} className="signin" key={club.id}>
      <div className="signin-club" style={!isCustom ? { '--club': color } : undefined}>
        {isCustom ? (
          <span className="signin-crest custom">
            <Users size={28} />
          </span>
        ) : (
          <motion.span className="signin-crest" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }}>
            <Crest src={club.logo} srcDark={t?.logoDark} name={club.name} size={64} />
          </motion.span>
        )}
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">{isCustom ? 'Your own club' : leagueBySlug(club.leagueSlug)?.name}</div>
          <div className="signin-name truncate">{isCustom ? clubName || 'Your club' : club.name}</div>
          {!isCustom && club.rank && <div className="subtle" style={{ fontSize: 12.5 }}>{ordinal(club.rank)} in the table</div>}
        </div>
      </div>

      {isCustom ? (
        <div className="stack gap-3">
          <label className="field">
            <span className="field-label">Club name</span>
            <input className="input" value={clubName} onChange={(e) => setClubName(e.target.value)} maxLength={40} />
          </label>
          <label className="field">
            <span className="field-label">Your name</span>
            <input className="input" value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Coach" maxLength={40} />
          </label>
          <p className="field-hint">Uses the squad stored on this device. Add players, generate teams and log matches.</p>
        </div>
      ) : (
        <div className="signin-manager">
          {mgr.isLoading ? (
            <>
              <Skeleton w={52} h={52} r={26} />
              <div className="stack gap-2 grow">
                <Skeleton w="50%" h={14} />
                <Skeleton w="70%" h={11} />
              </div>
            </>
          ) : mgr.data ? (
            <>
              <Avatar src={photo} name={mgr.data.name} size={52} ring={color} />
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="subtle" style={{ fontSize: 12 }}>
                  Signing in as
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }} className="truncate">
                  {mgr.data.name}
                </div>
                {mgr.data.since && (
                  <div className="subtle" style={{ fontSize: 12 }}>
                    Head coach since {formatFullDate(mgr.data.since)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <label className="field grow">
              <span className="field-label">Manager name</span>
              <input className="input" value={managerName} onChange={(e) => setManagerName(e.target.value)} placeholder="Enter your name" maxLength={40} />
            </label>
          )}
        </div>
      )}

      <label className="field">
        <span className="field-label">Manager password</span>
        <span className="input-icon">
          <KeyRound size={15} />
          <input
            className="input"
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Shared manager password"
            autoComplete="current-password"
            autoFocus
            aria-invalid={Boolean(error)}
            style={{ paddingRight: 40 }}
          />
          <button type="button" className="icon-btn sm" style={{ position: 'absolute', right: 4 }} onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </span>
        <AnimatePresence>
          {error && (
            <motion.span className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {error}
            </motion.span>
          )}
        </AnimatePresence>
      </label>

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!password}>
        Enter the dugout <ArrowRight size={16} />
      </button>
      <p className="signin-note">
        <ShieldCheck size={13} /> Every manager uses the same password. Your lineups and notes stay on this device.
      </p>
    </motion.form>
  );
}

export default function ManagerLogin() {
  const [slug, setSlug] = useState(MANAGER_LEAGUES[0]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const teams = useTeamsInLeague(slug);
  const mobile = useMediaQuery('(max-width: 899px)');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (teams.data || []).filter((t) => !s || t.name.toLowerCase().includes(s));
  }, [teams.data, q]);

  const select = (team) => setSelected({ ...team, leagueSlug: slug });
  const custom = { id: CUSTOM_ID, name: 'Your own club' };

  return (
    <div className="page mlogin">
      <header className="mlogin-head">
        <p className="eyebrow">Manager mode</p>
        <h1 className="page-title" style={{ marginTop: 6 }}>
          Choose your club
        </h1>
        <p className="page-sub" style={{ maxWidth: 620 }}>
          Every club comes with its real squad, fixtures and current manager. Pick your XI, formation, tactics and set-piece takers. Everything saves on this device.
        </p>
      </header>

      <div className="mlogin-grid">
        <div className="stack gap-4" style={{ minWidth: 0 }}>
          <div className="chip-row" role="tablist" aria-label="League">
            {MANAGER_LEAGUES.map((s) => {
              const l = leagueBySlug(s);
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={slug === s}
                  className={`chip ${slug === s ? 'is-active' : ''}`}
                  onClick={() => {
                    setSlug(s);
                    setQ('');
                  }}
                >
                  <Crest src={l.logo} srcDark={l.logoDark} name={l.name} size={16} />
                  {l.short}
                </button>
              );
            })}
          </div>
          <label className="input-icon" style={{ maxWidth: 360 }}>
            <Search size={15} />
            <input className="input" placeholder="Find a club" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a club" />
            {q && (
              <button type="button" className="icon-btn sm" style={{ position: 'absolute', right: 4 }} onClick={() => setQ('')} aria-label="Clear">
                <X size={14} />
              </button>
            )}
          </label>

          {teams.isError ? (
            <div className="card">
              <ErrorState error={teams.error} onRetry={teams.refetch} />
            </div>
          ) : (
            <div className="club-grid">
              <motion.button
                type="button"
                className={`club-card custom ${selected?.id === CUSTOM_ID ? 'is-selected' : ''}`}
                onClick={() => setSelected(custom)}
                aria-pressed={selected?.id === CUSTOM_ID}
                whileTap={{ scale: 0.98 }}
              >
                <span className="club-card-crest custom">
                  <Plus size={20} />
                </span>
                <span className="club-card-text">
                  <span className="club-card-name">Your own club</span>
                  <span className="club-card-mgr">Sunday league, five-a-side, school team</span>
                </span>
              </motion.button>
              {teams.isLoading
                ? Array.from({ length: 11 }, (_, i) => (
                    <div key={i} className="club-card" aria-hidden="true">
                      <Skeleton w={40} h={40} r={20} />
                      <span className="stack gap-2 grow">
                        <Skeleton w="70%" h={12} />
                        <Skeleton w="45%" h={10} />
                      </span>
                    </div>
                  ))
                : list.map((t, i) => <ClubCard key={t.id} team={t} index={i} selected={selected?.id === t.id} onSelect={select} />)}
            </div>
          )}
        </div>

        {!mobile && (
          <aside className="mlogin-panel card">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                  <SignInForm club={selected} />
                </motion.div>
              ) : (
                <motion.div key="empty" className="mlogin-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="mlogin-empty-art" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }} />
                    ))}
                  </div>
                  <div className="empty-title">Select a club to continue</div>
                  <p className="empty-text">You&apos;ll sign in as its current manager.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        )}
      </div>

      {mobile && (
        <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title="Manager sign-in" size="sm">
          {selected && <SignInForm club={selected} onDone={() => setSelected(null)} />}
        </Modal>
      )}
    </div>
  );
}

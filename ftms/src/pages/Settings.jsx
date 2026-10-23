import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Database, Download, ExternalLink, Keyboard, LogOut, Monitor, Moon, Radio, Star, Sun, Trash2, Upload, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { leagueBySlug } from '../api/leagues';
import { backupService } from '../services/backupService';
import { clearCaches } from '../lib/storage';
import { formatFullDate, timeAgo } from '../lib/format';
import Crest from '../components/ui/Crest';
import { Segmented } from '../components/ui/Tabs';
import { ConfirmDialog } from '../components/ui/Modal';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)}>
      <motion.span className="switch-knob" animate={{ x: checked ? 16 : 0 }} transition={{ type: 'spring', stiffness: 600, damping: 34 }} />
    </button>
  );
}

function Row({ label, desc, children }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-label">{label}</div>
        {desc && <div className="settings-desc">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  useDocumentTitle('Settings');
  const { preference, setPreference } = useTheme();
  const settings = useSettings();
  const { teams, leagues, toggleTeam, toggleLeague } = useFavorites();
  const { session, logout } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [info, setInfo] = useState(null);
  const [pending, setPending] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const loadInfo = () => backupService.getStorageInfo().then(setInfo).catch(() => {});
  useEffect(() => {
    loadInfo();
  }, []);

  const onExport = async () => {
    try {
      await backupService.downloadBackup();
      push({ kind: 'success', title: 'Backup downloaded', text: 'Keep the file somewhere safe. Import it here to restore.' });
      loadInfo();
    } catch (e) {
      push({ kind: 'error', title: 'Export failed', text: e.message });
    }
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const summary = backupService.validateBackup(json);
      setPending({ json, summary, name: file.name });
    } catch (err) {
      push({ kind: 'error', title: 'Could not read that file', text: err.message });
    }
  };

  const onRestore = async () => {
    try {
      await backupService.restoreData(pending.json);
      push({ kind: 'success', title: 'Backup restored', text: 'Reloading with your data…' });
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      push({ kind: 'error', title: 'Restore failed', text: err.message });
    }
  };

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <header className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Everything here is saved on this device only.</p>
        </div>
      </header>

      <section className="section">
        <h2 className="section-title">Appearance</h2>
        <div className="card">
          <Row label="Theme" desc="Follow your device, or pick one.">
            <Segmented
              ariaLabel="Theme"
              value={preference}
              onChange={setPreference}
              items={[
                { value: 'system', label: 'System', icon: <Monitor size={14} /> },
                { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
                { value: 'light', label: 'Light', icon: <Sun size={14} /> },
              ]}
            />
          </Row>
          <Row label="Reduce motion" desc="Turn off page transitions and animated scores.">
            <Switch checked={settings.reduceMotion} onChange={(v) => settings.update({ reduceMotion: v })} label="Reduce motion" />
          </Row>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <Radio size={16} /> Live updates
        </h2>
        <div className="card">
          <Row label="Refresh live scores every" desc="Only while matches are in play. Faster uses more data.">
            <Segmented
              ariaLabel="Refresh interval"
              value={settings.liveInterval}
              onChange={(v) => settings.update({ liveInterval: v })}
              items={[
                { value: 15, label: '15s' },
                { value: 30, label: '30s' },
                { value: 60, label: '60s' },
              ]}
            />
          </Row>
          <Row label="Goal alerts" desc="A notification when a team you follow scores, kicks off or finishes.">
            <Switch checked={settings.goalAlerts} onChange={(v) => settings.update({ goalAlerts: v })} label="Goal alerts" />
          </Row>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <Star size={16} /> Following
        </h2>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Teams</span>
            <span className="subtle" style={{ fontSize: 12 }}>
              Use the star on any team page
            </span>
          </div>
          {teams.length ? (
            teams.map((t) => (
              <div key={t.id} className="list-row">
                <Crest src={t.logo} name={t.name} size={24} />
                <Link to={`/team/${t.id}`} className="grow truncate" style={{ fontWeight: 600 }}>
                  {t.name}
                </Link>
                <button type="button" className="icon-btn sm" onClick={() => toggleTeam(t)} aria-label={`Unfollow ${t.name}`}>
                  <X size={15} />
                </button>
              </div>
            ))
          ) : (
            <p className="subtle" style={{ padding: '16px 20px', fontSize: 13 }}>
              You are not following any teams yet. Open a team and tap Follow to get goal alerts and see their matches first.
            </p>
          )}
          <div className="card-header" style={{ borderTop: '1px solid var(--divider)' }}>
            <span className="card-title">Competitions</span>
          </div>
          {leagues.length ? (
            leagues.map((slug) => {
              const l = leagueBySlug(slug);
              if (!l) return null;
              return (
                <div key={slug} className="list-row">
                  <Crest src={l.logo} srcDark={l.logoDark} name={l.name} size={24} />
                  <Link to={`/league/${slug}`} className="grow truncate" style={{ fontWeight: 600 }}>
                    {l.name}
                  </Link>
                  <button type="button" className="icon-btn sm" onClick={() => toggleLeague(slug)} aria-label={`Unfollow ${l.name}`}>
                    <X size={15} />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="subtle" style={{ padding: '16px 20px', fontSize: 13 }}>
              No competitions followed.{' '}
              <Link to="/competitions" className="link">
                Browse competitions
              </Link>
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">
          <Database size={16} /> Data & backup
        </h2>
        <div className="card">
          <Row
            label="Export a backup"
            desc={
              info
                ? `Your club (${info.playersCount} players, ${info.matchesCount} matches), lineups, tactics, follows and settings.${info.lastBackup ? ` Last export ${timeAgo(info.lastBackup)}.` : ''}`
                : 'Your club, lineups, tactics, follows and settings.'
            }
          >
            <button type="button" className="btn btn-secondary" onClick={onExport}>
              <Download size={15} /> Export
            </button>
          </Row>
          <Row label="Restore from a backup" desc="Replaces the data on this device with the file's contents.">
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={15} /> Import
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onPickFile} />
          </Row>
          <Row label="Clear cached data" desc="Removes cached manager lookups and photos. Scores are always live.">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                clearCaches();
                queryClient.clear();
                push({ kind: 'success', title: 'Cache cleared' });
              }}
            >
              Clear cache
            </button>
          </Row>
          <Row label="Reset everything" desc="Deletes your club, lineups, follows and settings from this device.">
            <button type="button" className="btn btn-danger" onClick={() => setConfirmReset(true)}>
              <Trash2 size={15} /> Reset
            </button>
          </Row>
        </div>
        {pending && (
          <div className="notice warn">
            <Upload size={16} />
            <div className="grow">
              <strong>{pending.name}</strong> — {pending.summary.summary.playersCount} players, {pending.summary.summary.matchesCount} matches
              {pending.summary.exportedAt ? `, exported ${formatFullDate(pending.summary.exportedAt)}` : ''}. Restoring replaces what is on this device.
              <div className="row gap-2" style={{ marginTop: 10 }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={onRestore}>
                  Restore now
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPending(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {session && (
        <section className="section">
          <h2 className="section-title">Manager account</h2>
          <div className="card">
            <Row label={session.clubName} desc={`Signed in as ${session.managerName} since ${formatFullDate(session.since)}.`}>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                <LogOut size={15} /> Sign out
              </button>
            </Row>
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">
          <Keyboard size={16} /> Shortcuts
        </h2>
        <div className="card">
          <Row label="Search anything">
            <span className="row gap-1">
              <span className="kbd">Ctrl</span>
              <span className="kbd">K</span>
              <span className="subtle" style={{ fontSize: 12, margin: '0 4px' }}>
                or
              </span>
              <span className="kbd">/</span>
            </span>
          </Row>
          <Row label="Move through results">
            <span className="row gap-1">
              <span className="kbd">↑</span>
              <span className="kbd">↓</span>
              <span className="kbd">Enter</span>
            </span>
          </Row>
          <Row label="Close dialogs">
            <span className="kbd">Esc</span>
          </Row>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">About the data</h2>
        <div className="card card-body stack gap-3" style={{ fontSize: 13.5 }}>
          <p className="muted">
            FTMS is free and runs entirely in your browser. There are no accounts on a server. Live data comes from public sources:
          </p>
          <ul className="stack gap-2 muted">
            <li>
              <strong style={{ color: 'var(--text)' }}>ESPN</strong> — scores, fixtures, tables, squads, player stats and news.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Wikidata</strong> — current managers and their photos.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Wikipedia</strong> — player and manager photos and short bios.
            </li>
          </ul>
          <p className="subtle" style={{ fontSize: 12.5 }}>
            Player ratings (OVR and match ratings) are FTMS estimates calculated from those stats; they are not official ratings. FTMS is not affiliated with ESPN, any league or any
            club.{' '}
            <a className="link" href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer">
              Wikidata <ExternalLink size={11} />
            </a>
          </p>
        </div>
      </section>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        danger
        title="Reset everything?"
        text="This deletes your club, matches, lineups, tactics, follows and settings from this browser. Export a backup first if you might want them back."
        confirmLabel="Delete everything"
        onConfirm={async () => {
          await backupService.resetEverything();
          window.location.assign(import.meta.env.BASE_URL);
        }}
      />
    </div>
  );
}

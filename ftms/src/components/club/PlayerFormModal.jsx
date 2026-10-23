import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { OvrBadge } from '../ui/Bits';
import { playerService } from '../../services/playerService';
import { useToast } from '../../context/ToastContext';
import { ATTRIBUTES, attrOvr } from '../../lib/ratings';

const EMPTY = {
  name: '',
  jerseyNumber: '',
  position: 'MID',
  age: '',
  preferredFoot: 'Right',
  height: '',
  weight: '',
  status: 'active',
  notes: '',
  ratings: { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 },
};

/** Add or edit a player in the custom club (stored in IndexedDB). */
export default function PlayerFormModal({ open, onClose, player, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { push } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      player
        ? {
            ...EMPTY,
            ...player,
            jerseyNumber: player.jerseyNumber ?? '',
            age: player.age ?? '',
            height: player.height ?? '',
            weight: player.weight ?? '',
            ratings: { ...EMPTY.ratings, ...(player.ratings || {}) },
          }
        : EMPTY,
    );
  }, [open, player]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setRating = (key, v) => setForm((f) => ({ ...f, ratings: { ...f.ratings, [key]: Number(v) } }));
  const ovr = attrOvr(form.ratings, form.position);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        jerseyNumber: form.jerseyNumber,
        position: form.position,
        age: form.age === '' ? null : form.age,
        preferredFoot: form.preferredFoot,
        height: form.height === '' ? null : form.height,
        weight: form.weight === '' ? null : form.weight,
        status: form.status,
        notes: form.notes,
        ratings: form.ratings,
      };
      if (player?.id != null) await playerService.update(player.id, payload);
      else await playerService.add(payload);
      await queryClient.invalidateQueries({ queryKey: ['local'] });
      push({ kind: 'success', title: player ? 'Player updated' : 'Player added', text: form.name.trim() });
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save this player.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={player ? `Edit ${player.name}` : 'Add a player'}
      description="Ratings are 1–99. The overall updates as you go and depends on position."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="player-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : player ? 'Save changes' : 'Add player'}
          </button>
        </>
      }
    >
      <form id="player-form" onSubmit={submit} className="stack gap-4">
        {error && <div className="notice error">{error}</div>}
        <div className="grid-2">
          <label className="field">
            <span className="field-label">Full name</span>
            <input className="input" value={form.name} onChange={set('name')} maxLength={100} required autoFocus placeholder="e.g. Alex Morgan" />
          </label>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">
              <span className="field-label">Shirt number</span>
              <input className="input" value={form.jerseyNumber} onChange={set('jerseyNumber')} inputMode="numeric" maxLength={3} placeholder="10" />
            </label>
            <label className="field">
              <span className="field-label">Position</span>
              <select className="select" value={form.position} onChange={set('position')}>
                <option value="GK">Goalkeeper</option>
                <option value="DEF">Defender</option>
                <option value="MID">Midfielder</option>
                <option value="FWD">Forward</option>
              </select>
            </label>
          </div>
        </div>
        <div className="grid-3">
          <label className="field">
            <span className="field-label">Age</span>
            <input className="input" type="number" min="5" max="80" value={form.age} onChange={set('age')} />
          </label>
          <label className="field">
            <span className="field-label">Height (cm)</span>
            <input className="input" type="number" min="101" max="249" value={form.height} onChange={set('height')} />
          </label>
          <label className="field">
            <span className="field-label">Weight (kg)</span>
            <input className="input" type="number" min="21" max="199" value={form.weight} onChange={set('weight')} />
          </label>
        </div>
        <div className="grid-2">
          <label className="field">
            <span className="field-label">Preferred foot</span>
            <select className="select" value={form.preferredFoot} onChange={set('preferredFoot')}>
              <option>Right</option>
              <option>Left</option>
              <option>Both</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Availability</span>
            <select className="select" value={form.status} onChange={set('status')}>
              <option value="active">Active</option>
              <option value="injured">Injured</option>
              <option value="inactive">Unavailable</option>
            </select>
          </label>
        </div>

        <div className="card" style={{ padding: 16, background: 'var(--surface-2)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="field-label">Attributes</span>
            <span className="row gap-2 subtle" style={{ fontSize: 12 }}>
              Overall <OvrBadge value={ovr} />
            </span>
          </div>
          <div className="grid-2" style={{ gap: '14px 24px' }}>
            {ATTRIBUTES.map((a) => (
              <label key={a.key} className="slider-field">
                <span className="slider-head">
                  <span className="slider-label">{a.label}</span>
                  <span className="tnum" style={{ fontWeight: 700 }}>
                    {form.ratings[a.key]}
                  </span>
                </span>
                <input
                  type="range"
                  className="range"
                  min="1"
                  max="99"
                  value={form.ratings[a.key]}
                  onChange={(e) => setRating(a.key, e.target.value)}
                  style={{ '--val': `${form.ratings[a.key]}%` }}
                />
              </label>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field-label">Notes</span>
          <textarea className="textarea" value={form.notes} onChange={set('notes')} placeholder="Strengths, preferred role, availability…" maxLength={500} />
        </label>
      </form>
    </Modal>
  );
}

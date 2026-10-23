import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { matchService } from '../../services/matchService';
import { useToast } from '../../context/ToastContext';

const today = () => new Date().toISOString().slice(0, 10);

/** Schedule or edit a match for the custom club. */
export default function MatchFormModal({ open, onClose, match, onSaved, initialTeams }) {
  const [form, setForm] = useState({ title: '', date: today(), time: '10:00', venue: '', opponent: '', matchType: 'Friendly', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { push } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      match
        ? { title: match.title, date: match.date, time: match.time || '', venue: match.venue || '', opponent: match.opponent || '', matchType: match.matchType || 'Friendly', notes: match.notes || '' }
        : { title: '', date: today(), time: '10:00', venue: '', opponent: '', matchType: 'Friendly', notes: '' },
    );
  }, [open, match]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let id = match?.id;
      if (match) await matchService.update(match.id, form);
      else {
        const selected = initialTeams ? initialTeams.teams.flatMap((t) => t.playerIds).concat(initialTeams.extras || []) : [];
        id = await matchService.add({
          ...form,
          status: 'upcoming',
          selectedPlayerIds: selected,
          teams: initialTeams?.teams || [],
          guestPlayers: initialTeams?.guests || [],
        });
        if (initialTeams?.extras?.length) await matchService.update(id, { bench: initialTeams.extras });
      }
      await queryClient.invalidateQueries({ queryKey: ['local'] });
      push({ kind: 'success', title: match ? 'Match updated' : 'Match scheduled', text: form.title });
      onSaved?.(id);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save the match.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={match ? 'Edit match' : 'Schedule a match'}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="match-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : match ? 'Save' : 'Schedule'}
          </button>
        </>
      }
    >
      <form id="match-form" onSubmit={submit} className="stack gap-4">
        {error && <div className="notice error">{error}</div>}
        <label className="field">
          <span className="field-label">Title</span>
          <input className="input" value={form.title} onChange={set('title')} placeholder="Sunday scrimmage #15" required autoFocus maxLength={80} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span className="field-label">Date</span>
            <input className="input" type="date" value={form.date} onChange={set('date')} required />
          </label>
          <label className="field">
            <span className="field-label">Kick-off</span>
            <input className="input" type="time" value={form.time} onChange={set('time')} />
          </label>
        </div>
        <div className="grid-2">
          <label className="field">
            <span className="field-label">Venue</span>
            <input className="input" value={form.venue} onChange={set('venue')} placeholder="North pitch" maxLength={80} />
          </label>
          <label className="field">
            <span className="field-label">Type</span>
            <select className="select" value={form.matchType} onChange={set('matchType')}>
              <option>Friendly</option>
              <option>Training</option>
              <option>League</option>
              <option>Cup</option>
              <option>Tournament</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span className="field-label">Opponent (optional)</span>
          <input className="input" value={form.opponent} onChange={set('opponent')} placeholder="Internal match" maxLength={80} />
        </label>
        <label className="field">
          <span className="field-label">Notes</span>
          <textarea className="textarea" value={form.notes} onChange={set('notes')} maxLength={500} />
        </label>
      </form>
    </Modal>
  );
}

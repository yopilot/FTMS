import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { statsService } from '../../services/statsService';
import { useToast } from '../../context/ToastContext';
import { Segmented } from '../ui/Tabs';

const CATEGORIES = ['Technical', 'Tactical', 'Physical', 'Mental', 'General'];

/** Create or edit a configurable stat field (SRS FR-010 – FR-013). */
export default function StatDefinitionModal({ open, onClose, def }) {
  const [form, setForm] = useState({ name: '', category: 'Technical', description: '', type: 'quantitative', unit: '', choices: 'Poor, Average, Good, Excellent', inChart: true });
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const { push } = useToast();

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      def
        ? { name: def.name, category: def.category || 'General', description: def.description || '', type: def.type, unit: def.unit || '', choices: (def.choices || []).join(', '), inChart: Boolean(def.inChart) }
        : { name: '', category: 'Technical', description: '', type: 'quantitative', unit: '', choices: 'Poor, Average, Good, Excellent', inChart: true },
    );
  }, [open, def]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const choices = form.choices
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    if (form.type === 'qualitative' && choices.length < 2) {
      setError('Add at least two choices, separated by commas.');
      return;
    }
    try {
      const payload = { ...form, choices: form.type === 'qualitative' ? choices : [] };
      if (def) await statsService.updateDefinition(def.id, payload);
      else await statsService.addDefinition(payload);
      await queryClient.invalidateQueries({ queryKey: ['local'] });
      push({ kind: 'success', title: def ? 'Stat field updated' : 'Stat field created', text: form.name });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={def ? 'Edit stat field' : 'New stat field'}
      description="Stat fields are recorded per player after each match."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="stat-form" className="btn btn-primary">
            {def ? 'Save' : 'Create'}
          </button>
        </>
      }
    >
      <form id="stat-form" onSubmit={submit} className="stack gap-4">
        {error && <div className="notice error">{error}</div>}
        <div className="grid-2">
          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" value={form.name} onChange={set('name')} required autoFocus maxLength={40} placeholder="Tackles won" />
          </label>
          <label className="field">
            <span className="field-label">Category</span>
            <select className="select" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="field">
          <span className="field-label">Type</span>
          <Segmented
            ariaLabel="Stat type"
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            items={[
              { value: 'quantitative', label: 'Number' },
              { value: 'qualitative', label: 'Choice' },
            ]}
          />
        </div>
        {form.type === 'quantitative' ? (
          <label className="field">
            <span className="field-label">Unit (optional)</span>
            <input className="input" value={form.unit} onChange={set('unit')} placeholder="%, km, …" maxLength={8} />
          </label>
        ) : (
          <label className="field">
            <span className="field-label">Choices</span>
            <input className="input" value={form.choices} onChange={set('choices')} />
            <span className="field-hint">Separate with commas, from worst to best.</span>
          </label>
        )}
        <label className="field">
          <span className="field-label">Description</span>
          <input className="input" value={form.description} onChange={set('description')} maxLength={120} />
        </label>
        <label className="row gap-2" style={{ fontSize: 14 }}>
          <input type="checkbox" className="checkbox" checked={form.inChart} onChange={(e) => setForm((f) => ({ ...f, inChart: e.target.checked }))} />
          Show on the stats page leaderboards
        </label>
      </form>
    </Modal>
  );
}

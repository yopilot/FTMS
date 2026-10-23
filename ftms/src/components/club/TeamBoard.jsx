import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { LayoutGroup, motion } from 'motion/react';
import { Armchair, X } from 'lucide-react';
import { OvrBadge, PosBadge } from '../ui/Bits';
import { normalizeHex, readableOn } from '../../lib/color';
import { teamAverage } from '../../lib/teamGen';

function Chip({ id, player, selected, onTap, readOnly }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `p:${id}`, data: { id }, disabled: readOnly });
  return (
    <motion.div layout layoutId={`tb-${id}`} transition={{ type: 'spring', stiffness: 420, damping: 34 }}>
      <button
        ref={setNodeRef}
        type="button"
        className={`tb-chip ${selected ? 'is-selected' : ''}`}
        style={{ opacity: isDragging ? 0.3 : 1 }}
        onClick={() => !readOnly && onTap(id)}
        {...listeners}
        {...attributes}
      >
        <span className="squad-num" style={{ width: 20 }}>
          {player.number ?? ''}
        </span>
        <span className="grow truncate" style={{ textAlign: 'left', fontWeight: 600 }}>
          {player.name}
          {player.isGuest && (
            <span className="badge" style={{ marginLeft: 6, height: 18 }}>
              Guest
            </span>
          )}
        </span>
        <PosBadge pos={player.pos} />
        <OvrBadge value={player.ovr} />
      </button>
    </motion.div>
  );
}

function Column({ id, title, color, avg, children, count, onTapHeader, armed }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const bg = color ? normalizeHex(color) : null;
  return (
    <div ref={setNodeRef} className={`tb-col ${isOver ? 'is-over' : ''} ${armed ? 'is-armed' : ''}`}>
      <button type="button" className="tb-head" onClick={onTapHeader} aria-label={armed ? `Move selected player to ${title}` : title}>
        {bg ? (
          <span className="tb-swatch" style={{ background: bg, color: readableOn(bg) }}>
            {title.replace(/^Team\s+/i, '').slice(0, 1)}
          </span>
        ) : (
          <span className="tb-swatch bench">
            <Armchair size={13} />
          </span>
        )}
        <span className="grow" style={{ minWidth: 0, textAlign: 'left' }}>
          <span className="truncate" style={{ display: 'block', fontWeight: 700 }}>
            {title}
          </span>
          <span className="subtle" style={{ fontSize: 12 }}>
            {count} player{count === 1 ? '' : 's'}
            {avg ? ` · avg ${avg}` : ''}
          </span>
        </span>
      </button>
      <div className="tb-list">{children}</div>
    </div>
  );
}

/**
 * teams: [{ name, color, playerIds }], extras: ids not on a team (bench).
 * getPlayer(id) => { name, pos, ovr, number, isGuest }
 */
export default function TeamBoard({ teams, extras, getPlayer, onChange, readOnly = false, extrasLabel = 'Bench / extras' }) {
  const [selected, setSelected] = useState(null);
  const [dragId, setDragId] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 6 } }));
  const ovrOf = (id) => getPlayer(id)?.ovr || 50;

  const moveTo = (id, target) => {
    const nextTeams = teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((x) => x !== id) }));
    let nextExtras = extras.filter((x) => x !== id);
    if (target === 'extras') nextExtras = [...nextExtras, id];
    else {
      const i = Number(target.split(':')[1]);
      if (nextTeams[i]) nextTeams[i].playerIds.push(id);
    }
    onChange({ teams: nextTeams, extras: nextExtras });
  };

  const tapHeader = (target) => {
    if (!selected) return;
    moveTo(selected, target);
    setSelected(null);
  };

  const onDragEnd = ({ active, over }) => {
    setDragId(null);
    if (!over || readOnly) return;
    moveTo(active.data.current.id, String(over.id));
    setSelected(null);
  };

  const dragged = dragId ? getPlayer(dragId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={({ active }) => setDragId(active.data.current.id)} onDragEnd={onDragEnd} onDragCancel={() => setDragId(null)}>
      <LayoutGroup>
        {selected && !readOnly && (
          <div className="notice" style={{ marginBottom: 12 }}>
            <span className="grow">
              <strong>{getPlayer(selected)?.name}</strong> selected. Tap a team name to move them.
            </span>
            <button type="button" className="icon-btn sm" onClick={() => setSelected(null)} aria-label="Cancel">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="tb-grid" style={{ '--cols': Math.min(teams.length + (extras.length || !readOnly ? 1 : 0), 4) }}>
          {teams.map((t, i) => (
            <Column
              key={i}
              id={`team:${i}`}
              title={t.name}
              color={t.color}
              avg={teamAverage(t, ovrOf)}
              count={t.playerIds.length}
              armed={Boolean(selected)}
              onTapHeader={() => tapHeader(`team:${i}`)}
            >
              {t.playerIds.map((id) => {
                const p = getPlayer(id);
                return p ? <Chip key={id} id={id} player={p} selected={selected === id} onTap={(x) => setSelected(selected === x ? null : x)} readOnly={readOnly} /> : null;
              })}
              {t.playerIds.length === 0 && <div className="tb-empty">Drop players here</div>}
            </Column>
          ))}
          {(extras.length > 0 || !readOnly) && (
            <Column id="extras" title={extrasLabel} count={extras.length} armed={Boolean(selected)} onTapHeader={() => tapHeader('extras')}>
              {extras.map((id) => {
                const p = getPlayer(id);
                return p ? <Chip key={id} id={id} player={p} selected={selected === id} onTap={(x) => setSelected(selected === x ? null : x)} readOnly={readOnly} /> : null;
              })}
              {extras.length === 0 && <div className="tb-empty">Nobody on the bench</div>}
            </Column>
          )}
        </div>
      </LayoutGroup>
      <DragOverlay>
        {dragged ? (
          <div className="tb-chip is-dragging">
            <span className="grow truncate" style={{ fontWeight: 650 }}>
              {dragged.name}
            </span>
            <OvrBadge value={dragged.ovr} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

import { memo } from 'react';
import { motion } from 'motion/react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { AlertTriangle, Plus } from 'lucide-react';
import { effective, positionFit } from '../../lib/formations';
import { normalizeHex, readableOn } from '../../lib/color';
import { tierClass } from '../../lib/ratings';

/** Shirt + name + rating used on the pitch, the bench and the drag overlay. */
export const PlayerToken = memo(function PlayerToken({ player, slot, color, roles = {}, compact = false, dragging = false, selected = false }) {
  const bg = normalizeHex(color || '#c4f25c');
  const eff = slot ? effective(player, slot) : player.ovr;
  const outOfPos = slot && positionFit(player.pos, slot.group) < 1;
  const unavailable = ['injured', 'suspended', 'rested', 'unavailable'].includes(player.status);
  return (
    <span className={`ptoken ${compact ? 'is-compact' : ''} ${dragging ? 'is-dragging' : ''} ${selected ? 'is-selected' : ''}`}>
      <span className="ptoken-shirt" style={{ background: bg, color: readableOn(bg) }}>
        {player.number || player.name.slice(0, 1)}
        {roles.captain === player.id && <span className="ptoken-c" title="Captain">C</span>}
        {unavailable && (
          <span className="ptoken-warn danger" title={player.status}>
            +
          </span>
        )}
        {!unavailable && outOfPos && (
          <span className="ptoken-warn" title={`Out of position (natural ${player.pos})`}>
            <AlertTriangle size={9} strokeWidth={3} />
          </span>
        )}
      </span>
      <span className="ptoken-name">{player.lastName || player.short || player.name}</span>
      <span className={`ptoken-ovr ${tierClass(eff)} ${outOfPos ? 'is-off' : ''}`}>{eff}</span>
    </span>
  );
});

function DraggableToken({ id, player, children, onTap, disabled }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `player:${id}`, data: { playerId: id }, disabled });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="ptoken-btn"
      style={{ opacity: isDragging ? 0.25 : 1 }}
      onClick={onTap}
      aria-label={`${player.name}. Tap to select, then tap a position.`}
      {...listeners}
      {...attributes}
    >
      {children}
    </button>
  );
}

function SlotView({ slot, player, color, roles, selectedId, onTapPlayer, onTapSlot, armed }) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot.id}`, data: { slotId: slot.id } });
  return (
    <div ref={setNodeRef} className={`tslot ${isOver ? 'is-over' : ''} ${armed ? 'is-armed' : ''}`} style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}>
      {player ? (
        <motion.div layoutId={`tok-${player.id}`} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
          <DraggableToken id={player.id} player={player} onTap={() => (armed && selectedId !== player.id ? onTapSlot(slot.id) : onTapPlayer(player.id))}>
            <PlayerToken player={player} slot={slot} color={color} roles={roles} selected={selectedId === player.id} />
          </DraggableToken>
        </motion.div>
      ) : (
        <button type="button" className="tslot-empty" onClick={() => onTapSlot(slot.id)} aria-label={`Empty ${slot.role} position`}>
          <span className="tslot-ring">
            <Plus size={14} />
          </span>
          <span className="tslot-role">{slot.role}</span>
        </button>
      )}
      {player && <span className="tslot-tag">{slot.role}</span>}
    </div>
  );
}

/** The tactics pitch. Own goal at the bottom. */
export default function TacticsPitch({ slots, lineup, playersById, color, roles, selectedId, onTapPlayer, onTapSlot }) {
  return (
    <div className="pitch tpitch">
      <svg className="pitch-lines" viewBox="0 0 68 105" preserveAspectRatio="none" aria-hidden="true">
        <rect x="1" y="1" width="66" height="103" fill="none" />
        <line x1="1" y1="52.5" x2="67" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" fill="none" />
        <rect x="13.85" y="1" width="40.3" height="16.5" fill="none" />
        <rect x="24.85" y="1" width="18.3" height="5.5" fill="none" />
        <rect x="13.85" y="87.5" width="40.3" height="16.5" fill="none" />
        <rect x="24.85" y="98.5" width="18.3" height="5.5" fill="none" />
        <path d="M26.7 17.5 A9.15 9.15 0 0 0 41.3 17.5" fill="none" />
        <path d="M26.7 87.5 A9.15 9.15 0 0 1 41.3 87.5" fill="none" />
      </svg>
      <div className="tpitch-arrow" aria-hidden="true">
        Attack
      </div>
      {slots.map((slot) => (
        <SlotView
          key={slot.id}
          slot={slot}
          player={playersById.get(lineup[slot.id])}
          color={color}
          roles={roles}
          selectedId={selectedId}
          armed={Boolean(selectedId)}
          onTapPlayer={onTapPlayer}
          onTapSlot={onTapSlot}
        />
      ))}
    </div>
  );
}

export function BenchZone({ bench, playersById, color, roles, selectedId, onTapPlayer, onTapBench, max = 9 }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone:bench' });
  return (
    <div ref={setNodeRef} className={`bench ${isOver ? 'is-over' : ''} ${selectedId ? 'is-armed' : ''}`}>
      <div className="bench-head">
        <span className="eyebrow">Substitutes</span>
        <span className="subtle tnum" style={{ fontSize: 12 }}>
          {bench.length}/{max}
        </span>
      </div>
      <div className="bench-row">
        {bench.map((id) => {
          const p = playersById.get(id);
          if (!p) return null;
          return (
            <motion.div key={id} layoutId={`tok-${id}`} transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
              <DraggableToken id={id} player={p} onTap={() => onTapPlayer(id)}>
                <PlayerToken player={p} color={color} roles={roles} compact selected={selectedId === id} />
              </DraggableToken>
            </motion.div>
          );
        })}
        {Array.from({ length: Math.max(0, max - bench.length) }, (_, i) => (
          <button key={`e${i}`} type="button" className="bench-empty" onClick={onTapBench} aria-label="Empty substitute spot" />
        ))}
      </div>
    </div>
  );
}

export function ReserveRow({ player, onTap, selected, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `player:${player.id}`, data: { playerId: player.id } });
  return (
    <div ref={setNodeRef} className={`reserve-row ${selected ? 'is-selected' : ''}`} style={{ opacity: isDragging ? 0.35 : 1 }}>
      <button type="button" className="reserve-main" onClick={onTap} {...listeners} {...attributes} aria-label={`${player.name}. Drag onto the pitch or tap to select.`}>
        {children}
      </button>
    </div>
  );
}

export function ReserveZone({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone:reserve' });
  return (
    <div ref={setNodeRef} className={`reserve-zone ${isOver ? 'is-over' : ''}`}>
      {children}
    </div>
  );
}

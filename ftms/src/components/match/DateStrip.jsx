import { useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, localDateKey, parseLocalKey } from '../../lib/dates';
import { formatWeekday } from '../../lib/format';

/** Horizontal day picker centred on the selected day, with a native calendar fallback. */
export default function DateStrip({ value, onChange }) {
  const selected = parseLocalKey(value) || new Date();
  const todayK = localDateKey(new Date());
  const inputRef = useRef(null);
  const scrollerRef = useRef(null);

  const days = useMemo(() => {
    const base = parseLocalKey(value) || new Date();
    return Array.from({ length: 15 }, (_, i) => addDays(base, i - 7));
  }, [value]);

  useEffect(() => {
    const el = scrollerRef.current?.querySelector('[aria-current="date"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [value]);

  const shift = (n) => onChange(localDateKey(addDays(selected, n)));

  return (
    <div className="datestrip">
      <button type="button" className="icon-btn sm" onClick={() => shift(-1)} aria-label="Previous day">
        <ChevronLeft size={16} />
      </button>
      <div className="datestrip-days" ref={scrollerRef} role="tablist" aria-label="Choose a day">
        {days.map((d) => {
          const k = localDateKey(d);
          const active = k === value;
          const isToday = k === todayK;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? 'date' : undefined}
              className={`dday ${active ? 'is-active' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => onChange(k)}
            >
              {active && <motion.span layoutId="dday-pill" className="dday-pill" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
              <span className="dday-wd">{isToday ? 'Today' : formatWeekday(d)}</span>
              <span className="dday-num">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="icon-btn sm" onClick={() => shift(1)} aria-label="Next day">
        <ChevronRight size={16} />
      </button>
      <label className="icon-btn sm datestrip-cal" title="Pick a date">
        <CalendarDays size={16} />
        <span className="sr-only">Pick a date</span>
        <input
          ref={inputRef}
          type="date"
          value={`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`}
          onChange={(e) => e.target.value && onChange(e.target.value.replaceAll('-', ''))}
          onClick={(e) => e.currentTarget.showPicker?.()}
        />
      </label>
    </div>
  );
}

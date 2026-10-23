import { useEffect, useLayoutEffect, useRef } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps focus inside a dialog, closes on Escape, locks page scroll and
 * restores focus to the opener when the dialog closes.
 */
export function useFocusTrap(open, onClose, { initialFocus } = {}) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const el = ref.current;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';

    const focusTimer = setTimeout(() => {
      if (!el) return;
      const target =
        (initialFocus && el.querySelector(initialFocus)) ||
        el.querySelector('[autofocus]') ||
        el.querySelector('input:not([type="hidden"]):not([disabled]), textarea, select') ||
        el.querySelector(FOCUSABLE);
      target?.focus?.({ preventScroll: true });
    }, 40);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey, true);
      html.style.overflow = prevOverflow;
      if (previous && typeof previous.focus === 'function') previous.focus({ preventScroll: true });
    };
  }, [open, initialFocus]);

  return ref;
}

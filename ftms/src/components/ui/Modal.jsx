import { useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../lib/useFocusTrap';

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

/**
 * Accessible modal. On phones it becomes a bottom sheet.
 * Children render inside .modal-body; pass `footer` for sticky actions.
 */
export function Modal({ open, onClose, title, description, children, footer, size = '', initialFocus }) {
  return createPortal(
    <AnimatePresence>{open && <ModalInner {...{ onClose, title, description, footer, size, initialFocus }}>{children}</ModalInner>}</AnimatePresence>,
    document.body,
  );
}

function ModalInner({ onClose, title, description, children, footer, size, initialFocus }) {
  const ref = useFocusTrap(true, onClose, { initialFocus });
  const titleId = useId();
  const mobile = isMobile();

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={onClose} />
      <div className="modal-layer">
        <motion.div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`modal ${size}`}
          initial={mobile ? { y: '100%' } : { opacity: 0, scale: 0.96, y: 8 }}
          animate={mobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
          exit={mobile ? { y: '100%' } : { opacity: 0, scale: 0.97, y: 4 }}
          transition={{ type: 'spring', stiffness: 460, damping: 38 }}
        >
          <div className="modal-head">
            <div className="grow">
              <h2 id={titleId} className="modal-title">
                {title}
              </h2>
              {description && <p className="modal-desc">{description}</p>}
            </div>
            <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Close dialog">
              <X size={16} />
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </motion.div>
      </div>
    </>
  );
}

export function Drawer({ open, onClose, title, children, footer }) {
  return createPortal(
    <AnimatePresence>{open && <DrawerInner {...{ onClose, title, footer }}>{children}</DrawerInner>}</AnimatePresence>,
    document.body,
  );
}

function DrawerInner({ onClose, title, children, footer }) {
  const ref = useFocusTrap(true, onClose);
  const titleId = useId();
  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={onClose} />
      <motion.aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 40 }}
      >
        <div className="drawer-head">
          <h2 id={titleId} className="modal-title" style={{ fontSize: 16 }}>
            {title}
          </h2>
          <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Close panel">
            <X size={16} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </motion.aside>
    </>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, text, confirmLabel = 'Confirm', danger }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: 14 }}>
        {text}
      </p>
    </Modal>
  );
}

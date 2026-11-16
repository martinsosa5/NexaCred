import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** Diálogo centrado o panel lateral (side). Se cierra con Esc o al tocar el fondo. */
export default function Modal({ title, onClose, children, footer, side = false, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  const Box = side ? 'drawer' : 'dialog';
  return (
    <div className={`overlay ${side ? 'side' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={Box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref} style={wide ? { width: 'min(820px,100%)' } : undefined}>
        <div className={side ? 'drawer-head' : 'dialog-head'}>
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className={side ? 'drawer-body' : 'dialog-body'}>{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}

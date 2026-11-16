import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Eraser } from 'lucide-react';

/** Recuadro de firma trazable con mouse o dedo. Avisa con onChange(true/false) si hay trazo. */
const FirmaPad = forwardRef(function FirmaPad({ onChange }, ref) {
  const cv = useRef(null);
  const state = useRef({ drawing: false, has: false });

  const limpiar = () => {
    const c = cv.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    state.current.has = false;
    onChange(false);
  };
  useImperativeHandle(ref, () => ({ toDataURL: () => cv.current.toDataURL('image/png') }));

  useEffect(() => {
    const c = cv.current;
    const ctx = c.getContext('2d');
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: ((t.clientX - r.left) * c.width) / r.width, y: ((t.clientY - r.top) * c.height) / r.height };
    };
    const start = (e) => { state.current.drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move = (e) => {
      if (!state.current.drawing) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y); ctx.strokeStyle = '#1f4f9e'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      if (!state.current.has) { state.current.has = true; onChange(true); }
      e.preventDefault();
    };
    const end = () => { state.current.drawing = false; };
    c.addEventListener('mousedown', start); c.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    c.addEventListener('touchstart', start, { passive: false }); c.addEventListener('touchmove', move, { passive: false }); c.addEventListener('touchend', end);
    return () => {
      c.removeEventListener('mousedown', start); c.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end);
      c.removeEventListener('touchstart', start); c.removeEventListener('touchmove', move); c.removeEventListener('touchend', end);
    };
  }, [onChange]);

  return (
    <div className="sign">
      <canvas ref={cv} width={640} height={150} aria-label="Recuadro para la firma del cliente" />
      <div className="sign-foot"><span>Firmá dentro del recuadro</span><button type="button" className="link-btn" onClick={limpiar}><Eraser size={14} /> Limpiar firma</button></div>
    </div>
  );
});
export default FirmaPad;

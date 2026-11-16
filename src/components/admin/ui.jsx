import { Bell, FilePlus, FileSignature, ThumbsUp, ThumbsDown, RefreshCw, CircleCheck, MessageCircle, Activity } from 'lucide-react';

const ICONS = {
  bell: Bell, 'file-circle-plus': FilePlus, 'file-signature': FileSignature, 'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown, rotate: RefreshCw, 'circle-check': CircleCheck, 'message-circle': MessageCircle,
};
export const ActIcon = ({ name, size = 16 }) => {
  const I = ICONS[name] || Activity;
  return <I size={size} />;
};

export function EstadoPill({ estado }) {
  const m = {
    pendiente: ['pill-warn', 'Pendiente'], aprobado: ['pill-info', 'Aprobado'],
    desembolsado: ['pill-ok', 'Desembolsado'], rechazado: ['pill-bad', 'Rechazado'],
  }[estado];
  return <span className={`pill ${m[0]}`}>{m[1]}</span>;
}
export const PagoPill = ({ estado }) =>
  estado === 'atrasado' ? <span className="pill pill-bad">Atrasado</span> : <span className="pill pill-ok">Al día</span>;

export function Empty({ icon: I, children }) {
  return (
    <div className="empty">
      <I size={34} strokeWidth={1.5} />
      <p>{children}</p>
    </div>
  );
}

import { format, parseISO } from 'date-fns';

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

/** $ 1.234.567 (con espacio, como en el portal). */
export function money(n) {
  let v = Math.round(Number(n) || 0);
  if (v === 0) v = 0;
  return '$ ' + nf.format(v);
}
export const num = (n) => nf.format(Math.round(Number(n) || 0));
export const pct = (x, d = 0) => (x * 100).toFixed(d).replace('.', ',') + '%';
export const digits = (s) => String(s ?? '').replace(/\D/g, '');
export const iniciales = (name) =>
  String(name)
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
export const fechaCorta = (iso) => {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy');
  } catch {
    return iso || '—';
  }
};
export const idFmt = (id) => '#' + String(id).padStart(4, '0');
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
/** "hace 2 días" a partir de una fecha ISO con hora. */
export const tiempo = (iso) => {
  try {
    return formatDistanceToNow(parseISO(iso), { locale: es, addSuffix: true });
  } catch {
    return '';
  }
};

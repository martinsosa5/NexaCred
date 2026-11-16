import { differenceInCalendarDays, parseISO } from 'date-fns';

/** Días de atraso de un crédito desembolsado (0 si está al día). */
export const diasAtraso = (a) => {
  if (a.estadoPago !== 'atrasado' || !a.proximoVencimiento) return 0;
  return Math.max(1, differenceInCalendarDays(new Date(), parseISO(a.proximoVencimiento)));
};

/** Indicadores de cartera que usan el panel y la sección de cobranzas. */
export function resumenCartera(solicitudes) {
  const activos = solicitudes.filter((a) => a.estado === 'desembolsado');
  const cartera = activos.reduce((s, a) => s + (a.saldo || 0), 0);
  const mora30 = activos.filter((a) => diasAtraso(a) > 30);
  const saldoMora30 = mora30.reduce((s, a) => s + (a.saldo || 0), 0);
  return { activos, cartera, mora30, saldoMora30, mora: cartera ? saldoMora30 / cartera : 0 };
}

import { addMonths, format, parseISO } from 'date-fns';
import { centavos, cuotaActual, cuotasCredito, fechaPagoValida, pesos, situacionCuota } from './pagos.js';

/** Proyecciones de consulta, con el mismo cálculo a centavos del registro de pagos. Nunca se guardan. */
function proyecciones(credito) {
  const actual = cuotaActual(credito);
  if (!actual || !credito.planPagos || !Number.isInteger(actual.numero)) return [];
  const filas = [];
  const ancla = credito.anclaVencimientos || actual.vencimiento;
  let copia = credito;
  let cuota = actual;
  for (let n = actual.numero + 1; n <= credito.plazo; n++) {
    const saldo = cuota.saldoInicial - cuota.capital;
    if (saldo <= 0) break;
    const meses = (credito.mesesRegistrados || 0) + n - actual.numero;
    copia = { ...copia, saldo: pesos(saldo), proximoVencimiento: format(addMonths(parseISO(ancla), meses), 'yyyy-MM-dd'), cuotasRegistradas: [], planPagos: { siguiente: n } };
    cuota = cuotaActual(copia);
    if (!cuota) break;
    filas.push({ ...cuota, proyeccion: true });
  }
  return filas;
}

export function historialCredito(credito, pagos = [], hoy = format(new Date(), 'yyyy-MM-dd')) {
  const operaciones = pagos.filter((p) => p.creditoId === credito.id).slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.registradoEn || '').localeCompare(b.registradoEn || ''));
  const cuotas = [...cuotasCredito(credito), ...proyecciones(credito)].map((c) => {
    const movimientos = operaciones.filter((p) => p.cuotaId === c.id);
    // Solo operaciones guardadas verifican un pago, nunca proyecciones ni etiquetas de estado.
    const recibido = movimientos.reduce((s, p) => s + centavos(p.importe), 0);
    const cuota = { ...c, recibido };
    const situacion = situacionCuota(cuota, hoy);
    return { ...cuota, movimientos, ...situacion, parcial: recibido > 0 && recibido < cuota.total, pendiente: Math.max(0, cuota.total - recibido), ultimoPago: movimientos.at(-1)?.fecha || null };
  }).sort((a, b) => a.vencimiento.localeCompare(b.vencimiento));
  // Conservar la fecha registrada incluso si faltan datos para calcular el importe.
  if (!cuotaActual(credito) && credito.saldo > 0 && !cuotas.some((c) => c.vencimiento === credito.proximoVencimiento)) {
    cuotas.push({ id: `${credito.id}:sin-datos`, numero: null, vencimiento: fechaPagoValida(credito.proximoVencimiento) ? credito.proximoVencimiento : null, total: null, recibido: 0, pendiente: null, estado: 'sin-datos', texto: 'Sin información suficiente', movimientos: [], parcial: false });
    cuotas.sort((a, b) => (a.vencimiento || '9999').localeCompare(b.vencimiento || '9999'));
  }
  return {
    cuotas, operaciones,
    totalRegistrado: operaciones.reduce((s, p) => s + centavos(p.importe), 0),
    pagadas: cuotas.filter((c) => c.estado === 'pagada').length,
    pendientes: cuotas.filter((c) => c.estado === 'pendiente').length,
    atrasadas: cuotas.filter((c) => c.estado === 'atrasado').length,
    parciales: cuotas.filter((c) => c.parcial).length,
    incompleto: !credito.planPagos,
    operacionesSinCuota: operaciones.filter((p) => !cuotas.some((c) => c.id === p.cuotaId)),
  };
}

export const filtrarHistorial = (cuotas, filtro) => cuotas.filter((c) => filtro === 'todas' || (filtro === 'parciales' ? c.parcial : c.estado === filtro));

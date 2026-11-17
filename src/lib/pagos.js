import { addMonths, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { calcular } from './finanzas.js';

export const centavos = (valor) => Math.round(valor * 100);
export const pesos = (valor) => valor / 100;
export const importePago = (valor) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
export const fechaPagoValida = (valor) => typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && isValid(parseISO(valor)) && format(parseISO(valor), 'yyyy-MM-dd') === valor;
export const claveCuota = (credito) => `${credito.id}:${credito.proximoVencimiento}`;

/** Congela el desglose antes del primer abono para no recalcular intereses sobre pagos parciales. */
export function cuotaActual(credito) {
  if (credito.estado !== 'desembolsado' || !(credito.saldo > 0) || !fechaPagoValida(credito.proximoVencimiento)) return null;
  const guardada = credito.cuotasRegistradas?.find((c) => c.id === claveCuota(credito));
  if (guardada) return guardada;
  if (!(credito.monto > 0) || !Number.isInteger(credito.plazo) || credito.plazo < 1) return null;
  const calculo = calcular(credito.monto, credito.plazo);
  if (!Number.isFinite(calculo.cuota)) return null;
  const saldo = centavos(credito.saldo);
  const interes = Math.round(saldo * calculo.i);
  const seguro = centavos(calculo.seguro);
  const numero = credito.planPagos ? credito.planPagos.siguiente : null;
  if (numero !== null && numero > credito.plazo) return null;
  const cuotaBase = centavos(credito.cuota > 0 ? credito.cuota : calculo.cuota);
  const capital = numero === credito.plazo ? saldo : Math.min(saldo, cuotaBase - interes - seguro);
  if (capital <= 0) return null;
  return {
    id: claveCuota(credito), numero, vencimiento: credito.proximoVencimiento,
    capital, interes, seguro, total: capital + interes + seguro, recibido: 0,
    estimada: !credito.planPagos, saldoInicial: saldo,
  };
}

export function situacionCuota(cuota, hoy = format(new Date(), 'yyyy-MM-dd')) {
  if (!cuota) return { estado: 'sin-datos', texto: 'Sin información suficiente', dias: 0 };
  if (cuota.recibido >= cuota.total) return { estado: 'pagada', texto: 'Pagada', dias: 0 };
  const dias = Math.max(0, differenceInCalendarDays(parseISO(hoy), parseISO(cuota.vencimiento)));
  return { estado: dias > 0 ? 'atrasado' : 'pendiente', texto: cuota.recibido > 0 ? `Pago parcial · ${dias > 0 ? 'Atrasada' : 'Pendiente'}` : dias > 0 ? 'Atrasada' : 'Pendiente', dias };
}

export function cuotasCredito(credito) {
  const previas = credito.cuotasRegistradas || [];
  const actual = cuotaActual(credito);
  return actual && !previas.some((c) => c.id === actual.id) ? [...previas, actual] : previas;
}

/** Transacción pura: importes en centavos, primero intereses, luego seguro y finalmente capital. */
export function aplicarPago(state, datos, empleado, hoy = format(new Date(), 'yyyy-MM-dd')) {
  const fail = (mensaje) => { throw new Error(mensaje); };
  if (!empleado?.activo || (!empleado.admin && !empleado.permisos?.includes('cartera'))) fail('La sesión no tiene permiso para registrar pagos.');
  if (typeof datos.id !== 'string' || !/^[\da-f-]{36}$/i.test(datos.id)) fail('Identificador de operación inválido.');
  if ((state.pagos || []).some((p) => p.id === datos.id)) fail('Este pago ya fue registrado.');
  const credito = state.solicitudes.find((a) => a.id === datos.creditoId);
  if (!credito || credito.estado !== 'desembolsado' || !(credito.saldo > 0)) fail('El crédito no está desembolsado y activo.');
  const cuota = cuotaActual(credito);
  if (!cuota) fail('Faltan datos para calcular la cuota. No se modificó el saldo.');
  const restante = cuota.total - cuota.recibido;
  if (datos.cuotaId !== cuota.id || datos.restanteEsperado !== restante || datos.saldoEsperado !== centavos(credito.saldo)) fail('El crédito cambió. Cerrá y volvé a abrir el formulario para revisar los importes.');
  if (typeof datos.importe !== 'number' || !Number.isFinite(datos.importe) || datos.importe <= 0 || Math.abs(datos.importe * 100 - centavos(datos.importe)) > 0.000001) fail('Ingresá un importe válido, mayor que cero y con hasta dos decimales.');
  const importe = centavos(datos.importe);
  if (!Number.isSafeInteger(importe) || importe > restante) fail('El importe no puede superar el pendiente de esta cuota. No se admiten anticipos de otras cuotas.');
  if (!fechaPagoValida(datos.fecha) || datos.fecha > hoy) fail('La fecha de pago debe ser válida y no futura.');
  const anteriores = (state.pagos || []).filter((p) => p.creditoId === credito.id);
  if (anteriores.some((p) => p.fecha > datos.fecha)) fail('La fecha no puede ser anterior a otro pago registrado de este crédito.');
  if (!['efectivo', 'transferencia', 'otro'].includes(datos.metodo)) fail('Seleccioná un método de pago válido.');
  if (typeof datos.observaciones !== 'string' || datos.observaciones.length > 500) fail('Las observaciones admiten hasta 500 caracteres.');
  if (cuota.estimada && datos.aceptaEstimacion !== true) fail('Debés aceptar la imputación estimada de este crédito sin historial.');
  const acumulado = cuota.recibido + importe;
  const interes = Math.min(acumulado, cuota.interes) - Math.min(cuota.recibido, cuota.interes);
  const seguro = Math.min(Math.max(0, acumulado - cuota.interes), cuota.seguro) - Math.min(Math.max(0, cuota.recibido - cuota.interes), cuota.seguro);
  const capital = importe - interes - seguro;
  const saldo = centavos(credito.saldo) - capital;
  if (saldo < 0) fail('El capital aplicado supera el saldo pendiente.');
  const actualizada = { ...cuota, recibido: acumulado };
  const completa = acumulado === cuota.total;
  const ancla = credito.anclaVencimientos || cuota.vencimiento;
  const pasos = (credito.mesesRegistrados || 0) + (completa ? 1 : 0);
  const siguiente = completa && saldo > 0 ? format(addMonths(parseISO(ancla), pasos), 'yyyy-MM-dd') : completa ? null : cuota.vencimiento;
  const creditoNuevo = {
    ...credito, saldo: pesos(saldo), saldoEstimado: cuota.estimada,
    cuotasRegistradas: [...(credito.cuotasRegistradas || []).filter((c) => c.id !== cuota.id), actualizada],
    proximoVencimiento: siguiente, anclaVencimientos: ancla, mesesRegistrados: pasos,
    estadoPago: saldo === 0 ? 'cancelado' : siguiente < hoy ? 'atrasado' : 'al_dia',
    ...(credito.planPagos && completa ? { planPagos: { ...credito.planPagos, siguiente: cuota.numero + 1 } } : {}),
  };
  const pago = {
    id: datos.id, creditoId: credito.id, cuotaId: cuota.id, numeroCuota: cuota.numero,
    vencimiento: cuota.vencimiento, fecha: datos.fecha, registradoEn: new Date().toISOString(),
    importe: pesos(importe), capitalAplicado: pesos(capital), intereses: pesos(interes), otrosConceptos: pesos(seguro),
    metodo: datos.metodo, observaciones: datos.observaciones.trim(), estimado: cuota.estimada,
    empleadoId: empleado.id, empleado: empleado.nombre,
  };
  return {
    ...state, pagos: [...(state.pagos || []), pago],
    solicitudes: state.solicitudes.map((a) => a.id === credito.id ? creditoNuevo : a),
  };
}

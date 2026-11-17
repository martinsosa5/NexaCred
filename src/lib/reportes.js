import { format } from 'date-fns';
import { centavos, cuotaActual, fechaPagoValida, situacionCuota } from './pagos.js';
import { historialCredito } from './historialPagos.js';

const comunes = [['credito', 'Crédito', 'texto'], ['cliente', 'Cliente', 'texto']];
export const TIPOS_REPORTE = {
  creditos_activos: { nombre: 'Créditos activos', total: 'Saldo de capital pendiente', campoTotal: 'saldo', columnas: [...comunes, ['monto', 'Monto original', 'importe'], ['plazo', 'Plazo (cuotas)', 'entero'], ['saldo', 'Saldo pendiente de capital', 'importe'], ['vencimiento', 'Próximo vencimiento', 'fecha'], ['estadoCredito', 'Estado del crédito', 'texto'], ['estadoPago', 'Estado del pago', 'texto'], ['dias', 'Días de atraso', 'entero'], ['origenSaldo', 'Origen del saldo', 'texto']] },
  cuotas_atrasadas: { nombre: 'Cuotas atrasadas', total: 'Importe vencido pendiente de cuotas', campoTotal: 'pendiente', columnas: [...comunes, ['numero', 'Número de cuota', 'entero'], ['vencimiento', 'Vencimiento', 'fecha'], ['importe', 'Importe de cuota', 'importe'], ['pagado', 'Importe pagado', 'importe'], ['pendiente', 'Importe pendiente', 'importe'], ['dias', 'Días de atraso', 'entero'], ['saldo', 'Saldo pendiente de capital del crédito', 'importe']] },
  proximos_vencimientos: { nombre: 'Próximos vencimientos', total: 'Importe de cuotas por vencer (no capital)', campoTotal: 'importe', columnas: [...comunes, ['numero', 'Número de cuota', 'entero'], ['vencimiento', 'Vencimiento', 'fecha'], ['importe', 'Monto de cuota', 'importe'], ['estadoPago', 'Estado', 'texto'], ['saldo', 'Saldo pendiente de capital del crédito', 'importe'], ['origenFecha', 'Origen del vencimiento', 'texto'], ['origenImporte', 'Origen del importe', 'texto']] },
  pagos_registrados: { nombre: 'Pagos registrados', total: 'Importe recibido (capital, interés y seguro)', campoTotal: 'importe', columnas: [['pago', 'Identificador del pago', 'texto'], ...comunes, ['numero', 'Número de cuota', 'entero'], ['fecha', 'Fecha del pago', 'fecha'], ['importe', 'Importe registrado', 'importe'], ['metodo', 'Método', 'texto'], ['capital', 'Capital aplicado', 'importe'], ['interes', 'Intereses', 'importe'], ['otros', 'Otros conceptos (seguro)', 'importe'], ['empleado', 'Empleado responsable', 'texto'], ['origen', 'Origen de la imputación', 'texto']] },
};

export function validarFiltrosReporte(config) {
  if (!TIPOS_REPORTE[config.tipo]) throw new Error('Seleccioná un tipo de reporte válido.');
  for (const valor of [config.desde, config.hasta]) if (valor && !fechaPagoValida(valor)) throw new Error('Ingresá fechas válidas.');
  if (config.desde && config.hasta && config.desde > config.hasta) throw new Error('La fecha desde no puede ser posterior a la fecha hasta.');
  if (config.tipo === 'proximos_vencimientos' && (!config.desde || !config.hasta)) throw new Error('Seleccioná ambas fechas para los próximos vencimientos.');
  if (!['todos', 'al_dia', 'atrasado', 'parcial'].includes(config.estado || 'todos')) throw new Error('Estado de pago inválido.');
  if (config.alcance === 'filtrados' && !Array.isArray(config.idsFiltrados)) throw new Error('No están disponibles los filtros de cartera.');
}

const datoNumero = (n) => Number.isFinite(n) ? n : null;
const datoFecha = (d) => fechaPagoValida(d) ? d : null;
const base = (a) => ({ credito: a.numero || `#${a.id}`, cliente: a.cliente || '', saldo: datoNumero(a.saldo) });
const periodo = (fecha, c) => (!c.desde && !c.hasta) || (fechaPagoValida(fecha) && (!c.desde || fecha >= c.desde) && (!c.hasta || fecha <= c.hasta));
const estadoCoincide = (estado, parcial, filtro) => !filtro || filtro === 'todos' || (filtro === 'parcial' ? parcial : filtro === 'al_dia' ? estado === 'pendiente' : estado === 'atrasado');

/** Selección sin escrituras; las proyecciones nunca se usan como prueba de deuda vencida. */
export function seleccionarRegistros({ solicitudes, pagos = [] }, config, hoy = format(new Date(), 'yyyy-MM-dd')) {
  validarFiltrosReporte(config);
  const creditos = solicitudes.filter((a) => (config.alcance !== 'filtrados' || config.idsFiltrados.includes(a.id)) && (!config.clienteId || String(a.id) === String(config.clienteId)));
  if (config.tipo === 'pagos_registrados') {
    const porId = new Map(creditos.map((a) => [a.id, a]));
    return pagos.filter((p) => (porId.has(p.creditoId) || (config.alcance !== 'filtrados' && !config.clienteId && !solicitudes.some((a) => a.id === p.creditoId))) && periodo(p.fecha, config)).map((p) => ({
      ...base(porId.get(p.creditoId) || { id: p.creditoId }), pago: p.id, numero: p.numeroCuota, fecha: datoFecha(p.fecha), importe: datoNumero(p.importe),
      metodo: ({ efectivo: 'Efectivo', transferencia: 'Transferencia', otro: 'Otro' })[p.metodo] || '', capital: datoNumero(p.capitalAplicado), interes: datoNumero(p.intereses), otros: datoNumero(p.otrosConceptos), empleado: p.empleado || '', origen: p.estimado ? 'Estimada' : 'Registrada',
    }));
  }
  const activos = creditos.filter((a) => a.estado === 'desembolsado' && a.saldo > 0);
  if (config.tipo === 'creditos_activos') return activos.flatMap((a) => {
    const cuota = cuotaActual(a); const situacion = situacionCuota(cuota, hoy);
    if (!periodo(a.proximoVencimiento, config) || !estadoCoincide(situacion.estado, cuota?.recibido > 0, config.estado)) return [];
    return [{ ...base(a), monto: datoNumero(a.monto), plazo: datoNumero(a.plazo), vencimiento: datoFecha(a.proximoVencimiento), estadoCredito: 'Desembolsado', estadoPago: situacion.texto, dias: cuota ? situacion.dias : null, origenSaldo: a.saldoEstimado ? 'Estimado' : 'Registrado' }];
  });
  return activos.flatMap((a) => historialCredito(a, pagos, hoy).cuotas.flatMap((cuota) => {
    if (!periodo(cuota.vencimiento, config) || !estadoCoincide(cuota.estado, cuota.parcial, config.estado)) return [];
    if (config.tipo === 'cuotas_atrasadas') {
      if (cuota.proyeccion || cuota.estimada || cuota.estado !== 'atrasado' || !(cuota.pendiente > 0)) return [];
      return [{ ...base(a), numero: cuota.numero, vencimiento: cuota.vencimiento, importe: cuota.total / 100, pagado: cuota.recibido / 100, pendiente: cuota.pendiente / 100, dias: cuota.dias }];
    }
    if (!fechaPagoValida(cuota.vencimiento) || cuota.vencimiento < hoy || cuota.estado === 'pagada' || (cuota.proyeccion && !config.incluirEstimaciones)) return [];
    const monto = cuota.total == null || (cuota.estimada && !config.incluirEstimaciones) ? null : cuota.total / 100;
    return [{ ...base(a), numero: cuota.numero, vencimiento: cuota.vencimiento, importe: monto, estadoPago: cuota.texto, origenFecha: cuota.proyeccion ? 'Estimada (proyección)' : 'Registrado', origenImporte: monto == null ? 'No verificable; no incluido' : cuota.estimada || cuota.proyeccion ? 'Estimado' : 'Registrado / cálculo del plan' }];
  }));
}

export function resumenReporte(tipo, filas) {
  const definicion = TIPOS_REPORTE[tipo];
  const completo = filas.every((f) => Number.isFinite(f[definicion.campoTotal]));
  return { cantidad: filas.length, etiquetaTotal: definicion.total, total: completo ? filas.reduce((s, f) => s + centavos(f[definicion.campoTotal]), 0) / 100 : null };
}

/** Las columnas tipadas mantienen números reales separados de texto no confiable. */
export function formatearCSV(columnas, filas) {
  const escapar = (valor, tipo = 'texto') => {
    let texto = '';
    if (valor != null) {
      if (tipo === 'importe') texto = Number.isFinite(valor) ? valor.toFixed(2).replace('.', ',') : '';
      else if (tipo === 'entero') texto = Number.isInteger(valor) ? String(valor) : '';
      else if (tipo === 'fecha') texto = fechaPagoValida(valor) ? `${valor.slice(8, 10)}/${valor.slice(5, 7)}/${valor.slice(0, 4)}` : '';
      else {
        texto = String(valor);
        let inicio = 0;
        while (inicio < texto.length && (/\s/u.test(texto[inicio]) || texto.charCodeAt(inicio) < 32)) inicio++;
        if (['=', '+', '-', '@'].includes(texto[inicio]) || ['\t', '\r', '\n'].includes(texto[0])) texto = "'" + texto;
      }
    }
    return `"${texto.replaceAll('"', '""')}"`;
  };
  return '\uFEFF' + [columnas.map(([, titulo]) => escapar(titulo)).join(';'), ...filas.map((f) => columnas.map(([campo, , tipo]) => escapar(f[campo], tipo)).join(';'))].join('\r\n') + '\r\n';
}

export function prepararReporte(state, config, hoy = format(new Date(), 'yyyy-MM-dd')) {
  const filas = seleccionarRegistros(state, config, hoy);
  return { filas, ...resumenReporte(config.tipo, filas), nombre: TIPOS_REPORTE[config.tipo].nombre, archivo: `nexacred_${config.tipo}_${hoy}.csv`, columnas: TIPOS_REPORTE[config.tipo].columnas };
}

export function descargarReporteCSV(reporte) {
  if (!reporte.filas.length) throw new Error('No hay registros para exportar con estos filtros.');
  const url = URL.createObjectURL(new Blob([formatearCSV(reporte.columnas, reporte.filas)], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  try { enlace.href = url; enlace.download = reporte.archivo; document.body.appendChild(enlace); enlace.click(); }
  finally { enlace.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

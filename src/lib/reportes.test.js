import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarPago, centavos, cuotaActual } from './pagos.js';
import { descargarReporteCSV, formatearCSV, prepararReporte, seleccionarRegistros, TIPOS_REPORTE } from './reportes.js';

const hoy = '2026-11-16';
const credito = (extra = {}) => ({ id: 1, cliente: 'Cliente ficticio Álvarez; "SRL"', estado: 'desembolsado', monto: 100000, saldo: 100000, plazo: 6, planPagos: { siguiente: 1 }, proximoVencimiento: '2026-11-07', dni: 'dato-confidencial-dni', codigoConsulta: 'codigo-privado', email: 'privado@example.test', ...extra });
const config = (tipo, extra = {}) => ({ tipo, desde: '', hasta: '', estado: 'todos', alcance: 'todos', ...extra });
const reporte = (s, tipo, extra) => prepararReporte(s, config(tipo, extra), hoy);
const pagar = (s, importe) => {
  const a = s.solicitudes[0]; const c = cuotaActual(a);
  return aplicarPago(s, { id: crypto.randomUUID(), creditoId: a.id, cuotaId: c.id, restanteEsperado: c.total - c.recibido, saldoEsperado: centavos(a.saldo), importe: importe ?? (c.total - c.recibido) / 100, fecha: hoy, metodo: 'efectivo', observaciones: 'Observación privada no exportable' }, { id: 1, nombre: 'Empleado ficticio', activo: true, admin: true }, hoy);
};
test('créditos activos: solo desembolsados con saldo, fechas/cliente/estado/alcance y sin mutar datos', () => {
  const s = { solicitudes: [credito(), credito({ id: 2, proximoVencimiento: '2026-12-01' }), credito({ id: 3, estado: 'rechazado' }), credito({ id: 4, saldo: 0 })] };
  const antes = JSON.stringify(s);
  assert.equal(reporte(s, 'creditos_activos').cantidad, 2);
  assert.equal(reporte(s, 'creditos_activos').total, 200000);
  assert.equal(reporte(s, 'creditos_activos', { desde: '2026-12-01' }).cantidad, 1);
  assert.equal(reporte(s, 'creditos_activos', { clienteId: '1', estado: 'atrasado' }).cantidad, 1);
  assert.equal(reporte(s, 'creditos_activos', { alcance: 'filtrados', idsFiltrados: [2] }).filas[0].credito, '#2');
  assert.equal(reporte(s, 'creditos_activos', { alcance: 'filtrados', idsFiltrados: [] }).cantidad, 0);
  assert.equal(JSON.stringify(s), antes);
});
test('atrasos: excluye estimaciones/proyecciones y refleja abonos reales con deuda restante', () => {
  let s = { solicitudes: [credito(), credito({ id: 2, planPagos: undefined, saldo: 50000 })] };
  const inicial = reporte(s, 'cuotas_atrasadas');
  assert.equal(inicial.cantidad, 1); assert.equal(inicial.filas[0].dias, 9);
  s = pagar(s, 1);
  const parcial = reporte(s, 'cuotas_atrasadas', { estado: 'parcial' });
  assert.equal(parcial.filas[0].pagado, 1);
  assert.equal(centavos(parcial.filas[0].pendiente), centavos(inicial.filas[0].importe) - 100);
  s = pagar(s);
  assert.equal(reporte(s, 'cuotas_atrasadas').cantidad, 0);
});
test('próximos: distingue fecha registrada, importe estimado y proyecciones; no incluye pagadas o fechas pasadas', () => {
  const s = { solicitudes: [credito({ proximoVencimiento: '2026-11-20' }), credito({ id: 2, planPagos: undefined, proximoVencimiento: '2026-11-21' })] };
  const periodo = { desde: '2026-11-01', hasta: '2027-12-31' };
  const sin = reporte(s, 'proximos_vencimientos', periodo);
  assert.equal(sin.cantidad, 2); assert.equal(sin.filas[1].importe, null); assert.equal(sin.total, null);
  assert.equal(sin.filas[1].origenFecha, 'Registrado');
  const con = reporte(s, 'proximos_vencimientos', { ...periodo, incluirEstimaciones: true });
  assert.equal(con.cantidad, 7); assert.equal(con.filas.filter(f => f.origenFecha.includes('proyección')).length, 5);
  assert.ok(con.filas.every(f => f.importe > 0));
  const antes = { solicitudes: [credito()] };
  assert.equal(reporte(antes, 'proximos_vencimientos', { desde: '2026-11-01', hasta: '2026-11-30' }).cantidad, 0);
});
test('pagos: exclusivamente operaciones registradas, importes consistentes, fechas y cliente', () => {
  let s = { solicitudes: [credito()] }; s = pagar(s, 1); s = pagar(s, 2);
  const r = reporte(s, 'pagos_registrados');
  assert.equal(r.cantidad, 2); assert.equal(r.total, 3);
  assert.equal(r.filas[0].empleado, 'Empleado ficticio');
  assert.equal(reporte(s, 'pagos_registrados', { hasta: '2026-11-15' }).cantidad, 0);
  assert.equal(reporte(s, 'pagos_registrados', { clienteId: 999 }).cantidad, 0);
  const csv = formatearCSV(r.columnas, r.filas);
  for (const privado of ['dato-confidencial-dni', 'codigo-privado', 'privado@example.test', 'Observación privada no exportable']) assert.equal(csv.includes(privado), false);
});
test('CSV: BOM, punto y coma, acentos, comillas, saltos, decimales argentinos y fechas', () => {
  const columnas = [['cliente', 'Cliente', 'texto'], ['importe', 'Importe', 'importe'], ['fecha', 'Fecha', 'fecha'], ['n', 'Cuota', 'entero']];
  const csv = formatearCSV(columnas, [{ cliente: 'Álvarez; "SRL"\nSucursal', importe: 1234.56, fecha: hoy, n: null }]);
  assert.equal(csv, '\uFEFF"Cliente";"Importe";"Fecha";"Cuota"\r\n"Álvarez; ""SRL""\nSucursal";"1234,56";"16/11/2026";""\r\n');
});
test('pagos con crédito no disponible se conservan al exportar todos, sin inventar cliente ni desglose', () => {
  const s = { solicitudes: [], pagos: [{ id: 'operacion-existente', creditoId: 99, fecha: hoy, importe: 10 }] };
  const r = reporte(s, 'pagos_registrados');
  assert.equal(r.cantidad, 1); assert.equal(r.total, 10); assert.equal(r.filas[0].cliente, '');
  assert.equal(r.filas[0].capital, null); assert.equal(r.filas[0].credito, '#99');
  assert.equal(reporte(s, 'pagos_registrados', { alcance: 'filtrados', idsFiltrados: [] }).cantidad, 0);
});
test('neutraliza fórmulas incluso con espacios o controles; no altera números tipados', () => {
  for (const valor of ['=1+1', '+SUM(A1)', '-1+1', '@SUM(A1)', '  =2', '\t=2', '\r=2', '\n=2', '\u0000=2']) {
    const csv = formatearCSV([['v', 'Texto', 'texto']], [{ v: valor }]);
    assert.ok(csv.includes('"\'' + valor.replaceAll('"', '""') + '"'));
  }
  assert.ok(formatearCSV([['v', 'Importe', 'importe']], [{ v: -1 }]).includes('"-1,00"'));
});
test('fechas inválidas o invertidas se rechazan; vacíos no se inventan y no se descarga archivo vacío', () => {
  const s = { solicitudes: [credito({ monto: undefined, plazo: undefined, proximoVencimiento: undefined })] };
  const r = reporte(s, 'creditos_activos');
  assert.equal(r.filas[0].monto, null); assert.equal(r.filas[0].plazo, null); assert.equal(r.filas[0].vencimiento, null);
  for (const desde of ['2026-02-30', 'fecha inválida']) assert.throws(() => seleccionarRegistros(s, config('creditos_activos', { desde })), /fechas válidas/);
  assert.throws(() => reporte(s, 'pagos_registrados', { desde: '2026-12-01', hasta: '2026-11-01' }), /posterior/);
  assert.throws(() => reporte(s, 'proximos_vencimientos'), /ambas fechas/);
  assert.throws(() => descargarReporteCSV({ filas: [] }), /No hay registros/);
  assert.equal(r.archivo, `nexacred_creditos_activos_${hoy}.csv`);
  assert.equal(Object.keys(TIPOS_REPORTE).length, 4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { historialCredito, filtrarHistorial } from './historialPagos.js';
import { aplicarPago, centavos, cuotaActual } from './pagos.js';

const hoy = '2026-11-16';
const empleado = { id: 1, nombre: 'Persona ficticia', activo: true, admin: true };
const credito = (extra = {}) => ({ id: 11, cliente: 'Cliente ficticio', monto: 250000, plazo: 12, saldo: 160000, estado: 'desembolsado', proximoVencimiento: '2026-11-07', ...extra });
const pagar = (state, importe) => {
  const a = state.solicitudes[0]; const c = cuotaActual(a);
  return aplicarPago(state, { id: crypto.randomUUID(), creditoId: a.id, cuotaId: c.id, restanteEsperado: c.total - c.recibido, saldoEsperado: centavos(a.saldo), fecha: hoy, importe: importe ?? (c.total - c.recibido) / 100, metodo: 'efectivo', observaciones: 'Prueba ficticia', aceptaEstimacion: true }, empleado, hoy);
};
test('crédito antiguo: solo próximo vencimiento, cero pagos verificables y sin inventar numeración', () => {
  const a = credito(); const antes = JSON.stringify(a); const h = historialCredito(a, [], hoy);
  assert.equal(h.incompleto, true); assert.equal(h.cuotas.length, 1);
  assert.equal(h.cuotas[0].numero, null); assert.equal(h.cuotas[0].estimada, true);
  assert.equal(h.pagadas, 0); assert.equal(h.totalRegistrado, 0); assert.equal(h.atrasadas, 1);
  assert.equal(JSON.stringify(a), antes);
});
test('varios pagos parciales de la misma cuota se conservan y los importes coinciden con el registro', () => {
  let s = { solicitudes: [credito()] };
  s = pagar(s, 1); s = pagar(s, 2);
  let h = historialCredito(s.solicitudes[0], s.pagos, hoy);
  assert.equal(h.parciales, 1); assert.equal(h.atrasadas, 1); assert.equal(h.pagadas, 0);
  assert.equal(h.totalRegistrado, 300); assert.equal(h.cuotas[0].recibido, 300);
  assert.equal(h.cuotas[0].movimientos.length, 2); assert.equal(h.cuotas[0].ultimoPago, hoy);
  assert.equal(h.cuotas[0].pendiente, h.cuotas[0].total - 300);
  const vieja = h.cuotas[0].id;
  s = pagar(s); h = historialCredito(s.solicitudes[0], s.pagos, hoy);
  assert.equal(h.pagadas, 1); assert.equal(h.pendientes, 1); assert.equal(h.atrasadas, 0);
  assert.equal(h.cuotas.find(c => c.id === vieja).movimientos.length, 3);
  assert.equal(h.totalRegistrado, s.pagos.reduce((v, p) => v + centavos(p.importe), 0));
  assert.equal(centavos(s.solicitudes[0].saldo), 16000000 - s.pagos.reduce((v, p) => v + centavos(p.capitalAplicado), 0));
  assert.deepEqual(historialCredito(JSON.parse(JSON.stringify(s)).solicitudes[0], JSON.parse(JSON.stringify(s.pagos)), hoy), h);
});
test('cronograma nuevo proyecta sin movimientos, respeta plazo y fin de mes y coincide con la próxima cuota real', () => {
  let s = { solicitudes: [credito({ saldo: 250000, planPagos: { siguiente: 1 }, proximoVencimiento: '2026-01-31' })] };
  s = pagar(s, 20000);
  const antes = JSON.stringify(s); const h = historialCredito(s.solicitudes[0], s.pagos, hoy);
  assert.equal(h.cuotas.length, 12); assert.equal(h.cuotas.filter(c => c.proyeccion).length, 11);
  assert.equal(h.cuotas[1].vencimiento, '2026-02-28'); assert.equal(h.cuotas[2].vencimiento, '2026-03-31');
  assert.equal(h.cuotas[1].movimientos.length, 0); assert.equal(h.cuotas[1].recibido, 0);
  assert.equal(h.pagadas, 0); assert.equal(JSON.stringify(s), antes);
  s = pagar(s);
  const real = cuotaActual(s.solicitudes[0]);
  assert.equal(real.total, h.cuotas[1].total); assert.equal(real.capital, h.cuotas[1].capital);
  assert.equal(real.vencimiento, h.cuotas[1].vencimiento);
});
test('filtros incluyen pagos parciales tanto pendientes como atrasados sin modificar filas', () => {
  const filas = [{ estado: 'pagada' }, { estado: 'pendiente', parcial: true }, { estado: 'atrasado', parcial: true }, { estado: 'pendiente' }];
  assert.equal(filtrarHistorial(filas, 'todas').length, 4);
  assert.equal(filtrarHistorial(filas, 'pagada').length, 1);
  assert.equal(filtrarHistorial(filas, 'pendiente').length, 2);
  assert.equal(filtrarHistorial(filas, 'atrasado').length, 1);
  assert.equal(filtrarHistorial(filas, 'parciales').length, 2);
});
test('solo los pagos de este crédito verifican cuotas; etiquetas o acumulados aislados no inventan pagos', () => {
  const a = credito(); const c = cuotaActual(a);
  a.cuotasRegistradas = [{ ...c, recibido: c.total }];
  const h = historialCredito(a, [{ creditoId: 99, cuotaId: c.id, importe: c.total / 100, fecha: hoy }], hoy);
  assert.equal(h.totalRegistrado, 0); assert.equal(h.pagadas, 0); assert.equal(h.operaciones.length, 0);
  assert.equal(h.cuotas[0].recibido, 0);
});
test('sin datos suficientes conserva la fecha conocida y operaciones huérfanas sin reconstruir cuotas', () => {
  const a = credito({ plazo: 13 });
  const pago = { id: 'pago-antiguo', creditoId: a.id, cuotaId: 'no-disponible', importe: 123.45, fecha: hoy };
  const h = historialCredito(a, [pago], hoy);
  assert.equal(h.cuotas[0].estado, 'sin-datos'); assert.equal(h.cuotas[0].total, null);
  assert.equal(h.cuotas[0].vencimiento, '2026-11-07'); assert.equal(h.totalRegistrado, 12345);
  assert.equal(h.operacionesSinCuota.length, 1);
});
test('préstamo cancelado conserva las cuotas y pagos, sin proyecciones adicionales', () => {
  let s = { solicitudes: [credito({ saldo: 250000, planPagos: { siguiente: 1 } })] };
  for (let n = 0; n < 12; n++) s = pagar(s);
  const h = historialCredito(s.solicitudes[0], s.pagos, hoy);
  assert.equal(h.pagadas, 12); assert.equal(h.pendientes, 0); assert.equal(h.atrasadas, 0);
  assert.equal(h.operaciones.length, 12); assert.equal(h.cuotas.length, 12);
  assert.equal(h.cuotas.some(c => c.proyeccion), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { aplicarPago, centavos, cuotaActual, cuotasCredito, situacionCuota } from './pagos.js';

const empleado = { id: 1, nombre: 'Empleado ficticio', activo: true, permisos: ['cartera'] };
const credito = (extra = {}) => ({ id: 11, cliente: 'Cliente ficticio', monto: 250000, plazo: 12, saldo: 160000, estado: 'desembolsado', proximoVencimiento: '2026-11-07', ...extra });
const estado = (extra) => ({ solicitudes: [credito(extra), { id: 99, estado: 'rechazado' }], empleados: [empleado], actividad: [], datoExistente: 'preservado' });
function datos(s, extra = {}) {
  const a = s.solicitudes[0];
  const c = cuotaActual(a);
  return { id: crypto.randomUUID(), creditoId: a.id, cuotaId: c?.id, restanteEsperado: c ? c.total - c.recibido : 0, saldoEsperado: centavos(a.saldo), fecha: '2026-11-16', importe: c ? (c.total - c.recibido) / 100 : 1, metodo: 'efectivo', observaciones: '', aceptaEstimacion: true, ...extra };
}
const pagar = (s, d = datos(s), actor = empleado) => aplicarPago(s, d, actor, '2026-11-16');

test('pago completo conserva datos, separa conceptos, avanza fecha y mantiene cuota pagada', () => {
  const s = estado(); const antes = JSON.stringify(s); const c = cuotaActual(s.solicitudes[0]);
  const next = pagar(s);
  assert.equal(JSON.stringify(s), antes);
  assert.equal(next.datoExistente, 'preservado');
  assert.deepEqual(next.solicitudes[1], s.solicitudes[1]);
  assert.equal(centavos(next.solicitudes[0].saldo), 16000000 - c.capital);
  assert.equal(next.solicitudes[0].proximoVencimiento, '2026-12-07');
  assert.equal(next.pagos[0].empleadoId, 1);
  assert.equal(centavos(next.pagos[0].importe), c.capital + c.interes + c.seguro);
  assert.equal(situacionCuota(cuotasCredito(next.solicitudes[0])[0]).estado, 'pagada');
  assert.equal(cuotasCredito(JSON.parse(JSON.stringify(next)).solicitudes[0]).length, 2);
});

test('pagos parciales no duplican intereses ni adelantan vencimientos', () => {
  const s = estado(); const c = cuotaActual(s.solicitudes[0]);
  const parcial = pagar(s, datos(s, { importe: 1 }));
  assert.equal(parcial.solicitudes[0].saldo, 160000);
  assert.equal(parcial.solicitudes[0].proximoVencimiento, '2026-11-07');
  assert.match(situacionCuota(cuotaActual(parcial.solicitudes[0]), '2026-11-16').texto, /Pago parcial/);
  const next = pagar(parcial);
  assert.equal(centavos(next.solicitudes[0].saldo), 16000000 - c.capital);
  assert.equal(next.pagos.reduce((v, p) => v + centavos(p.intereses), 0), c.interes);
  assert.equal(next.pagos.reduce((v, p) => v + centavos(p.capitalAplicado), 0), c.capital);
});

test('rechaza duplicados, datos desactualizados, importes inválidos y operaciones no autorizadas', () => {
  const s = estado(); const d = datos(s); const next = pagar(s, d);
  assert.throws(() => pagar(next, d), /ya fue registrado/);
  assert.throws(() => pagar(next, { ...d, id: crypto.randomUUID() }), /crédito cambió/);
  for (const importe of [-1, 0, NaN, Infinity, 0.001, 999999999]) assert.throws(() => pagar(s, datos(s, { importe })));
  assert.throws(() => pagar(s, datos(s), { ...empleado, permisos: [] }), /permiso/);
  assert.throws(() => pagar(estado({ estado: 'rechazado' })), /activo/);
  assert.throws(() => pagar(s, datos(s, { creditoId: 99 })), /activo/);
  assert.throws(() => pagar(s, datos(s, { fecha: '2026-02-30' })), /fecha/);
  assert.throws(() => pagar(s, datos(s, { fecha: '2026-11-17' })), /fecha/);
  assert.throws(() => pagar(s, datos(s, { aceptaEstimacion: false })), /estimada/);
  assert.throws(() => pagar(s, datos(s, { metodo: 'desconocido' })), /método/);
});

test('las fechas y pagos determinan estados, sin etiquetas manuales', () => {
  assert.equal(situacionCuota(cuotaActual(credito({ estadoPago: 'al_dia' })), '2026-11-16').estado, 'atrasado');
  assert.equal(situacionCuota(cuotaActual(credito({ proximoVencimiento: '2026-11-20', estadoPago: 'atrasado' })), '2026-11-16').estado, 'pendiente');
  assert.equal(cuotaActual(credito({ plazo: 13 })), null);
  assert.equal(cuotaActual(credito({ proximoVencimiento: null })), null);
});

test('fin de mes mantiene el ancla original: 31 enero → 28 febrero → 31 marzo', () => {
  let s = estado({ proximoVencimiento: '2026-01-31' });
  s = pagar(s);
  assert.equal(s.solicitudes[0].proximoVencimiento, '2026-02-28');
  s = pagar(s);
  assert.equal(s.solicitudes[0].proximoVencimiento, '2026-03-31');
});

test('un crédito nuevo respeta plazo, termina sin saldo negativo y conserva todas sus cuotas', () => {
  let s = estado({ saldo: 250000, planPagos: { siguiente: 1 }, proximoVencimiento: '2025-01-31' });
  let capital = 0;
  for (let i = 1; i <= 12; i++) {
    const c = cuotaActual(s.solicitudes[0]);
    assert.equal(c.numero, i); assert.equal(c.estimada, false);
    s = pagar(s); capital += centavos(s.pagos.at(-1).capitalAplicado);
  }
  assert.equal(capital, 25000000);
  assert.equal(s.solicitudes[0].saldo, 0);
  assert.equal(s.solicitudes[0].proximoVencimiento, null);
  assert.equal(cuotasCredito(s.solicitudes[0]).length, 12);
  assert.equal(cuotaActual(s.solicitudes[0]), null);
  assert.throws(() => pagar(s), /activo/);
});

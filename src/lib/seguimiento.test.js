import test from 'node:test';
import assert from 'node:assert/strict';
import { consultarSolicitud, generarCodigoConsulta, registrarCambioSeguimiento } from './seguimiento.js';

const codigo = '01234567-89ABCDEF-01234567-89ABCDEF';
const solicitud = (extra = {}) => ({
  id: 13, numero: 'NC-2026-00013', origen: 'portal', codigoConsulta: codigo,
  estado: 'pendiente', fecha: '2026-11-16', actualizadaEn: '2026-11-16T12:00:00.000Z',
  seguimientoEventos: [{ estado: 'pendiente', fecha: '2026-11-16T12:00:00.000Z' }],
  cliente: 'Persona ficticia', dni: '00000000', email: 'ficticio@example.test', tel: '0000000000',
  docs: ['documento-ficticio.pdf'], score: 999, monto: 100000, ingreso: 999999, por: 'Empleado privado',
  ...extra,
});
const consultar = (a) => consultarSolicitud([a], a.numero, codigo);

test('genera códigos de 128 bits con formato independiente y sin repeticiones en la muestra', () => {
  const codigos = Array.from({ length: 50 }, () => generarCodigoConsulta());
  assert.equal(new Set(codigos).size, 50);
  assert.ok(codigos.every((c) => /^[\dA-F]{8}(?:-[\dA-F]{8}){3}$/.test(c)));
});
test('requiere ambos datos; no permite consultas por nombre, DNI, código ajeno o solicitudes antiguas', () => {
  const a = solicitud();
  for (const [numero, privado] of [[a.numero, ''], ['', codigo], [a.cliente, codigo], [a.dni, codigo], [a.numero, 'FFFFFFFF-FFFFFFFF-FFFFFFFF-FFFFFFFF'], ['NC-2026-99999', codigo]]) assert.equal(consultarSolicitud([a], numero, privado), null);
  assert.equal(consultar(solicitud({ codigoConsulta: undefined })), null);
  assert.equal(consultar(solicitud({ origen: 'manual' })), null);
  assert.equal(consultarSolicitud([a], ` ${a.numero.toLowerCase()} `, ` ${codigo.toLowerCase()} `).numero, a.numero);
});
test('devuelve exclusivamente una ficha pública sin datos personales, financieros ni código', () => {
  const a = solicitud(); const antes = JSON.stringify(a); const r = consultar(a);
  assert.deepEqual(Object.keys(r).sort(), ['numero', 'fechaPresentacion', 'ultimaActualizacion', 'estado', 'etapas'].sort());
  for (const secreto of [codigo, a.cliente, a.dni, a.email, a.tel, a.docs[0], a.por]) assert.equal(JSON.stringify(r).includes(secreto), false);
  assert.equal(r.estado.titulo, 'Solicitud recibida'); assert.equal(r.etapas.length, 1);
  assert.equal(JSON.stringify(a), antes);
});
test('aprobación registra la decisión y deja verificación pendiente, sin inventar evaluación', () => {
  const a = solicitud(); const cambio = registrarCambioSeguimiento(a, 'aprobado', '2026-11-16T13:00:00.000Z');
  const r = consultar({ ...a, estado: 'aprobado', ...cambio });
  assert.equal(r.estado.titulo, 'Aprobada'); assert.equal(r.ultimaActualizacion, '2026-11-16T13:00:00.000Z');
  assert.deepEqual(r.etapas.map((e) => e.titulo), ['Solicitud recibida', 'Aprobada', 'Verificación presencial']);
  assert.equal(r.etapas.at(-1).situacion, 'pendiente'); assert.equal(r.etapas.at(-1).fecha, null);
  assert.equal(r.etapas.some((e) => /Evaluación|Desembolsada/.test(e.titulo)), false);
});
test('rechazo no presenta verificación ni desembolso', () => {
  const a = solicitud(); const cambio = registrarCambioSeguimiento(a, 'rechazado', '2026-11-16T13:00:00.000Z');
  const r = consultar({ ...a, estado: 'rechazado', ...cambio });
  assert.equal(r.estado.titulo, 'Rechazada');
  assert.deepEqual(r.etapas.map((e) => e.titulo), ['Solicitud recibida', 'Rechazada']);
});
test('desembolso muestra verificación completada solo con respaldo, sin revelar firma', () => {
  const a = solicitud({ estado: 'aprobado' });
  const cambio = registrarCambioSeguimiento(a, 'desembolsado', '2026-11-16T14:00:00.000Z');
  const r = consultar({ ...a, estado: 'desembolsado', ...cambio, terminosAceptados: true, firma: 'firma-privada' });
  assert.equal(r.estado.titulo, 'Desembolsada');
  assert.equal(r.etapas.find((e) => e.titulo === 'Verificación presencial').situacion, 'completada');
  assert.equal(r.etapas.find((e) => e.titulo === 'Verificación presencial').fecha, null);
  assert.equal(JSON.stringify(r).includes('firma-privada'), false);
  const sinFirma = consultar({ ...a, estado: 'desembolsado', ...cambio });
  assert.equal(sinFirma.etapas.some((e) => e.titulo === 'Verificación presencial'), false);
});
test('no duplica cambios ni migra solicitudes antiguas; fechas y estados desconocidos no se inventan', () => {
  assert.deepEqual(registrarCambioSeguimiento(solicitud(), 'pendiente'), {});
  assert.deepEqual(registrarCambioSeguimiento(solicitud({ codigoConsulta: undefined }), 'aprobado'), {});
  const r = consultar(solicitud({ estado: 'aprobado', seguimientoEventos: undefined, actualizadaEn: undefined }));
  assert.equal(r.ultimaActualizacion, null); assert.equal(r.etapas[1].fecha, null);
  assert.equal(consultar(solicitud({ estado: 'interno_desconocido' })).estado.titulo, 'Estado no disponible');
});

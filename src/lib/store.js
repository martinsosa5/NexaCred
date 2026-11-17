/* =========================================================
   Store de la demo.
   Guarda solicitudes, créditos y actividad en localStorage para que lo que
   se cargue en el portal público aparezca en el panel de administración
   (incluso entre pestañas). En el sistema real esto es la API + PostgreSQL.
   ========================================================= */
import { useSyncExternalStore } from 'react';
import { addDays, format, subDays, subHours } from 'date-fns';
import { calcular, scoreInicial } from './finanzas';
import { aplicarPago } from './pagos';
import { generarCodigoConsulta, registrarCambioSeguimiento } from './seguimiento';

const KEY = 'nexacred-demo-v3';

const d = (n) => format(addDays(new Date(), n), 'yyyy-MM-dd');
const ago = (h) => subHours(new Date(), h).toISOString();
const TODOS = ['panel', 'solicitudes', 'decidir', 'scoring', 'verificacion', 'cartera'];

const seed = () => ({
  nextId: 13,
  nextEmp: 5,
  empleados: [
    { id: 1, nombre: 'Admin NexaCred', email: 'admin@nexacred.com', password: 'demo1234', rol: 'Administrador general', permisos: TODOS, admin: true, activo: true },
    { id: 2, nombre: 'Lucía Paredes', email: 'lucia@nexacred.com', password: 'empleado123', rol: 'Oficial de crédito', permisos: ['panel', 'solicitudes', 'decidir', 'scoring'], activo: true },
    { id: 3, nombre: 'Julián Roldán', email: 'julian@nexacred.com', password: 'empleado123', rol: 'Oficial de sucursal', permisos: ['solicitudes', 'verificacion'], activo: true },
    { id: 4, nombre: 'Carolina Vega', email: 'carolina@nexacred.com', password: 'empleado123', rol: 'Analista de cobranzas', permisos: ['panel', 'cartera'], activo: true },
  ],
  solicitudes: [
    { id: 1, cliente: 'Mariana Fernández', monto: 450000, plazo: 24, score: 712, fecha: d(-3), estado: 'aprobado', por: 'Lucía Paredes' },
    { id: 2, cliente: 'Comercial Rioja S.A.', monto: 1200000, plazo: 36, score: 640, fecha: d(-2), estado: 'pendiente' },
    { id: 3, cliente: 'Lucas Gómez', monto: 280000, plazo: 12, score: 588, fecha: d(-2), estado: 'rechazado', por: 'Lucía Paredes' },
    { id: 4, cliente: 'Norma Aguirre', monto: 860000, plazo: 24, score: 701, fecha: d(-120), estado: 'desembolsado', saldo: 540000, estadoPago: 'al_dia', proximoVencimiento: d(9), terminosAceptados: true },
    { id: 5, cliente: 'Distribuidora Sur SRL', monto: 2100000, plazo: 36, score: 655, fecha: d(-1), estado: 'pendiente' },
    { id: 6, cliente: 'J. Pérez', monto: 320000, plazo: 12, score: 615, fecha: d(-170), estado: 'desembolsado', saldo: 198000, estadoPago: 'atrasado', proximoVencimiento: d(-35), terminosAceptados: true },
    { id: 7, cliente: 'L. Ibáñez', monto: 500000, plazo: 24, score: 690, fecha: d(-140), estado: 'desembolsado', saldo: 410000, estadoPago: 'al_dia', proximoVencimiento: d(12), terminosAceptados: true },
    { id: 8, cliente: 'Ana Quiroga', monto: 650000, plazo: 24, score: 735, fecha: d(-90), estado: 'desembolsado', saldo: 520000, estadoPago: 'al_dia', proximoVencimiento: d(5), terminosAceptados: true },
    { id: 9, cliente: 'Ricardo Salas', monto: 400000, plazo: 18, score: 668, fecha: d(-60), estado: 'desembolsado', saldo: 350000, estadoPago: 'al_dia', proximoVencimiento: d(18), terminosAceptados: true },
    { id: 10, cliente: 'Panadería Los Andes', monto: 1500000, plazo: 36, score: 720, fecha: d(-200), estado: 'desembolsado', saldo: 1100000, estadoPago: 'al_dia', proximoVencimiento: d(3), terminosAceptados: true },
    { id: 11, cliente: 'Silvia Medina', monto: 250000, plazo: 12, score: 602, fecha: d(-100), estado: 'desembolsado', saldo: 160000, estadoPago: 'atrasado', proximoVencimiento: d(-9), terminosAceptados: true },
    { id: 12, cliente: 'Carlos Díaz', monto: 700000, plazo: 24, score: 698, fecha: d(-75), estado: 'desembolsado', saldo: 610000, estadoPago: 'al_dia', proximoVencimiento: d(22), terminosAceptados: true },
  ],
  actividad: [
    { icon: 'thumbs-up', text: 'Solicitud de Mariana Fernández aprobada, pendiente de verificación presencial', at: ago(20), by: 'Lucía Paredes' },
    { icon: 'bell', text: 'Recordatorio de pago enviado a Silvia Medina', at: ago(30), by: 'Carolina Vega' },
    { icon: 'thumbs-down', text: 'Solicitud de Lucas Gómez rechazada', at: ago(44), by: 'Lucía Paredes' },
    { icon: 'circle-check', text: 'Crédito desembolsado a Carlos Díaz: términos aceptados y firma confirmada', at: ago(24 * 75), by: 'Julián Roldán' },
  ],
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* sin almacenamiento: la demo funciona igual en memoria */
  }
  return seed();
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignorar */
  }
}
function set(next) {
  state = next;
  save();
  listeners.forEach((l) => l());
}

// Sincroniza entre pestañas (portal en una, admin en otra).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const useStore = () => useSyncExternalStore(subscribe, () => state);

const hoy = () => format(new Date(), 'yyyy-MM-dd');
let actorFn = () => '';
/** auth.js registra quién tiene la sesión abierta, para firmar cada acción en la actividad. */
export const registrarActor = (fn) => { actorFn = fn; };
export const getState = () => state;
const log = (s, icon, text, by) => ({ ...s, actividad: [{ icon, text, at: new Date().toISOString(), by: by ?? (actorFn() || 'Sistema') }, ...s.actividad].slice(0, 40) });
const patch = (id, fields) => (s) => ({ ...s, solicitudes: s.solicitudes.map((a) => (a.id === id ? { ...a, ...fields } : a)) });
const quien = () => actorFn() || undefined;
const find = (id) => state.solicitudes.find((a) => a.id === id);

export const actions = {
  /** Una escritura persistente bajo bloqueo evita perder pagos entre pestañas. */
  async registrarPago(datos) {
    if (!navigator.locks) throw new Error('El navegador no permite registrar pagos de forma segura. Usá una versión actual de Chrome, Edge o Firefox en localhost.');
    return navigator.locks.request('nexacred-registro-pagos', () => {
      let actual;
      try {
        const raw = localStorage.getItem(KEY);
        actual = raw ? JSON.parse(raw) : state;
      } catch { throw new Error('No se pudieron leer los datos guardados. No se registró el pago.'); }
      const empleadoId = Number(sessionStorage.getItem('nexacred-admin-session'));
      const empleado = actual.empleados.find((e) => e.id === empleadoId);
      let next = aplicarPago(actual, datos, empleado);
      next = log(next, 'circle-check', `Pago registrado de ${actual.solicitudes.find((a) => a.id === datos.creditoId).cliente}: $ ${datos.importe.toFixed(2)}`, empleado.nombre);
      try { localStorage.setItem(KEY, JSON.stringify(next)); }
      catch { throw new Error('No se pudo guardar el pago en el navegador. No se modificó el saldo.'); }
      state = next;
      listeners.forEach((l) => l());
      return next.pagos.find((p) => p.id === datos.id);
    });
  },
  /** Alta desde el portal público (RF-04 a RF-06). */
  crearDesdePortal({ datos, docs, monto, plazo }) {
    const c = calcular(monto, plazo);
    const ingreso = Number(String(datos.ingreso).replace(/\D/g, '')) || 0;
    const id = state.nextId;
    const numero = `NC-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;
    let codigoConsulta;
    do { codigoConsulta = generarCodigoConsulta(); } while (state.solicitudes.some((a) => a.codigoConsulta === codigoConsulta));
    const creadaEn = new Date().toISOString();
    const sol = {
      id,
      numero,
      codigoConsulta,
      actualizadaEn: creadaEn,
      seguimientoEventos: [{ estado: 'pendiente', fecha: creadaEn }],
      cliente: datos.nombre.trim(),
      dni: datos.dni,
      email: datos.email.trim(),
      tel: datos.tel,
      domicilio: `${datos.domicilio}, ${datos.localidad}`,
      laboral: datos.laboral,
      ingreso,
      destino: datos.destino,
      monto,
      plazo,
      cuota: Math.round(c.cuota),
      score: scoreInicial({ cuota: c.cuota, ingreso, laboral: datos.laboral, dni: datos.dni }),
      fecha: hoy(),
      estado: 'pendiente',
      docs,
      origen: 'portal',
    };
    let next = { ...state, nextId: id + 1, solicitudes: [...state.solicitudes, sol] };
    next = log(next, 'file-circle-plus', `Nueva solicitud online: ${sol.cliente} (${numero})`, 'Portal público');
    set(next);
    return sol;
  },
  /** Alta manual desde el administrador (RF-09). */
  crearManual({ cliente, monto, plazo }) {
    const c = calcular(monto, plazo);
    const id = state.nextId;
    const score = scoreInicial({ cuota: c.cuota, ingreso: 0, laboral: '', dni: String(id * 7919) });
    const sol = { id, cliente, monto, plazo, score, fecha: hoy(), estado: 'pendiente', origen: 'manual' };
    let next = { ...state, nextId: id + 1, solicitudes: [...state.solicitudes, sol] };
    next = log(next, 'file-circle-plus', `Nueva solicitud cargada: ${cliente}`);
    set(next);
    return sol;
  },
  aprobar(id) {
    const a = find(id);
    if (!a) return;
    set(log(patch(id, { estado: 'aprobado', por: quien(), ...registrarCambioSeguimiento(a, 'aprobado') })(state), 'thumbs-up', `Solicitud de ${a.cliente} aprobada, pendiente de verificación presencial`));
  },
  rechazar(id) {
    const a = find(id);
    if (!a) return;
    set(log(patch(id, { estado: 'rechazado', por: quien(), ...registrarCambioSeguimiento(a, 'rechazado') })(state), 'thumbs-down', `Solicitud de ${a.cliente} rechazada`));
  },
  recalcularScore(id) {
    const a = find(id);
    if (!a) return;
    const delta = Math.floor(Math.random() * 16) - 8;
    const score = Math.max(300, Math.min(990, a.score + delta));
    set(log(patch(id, { score })(state), 'rotate', `Score recalculado para ${a.cliente}: ${score}`));
    return score;
  },
  desembolsar(id, firma) {
    const a = find(id);
    if (!a) return;
    const venc = new Date();
    venc.setDate(venc.getDate() + 30);
    const s = patch(id, {
      estado: 'desembolsado',
      ...registrarCambioSeguimiento(a, 'desembolsado'),
      por: quien(),
      saldo: a.monto,
      estadoPago: 'al_dia',
      terminosAceptados: true,
      firma,
      proximoVencimiento: format(venc, 'yyyy-MM-dd'),
      planPagos: { siguiente: 1 },
      cuota: Math.round(calcular(a.monto, a.plazo).cuota * 100) / 100,
    })(state);
    set(log(s, 'circle-check', `Crédito desembolsado a ${a.cliente}: términos aceptados y firma confirmada`));
  },
  recordatorio(id) {
    const a = find(id);
    if (!a) return;
    set(log(state, 'bell', `Recordatorio de pago enviado a ${a.cliente}`));
  },
  consulta({ nombre }) {
    set(log(state, 'message-circle', `Nueva consulta desde el sitio: ${nombre}`, 'Portal público'));
  },
  /* ---- Empleados (solo administrador general) ---- */
  crearEmpleado({ nombre, email, password, rol, permisos }) {
    const id = state.nextEmp;
    const emp = { id, nombre: nombre.trim(), email: email.trim().toLowerCase(), password, rol, permisos, activo: true };
    set(log({ ...state, nextEmp: id + 1, empleados: [...state.empleados, emp] }, 'user-plus', `Nuevo empleado creado: ${emp.nombre} (${rol})`));
    return emp;
  },
  actualizarEmpleado(id, campos) {
    const e = state.empleados.find((x) => x.id === id);
    if (!e) return;
    const limpio = { ...campos };
    if (!limpio.password) delete limpio.password;
    const next = { ...state, empleados: state.empleados.map((x) => (x.id === id ? { ...x, ...limpio } : x)) };
    set(log(next, 'user-cog', `Accesos actualizados para ${e.nombre}`));
  },
  estadoEmpleado(id, activo) {
    const e = state.empleados.find((x) => x.id === id);
    if (!e || e.admin) return;
    const next = { ...state, empleados: state.empleados.map((x) => (x.id === id ? { ...x, activo } : x)) };
    set(log(next, activo ? 'user-plus' : 'user-x', `${e.nombre} ${activo ? 'fue reactivado' : 'fue dado de baja'}`));
  },
  /** Recuperación de contraseña (la verificación por código es simulada). */
  cambiarPassword(email, password) {
    const e = state.empleados.find((x) => x.email === email.trim().toLowerCase());
    if (!e) return false;
    set({ ...state, empleados: state.empleados.map((x) => (x.id === e.id ? { ...x, password } : x)) });
    return true;
  },
  reiniciar() {
    set(seed());
  },
};

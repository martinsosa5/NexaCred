/* =========================================================
   Store de la demo.
   Guarda solicitudes, créditos y actividad en localStorage para que lo que
   se cargue en el portal público aparezca en el panel de administración
   (incluso entre pestañas). En el sistema real esto es la API + PostgreSQL.
   ========================================================= */
import { useSyncExternalStore } from 'react';
import { format } from 'date-fns';
import { calcular, scoreInicial } from './finanzas';

const KEY = 'nexacred-demo-v2';

const seed = () => ({
  nextId: 8,
  solicitudes: [
    { id: 1, cliente: 'Mariana Fernández', monto: 450000, plazo: 24, score: 712, fecha: '2026-08-02', estado: 'aprobado' },
    { id: 2, cliente: 'Comercial Rioja S.A.', monto: 1200000, plazo: 36, score: 640, fecha: '2026-08-04', estado: 'pendiente' },
    { id: 3, cliente: 'Lucas Gómez', monto: 280000, plazo: 12, score: 588, fecha: '2026-08-05', estado: 'rechazado' },
    { id: 4, cliente: 'Norma Aguirre', monto: 860000, plazo: 24, score: 701, fecha: '2026-07-20', estado: 'desembolsado', saldo: 540000, estadoPago: 'al_dia', proximoVencimiento: '2026-09-15', terminosAceptados: true },
    { id: 5, cliente: 'Distribuidora Sur SRL', monto: 2100000, plazo: 36, score: 655, fecha: '2026-08-07', estado: 'pendiente' },
    { id: 6, cliente: 'J. Pérez', monto: 320000, plazo: 12, score: 615, fecha: '2026-06-10', estado: 'desembolsado', saldo: 198000, estadoPago: 'atrasado', proximoVencimiento: '2026-08-28', terminosAceptados: true },
    { id: 7, cliente: 'L. Ibáñez', monto: 500000, plazo: 24, score: 690, fecha: '2026-07-02', estado: 'desembolsado', saldo: 410000, estadoPago: 'al_dia', proximoVencimiento: '2026-09-18', terminosAceptados: true },
  ],
  actividad: [
    { icon: 'bell', text: 'Recordatorio de pago enviado a J. Pérez', t: 'Hace 2 días' },
    { icon: 'file-signature', text: 'Plan de pago propuesto a M. López', t: 'Hace 1 día' },
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
const log = (s, icon, text) => ({ ...s, actividad: [{ icon, text, t: 'Ahora' }, ...s.actividad].slice(0, 8) });
const patch = (id, fields) => (s) => ({ ...s, solicitudes: s.solicitudes.map((a) => (a.id === id ? { ...a, ...fields } : a)) });
const find = (id) => state.solicitudes.find((a) => a.id === id);

export const actions = {
  /** Alta desde el portal público (RF-04 a RF-06). */
  crearDesdePortal({ datos, docs, monto, plazo }) {
    const c = calcular(monto, plazo);
    const ingreso = Number(String(datos.ingreso).replace(/\D/g, '')) || 0;
    const id = state.nextId;
    const numero = `NC-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;
    const sol = {
      id,
      numero,
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
    next = log(next, 'file-circle-plus', `Nueva solicitud online: ${sol.cliente} (${numero})`);
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
    set(log(patch(id, { estado: 'aprobado' })(state), 'thumbs-up', `Solicitud de ${a.cliente} aprobada, pendiente de verificación presencial`));
  },
  rechazar(id) {
    const a = find(id);
    if (!a) return;
    set(log(patch(id, { estado: 'rechazado' })(state), 'thumbs-down', `Solicitud de ${a.cliente} rechazada`));
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
      saldo: a.monto,
      estadoPago: 'al_dia',
      terminosAceptados: true,
      firma,
      proximoVencimiento: format(venc, 'yyyy-MM-dd'),
    })(state);
    set(log(s, 'circle-check', `Crédito desembolsado a ${a.cliente}: términos aceptados y firma confirmada`));
  },
  recordatorio(id) {
    const a = find(id);
    if (!a) return;
    set(log(state, 'bell', `Recordatorio de pago enviado a ${a.cliente}`));
  },
  consulta({ nombre }) {
    set(log(state, 'message-circle', `Nueva consulta desde el sitio: ${nombre}`));
  },
  reiniciar() {
    set(seed());
  },
};

/* Sesión del panel. Las credenciales salen del módulo de empleados del store.
   En el sistema real: JWT en cookie httpOnly + contraseñas con hash (RF-17). */
import { getState, registrarActor, useStore } from './store';

const K = 'nexacred-admin-session';
const leer = () => {
  try {
    return Number(sessionStorage.getItem(K)) || null;
  } catch {
    return null;
  }
};
export const usuarioActual = () => {
  const id = leer();
  return getState().empleados.find((e) => e.id === id && e.activo) || null;
};
registrarActor(() => usuarioActual()?.nombre || '');

export const isAuth = () => !!usuarioActual();
export const login = (email, pass) => {
  const e = getState().empleados.find((x) => x.activo && x.email === email.trim().toLowerCase() && x.password === pass);
  if (!e) return false;
  try {
    sessionStorage.setItem(K, String(e.id));
  } catch { /* ignorar */ }
  return true;
};
export const logout = () => {
  try {
    sessionStorage.removeItem(K);
  } catch { /* ignorar */ }
};
export const can = (u, perm) => !!u && (u.admin || (perm === 'admin' ? false : u.permisos.includes(perm)));
/** Usuario con sesión; se vuelve a renderizar si cambian sus datos. */
export const useUsuario = () => {
  useStore();
  return usuarioActual();
};

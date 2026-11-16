/* Acceso de demostración (credenciales fijas). En el sistema real: JWT en cookie httpOnly (RF-17). */
const K = 'nexacred-admin-session';
export const DEMO_USER = 'admin@nexacred.com';
export const DEMO_PASS = 'demo1234';
export const isAuth = () => {
  try {
    return sessionStorage.getItem(K) === '1';
  } catch {
    return false;
  }
};
export const login = (u, p) => {
  const ok = u.trim().toLowerCase() === DEMO_USER && p === DEMO_PASS;
  if (ok) {
    try {
      sessionStorage.setItem(K, '1');
    } catch { /* ignorar */ }
  }
  return ok;
};
export const logout = () => {
  try {
    sessionStorage.removeItem(K);
  } catch { /* ignorar */ }
};

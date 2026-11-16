import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileStack, ScanSearch, Fingerprint, Wallet, UsersRound, Menu, Globe, LogOut } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { can, logout, useUsuario } from '../../lib/auth';
import { useStore } from '../../lib/store';
import { RUTAS } from '../../lib/permisos';

const TITLES = { '/admin': 'Panel general', '/admin/solicitudes': 'Solicitudes de crédito', '/admin/scoring': 'Scoring de riesgo', '/admin/verificacion': 'Verificación presencial y firma', '/admin/cartera': 'Cartera y cobranzas', '/admin/empleados': 'Empleados y permisos' };

export default function AdminLayout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { solicitudes } = useStore();
  const user = useUsuario();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { document.title = 'Admin · NexaCred'; return () => { document.title = 'NexaCred | Préstamos con las cuentas claras'; }; }, []);
  if (!user) return <Navigate to="/admin/login" replace />;

  const pend = solicitudes.filter((a) => a.estado === 'pendiente').length;
  const aprob = solicitudes.filter((a) => a.estado === 'aprobado').length;
  const items = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: 'Panel general', perm: 'panel' },
    { to: '/admin/solicitudes', icon: FileStack, label: 'Solicitudes', badge: pend, perm: 'solicitudes' },
    { to: '/admin/scoring', icon: ScanSearch, label: 'Scoring de riesgo', perm: 'scoring' },
    { to: '/admin/verificacion', icon: Fingerprint, label: 'Verificación y firma', badge: aprob, perm: 'verificacion' },
    { to: '/admin/cartera', icon: Wallet, label: 'Cartera y cobranzas', perm: 'cartera' },
    { to: '/admin/empleados', icon: UsersRound, label: 'Empleados', perm: 'admin' },
  ].filter((it) => can(user, it.perm));
  const salir = () => { logout(); nav('/admin/login'); };

  // Si entra a una pantalla que no tiene habilitada, lo llevamos a la primera que sí.
  const ruta = RUTAS.find((r) => r.to === pathname);
  const permitido = !ruta || can(user, ruta.perm);
  if (!permitido && items[0]) return <Navigate to={items[0].to} replace />;

  return (
    <div className="admin">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Link to="/" className="side-logo" aria-label="Ir al sitio público"><Logo light /></Link>
        <nav aria-label="Módulos">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="side-link">
              <it.icon size={18} /> <span>{it.label}</span>
              {it.badge > 0 && <b className="badge num">{it.badge}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <Link to="/" className="side-link"><Globe size={18} /> Ver sitio público</Link>
          <button className="side-link" onClick={salir}><LogOut size={18} /> Salir</button>
        </div>
      </aside>
      {open && <div className="side-backdrop open" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu size={18} /></button>
          <h1>{TITLES[pathname] || 'Administración'}</h1>
          <span className="chip role">{user.nombre} · {user.rol}</span>
        </header>
        <div className="admin-content page" key={pathname}>
          {items.length === 0 ? <div className="card"><p>Tu usuario todavía no tiene áreas habilitadas. Pedile al administrador general que te asigne accesos.</p></div> : <Outlet />}
        </div>
      </div>
    </div>
  );
}

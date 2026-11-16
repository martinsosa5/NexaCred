import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileStack, ScanSearch, Fingerprint, Wallet, Menu, Globe, RotateCcw, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/ui/Logo';
import { isAuth, logout } from '../../lib/auth';
import { useStore, actions } from '../../lib/store';

const TITLES = { '/admin': 'Panel general', '/admin/solicitudes': 'Solicitudes de crédito', '/admin/scoring': 'Scoring de riesgo', '/admin/verificacion': 'Verificación presencial y firma', '/admin/cartera': 'Cartera y cobranzas' };

export default function AdminLayout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { solicitudes } = useStore();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { document.title = 'Admin · NexaCred'; return () => { document.title = 'NexaCred | Préstamos con las cuentas claras'; }; }, []);
  if (!isAuth()) return <Navigate to="/admin/login" replace />;

  const pend = solicitudes.filter((a) => a.estado === 'pendiente').length;
  const aprob = solicitudes.filter((a) => a.estado === 'aprobado').length;
  const items = [
    { to: '/admin', end: true, icon: LayoutDashboard, label: 'Panel general' },
    { to: '/admin/solicitudes', icon: FileStack, label: 'Solicitudes', badge: pend },
    { to: '/admin/scoring', icon: ScanSearch, label: 'Scoring de riesgo' },
    { to: '/admin/verificacion', icon: Fingerprint, label: 'Verificación y firma', badge: aprob },
    { to: '/admin/cartera', icon: Wallet, label: 'Cartera y cobranzas' },
  ];
  const reset = () => {
    actions.reiniciar();
    toast.success('Demo reiniciada: datos de ejemplo restaurados.');
  };
  const salir = () => { logout(); nav('/admin/login'); };

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
          <button className="side-link" onClick={reset}><RotateCcw size={18} /> Reiniciar demo</button>
          <button className="side-link" onClick={salir}><LogOut size={18} /> Salir</button>
        </div>
      </aside>
      {open && <div className="side-backdrop" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu size={18} /></button>
          <h1>{TITLES[pathname] || 'Administración'}</h1>
          <span className="chip role">Administrador · Sucursal Centro</span>
        </header>
        <div className="admin-content page" key={pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

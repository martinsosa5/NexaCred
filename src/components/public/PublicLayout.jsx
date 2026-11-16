import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle, MapPin, Phone, Mail, Clock } from 'lucide-react';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { SimProvider } from '../../context/SimContext';

const NAV = [
  { to: '/#simulador', label: 'Simulador' },
  { to: '/#nosotros', label: 'Nosotros' },
  { to: '/#como-funciona', label: 'Cómo funciona' },
  { to: '/#requisitos', label: 'Requisitos' },
  { to: '/#preguntas', label: 'Preguntas' },
];

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth' }));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <SimProvider>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <ScrollManager />
      <header className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" aria-label="NexaCred, inicio"><Logo /></Link>
          <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}>{n.label}</Link>
            ))}
            <NavLink to="/empresas">Para empresas</NavLink>
            <Button to="/solicitud" size="sm" className="nav-cta-m">Solicitar préstamo</Button>
          </nav>
          <div className="nav-actions">
            <Button to="/solicitud" size="sm" className="nav-cta">Solicitar préstamo</Button>
            <button className="icon-btn nav-burger" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main id="contenido" key={pathname} className="page">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="row gy-5">
            <div className="col-lg-5">
              <Logo light />
              <p className="foot-lead">Préstamos personales y para comercios, con la tasa y el costo total a la vista desde el primer paso.</p>
            </div>
            <div className="col-6 col-lg-2">
              <h4>Sitio</h4>
              <ul>
                <li><Link to="/#simulador">Simulador</Link></li>
                <li><Link to="/#como-funciona">Cómo funciona</Link></li>
                <li><Link to="/#requisitos">Requisitos</Link></li>
                <li><Link to="/solicitud">Solicitar</Link></li>
              </ul>
            </div>
            <div className="col-6 col-lg-2">
              <h4>Producto</h4>
              <ul>
                <li><Link to="/empresas">Para empresas</Link></li>
                <li><Link to="/manual">Manual del sistema</Link></li>
                <li><Link to="/admin">Panel de administración</Link></li>
              </ul>
            </div>
            <div className="col-lg-3">
              <h4>Sucursal Centro</h4>
              <ul className="foot-contact">
                <li><MapPin size={16} /> San Martín 850, San Miguel de Tucumán</li>
                <li><Clock size={16} /> Lunes a viernes de 9 a 16 hs</li>
                <li><Phone size={16} /> +54 11 0000-0000</li>
                <li><Mail size={16} /> contacto@nexacred.com</li>
              </ul>
            </div>
          </div>
          <div className="foot-legal">
            <span>© 2026 NexaCred S.R.L. · Proyecto académico, UTN FRT · Administración de Sistemas.</span>
            <span>Sitio demostrativo: tasas y condiciones ficticias. Lo que cargues no se envía a ningún servidor.</span>
          </div>
        </div>
      </footer>

      <a className="wa-float" href="https://wa.me/5411000000" target="_blank" rel="noreferrer" aria-label="Comunicate con nosotros por WhatsApp">
        <MessageCircle size={26} />
        <span className="wa-tip">Comunicate con nosotros</span>
      </a>
    </SimProvider>
  );
}

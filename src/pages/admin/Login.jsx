import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { isAuth, login, DEMO_USER, DEMO_PASS } from '../../lib/auth';

export default function Login() {
  const nav = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  if (isAuth()) return <Navigate to="/admin" replace />;

  const submit = (e) => {
    e.preventDefault();
    if (login(u, p)) nav('/admin', { replace: true });
    else setErr('Usuario o contraseña incorrectos.');
  };
  const demo = () => {
    login(DEMO_USER, DEMO_PASS);
    nav('/admin', { replace: true });
  };
  return (
    <div className="login page">
      <Link to="/" className="login-back"><ArrowLeft size={16} /> Volver al sitio</Link>
      <form className="login-card" onSubmit={submit} noValidate>
        <Logo />
        <h1 className="t-lg">Panel de administración</h1>
        <p className="t-sub" style={{ fontSize: '1rem' }}>Ingresá con tu usuario de la entidad.</p>
        <div className="field">
          <label htmlFor="u">Correo</label>
          <input id="u" className="input" type="email" autoComplete="username" value={u} onChange={(e) => { setU(e.target.value); setErr(''); }} />
        </div>
        <div className="field">
          <label htmlFor="p">Contraseña</label>
          <input id="p" className="input" type="password" autoComplete="current-password" value={p} onChange={(e) => { setP(e.target.value); setErr(''); }} />
        </div>
        <span className="err" role="alert">{err}</span>
        <Button type="submit" className="btn-block">Ingresar</Button>
        <div className="login-sep"><span>o</span></div>
        <Button type="button" variant="ghost" className="btn-block" onClick={demo}>Entrar como demo</Button>
        <p className="fine">Demo: <b>{DEMO_USER}</b> · <b>{DEMO_PASS}</b>. Los datos son de ejemplo y se guardan solo en este navegador.</p>
      </form>
    </div>
  );
}

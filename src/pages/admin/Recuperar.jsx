import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, KeyRound, CircleCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../../components/ui/Logo';
import Button from '../../components/ui/Button';
import { actions } from '../../lib/store';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ocultar = (m) => m.replace(/^(.{2})[^@]*(@.*)$/, '$1•••••$2');

/* Recuperación de contraseña en 4 pasos. El envío del código es simulado: cualquier código de 6 dígitos se acepta. */
export default function Recuperar() {
  const [paso, setPaso] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [espera, setEspera] = useState(0);
  const cod = useRef(null);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);
  useEffect(() => { if (paso === 2) cod.current?.focus(); }, [paso]);

  const enviar = (e) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setErr('Ingresá un correo válido, por ejemplo nombre@nexacred.com.');
    setErr(''); setEspera(30); setPaso(2);
    toast.success('Te enviamos un código de verificación.');
  };
  const reenviar = () => { setEspera(30); toast.success('Te enviamos un nuevo código.'); };
  const verificar = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) return setErr('El código tiene 6 dígitos.');
    setErr(''); setPaso(3);
    toast.success('Código verificado correctamente.');
  };
  const guardar = (e) => {
    e.preventDefault();
    if (pass.length < 8) return setErr('La contraseña debe tener al menos 8 caracteres.');
    if (pass !== pass2) return setErr('Las contraseñas no coinciden.');
    actions.cambiarPassword(email, pass);
    setErr(''); setPaso(4);
  };

  const titulos = { 1: 'Recuperá tu acceso', 2: 'Revisá tu correo', 3: 'Elegí una contraseña nueva', 4: '¡Contraseña actualizada!' };
  return (
    <div className="login page">
      <Link to="/admin/login" className="login-back"><ArrowLeft size={16} /> Volver al ingreso</Link>
      <div className="login-card">
        <Logo />
        <ol className="rec-steps" aria-label={`Paso ${paso} de 4`}>
          {[1, 2, 3, 4].map((n) => <li key={n} className={n === paso ? 'on' : n < paso ? 'done' : ''} />)}
        </ol>
        <h1 className="t-lg">{titulos[paso]}</h1>

        {paso === 1 && (
          <form onSubmit={enviar} noValidate className="stack">
            <p className="t-sub" style={{ fontSize: '1rem' }}>Ingresá el correo de tu usuario y te enviamos un código de verificación.</p>
            <div className="field"><label htmlFor="re">Correo</label><input id="re" className={`input ${err ? 'invalid' : ''}`} type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} /></div>
            <span className="err" role="alert">{err}</span>
            <Button type="submit" className="btn-block"><Mail size={16} /> Enviar código</Button>
          </form>
        )}
        {paso === 2 && (
          <form onSubmit={verificar} noValidate className="stack">
            <p className="t-sub" style={{ fontSize: '1rem' }}>Enviamos un código de 6 dígitos a <b>{ocultar(email.trim())}</b>. Ingresalo para continuar.</p>
            <div className="field"><label htmlFor="rc">Código de verificación</label>
              <input id="rc" ref={cod} className={`input code-input num ${err ? 'invalid' : ''}`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="••••••" value={codigo} onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, '')); setErr(''); }} /></div>
            <span className="err" role="alert">{err}</span>
            <Button type="submit" className="btn-block"><ShieldCheck size={16} /> Verificar código</Button>
            <button type="button" className="link-btn" disabled={espera > 0} onClick={reenviar} style={{ alignSelf: 'center' }}>{espera > 0 ? `Podés pedir otro código en ${espera} s` : 'Reenviar código'}</button>
          </form>
        )}
        {paso === 3 && (
          <form onSubmit={guardar} noValidate className="stack">
            <p className="t-sub" style={{ fontSize: '1rem' }}>Usá al menos 8 caracteres.</p>
            <div className="field"><label htmlFor="rp">Contraseña nueva</label><input id="rp" className="input" type="password" autoComplete="new-password" value={pass} onChange={(e) => { setPass(e.target.value); setErr(''); }} /></div>
            <div className="field"><label htmlFor="rp2">Repetí la contraseña</label><input id="rp2" className="input" type="password" autoComplete="new-password" value={pass2} onChange={(e) => { setPass2(e.target.value); setErr(''); }} /></div>
            <span className="err" role="alert">{err}</span>
            <Button type="submit" className="btn-block"><KeyRound size={16} /> Guardar contraseña</Button>
          </form>
        )}
        {paso === 4 && (
          <div className="stack" style={{ alignItems: 'center', textAlign: 'center' }}>
            <span className="success-check" style={{ margin: '0 auto' }}><CircleCheck size={38} /></span>
            <p className="t-sub" style={{ fontSize: '1rem' }}>Ya podés ingresar al panel con tu nueva contraseña.</p>
            <Button to="/admin/login" className="btn-block">Ir al ingreso</Button>
          </div>
        )}
      </div>
    </div>
  );
}

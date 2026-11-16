import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, X, SendHorizontal } from 'lucide-react';
import { responder, SUGERENCIAS } from '../../lib/bot';

const render = (t) => t.split('\n').map((l, i) => (
  <span key={i} className="bot-line">{l.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p))}</span>
));
const BIENVENIDA = { from: 'bot', text: '¡Hola! Soy **NexaBot**, el asistente virtual de NexaCred. Puedo simular tu cuota, contarte los requisitos y resolver dudas sobre el préstamo. ¿En qué te ayudo?', chips: SUGERENCIAS };

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([BIENVENIDA]);
  const [txt, setTxt] = useState('');
  const [typing, setTyping] = useState(false);
  const ctx = useRef({});
  const end = useRef(null);
  const inp = useRef(null);
  const timer = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs, typing, open]);
  useEffect(() => { if (open) inp.current?.focus(); }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [open]);

  const enviar = (texto) => {
    const t = texto.trim();
    if (!t || typing) return;
    setMsgs((m) => [...m.map((x) => ({ ...x, chips: undefined })), { from: 'me', text: t }]);
    setTxt('');
    setTyping(true);
    const r = responder(t, ctx.current);
    ctx.current = r.ctx || ctx.current;
    timer.current = setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: 'bot', text: r.text, chips: r.chips, link: r.link }]);
    }, 650 + Math.min(r.text.length * 6, 900));
  };

  return (
    <>
      <button type="button" className={`bot-float ${open ? 'hide' : ''}`} onClick={() => setOpen(true)} aria-label="Chateá con nosotros" aria-expanded={open}>
        <Bot size={26} />
        <span className="wa-tip">Chateá con nosotros</span>
      </button>
      {open && (
        <section className="bot-panel" role="dialog" aria-label="Chat con NexaBot">
          <header className="bot-head">
            <span className="bot-avatar"><Bot size={22} /></span>
            <div><strong>NexaBot</strong><small><i className="bot-dot" /> Asistente virtual · en línea</small></div>
            <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar chat"><X size={18} /></button>
          </header>
          <div className="bot-log" role="log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`bot-msg ${m.from}`}>
                <div className="bot-bubble">{render(m.text)}
                  {m.link && (m.link.to
                    ? <Link to={m.link.to} className="bot-link" onClick={() => setOpen(false)}>{m.link.label}</Link>
                    : <a href={m.link.href} className="bot-link" target="_blank" rel="noreferrer">{m.link.label}</a>)}
                </div>
                {m.chips && <div className="bot-chips">{m.chips.map((c) => <button type="button" key={c} onClick={() => enviar(c)}>{c}</button>)}</div>}
              </div>
            ))}
            {typing && <div className="bot-msg bot"><div className="bot-bubble typing" aria-label="NexaBot está escribiendo"><i /><i /><i /></div></div>}
            <div ref={end} />
          </div>
          <form className="bot-input" onSubmit={(e) => { e.preventDefault(); enviar(txt); }}>
            <input ref={inp} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Escribí tu consulta…" aria-label="Escribí tu consulta" maxLength={200} />
            <button type="submit" aria-label="Enviar" disabled={!txt.trim() || typing}><SendHorizontal size={18} /></button>
          </form>
          <p className="bot-note">Respuestas automáticas de demostración. No constituyen una oferta.</p>
        </section>
      )}
    </>
  );
}

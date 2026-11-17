import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ArrowUp, IdCard, FileText, Home, Upload, CircleCheck, TriangleAlert } from 'lucide-react';
import { useSim } from '../context/SimContext';
import { datosSchema, LABORAL, DESTINOS, DOCS, MAX_BYTES, OK_EXT } from '../lib/schemas';
import { actions } from '../lib/store';
import { RATIO_MAX } from '../lib/finanzas';
import { money, pct, digits, num } from '../lib/format';
import Button from '../components/ui/Button';
import '../styles/seguimiento.css';

const DOC_ICON = { dniFrente: IdCard, dniDorso: IdCard, ingresos: FileText, domicilio: Home };
const STEPS = ['Tu préstamo', 'Tus datos', 'Documentación', 'Confirmar'];

function Rows({ pairs }) {
  return (
    <div className="rows num">
      {pairs.map(([a, b]) => (
        <div key={a}><span>{a}</span><span>{b}</span></div>
      ))}
    </div>
  );
}

export default function Solicitud() {
  const { monto, plazo, calc } = useSim();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState({});
  const [docErr, setDocErr] = useState({});
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [done, setDone] = useState(null);
  const top = useRef(null);

  const { register, handleSubmit, trigger, getValues, setFocus, formState: { errors } } = useForm({
    resolver: zodResolver(datosSchema),
    mode: 'onTouched',
    defaultValues: { nombre: '', dni: '', nacimiento: '', tel: '', email: '', domicilio: '', localidad: '', laboral: '', ingreso: '', destino: DESTINOS[0] },
  });

  const go = (n) => {
    setStep(n);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const nextFrom2 = async () => {
    const ok = await trigger();
    if (ok) return go(3);
    const first = Object.keys(errors)[0] || ['nombre', 'dni', 'nacimiento', 'tel', 'email', 'domicilio', 'localidad', 'laboral', 'ingreso'].find((k) => errors[k]);
    if (first) setFocus(first);
  };

  const onFile = (key, f) => {
    setDocErr((e) => ({ ...e, [key]: '' }));
    if (!f) return setFiles((s) => { const n = { ...s }; delete n[key]; return n; });
    if (!OK_EXT.test(f.name)) return setDocErr((e) => ({ ...e, [key]: 'Formato no permitido. Subí un PDF, JPG o PNG.' }));
    if (f.size > MAX_BYTES) return setDocErr((e) => ({ ...e, [key]: 'El archivo pesa más de 5 MB. Probá con uno más liviano.' }));
    setFiles((s) => ({ ...s, [key]: f }));
  };

  const nextFrom3 = () => {
    const missing = DOCS.filter((d) => !files[d.key]);
    if (missing.length) {
      const e = {};
      missing.forEach((d) => { e[d.key] = docErr[d.key] || 'Este documento es obligatorio.'; });
      setDocErr((x) => ({ ...x, ...e }));
      document.getElementById('file-' + missing[0].key)?.focus();
      return;
    }
    go(4);
  };

  const enviar = handleSubmit((datos) => {
    if (!consent) {
      setConsentErr(true);
      return;
    }
    const sol = actions.crearDesdePortal({ datos, docs: DOCS.map((d) => files[d.key].name), monto, plazo });
    setDone(sol);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const loan = [
    ['Monto solicitado', money(monto)],
    ['Cuotas', `${plazo} cuotas mensuales`],
    ['Cuota mensual estimada', money(calc.cuota)],
    ['TNA / CFT', `${pct(calc.tna, 0)} / ${pct(calc.cft, 1)}`],
    ['Total a pagar', money(calc.total)],
  ];

  const ingresoNum = Number(digits(getValues('ingreso'))) || 0;
  const ratio = ingresoNum > 0 ? calc.cuota / ingresoNum : null;

  if (done) {
    return (
      <section className="section solicitud" ref={top}>
        <div className="container narrow success">
          <div className="success-check"><Check size={36} strokeWidth={3} /></div>
          <h1 className="t-xl">Recibimos tu solicitud.</h1>
          <p className="t-sub">Tu número de solicitud es <strong className="req-number num">{done.numero}</strong>. Guardalo por si necesitás consultarnos.</p>
          <div className="seg-credenciales">
            <h2>Código privado de consulta</h2>
            <code>{done.codigoConsulta}</code>
            <p>Guardá el número de solicitud y este código privado. Necesitás ambos para consultar el estado. No compartas el código.</p>
            <p className="fine">Demostración local: la consulta funciona solo en este navegador y origen. No es un mecanismo de seguridad para producción.</p>
            <Button to="/seguimiento">Consultar estado de mi solicitud</Button>
          </div>
          <ol className="next-steps">
            <li><span>1</span><div><strong>Analizamos tu pedido</strong><p>En hasta 48 horas hábiles revisamos tus datos y tu documentación.</p></div></li>
            <li><span>2</span><div><strong>Te avisamos</strong><p>Si tiene el visto bueno, te escribimos a <b>{done.email}</b> y por WhatsApp.</p></div></li>
            <li><span>3</span><div><strong>Vas a la sucursal</strong><p>Validamos tu documentación original y tus datos biométricos, firmás y acreditamos el préstamo.</p></div></li>
          </ol>
          <div className="bring-box">
            <h2>Qué llevar a la sucursal</h2>
            <ul><li>DNI original</li><li>Último recibo de sueldo o comprobante de ingresos</li><li>Comprobante de domicilio a tu nombre</li></ul>
          </div>
          <div className="hero-btns" style={{ marginTop: 32 }}>
            <Button to="/" variant="ghost">Volver al inicio</Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section solicitud" ref={top}>
      <div className="container narrow">
        <p className="eyebrow">Solicitud de préstamo</p>
        <h1 className="t-xl">Pedí tu préstamo en cuatro pasos.</h1>

        <ol className="stepper" aria-label="Progreso">
          {STEPS.map((s, i) => (
            <li key={s} className={step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''} aria-current={step === i + 1 ? 'step' : undefined}>
              <span className="dot num">{step > i + 1 ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
              <span className="lbl">{s}</span>
            </li>
          ))}
        </ol>

        <form onSubmit={enviar} noValidate className="step-card">
          {step === 1 && (
            <div className="fade-in-up">
              <h2 className="t-md">Revisá tu préstamo</h2>
              <p className="step-sub">Este es el préstamo que simulaste. Si querés cambiarlo, volvé al simulador.</p>
              <Rows pairs={loan} />
              <Link to="/#simulador" className="link-btn" style={{ margin: '14px 0 24px' }}><ArrowUp size={15} /> Cambiar monto o cuotas</Link>
              <div className="field">
                <label htmlFor="destino">¿Para qué lo vas a usar?</label>
                <select id="destino" className="select" {...register('destino')}>{DESTINOS.map((d) => <option key={d}>{d}</option>)}</select>
              </div>
              <div className="step-actions"><span /><Button type="button" arrow onClick={() => go(2)}>Continuar</Button></div>
            </div>
          )}

          {/* Paso 2: se mantiene montado para conservar los datos al retroceder */}
          <div hidden={step !== 2} className={step === 2 ? 'fade-in-up' : ''}>
            <h2 className="t-md">Contanos quién sos</h2>
            <p className="step-sub">Usá los mismos datos que figuran en tu DNI.</p>
            <div className="row g-3">
              <Field cls="col-md-8" id="nombre" label="Nombre y apellido" err={errors.nombre}><input id="nombre" className={`input ${errors.nombre ? 'invalid' : ''}`} autoComplete="name" placeholder="Como figura en tu DNI" {...register('nombre')} /></Field>
              <Field cls="col-md-4" id="dni" label="DNI" err={errors.dni}><input id="dni" inputMode="numeric" className={`input ${errors.dni ? 'invalid' : ''}`} placeholder="Sin puntos" {...register('dni', { onChange: (e) => (e.target.value = digits(e.target.value).slice(0, 8)) })} /></Field>
              <Field cls="col-md-6" id="nacimiento" label="Fecha de nacimiento" err={errors.nacimiento}><input id="nacimiento" type="date" className={`input ${errors.nacimiento ? 'invalid' : ''}`} autoComplete="bday" {...register('nacimiento')} /></Field>
              <Field cls="col-md-6" id="tel" label="Celular" err={errors.tel}><input id="tel" type="tel" className={`input ${errors.tel ? 'invalid' : ''}`} autoComplete="tel" placeholder="Ej: 381 555 0000" {...register('tel')} /></Field>
              <Field cls="col-12" id="email" label="Email" err={errors.email}><input id="email" type="email" className={`input ${errors.email ? 'invalid' : ''}`} autoComplete="email" placeholder="nombre@email.com" {...register('email')} /></Field>
              <Field cls="col-md-7" id="domicilio" label="Domicilio" err={errors.domicilio}><input id="domicilio" className={`input ${errors.domicilio ? 'invalid' : ''}`} autoComplete="street-address" placeholder="Calle y número" {...register('domicilio')} /></Field>
              <Field cls="col-md-5" id="localidad" label="Localidad" err={errors.localidad}><input id="localidad" className={`input ${errors.localidad ? 'invalid' : ''}`} autoComplete="address-level2" {...register('localidad')} /></Field>
              <Field cls="col-md-6" id="laboral" label="Situación laboral" err={errors.laboral}>
                <select id="laboral" className={`select ${errors.laboral ? 'invalid' : ''}`} {...register('laboral')}><option value="">Elegí una opción</option>{LABORAL.map((l) => <option key={l}>{l}</option>)}</select>
              </Field>
              <Field cls="col-md-6" id="ingreso" label="Ingreso mensual neto ($)" err={errors.ingreso}><input id="ingreso" inputMode="numeric" className={`input ${errors.ingreso ? 'invalid' : ''}`} placeholder="Ej: 900.000" {...register('ingreso', { onChange: (e) => { const d = digits(e.target.value); e.target.value = d ? num(Number(d)) : ''; } })} /></Field>
            </div>
            <div className="step-actions"><Button type="button" variant="ghost" onClick={() => go(1)}>Atrás</Button><Button type="button" arrow onClick={nextFrom2}>Continuar</Button></div>
          </div>

          {step === 3 && (
            <div className="fade-in-up">
              <h2 className="t-md">Subí tu documentación</h2>
              <p className="step-sub">Fotos nítidas o PDF, de hasta 5 MB cada archivo. Los originales los llevás a la sucursal.</p>
              <div className="docs">
                {DOCS.map((d) => {
                  const Ic = DOC_ICON[d.key];
                  const f = files[d.key];
                  const bad = !!docErr[d.key];
                  return (
                    <div key={d.key} className={`doc-row ${f ? 'ok' : ''} ${bad ? 'bad' : ''}`}>
                      <span className="ico"><Ic size={20} /></span>
                      <div className="doc-info">
                        <strong>{d.label}</strong>
                        <small id={'dm-' + d.key}>{f ? `${f.name} · ${Math.max(1, Math.round(f.size / 1024))} KB` : docErr[d.key] || 'Todavía no subiste este archivo'}</small>
                      </div>
                      <input id={'file-' + d.key} className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-describedby={'dm-' + d.key}
                        onChange={(e) => { onFile(d.key, e.target.files?.[0]); e.target.value = ''; }} />
                      <label htmlFor={'file-' + d.key} className="btn btn-ghost btn-sm">{f ? <><CircleCheck size={15} /> Cambiar</> : <><Upload size={15} /> Subir</>}</label>
                    </div>
                  );
                })}
              </div>
              <div className="step-actions"><Button type="button" variant="ghost" onClick={() => go(2)}>Atrás</Button><Button type="button" arrow onClick={nextFrom3}>Continuar</Button></div>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in-up">
              <h2 className="t-md">Revisá y enviá</h2>
              <p className="step-sub">Chequeá que esté todo bien antes de enviar.</p>
              <Rows pairs={[['Solicitante', getValues('nombre')], ['DNI', getValues('dni')], ['Email', getValues('email')], ['Celular', getValues('tel')], ['Destino', getValues('destino')], ...loan, ['Documentación', `${Object.keys(files).length} de ${DOCS.length} archivos`]]} />
              {ratio != null && (
                <div className={`ratio-note ${ratio <= RATIO_MAX ? 'good' : 'warn'}`}>
                  {ratio <= RATIO_MAX ? <CircleCheck size={18} /> : <TriangleAlert size={18} />}
                  <span>La cuota representa el <strong>{pct(ratio, 0)}</strong> de tu ingreso mensual, {ratio <= RATIO_MAX ? 'dentro de lo que recomendamos.' : `por encima del ${pct(RATIO_MAX, 0)} que recomendamos. Podés reducir el monto o elegir más cuotas.`}</span>
                </div>
              )}
              <label className={`check consent ${consentErr ? 'invalid' : ''}`}>
                <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setConsentErr(false); }} />
                <span>Confirmo que los datos son verdaderos y autorizo a NexaCred a usarlos para evaluar mi solicitud. Entiendo que la aprobación final requiere ir a la sucursal con la documentación original.
                  {consentErr && <em className="err" style={{ display: 'block' }}>Tenés que aceptar para poder enviar la solicitud.</em>}</span>
              </label>
              <div className="step-actions"><Button type="button" variant="ghost" onClick={() => go(3)}>Atrás</Button><Button type="submit">Enviar solicitud</Button></div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

function Field({ cls, id, label, err, children }) {
  return (
    <div className={`${cls} field`}>
      <label htmlFor={id}>{label}</label>
      {children}
      <span className="err" role="alert">{err?.message}</span>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, Fingerprint, Bell, Laptop, Cog, Building2, IdCard, FileText, Home as HomeIcon, Cake, Briefcase, Scale, ArrowDown, Info, Send } from 'lucide-react';
import Simulador from '../components/public/Simulador';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import Split from '../components/ui/Split';
import CountUp from '../components/ui/CountUp';
import Accordion from '../components/ui/Accordion';
import { contactoSchema } from '../lib/schemas';
import { actions } from '../lib/store';

const FAQ = [
  { q: '¿Cuánto tardan en responderme?', a: 'Revisamos tu solicitud en hasta 48 horas hábiles y te avisamos por email y WhatsApp si tiene el visto bueno.' },
  { q: '¿Por qué tengo que ir a la sucursal?', a: 'Para validar tu documentación original y tus datos biométricos, y para firmar el contrato frente a una persona de nuestro equipo. Es un control que evita fraudes y suplantaciones de identidad, y protege tus datos.' },
  { q: '¿Qué es el CFT y por qué importa?', a: 'El Costo Financiero Total suma a la tasa de interés los gastos de otorgamiento y el seguro. Es el número que tenés que comparar entre distintas ofertas, porque refleja lo que realmente te cuesta el préstamo.' },
  { q: '¿La simulación es una oferta firme?', a: 'No. Es una estimación para que te hagas una idea. La tasa, el monto y las cuotas definitivas dependen del análisis crediticio de tu solicitud.' },
  { q: '¿Puedo cancelar el préstamo antes de tiempo?', a: 'Sí. Podés cancelar total o parcialmente desde la sucursal, y los intereses se calculan sobre el capital que todavía debas.' },
  { q: '¿Qué pasa con mis datos?', a: 'Se usan solo para evaluar tu solicitud. Los datos biométricos se capturan en la sucursal, con tu consentimiento expreso.' },
];

const PASOS = [
  { n: '01', icon: Laptop, where: 'Online', t: 'Simulás tu préstamo', d: 'Elegís el monto y las cuotas, y ves cuánto vas a pagar por mes y en total.' },
  { n: '02', icon: Laptop, where: 'Online', t: 'Completás la solicitud', d: 'Cargás tus datos y subís la documentación desde el celular o la computadora.' },
  { n: '03', icon: Cog, where: 'Lo hacemos nosotros', t: 'Analizamos tu pedido', d: 'Revisamos tu solicitud en hasta 48 horas hábiles. Si tiene el visto bueno, te avisamos por email y WhatsApp.' },
  { n: '04', icon: Building2, where: 'En sucursal', t: 'Validás y firmás', d: 'Llevás la documentación original, validamos tus datos biométricos, firmás el contrato y acreditamos el préstamo.', branch: true },
];

function Hero() {
  const bg = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (bg.current && y < window.innerHeight * 1.3) bg.current.style.transform = `translate3d(0, ${y * 0.22}px, 0) scale(1.08)`;
      });
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <section className="hero" aria-labelledby="heroTitle">
      <div className="hero-bg" ref={bg}><img src="/img/portada.jpg" alt="" fetchPriority="high" /></div>
      <div className="hero-shade" />
      <div className="container hero-content">
        <p className="eyebrow fade-in-up" style={{ '--base': '100ms' }}>Préstamos personales y para comercios</p>
        <Split as="h1" className="t-hero" text="Tu préstamo, con las cuentas claras." base={200} />
        <p className="t-sub hero-sub fade-in-up" style={{ '--base': '900ms' }}>Simulá en segundos cuánto vas a pagar por mes y en total. Pedilo online y cerralo cara a cara en nuestra sucursal.</p>
        <div className="hero-btns fade-in-up" style={{ '--base': '1100ms' }}>
          <Button href="#simulador" arrow>Simular mi préstamo</Button>
          <Button href="#como-funciona" variant="ghost-light">Cómo funciona</Button>
        </div>
      </div>
      <a className="hero-scroll" href="#simulador" aria-label="Ir al simulador"><ArrowDown size={20} /></a>
    </section>
  );
}

function Stats() {
  const items = [
    { v: <CountUp to={5000000} prefix="$ " />, l: 'Monto máximo a solicitar' },
    { v: <CountUp to={48} />, l: 'Cuotas como máximo' },
    { v: <CountUp to={48} suffix=" h" />, l: 'Hábiles para responderte' },
    { v: <CountUp to={100} suffix="%" />, l: 'Costos visibles antes de firmar' },
  ];
  return (
    <section className="stats" aria-label="En números">
      <div className="container">
        <div className="row g-0">
          {items.map((it, i) => (
            <Reveal className="col-6 col-lg-3 stat" delay={i} key={i}>
              <strong className="t-lg">{it.v}</strong>
              <span>{it.l}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Nosotros() {
  const principios = [
    { icon: Eye, t: 'Transparencia', d: 'El CFT y el total a pagar se ven antes de pedir nada, no después de firmar.' },
    { icon: Fingerprint, t: 'Identidad protegida', d: 'Validamos tu identidad con datos biométricos en sucursal para evitar fraudes.' },
    { icon: Bell, t: 'Acompañamiento', d: 'Te avisamos cada vencimiento por email y WhatsApp para que no se te pase ninguna cuota.' },
  ];
  return (
    <section className="section" id="nosotros" aria-labelledby="nosTitle">
      <div className="container">
        <div className="row gy-5 gx-lg-5">
          <div className="col-lg-7">
            <p className="eyebrow">Quiénes somos</p>
            <Split className="t-xl" onView text="Somos una financiera que presta con las reglas claras." />
            <Reveal className="about-copy">
              <p className="t-sub">NexaCred otorga préstamos personales y para comercios a quienes necesitan financiar un proyecto, comprar equipamiento o sostener su capital de trabajo. Analizamos cada solicitud con un estudio de riesgo propio y te mostramos desde el principio la tasa, el costo financiero total y cada cuota.</p>
              <p className="t-sub">La solicitud la hacés online para ahorrar tiempo, pero la aprobación final es presencial: validamos tu documentación original y tus datos biométricos, y firmás el contrato frente a una persona de nuestro equipo.</p>
            </Reveal>
          </div>
          <div className="col-lg-5">
            <Reveal className="uses-card">
              <h3 className="t-md">Para qué podés usar tu préstamo</h3>
              <ul>
                {[['Préstamo personal', 'Proyectos, estudios, arreglos'], ['Capital de trabajo', 'Comercios y pymes'], ['Equipamiento', 'Maquinaria y herramientas'], ['Refinanciación', 'Ordenar deudas existentes']].map(([a, b]) => (
                  <li key={a}><strong>{a}</strong><span>{b}</span></li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
        <div className="row g-4 principles">
          {principios.map((p, i) => (
            <Reveal className="col-md-4" delay={i} key={p.t}>
              <article className="principle">
                <span className="ico"><p.icon size={22} /></span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhotoBand() {
  return (
    <section className="photo-band" aria-label="Aprobación presencial">
      <div className="photo-band-bg" />
      <div className="container">
        <Reveal><p className="eyebrow">En sucursal</p></Reveal>
        <Split className="t-xl" onView text="La aprobación final es cara a cara." />
        <Reveal delay={2}><p className="t-sub">Validamos tu documentación original, capturamos tus datos biométricos y firmás el contrato frente a una persona de nuestro equipo. Así cuidamos tu identidad y la de todos.</p></Reveal>
      </div>
    </section>
  );
}

function ComoFunciona() {
  return (
    <section className="section" id="como-funciona" aria-labelledby="flowTitle">
      <div className="container">
        <p className="eyebrow">Cómo funciona</p>
        <Split className="t-xl" onView text="De la simulación al dinero en tu cuenta." />
        <Reveal><p className="t-sub" style={{ maxWidth: 640, marginTop: 20 }}>Cuatro pasos. Los dos primeros los hacés desde tu casa; el último, en nuestra sucursal.</p></Reveal>
        <ol className="flow row g-0">
          {PASOS.map((p, i) => (
            <Reveal as="li" className="col-md-6 col-xl-3" delay={i} key={p.n}>
              <div className={`flow-step ${p.branch ? 'branch' : ''}`}>
                <span className="flow-n num">{p.n}</span>
                <span className="where"><p.icon size={15} /> {p.where}</span>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            </Reveal>
          ))}
        </ol>
        <Reveal className="flow-note"><Info size={18} /><span>El visto bueno online no es la aprobación final. El préstamo se otorga recién cuando la documentación original y tus datos coinciden con lo que cargaste.</span></Reveal>
      </div>
    </section>
  );
}

function Requisitos() {
  const docs = [
    [IdCard, 'DNI vigente', 'Frente y dorso.'],
    [FileText, 'Comprobante de ingresos', 'Último recibo de sueldo. Monotributistas y autónomos: constancia de inscripción y últimos 3 pagos.'],
    [HomeIcon, 'Comprobante de domicilio', 'Factura de un servicio a tu nombre, de los últimos 3 meses.'],
  ];
  const cond = [
    [Cake, 'Tener entre 18 y 75 años', 'Al momento de solicitar el préstamo.'],
    [Briefcase, 'Ingresos que puedas demostrar', 'En relación de dependencia, independientes, jubilados o con comercio propio.'],
    [Scale, 'Cuota hasta el 35% de tus ingresos', 'Es la referencia que usamos para cuidar que el préstamo no te ahogue.'],
  ];
  const col = (title, list) => (
    <div className="col-lg-6">
      <Reveal>
        <h3 className="t-md req-title">{title}</h3>
        <ul className="req-list">
          {list.map(([Ic, a, b]) => (
            <li key={a}><span className="ico"><Ic size={20} /></span><div><strong>{a}</strong><span>{b}</span></div></li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
  return (
    <section className="section chalk" id="requisitos" aria-labelledby="reqTitle">
      <div className="container">
        <p className="eyebrow">Requisitos</p>
        <Split className="t-xl" onView text="Qué necesitás tener a mano." />
        <Reveal><p className="t-sub" style={{ marginTop: 20, marginBottom: 56 }}>Subís una copia digital al solicitar y llevás los originales a la sucursal.</p></Reveal>
        <div className="row gy-5 gx-lg-5">{col('Documentación', docs)}{col('Condiciones', cond)}</div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="section dark cta-band">
      <div className="container text-center">
        <Split className="t-hero cta-title" onView text="Empezá hoy." />
        <Reveal delay={2}><p className="t-sub" style={{ margin: '24px auto 40px', maxWidth: 560 }}>Simulá tu préstamo, completá la solicitud en minutos y coordiná tu visita a la sucursal.</p></Reveal>
        <Reveal delay={3}><div className="hero-btns" style={{ justifyContent: 'center' }}><Button to="/solicitud" arrow>Solicitar un préstamo</Button><Button href="#simulador" variant="ghost-light">Volver al simulador</Button></div></Reveal>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="section" id="preguntas" aria-labelledby="faqTitle">
      <div className="container">
        <div className="row gy-4 gx-lg-5">
          <div className="col-lg-4">
            <p className="eyebrow">Preguntas frecuentes</p>
            <Split className="t-lg" onView text="Lo que más nos preguntan." />
          </div>
          <div className="col-lg-8"><Reveal><Accordion items={FAQ} /></Reveal></div>
        </div>
      </div>
    </section>
  );
}

function Contacto() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(contactoSchema), defaultValues: { nombre: '', email: '', mensaje: '' } });
  const onSubmit = async (d) => {
    actions.consulta(d);
    toast.success('¡Gracias! Te respondemos a la brevedad.');
    reset();
  };
  return (
    <section className="section chalk" id="contacto" aria-labelledby="contTitle">
      <div className="container">
        <div className="row gy-5 gx-lg-5">
          <div className="col-lg-5">
            <p className="eyebrow">Contacto</p>
            <Split className="t-xl" onView text="Hablemos." />
            <Reveal><p className="t-sub" style={{ marginTop: 20 }}>¿Tenés una duda antes de pedir tu préstamo? Escribinos y te respondemos en el día.</p></Reveal>
          </div>
          <div className="col-lg-7">
            <Reveal>
              <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="row g-3">
                  <div className="col-md-6 field">
                    <label htmlFor="cNombre">Nombre</label>
                    <input id="cNombre" className={`input ${errors.nombre ? 'invalid' : ''}`} autoComplete="name" {...register('nombre')} />
                    <span className="err">{errors.nombre?.message}</span>
                  </div>
                  <div className="col-md-6 field">
                    <label htmlFor="cEmail">Email</label>
                    <input id="cEmail" type="email" className={`input ${errors.email ? 'invalid' : ''}`} autoComplete="email" {...register('email')} />
                    <span className="err">{errors.email?.message}</span>
                  </div>
                  <div className="col-12 field">
                    <label htmlFor="cMsg">Mensaje</label>
                    <textarea id="cMsg" className={`textarea ${errors.mensaje ? 'invalid' : ''}`} {...register('mensaje')} />
                    <span className="err">{errors.mensaje?.message}</span>
                  </div>
                </div>
                <Button type="submit" disabled={isSubmitting}>Enviar consulta <Send size={16} /></Button>
              </form>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Simulador />
      <Nosotros />
      <PhotoBand />
      <ComoFunciona />
      <Requisitos />
      <CtaBand />
      <Faq />
      <Contacto />
    </>
  );
}

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ScanSearch, ShieldCheck, Plug, BellRing, ChartNoAxesCombined, Cloud, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import Split from '../components/ui/Split';
import CountUp from '../components/ui/CountUp';
import { actions } from '../lib/store';

const demoSchema = z.object({
  nombre: z.string().trim().min(3, 'Ingresá tu nombre completo.'),
  empresa: z.string().trim().min(2, 'Ingresá el nombre de tu empresa.'),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Ingresá un email válido.'),
  mensaje: z.string().optional(),
});

const FEATURES = [
  [ScanSearch, 'Scoring de riesgo automatizado', 'Modelos configurables que combinan datos del buró de crédito, historial de pagos y las reglas propias de tu política de riesgo.'],
  [ShieldCheck, 'Seguridad y trazabilidad', 'Cifrado de datos en tránsito y en reposo, roles por usuario y registro de cada operación sensible.'],
  [Plug, 'Integración vía API', 'Conectá NexaCred con burós de crédito, pasarelas de pago y tus sistemas contables mediante una API REST.'],
  [BellRing, 'Automatización de cobranzas', 'Recordatorios, planes de pago y estrategias de recupero según el comportamiento de cada cliente.'],
  [ChartNoAxesCombined, 'Reportes de cartera', 'Estado de tu cartera en tiempo real: mora, aprobación y desembolsos, sin planillas manuales.'],
  [Cloud, 'Alojamiento en la nube', 'Sin servidores que mantener: tu plataforma escala sola, con copias de seguridad automáticas.'],
];
const PROCESO = [
  ['Solicitud digital', 'El cliente completa su solicitud y carga la documentación desde un formulario online.'],
  ['Scoring y análisis de riesgo', 'El motor de scoring sugiere una decisión según tu política de riesgo.'],
  ['Aprobación preliminar', 'Tu equipo revisa la propuesta y aprueba, ajusta o rechaza con un clic.'],
  ['Verificación y firma', 'En sucursal: documentación original, datos biométricos y firma del contrato.', true],
  ['Desembolso y seguimiento', 'Con la firma confirmada, el sistema acredita el préstamo y sigue las cuotas.'],
];

export default function Empresas() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(demoSchema), defaultValues: { nombre: '', empresa: '', email: '', mensaje: '' } });
  const onSubmit = (d) => {
    actions.consulta({ nombre: `${d.nombre} (${d.empresa})` });
    toast.success('¡Listo! Un especialista se va a poner en contacto con vos.');
    reset();
  };
  return (
    <>
      <section className="dark-hero" aria-labelledby="empTitle">
        <div className="hero-bg"><img src="/img/portada.jpg" alt="" /></div>
        <div className="hero-shade dark" />
        <div className="container hero-content">
          <p className="eyebrow fade-in-up" style={{ '--base': '100ms' }}>NexaCred para financieras y prestamistas</p>
          <Split as="h1" className="t-hero" text="Gestioná cada préstamo en un solo lugar." base={200} />
          <p className="t-sub hero-sub fade-in-up" style={{ '--base': '1000ms' }}>NexaCred es el sistema SaaS que digitaliza el otorgamiento de créditos, automatiza el análisis de riesgo y centraliza tu cartera. No prestamos dinero: te damos la plataforma.</p>
          <div className="hero-btns fade-in-up" style={{ '--base': '1200ms' }}>
            <Button to="/admin" arrow>Probar el sistema</Button>
            <Button to="/manual" variant="ghost-light">Ver el manual</Button>
          </div>
        </div>
      </section>

      <section className="stats dark-stats">
        <div className="container"><div className="row g-0">
          {[[<CountUp to={40} prefix="+" />, 'Entidades activas (ejemplo)'], [<CountUp to={99.9} format={(n) => n.toFixed(1)} suffix="%" />, 'Disponibilidad objetivo'], [<CountUp to={35} prefix="−" suffix="%" />, 'Tiempo de aprobación'], [<CountUp to={5} />, 'Etapas de punta a punta']].map(([v, l], i) => (
            <Reveal className="col-6 col-lg-3 stat" delay={i} key={l}><strong className="t-lg">{v}</strong><span>{l}</span></Reveal>
          ))}
        </div></div>
      </section>

      <section className="section" aria-labelledby="procTitle">
        <div className="container">
          <p className="eyebrow">Cómo funciona</p>
          <Split className="t-xl" onView text="De la solicitud al cobro, en cinco pasos." />
          <ol className="proc">
            {PROCESO.map(([t, d, br], i) => (
              <Reveal as="li" key={t} delay={i % 3} className={br ? 'branch' : ''}>
                <span className="proc-n num">{String(i + 1).padStart(2, '0')}</span>
                <div><h3>{t}{br && <em className="chip">Presencial en sucursal</em>}</h3><p>{d}</p></div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section chalk" aria-labelledby="featTitle">
        <div className="container">
          <p className="eyebrow">Características</p>
          <Split className="t-xl" onView text="Todo lo que tu financiera necesita." />
          <div className="row g-4 feat-grid">
            {FEATURES.map(([Ic, t, d], i) => (
              <Reveal className="col-md-6 col-xl-4" delay={i % 3} key={t}>
                <article className="feat"><span className="ico"><Ic size={22} /></span><h3>{t}</h3><p>{d}</p></article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section dark" aria-labelledby="tryTitle">
        <div className="container text-center">
          <Split className="t-xl" onView text="¿Querés ver el sistema por dentro?" />
          <Reveal delay={2}><p className="t-sub" style={{ margin: '24px auto 40px', maxWidth: 600 }}>Entrá al panel de administración de la demo: tiene solicitudes de ejemplo para aprobar, analizar el riesgo, verificar, firmar y desembolsar.</p>
            <div className="hero-btns" style={{ justifyContent: 'center' }}><Button to="/admin" arrow>Abrir el panel</Button><Button to="/manual" variant="ghost-light">Recorrer el manual</Button></div></Reveal>
        </div>
      </section>

      <section className="section" id="demo" aria-labelledby="demoTitle">
        <div className="container">
          <div className="row gy-5 gx-lg-5">
            <div className="col-lg-5">
              <p className="eyebrow">Demostración</p>
              <Split className="t-xl" onView text="Pedí una demo gratuita." />
              <Reveal><p className="t-sub" style={{ marginTop: 20 }}>Contanos sobre tu operación y te mostramos cómo NexaCred se adapta a tu cartera. Implementación acompañada, sin compromiso de permanencia.</p></Reveal>
            </div>
            <div className="col-lg-7">
              <Reveal>
                <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6 field"><label htmlFor="dNombre">Nombre completo</label><input id="dNombre" className={`input ${errors.nombre ? 'invalid' : ''}`} {...register('nombre')} /><span className="err">{errors.nombre?.message}</span></div>
                    <div className="col-md-6 field"><label htmlFor="dEmpresa">Empresa / financiera</label><input id="dEmpresa" className={`input ${errors.empresa ? 'invalid' : ''}`} {...register('empresa')} /><span className="err">{errors.empresa?.message}</span></div>
                    <div className="col-12 field"><label htmlFor="dEmail">Email corporativo</label><input id="dEmail" type="email" className={`input ${errors.email ? 'invalid' : ''}`} {...register('email')} /><span className="err">{errors.email?.message}</span></div>
                    <div className="col-12 field"><label htmlFor="dMsg">Contanos sobre tu operación</label><textarea id="dMsg" className="textarea" {...register('mensaje')} /></div>
                  </div>
                  <Button type="submit">Solicitar demostración <Send size={16} /></Button>
                </form>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, BadgeCheck, Gauge, TriangleAlert, Info } from 'lucide-react';
import { useStore } from '../../lib/store';
import { money, pct, num } from '../../lib/format';
import { resumenCartera, diasAtraso } from '../../lib/cartera';
import { ESCALA } from '../../lib/finanzas';
import CountUp from '../../components/ui/CountUp';
import Modal from '../../components/ui/Modal';
import { EstadoPill } from '../../components/admin/ui';

const DATA = {
  '6m': { v: [52, 46, 64, 58, 75, 92], l: ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'] },
  '12m': { v: [45, 50, 55, 48, 60, 65, 70, 68, 74, 80, 85, 90], l: ['N', 'D', 'E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O'] },
};

function Detalle({ k, onClose }) {
  return (
    <Modal title={k.l} onClose={onClose}>
      <p className="kpi-big num">{k.texto}</p>
      <div className="explain">
        <h4>¿Qué es?</h4><p>{k.que}</p>
        <h4>¿Cómo se calcula?</h4><p>{k.como}</p>
        <h4>¿Cómo leerlo?</h4><p>{k.leer}</p>
      </div>
      {k.detalle?.length > 0 && (
        <>
          <h4 className="mini-h" style={{ marginTop: 24 }}>{k.detalleTitulo}</h4>
          <div className="rows num">{k.detalle.map(([a, b]) => <div key={a}><span>{a}</span><span>{b}</span></div>)}</div>
        </>
      )}
    </Modal>
  );
}

export default function Panel() {
  const { solicitudes } = useStore();
  const [per, setPer] = useState('6m');
  const [ver, setVer] = useState(null);
  const { activos, cartera, mora30, saldoMora30, mora } = resumenCartera(solicitudes);
  const aprobadas = solicitudes.filter((a) => a.estado === 'aprobado' || a.estado === 'desembolsado');
  const rechazadas = solicitudes.filter((a) => a.estado === 'rechazado');
  const pendientes = solicitudes.filter((a) => a.estado === 'pendiente');
  const decididas = aprobadas.length + rechazadas.length;
  const tasa = decididas ? aprobadas.length / decididas : 0;
  const score = solicitudes.length ? Math.round(solicitudes.reduce((s, a) => s + a.score, 0) / solicitudes.length) : 0;
  const nivel = (s) => (s >= 700 ? 'bajo' : s >= 600 ? 'medio' : 'alto');
  const porNivel = (k) => solicitudes.filter((a) => nivel(a.score) === k).length;
  const recientes = solicitudes.slice(-5).reverse();
  const moraTxt = pct(mora, 1);

  const kpis = [
    {
      icon: Landmark, l: 'Cartera activa', v: <CountUp to={cartera} prefix="$ " />, texto: money(cartera),
      que: 'Es el dinero que los clientes todavía nos deben. Suma lo que falta pagar de capital de todos los créditos ya entregados.',
      como: 'Suma del saldo pendiente de cada crédito desembolsado. A medida que el cliente paga cuotas, su saldo baja.',
      leer: 'Si crece, la entidad está prestando más. Es el monto sobre el que se generan los intereses y sobre el que se mide la mora.',
      detalleTitulo: `${activos.length} créditos activos`, detalle: activos.slice().sort((a, b) => b.saldo - a.saldo).map((a) => [a.cliente, money(a.saldo)]),
    },
    {
      icon: BadgeCheck, l: 'Tasa de aprobación', v: <CountUp to={tasa * 100} suffix="%" />, texto: pct(tasa, 0),
      que: 'De cada 100 solicitudes que ya fueron revisadas, cuántas se aprobaron.',
      como: 'Solicitudes aprobadas o desembolsadas ÷ solicitudes ya decididas (aprobadas + rechazadas). Las pendientes todavía no cuentan.',
      leer: 'Un número muy alto puede indicar criterios flojos; uno muy bajo, que se pierden clientes buenos. Conviene mirarlo junto con la mora.',
      detalleTitulo: 'Cómo se compone', detalle: [['Aprobadas o desembolsadas', aprobadas.length], ['Rechazadas', rechazadas.length], ['Pendientes (no cuentan todavía)', pendientes.length]],
    },
    {
      icon: Gauge, l: 'Score promedio', v: <CountUp to={score} />, texto: `${score} puntos`,
      que: `Es el puntaje de riesgo promedio de todos los solicitantes. El score va de ${ESCALA.min} a ${ESCALA.max}: cuanto más alto, mejor perfil de pago.`,
      como: 'Promedio del score de todas las solicitudes cargadas. El score de cada una se explica en la pantalla de Scoring de riesgo.',
      leer: 'Desde 700: riesgo bajo · de 600 a 699: riesgo medio · menos de 600: riesgo alto.',
      detalleTitulo: 'Solicitudes por nivel de riesgo', detalle: [['Riesgo bajo (700 o más)', porNivel('bajo')], ['Riesgo medio (600 a 699)', porNivel('medio')], ['Riesgo alto (menos de 600)', porNivel('alto')]],
    },
    {
      icon: TriangleAlert, l: 'Mora 30+ días', v: <CountUp to={mora * 100} suffix="%" format={(n) => n.toFixed(1).replace('.', ',')} />, texto: moraTxt,
      que: 'Es qué parte de la cartera está atrasada hace más de 30 días. La mora es el indicador más importante de la salud de los créditos.',
      como: `Saldo de los créditos con más de 30 días de atraso ÷ cartera activa. Hoy: ${money(saldoMora30)} ÷ ${money(cartera)}.`,
      leer: 'Menos de 5%: sana · entre 5% y 10%: hay que prestar atención · más de 10%: preocupante, conviene reforzar la cobranza.',
      detalleTitulo: mora30.length ? 'Créditos con más de 30 días de atraso' : 'Hoy no hay créditos con más de 30 días de atraso', detalle: mora30.map((a) => [a.cliente, `${num(diasAtraso(a))} días · ${money(a.saldo)}`]),
    },
  ];
  const d = DATA[per];
  return (
    <>
      <div className="kpis">
        {kpis.map((k) => (
          <button type="button" className="card kpi" key={k.l} onClick={() => setVer(k)} aria-label={`${k.l}: ver qué significa`}>
            <span className="kpi-ico"><k.icon size={18} /></span>
            <span className="kpi-l">{k.l}</span>
            <strong className="kpi-v">{k.v}</strong>
            <span className="kpi-more"><Info size={14} /> Qué significa</span>
          </button>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>Desembolsos mensuales</h2>
            <select className="select select-sm" value={per} onChange={(e) => setPer(e.target.value)} aria-label="Período">
              <option value="6m">Últimos 6 meses</option><option value="12m">Último año</option>
            </select>
          </div>
          <div className="bars" key={per}>
            {d.v.map((h, i) => (
              <div className="bar" key={i}><span style={{ '--h': h + '%', '--i': i }} /><small>{d.l[i]}</small></div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Solicitudes recientes</h2><Link to="/admin/solicitudes" className="link-btn">Ver todas</Link></div>
          <ul className="recent">
            {recientes.map((a) => (
              <li key={a.id}><span>{a.cliente}</span><EstadoPill estado={a.estado} /></li>
            ))}
          </ul>
        </div>
      </div>
      {ver && <Detalle k={ver} onClose={() => setVer(null)} />}
    </>
  );
}

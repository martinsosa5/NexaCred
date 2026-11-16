import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, BadgeCheck, Gauge, TriangleAlert } from 'lucide-react';
import { useStore } from '../../lib/store';
import { money, pct } from '../../lib/format';
import CountUp from '../../components/ui/CountUp';
import { EstadoPill } from '../../components/admin/ui';

const DATA = {
  '6m': { v: [52, 46, 64, 58, 75, 92], l: ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct'] },
  '12m': { v: [45, 50, 55, 48, 60, 65, 70, 68, 74, 80, 85, 90], l: ['N', 'D', 'E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O'] },
};

export default function Panel() {
  const { solicitudes } = useStore();
  const [per, setPer] = useState('6m');
  const activos = solicitudes.filter((a) => a.estado === 'desembolsado');
  const cartera = activos.reduce((s, a) => s + (a.saldo || 0), 0);
  const mora = activos.length ? activos.filter((a) => a.estadoPago === 'atrasado').length / activos.length : 0;
  const ok = solicitudes.filter((a) => a.estado === 'aprobado' || a.estado === 'desembolsado').length;
  const noRech = solicitudes.filter((a) => a.estado !== 'rechazado').length || 1;
  const score = solicitudes.length ? Math.round(solicitudes.reduce((s, a) => s + a.score, 0) / solicitudes.length) : 0;
  const recientes = solicitudes.slice(-5).reverse();
  const kpis = [
    { icon: Landmark, l: 'Cartera activa', v: <CountUp to={cartera} prefix="$ " /> },
    { icon: BadgeCheck, l: 'Tasa de aprobación', v: <CountUp to={(ok / noRech) * 100} suffix="%" /> },
    { icon: Gauge, l: 'Score promedio', v: <CountUp to={score} /> },
    { icon: TriangleAlert, l: 'Mora 30+ días', v: <CountUp to={mora * 100} suffix="%" format={(n) => n.toFixed(1).replace('.', ',')} /> },
  ];
  const d = DATA[per];
  return (
    <>
      <div className="kpis">
        {kpis.map((k) => (
          <div className="card kpi" key={k.l}>
            <span className="kpi-ico"><k.icon size={18} /></span>
            <span className="kpi-l">{k.l}</span>
            <strong className="kpi-v">{k.v}</strong>
          </div>
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
      <p className="fine" style={{ marginTop: 16 }}>Cartera activa: {money(cartera)} · Mora: {pct(mora, 1)}. Datos de ejemplo.</p>
    </>
  );
}

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CircleCheck, TriangleAlert, Lightbulb, RefreshCw, Inbox } from 'lucide-react';
import { useStore, actions } from '../../lib/store';
import { money, idFmt, iniciales } from '../../lib/format';
import { nivelRiesgo, factoresScore } from '../../lib/finanzas';
import { Empty } from '../../components/admin/ui';
import Button from '../../components/ui/Button';

export default function Scoring() {
  const { solicitudes } = useStore();
  const [sel, setSel] = useState(solicitudes[0]?.id);
  const a = solicitudes.find((x) => x.id === Number(sel)) || solicitudes[0];
  const recalcular = () => { actions.recalcularScore(a.id); toast('Análisis actualizado.', { icon: '🔄' }); };
  if (!a) return <div className="card"><Empty icon={Inbox}>No hay solicitudes para analizar.</Empty></div>;
  const r = nivelRiesgo(a.score);
  return (
    <div className="card narrow-card">
      <div className="field" style={{ marginBottom: 24 }}>
        <label htmlFor="sc">Solicitud a analizar</label>
        <select id="sc" className="select" value={a.id} onChange={(e) => setSel(e.target.value)}>
          {solicitudes.map((x) => <option key={x.id} value={x.id}>{x.cliente} · Solicitud {idFmt(x.id)}</option>)}
        </select>
      </div>
      <div className="person"><span className="avatar">{iniciales(a.cliente)}</span><div><strong>{a.cliente}</strong><small>Solicitud {idFmt(a.id)} · {money(a.monto)}</small></div></div>
      <div className="score">
        <div className="score-top"><strong className="num">{a.score}</strong><span className={`pill pill-${r.key === 'bajo' ? 'ok' : r.key === 'medio' ? 'warn' : 'bad'}`}>{r.label}</span></div>
        <div className="score-bar"><span style={{ width: Math.min(100, Math.round(a.score / 10)) + '%' }} key={a.id + '-' + a.score} /></div>
      </div>
      <ul className="factors">
        {factoresScore(a.score).map((f) => <li key={f.text}>{f.ok ? <CircleCheck size={16} className="ok" /> : <TriangleAlert size={16} className="warn" />} {f.text}</li>)}
      </ul>
      <div className="recomend"><Lightbulb size={18} /><span><strong>Recomendación del sistema:</strong> {r.recomendacion}</span></div>
      <Button variant="ghost" size="sm" onClick={recalcular} style={{ marginTop: 20 }}><RefreshCw size={14} /> Actualizar análisis</Button>
    </div>
  );
}

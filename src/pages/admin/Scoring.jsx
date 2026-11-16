import { useState } from 'react';
import toast from 'react-hot-toast';
import { CircleCheck, TriangleAlert, Minus, Lightbulb, RefreshCw, Inbox, Search, ChevronDown } from 'lucide-react';
import { useStore, actions } from '../../lib/store';
import { money, idFmt, iniciales } from '../../lib/format';
import { nivelRiesgo, factoresSolicitud, ESCALA, REGLAS_SCORE } from '../../lib/finanzas';
import { Empty } from '../../components/admin/ui';
import Button from '../../components/ui/Button';

const pos = (s) => ((s - ESCALA.min) / (ESCALA.max - ESCALA.min)) * 100;
const IC = { ok: <CircleCheck size={16} className="ok" />, neutro: <Minus size={16} className="neu" />, mal: <TriangleAlert size={16} className="warn" /> };

function Escala({ score }) {
  const total = ESCALA.max - ESCALA.min;
  return (
    <div className="scale">
      <div className="scale-track">
        {ESCALA.bandas.map((b) => (
          <span key={b.key} className={`seg seg-${b.key}`} style={{ width: ((b.hasta - b.desde + 1) / total) * 100 + '%' }} />
        ))}
        <i className="scale-marker" style={{ left: pos(score) + '%' }} key={score}><b className="num">{score}</b></i>
      </div>
      <div className="scale-ticks num">
        <span style={{ left: 0 }}>{ESCALA.min}</span>
        <span style={{ left: pos(600) + '%' }}>600</span>
        <span style={{ left: pos(700) + '%' }}>700</span>
        <span style={{ left: '100%' }}>{ESCALA.max}</span>
      </div>
      <ul className="band-legend">
        {ESCALA.bandas.map((b) => (
          <li key={b.key}><span className={`dotc seg-${b.key}`} /><div><strong>{b.label}</strong> <span className="num">({b.desde} a {b.hasta})</span><small>{b.accion}</small></div></li>
        ))}
      </ul>
    </div>
  );
}

export default function Scoring() {
  const { solicitudes } = useStore();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [como, setComo] = useState(false);
  const lista = solicitudes.filter((x) => x.cliente.toLowerCase().includes(q.trim().toLowerCase()));
  const a = solicitudes.find((x) => x.id === Number(sel)) || lista[0];
  if (!solicitudes.length) return <div className="card"><Empty icon={Inbox}>No hay solicitudes para analizar.</Empty></div>;
  const recalcular = () => { actions.recalcularScore(a.id); toast('Análisis actualizado.', { icon: '🔄' }); };
  const r = a && nivelRiesgo(a.score);
  return (
    <div className="scoring-grid">
      <div className="card">
        <div className="field" style={{ marginBottom: 12 }}>
          <label htmlFor="sq">Buscar solicitante</label>
          <div className="search full"><Search size={16} /><input id="sq" className="input" placeholder="Nombre del cliente" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        </div>
        <div className="field" style={{ marginBottom: 24 }}>
          <label htmlFor="sc">Solicitud a analizar</label>
          <select id="sc" className="select" value={a?.id ?? ''} onChange={(e) => setSel(e.target.value)} disabled={!lista.length}>
            {lista.map((x) => <option key={x.id} value={x.id}>{x.cliente} · Solicitud {idFmt(x.id)}</option>)}
          </select>
          {!lista.length && <span className="err">No se encontraron solicitantes con ese nombre.</span>}
        </div>
        {a && (
          <>
            <div className="person"><span className="avatar">{iniciales(a.cliente)}</span><div><strong>{a.cliente}</strong><small>Solicitud {idFmt(a.id)} · {money(a.monto)} en {a.plazo} cuotas</small></div></div>
            <div className="score">
              <div className="score-top"><strong className="num">{a.score}</strong><span className="score-of">de {ESCALA.max}</span><span className={`pill pill-${r.key === 'bajo' ? 'ok' : r.key === 'medio' ? 'warn' : 'bad'}`}>{r.label}</span></div>
              <Escala score={a.score} />
            </div>
            <div className="recomend"><Lightbulb size={18} /><span><strong>Recomendación del sistema:</strong> {r.recomendacion}</span></div>
            <Button variant="ghost" size="sm" onClick={recalcular} style={{ marginTop: 20 }}><RefreshCw size={14} /> Actualizar análisis</Button>
          </>
        )}
      </div>
      {a && (
        <div className="stack-col">
          <div className="card">
            <div className="card-head"><h2>¿Qué factores influyen en este puntaje?</h2></div>
            <ul className="factors-d">
              {factoresSolicitud(a).map((f) => (
                <li key={f.nombre}>{IC[f.nivel]}<div><strong>{f.nombre}: <span className="fval">{f.valor}</span></strong><small>{f.nota}</small></div></li>
              ))}
            </ul>
          </div>
          <div className="card">
            <button type="button" className="acc-simple" aria-expanded={como} onClick={() => setComo(!como)}>
              <h2>¿Cómo se calcula el score?</h2><ChevronDown size={18} className={como ? 'rot' : ''} />
            </button>
            <p className="fine" style={{ marginTop: 6 }}>Puntaje de 300 a 990. Se suman o restan puntos según estas reglas.</p>
            {como && (
              <div className="rules fade-in-up">
                {REGLAS_SCORE.map((x) => (
                  <div key={x.nombre} className="rule"><div><strong>{x.nombre}</strong><small>{x.detalle}</small></div><span className="num">{x.pts}</span></div>
                ))}
                <p className="fine">El resultado se limita al rango de 300 a 990. En un entorno real, la consulta a buró (por ejemplo la Central de Deudores del BCRA o una agencia de informes crediticios) se hace por API con el DNI y se valida la identidad y los ingresos con la documentación original en la sucursal.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

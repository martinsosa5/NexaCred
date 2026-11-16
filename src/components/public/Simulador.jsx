import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSim } from '../../context/SimContext';
import { MIN, MAX, STEP, PLAZOS, cronograma } from '../../lib/finanzas';
import { money, pct, digits, num } from '../../lib/format';
import Button from '../ui/Button';
import Reveal from '../ui/Reveal';

/** Número que se anima al cambiar (suave, 240 ms). */
function AnimMoney({ value, className }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      from.current = value;
      return;
    }
    const a = from.current;
    const t0 = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 260);
      const e = 1 - Math.pow(1 - p, 3);
      setShown(a + (value - a) * e);
      if (p < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{money(shown)}</span>;
}

export default function Simulador() {
  const { monto, plazo, setMonto, setPlazo, calc } = useSim();
  const [texto, setTexto] = useState(num(monto));
  const [hint, setHint] = useState('');
  const [tabla, setTabla] = useState(false);

  useEffect(() => setTexto(num(monto)), [monto]);

  const onTexto = (e) => {
    let raw = parseInt(digits(e.target.value) || '0', 10);
    if (raw > MAX) raw = MAX;
    setTexto(raw ? num(raw) : '');
    if (raw >= MIN) {
      setHint('');
      setMonto(raw);
    } else setHint(`El monto mínimo es ${money(MIN)}.`);
  };
  const onBlur = () => {
    const raw = parseInt(digits(texto) || '0', 10);
    const v = Math.min(MAX, Math.max(MIN, Math.round(raw / 1000) * 1000));
    setMonto(v);
    setTexto(num(v));
    setHint('');
  };
  const pctRange = ((monto - MIN) / (MAX - MIN)) * 100;

  return (
    <section className="section chalk" id="simulador" aria-labelledby="simTitle">
      <div className="container">
        <Reveal className="sim-head">
          <p className="eyebrow">Simulador</p>
          <h2 className="t-xl" id="simTitle">Sabé cuánto vas a pagar, antes de pedir nada.</h2>
        </Reveal>

        <div className="row g-4 sim-grid">
          <Reveal className="col-lg-6" variant="reveal-zoom">
            <div className="sim-card">
              <div className="field">
                <label htmlFor="monto">¿Cuánto necesitás?</label>
                <div className="money-input">
                  <span>$</span>
                  <input id="monto" className="num" inputMode="numeric" autoComplete="off" value={texto} onChange={onTexto} onBlur={onBlur}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} aria-describedby="montoHint" />
                </div>
                <div className="err" id="montoHint" role="status">{hint}</div>
              </div>
              <input
                className="range" type="range" min={MIN} max={MAX} step={STEP} value={monto}
                style={{ '--pct': pctRange + '%' }} aria-label="Monto del préstamo"
                onChange={(e) => setMonto(Number(e.target.value))}
              />
              <div className="range-scale"><span>{money(MIN)}</span><span>{money(MAX)}</span></div>

              <fieldset className="plazos">
                <legend className="label">¿En cuántas cuotas?</legend>
                <div className="plazo-grid">
                  {PLAZOS.map((n) => (
                    <label key={n} className={`plazo ${n === plazo ? 'on' : ''}`}>
                      <input type="radio" name="plazo" value={n} checked={n === plazo} onChange={() => setPlazo(n)} />
                      <strong>{n}</strong>
                      <small>cuotas</small>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="fine">Sistema francés, cuota fija. Las tasas son orientativas y la simulación no es una oferta firme.</p>
            </div>
          </Reveal>

          <Reveal className="col-lg-6" delay={1} variant="reveal-zoom">
            <div className="result-card" aria-live="polite">
              <p className="eyebrow">Tu cuota mensual estimada</p>
              <div className="cuota-big">
                <AnimMoney value={calc.cuota} className="num" />
                <span className="sr-only">Cuota mensual estimada: {money(calc.cuota)}</span>
              </div>
              <div className="result-rows">
                <div><span>Recibís en tu cuenta</span><strong className="num">{money(calc.recibe)}</strong></div>
                <div><span>Total a pagar</span><strong className="num">{money(calc.total)}</strong></div>
                <div><span>TNA</span><strong className="num">{pct(calc.tna, 0)}</strong></div>
                <div><span>CFT (costo financiero total)</span><strong className="num">{pct(calc.cft, 1)}</strong></div>
              </div>
              <p className="fine">Incluye seguro de vida sobre saldo. El gasto de otorgamiento (2 %) se descuenta del monto que recibís.</p>
              <div className="result-actions">
                <Button to="/solicitud" arrow className="btn-block">Solicitar este préstamo</Button>
                <button className="link-btn" onClick={() => setTabla(!tabla)} aria-expanded={tabla}>
                  {tabla ? 'Ocultar' : 'Ver'} el detalle de cada cuota <ChevronDown size={16} className={tabla ? 'flip' : ''} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>

        {tabla && (
          <div className="table-wrap fade-in-up">
            <table className="table-plain num">
              <thead><tr><th>N.º</th><th>Capital</th><th>Interés</th><th>Seguro</th><th>Cuota</th><th>Saldo</th></tr></thead>
              <tbody>
                {cronograma(monto, plazo).map((f) => (
                  <tr key={f.n}>
                    <td>{f.n}</td><td>{money(f.capital)}</td><td>{money(f.interes)}</td><td>{money(f.seguro)}</td><td>{money(f.cuota)}</td><td>{money(f.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

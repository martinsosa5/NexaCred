import { useEffect, useState } from 'react';
import { useInView } from '../../hooks/useInView';

/** Número que cuenta desde 0 hasta `to` cuando entra en pantalla. */
export default function CountUp({ to, prefix = '', suffix = '', duration = 1400, format = (n) => Math.round(n).toLocaleString('es-AR') }) {
  const [ref, seen] = useInView({ threshold: 0.4 });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(to);
      return;
    }
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return (
    <span ref={ref} className="num">
      {prefix}
      {format(v)}
      {suffix}
    </span>
  );
}

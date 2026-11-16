import { useInView } from '../../hooks/useInView';

/**
 * Titular animado: cada palabra sube desde una máscara.
 * - onView=false: anima al cargar la página (hero).
 * - onView=true: anima cuando entra en pantalla.
 */
export default function Split({ text, as: Tag = 'h2', className = '', onView = false, base = 0 }) {
  const [ref, seen] = useInView({ threshold: 0.3 });
  const words = text.split(' ');
  return (
    <Tag
      ref={ref}
      className={`split ${onView ? 'on-view' : ''} ${seen ? 'in' : ''} ${className}`}
      style={{ '--base': `${base}ms` }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span className="w" key={i} aria-hidden="true">
          <span style={{ '--i': i }}>{w}</span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}

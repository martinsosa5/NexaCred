import { useInView } from '../../hooks/useInView';

/** Hace aparecer a su contenido (fade + desplazamiento) al entrar en pantalla. */
export default function Reveal({ as: Tag = 'div', delay = 0, variant = '', className = '', children, ...rest }) {
  const [ref, seen] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${variant} ${seen ? 'in' : ''} ${className}`} style={{ '--d': delay }} {...rest}>
      {children}
    </Tag>
  );
}

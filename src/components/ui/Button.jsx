import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** Botón píldora. Con `to` es un enlace de la app, con `href` un enlace externo / ancla. */
export default function Button({ variant = 'primary', size, arrow = false, to, href, className = '', children, ...rest }) {
  const cls = `btn btn-${variant} ${size ? 'btn-' + size : ''} ${className}`;
  const content = (
    <>
      {children}
      {arrow && <ArrowRight size={16} className="arrow" />}
    </>
  );
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>;
  return <button className={cls} {...rest}>{content}</button>;
}

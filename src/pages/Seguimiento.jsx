import { useState } from 'react';
import { ClipboardList, LockKeyhole, Check, Clock } from 'lucide-react';
import { useStore } from '../lib/store';
import { consultarSolicitud } from '../lib/seguimiento';
import { fechaCorta } from '../lib/format';
import Button from '../components/ui/Button';
import '../styles/seguimiento.css';

const fechaPublica = (valor) => valor ? (valor.includes('T') ? new Date(valor).toLocaleString('es-AR') : fechaCorta(valor)) : 'No registrada';
const ERROR = 'No pudimos consultar la solicitud con esos datos. Revisá el número y el código privado. Las solicitudes antiguas sin código no permiten esta consulta.';

export default function Seguimiento() {
  const { solicitudes } = useStore();
  const [numero, setNumero] = useState('');
  const [codigo, setCodigo] = useState('');
  const [consulta, setConsulta] = useState(null);
  const resultado = consulta ? consultarSolicitud(solicitudes, consulta.numero, consulta.codigo) : null;
  const consultar = (e) => {
    e.preventDefault();
    setConsulta({ numero: numero.trim(), codigo: codigo.trim() });
  };
  return <section className="section seg-pagina">
    <div className="container narrow">
      <header className="seg-titulo">
        <span className="ico"><ClipboardList size={24} /></span>
        <p className="eyebrow">Seguimiento de solicitudes</p>
        <h1 className="t-xl">Consultar mi solicitud</h1>
        <p className="t-sub">Ingresá el número de solicitud y el código privado que recibiste al finalizar el formulario. No necesitás una cuenta de administrador.</p>
      </header>
      <div className="seg-demo"><LockKeyhole size={18} /><p>Demo académica: funciona únicamente en el mismo navegador y origen donde se creó la solicitud. Los datos se guardan localmente; este mecanismo no es adecuado para producción ni permite consultar desde otra computadora.</p></div>
      <form className="step-card seg-form" onSubmit={consultar}>
        <div className="field"><label htmlFor="seg-numero">Número de solicitud</label><input id="seg-numero" className="input" type="text" required maxLength={40} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="NC-2026-00013" value={numero} onChange={(e) => { setNumero(e.target.value); setConsulta(null); }} /></div>
        <div className="field"><label htmlFor="seg-codigo">Código privado de consulta</label><input id="seg-codigo" className="input" type="password" required maxLength={64} autoComplete="off" spellCheck={false} placeholder="Código entregado al enviar tu solicitud" value={codigo} onChange={(e) => { setCodigo(e.target.value); setConsulta(null); }} aria-describedby="seg-ayuda" /><small id="seg-ayuda" className="fine">Se necesitan ambos datos. No ingreses tu DNI, nombre ni contraseña de administrador.</small></div>
        <Button type="submit">Consultar estado</Button>
      </form>
      {consulta && !resultado && <p className="seg-error" role="alert">{ERROR}</p>}
      {resultado && <article className="step-card seg-resultado" aria-label="Estado de mi solicitud" aria-live="polite">
        <p className="eyebrow">Tu solicitud</p><h2>{resultado.numero}</h2>
        <span className={`pill ${resultado.estado.clase}`}>{resultado.estado.titulo}</span>
        <p>{resultado.estado.mensaje}</p>
        <dl className="seg-fechas"><dt>Fecha de presentación</dt><dd>{fechaPublica(resultado.fechaPresentacion)}</dd><dt>Última actualización</dt><dd>{fechaPublica(resultado.ultimaActualizacion)}</dd></dl>
        <h3>Seguimiento del proceso</h3>
        <ol className="seg-linea" aria-label="Etapas registradas de la solicitud">
          {resultado.etapas.map((etapa, i) => <li key={`${etapa.titulo}-${i}`} className={etapa.situacion}>
            <span className="seg-paso" aria-hidden="true">{etapa.situacion === 'completada' ? <Check size={16} /> : <Clock size={16} />}</span>
            <div><strong>{etapa.titulo}</strong><small>{etapa.situacion === 'pendiente' ? 'Pendiente' : 'Registrada'}{etapa.fecha ? ` · ${fechaPublica(etapa.fecha)}` : ' · Fecha no registrada'}</small></div>
          </li>)}
        </ol>
        <p className="fine">Solo se muestran etapas respaldadas por datos disponibles. El prototipo no registra una etapa independiente de evaluación.</p>
      </article>}
    </div>
  </section>;
}

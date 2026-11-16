import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Search, Plus, Eye, Check, X, Fingerprint, Inbox, CircleCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { can, useUsuario } from '../../lib/auth';
import { useStore, actions } from '../../lib/store';
import { money, fechaCorta, idFmt, iniciales } from '../../lib/format';
import { PLAZOS } from '../../lib/finanzas';
import { nuevaSolicitudSchema } from '../../lib/schemas';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { EstadoPill, Empty } from '../../components/admin/ui';

const FILTROS = [['todas', 'Todas'], ['pendientes', 'Pendientes'], ['aprobadas', 'Aprobadas'], ['rechazadas', 'Rechazadas']];
const ESTADO_LBL = { pendiente: 'Pendiente de revisión', aprobado: 'Aprobado, pendiente de verificación', desembolsado: 'Desembolsado', rechazado: 'Rechazado' };

function Detalle({ a, onClose }) {
  const docs = a.docs || ['DNI (frente y dorso)', 'Recibo de sueldo', 'Comprobante de domicilio'];
  const rows = [
    ['Monto solicitado', money(a.monto)], ['Plazo', `${a.plazo} cuotas`], ['Score', a.score], ['Estado', ESTADO_LBL[a.estado]],
    ...(a.por ? [[a.estado === 'desembolsado' ? 'Desembolsado por' : 'Decidido por', a.por]] : []),
    ...(a.numero ? [['N.º de solicitud', a.numero]] : []),
    ...(a.dni ? [['DNI', a.dni], ['Email', a.email], ['Celular', a.tel], ['Domicilio', a.domicilio], ['Situación laboral', a.laboral], ['Ingreso neto', money(a.ingreso)], ['Destino', a.destino], ['Cuota estimada', money(a.cuota)]] : []),
  ];
  return (
    <Modal side title="Detalle de la solicitud" onClose={onClose}>
      <div className="person"><span className="avatar">{iniciales(a.cliente)}</span><div><strong>{a.cliente}</strong><small>Solicitud {idFmt(a.id)} · {fechaCorta(a.fecha)}{a.origen === 'portal' ? ' · Portal online' : ''}</small></div></div>
      <div className="rows num" style={{ margin: '20px 0' }}>{rows.map(([k, v]) => <div key={k}><span>{k}</span><span>{v}</span></div>)}</div>
      <h4 className="mini-h">Documentación cargada</h4>
      <ul className="factors">
        {docs.map((d) => <li key={d}><CircleCheck size={16} className="ok" /> {d}</li>)}
        {a.terminosAceptados && <li><CircleCheck size={16} className="ok" /> Términos y condiciones aceptados y firma confirmada</li>}
      </ul>
    </Modal>
  );
}

function Nueva({ onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(nuevaSolicitudSchema), defaultValues: { cliente: '', monto: '', plazo: 24 } });
  const ok = (d) => {
    actions.crearManual(d);
    toast.success('Solicitud creada correctamente.');
    onClose();
  };
  return (
    <Modal title="Nueva solicitud" onClose={onClose}
      footer={<><Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button><Button type="submit" form="nueva">Crear solicitud</Button></>}>
      <form id="nueva" onSubmit={handleSubmit(ok)} noValidate className="stack">
        <div className="field"><label htmlFor="nc">Cliente</label><input id="nc" className={`input ${errors.cliente ? 'invalid' : ''}`} {...register('cliente')} /><span className="err">{errors.cliente?.message}</span></div>
        <div className="field"><label htmlFor="nm">Monto ($)</label><input id="nm" type="number" step="10000" className={`input ${errors.monto ? 'invalid' : ''}`} {...register('monto')} /><span className="err">{errors.monto?.message}</span></div>
        <div className="field"><label htmlFor="np">Plazo</label><select id="np" className="select" {...register('plazo')}>{PLAZOS.map((n) => <option key={n} value={n}>{n} cuotas</option>)}</select></div>
      </form>
    </Modal>
  );
}

export default function Solicitudes() {
  const { solicitudes } = useStore();
  const user = useUsuario();
  const puedeDecidir = can(user, 'decidir');
  const puedeVerificar = can(user, 'verificacion');
  const [f, setF] = useState('todas');
  const [q, setQ] = useState('');
  const [ver, setVer] = useState(null);
  const [nueva, setNueva] = useState(false);

  let list = solicitudes.slice();
  if (f === 'pendientes') list = list.filter((a) => a.estado === 'pendiente');
  if (f === 'aprobadas') list = list.filter((a) => a.estado === 'aprobado' || a.estado === 'desembolsado');
  if (f === 'rechazadas') list = list.filter((a) => a.estado === 'rechazado');
  if (q.trim()) list = list.filter((a) => a.cliente.toLowerCase().includes(q.trim().toLowerCase()));
  list.reverse();

  const aprobar = (a) => { actions.aprobar(a.id); toast.success(`Solicitud de ${a.cliente} aprobada.`); };
  const rechazar = (a) => { actions.rechazar(a.id); toast.error(`Solicitud de ${a.cliente} rechazada.`); };
  const detalle = ver && solicitudes.find((a) => a.id === ver);

  return (
    <>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar por cliente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar por cliente" /></div>
        <div className="filters" role="group" aria-label="Filtrar por estado">
          {FILTROS.map(([k, l]) => <button key={k} className={`filter ${f === k ? 'on' : ''}`} aria-pressed={f === k} onClick={() => setF(k)}>{l}</button>)}
        </div>
        <Button size="sm" onClick={() => setNueva(true)}><Plus size={16} /> Nueva solicitud</Button>
      </div>
      <div className="card table-card">
        <div className="table-scroll">
          <table className="table-admin num">
            <thead><tr><th>Cliente</th><th>Monto</th><th>Score</th><th>Fecha</th><th>Estado</th><th className="r">Acciones</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={6}><Empty icon={Inbox}>No se encontraron solicitudes.</Empty></td></tr>}
              {list.map((a) => (
                <tr key={a.id} className={a.origen === 'portal' ? 'row-new' : ''}>
                  <td className="strong">{a.cliente}{a.origen === 'portal' && <span className="chip tiny">Online</span>}</td>
                  <td>{money(a.monto)}</td><td>{a.score}</td><td>{fechaCorta(a.fecha)}</td><td><EstadoPill estado={a.estado} /></td>
                  <td className="r actions">
                    <Button size="sm" variant="ghost" onClick={() => setVer(a.id)}><Eye size={14} /> Ver</Button>
                    {a.estado === 'pendiente' && puedeDecidir && <><Button size="sm" variant="ok" onClick={() => aprobar(a)}><Check size={14} /> Aprobar</Button><Button size="sm" variant="bad" onClick={() => rechazar(a)}><X size={14} /> Rechazar</Button></>}
                    {a.estado === 'aprobado' && puedeVerificar && <Button size="sm" variant="light" to="/admin/verificacion"><Fingerprint size={14} /> Verificar</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {detalle && <Detalle a={detalle} onClose={() => setVer(null)} />}
      {nueva && <Nueva onClose={() => setNueva(false)} />}
      <p className="fine" style={{ marginTop: 16 }}>¿Querés ver el circuito completo? <Link to="/solicitud" className="link-btn">Cargá una solicitud desde el portal</Link> y aparece acá.</p>
    </>
  );
}

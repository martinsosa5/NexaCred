import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Wallet, Search, Download } from 'lucide-react';
import { useStore, actions } from '../../lib/store';
import { fechaCorta, tiempo } from '../../lib/format';
import { diasAtraso } from '../../lib/cartera';
import { ActIcon, Empty } from '../../components/admin/ui';
import Button from '../../components/ui/Button';
import CalendarioCobranzas from '../../components/admin/CalendarioCobranzas';
import RegistrarPago from '../../components/admin/RegistrarPago';
import HistorialPagos from '../../components/admin/HistorialPagos';
import ExportarReporte from '../../components/admin/ExportarReporte';
import { can, useUsuario } from '../../lib/auth';
import { cuotaActual, importePago as money, pesos, situacionCuota } from '../../lib/pagos';

const FILTROS = [['todos', 'Todos'], ['atrasados', 'Atrasados'], ['al_dia', 'Al día']];

export default function Cartera() {
  const { solicitudes, actividad } = useStore();
  const [q, setQ] = useState('');
  const [f, setF] = useState('todos');
  const [vista, setVista] = useState('lista');
  const [pagoId, setPagoId] = useState(null);
  const [historialId, setHistorialId] = useState(null);
  const [exportando, setExportando] = useState(false);
  const user = useUsuario();
  const todos = solicitudes.filter((a) => a.estado === 'desembolsado').map((a) => {
    const cuota = cuotaActual(a);
    const situacion = situacionCuota(cuota);
    return { ...a, cuotaActual: cuota, situacion, estadoPago: a.saldo === 0 ? 'cancelado' : situacion.estado === 'atrasado' ? 'atrasado' : 'al_dia' };
  });
  const nAtr = todos.filter((a) => a.estadoPago === 'atrasado').length;
  // Los atrasados van primero, de mayor a menor atraso; después, por próximo vencimiento.
  const activos = todos
    .filter((a) => a.cliente.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((a) => f === 'todos' || (f === 'atrasados') === (a.estadoPago === 'atrasado'))
    .sort((a, b) => diasAtraso(b) - diasAtraso(a) || (a.proximoVencimiento || '').localeCompare(b.proximoVencimiento || ''));
  const enviar = (a) => { actions.recordatorio(a.id); toast(`Recordatorio enviado a ${a.cliente}.`, { icon: '🔔' }); };
  return (
    <>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar por cliente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar por cliente" /></div>
        <div className="filters" role="group" aria-label="Filtrar por estado de pago">
          {FILTROS.map(([k, l]) => <button key={k} className={`filter ${f === k ? 'on' : ''}`} aria-pressed={f === k} onClick={() => setF(k)}>{l}{k === 'atrasados' && nAtr > 0 ? ` (${nAtr})` : ''}</button>)}
        </div>
      </div>
      <div className="toolbar" role="group" aria-label="Vista de cartera">
        {['lista', 'calendario'].map((v) => <button key={v} className={`filter ${vista === v ? 'on' : ''}`} aria-pressed={vista === v} onClick={() => setVista(v)}>Vista {v}</button>)}
        {can(user, 'cartera') && <Button size="sm" variant="ghost" onClick={() => setExportando(true)}><Download size={16} /> Exportar reporte CSV</Button>}
      </div>
      <div className="grid-2 wide-left">
        <div hidden={vista !== 'lista'} className="card table-card">
          <div className="card-head pad"><h2>Créditos activos</h2></div>
          <div className="table-scroll">
            <table className="table-admin num">
              <thead><tr><th>Cliente</th><th>Saldo</th><th>Próx. vencimiento</th><th>Estado</th><th className="r">Acción</th></tr></thead>
              <tbody>
                {activos.length === 0 && <tr><td colSpan={5}><Empty icon={Wallet}>{todos.length ? 'No hay créditos que coincidan con la búsqueda.' : 'Todavía no hay créditos desembolsados.'}</Empty></td></tr>}
                {activos.map((a) => (
                  <tr key={a.id} className={a.estadoPago === 'atrasado' ? 'row-late' : ''}>
                    <td className="strong">{a.cliente}</td><td>{money(a.saldo)}{a.saldoEstimado && <small className="pago-resumen">Saldo estimado</small>}</td><td>{fechaCorta(a.proximoVencimiento)}</td><td><span className={`pill ${a.estadoPago === 'cancelado' ? 'pill-ok' : a.situacion.estado === 'atrasado' ? 'pill-bad' : 'pill-info'}`}>{a.estadoPago === 'cancelado' ? 'Cancelado' : a.situacion.texto}</span>{a.cuotaActual?.recibido > 0 && <small className="pago-resumen">Pagado: {money(pesos(a.cuotaActual.recibido))} · Falta: {money(pesos(a.cuotaActual.total - a.cuotaActual.recibido))}</small>}</td>
                    <td className="r"><div className="pago-acciones"><Button size="sm" variant="ghost" onClick={() => setHistorialId(a.id)}>Ver historial</Button>{a.saldo > 0 && <Button size="sm" onClick={() => setPagoId(a.id)}>Registrar pago</Button>}{a.estadoPago === 'atrasado' && <Button size="sm" variant="ghost" onClick={() => enviar(a)}><Bell size={14} /> Enviar recordatorio</Button>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div hidden={vista !== 'calendario'} className="cob-contenedor">
          <CalendarioCobranzas creditos={activos} onRecordatorio={enviar} onRegistrarPago={(a) => setPagoId(a.id)} onVerHistorial={(a) => setHistorialId(a.id)} />
        </div>
        <div className="card">
          <div className="card-head"><h2>Acciones automáticas</h2></div>
          <ul className="feed">
            {actividad.slice(0, 8).map((e, i) => <li key={i}><span className="feed-ico"><ActIcon name={e.icon} /></span><span>{e.text}<small>{e.by ? `${e.by} · ` : ''}{tiempo(e.at)}</small></span></li>)}
          </ul>
        </div>
      </div>
      {pagoId !== null && <RegistrarPago key={pagoId} credito={solicitudes.find((a) => a.id === pagoId)} onClose={() => setPagoId(null)} />}
      {historialId !== null && <HistorialPagos key={historialId} creditoId={historialId} onClose={() => setHistorialId(null)} />}
      {exportando && <ExportarReporte idsFiltrados={activos.map((a) => a.id)} descripcionFiltros={`cliente: ${q.trim() || 'todos'}; estado: ${FILTROS.find(([k]) => k === f)[1]}`} onClose={() => setExportando(false)} />}
    </>
  );
}

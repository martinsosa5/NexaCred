import { useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../../lib/store';
import { can, usuarioActual, useUsuario } from '../../lib/auth';
import { descargarReporteCSV, prepararReporte, TIPOS_REPORTE } from '../../lib/reportes';
import { importePago } from '../../lib/pagos';
import { fechaCorta } from '../../lib/format';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import '../../styles/reportes.css';

export default function ExportarReporte({ idsFiltrados, descripcionFiltros, onClose }) {
  const state = useStore();
  const user = useUsuario();
  const [tipo, setTipo] = useState('creditos_activos');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [estado, setEstado] = useState('todos');
  const [clienteId, setClienteId] = useState('');
  const [alcance, setAlcance] = useState('todos');
  const [incluirEstimaciones, setIncluirEstimaciones] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState('');
  const config = { tipo, desde, hasta, estado, clienteId, alcance, incluirEstimaciones, idsFiltrados };
  let reporte; let error = '';
  try { reporte = prepararReporte(state, config); } catch (e) { error = e.message; }
  const clientes = state.solicitudes.filter((a) => a.estado === 'desembolsado' || (state.pagos || []).some((p) => p.creditoId === a.id));
  const periodo = `${desde ? fechaCorta(desde) : 'Sin inicio'} — ${hasta ? fechaCorta(hasta) : 'Sin fin'}`;
  const cambiarTipo = (valor) => {
    setTipo(valor); setEstado('todos'); setErrorDescarga('');
    if (valor === 'proximos_vencimientos') { setDesde(format(startOfMonth(new Date()), 'yyyy-MM-dd')); setHasta(format(endOfMonth(new Date()), 'yyyy-MM-dd')); }
  };
  const descargar = (e) => {
    e.preventDefault(); setErrorDescarga('');
    if (!can(usuarioActual(), 'cartera')) { setErrorDescarga('Tu sesión ya no tiene permiso para exportar cobranzas.'); return; }
    try { descargarReporteCSV(prepararReporte(state, config)); toast.success('Descarga del reporte iniciada.'); }
    catch (e) { setErrorDescarga(e.message); }
  };
  return <Modal title="Exportar reporte de cobranzas" onClose={onClose}>
    {!can(user, 'cartera') ? <p role="alert">No tenés permiso para exportar cobranzas.</p> : <form className="rep-form" onSubmit={descargar}>
      <div className="field"><label htmlFor="rep-tipo">Tipo de reporte</label><select id="rep-tipo" className="select" value={tipo} onChange={(e) => cambiarTipo(e.target.value)}>{Object.entries(TIPOS_REPORTE).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}</select></div>
      <div className="rep-fechas">
        <div className="field"><label htmlFor="rep-desde">Fecha desde</label><input id="rep-desde" className="input" type="date" required={tipo === 'proximos_vencimientos'} value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
        <div className="field"><label htmlFor="rep-hasta">Fecha hasta</label><input id="rep-hasta" className="input" type="date" required={tipo === 'proximos_vencimientos'} value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
      </div>
      <p className="fine">{tipo === 'pagos_registrados' ? 'El período se aplica a la fecha del pago.' : tipo === 'creditos_activos' ? 'El período se aplica al próximo vencimiento del crédito. Sin fechas se incluyen todos los activos.' : tipo === 'proximos_vencimientos' ? 'El período se aplica al vencimiento; se excluyen las fechas anteriores a hoy y las cuotas pagadas.' : 'El período se aplica a la fecha de vencimiento de la cuota.'}</p>
      <div className="field"><label htmlFor="rep-cliente">Cliente / crédito</label><select id="rep-cliente" className="select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}><option value="">Todos los clientes</option>{clientes.map((a) => <option key={a.id} value={a.id}>{a.cliente} · {a.numero || `#${a.id}`}</option>)}</select></div>
      <div className="field"><label htmlFor="rep-estado">Estado de pago{tipo === 'pagos_registrados' ? ' (no aplica a operaciones)' : ''}</label><select id="rep-estado" className="select" disabled={tipo === 'pagos_registrados'} value={estado} onChange={(e) => setEstado(e.target.value)}><option value="todos">Todos</option><option value="al_dia">Al día / pendiente sin atraso</option><option value="atrasado">Atrasado</option><option value="parcial">Pago parcial</option></select></div>
      <div className="field"><label htmlFor="rep-alcance">Alcance de la exportación</label><select id="rep-alcance" className="select" value={alcance} onChange={(e) => setAlcance(e.target.value)}><option value="todos">Todos los registros (sin filtros de cartera)</option><option value="filtrados">Solo resultados filtrados en cartera</option></select><small className="fine">Filtros de cartera: {descripcionFiltros}. Se combinan con los filtros elegidos aquí.</small></div>
      {tipo === 'proximos_vencimientos' && <label className="rep-check"><input type="checkbox" checked={incluirEstimaciones} onChange={(e) => setIncluirEstimaciones(e.target.checked)} /> Incluir importes estimados y vencimientos proyectados</label>}
      {tipo === 'cuotas_atrasadas' && <p className="demo-note-box">Solo cuotas vencidas con importe verificable. Se excluyen proyecciones y cuotas antiguas cuyo importe es estimado: saldo de capital y una fecha pasada no bastan para certificar el importe de una cuota impaga.</p>}
      {tipo === 'proximos_vencimientos' && <p className="fine">Sin estimaciones, se conservan las fechas registradas pero se dejan vacíos los importes no verificables. El CSV distingue el origen de la fecha y del importe.</p>}
      {error && <p className="err" role="alert">{error}</p>}
      {reporte && <section className="rep-resumen" aria-label="Resumen antes de descargar" aria-live="polite"><h4>Resumen antes de descargar</h4><dl><dt>Reporte</dt><dd>{reporte.nombre}</dd><dt>Período</dt><dd>{periodo}</dd><dt>Alcance</dt><dd>{alcance === 'todos' ? 'Todos los registros, aplicando los filtros de este formulario' : 'Solo créditos filtrados en cartera, más los filtros de este formulario'}</dd><dt>Registros</dt><dd>{reporte.cantidad}</dd><dt>{reporte.etiquetaTotal}</dt><dd>{reporte.total == null ? 'No calculable: hay importes sin información suficiente' : importePago(reporte.total)}</dd></dl>{!reporte.cantidad && <p role="status">No hay registros con estos filtros. No se generará un archivo vacío.</p>}</section>}
      <p className="fine">CSV UTF-8 para Excel: separador punto y coma, decimales con coma y fechas DD/MM/AAAA. Los campos sin información quedan vacíos. Los totales incluyen los saldos e importes estimados que estén identificados como tales en el reporte. No se modifica ningún dato al exportar.</p>
      {errorDescarga && <p className="err" role="alert">{errorDescarga}</p>}
      <div className="rep-botones"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={!!error || !reporte?.cantidad}><Download size={16} /> Confirmar exportación</Button></div>
    </form>}
  </Modal>;
}

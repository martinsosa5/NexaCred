import { useState } from 'react';
import { History } from 'lucide-react';
import { useStore } from '../../lib/store';
import { TNA } from '../../lib/finanzas';
import { cuotaActual, fechaPagoValida, importePago, pesos } from '../../lib/pagos';
import { filtrarHistorial, historialCredito } from '../../lib/historialPagos';
import { fechaCorta } from '../../lib/format';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import '../../styles/historial-pagos.css';

const FILTROS = [['todas', 'Todas'], ['pagada', 'Pagadas'], ['pendiente', 'Pendientes'], ['atrasado', 'Atrasadas'], ['parciales', 'Pagos parciales']];
const importe = (n) => Number.isFinite(n) ? importePago(n) : 'No registrado';
const fecha = (valor) => fechaPagoValida(valor) ? fechaCorta(valor) : 'No registrado';

function EstadoCuota({ cuota }) {
  const clase = cuota.parcial ? 'pill-warn' : ({ pagada: 'pill-ok', pendiente: 'pill-info', atrasado: 'pill-bad' })[cuota.estado] || '';
  return <><span className={`pill ${clase}`}>{cuota.texto}</span>{cuota.dias > 0 && <small className="hist-nota">{cuota.dias} días de atraso</small>}</>;
}

function Operacion({ pago, credito }) {
  return <li className="hist-operacion">
    <h4>{fecha(pago.fecha)} · {importe(pago.importe)}</h4>
    <dl className="hist-datos">
      <dt>Identificador del pago</dt><dd>{pago.id}</dd>
      <dt>Cliente</dt><dd>{credito.cliente}</dd>
      <dt>Crédito</dt><dd>{credito.numero || `#${credito.id}`}</dd>
      <dt>Cuota</dt><dd>{pago.numeroCuota ?? 'No registrado'}</dd>
      <dt>Método</dt><dd>{({ efectivo: 'Efectivo', transferencia: 'Transferencia', otro: 'Otro' })[pago.metodo] || 'No registrado'}</dd>
      <dt>Capital aplicado</dt><dd>{importe(pago.capitalAplicado)}</dd>
      <dt>Intereses</dt><dd>{importe(pago.intereses)}</dd>
      <dt>Otros conceptos (seguro)</dt><dd>{importe(pago.otrosConceptos)}</dd>
      <dt>Responsable</dt><dd>{pago.empleado || 'No registrado'}{pago.empleadoId != null ? ` (#${pago.empleadoId})` : ''}</dd>
      <dt>Registro de la operación</dt><dd>{pago.registradoEn && !Number.isNaN(Date.parse(pago.registradoEn)) ? new Date(pago.registradoEn).toLocaleString('es-AR') : 'No registrado'}</dd>
      <dt>Observaciones</dt><dd>{pago.observaciones || 'Sin observaciones'}</dd>
    </dl>
    {pago.estimado && <p className="hist-nota">Imputación financiera estimada al registrar el pago.</p>}
  </li>;
}

export default function HistorialPagos({ creditoId, onClose }) {
  const { solicitudes, pagos = [] } = useStore();
  const [filtro, setFiltro] = useState('todas');
  const [detalleId, setDetalleId] = useState(null);
  const credito = solicitudes.find((a) => a.id === creditoId && a.estado === 'desembolsado');
  if (!credito) return <Modal title="Historial de pagos" onClose={onClose}><p>El crédito no está disponible.</p><Button onClick={onClose}>Volver a Cartera y cobranzas</Button></Modal>;
  const historial = historialCredito(credito, pagos);
  const filas = filtrarHistorial(historial.cuotas, filtro);
  const detalle = filas.find((c) => c.id === detalleId);
  const actual = cuotaActual(credito);
  const estado = credito.saldo === 0 ? 'Cancelado' : historial.atrasadas > 0 ? 'Con cuotas atrasadas' : actual ? 'Activo' : 'Información incompleta';
  return <Modal title="Historial de pagos" wide onClose={onClose} footer={<Button variant="ghost" onClick={onClose}>Volver a Cartera y cobranzas</Button>}>
    <div className="hist-ficha">
      <header className="hist-cliente"><History size={26} /><div><h2>{credito.cliente}</h2><p>{credito.numero || `Crédito #${credito.id}`} · {estado}</p></div></header>
      <dl className="hist-datos">
        <dt>Fecha de desembolso</dt><dd>{fecha(credito.fechaDesembolso)}</dd>
        <dt>Monto original</dt><dd>{importe(credito.monto)}</dd>
        <dt>Plazo original</dt><dd>{Number.isInteger(credito.plazo) ? `${credito.plazo} cuotas` : 'No registrado'}</dd>
        <dt>TNA según reglas de la demo</dt><dd>{Number.isFinite(TNA[credito.plazo]) ? `${(TNA[credito.plazo] * 100).toLocaleString('es-AR')} %` : 'No registrado'}</dd>
        <dt>Cuota actual</dt><dd>{actual ? `${importe(pesos(actual.total))}${actual.estimada ? ' (estimada)' : ''}` : 'No disponible: crédito cancelado o información insuficiente'}</dd>
        <dt>Estado del préstamo</dt><dd>{estado}</dd>
      </dl>
      <div className="hist-resumen" aria-label="Resumen del historial">
        <div><span>Total registrado como pagado</span><strong>{importe(pesos(historial.totalRegistrado))}</strong></div>
        <div><span>Capital pendiente{credito.saldoEstimado ? ' (estimado)' : ''}</span><strong>{importe(credito.saldo)}</strong></div>
        <div><span>Cuotas pagadas verificadas</span><strong>{historial.pagadas}</strong></div>
        <div><span>Cuotas pendientes</span><strong>{historial.pendientes}</strong></div>
        <div><span>Cuotas atrasadas</span><strong>{historial.atrasadas}</strong></div>
      </div>
      <p className="demo-note-box">{historial.incompleto ? 'Historial anterior incompleto: solo se muestran cuotas con datos disponibles. Los importes estimados se identifican. No se conocen todas las cuotas restantes ni se infieren pagos anteriores. ' : 'Las filas “Proyección” muestran cuotas calculadas, no pagos registrados. ' }Los contadores incluyen las cuotas disponibles antes de filtrar. El total recibido incluye capital, intereses y seguro; no equivale a capital amortizado.</p>
      <section aria-label="Historial de cuotas">
        <h3>Historial de cuotas</h3>
        <div className="filters hist-filtros" role="group" aria-label="Filtrar historial de cuotas">
          {FILTROS.map(([k, etiqueta]) => <button key={k} className={`filter ${filtro === k ? 'on' : ''}`} aria-pressed={filtro === k} onClick={() => { setFiltro(k); setDetalleId(null); }}>{etiqueta}</button>)}
        </div>
        <div className="table-scroll hist-tabla" tabIndex={0} aria-label="Cuotas del crédito, tabla desplazable">
          <table className="table-admin num">
            <thead><tr><th>Cuota</th><th>Vencimiento</th><th>Importe</th><th>Pagado</th><th>Pendiente</th><th>Estado</th><th>Último pago</th><th>Detalle</th></tr></thead>
            <tbody>
              {filas.length === 0 && <tr><td colSpan={8}>No hay cuotas para este filtro.</td></tr>}
              {filas.map((c) => <tr key={c.id}>
                <td>{c.numero ?? 'No registrado'}{(c.estimada || c.proyeccion) && <small className="hist-nota">{c.proyeccion ? 'Proyección' : 'Importe estimado'}</small>}</td>
                <td>{fecha(c.vencimiento)}</td><td>{c.total == null ? 'No registrado' : importe(pesos(c.total))}</td><td>{importe(pesos(c.recibido))}</td><td>{c.pendiente == null ? 'No registrado' : importe(pesos(c.pendiente))}</td><td><EstadoCuota cuota={c} /></td><td>{c.ultimoPago ? fecha(c.ultimoPago) : 'Sin pagos registrados'}</td>
                <td><Button size="sm" variant="ghost" aria-expanded={detalleId === c.id} onClick={() => setDetalleId(detalleId === c.id ? null : c.id)}>Ver detalles</Button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
      {detalle && <section className="hist-detalle" aria-label="Detalle de la cuota" aria-live="polite">
        <h3>Detalle de cuota {detalle.numero ?? 'sin número registrado'} · {fecha(detalle.vencimiento)}</h3>
        <p><EstadoCuota cuota={detalle} /></p>
        {detalle.movimientos.length === 0 ? <p>No hay pagos registrados para esta cuota.{detalle.proyeccion ? ' Es una proyección financiera.' : ''}</p> : <ul>{detalle.movimientos.map((p) => <Operacion key={p.id} pago={p} credito={credito} />)}</ul>}
      </section>}
      <section aria-label="Operaciones del crédito">
        <h3>Operaciones registradas ({historial.operaciones.length})</h3>
        {!historial.operaciones.length && <p className="hist-nota">No hay pagos registrados. Esto no significa que todas las cuotas anteriores estén pagadas o impagas: no se dispone de ese historial.</p>}
        {historial.operacionesSinCuota.length > 0 && <p className="demo-note-box">Hay operaciones sin una cuota disponible para relacionar. Se conservan aquí y en el total registrado, sin reconstruir cuotas faltantes.</p>}
        {historial.operaciones.map((p) => <details key={p.id} className="hist-movimiento"><summary>{fecha(p.fecha)} · {importe(p.importe)} · {p.metodo} · Cuota {p.numeroCuota ?? 'no registrada'}</summary><ul><Operacion pago={p} credito={credito} /></ul></details>)}
      </section>
    </div>
  </Modal>;
}

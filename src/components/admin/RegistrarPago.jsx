import { useRef, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { actions } from '../../lib/store';
import { centavos, cuotaActual, importePago as importeTexto, pesos } from '../../lib/pagos';
import { fechaCorta } from '../../lib/format';
import '../../styles/registro-pagos.css';

export default function RegistrarPago({ credito, onClose }) {
  // El formulario conserva su foto inicial: una actualización concurrente exige revisarla antes de guardar.
  const [cuota] = useState(() => cuotaActual(credito));
  const [saldoInicial] = useState(credito.saldo);
  const [id] = useState(() => crypto.randomUUID());
  const hoy = format(new Date(), 'yyyy-MM-dd');
  const [fecha, setFecha] = useState(hoy);
  const [importe, setImporte] = useState(cuota ? (pesos(cuota.total - cuota.recibido)).toFixed(2) : '');
  const [metodo, setMetodo] = useState('efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [acepta, setAcepta] = useState(false);
  const [revision, setRevision] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const ocupado = useRef(false);
  const pendiente = cuota ? pesos(cuota.total - cuota.recibido) : 0;
  const recibido = Number(importe);
  const hasta = cuota ? cuota.recibido + centavos(recibido) : 0;
  const capital = cuota ? centavos(recibido) - (Math.min(hasta, cuota.interes) - Math.min(cuota.recibido, cuota.interes)) - (Math.min(Math.max(0, hasta - cuota.interes), cuota.seguro) - Math.min(Math.max(0, cuota.recibido - cuota.interes), cuota.seguro)) : 0;
  const cerrar = () => { if (!ocupado.current) onClose(); };
  const confirmar = async (e) => {
    e.preventDefault();
    if (ocupado.current) return;
    setError('');
    if (!Number.isFinite(recibido) || recibido <= 0 || recibido > pendiente || Math.abs(recibido * 100 - centavos(recibido)) > 0.000001) { setError('Ingresá un importe mayor que cero, con hasta dos decimales y sin superar el pendiente de la cuota.'); return; }
    if (!revision) { setRevision(true); return; }
    ocupado.current = true;
    setGuardando(true);
    try {
      await actions.registrarPago({ id, creditoId: credito.id, cuotaId: cuota.id, restanteEsperado: cuota.total - cuota.recibido, saldoEsperado: centavos(saldoInicial), fecha, importe: recibido, metodo, observaciones, aceptaEstimacion: acepta });
      toast.success('Pago registrado y guardado correctamente.');
      onClose();
    } catch (err) { setError(err.message); setRevision(false); }
    finally { ocupado.current = false; setGuardando(false); }
  };
  return <Modal title="Registrar pago" onClose={cerrar}>
    {!cuota ? <><p>No hay información suficiente para calcular esta cuota. No se puede registrar el pago sin revisar monto, plazo, saldo y vencimiento.</p><Button onClick={onClose}>Cerrar</Button></> :
      <form className="pago-form" onSubmit={confirmar}>
        <dl className="cob-detalle">
          <dt>Cliente</dt><dd>{credito.cliente}</dd>
          <dt>Préstamo / solicitud</dt><dd>{credito.numero || `#${credito.id}`}</dd>
          <dt>Número de cuota</dt><dd>{cuota.numero ?? 'No conocido (sin historial anterior)'}</dd>
          <dt>Cuota {cuota.estimada ? 'estimada' : ''}</dt><dd>{importeTexto(pesos(cuota.total))}</dd>
          <dt>Saldo de capital {cuota.estimada ? '(estimado)' : ''}</dt><dd>{importeTexto(saldoInicial)}</dd>
          <dt>Vencimiento</dt><dd>{fechaCorta(cuota.vencimiento)}</dd>
          <dt>Ya recibido / falta</dt><dd>{importeTexto(pesos(cuota.recibido))} / {importeTexto(pendiente)}</dd>
        </dl>
        {cuota.estimada && <div className="demo-note-box">Este crédito no tiene historial completo ni número de cuota confirmado. La cuota y el saldo resultante son estimados con la tasa del plazo original, interés mensual sobre el saldo actual y seguro original. No se calculan punitorios ni pagos anteriores. El siguiente vencimiento será mensual estimado; no se conoce la fecha contractual de finalización.</div>}
        <p className="fine">Imputación: primero intereses ({importeTexto(pesos(cuota.interes))}), luego seguro ({importeTexto(pesos(cuota.seguro))}) y finalmente capital ({importeTexto(pesos(cuota.capital))}). No se permite pagar más que el pendiente de esta cuota.</p>
        <fieldset disabled={revision || guardando} className="pago-campos">
          <label className="field">Fecha del pago<input className="input" type="date" required max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} /></label>
          <label className="field">Importe recibido<input className="input" type="number" min="0.01" max={pendiente} step="0.01" required value={importe} onChange={(e) => setImporte(e.target.value)} /></label>
          <label className="field">Método de pago<select className="input" value={metodo} onChange={(e) => setMetodo(e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="otro">Otro</option></select></label>
          <label className="field">Observaciones (opcional)<textarea className="input" maxLength={500} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></label>
          {cuota.estimada && <label className="pago-acepta"><input type="checkbox" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)} /> Entiendo y acepto registrar esta imputación estimada.</label>}
        </fieldset>
        {revision && <div className="demo-note-box" role="status"><strong>Revisá antes de confirmar</strong><p>{credito.cliente} · {fechaCorta(fecha)} · {metodo}</p><p>Recibido: {importeTexto(recibido)}. Capital aplicado: {importeTexto(pesos(capital))}. Saldo resultante {cuota.estimada ? 'estimado' : ''}: {importeTexto(saldoInicial - pesos(capital))}.</p><p>{centavos(recibido) === cuota.total - cuota.recibido ? 'La cuota quedará pagada.' : `Pago parcial. Faltará ${importeTexto(pendiente - recibido)} para cubrir la cuota.`}</p>{observaciones && <p>{observaciones}</p>}</div>}
        {error && <p className="err" role="alert">{error}</p>}
        <div className="pago-botones">
          <Button type="button" variant="ghost" disabled={guardando} onClick={cerrar}>Cancelar</Button>
          {revision && <Button type="button" variant="ghost" disabled={guardando} onClick={() => setRevision(false)}>Editar</Button>}
          <Button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : revision ? 'Confirmar pago' : 'Revisar pago'}</Button>
        </div>
      </form>}
  </Modal>;
}

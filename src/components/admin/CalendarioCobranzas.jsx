import { useState } from 'react';
import { addMonths, differenceInCalendarDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { fechaCorta } from '../../lib/format';
import '../../styles/calendario-cobranzas.css';
import { cuotasCredito, fechaPagoValida, importePago as money, pesos, situacionCuota } from '../../lib/pagos';
import { useStore } from '../../lib/store';

export default function CalendarioCobranzas({ creditos, onRecordatorio, onRegistrarPago, onVerHistorial }) {
  const { pagos = [] } = useStore();
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [seleccionado, setSeleccionado] = useState(null);
  const hoy = startOfDay(new Date());
  const eventos = creditos.flatMap((credito) => {
    const cuotas = cuotasCredito(credito);
    if (!cuotas.length && credito.saldo > 0) return [{ id: `${credito.id}:sin-datos`, credito, fecha: fechaPagoValida(credito.proximoVencimiento) ? parseISO(credito.proximoVencimiento) : null, clase: 'sin-datos', texto: 'Información insuficiente', dias: 0 }];
    return cuotas.map((cuota) => {
      const situacion = situacionCuota(cuota);
      return { id: cuota.id, credito, cuota, fecha: parseISO(cuota.vencimiento), clase: situacion.estado, ...situacion };
    });
  });
  const delMes = eventos.filter((e) => e.fecha && isSameMonth(e.fecha, mes));
  const sinFecha = eventos.filter((e) => !e.fecha);
  const dias = eachDayOfInterval({
    start: startOfWeek(mes, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }),
  });
  const detalle = eventos.find((e) => e.id === seleccionado);
  const cerrar = () => setSeleccionado(null);
  const eventoBoton = (e) => (
    <button key={e.id} className={`cob-evento ${e.clase}`} onClick={() => setSeleccionado(e.id)}>
      <strong>{e.credito.cliente}</strong><small>{e.texto}</small>{e.cuota?.estimada && <small>Importes estimados</small>}
    </button>
  );
  return (
    <section className="card cob-calendario" aria-label="Calendario de vencimientos">
      <div className="cob-resumen" aria-label="Resumen de créditos filtrados">
        <div><strong>{creditos.filter((c) => c.saldo > 0).length}</strong><span>Créditos activos</span></div>
        <div><strong>{new Set(eventos.filter((e) => e.clase === 'atrasado').map((e) => e.credito.id)).size}</strong><span>Créditos atrasados</span></div>
        <div><strong>{delMes.filter((e) => e.clase !== 'pagada' && differenceInCalendarDays(e.fecha, hoy) >= 0).length}</strong><span>Próximos vencimientos del mes</span></div>
      </div>
      <p className="cob-nota">Resumen según la búsqueda y los filtros del crédito actual. Se conservan las cuotas con pagos registrados y el próximo vencimiento. No se infieren pagos anteriores. En créditos sin historial, importes y siguientes fechas son estimados.</p>
      <div className="cob-navegacion">
        <h2 aria-live="polite">{format(mes, 'MMMM yyyy', { locale: es })}</h2>
        <div>
          <button className="icon-btn" aria-label="Mes anterior" onClick={() => setMes(addMonths(mes, -1))}><ChevronLeft size={18} /></button>
          <Button size="sm" variant="ghost" onClick={() => setMes(startOfMonth(new Date()))}>Hoy</Button>
          <button className="icon-btn" aria-label="Mes siguiente" onClick={() => setMes(addMonths(mes, 1))}><ChevronRight size={18} /></button>
        </div>
      </div>
      <ul className="cob-leyenda" aria-label="Leyenda de estados">
        <li className="pagada">Pagada</li><li className="pendiente">Pendiente</li><li className="atrasado">Atrasada</li><li className="sin-datos">Sin información suficiente</li>
      </ul>
      <div className="cob-scroll" tabIndex={0} aria-label="Calendario mensual, desplazable en celulares">
        <div className="cob-grilla">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => <div className="cob-semana" key={d}>{d}</div>)}
          {dias.map((dia) => {
            const clave = format(dia, 'yyyy-MM-dd');
            return (
              <div key={clave} className={`cob-dia ${isSameMonth(dia, mes) ? '' : 'cob-fuera'}`}>
                <time dateTime={clave} aria-current={isToday(dia) ? 'date' : undefined} aria-label={format(dia, 'EEEE d MMMM yyyy', { locale: es })}>{format(dia, 'd')}</time>
                {eventos.filter((e) => e.fecha && format(e.fecha, 'yyyy-MM-dd') === clave).map(eventoBoton)}
              </div>
            );
          })}
        </div>
      </div>
      {delMes.length === 0 && <p className="cob-nota" role="status">No hay vencimientos registrados en este mes para los filtros seleccionados.</p>}
      {sinFecha.length > 0 && <div className="cob-sin-fecha"><h3>Créditos sin fecha válida</h3>{sinFecha.map(eventoBoton)}</div>}
      {detalle && <Modal title="Detalle del vencimiento" onClose={cerrar} footer={<div className="pago-botones">{detalle.clase === 'atrasado' && <Button size="sm" variant="ghost" onClick={() => onRecordatorio(detalle.credito)}><Bell size={14} /> Enviar recordatorio</Button>}{detalle.cuota && detalle.clase !== 'pagada' && detalle.credito.saldo > 0 && <Button size="sm" onClick={() => { const credito = detalle.credito; cerrar(); onRegistrarPago(credito); }}>Registrar pago</Button>}</div>}>
        <dl className="cob-detalle">
          <dt>Cliente</dt><dd>{detalle.credito.cliente}</dd>
          <dt>Vencimiento</dt><dd>{detalle.fecha ? fechaCorta(detalle.cuota?.vencimiento || detalle.credito.proximoVencimiento) : 'Sin fecha válida'}</dd>
          <dt>Saldo pendiente actual</dt><dd>{Number.isFinite(detalle.credito.saldo) ? money(detalle.credito.saldo) : 'No disponible'}{detalle.credito.saldoEstimado ? ' (estimado)' : ''}</dd>
          <dt>Monto de la cuota</dt><dd>{detalle.cuota ? money(pesos(detalle.cuota.total)) : 'No disponible'}{detalle.cuota?.estimada ? ' (estimado)' : ''}</dd>
          {detalle.cuota && <><dt>Pagado / falta</dt><dd>{money(pesos(detalle.cuota.recibido))} / {money(pesos(detalle.cuota.total - detalle.cuota.recibido))}</dd></>}
          <dt>Estado del crédito</dt><dd>Desembolsado</dd>
          <dt>Estado de pago registrado</dt><dd>{({ al_dia: 'Al día', atrasado: 'Atrasado' })[detalle.credito.estadoPago] || 'Sin información'}</dd>
          <dt>Situación del vencimiento</dt><dd>{detalle.texto}</dd>
          {detalle.clase === 'atrasado' && <><dt>Días de atraso</dt><dd>{detalle.dias > 0 ? detalle.dias : 'Fecha y estado requieren revisión'}</dd></>}
        </dl>
        <ul className="pago-operaciones" aria-label="Pagos de esta cuota">{pagos.filter((p) => p.cuotaId === detalle.id).map((p) => <li key={p.id}>{fechaCorta(p.fecha)} · {money(p.importe)} · {p.metodo}<small>{p.empleado} · Capital: {money(p.capitalAplicado)} · Interés: {money(p.intereses)} · Seguro: {money(p.otrosConceptos)}{p.estimado ? ' · Estimado' : ''}</small>{p.observaciones && <small>{p.observaciones}</small>}<small>Operación {p.id}</small></li>)}</ul>
        <p className="cob-nota">Solo una cuota completamente cubierta se marca como pagada. No se asumen pagos anteriores ni se agregan punitorios. Los recordatorios usan la simulación existente.</p>
        <Button size="sm" variant="ghost" onClick={() => { const credito = detalle.credito; cerrar(); onVerHistorial(credito); }}>Ver historial</Button>
      </Modal>}
    </section>
  );
}

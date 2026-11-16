import toast from 'react-hot-toast';
import { Bell, Wallet } from 'lucide-react';
import { useStore, actions } from '../../lib/store';
import { money, fechaCorta } from '../../lib/format';
import { PagoPill, ActIcon, Empty } from '../../components/admin/ui';
import Button from '../../components/ui/Button';

export default function Cartera() {
  const { solicitudes, actividad } = useStore();
  const activos = solicitudes.filter((a) => a.estado === 'desembolsado');
  const enviar = (a) => { actions.recordatorio(a.id); toast(`Recordatorio enviado a ${a.cliente}.`, { icon: '🔔' }); };
  return (
    <div className="grid-2 wide-left">
      <div className="card table-card">
        <div className="card-head pad"><h2>Créditos activos</h2></div>
        <div className="table-scroll">
          <table className="table-admin num">
            <thead><tr><th>Cliente</th><th>Saldo</th><th>Próx. vencimiento</th><th>Estado</th><th className="r">Acción</th></tr></thead>
            <tbody>
              {activos.length === 0 && <tr><td colSpan={5}><Empty icon={Wallet}>Todavía no hay créditos desembolsados.</Empty></td></tr>}
              {activos.map((a) => (
                <tr key={a.id}>
                  <td className="strong">{a.cliente}</td><td>{money(a.saldo)}</td><td>{fechaCorta(a.proximoVencimiento)}</td><td><PagoPill estado={a.estadoPago} /></td>
                  <td className="r">{a.estadoPago === 'atrasado' ? <Button size="sm" variant="ghost" onClick={() => enviar(a)}><Bell size={14} /> Enviar recordatorio</Button> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h2>Acciones automáticas</h2></div>
        <ul className="feed">
          {actividad.map((e, i) => <li key={i}><span className="feed-ico"><ActIcon name={e.icon} /></span><span>{e.text}<small>{e.t}</small></span></li>)}
        </ul>
      </div>
    </div>
  );
}

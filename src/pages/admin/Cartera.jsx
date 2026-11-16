import { useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, Wallet, Search } from 'lucide-react';
import { useStore, actions } from '../../lib/store';
import { money, fechaCorta, tiempo } from '../../lib/format';
import { diasAtraso } from '../../lib/cartera';
import { PagoPill, ActIcon, Empty } from '../../components/admin/ui';
import Button from '../../components/ui/Button';

const FILTROS = [['todos', 'Todos'], ['atrasados', 'Atrasados'], ['al_dia', 'Al día']];

export default function Cartera() {
  const { solicitudes, actividad } = useStore();
  const [q, setQ] = useState('');
  const [f, setF] = useState('todos');
  const todos = solicitudes.filter((a) => a.estado === 'desembolsado');
  const nAtr = todos.filter((a) => a.estadoPago === 'atrasado').length;
  // Los atrasados van primero, de mayor a menor atraso; después, por próximo vencimiento.
  const activos = todos
    .filter((a) => a.cliente.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((a) => f === 'todos' || (f === 'atrasados') === (a.estadoPago === 'atrasado'))
    .sort((a, b) => diasAtraso(b) - diasAtraso(a) || a.proximoVencimiento.localeCompare(b.proximoVencimiento));
  const enviar = (a) => { actions.recordatorio(a.id); toast(`Recordatorio enviado a ${a.cliente}.`, { icon: '🔔' }); };
  return (
    <>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar por cliente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar por cliente" /></div>
        <div className="filters" role="group" aria-label="Filtrar por estado de pago">
          {FILTROS.map(([k, l]) => <button key={k} className={`filter ${f === k ? 'on' : ''}`} aria-pressed={f === k} onClick={() => setF(k)}>{l}{k === 'atrasados' && nAtr > 0 ? ` (${nAtr})` : ''}</button>)}
        </div>
      </div>
      <div className="grid-2 wide-left">
        <div className="card table-card">
          <div className="card-head pad"><h2>Créditos activos</h2></div>
          <div className="table-scroll">
            <table className="table-admin num">
              <thead><tr><th>Cliente</th><th>Saldo</th><th>Próx. vencimiento</th><th>Estado</th><th className="r">Acción</th></tr></thead>
              <tbody>
                {activos.length === 0 && <tr><td colSpan={5}><Empty icon={Wallet}>{todos.length ? 'No hay créditos que coincidan con la búsqueda.' : 'Todavía no hay créditos desembolsados.'}</Empty></td></tr>}
                {activos.map((a) => (
                  <tr key={a.id} className={a.estadoPago === 'atrasado' ? 'row-late' : ''}>
                    <td className="strong">{a.cliente}</td><td>{money(a.saldo)}</td><td>{fechaCorta(a.proximoVencimiento)}</td><td><PagoPill estado={a.estadoPago} dias={diasAtraso(a)} /></td>
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
            {actividad.slice(0, 8).map((e, i) => <li key={i}><span className="feed-ico"><ActIcon name={e.icon} /></span><span>{e.text}<small>{e.by ? `${e.by} · ` : ''}{tiempo(e.at)}</small></span></li>)}
          </ul>
        </div>
      </div>
    </>
  );
}

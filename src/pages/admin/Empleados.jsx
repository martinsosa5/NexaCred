import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Search, Plus, Pencil, UserX, UserCheck, Inbox, ShieldCheck } from 'lucide-react';
import { useStore, actions } from '../../lib/store';
import { iniciales, tiempo } from '../../lib/format';
import { PERMISOS, ROLES } from '../../lib/permisos';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { ActIcon, Empty } from '../../components/admin/ui';

const base = {
  nombre: z.string().trim().min(5, 'Ingresá nombre y apellido.').refine((v) => v.includes(' '), 'Ingresá nombre y apellido.'),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Ingresá un correo válido.'),
  rol: z.string(),
};
const crearSchema = z.object({ ...base, password: z.string().min(8, 'Mínimo 8 caracteres.') });
const editarSchema = z.object({ ...base, password: z.string().refine((v) => v === '' || v.length >= 8, 'Mínimo 8 caracteres, o dejalo vacío para no cambiarla.') });

function Form({ emp, existentes, onClose }) {
  const editando = !!emp;
  const [permisos, setPermisos] = useState(emp?.permisos ?? ROLES[0].permisos);
  const [errP, setErrP] = useState('');
  const { register, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm({
    resolver: zodResolver(editando ? editarSchema : crearSchema),
    defaultValues: { nombre: emp?.nombre ?? '', email: emp?.email ?? '', password: '', rol: emp ? (ROLES.find((r) => r.label === emp.rol)?.id ?? 'custom') : 'credito' },
  });
  const cambiarRol = (id) => {
    setValue('rol', id);
    const r = ROLES.find((x) => x.id === id);
    if (id !== 'custom') setPermisos(r.permisos);
    setErrP('');
  };
  const toggle = (id) => {
    setErrP('');
    setPermisos((p) => {
      let n = p.includes(id) ? p.filter((x) => x !== id) : [...p, id];
      if (id === 'decidir' && n.includes('decidir') && !n.includes('solicitudes')) n = [...n, 'solicitudes'];
      if (id === 'solicitudes' && !n.includes('solicitudes')) n = n.filter((x) => x !== 'decidir');
      return n;
    });
    setValue('rol', 'custom');
  };
  const guardar = (d) => {
    const mail = d.email.trim().toLowerCase();
    if (existentes.some((e) => e.email === mail && e.id !== emp?.id)) return setError('email', { message: 'Ya existe un empleado con ese correo.' });
    if (!permisos.length) return setErrP('Elegí al menos un área a la que pueda entrar.');
    const rolLabel = ROLES.find((r) => r.id === d.rol)?.label ?? 'Personalizado';
    if (editando) {
      actions.actualizarEmpleado(emp.id, { nombre: d.nombre.trim(), email: mail, password: d.password, rol: emp.admin ? emp.rol : rolLabel, permisos: emp.admin ? emp.permisos : permisos });
      toast.success('Empleado actualizado.');
    } else {
      actions.crearEmpleado({ nombre: d.nombre, email: mail, password: d.password, rol: rolLabel, permisos });
      toast.success(`${d.nombre.trim()} ya puede ingresar con su correo y contraseña.`);
    }
    onClose();
  };
  return (
    <Modal title={editando ? 'Editar empleado' : 'Nuevo empleado'} onClose={onClose} wide
      footer={<><Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button><Button type="submit" form="emp">{editando ? 'Guardar cambios' : 'Crear empleado'}</Button></>}>
      <form id="emp" onSubmit={handleSubmit(guardar)} noValidate className="stack">
        <div className="row g-3">
          <div className="col-md-6 field"><label htmlFor="en">Nombre y apellido</label><input id="en" className={`input ${errors.nombre ? 'invalid' : ''}`} {...register('nombre')} /><span className="err">{errors.nombre?.message}</span></div>
          <div className="col-md-6 field"><label htmlFor="ee">Correo (será su usuario)</label><input id="ee" type="email" className={`input ${errors.email ? 'invalid' : ''}`} {...register('email')} /><span className="err">{errors.email?.message}</span></div>
          <div className="col-md-6 field"><label htmlFor="ep">{editando ? 'Contraseña nueva (opcional)' : 'Contraseña inicial'}</label><input id="ep" type="password" autoComplete="new-password" className={`input ${errors.password ? 'invalid' : ''}`} {...register('password')} /><span className="err">{errors.password?.message}</span></div>
          {!emp?.admin && (
            <div className="col-md-6 field"><label htmlFor="er">Puesto</label>
              <select id="er" className="select" {...register('rol', { onChange: (e) => cambiarRol(e.target.value) })}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
            </div>
          )}
        </div>
        {emp?.admin ? (
          <div className="demo-note-box"><ShieldCheck size={16} style={{ verticalAlign: '-3px' }} /> El administrador general tiene acceso a todas las áreas y es el único que gestiona empleados. Sus accesos no se pueden cambiar.</div>
        ) : (
          <fieldset className="perms">
            <legend>¿A qué áreas puede entrar?</legend>
            <p className="fine" style={{ marginBottom: 12 }}>{ROLES.find((r) => r.id === watch('rol'))?.desc}</p>
            {PERMISOS.map((p) => (
              <label className="perm" key={p.id}>
                <input type="checkbox" checked={permisos.includes(p.id)} onChange={() => toggle(p.id)} />
                <span><strong>{p.label}</strong><small>{p.desc}</small></span>
              </label>
            ))}
            <span className="err" role="alert">{errP}</span>
          </fieldset>
        )}
      </form>
    </Modal>
  );
}

export default function Empleados() {
  const { empleados, actividad } = useStore();
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | 'nuevo' | empleado
  const [quien, setQuien] = useState('todos');
  const lista = empleados.filter((e) => (e.nombre + e.email + e.rol).toLowerCase().includes(q.trim().toLowerCase()));
  const act = actividad.filter((e) => quien === 'todos' || e.by === quien);
  const label = (id) => PERMISOS.find((p) => p.id === id)?.label;
  const baja = (e) => { actions.estadoEmpleado(e.id, !e.activo); toast(e.activo ? `${e.nombre} fue dado de baja.` : `${e.nombre} fue reactivado.`); };
  return (
    <>
      <div className="toolbar">
        <div className="search"><Search size={16} /><input className="input" placeholder="Buscar por nombre, correo o puesto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar empleado" /></div>
        <span style={{ flex: 1 }} />
        <Button size="sm" onClick={() => setModal('nuevo')}><Plus size={16} /> Nuevo empleado</Button>
      </div>
      <div className="grid-2 wide-left">
        <div className="card table-card">
          <div className="table-scroll">
            <table className="table-admin">
              <thead><tr><th>Empleado</th><th>Puesto</th><th>Accesos</th><th>Estado</th><th className="r">Acciones</th></tr></thead>
              <tbody>
                {lista.length === 0 && <tr><td colSpan={5}><Empty icon={Inbox}>No se encontraron empleados.</Empty></td></tr>}
                {lista.map((e) => (
                  <tr key={e.id} className={e.activo ? '' : 'row-off'}>
                    <td><div className="person"><span className="avatar sm">{iniciales(e.nombre)}</span><div><strong>{e.nombre}</strong><small>{e.email}</small></div></div></td>
                    <td>{e.rol}</td>
                    <td className="chips-cell">{e.admin ? <span className="chip tiny">Todas las áreas</span> : e.permisos.map((p) => <span className="chip tiny" key={p}>{label(p)}</span>)}</td>
                    <td><span className={`pill ${e.activo ? 'pill-ok' : 'pill-bad'}`}>{e.activo ? 'Activo' : 'De baja'}</span></td>
                    <td className="r actions">
                      <Button size="sm" variant="ghost" onClick={() => setModal(e)}><Pencil size={14} /> Editar</Button>
                      {!e.admin && <Button size="sm" variant={e.activo ? 'bad' : 'light'} onClick={() => baja(e)}>{e.activo ? <><UserX size={14} /> Dar de baja</> : <><UserCheck size={14} /> Reactivar</>}</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Actividad del equipo</h2>
            <select className="select select-sm" value={quien} onChange={(e) => setQuien(e.target.value)} aria-label="Filtrar actividad por empleado">
              <option value="todos">Todos</option>
              {empleados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>
          </div>
          <ul className="feed">
            {act.length === 0 && <li><span className="muted">Sin actividad registrada.</span></li>}
            {act.slice(0, 10).map((e, i) => <li key={i}><span className="feed-ico"><ActIcon name={e.icon} /></span><span>{e.text}<small>{e.by ? `${e.by} · ` : ''}{tiempo(e.at)}</small></span></li>)}
          </ul>
        </div>
      </div>
      {modal && <Form emp={modal === 'nuevo' ? null : modal} existentes={empleados} onClose={() => setModal(null)} />}
    </>
  );
}

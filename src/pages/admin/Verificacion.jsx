import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck } from 'lucide-react';
import { useStore, actions } from '../../lib/store';
import { money } from '../../lib/format';
import FirmaPad from '../../components/admin/FirmaPad';
import Terminos from '../../components/admin/Terminos';
import Button from '../../components/ui/Button';
import { Empty } from '../../components/admin/ui';

export default function Verificacion() {
  const { solicitudes } = useStore();
  const aprobadas = solicitudes.filter((a) => a.estado === 'aprobado');
  const [sel, setSel] = useState(null);
  const a = aprobadas.find((x) => x.id === Number(sel)) || aprobadas[0];
  const [docs, setDocs] = useState(false);
  const [bio, setBio] = useState(false);
  const [terms, setTerms] = useState(false);
  const [firma, setFirma] = useState(false);
  const [modal, setModal] = useState(false);
  const pad = useRef(null);
  const onFirma = useCallback((v) => setFirma(v), []);

  const reset = () => { setDocs(false); setBio(false); setTerms(false); setFirma(false); };
  const listo = a && docs && bio && terms && firma;
  const confirmar = () => {
    actions.desembolsar(a.id, pad.current?.toDataURL());
    toast.success(`Crédito desembolsado a ${a.cliente} correctamente.`);
    reset();
    setSel(null);
  };

  if (!a) {
    return <div className="card"><Empty icon={ClipboardCheck}>No hay créditos aprobados esperando verificación en este momento.</Empty></div>;
  }
  const done = [docs, bio, terms, firma].filter(Boolean).length;
  return (
    <div className="card narrow-card" key={a.id}>
      <div className="field" style={{ marginBottom: 20 }}>
        <label htmlFor="vs">Solicitud aprobada</label>
        <select id="vs" className="select" value={a.id} onChange={(e) => { setSel(e.target.value); reset(); }}>
          {aprobadas.map((x) => <option key={x.id} value={x.id}>{x.cliente} · {money(x.monto)}</option>)}
        </select>
      </div>
      <div className="branch-head"><span><strong>Sucursal Centro</strong> · Turno 10:30 hs</span><span>Cliente: {a.cliente}</span></div>
      <div className="progress" aria-label={`${done} de 4 pasos completos`}><span style={{ width: done * 25 + '%' }} /></div>
      <ul className="checklist">
        <li><label className="check"><input type="checkbox" checked={docs} onChange={(e) => setDocs(e.target.checked)} /> Documentación respaldatoria validada (DNI, recibo de sueldo, comprobante de domicilio)</label></li>
        <li><label className="check"><input type="checkbox" checked={bio} onChange={(e) => setBio(e.target.checked)} /> Datos biométricos capturados (huella digital y foto)</label></li>
      </ul>
      <FirmaPad ref={pad} onChange={onFirma} />
      <label className="check terms-check">
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
        <span>El cliente declara haber leído y acepta los <button type="button" className="link-btn inline" onClick={() => setModal(true)}>Términos y Condiciones</button> del contrato de crédito, incluida la autorización para el tratamiento de sus datos biométricos.</span>
      </label>
      <Button className="btn-block" disabled={!listo} onClick={confirmar}>Confirmar y desembolsar</Button>
      <p className="fine" style={{ textAlign: 'center', marginTop: 12 }}>El desembolso se habilita automáticamente al completar los cuatro pasos.</p>
      {modal && <Terminos onClose={() => setModal(false)} onAccept={() => { setTerms(true); setModal(false); toast.success('Términos y condiciones aceptados.'); }} />}
    </div>
  );
}

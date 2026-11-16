import { useState } from 'react';
import { LayoutDashboard, FileStack, ScanSearch, Fingerprint, Wallet, Globe, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import Split from '../components/ui/Split';

const TABS = [
  { key: 'panel', icon: LayoutDashboard, label: 'Panel general', who: 'Equipo interno', to: '/admin',
    desc: 'La vista de entrada: el estado de la cartera de un vistazo.',
    can: ['Ver el estado general de la cartera en tiempo real, sin planillas.', 'Monitorear la tasa de aprobación y el score promedio de los clientes.', 'Detectar variaciones en la mora antes de que se conviertan en un problema.', 'Acceder rápido a las solicitudes pendientes de revisión.'] },
  { key: 'sol', icon: FileStack, label: 'Solicitudes', who: 'Equipo interno', to: '/admin/solicitudes',
    desc: 'El listado de pedidos de crédito con búsqueda y filtros.',
    can: ['Buscar por cliente y filtrar por estado.', 'Ver el detalle completo: datos del cliente, documentación cargada y score.', 'Aprobar o rechazar con un clic.', 'Cargar una solicitud manualmente.'] },
  { key: 'sco', icon: ScanSearch, label: 'Scoring de riesgo', who: 'Analista de riesgo', to: '/admin/scoring',
    desc: 'El análisis de riesgo de cada solicitante, con su recomendación.',
    can: ['Analizar el perfil de riesgo de cada solicitante.', 'Ver el detalle de cada factor que compone el score.', 'Actualizar el análisis cuando cambian los datos.', 'Leer una recomendación clara para quien aprueba.'] },
  { key: 'ver', icon: Fingerprint, label: 'Verificación y firma', who: 'Personal de sucursal', to: '/admin/verificacion',
    desc: 'El paso presencial que habilita el desembolso.',
    can: ['Cotejar la documentación original contra lo cargado online.', 'Registrar la captura de datos biométricos.', 'Mostrar los términos y condiciones y registrar su aceptación.', 'Tomar la firma del cliente en pantalla y confirmar el desembolso.'] },
  { key: 'car', icon: Wallet, label: 'Cartera y cobranzas', who: 'Equipo interno', to: '/admin/cartera',
    desc: 'Los créditos activos y las acciones de cobranza.',
    can: ['Ver saldo, próximo vencimiento y estado de cada crédito.', 'Detectar atrasos apenas ocurren.', 'Enviar recordatorios de pago.', 'Seguir el historial de acciones.'] },
  { key: 'por', icon: Globe, label: 'Portal del cliente', who: 'Cliente final', to: '/solicitud',
    desc: 'Lo que ve la persona que pide el préstamo: simulador y solicitud.',
    can: ['Simular cuota, TNA y costo financiero total.', 'Completar la solicitud desde cualquier dispositivo.', 'Subir la documentación requerida en el mismo formulario.', 'Recibir la indicación de ir a la sucursal para la verificación final.'] },
];

export default function Manual() {
  const [k, setK] = useState('panel');
  const tab = TABS.find((t) => t.key === k);
  return (
    <>
      <section className="section manual-head">
        <div className="container">
          <p className="eyebrow">Manual del sistema</p>
          <Split as="h1" className="t-hero" text="Conocé NexaCred por dentro." base={100} />
          <p className="t-sub fade-in-up" style={{ '--base': '700ms', maxWidth: 680, marginTop: 28 }}>Un recorrido por los módulos que usa tu equipo y por el portal donde tus clientes piden el préstamo. Elegí uno para ver qué se puede hacer y abrirlo en la demo.</p>
        </div>
      </section>
      <section className="section chalk" style={{ paddingTop: 48 }}>
        <div className="container">
          <div className="tabs" role="tablist" aria-label="Módulos">
            {TABS.map((t) => (
              <button key={t.key} role="tab" aria-selected={k === t.key} className={`tab ${k === t.key ? 'on' : ''}`} onClick={() => setK(t.key)}><t.icon size={16} /> {t.label}</button>
            ))}
          </div>
          <div className="tab-panel" role="tabpanel" key={k}>
            <div className="row g-5 align-items-center fade-in-up">
              <div className="col-lg-6">
                <span className="chip">Uso: {tab.who}</span>
                <h2 className="t-lg" style={{ margin: '18px 0 12px' }}>{tab.label}</h2>
                <p className="t-sub">{tab.desc}</p>
                <div style={{ marginTop: 28 }}><Button to={tab.to} arrow>Abrir módulo</Button></div>
              </div>
              <div className="col-lg-6">
                <div className="can-card">
                  <h3>Qué podés hacer en esta pantalla</h3>
                  <ul>{tab.can.map((c) => <li key={c}><span><Check size={14} strokeWidth={3} /></span>{c}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

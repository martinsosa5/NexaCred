import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Check } from 'lucide-react';

export default function Terminos({ onClose, onAccept }) {
  return (
    <Modal title="Términos y condiciones del contrato de crédito" onClose={onClose} wide
      footer={<><Button variant="ghost" type="button" onClick={onClose}>Cerrar</Button><Button type="button" onClick={onAccept}><Check size={16} /> Aceptar términos</Button></>}>
      <div className="terms">
        <h4>1. Objeto del contrato</h4>
        <p>NexaCred S.R.L., en su carácter de proveedor del sistema, actúa exclusivamente como plataforma tecnológica de gestión. El presente contrato de crédito se celebra entre la entidad financiera prestamista y el cliente solicitante, cuyos datos y condiciones particulares (monto, plazo y tasa) fueron detallados en los pasos anteriores de esta solicitud.</p>
        <h4>2. Verificación de identidad y datos biométricos</h4>
        <p>El cliente presta su consentimiento libre, expreso e informado para la captura y el tratamiento de sus datos biométricos (huella digital y fotografía) con la única finalidad de validar su identidad y prevenir el fraude, conforme a la Ley de Protección de Datos Personales vigente. Dichos datos se almacenan de forma cifrada y no se comparten con terceros ajenos a la operación crediticia.</p>
        <h4>3. Obligaciones del cliente</h4>
        <ul>
          <li>Abonar cada cuota en la fecha de vencimiento indicada en el cronograma de pagos.</li>
          <li>Mantener actualizados sus datos de contacto y domicilio ante la entidad.</li>
          <li>Informar de inmediato cualquier cambio significativo en su situación laboral o patrimonial.</li>
        </ul>
        <h4>4. Consecuencias del incumplimiento</h4>
        <p>La falta de pago en término podrá generar intereses moratorios, el reporte de la situación a los burós de crédito correspondientes y el inicio de las acciones de cobranza y, eventualmente, legales previstas por la normativa aplicable.</p>
        <h4>5. Firma electrónica y validez</h4>
        <p>El cliente reconoce que la firma trazada digitalmente en el paso siguiente, junto con la verificación biométrica y documental realizada en sucursal, tiene la misma validez legal que una firma ológrafa, y manifiesta su conformidad plena con el monto, el plazo y las condiciones del préstamo detalladas en el resumen de la solicitud.</p>
        <h4>6. Aceptación</h4>
        <p>Al tildar la casilla "Acepto los Términos y Condiciones" y firmar en el paso siguiente, el cliente declara haber leído, comprendido y aceptado en su totalidad el presente contrato.</p>
      </div>
    </Modal>
  );
}

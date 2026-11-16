/* Asistente virtual de demostración: responde con reglas simples (palabras clave) y usa el mismo
   cálculo del simulador para dar cuotas reales. En producción se reemplazaría por un servicio de IA
   conectado a la base de conocimiento de la entidad. */
import { calcular, MIN, MAX, PLAZOS } from './finanzas';
import { money, pct } from './format';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const has = (t, words) => words.some((w) => t.includes(w));

function leerMonto(t) {
  const m = t.match(/\$?\s*(\d{1,3}(?:[.,]\d{3})+|\d+)(?:\s*(mil|k|palos?|millon(?:es)?))?/);
  if (!m) return null;
  let n = Number(m[1].replace(/[.,]/g, ''));
  const suf = m[2];
  if (suf && /mil|k/.test(suf)) n *= 1000;
  if (suf && /palo|millon/.test(suf)) n *= 1000000;
  return n >= 1000 ? n : null; // evita confundir "12 cuotas" con un monto
}
function leerPlazo(t, ctx) {
  const m = t.match(/(\d{1,2})\s*(cuotas?|meses|mes)/) || (ctx?.monto ? t.match(/\ben\s+(\d{1,2})\b/) : null);
  if (!m) return null;
  const n = Number(m[1]);
  return PLAZOS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
}

export const SUGERENCIAS = ['Quiero simular un préstamo', '¿Qué documentación necesito?', '¿Cuánto tardan en aprobar?', '¿Dónde queda la sucursal?'];

/** Devuelve { text, link?, chips?, ctx }. */
export function responder(texto, ctx = {}) {
  const t = norm(texto);
  const monto = leerMonto(t);
  const plazo = leerPlazo(t, ctx);
  const seguir = ['Ver requisitos', 'Quiero solicitarlo'];

  if (monto || (plazo && ctx.monto)) {
    const mm = monto ?? ctx.monto;
    const pp = plazo ?? ctx.plazo ?? 12;
    if (mm < MIN || mm > MAX) return { text: `Los préstamos van de ${money(MIN)} a ${money(MAX)}. ¿Probamos con un monto dentro de ese rango?`, ctx };
    const c = calcular(mm, pp);
    return {
      text: `Para **${money(mm)} en ${pp} cuotas**:\n• Cuota mensual estimada: **${money(c.cuota)}**\n• Recibís en tu cuenta: ${money(c.recibe)}\n• Total a pagar: ${money(c.total)}\n• TNA ${pct(c.tna)} · CFT ${pct(c.cft, 1)}\n\nEs una estimación, no una oferta firme. ¿Querés ver otro plazo? Decime, por ejemplo, "en 24 cuotas".`,
      chips: [...seguir.slice(1), 'En 36 cuotas'],
      link: { to: '/solicitud', label: 'Solicitar este préstamo' },
      ctx: { monto: mm, plazo: pp },
    };
  }
  if (plazo) return { text: `Perfecto, ${plazo} cuotas. ¿Qué monto necesitás? Por ejemplo "$500.000".`, ctx: { ...ctx, plazo } };

  if (has(t, ['simul', 'cuanto pagar', 'cuota', 'cuanto sale'])) {
    return { text: `Con gusto. Decime **cuánto necesitás** y en cuántas cuotas, por ejemplo: "$500.000 en 24 cuotas". Los montos van de ${money(MIN)} a ${money(MAX)} y los plazos son de ${PLAZOS.join(', ')} cuotas.`, ctx };
  }
  if (has(t, ['document', 'requisit', 'papeles', 'que necesito', 'que llevo', 'dni', 'recibo'])) {
    return { text: 'Necesitás:\n• **DNI vigente** (frente y dorso)\n• **Comprobante de ingresos**: último recibo de sueldo (monotributistas y autónomos: constancia de inscripción y últimos 3 pagos)\n• **Comprobante de domicilio**: factura de un servicio a tu nombre, de los últimos 3 meses\n\nTambién tenés que tener entre 18 y 75 años, y que la cuota no supere el 35% de tus ingresos.', chips: ['Quiero simular un préstamo', 'Quiero solicitarlo'], ctx };
  }
  if (has(t, ['tasa', 'interes', 'cft', 'costo'])) {
    return { text: 'La tasa depende del plazo: va del **52% TNA** (6 cuotas) al **72% TNA** (48 cuotas). El **CFT** suma además el gasto de otorgamiento (2%) y el seguro de vida sobre saldo; es el número que conviene comparar entre ofertas. Si me decís monto y cuotas te lo calculo.', chips: ['Quiero simular un préstamo'], ctx };
  }
  if (has(t, ['plazo', 'cuantas cuotas', 'meses', 'cuotas'])) {
    return { text: `Podés elegir ${PLAZOS.join(', ')} cuotas, con montos de ${money(MIN)} a ${money(MAX)}. ¿Querés que lo simulemos?`, chips: ['Quiero simular un préstamo'], ctx };
  }
  if (has(t, ['tarda', 'demora', 'aprob', 'cuando', 'respuesta', 'tiempo'])) {
    return { text: 'Revisamos tu solicitud en **hasta 48 horas hábiles** y te avisamos por email y WhatsApp. Si tiene el visto bueno, el paso final es en la sucursal: verificamos tu documentación original y datos biométricos, firmás el contrato y acreditamos el préstamo.', chips: ['¿Dónde queda la sucursal?', 'Quiero solicitarlo'], ctx };
  }
  if (has(t, ['sucursal', 'donde', 'direccion', 'horario', 'ubicacion', 'atienden'])) {
    return { text: 'Estamos en **San Martín 850, San Miguel de Tucumán**. Atendemos de **lunes a viernes de 9 a 16 hs**. Recordá llevar tu DNI y la documentación originales.', chips: ['¿Qué documentación necesito?'], ctx };
  }
  if (has(t, ['solicitar', 'pedir', 'pedido', 'iniciar', 'empezar', 'quiero uno', 'sacar'])) {
    return { text: 'Muy bien, el pedido online lleva unos minutos: cargás tus datos, subís la documentación y recibís tu número de solicitud.', link: { to: '/solicitud', label: 'Ir a la solicitud' }, ctx };
  }
  if (has(t, ['cancelar', 'adelant', 'anticipo', 'cancelacion'])) {
    return { text: 'Sí, podés cancelar total o parcialmente desde la sucursal. Los intereses se calculan sobre el capital que todavía debas.', ctx };
  }
  if (has(t, ['dato', 'seguridad', 'privacidad', 'biometric', 'huella'])) {
    return { text: 'Tus datos se usan solo para evaluar tu solicitud. Los datos biométricos se capturan en la sucursal, con tu consentimiento expreso, para validar tu identidad y evitar fraudes.', ctx };
  }
  if (has(t, ['humano', 'asesor', 'persona', 'whatsapp', 'telefono', 'llamar', 'contacto', 'mail', 'email'])) {
    return { text: 'Claro. Podés escribirnos a **contacto@nexacred.com**, por WhatsApp, o dejarnos tu consulta en el formulario de contacto de esta página y te respondemos a la brevedad.', link: { href: 'https://wa.me/5411000000', label: 'Abrir WhatsApp' }, ctx };
  }
  if (has(t, ['gracias', 'genial', 'perfecto', 'listo', 'chau', 'adios'])) {
    return { text: '¡De nada! Si necesitás algo más, acá estoy.', ctx };
  }
  if (has(t, ['hola', 'buen', 'buenas', 'hey', 'que tal'])) {
    return { text: '¡Hola! Soy **NexaBot**. Puedo ayudarte a simular tu cuota, contarte los requisitos o cómo es el proceso. ¿Sobre qué querés consultar?', chips: SUGERENCIAS, ctx };
  }
  return { text: 'No estoy seguro de haber entendido. Puedo ayudarte con **simulaciones de préstamo**, **requisitos**, **tasas**, **tiempos de aprobación** y **sucursal**. ¿Probamos con alguno?', chips: SUGERENCIAS, ctx };
}

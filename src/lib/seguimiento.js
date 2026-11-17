const ESTADOS = {
  pendiente: { titulo: 'Solicitud recibida', mensaje: 'Recibimos tu solicitud. Nuestro equipo la revisará.', clase: 'pill-info' },
  aprobado: { titulo: 'Aprobada', mensaje: 'Tu solicitud fue aprobada. Consultá con la entidad los próximos pasos para continuar con la verificación presencial.', clase: 'pill-ok' },
  rechazado: { titulo: 'Rechazada', mensaje: 'Tu solicitud no fue aprobada. Podés comunicarte con la entidad para obtener más información.', clase: 'pill-bad' },
  desembolsado: { titulo: 'Desembolsada', mensaje: 'El préstamo asociado a tu solicitud figura como desembolsado.', clase: 'pill-ok' },
};

const fechaValida = (valor) => typeof valor === 'string' && !Number.isNaN(Date.parse(valor)) ? valor : null;
const normalizarNumero = (valor) => typeof valor === 'string' ? valor.trim().toUpperCase() : '';
const normalizarCodigo = (valor) => typeof valor === 'string' ? valor.trim().toUpperCase() : '';

/** 128 bits aleatorios; no se deriva del número de solicitud ni de datos personales. */
export function generarCodigoConsulta() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase().match(/.{8}/g).join('-');
}

/** Solo registra cambios reales a partir de ahora; no reconstruye fechas antiguas. */
export function registrarCambioSeguimiento(solicitud, estado, fecha = new Date().toISOString()) {
  if (!solicitud.codigoConsulta || solicitud.estado === estado) return {};
  return { actualizadaEn: fecha, seguimientoEventos: [...(solicitud.seguimientoEventos || []), { estado, fecha }] };
}

/** Proyección pública explícita: nunca devolver la solicitud completa ni sus datos internos. */
export function consultarSolicitud(solicitudes, numero, codigo) {
  const n = normalizarNumero(numero);
  const c = normalizarCodigo(codigo);
  if (!/^NC-\d{4}-\d{5,}$/.test(n) || !/^[\dA-F]{8}(?:-[\dA-F]{8}){3}$/.test(c)) return null;
  const solicitud = solicitudes.find((a) => a.origen === 'portal' && normalizarNumero(a.numero) === n && typeof a.codigoConsulta === 'string' && normalizarCodigo(a.codigoConsulta) === c);
  if (!solicitud) return null;
  const estado = ESTADOS[solicitud.estado] || { titulo: 'Estado no disponible', mensaje: 'Contactá a la entidad para consultar el estado de tu solicitud.', clase: 'pill-info' };
  const eventos = (solicitud.seguimientoEventos || []).filter((e) => ESTADOS[e.estado]);
  const recepcion = eventos.find((e) => e.estado === 'pendiente');
  const etapas = [{ titulo: 'Solicitud recibida', fecha: fechaValida(recepcion?.fecha) || fechaValida(solicitud.fecha), situacion: 'completada' }];
  for (const evento of eventos.filter((e) => e.estado !== 'pendiente')) {
    if (evento.estado === 'desembolsado' && solicitud.terminosAceptados && solicitud.firma) {
      etapas.push({ titulo: 'Verificación presencial', fecha: null, situacion: 'completada' });
    }
    etapas.push({ titulo: ESTADOS[evento.estado].titulo, fecha: fechaValida(evento.fecha), situacion: 'completada' });
  }
  // Para una adaptación antigua con código, el estado actual es verificable; su fecha puede no existir.
  if (solicitud.estado !== 'pendiente' && ESTADOS[solicitud.estado] && !eventos.some((e) => e.estado === solicitud.estado)) {
    if (solicitud.estado === 'desembolsado' && solicitud.terminosAceptados && solicitud.firma) etapas.push({ titulo: 'Verificación presencial', fecha: null, situacion: 'completada' });
    etapas.push({ titulo: estado.titulo, fecha: null, situacion: 'completada' });
  }
  if (solicitud.estado === 'aprobado') etapas.push({ titulo: 'Verificación presencial', fecha: null, situacion: 'pendiente' });
  return {
    numero: solicitud.numero,
    fechaPresentacion: fechaValida(solicitud.fecha),
    ultimaActualizacion: fechaValida(solicitud.actualizadaEn),
    estado: { ...estado }, etapas,
  };
}

/* Áreas del sistema que se pueden habilitar a cada empleado. El administrador general
   tiene acceso a todo y es el único que ve el módulo de Empleados. */
export const PERMISOS = [
  { id: 'panel', label: 'Panel general', desc: 'Ver los indicadores y gráficos de la cartera.' },
  { id: 'solicitudes', label: 'Solicitudes', desc: 'Ver, buscar y cargar solicitudes de crédito.' },
  { id: 'decidir', label: 'Aprobar o rechazar', desc: 'Decidir sobre las solicitudes pendientes.' },
  { id: 'scoring', label: 'Scoring de riesgo', desc: 'Consultar y actualizar el análisis de riesgo del solicitante.' },
  { id: 'verificacion', label: 'Verificación y firma', desc: 'Validar documentación y biometría, tomar la firma y desembolsar.' },
  { id: 'cartera', label: 'Cartera y cobranzas', desc: 'Seguir pagos y mora, y enviar recordatorios.' },
];

/* Perfiles sugeridos: al elegirlos se tildan los accesos típicos del puesto (se pueden ajustar). */
export const ROLES = [
  { id: 'credito', label: 'Oficial de crédito', permisos: ['panel', 'solicitudes', 'decidir', 'scoring'], desc: 'Analiza el riesgo y decide si se aprueba o no.' },
  { id: 'sucursal', label: 'Oficial de sucursal', permisos: ['solicitudes', 'verificacion'], desc: 'Atiende al cliente en persona: verifica, toma la firma y desembolsa.' },
  { id: 'cobranzas', label: 'Analista de cobranzas', permisos: ['panel', 'cartera'], desc: 'Sigue los pagos y gestiona a los clientes atrasados.' },
  { id: 'atencion', label: 'Atención al cliente', permisos: ['solicitudes'], desc: 'Carga y consulta solicitudes, sin decidir sobre ellas.' },
  { id: 'custom', label: 'Personalizado', permisos: [], desc: 'Elegís vos los accesos uno por uno.' },
];

export const RUTAS = [
  { to: '/admin', perm: 'panel' },
  { to: '/admin/solicitudes', perm: 'solicitudes' },
  { to: '/admin/scoring', perm: 'scoring' },
  { to: '/admin/verificacion', perm: 'verificacion' },
  { to: '/admin/cartera', perm: 'cartera' },
  { to: '/admin/empleados', perm: 'admin' },
];

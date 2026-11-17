# NexaCred

Proyecto académico (Administración de Sistemas, UTN FRT): **NexaCred S.R.L.**, empresa ficticia que desarrolla un sistema SaaS de gestión de préstamos para financieras y prestamistas. NexaCred no presta dinero: vende el software a quien presta.

Este repo es el sitio de NexaCred (portal público + panel de administración). No tiene backend: los datos son de ejemplo y se guardan en el `localStorage` del navegador.

## Qué incluye

**Parte pública** (`/`): presentación de la empresa, simulador de préstamo (cuota, total, TNA y CFT, cronograma), nosotros, cómo funciona, requisitos, preguntas y contacto. `/solicitud` permite pedir el préstamo en 4 pasos con carga de documentación. `/manual` describe los módulos del sistema.

**Parte privada** (`/admin`, solo personal de la entidad): panel general, solicitudes, scoring de riesgo, verificación presencial con firma, y cartera y cobranzas. Hay un administrador general (`admin@nexacred.com` / `demo1234`) que, además, ve el módulo **Empleados**: ahí crea empleados con correo y contraseña y les habilita áreas (panel, solicitudes, aprobar/rechazar, scoring, verificación y firma, cartera). Cada empleado solo ve las áreas asignadas y la actividad queda firmada con su nombre. Empleados de ejemplo: `lucia@`, `julian@` y `carolina@nexacred.com` / `empleado123`.
El ingreso tiene "¿Olvidaste tu contraseña?": el envío del código es simulado (cualquier código de 6 dígitos sirve) y la contraseña nueva sí se guarda.

Los datos son de ejemplo y se guardan en el `localStorage` del navegador (sin backend). Una solicitud cargada en `/solicitud` aparece en el admin, en el mismo navegador.

## Cómo correrlo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/
```

## Estructura

```
src/
  lib/          finanzas.js (cálculo francés, CFT, scoring), store.js (datos demo), schemas.js (Zod), auth.js, format.js
  components/   ui/ (Reveal, Split, Modal, Button…), public/ (layout, simulador), admin/
  pages/        Home, Solicitud, Manual, admin/*
  styles/       tokens.css (colores, radios), base.css, ui.css, public.css, admin.css
public/         favicon e img/portada.jpg (foto del hero)
prototipo/      primeros prototipos HTML (referencia, no se usan en el sitio)
```

Stack: React 19 + Vite, React Router, React Hook Form + Zod, react-hot-toast, lucide-react, date-fns. El diseño sigue `DESIGN.md` (estilo Rivian) con el azul de NexaCred como único color de acción.

## Deploy en Vercel

1. Entrar a [vercel.com/new](https://vercel.com/new) con la cuenta de GitHub e importar `martinsosa5/nexacred`.
2. Framework preset: **Vite** (lo detecta solo). Build `npm run build`, output `dist`.
3. Deploy. `vercel.json` ya redirige todas las rutas a `index.html` para que `/admin` y `/solicitud` funcionen al recargar.
4. Cada `git push` a `main` redeploya solo.

## Trabajar en equipo

- Agregar a la compañera: GitHub → repo → Settings → Collaborators → Add people.
- Flujo sugerido: cada una trabaja en una rama (`git checkout -b mi-cambio`), abre Pull Request y se mergea a `main`. Vercel genera un link de prueba por cada PR.
- Cambiar la foto del hero: reemplazar `public/img/portada.jpg` (conviene 1920 px de ancho o más).
- Cambiar tasas o límites del simulador: `src/lib/finanzas.js`.

## Registro de pagos (demo local)

En `/admin/cartera`, usar **Registrar pago** desde la lista o desde el detalle de un vencimiento en el calendario. Completar fecha, importe, método y observaciones; seleccionar **Revisar pago** y luego **Confirmar pago**. Un abono parcial conserva el vencimiento y muestra cuánto falta. Al cubrir la cuota se conserva en verde y se habilita el siguiente vencimiento mensual. Los filtros se aplican al estado actual del crédito y conservan sus cuotas registradas en el calendario.

- Se guardan operaciones con UUID, crédito/cuota, fecha efectiva y de registro, empleado responsable, método, observaciones y desglose de capital, interés y seguro. Los importes se calculan en centavos. Primero se imputan intereses, después seguro y finalmente capital; solo el capital reduce el saldo.
- Se conserva la clave `nexacred-demo-v3` y sus datos. No hay reinicio ni migración masiva: los nuevos campos se agregan al registrar pagos del crédito correspondiente. Las cuotas anteriores desconocidas no se marcan como pagadas.
- **Créditos existentes sin historial:** número de cuota y finalización contractual desconocidos. La cuota se toma del importe disponible o del cálculo francés original; el interés mensual se estima sobre el saldo inicial de esa cuota y el seguro sobre el monto original. Se exige aceptar la estimación antes de confirmar, se identifica el saldo resultante como estimado y se genera únicamente el siguiente vencimiento mensual estimado. El plazo original se usa para obtener la tasa, sin inferir cuántas cuotas históricas se pagaron.
- **Nuevos desembolsos:** seguimiento desde cuota 1, con tasa y seguro originales, cuota a centavos y ajuste del capital de la última cuota para cerrar el saldo. Las fechas mensuales conservan el día del primer vencimiento, ajustando febrero y los meses cortos sin perder el ancla original.
- No se calculan punitorios, comisiones nuevas ni anticipos: el importe recibido no puede superar el pendiente de la cuota actual. No se admiten fechas futuras ni anteriores a otro pago ya registrado del mismo crédito. Sin monto, plazo válido, saldo o vencimiento suficiente, el registro queda bloqueado.
- El guardado usa Web Locks en localhost para serializar registros entre pestañas, relee el almacenamiento y rechaza operaciones repetidas o formularios desactualizados. Si falla la escritura, no cambia el saldo ni muestra éxito. Sigue siendo un prototipo: localStorage no reemplaza una base de datos, auditoría ni autorización de servidor, y las demás operaciones originales del store conservan su comportamiento.

Pruebas de la lógica: `node --test src/lib/pagos.test.js`. Validación general: `npm run lint` y `npm run build`. Para pruebas manuales usar un perfil de navegador aislado con datos ficticios, sin borrar el almacenamiento de trabajo.

## Historial de pagos por crédito

En Cartera y cobranzas, usar **Ver historial** desde la lista o el detalle del calendario. La ficha es de consulta: muestra información del préstamo, resumen, cuotas por vencimiento, filtros por estado y todas las operaciones registradas. **Ver detalles** permite revisar los abonos asociados a una cuota; cada operación también puede desplegarse individualmente. **Volver a Cartera y cobranzas** conserva la búsqueda, el filtro, la vista y el mes seleccionado.

La ficha se suscribe al mismo store de pagos y se actualiza cuando cambia, también al recibir cambios de otra pestaña. No agrega almacenamiento, migraciones ni acciones para modificar o borrar pagos. Tras recargar, volver a abrir la ficha recupera los movimientos de localStorage.

- El total recibido y las cuotas pagadas verificadas se obtienen de operaciones del crédito seleccionado. El saldo de capital es el mismo de cartera; no se suman intereses al capital pendiente. Los pagos parciales vencidos aparecen como parciales y atrasados.
- En créditos antiguos solo se muestran cuotas disponibles y el próximo vencimiento estimado. No se infiere el historial anterior ni el total de cuotas restantes. La fecha de solicitud no se usa como fecha de desembolso: si esta no está registrada, se indica.
- Para créditos con seguimiento desde cuota 1, el resto del cronograma se proyecta en memoria reutilizando `cuotaActual` del registro de pagos (incluido el redondeo y el ajuste de la última cuota). Esas filas se identifican como **Proyección**, no se guardan y no se marcan pagadas sin operaciones. Los contadores incluyen las filas disponibles, antes de aplicar filtros.
- Los importes estimados mantienen esa advertencia. Una operación sin cuota asociable se conserva en la sección de operaciones sin inventar una cuota para completarla.

Pruebas de ambas funcionalidades: `node --test src/lib/pagos.test.js src/lib/historialPagos.test.js`.

## Consulta pública de solicitudes (demo local)

La ruta `/seguimiento` está disponible como **Consultar mi solicitud** en la navegación pública y el footer. Al completar una nueva solicitud en `/solicitud`, se muestran el número y un **código privado de consulta**. Guardar ambos y usarlos en **Consultar estado**; no se necesita una cuenta administrativa. El botón de acceso no transporta el código en la URL.

- El código contiene 128 bits obtenidos con `crypto.getRandomValues`, agrupados en cuatro bloques hexadecimales. No depende del número, DNI, nombre ni otra información personal. Se genera exclusivamente para solicitudes nuevas del portal y se comprueba que no exista en el store actual.
- Se reutiliza la solicitud original en `nexacred-demo-v3`. La consulta requiere número y código correctos y devuelve solo número, fecha de presentación, estado público, última actualización disponible y etapas. No devuelve nombre, DNI, contactos, documentación, montos, scoring, firma, empleados ni código privado. Solicitud inexistente y código incorrecto comparten el mismo mensaje.
- Los estados internos permanecen intactos: `pendiente` se presenta como **Solicitud recibida**, `aprobado` como **Aprobada**, `rechazado` como **Rechazada** y `desembolsado` como **Desembolsada**. No existe una acción independiente de “En evaluación”, por lo que no se inventa esa etapa. Una aprobación habilita mostrar **Verificación presencial pendiente**. Su finalización solo se muestra si el desembolso tiene términos aceptados y firma; no se inventa la fecha de esa verificación.
- Las nuevas solicitudes guardan eventos mínimos de recepción, decisiones y desembolso con sus fechas reales de registro. No contienen actores ni notas internas. Las acciones administrativas existentes incorporan esos eventos solo a solicitudes que tienen código, sin reconstruir históricos ni migrar los datos demo originales.
- **Solicitudes antiguas sin código:** la consulta se deniega. Para probar el circuito completo, crear una solicitud ficticia nueva desde el portal. Si se necesita adaptar una solicitud antigua de la demo, hacerlo como una tarea explícita: asignar un código aleatorio único con el mismo generador a la solicitud identificada, entregarlo de forma privada y conservar las fechas y etapas desconocidas como no registradas. No habilitar búsquedas por DNI/nombre ni copiar masivamente códigos o históricos. No se incluyó una herramienta de migración o recuperación de códigos.
- **Límite de privacidad:** funciona únicamente dentro del mismo perfil de navegador y origen (incluido puerto), también entre pestañas. Los códigos y el resto de la demo están en localStorage, accesible desde ese perfil; no constituye autenticación ni protección de producción y no permite consultar desde otra computadora o navegador. Una versión real necesita backend, controles de acceso y almacenamiento seguros. Usar solo datos ficticios.

Para probar: crear dos solicitudes ficticias, guardar sus números y códigos, entrar como administrador en otra pestaña y **Aprobar** una y **Rechazar** otra desde `/admin/solicitudes`. Las consultas abiertas reflejan los cambios; tras recargar, volver a ingresar número y código. La verificación y el desembolso se prueban con el circuito original de `/admin/verificacion`.

Pruebas de lógica: `node --test src/lib/seguimiento.test.js src/lib/pagos.test.js src/lib/historialPagos.test.js`. Validación general: `npm run lint` y `npm run build`.

## Reportes CSV de cobranzas

En `/admin/cartera`, tanto en lista como en calendario, usar **Exportar reporte CSV**, elegir tipo y filtros, revisar el resumen y seleccionar **Confirmar exportación**. **Cancelar** cierra el modal sin descargar ni modificar datos. Solo está disponible para usuarios con acceso a Cartera y cobranzas; no existe un acceso público.

- **Créditos activos:** desembolsados con saldo positivo; identifica crédito/cliente, monto, plazo, saldo, próximo vencimiento, estado y días de atraso. El origen del saldo indica si fue estimado. El período, si se elige, filtra por próximo vencimiento, no por fecha de alta.
- **Cuotas atrasadas:** vencimiento pasado con deuda de cuota verificable. Reutiliza el historial y sus pagos reales, excluye proyecciones y cuotas con importe estimado. Los créditos antiguos de la demo pueden no aparecer: no se certifica una cuota impaga ni su importe solo porque exista saldo de capital y una fecha pasada. No se reconstruyen pagos anteriores. El total es importe vencido de cuotas, no capital.
- **Próximos vencimientos:** período obligatorio, por defecto el mes actual; excluye fechas anteriores a hoy y cuotas pagadas. Sin estimaciones solo muestra vencimientos registrados, dejando vacíos los importes no verificables. Al habilitar estimaciones incluye importes estimados y las proyecciones del historial. Siempre distingue origen de fecha y de importe. El saldo del crédito no se suma varias veces; el total corresponde a importes de cuotas, y no se calcula si falta algún importe.
- **Pagos registrados:** una fila por operación real, con identificadores, cliente, cuota si se conoce, fecha, importe, método, capital, intereses, seguro, responsable y origen de la imputación. No exporta observaciones, DNI, contactos, credenciales, documentos, scoring ni códigos de seguimiento. El total es dinero recibido, no capital amortizado. Si el crédito de una operación ya no está disponible, al exportar todos se conserva la operación con su identificador y sin inventar nombre o desglose.

Las fechas son inclusivas. En cuotas se filtra por vencimiento y en pagos por fecha del pago. Sin fechas, los tipos distintos de próximos vencimientos no limitan el período. El selector de cliente identifica un crédito específico para evitar confundir personas con nombres iguales. El estado filtra cuotas/créditos y no aplica al reporte de operaciones. **Todos los registros** ignora la búsqueda de cartera pero respeta los filtros del modal; **Solo resultados filtrados** combina ambos conjuntos de filtros. Un conjunto filtrado vacío permanece vacío y no se descarga un archivo sin registros.

Los archivos se generan en el navegador: UTF-8 con BOM, separador `;`, líneas CRLF, fechas DD/MM/AAAA, importes con dos decimales y coma sin símbolo monetario. Todas las celdas se entrecomillan, se duplican las comillas internas y se conservan saltos de línea. El texto potencialmente interpretable como fórmula (`=`, `+`, `-`, `@`, también tras espacios/controles) se neutraliza con apóstrofo. Los números tipados se formatean por separado. Los valores ausentes quedan vacíos. El nombre incluye tipo y fecha local de exportación. La descarga usa Blob y una URL temporal que se libera después.

Para verificar en Excel, abrir/importar el CSV como UTF-8, con punto y coma como delimitador y coma decimal si la configuración regional no los detecta. Comparar número de filas e importe del resumen; no sumar el saldo de un crédito repetido en distintas cuotas como si fueran créditos diferentes. La exportación no escribe en localStorage ni agrega otra fuente de pagos. Los controles locales de permisos siguen siendo los de un prototipo, sin garantías de un backend seguro de producción.

Pruebas: `node --test src/lib/reportes.test.js src/lib/pagos.test.js src/lib/historialPagos.test.js src/lib/seguimiento.test.js`, `npm run lint` y `npm run build`. Usar exclusivamente datos ficticios en un perfil de prueba.

> Proyecto académico (UTN FRT, Administración de Sistemas). Las tasas no constituyen una oferta.

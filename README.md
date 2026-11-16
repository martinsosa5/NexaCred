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

> Proyecto académico (UTN FRT, Administración de Sistemas). Las tasas no constituyen una oferta.

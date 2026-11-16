# NexaCred

Proyecto académico (Administración de Sistemas, UTN FRT): **NexaCred S.R.L.**, empresa ficticia que desarrolla un sistema SaaS de gestión de préstamos para financieras y prestamistas. NexaCred no presta dinero: vende el software a quien presta.

Este repo es el **prototipo navegable** para la demo. No tiene backend: los datos son de ejemplo y se guardan en el `localStorage` del navegador.

## Qué incluye

**Parte pública** (`/`)
- Home con simulador de préstamo (cuota, total, TNA y CFT, cronograma), nosotros, cómo funciona, requisitos, preguntas y contacto.
- `/solicitud`: pedido de préstamo en 4 pasos con carga de documentación.
- `/empresas`: presentación para financieras (cliente de NexaCred).
- `/manual`: manual del sistema por módulos.

**Parte privada** (`/admin`)
- Panel general, solicitudes, scoring de riesgo, verificación presencial con firma, cartera y cobranzas.
- Usuario demo: `admin@nexacred.com` / `demo1234` (también hay un botón "Entrar como demo").
- Una solicitud cargada en `/solicitud` aparece en el admin (mismo navegador). Botón **Reiniciar demo** en el menú lateral para volver a los datos de ejemplo.

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
  pages/        Home, Solicitud, Empresas, Manual, admin/*
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

> Todo es ficticio y con fines académicos. Las tasas no constituyen una oferta.

import { z } from 'zod';
import { differenceInYears, parseISO } from 'date-fns';

export const LABORAL = [
  'Empleado en relación de dependencia',
  'Monotributista o autónomo',
  'Comerciante con negocio propio',
  'Jubilado o pensionado',
];
export const DESTINOS = ['Gastos personales', 'Capital de trabajo', 'Compra de equipamiento', 'Refinanciación de deudas', 'Otro'];

/** Validaciones del paso "Tus datos" (RF-04). El mismo esquema se usaría en el servidor. */
export const datosSchema = z.object({
  nombre: z
    .string()
    .trim()
    .refine((v) => v.length >= 5 && v.includes(' '), 'Ingresá tu nombre y apellido completos.'),
  dni: z.string().regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 números.'),
  nacimiento: z
    .string()
    .min(1, 'Ingresá tu fecha de nacimiento.')
    .refine((v) => {
      const e = differenceInYears(new Date(), parseISO(v));
      return !Number.isNaN(e) && e >= 18 && e <= 75;
    }, 'Tenés que tener entre 18 y 75 años para solicitar un préstamo.'),
  tel: z
    .string()
    .refine((v) => /^\d{8,13}$/.test(v.replace(/[\s\-+()]/g, '')), 'Ingresá un celular válido, con código de área.'),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Ingresá un email válido, por ejemplo nombre@email.com.'),
  domicilio: z.string().trim().min(5, 'Ingresá tu calle y número.'),
  localidad: z.string().trim().min(2, 'Ingresá tu localidad.'),
  laboral: z.string().min(1, 'Elegí tu situación laboral.'),
  ingreso: z.string().refine((v) => Number(String(v).replace(/\D/g, '')) >= 1, 'Ingresá tu ingreso mensual neto.'),
  destino: z.string(),
});

export const contactoSchema = z.object({
  nombre: z.string().trim().min(3, 'Ingresá tu nombre.'),
  email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Ingresá un email válido.'),
  mensaje: z.string().trim().min(5, 'Contanos en qué podemos ayudarte.'),
});

export const nuevaSolicitudSchema = z.object({
  cliente: z.string().trim().min(3, 'Ingresá el nombre del cliente.'),
  monto: z.coerce.number().min(50000, 'El monto mínimo es $ 50.000.').max(5000000, 'El monto máximo es $ 5.000.000.'),
  plazo: z.coerce.number(),
});

export const DOCS = [
  { key: 'dniFrente', label: 'DNI (frente)' },
  { key: 'dniDorso', label: 'DNI (dorso)' },
  { key: 'ingresos', label: 'Recibo de sueldo o comprobante de ingresos' },
  { key: 'domicilio', label: 'Comprobante de domicilio' },
];
export const MAX_BYTES = 5 * 1024 * 1024;
export const OK_EXT = /\.(pdf|jpe?g|png)$/i;

/* =========================================================
   Cálculo financiero (sistema francés + CFT por TIR)
   Mismas reglas que el prototipo HTML y que la ERS (Apéndice A).
   En el sistema real estos valores salen de la tabla parametro_prestamo.
   ========================================================= */
export const MIN = 50000;
export const MAX = 5000000;
export const STEP = 10000;
export const PLAZOS = [6, 12, 18, 24, 36, 48];
// TNA según cantidad de cuotas (valores ficticios para la demo)
export const TNA = { 6: 0.52, 12: 0.56, 18: 0.6, 24: 0.64, 36: 0.68, 48: 0.72 };
export const GASTO_OTORGAMIENTO = 0.02; // 2% del monto, se descuenta del desembolso
export const SEGURO_MENSUAL = 0.0005; // 0,05% mensual sobre el monto solicitado
export const RATIO_MAX = 0.35; // referencia cuota / ingreso

/** Tasa efectiva anual (CFT) a partir de la TIR de los flujos. */
export function cftTea(recibe, cuota, n) {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    let pv = 0;
    for (let t = 1; t <= n; t++) pv += cuota / Math.pow(1 + mid, t);
    if (pv > recibe) lo = mid;
    else hi = mid;
  }
  return Math.pow(1 + (lo + hi) / 2, 12) - 1;
}

export function calcular(monto, n) {
  const tna = TNA[n];
  const i = tna / 12;
  const cuotaPura = (monto * i) / (1 - Math.pow(1 + i, -n));
  const seguro = monto * SEGURO_MENSUAL;
  const cuota = cuotaPura + seguro;
  const recibe = monto - monto * GASTO_OTORGAMIENTO;
  return { tna, i, cuotaPura, seguro, cuota, recibe, total: cuota * n, cft: cftTea(recibe, cuota, n) };
}

/** Cronograma de cuotas de una simulación. */
export function cronograma(monto, n) {
  const c = calcular(monto, n);
  let saldo = monto;
  const filas = [];
  for (let k = 1; k <= n; k++) {
    const interes = saldo * c.i;
    const capital = c.cuotaPura - interes;
    saldo = Math.max(0, saldo - capital);
    filas.push({ n: k, capital, interes, seguro: c.seguro, cuota: c.cuota, saldo });
  }
  return filas;
}

/** Nivel de riesgo según el score (>=700 bajo, 600-699 medio, <600 alto). */
export function nivelRiesgo(score) {
  if (score >= 700) return { key: 'bajo', label: 'Riesgo bajo', recomendacion: 'Aprobar con tasa estándar.' };
  if (score >= 600)
    return { key: 'medio', label: 'Riesgo medio', recomendacion: 'Aprobar con garantías adicionales o tasa ajustada.' };
  return { key: 'alto', label: 'Riesgo alto', recomendacion: 'Requiere revisión manual antes de aprobar.' };
}

/** Factores que explican el score (demo: derivados del puntaje). */
export function factoresScore(score) {
  return [
    { ok: true, text: 'Historial de pago: bueno' },
    { ok: score >= 600, text: `Buró de crédito: ${score >= 600 ? 'sin deudas activas' : 'deudas menores registradas'}` },
    { ok: score >= 650, text: `Relación cuota-ingreso: ${score >= 650 ? '28%' : '41%'}` },
    { ok: score >= 700, text: `Antigüedad laboral: ${score >= 700 ? '4 años' : '1 año'}` },
  ];
}

/** Score inicial de una solicitud nueva (determinístico, para que la demo sea repetible). */
export function scoreInicial({ cuota, ingreso, laboral, dni }) {
  let s = 600;
  if (ingreso > 0) {
    const r = cuota / ingreso;
    s += r <= 0.2 ? 110 : r <= 0.3 ? 80 : r <= RATIO_MAX ? 40 : -20;
  }
  const bonus = { 'Empleado en relación de dependencia': 40, 'Jubilado o pensionado': 20, 'Monotributista o autónomo': 10 };
  s += bonus[laboral] ?? 0;
  s += Number(String(dni || '0').slice(-2)) % 37;
  return Math.max(300, Math.min(990, Math.round(s)));
}

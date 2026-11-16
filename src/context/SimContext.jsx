import { createContext, useContext, useMemo, useState } from 'react';
import { calcular } from '../lib/finanzas';

const Ctx = createContext(null);

/** Estado del simulador compartido entre la home y la solicitud. */
export function SimProvider({ children }) {
  const [monto, setMonto] = useState(500000);
  const [plazo, setPlazo] = useState(24);
  const calc = useMemo(() => calcular(monto, plazo), [monto, plazo]);
  const value = useMemo(() => ({ monto, plazo, setMonto, setPlazo, calc }), [monto, plazo, calc]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSim = () => useContext(Ctx);

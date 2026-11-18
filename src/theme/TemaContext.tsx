import React, { createContext, useContext, useState } from "react";

export interface Paleta {
  oscuro: boolean;
  fondo: string;
  tarjeta: string;
  texto: string;
  subtexto: string;
  borde: string;
  primario: string;
  chipFondo: string;
  chipTexto: string;
  inputFondo: string;
  invertirFondo: string;
  invertirTexto: string;
}

const TEMA_CLARO: Paleta = {
  oscuro: false,
  fondo: "#F1F5F9",
  tarjeta: "#FFFFFF",
  texto: "#0F172A",
  subtexto: "#64748B",
  borde: "#CBD5E1",
  primario: "#1E40AF",
  chipFondo: "#E2E8F0",
  chipTexto: "#1E293B",
  inputFondo: "#FFFFFF",
  invertirFondo: "#EFF6FF",
  invertirTexto: "#1D4ED8",
};

const TEMA_OSCURO: Paleta = {
  oscuro: true,
  fondo: "#0B1120",
  tarjeta: "#1E293B",
  texto: "#F8FAFC",
  subtexto: "#94A3B8",
  borde: "#334155",
  primario: "#3B82F6",
  chipFondo: "#334155",
  chipTexto: "#E2E8F0",
  inputFondo: "#0F172A",
  invertirFondo: "#172554",
  invertirTexto: "#93C5FD",
};

interface ContextoTema {
  tema: Paleta;
  alternarTema: () => void;
}

const TemaContext = createContext<ContextoTema>({
  tema: TEMA_CLARO,
  alternarTema: () => {},
});

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [esOscuro, setEsOscuro] = useState(false);
  const tema = esOscuro ? TEMA_OSCURO : TEMA_CLARO;
  const alternarTema = () => setEsOscuro((prev) => !prev);

  return (
    <TemaContext.Provider value={{ tema, alternarTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export const useTema = () => useContext(TemaContext);
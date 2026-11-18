import { describe, it, expect, vi } from "vitest";

vi.mock("expo-sqlite", () => ({ openDatabaseAsync: vi.fn() }));
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import { calcularMontoConvertido, resolverConLww } from "../src/sync/motor";

describe("Pruebas unitarias del conversor y sincronización offline-first", () => {
  it("1. Calcula correctamente el monto convertido", () => {
    expect(calcularMontoConvertido(100, 0.925)).toBe(92.5);
  });

  it("2. Retorna 0 ante montos inválidos o negativos", () => {
    expect(calcularMontoConvertido(-50, 1.2)).toBe(0);
    expect(calcularMontoConvertido(NaN, 1.2)).toBe(0);
  });

  it("3. Resuelve conflictos LWW eligiendo el registro más reciente", () => {
    const local = {
      id: "USD_EUR",
      base: "USD",
      destino: "EUR",
      created_at: "2026-11-18T10:00:00.000Z",
      updated_at: "2026-11-18T10:00:00.000Z",
      deleted_at: null,
    };
    const remoto = {
      ...local,
      updated_at: "2026-11-18T10:05:00.000Z",
      deleted_at: "2026-11-18T10:05:00.000Z",
    };
    expect(resolverConLww(local, remoto).deleted_at).toBe("2026-11-18T10:05:00.000Z");
  });
});
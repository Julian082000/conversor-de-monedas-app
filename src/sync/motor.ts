import { apiFetch } from "../api/cliente";
import { getDb, ColaItem, ParFavorito } from "../db/sqlite";

export function calcularMontoConvertido(monto: number, tasa: number): number {
  if (!Number.isFinite(monto) || monto < 0 || !Number.isFinite(tasa) || tasa <= 0) return 0;
  return Number((monto * tasa).toFixed(4));
}

export function resolverConLww(local: ParFavorito | null, remoto: ParFavorito): ParFavorito {
  if (!local) return remoto;
  return remoto.updated_at >= local.updated_at ? remoto : local;
}

export async function ejecutarSincronizacion(): Promise<"sincronizado" | "offline"> {
  const db = await getDb();
  try {
    const pendientes = await db.getAllAsync<ColaItem>("SELECT * FROM cola_sync ORDER BY id ASC");
    for (const item of pendientes) {
      const ok = await procesarItemCola(item);
      if (!ok) return "offline";
      await db.runAsync("DELETE FROM cola_sync WHERE id = ?", [item.id]);
    }
    await descargarCambiosRemotos();
    return "sincronizado";
  } catch {
    return "offline";
  }
}

async function procesarItemCola(item: ColaItem): Promise<boolean> {
  const ruta = `/api/par_favorito/${encodeURIComponent(item.entidad_id)}`;
  const res =
    item.operacion === "UPSERT"
      ? await apiFetch(ruta, { method: "PUT", body: item.payload })
      : await apiFetch(ruta, { method: "DELETE" });
  return res.ok;
}

async function descargarCambiosRemotos() {
  const db = await getDb();
  const meta = await db.getFirstAsync<{ valor: string }>("SELECT valor FROM meta_sync WHERE clave = 'last_sync'");
  const since = meta?.valor || "1970-01-01T00:00:00.000Z";

  const res = await apiFetch(`/api/par_favorito?since=${encodeURIComponent(since)}`);
  if (!res.ok) throw new Error("Fallo red");

  const data = (await res.json()) as { items: ParFavorito[]; servidor_ahora: string };
  for (const remoto of data.items) {
    const local = await db.getFirstAsync<ParFavorito>("SELECT * FROM par_favorito WHERE id = ?", [remoto.id]);
    const ganador = resolverConLww(local ?? null, remoto);
    await db.runAsync(
      "INSERT OR REPLACE INTO par_favorito (id, base, destino, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)",
      [ganador.id, ganador.base, ganador.destino, ganador.created_at, ganador.updated_at, ganador.deleted_at]
    );
  }
  await db.runAsync("INSERT OR REPLACE INTO meta_sync (clave, valor) VALUES ('last_sync', ?)", [data.servidor_ahora]);
}
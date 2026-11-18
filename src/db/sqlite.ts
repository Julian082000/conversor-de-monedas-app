import * as SQLite from "expo-sqlite";

export interface ParFavorito {
  id: string;
  base: string;
  destino: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ColaItem {
  id: number;
  operacion: "UPSERT" | "DELETE";
  entidad_id: string;
  payload: string;
  intentos: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync("conversor26.db");
  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS tasas_cache (
      base TEXT PRIMARY KEY,
      fecha TEXT NOT NULL,
      valores TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS par_favorito (
      id TEXT PRIMARY KEY,
      base TEXT NOT NULL,
      destino TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS cola_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operacion TEXT NOT NULL,
      entidad_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      intentos INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS meta_sync (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    );
  `);
  return dbInstance;
}

export async function guardarTasasCache(base: string, fecha: string, valores: Record<string, number>) {
  const db = await getDb();
  await db.runAsync(
    "INSERT OR REPLACE INTO tasas_cache (base, fecha, valores) VALUES (?, ?, ?)",
    [base, fecha, JSON.stringify(valores)]
  );
}

export async function leerTasasCache(base: string) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ base: string; fecha: string; valores: string }>(
    "SELECT * FROM tasas_cache WHERE base = ?",
    [base]
  );
  if (!row) return null;
  return { base: row.base, fecha: row.fecha, valores: JSON.parse(row.valores) as Record<string, number> };
}

export async function listarFavoritos(): Promise<ParFavorito[]> {
  const db = await getDb();
  return db.getAllAsync<ParFavorito>("SELECT * FROM par_favorito WHERE deleted_at IS NULL ORDER BY created_at DESC");
}

export async function guardarFavoritoLocal(base: string, destino: string) {
  const db = await getDb();
  const id = `${base}_${destino}`;
  const ahora = new Date().toISOString();
  await db.runAsync(
    "INSERT OR REPLACE INTO par_favorito (id, base, destino, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, NULL)",
    [id, base, destino, ahora, ahora]
  );
  await db.runAsync(
    "INSERT INTO cola_sync (operacion, entidad_id, payload) VALUES (?, ?, ?)",
    ["UPSERT", id, JSON.stringify({ base, destino })]
  );
}

export async function eliminarFavoritoLocal(id: string) {
  const db = await getDb();
  const ahora = new Date().toISOString();
  await db.runAsync(
    "UPDATE par_favorito SET updated_at = ?, deleted_at = ? WHERE id = ?",
    [ahora, ahora, id]
  );
  await db.runAsync(
    "INSERT INTO cola_sync (operacion, entidad_id, payload) VALUES (?, ?, ?)",
    ["DELETE", id, "{}"]
  );
}

export async function limpiarDatosLocales() {
  const db = await getDb();
  await db.execAsync("DELETE FROM par_favorito; DELETE FROM cola_sync; DELETE FROM meta_sync;");
}
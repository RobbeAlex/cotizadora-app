import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq, desc } from "drizzle-orm";
import {
  cotizaciones,
  historialBusquedas,
  searchResults,
  type Cotizacion,
  type HistorialBusqueda,
  type SearchResult,
  type InsertCotizacion,
} from "@shared/schema";

const sqlite = createClient({ url: "file:data.db" });
export const db = drizzle(sqlite);

// Crear tablas si no existen
sqlite.executeMultiple(`
  CREATE TABLE IF NOT EXISTS cotizaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    created_at TEXT NOT NULL,
    items TEXT NOT NULL,
    total REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS historial_busquedas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    result_count INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS search_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material TEXT NOT NULL,
    marca TEXT NOT NULL,
    presentacion TEXT NOT NULL,
    precio REAL NOT NULL,
    vendedor TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    fuente TEXT,
    search_query TEXT NOT NULL
  );
`);

export interface IStorage {
  // Cotizaciones
  getCotizaciones(): Cotizacion[];
  getCotizacion(id: number): Cotizacion | undefined;
  createCotizacion(data: InsertCotizacion): Cotizacion;
  deleteCotizacion(id: number): void;

  // Historial
  getHistorial(): HistorialBusqueda[];
  addHistorial(query: string, resultCount: number): HistorialBusqueda;
  clearHistorial(): void;
}

export class Storage implements IStorage {
  getCotizaciones(): Cotizacion[] {
    return db.select().from(cotizaciones).orderBy(desc(cotizaciones.id)).all();
  }

  getCotizacion(id: number): Cotizacion | undefined {
    return db.select().from(cotizaciones).where(eq(cotizaciones.id, id)).get();
  }

  createCotizacion(data: InsertCotizacion): Cotizacion {
    return db.insert(cotizaciones).values(data).returning().get();
  }

  deleteCotizacion(id: number): void {
    db.delete(cotizaciones).where(eq(cotizaciones.id, id)).run();
  }

  getHistorial(): HistorialBusqueda[] {
    return db.select().from(historialBusquedas).orderBy(desc(historialBusquedas.id)).limit(50).all();
  }

  addHistorial(query: string, resultCount: number): HistorialBusqueda {
    const now = new Date().toISOString();
    return db
      .insert(historialBusquedas)
      .values({ query, resultCount, createdAt: now })
      .returning()
      .get();
  }

  clearHistorial(): void {
    db.delete(historialBusquedas).run();
  }
}

export const storage = new Storage();

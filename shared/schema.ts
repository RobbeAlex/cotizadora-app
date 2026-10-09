import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Resultado de búsqueda (material cotizado)
export const searchResults = sqliteTable("search_results", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  material: text("material").notNull(),
  marca: text("marca").notNull(),
  presentacion: text("presentacion").notNull(),
  precio: real("precio").notNull(),
  vendedor: text("vendedor").notNull(),
  direccion: text("direccion"),
  telefono: text("telefono"),
  fuente: text("fuente"),
  searchQuery: text("search_query").notNull(),
});

// Cotizaciones guardadas
export const cotizaciones = sqliteTable("cotizaciones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  createdAt: text("created_at").notNull(),
  items: text("items").notNull(), // JSON array de items
  total: real("total").notNull(),
});

// Historial de búsquedas
export const historialBusquedas = sqliteTable("historial_busquedas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  query: text("query").notNull(),
  resultCount: integer("result_count").notNull(),
  createdAt: text("created_at").notNull(),
});

// Schemas de inserción
export const insertCotizacionSchema = createInsertSchema(cotizaciones).omit({ id: true });
export const insertHistorialSchema = createInsertSchema(historialBusquedas).omit({ id: true });

// Tipos
export type SearchResult = typeof searchResults.$inferSelect;
export type Cotizacion = typeof cotizaciones.$inferSelect;
export type HistorialBusqueda = typeof historialBusquedas.$inferSelect;
export type InsertCotizacion = z.infer<typeof insertCotizacionSchema>;

// Tipo para items dentro de una cotización
export type CotizacionItem = {
  material: string;
  marca: string;
  presentacion: string;
  precio: number;
  vendedor: string;
  cantidad: number;
  subtotal: number;
};

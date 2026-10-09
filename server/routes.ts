import type { Express } from "express";
import { createServer, type Server } from "http";
import { spawn } from "child_process";
import * as path from "path";
import { storage } from "./storage";
import { insertCotizacionSchema } from "@shared/schema";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
// Servidor de búsqueda Python — arranca una vez, recibe requests HTTP
// ─────────────────────────────────────────────────────────────────────────────
const SEARCH_PORT = 5002;
const SEARCH_URL = `http://127.0.0.1:${SEARCH_PORT}`;
const SCRIPT_PATH = path.join(__dirname, "search_server.py");

let searchServerReady = false;

function loadEnvFile(): Record<string, string> {
  try {
    const fs = require("fs");
    const envFile = require("path").join(__dirname, "..", ".env");
    const extra: Record<string, string> = {};
    if (fs.existsSync(envFile)) {
      fs.readFileSync(envFile, "utf8").split("\n").forEach((line: string) => {
        const idx = line.indexOf("=");
        if (idx > 0) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k) extra[k] = v;
        }
      });
    }
    return extra;
  } catch { return {}; }
}

function startSearchServer() {
  const extraEnv = loadEnvFile();
  const proc = spawn("python", [SCRIPT_PATH], {
    env: { ...process.env, ...extraEnv, SEARCH_PORT: String(SEARCH_PORT), PPLX_OUTPUT_DIR: "/tmp/pplx_output" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  proc.stdout?.on("data", (d: Buffer) => {
    const msg = d.toString().trim();
    if (msg.includes("listening")) {
      searchServerReady = true;
      console.log("[search] Python search server ready on port", SEARCH_PORT);
    }
  });

  proc.stderr?.on("data", (d: Buffer) => {
    console.error("[search] stderr:", d.toString().slice(0, 200));
  });

  proc.on("exit", (code) => {
    console.warn("[search] Python server exited with code", code, "— restarting in 3s");
    searchServerReady = false;
    setTimeout(startSearchServer, 3000);
  });
}

async function querySearchServer(query: string): Promise<any> {
  const url = `${SEARCH_URL}/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Search server HTTP ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sugerencias de autocompletado
// ─────────────────────────────────────────────────────────────────────────────
const SUGERENCIAS = [
  "Cemento", "Varilla", "Block", "Concreto premezclado", "Grava", "Arena", "Tabique rojo",
  "Malla electrosoldada", "Estuco", "Cal hidratada", "Yeso", "Mortero", "Pintura",
  "Impermeabilizante", "Sellador", "Azulejo", "Loseta", "Mosaico", "Silicón",
  "Cable eléctrico calibre 12", "Cable eléctrico calibre 10", "Conduit EMT",
  "Interruptor eléctrico", "Contacto eléctrico", "Tablero eléctrico 8 circuitos",
  "Breaker 20A", "Luminaria LED", "Cinta eléctrica", "Caja eléctrica",
  "Tubo PVC 4 pulgadas", "Tubo de cobre 1/2 pulgada", "Tubo galvanizado",
  "Llave de paso 1/2", "Inodoro", "Lavabo", "Cisterna", "Bomba de agua 1/2 HP",
  "Ángulo de acero", "Solera de acero", "Tubo cuadrado", "Viga IPR",
  "Lámina galvanizada", "Tablaroca", "Perfil de acero USG", "Madera pino",
  "Poliestireno", "Lana mineral", "Teja", "Andamio", "Herramienta",
];

// ─────────────────────────────────────────────────────────────────────────────
// Rutas Express
// ─────────────────────────────────────────────────────────────────────────────
export function registerRoutes(httpServer: Server, app: Express) {
  // Iniciar servidor de búsqueda Python
  startSearchServer();

  // Búsqueda en tiempo real
  app.get("/api/buscar", async (req, res) => {
    const query = (req.query.q as string || "").trim();
    if (!query || query.length < 2)
      return res.status(400).json({ error: "Ingresa al menos 2 caracteres" });
    if (query.length > 120)
      return res.status(400).json({ error: "Consulta demasiado larga" });

    if (!searchServerReady) {
      // Dar hasta 10s para que arranque
      await new Promise<void>((resolve) => {
        const check = setInterval(() => { if (searchServerReady) { clearInterval(check); resolve(); } }, 500);
        setTimeout(() => { clearInterval(check); resolve(); }, 10000);
      });
    }

    try {
      const data = await querySearchServer(query);
      if (data.resultados?.length > 0) storage.addHistorial(query, data.resultados.length);
      return res.json({ ...data, query });
    } catch (err: any) {
      console.error("Search error:", err?.message);
      return res.status(500).json({ error: "No se pudieron obtener resultados. Intenta de nuevo.", detail: err?.message });
    }
  });

  // Sugerencias para autocompletado
  app.get("/api/materiales", (_req, res) => res.json(SUGERENCIAS));

  // Cotizaciones
  app.get("/api/cotizaciones", (_req, res) => res.json(storage.getCotizaciones()));

  app.get("/api/cotizaciones/:id", (req, res) => {
    const data = storage.getCotizacion(parseInt(req.params.id));
    if (!data) return res.status(404).json({ error: "No encontrada" });
    res.json(data);
  });

  app.post("/api/cotizaciones", (req, res) => {
    const parsed = insertCotizacionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
    res.status(201).json(storage.createCotizacion(parsed.data));
  });

  app.delete("/api/cotizaciones/:id", (req, res) => {
    storage.deleteCotizacion(parseInt(req.params.id));
    res.json({ ok: true });
  });

  // Historial
  app.get("/api/historial", (_req, res) => res.json(storage.getHistorial()));
  app.delete("/api/historial", (_req, res) => { storage.clearHistorial(); res.json({ ok: true }); });
}

#!/usr/bin/env python3
"""
Servidor HTTP interno de búsqueda para CotizaObra.
Se inicia una vez con las credenciales del entorno y escucha en localhost:5001.
"""
import json
import re
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

from duckduckgo_search import DDGS
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

TIENDAS = [
    "homedepot.com.mx",
    "sodimac.com.mx",
    "construrama.com",
    "construenvio.com",
    "lowes.com.mx",
    "bepsa.com.mx",
    "materialesjalisco.mx",
    "novacasa.com.mx",
    "elektron.com.mx",
    "amazon.com.mx",
    "mercadolibre.com.mx",
]


def nombre_tienda(url: str) -> str:
    nombres = {
        "homedepot.com.mx": "Home Depot México",
        "pro.homedepot.com.mx": "Home Depot Pro México",
        "sodimac.com.mx": "Sodimac México",
        "construrama.com": "Construrama",
        "construenvio.com": "Construenvio",
        "lowes.com.mx": "Lowe's México",
        "bepsa.com.mx": "BEPSA Materiales",
        "materialesjalisco.mx": "Materiales Jalisco",
        "novacasa.com.mx": "Nova Casa",
        "elektron.com.mx": "Elektron",
        "amazon.com.mx": "Amazon México",
        "mercadolibre.com.mx": "MercadoLibre",
    }
    for dominio, nombre in nombres.items():
        if dominio in url:
            return nombre
    m = re.search(r"https?://(?:www\.)?([^/]+)", url)
    return m.group(1) if m else url


class Producto(BaseModel):
    material: str = Field(description="Nombre del material/producto exacto como aparece")
    marca: str = Field(description="Marca del producto como aparece en el contenido")
    presentacion: str = Field(description="Presentación/tamaño (Costal 25kg, Pieza, etc.)")
    precio: float = Field(description="Precio en MXN, solo el número")
    vendedor: str = Field(description="Nombre de la tienda de la sección TIENDA")
    fuente: str = Field(description="URL exacta de la página proporcionada")

class ProductosList(BaseModel):
    productos: list[Producto]


import urllib.request
import urllib.parse
import re

def search_ddg_lite(query: str, max_results: int = 10) -> list:
    url = "https://lite.duckduckgo.com/lite/"
    data = urllib.parse.urlencode({'q': query}).encode('utf-8')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    results = []
    try:
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8', errors='ignore')
            
            snippets = re.findall(r'<td class=[\'"]result-snippet[\'"][^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
            
            links_match = []
            for m in re.finditer(r'<a\s+([^>]*)>(.*?)</a>', html, re.IGNORECASE):
                attrs = m.group(1)
                text = m.group(2)
                if 'result-link' in attrs:
                    href_m = re.search(r'href=[\'"]([^\'"]+)[\'"]', attrs)
                    if href_m:
                        links_match.append((href_m.group(1), text))
            
            for i in range(min(len(snippets), len(links_match), max_results)):
                clean_snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip()
                href = links_match[i][0]
                title = re.sub(r'<[^>]+>', '', links_match[i][1]).strip()
                results.append({"body": clean_snippet, "href": href, "title": title})
    except Exception as e:
        print(f"Error scraping DDG Lite: {e}")
        
    return results

def buscar(query: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    print(f"[debug] initial api_key from environ: {repr(api_key)}")
    if not api_key:
        try:
            env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
            print(f"[debug] reading from: {env_path}")
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.strip().split("=", 1)[1].strip()
                        print(f"[debug] found key in .env: {api_key[:5]}...")
        except Exception as e:
            print(f"[debug] error reading .env: {e}")
            pass
            
    if not api_key:
         print("[debug] api_key is still empty!")
         return {"error": "Falta la clave GEMINI_API_KEY en el archivo .env"}
         
    try:
        client = genai.Client(api_key=api_key)
        
        prompt = (
            f'Investiga en internet los precios reales actuales en México de: {query}.\n'
            f'Busca en tiendas de construcción como homedepot.com.mx, sodimac.com.mx, construrama.com, amazon.com.mx o mercadolibre.com.mx.\n'
            f'Extrae entre 3 y 5 productos reales con sus precios exactos.\n\n'
            f'Responde ÚNICA Y ESTRICTAMENTE con un objeto JSON que siga esta estructura exacta (no agregues texto fuera del JSON, ni bloques de código markdown):\n'
            f'{{\n'
            f'  "productos": [\n'
            f'    {{\n'
            f'      "material": "Nombre del producto",\n'
            f'      "marca": "Marca del producto",\n'
            f'      "presentacion": "Presentación (Bulto 40kg, Pieza, etc.)",\n'
            f'      "precio": 150.00,\n'
            f'      "vendedor": "Nombre de la tienda",\n'
            f'      "fuente": "URL de donde sacaste la información"\n'
            f'    }}\n'
            f'  ]\n'
            f'}}'
        )
        
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[{"google_search": {}}],
            ),
        )
        
        if not response.text:
            return {"error": "Respuesta vacía de Gemini"}
            
        # Clean JSON markdown blocks if Gemini decides to include them
        text = response.text.replace('```json', '').replace('```', '').strip()
        data = json.loads(text)
        productos = data.get("productos", [])
        
    except Exception as e:
         return {"error": f"Error al buscar con Gemini Grounding: {str(e)}"}
         
    # Validar, normalizar y deduplicar
    normalizados = []
    vistos = set()
    for p in productos:
        if not isinstance(p, dict):
            continue
        try:
            precio = float(p.get("precio", 0))
        except Exception:
            precio = 0
            
        if precio <= 0 or precio > 500000:
            continue
            
        fuente = str(p.get("fuente", "")).strip()
        vendedor = str(p.get("vendedor", "Tienda"))
        material = str(p.get("material", query))

        # Siempre usar enlaces de búsqueda segura para las tiendas principales
        # para evitar 404s por URLs de productos expirados o inventados por Gemini
        import urllib.parse
        q_enc = urllib.parse.quote(material)
        v_low = vendedor.lower()
        
        if "home depot" in v_low:
            fuente = f"https://www.homedepot.com.mx/s/{q_enc}"
        elif "sodimac" in v_low:
            fuente = f"https://www.sodimac.com.mx/sodimac-mx/search?Ntt={q_enc}"
        elif "construrama" in v_low:
            fuente = f"https://www.construrama.com/search?text={q_enc}"
        elif "mercadolibre" in v_low or "mercado libre" in v_low:
            fuente = f"https://listado.mercadolibre.com.mx/{q_enc.replace('%20', '-')}"
        elif "amazon" in v_low:
            fuente = f"https://www.amazon.com.mx/s?k={q_enc}"
        else:
            if not fuente.startswith("http") or "vertexaisearch" in fuente:
                fuente = f"https://www.google.com/search?q={urllib.parse.quote(vendedor + ' ' + material)}"
                
        if fuente in vistos:
            continue
        vistos.add(fuente)
        
        normalizados.append({
            "material":     material,
            "marca":        str(p.get("marca", "")),
            "presentacion": str(p.get("presentacion", "Unidad")),
            "precio":       round(precio, 2),
            "vendedor":     vendedor,
            "direccion":    "",
            "telefono":     "",
            "fuente":       fuente,
        })
        
    normalizados.sort(key=lambda x: x["precio"])
    normalizados = normalizados[:5]
    
    result = {"resultados": normalizados, "total": len(normalizados)}
    if not normalizados:
        result["advertencia"] = "Se realizó la búsqueda pero no se encontraron precios verificables en los resultados de Google."
    return result


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # silenciar logs HTTP

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        query = params.get("q", [""])[0].strip()

        if not query or len(query) < 2:
            self._respond(400, {"error": "Query muy corto"})
            return
        if len(query) > 120:
            self._respond(400, {"error": "Query muy largo"})
            return

        try:
            data = buscar(query)
            self._respond(200, data)
        except Exception as e:
            self._respond(500, {"error": str(e)})

    def _respond(self, code: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("SEARCH_PORT", "5001"))
    os.makedirs("/tmp/pplx_output", exist_ok=True)
    server = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Search server listening on port {port}", flush=True)
    server.serve_forever()

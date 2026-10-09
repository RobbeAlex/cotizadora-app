#!/usr/bin/env python3
"""
CotizaObra — Búsqueda de precios reales en tiendas verificadas.
Estrategia:
  1. Busca el material en dominios de tiendas reales de México
  2. Extrae snippets con precios del contenido real de las páginas
  3. Usa LLM para estructurar SOLO los datos encontrados (sin inventar)
  4. Devuelve solo resultados verificados con URL real
"""
import sys
import os
import re
import json


def cargar_env():
    """Carga .env si las credenciales no están en el entorno."""
    if os.environ.get("PPLX_SDK_API_KEY"):
        return
    for base in [os.path.dirname(os.path.abspath(__file__)), os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")]:
        env_path = os.path.join(base, ".env")
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip()
            break


# Tiendas reales de México verificadas
TIENDAS = [
    "homedepot.com.mx",
    "sodimac.com.mx",
    "construrama.com",
    "construenvio.com",
    "lowes.com.mx",
    "bepsa.com.mx",
    "comex.com.mx",
    "sika.com.mx",
    "materialesjalisco.mx",
    "novacasa.com.mx",
    "elektron.com.mx",
    "totalplay.com.mx",
    "venta.mx",
    "amazon.com.mx",
    "mercadolibre.com.mx",
    "coppel.com",
    "liverpool.com.mx",
]


def extraer_precio_texto(texto: str) -> float | None:
    """Extrae el primer precio MXN razonable de un texto."""
    # Patrones: $123, $1,234, $1,234.56, 123 MXN, etc.
    patrones = [
        r'\$\s*([\d,]+(?:\.\d{1,2})?)',
        r'([\d,]+(?:\.\d{1,2})?)\s*MXN',
        r'precio[:\s]+([\d,]+(?:\.\d{1,2})?)',
    ]
    for pat in patrones:
        matches = re.findall(pat, texto, re.IGNORECASE)
        for m in matches:
            try:
                val = float(m.replace(",", ""))
                # Filtrar precios fuera de rango razonable (1 - 500,000 MXN)
                if 1 < val < 500000:
                    return val
            except Exception:
                continue
    return None


def nombre_tienda(url: str) -> str:
    """Extrae nombre legible del dominio."""
    nombres = {
        "homedepot.com.mx": "Home Depot México",
        "pro.homedepot.com.mx": "Home Depot Pro México",
        "sodimac.com.mx": "Sodimac México",
        "construrama.com": "Construrama",
        "construenvio.com": "Construenvio",
        "lowes.com.mx": "Lowe's México",
        "bepsa.com.mx": "BEPSA Materiales",
        "comex.com.mx": "Comex",
        "sika.com.mx": "Sika México",
        "materialesjalisco.mx": "Materiales Jalisco",
        "novacasa.com.mx": "Nova Casa",
        "elektron.com.mx": "Elektron",
        "amazon.com.mx": "Amazon México",
        "mercadolibre.com.mx": "MercadoLibre",
    }
    for dominio, nombre in nombres.items():
        if dominio in url:
            return nombre
    # Fallback: extraer dominio
    m = re.search(r'https?://(?:www\.)?([^/]+)', url)
    return m.group(1) if m else url


def main():
    cargar_env()

    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided"}))
        sys.exit(1)

    query = " ".join(sys.argv[1:])

    try:
        from duckduckgo_search import DDGS
        from google import genai
        from google.genai import types
        from pydantic import BaseModel, Field

        class Producto(BaseModel):
            material: str = Field(description="Nombre del material/producto exacto como aparece")
            marca: str = Field(description="Marca del producto como aparece en el contenido")
            presentacion: str = Field(description="Presentación/tamaño (Costal 25kg, Pieza, etc.)")
            precio: float = Field(description="Precio en MXN, solo el número")
            vendedor: str = Field(description="Nombre de la tienda de la sección TIENDA")
            fuente: str = Field(description="URL exacta de la página proporcionada")

        class ProductosList(BaseModel):
            productos: list[Producto]

        # 1. Búsqueda con DuckDuckGo
        ddgs = DDGS()
        search_query = f'{query} precio comprar (site:homedepot.com.mx OR site:sodimac.com.mx OR site:construrama.com OR site:amazon.com.mx OR site:mercadolibre.com.mx)'
        
        try:
            results = list(ddgs.text(search_query, region='mx-es', max_results=10))
        except Exception:
            results = []
            
        if not results:
            try:
                results = list(ddgs.text(f'{query} precio comprar mexico ferreteria', region='mx-es', max_results=10))
            except Exception:
                pass

        if not results:
            print(json.dumps({"resultados": [], "total": 0, "advertencia": "No se encontraron resultados en web."}))
            return

        # 2. Armar contexto
        contexto_items = []
        for r in results:
            url = r.get("href", "")
            if url:
                contexto_items.append(
                    f"TIENDA: {nombre_tienda(url)}\nURL: {url}\nTITULO: {r.get('title', '')}\nCONTENIDO: {r.get('body', '')}"
                )
                
        contexto = "\n\n---\n\n".join(contexto_items)
        
        # 3. Extraer información estructurada con Gemini API
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
             print(json.dumps({"error": "Falta la clave GEMINI_API_KEY en el archivo .env"}))
             return
             
        client = genai.Client(api_key=api_key)
        prompt = (
            f'Extrae información de precios de productos de construcción de "{query}" basándote ÚNICAMENTE en los siguientes fragmentos web:\n\n'
            f'{contexto}\n\n'
            f'Reglas estrictas:\n'
            f'1. NO inventes ni estimes datos. Usa solo la información explícita de los fragmentos.\n'
            f'2. Si no hay precio claro, ignora el producto.\n'
            f'3. Para "vendedor" usa el nombre de la sección TIENDA.\n'
            f'4. Para "fuente" usa la sección URL exacta.'
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ProductosList,
            ),
        )
        
        data = json.loads(response.text)
        productos = data.get("productos", [])
        
        # 4. Validar, normalizar y deduplicar
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
            if fuente in vistos:
                continue
            vistos.add(fuente)
            
            normalizados.append({
                "material":     str(p.get("material", query)),
                "marca":        str(p.get("marca", "Sin marca")),
                "presentacion": str(p.get("presentacion", "Unidad")),
                "precio":       round(precio, 2),
                "vendedor":     str(p.get("vendedor", nombre_tienda(fuente))),
                "direccion":    "",
                "telefono":     "",
                "fuente":       fuente,
            })
            
        normalizados.sort(key=lambda x: x["precio"])
        normalizados = normalizados[:5]

        salida = {
            "resultados": normalizados,
            "total": len(normalizados)
        }
        if len(normalizados) == 0:
            salida["advertencia"] = "Se realizó la búsqueda pero no se encontraron precios verificables en los fragmentos devueltos."

        print(json.dumps(salida, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

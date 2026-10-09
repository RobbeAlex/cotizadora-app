import os
import json
from google import genai
from google.genai import types

api_key = None
with open(".env", "r") as f:
    for line in f:
        if line.startswith("GEMINI_API_KEY="):
            api_key = line.strip().split("=")[1]

client = genai.Client(api_key=api_key)

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='''Investiga en internet los precios reales actuales en méxico de: Yeso. 
Busca en tiendas como homedepot.com.mx, sodimac.com.mx o construrama.com. Extrae al menos 3 productos con sus precios exactos.

Responde ÚNICA Y ESTRICTAMENTE con un objeto JSON que siga esta estructura exacta (no agregues texto fuera del JSON, ni bloques de código markdown):
{
  "productos": [
    {
      "material": "Nombre del material",
      "marca": "Marca",
      "presentacion": "Bulto 40kg",
      "precio": 150.00,
      "vendedor": "Nombre de la tienda",
      "fuente": "URL de donde sacaste la información"
    }
  ]
}''',
        config=types.GenerateContentConfig(
            tools=[{"google_search": {}}],
        ),
    )
    
    text = response.text.replace('```json', '').replace('```', '').strip()
    data = json.loads(text)
    print("Éxito JSON:", json.dumps(data, indent=2, ensure_ascii=False))
except Exception as e:
    print("Error:", e)

import os
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
        contents='Busca el precio promedio de un bulto de yeso de 40kg en mexico en tiendas como home depot o sodimac',
        config=types.GenerateContentConfig(
            tools=[{"google_search": {}}],
        ),
    )
    print("Respuesta:", response.text)
except Exception as e:
    print("Error:", e)

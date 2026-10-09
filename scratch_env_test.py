import os

api_key = None
try:
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    print(f"Path: {env_path}")
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                api_key = line.strip().split("=", 1)[1].strip()
except Exception as e:
    print("Error:", e)

print("Key:", api_key)

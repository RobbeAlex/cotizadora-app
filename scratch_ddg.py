from duckduckgo_search import DDGS
import json

ddgs = DDGS()
query = "Arena"

q1 = f'{query} precio comprar (site:homedepot.com.mx OR site:sodimac.com.mx)'
try:
    print("Q1:", q1)
    res1 = list(ddgs.text(q1, region='mx-es', max_results=10))
    print("Res1 len:", len(res1))
except Exception as e:
    print("Res1 error:", e)

q2 = f'{query} precio comprar mexico ferreteria'
try:
    print("Q2:", q2)
    res2 = list(ddgs.text(q2, region='mx-es', max_results=10))
    print("Res2 len:", len(res2))
except Exception as e:
    print("Res2 error:", e)

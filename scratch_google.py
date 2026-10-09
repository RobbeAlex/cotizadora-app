from googlesearch import search

results = list(search("Arena precio comprar mexico (site:homedepot.com.mx OR site:sodimac.com.mx)", num_results=5, lang="es", advanced=True))
for r in results:
    print(r.title)
    print(r.url)
    print(r.description)
    print("---")

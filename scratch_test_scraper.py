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
            links_match = re.findall(r'<a[^>]+class=[\'"]result-link[\'"][^>]+href=[\'"]([^\'"]+)[\'"][^>]*>(.*?)</a>', html, re.IGNORECASE)
            
            print(f"Len snippets: {len(snippets)}, Len links: {len(links_match)}")
            for i in range(min(len(snippets), len(links_match), max_results)):
                clean_snippet = re.sub(r'<[^>]+>', '', snippets[i]).strip()
                href = links_match[i][0]
                title = re.sub(r'<[^>]+>', '', links_match[i][1]).strip()
                results.append({"body": clean_snippet, "href": href, "title": title})
    except Exception as e:
        print(f"Error scraping DDG Lite: {e}")
        
    return results

query = "Concreto"
search_query = f'{query} precio comprar (site:homedepot.com.mx OR site:sodimac.com.mx OR site:construrama.com OR site:amazon.com.mx OR site:mercadolibre.com.mx)'
res1 = search_ddg_lite(search_query)
print("Res1:", len(res1))

res2 = search_ddg_lite(f'{query} precio comprar mexico ferreteria')
print("Res2:", len(res2))

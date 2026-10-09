import urllib.request
import urllib.parse
import re

def search_ddg_lite(query):
    url = "https://lite.duckduckgo.com/lite/"
    data = urllib.parse.urlencode({'q': query}).encode('utf-8')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
            # Lite version has results inside <td class='result-snippet'>
            snippets = re.findall(r'<td class=[\'"]result-snippet[\'"][^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
            
            # Clean HTML tags
            clean_snippets = [re.sub(r'<[^>]+>', '', s).strip() for s in snippets]
            return clean_snippets
    except Exception as e:
        print("Error:", e)
        return []

print(search_ddg_lite("Arena precio comprar mexico ferreteria"))
